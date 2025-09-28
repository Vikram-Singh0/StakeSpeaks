// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SessionPool.sol";
import "./YieldManager.sol";
import "./PYUSDPayment.sol";
import "./ReputationTracker.sol";
import "./Filecoinstorage.sol";
import "./LiquidityPool.sol";

/**
 * @title TalkStake
 * @dev Main integration contract for the TalkStake platform
 * Combines staking pools, yield management, PYUSD payments, and reputation tracking
 */
contract TalkStake is ReentrancyGuard, Ownable {
    // Contract references
    SessionPool public sessionPool;
    YieldManager public yieldManager;
    PYUSDPaymentHandler public pyusdPayment;
    ReputationTracker public reputationTracker;
    FilecoinStorage public filecoinStorage;
    LiquidityPool public liquidityPool;

    // Token addresses
    IERC20 public kdaToken;
    IERC20 public pyusdToken;

    // Platform configuration
    uint256 public platformFeeBps = 200; // 2%
    uint256 public superchatFeeBps = 500; // 5%
    uint256 public yieldToParticipantsBps = 3000; // 30%
    uint256 public yieldToPoolBps = 7000; // 70%

    // Events
    event PlatformInitialized(
        address sessionPool,
        address yieldManager,
        address pyusdPayment,
        address reputationTracker,
        address filecoinStorage
    );

    event SessionCreatedWithReputation(
        uint256 indexed sessionId,
        address indexed speaker,
        string topic,
        uint256 baseStake,
        uint256 adjustedStake
    );

    event SuperchatProcessed(
        uint256 indexed sessionId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 speakerAmount,
        uint256 poolAmount
    );

    event SessionCompletedWithRewards(
        uint256 indexed sessionId,
        address indexed speaker,
        uint256 totalStaked,
        uint256 totalSuperchats,
        uint256 yieldGenerated,
        string filecoinHash
    );

    constructor(
        address _kdaToken,
        address _pyusdToken,
        address _sessionPool,
        address _yieldManager,
        address _pyusdPayment,
        address _reputationTracker,
        address _filecoinStorage,
        address _liquidityPool
    ) Ownable(msg.sender) {
        kdaToken = IERC20(_kdaToken);
        pyusdToken = IERC20(_pyusdToken);
        sessionPool = SessionPool(_sessionPool);
        yieldManager = YieldManager(_yieldManager);
        pyusdPayment = PYUSDPaymentHandler(_pyusdPayment);
        reputationTracker = ReputationTracker(_reputationTracker);
        filecoinStorage = FilecoinStorage(_filecoinStorage);
        liquidityPool = LiquidityPool(_liquidityPool);

        emit PlatformInitialized(
            _sessionPool,
            _yieldManager,
            _pyusdPayment,
            _reputationTracker,
            _filecoinStorage
        );
    }

    /**
     * @dev Create a session with reputation-based dynamic pricing
     */
    function createSessionWithReputation(
        string memory _topic,
        uint256 _baseStake,
        uint256 _maxParticipants,
        uint256 _startTime,
        uint256 _duration
    ) external returns (uint256) {
        // Register speaker if not already registered
        if (!reputationTracker.isSpeakerRegistered(msg.sender)) {
            reputationTracker.registerSpeaker(msg.sender);
        }

        // Calculate dynamic stake based on reputation
        uint256 adjustedStake = reputationTracker.calculateRequiredStake(
            msg.sender,
            _baseStake
        );

        // Create session in SessionPool
        uint256 sessionId = sessionPool.createSession(
            _topic,
            adjustedStake,
            _maxParticipants,
            _startTime,
            _duration
        );

        emit SessionCreatedWithReputation(
            sessionId,
            msg.sender,
            _topic,
            _baseStake,
            adjustedStake
        );

        return sessionId;
    }

    /**
     * @dev Join a session (delegates to SessionPool)
     */
    function joinSession(
        uint256 _sessionId,
        uint256 _stakeAmount
    ) external nonReentrant {
        sessionPool.joinSession(_sessionId, _stakeAmount);
    }

    /**
     * @dev Start a session (delegates to SessionPool)
     */
    function startSession(uint256 _sessionId) external {
        sessionPool.startSession(_sessionId);
    }

    /**
     * @dev Send superchat with integrated processing
     */
    function sendSuperchat(
        uint256 _sessionId,
        address _recipient,
        uint256 _amount,
        string memory _message
    ) external nonReentrant {
        // Send superchat through SessionPool
        sessionPool.sendSuperchat(_sessionId, _recipient, _amount);

        // Also create superchat record in PYUSDPayment for tracking
        uint256 superchatId = pyusdPayment.sendSuperchat(
            _recipient,
            _amount,
            _message
        );

        // Process the superchat immediately
        pyusdPayment.processSuperchat(superchatId);

        emit SuperchatProcessed(
            _sessionId,
            msg.sender,
            _recipient,
            _amount,
            (_amount * 8000) / 10000, // 80% to speaker
            (_amount * 1500) / 10000 // 15% to pool
        );
    }

    /**
     * @dev Complete session with full reward distribution and Filecoin storage
     */
    function completeSessionWithStorage(
        uint256 _sessionId,
        string memory _sessionMetadata,
        string memory _audioHash,
        string memory _chatLogsHash
    ) external {
        // Complete session in SessionPool
        sessionPool.completeSession(_sessionId);

        // Get session data for reputation update
        SessionPool.SessionSummary memory sessionData = sessionPool
            .getSessionSummary(_sessionId);

        // Update speaker metrics in reputation tracker
        reputationTracker.updateSpeakerMetrics(
            sessionData.speaker,
            sessionData.totalStaked,
            sessionData.totalSuperchats
        );

        // Store session data on Filecoin
        string memory filecoinHash = filecoinStorage.storeSessionData(
            _sessionId,
            _sessionMetadata,
            _audioHash,
            _chatLogsHash
        );

        // Calculate yield (simplified - in production this would come from DeFi protocols)
        uint256 yieldGenerated = (sessionData.totalStaked * 5) / 100; // 5% yield

        emit SessionCompletedWithRewards(
            _sessionId,
            sessionData.speaker,
            sessionData.totalStaked,
            sessionData.totalSuperchats,
            yieldGenerated,
            filecoinHash
        );
    }

    /**
     * @dev Rate a completed session
     */
    function rateSession(
        uint256 _sessionId,
        address _speaker,
        uint256 _rating
    ) external {
        reputationTracker.rateSession(_sessionId, _speaker, _rating);
    }

    /**
     * @dev Deposit KDA into yield farming pool
     */
    function depositToYieldPool(
        uint256 _poolId,
        uint256 _amount
    ) external nonReentrant {
        yieldManager.deposit(_poolId, _amount);
    }

    /**
     * @dev Claim yield from farming pool
     */
    function claimYield(uint256 _poolId) external nonReentrant {
        yieldManager.claimYield(_poolId);
    }

    /**
     * @dev Withdraw from yield farming pool
     */
    function withdrawFromYieldPool(
        uint256 _poolId,
        uint256 _amount
    ) external nonReentrant {
        yieldManager.withdraw(_poolId, _amount);
    }

    /**
     * @dev Get comprehensive session data
     */
    function getSessionData(
        uint256 _sessionId
    )
        external
        view
        returns (
            SessionPool.SessionSummary memory sessionSummary,
            ReputationTracker.ReputationMetrics memory speakerMetrics,
            string memory filecoinHash
        )
    {
        sessionSummary = sessionPool.getSessionSummary(_sessionId);
        speakerMetrics = reputationTracker.getSpeakerMetrics(
            sessionSummary.speaker
        );
        filecoinHash = filecoinStorage.getSessionHash(_sessionId);
    }

    /**
     * @dev Get user's comprehensive platform data
     */
    function getUserData(
        address _user
    )
        external
        view
        returns (
            uint256[] memory speakerSessions,
            uint256[] memory participantSessions,
            uint256[] memory superchats,
            uint256[] memory subscriptions,
            ReputationTracker.ReputationMetrics memory reputation
        )
    {
        speakerSessions = sessionPool.getSpeakerSessions(_user);
        participantSessions = sessionPool.getParticipantSessions(_user);
        superchats = pyusdPayment.getUserSuperchats(_user);
        subscriptions = pyusdPayment.getUserSubscriptions(_user);
        reputation = reputationTracker.getSpeakerMetrics(_user);
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 totalSessions,
            uint256 totalSpeakers,
            uint256 totalParticipants,
            uint256 totalSuperchats,
            uint256 totalStaked
        )
    {
        // This would require additional tracking in the contracts
        // For demo purposes, returning placeholder values
        totalSessions = 0;
        totalSpeakers = 0;
        totalParticipants = 0;
        totalSuperchats = 0;
        totalStaked = 0;
    }

    /**
     * @dev Update platform configuration (only owner)
     */
    function updatePlatformConfig(
        uint256 _platformFeeBps,
        uint256 _superchatFeeBps,
        uint256 _yieldToParticipantsBps,
        uint256 _yieldToPoolBps
    ) external onlyOwner {
        require(_platformFeeBps <= 1000, "Platform fee too high");
        require(_superchatFeeBps <= 1000, "Superchat fee too high");
        require(
            _yieldToParticipantsBps + _yieldToPoolBps == 10000,
            "Yield distribution must equal 100%"
        );

        platformFeeBps = _platformFeeBps;
        superchatFeeBps = _superchatFeeBps;
        yieldToParticipantsBps = _yieldToParticipantsBps;
        yieldToPoolBps = _yieldToPoolBps;

        // Update sub-contracts
        sessionPool.updatePlatformFees(_platformFeeBps, _superchatFeeBps);
        sessionPool.updateYieldDistribution(
            _yieldToParticipantsBps,
            _yieldToPoolBps
        );
    }

    /**
     * @dev Emergency pause function (only owner)
     */
    function emergencyPause() external onlyOwner {
        // In a real implementation, you would pause all contract functions
        // For now, this is a placeholder
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
