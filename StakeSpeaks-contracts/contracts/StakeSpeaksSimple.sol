// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakeSpeaksSimple
 * @dev Simplified version of StakeSpeaks for hackathon demo
 */
contract StakeSpeaksSimple is ReentrancyGuard, Ownable {
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

    // Events
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed speaker,
        string topic,
        uint256 baseStake
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
        uint256 amount,
        string message
    );

    event SessionCompleted(
        uint256 indexed sessionId,
        address indexed speaker,
        uint256 totalStaked,
        uint256 totalSuperchats
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
        require(_baseStake > 0, "Base stake must be greater than 0");
        require(
            _maxParticipants > 0,
            "Max participants must be greater than 0"
        );
        require(
            _startTime > block.timestamp,
            "Start time must be in the future"
        );
        require(_duration > 0, "Duration must be greater than 0");

        uint256 sessionId = nextSessionId++;
        sessions[sessionId] = Session({
            sessionId: sessionId,
            speaker: msg.sender,
            topic: _topic,
            baseStake: _baseStake,
            maxParticipants: _maxParticipants,
            startTime: _startTime,
            duration: _duration,
            isActive: true,
            isCompleted: false,
            totalStaked: 0,
            totalSuperchats: 0,
            participantCount: 0
        });

        speakerSessions[msg.sender].push(sessionId);

        emit SessionCreated(sessionId, msg.sender, _topic, _baseStake);

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
        require(session.isActive, "Session not active");
        require(!session.isCompleted, "Session already completed");
        require(
            block.timestamp >= session.startTime,
            "Session not started yet"
        );
        require(
            block.timestamp < session.startTime + session.duration,
            "Session ended"
        );
        require(
            session.participantCount < session.maxParticipants,
            "Session full"
        );
        require(_stakeAmount >= session.baseStake, "Stake amount too low");

        // Transfer KDA tokens from participant
        require(
            kdaToken.transferFrom(msg.sender, address(this), _stakeAmount),
            "KDA transfer failed"
        );

        session.totalStaked += _stakeAmount;
        session.participantCount++;
        participantSessions[msg.sender].push(_sessionId);

        emit SessionJoined(_sessionId, msg.sender, _stakeAmount);
    }

    /**
     * @dev Send a superchat with PYUSD
     */
    function sendSuperchat(
        uint256 _sessionId,
        address _recipient,
        uint256 _amount,
        string memory _message
    ) external nonReentrant {
        Session storage session = sessions[_sessionId];
        require(session.isActive, "Session not active");
        require(!session.isCompleted, "Session already completed");
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");

        // Transfer PYUSD from sender
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );

        session.totalSuperchats += _amount;

        emit SuperchatSent(
            _sessionId,
            msg.sender,
            _recipient,
            _amount,
            _message
        );
    }

    /**
     * @dev Complete a session
     */
    function completeSession(uint256 _sessionId) external {
        Session storage session = sessions[_sessionId];
        require(session.isActive, "Session not active");
        require(!session.isCompleted, "Session already completed");
        require(
            msg.sender == session.speaker,
            "Only speaker can complete session"
        );
        require(
            block.timestamp >= session.startTime + session.duration,
            "Session not ended yet"
        );

        session.isCompleted = true;
        session.isActive = false;

        emit SessionCompleted(
            _sessionId,
            session.speaker,
            session.totalStaked,
            session.totalSuperchats
        );
    }

    /**
     * @dev Get session details
     */
    function getSession(
        uint256 _sessionId
    ) external view returns (Session memory) {
        return sessions[_sessionId];
    }

    /**
     * @dev Get speaker's sessions
     */
    function getSpeakerSessions(
        address _speaker
    ) external view returns (uint256[] memory) {
        return speakerSessions[_speaker];
    }

    /**
     * @dev Get participant's sessions
     */
    function getParticipantSessions(
        address _participant
    ) external view returns (uint256[] memory) {
        return participantSessions[_participant];
    }

    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 kdaBalance = kdaToken.balanceOf(address(this));
        uint256 pyusdBalance = pyusdToken.balanceOf(address(this));

        if (kdaBalance > 0) {
            kdaToken.transfer(owner(), kdaBalance);
        }

        if (pyusdBalance > 0) {
            pyusdToken.transfer(owner(), pyusdBalance);
        }
    }
}
