// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SessionPool
 * @dev Manages discussion sessions with KDA staking and PYUSD superchats
 */
contract SessionPool is ReentrancyGuard, Ownable {
    struct Session {
        uint256 sessionId;
        address speaker;
        string topic;
        uint256 baseStake;
        uint256 maxParticipants;
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool isCompleted;
        uint256 totalStaked;
        uint256 totalSuperchats;
        mapping(address => uint256) participantStakes;
        mapping(address => uint256) superchatContributions;
        address[] participants;
    }

    struct SessionSummary {
        uint256 sessionId;
        address speaker;
        string topic;
        uint256 baseStake;
        uint256 maxParticipants;
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool isCompleted;
        uint256 totalStaked;
        uint256 totalSuperchats;
        uint256 participantCount;
    }

    // State variables
    IERC20 public kdaToken;
    IERC20 public pyusdToken;

    uint256 public nextSessionId = 1;
    mapping(uint256 => Session) public sessions;
    mapping(address => uint256[]) public speakerSessions;
    mapping(address => uint256[]) public participantSessions;

    // Platform fees (in basis points, 100 = 1%)
    uint256 public platformFeeBps = 200; // 2%
    uint256 public superchatFeeBps = 500; // 5%

    // Yield distribution
    uint256 public yieldToParticipantsBps = 3000; // 30%
    uint256 public yieldToPoolBps = 7000; // 70%

    // Events
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed speaker,
        string topic,
        uint256 baseStake,
        uint256 maxParticipants,
        uint256 startTime
    );

    event SessionJoined(
        uint256 indexed sessionId,
        address indexed participant,
        uint256 stakeAmount
    );

    event SuperchatSent(
        uint256 indexed sessionId,
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );

    event SessionCompleted(
        uint256 indexed sessionId,
        uint256 totalStaked,
        uint256 totalSuperchats,
        uint256 yieldGenerated
    );

    event RewardsDistributed(
        uint256 indexed sessionId,
        address indexed participant,
        uint256 stakeReturn,
        uint256 yieldShare,
        uint256 superchatShare
    );

    constructor(address _kdaToken, address _pyusdToken) Ownable(msg.sender) {
        kdaToken = IERC20(_kdaToken);
        pyusdToken = IERC20(_pyusdToken);
    }

    /**
     * @dev Create a new discussion session
     */
    function createSession(
        string memory _topic,
        uint256 _baseStake,
        uint256 _maxParticipants,
        uint256 _startTime,
        uint256 _duration
    ) external returns (uint256) {
        require(_baseStake > 0, "Base stake must be positive");
        require(_maxParticipants > 0, "Must allow at least one participant");
        require(
            _startTime >= block.timestamp,
            "Start time must be now or in the future"
        );
        require(_duration > 0, "Duration must be positive");

        uint256 sessionId = nextSessionId++;
        Session storage session = sessions[sessionId];

        session.sessionId = sessionId;
        session.speaker = msg.sender;
        session.topic = _topic;
        session.baseStake = _baseStake;
        session.maxParticipants = _maxParticipants;
        session.startTime = _startTime;
        session.duration = _duration;
        session.isActive = false;
        session.isCompleted = false;
        session.totalStaked = 0;
        session.totalSuperchats = 0;

        speakerSessions[msg.sender].push(sessionId);

        emit SessionCreated(
            sessionId,
            msg.sender,
            _topic,
            _baseStake,
            _maxParticipants,
            _startTime
        );

        return sessionId;
    }

    /**
     * @dev Join a session by staking KDA tokens
     */
    function joinSession(
        uint256 _sessionId,
        uint256 _stakeAmount
    ) external nonReentrant {
        Session storage session = sessions[_sessionId];
        require(session.sessionId != 0, "Session does not exist");
        require(!session.isCompleted, "Session already completed");
        require(
            block.timestamp < session.startTime,
            "Session has already started"
        );
        require(
            session.participants.length < session.maxParticipants,
            "Session is full"
        );
        require(
            _stakeAmount >= session.baseStake,
            "Stake amount below minimum"
        );
        require(
            session.participantStakes[msg.sender] == 0,
            "Already joined this session"
        );

        // Transfer KDA tokens from participant
        require(
            kdaToken.transferFrom(msg.sender, address(this), _stakeAmount),
            "KDA transfer failed"
        );

        // Update session state
        session.participantStakes[msg.sender] = _stakeAmount;
        session.totalStaked += _stakeAmount;
        session.participants.push(msg.sender);

        participantSessions[msg.sender].push(_sessionId);

        emit SessionJoined(_sessionId, msg.sender, _stakeAmount);
    }

    /**
     * @dev Start a session (only by speaker)
     */
    function startSession(uint256 _sessionId) external {
        Session storage session = sessions[_sessionId];
        require(
            session.speaker == msg.sender,
            "Only speaker can start session"
        );
        require(session.sessionId != 0, "Session does not exist");
        require(!session.isActive, "Session already active");
        require(!session.isCompleted, "Session already completed");
        require(
            block.timestamp >= session.startTime,
            "Session start time not reached"
        );

        session.isActive = true;
    }

    /**
     * @dev Send superchat during active session
     */
    function sendSuperchat(
        uint256 _sessionId,
        address _recipient,
        uint256 _amount
    ) external nonReentrant {
        Session storage session = sessions[_sessionId];
        require(session.isActive, "Session not active");
        require(session.sessionId != 0, "Session does not exist");
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");

        // Transfer PYUSD tokens
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );

        // Calculate distribution: 80% to speaker, 20% to listeners pool
        uint256 platformFee = (_amount * superchatFeeBps) / 10000;
        uint256 speakerAmount = (_amount * 8000) / 10000; // 80% to speaker
        uint256 listenerPoolAmount = (_amount * 2000) / 10000; // 20% to listeners pool
        uint256 remainingAmount = _amount -
            platformFee -
            speakerAmount -
            listenerPoolAmount;

        // Update session state
        session.superchatContributions[msg.sender] += _amount;
        session.totalSuperchats += _amount;

        // Transfer tokens
        if (speakerAmount > 0) {
            require(
                pyusdToken.transfer(_recipient, speakerAmount),
                "Speaker transfer failed"
            );
        }

        // Keep listener pool amount in contract for distribution
        // (already transferred to contract, no need to transfer again)

        emit SuperchatSent(_sessionId, msg.sender, _recipient, _amount);
    }

    /**
     * @dev Complete a session and distribute rewards
     */
    function completeSession(uint256 _sessionId) external {
        Session storage session = sessions[_sessionId];
        require(
            session.speaker == msg.sender,
            "Only speaker can complete session"
        );
        require(session.isActive, "Session not active");
        require(
            block.timestamp >= session.startTime + session.duration,
            "Session duration not reached"
        );

        session.isActive = false;
        session.isCompleted = true;

        // Calculate yield (simplified - in real implementation, this would come from DeFi protocols)
        uint256 yieldGenerated = (session.totalStaked * 5) / 100; // 5% yield

        emit SessionCompleted(
            _sessionId,
            session.totalStaked,
            session.totalSuperchats,
            yieldGenerated
        );

        // Distribute rewards to participants
        _distributeRewards(_sessionId, yieldGenerated);
    }

    /**
     * @dev Internal function to distribute rewards to participants
     */
    function _distributeRewards(
        uint256 _sessionId,
        uint256 _yieldGenerated
    ) internal {
        Session storage session = sessions[_sessionId];

        if (session.participants.length == 0) return;

        uint256 totalStake = session.totalStaked;
        uint256 yieldToParticipants = (_yieldGenerated *
            yieldToParticipantsBps) / 10000;
        uint256 yieldToPool = _yieldGenerated - yieldToParticipants;

        // Distribute to each participant
        for (uint256 i = 0; i < session.participants.length; i++) {
            address participant = session.participants[i];
            uint256 participantStake = session.participantStakes[participant];

            // Calculate proportional shares
            uint256 stakeReturn = participantStake;
            uint256 yieldShare = (yieldToParticipants * participantStake) /
                totalStake;
            uint256 superchatShare = (session.totalSuperchats *
                participantStake) / totalStake;

            // Transfer KDA rewards (stake + yield)
            uint256 kdaReward = stakeReturn + yieldShare;
            if (kdaReward > 0) {
                require(
                    kdaToken.transfer(participant, kdaReward),
                    "KDA reward transfer failed"
                );
            }

            // Transfer PYUSD superchat share
            if (superchatShare > 0) {
                require(
                    pyusdToken.transfer(participant, superchatShare),
                    "PYUSD superchat transfer failed"
                );
            }

            emit RewardsDistributed(
                _sessionId,
                participant,
                stakeReturn,
                yieldShare,
                superchatShare
            );
        }

        // Keep yield for pool compounding
        if (yieldToPool > 0) {
            // In real implementation, this would be sent to YieldManager contract
            require(
                kdaToken.transfer(address(this), yieldToPool),
                "Pool yield transfer failed"
            );
        }
    }

    /**
     * @dev Get session summary
     */
    function getSessionSummary(
        uint256 _sessionId
    ) external view returns (SessionSummary memory) {
        Session storage session = sessions[_sessionId];
        return
            SessionSummary({
                sessionId: session.sessionId,
                speaker: session.speaker,
                topic: session.topic,
                baseStake: session.baseStake,
                maxParticipants: session.maxParticipants,
                startTime: session.startTime,
                duration: session.duration,
                isActive: session.isActive,
                isCompleted: session.isCompleted,
                totalStaked: session.totalStaked,
                totalSuperchats: session.totalSuperchats,
                participantCount: session.participants.length
            });
    }

    /**
     * @dev Get participant stake for a session
     */
    function getParticipantStake(
        uint256 _sessionId,
        address _participant
    ) external view returns (uint256) {
        return sessions[_sessionId].participantStakes[_participant];
    }

    /**
     * @dev Get superchat contribution for a session
     */
    function getSuperchatContribution(
        uint256 _sessionId,
        address _participant
    ) external view returns (uint256) {
        return sessions[_sessionId].superchatContributions[_participant];
    }

    /**
     * @dev Get session participants
     */
    function getSessionParticipants(
        uint256 _sessionId
    ) external view returns (address[] memory) {
        return sessions[_sessionId].participants;
    }

    /**
     * @dev Get speaker sessions
     */
    function getSpeakerSessions(
        address _speaker
    ) external view returns (uint256[] memory) {
        return speakerSessions[_speaker];
    }

    /**
     * @dev Get participant sessions
     */
    function getParticipantSessions(
        address _participant
    ) external view returns (uint256[] memory) {
        return participantSessions[_participant];
    }

    /**
     * @dev Update platform fees (only owner)
     */
    function updatePlatformFees(
        uint256 _platformFeeBps,
        uint256 _superchatFeeBps
    ) external onlyOwner {
        require(_platformFeeBps <= 1000, "Platform fee too high"); // Max 10%
        require(_superchatFeeBps <= 1000, "Superchat fee too high"); // Max 10%

        platformFeeBps = _platformFeeBps;
        superchatFeeBps = _superchatFeeBps;
    }

    /**
     * @dev Update yield distribution (only owner)
     */
    function updateYieldDistribution(
        uint256 _yieldToParticipantsBps,
        uint256 _yieldToPoolBps
    ) external onlyOwner {
        require(
            _yieldToParticipantsBps + _yieldToPoolBps == 10000,
            "Yield distribution must equal 100%"
        );

        yieldToParticipantsBps = _yieldToParticipantsBps;
        yieldToPoolBps = _yieldToPoolBps;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(
        address _token,
        uint256 _amount
    ) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }
}
