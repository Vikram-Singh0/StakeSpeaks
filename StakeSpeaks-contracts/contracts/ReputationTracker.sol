// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationTracker
 * @dev Tracks speaker reputation and adjusts session requirements dynamically
 */
contract ReputationTracker is Ownable {
    constructor() Ownable(msg.sender) {}

    struct SpeakerProfile {
        address speaker;
        uint256 totalSessions;
        uint256 totalRatings;
        uint256 averageRating; // Scaled by 100 (e.g., 450 = 4.5 stars)
        uint256 totalStakeReceived;
        uint256 totalSuperchatsReceived;
        uint256 reputationScore; // Calculated score for dynamic pricing
        bool isVerified;
        mapping(uint256 => uint256) sessionRatings; // sessionId => rating
        uint256[] completedSessions;
    }

    struct SessionRating {
        uint256 sessionId;
        address speaker;
        uint256 averageRating;
        uint256 totalRatings;
        uint256 timestamp;
    }

    struct ReputationMetrics {
        uint256 totalSessions;
        uint256 averageRating;
        uint256 reputationScore;
        uint256 totalStakeReceived;
        uint256 totalSuperchatsReceived;
        bool isVerified;
    }

    // State variables
    mapping(address => SpeakerProfile) public speakerProfiles;
    mapping(address => bool) public isSpeakerRegistered;
    mapping(uint256 => SessionRating) public sessionRatings;
    address[] public verifiedSpeakers;

    // Reputation calculation parameters
    uint256 public baseReputationScore = 1000;
    uint256 public ratingWeight = 300; // Weight of average rating
    uint256 public sessionCountWeight = 200; // Weight of session count
    uint256 public stakeWeight = 250; // Weight of total stake received
    uint256 public superchatWeight = 250; // Weight of superchats received

    // Dynamic pricing parameters
    uint256 public baseStakeMultiplier = 1000; // 1.0x multiplier
    uint256 public maxStakeMultiplier = 5000; // 5.0x multiplier
    uint256 public minStakeMultiplier = 500; // 0.5x multiplier

    // Events
    event SpeakerRegistered(address indexed speaker);
    event SpeakerVerified(address indexed speaker);
    event SessionRated(
        uint256 indexed sessionId,
        address indexed speaker,
        uint256 rating,
        uint256 averageRating
    );
    event ReputationUpdated(
        address indexed speaker,
        uint256 newReputationScore,
        uint256 newStakeMultiplier
    );

    /**
     * @dev Register a new speaker
     */
    function registerSpeaker(address _speaker) external {
        require(_speaker != address(0), "Invalid speaker address");
        require(!isSpeakerRegistered[_speaker], "Speaker already registered");

        SpeakerProfile storage profile = speakerProfiles[_speaker];
        profile.speaker = _speaker;
        profile.totalSessions = 0;
        profile.totalRatings = 0;
        profile.averageRating = 0;
        profile.totalStakeReceived = 0;
        profile.totalSuperchatsReceived = 0;
        profile.reputationScore = baseReputationScore;
        profile.isVerified = false;
        isSpeakerRegistered[_speaker] = true;

        emit SpeakerRegistered(_speaker);
    }

    /**
     * @dev Verify a speaker (only owner)
     */
    function verifySpeaker(address _speaker) external onlyOwner {
        require(
            speakerProfiles[_speaker].speaker != address(0),
            "Speaker not registered"
        );
        require(
            !speakerProfiles[_speaker].isVerified,
            "Speaker already verified"
        );

        speakerProfiles[_speaker].isVerified = true;
        verifiedSpeakers.push(_speaker);

        emit SpeakerVerified(_speaker);
    }

    /**
     * @dev Rate a completed session
     */
    function rateSession(
        uint256 _sessionId,
        address _speaker,
        uint256 _rating
    ) external {
        require(
            _rating >= 100 && _rating <= 500,
            "Rating must be between 1.0 and 5.0"
        );
        require(
            speakerProfiles[_speaker].speaker != address(0),
            "Speaker not registered"
        );
        require(
            sessionRatings[_sessionId].sessionId == 0,
            "Session already rated"
        );

        SpeakerProfile storage profile = speakerProfiles[_speaker];

        // Update session rating
        sessionRatings[_sessionId] = SessionRating({
            sessionId: _sessionId,
            speaker: _speaker,
            averageRating: _rating,
            totalRatings: 1,
            timestamp: block.timestamp
        });

        // Update speaker profile
        profile.totalRatings++;
        profile.averageRating =
            ((profile.averageRating * (profile.totalRatings - 1)) + _rating) /
            profile.totalRatings;
        profile.sessionRatings[_sessionId] = _rating;
        profile.completedSessions.push(_sessionId);

        // Recalculate reputation score
        _updateReputationScore(_speaker);

        emit SessionRated(_sessionId, _speaker, _rating, profile.averageRating);
    }

    /**
     * @dev Update speaker's financial metrics
     */
    function updateSpeakerMetrics(
        address _speaker,
        uint256 _stakeReceived,
        uint256 _superchatsReceived
    ) external {
        require(
            speakerProfiles[_speaker].speaker != address(0),
            "Speaker not registered"
        );

        SpeakerProfile storage profile = speakerProfiles[_speaker];
        profile.totalStakeReceived += _stakeReceived;
        profile.totalSuperchatsReceived += _superchatsReceived;
        profile.totalSessions++;

        // Recalculate reputation score
        _updateReputationScore(_speaker);
    }

    /**
     * @dev Internal function to update reputation score
     */
    function _updateReputationScore(address _speaker) internal {
        SpeakerProfile storage profile = speakerProfiles[_speaker];

        // Calculate weighted reputation score
        uint256 ratingComponent = (profile.averageRating * ratingWeight) / 100;
        uint256 sessionComponent = (profile.totalSessions *
            sessionCountWeight) / 10; // Normalize session count
        uint256 stakeComponent = (profile.totalStakeReceived * stakeWeight) /
            10000; // Normalize stake amount
        uint256 superchatComponent = (profile.totalSuperchatsReceived *
            superchatWeight) / 10000; // Normalize superchat amount

        profile.reputationScore =
            baseReputationScore +
            ratingComponent +
            sessionComponent +
            stakeComponent +
            superchatComponent;

        emit ReputationUpdated(
            _speaker,
            profile.reputationScore,
            getStakeMultiplier(_speaker)
        );
    }

    /**
     * @dev Calculate dynamic stake multiplier for a speaker
     */
    function getStakeMultiplier(
        address _speaker
    ) public view returns (uint256) {
        SpeakerProfile storage profile = speakerProfiles[_speaker];

        if (profile.totalSessions == 0) {
            return baseStakeMultiplier;
        }

        // Calculate multiplier based on reputation score
        uint256 reputationRatio = (profile.reputationScore * 10000) /
            baseReputationScore;

        // Apply bounds
        if (reputationRatio < minStakeMultiplier) {
            return minStakeMultiplier;
        } else if (reputationRatio > maxStakeMultiplier) {
            return maxStakeMultiplier;
        }

        return reputationRatio;
    }

    /**
     * @dev Calculate required base stake for a speaker
     */
    function calculateRequiredStake(
        address _speaker,
        uint256 _baseStake
    ) external view returns (uint256) {
        uint256 multiplier = getStakeMultiplier(_speaker);
        return (_baseStake * multiplier) / 10000;
    }

    /**
     * @dev Get speaker reputation metrics
     */
    function getSpeakerMetrics(
        address _speaker
    ) external view returns (ReputationMetrics memory) {
        SpeakerProfile storage profile = speakerProfiles[_speaker];

        return
            ReputationMetrics({
                totalSessions: profile.totalSessions,
                averageRating: profile.averageRating,
                reputationScore: profile.reputationScore,
                totalStakeReceived: profile.totalStakeReceived,
                totalSuperchatsReceived: profile.totalSuperchatsReceived,
                isVerified: profile.isVerified
            });
    }

    /**
     * @dev Get session rating details
     */
    function getSessionRating(
        uint256 _sessionId
    ) external view returns (SessionRating memory) {
        return sessionRatings[_sessionId];
    }

    /**
     * @dev Get speaker's completed sessions
     */
    function getSpeakerSessions(
        address _speaker
    ) external view returns (uint256[] memory) {
        return speakerProfiles[_speaker].completedSessions;
    }

    /**
     * @dev Get all verified speakers
     */
    function getVerifiedSpeakers() external view returns (address[] memory) {
        return verifiedSpeakers;
    }

    /**
     * @dev Get top speakers by reputation score
     */
    function getTopSpeakers(
        uint256 _count
    ) external returns (address[] memory) {
        uint256 length = verifiedSpeakers.length;
        if (_count > length) _count = length;

        address[] memory topSpeakers = new address[](_count);

        // Simple selection sort (in real implementation, use more efficient sorting)
        for (uint256 i = 0; i < _count; i++) {
            uint256 maxIndex = i;
            for (uint256 j = i + 1; j < length; j++) {
                if (
                    speakerProfiles[verifiedSpeakers[j]].reputationScore >
                    speakerProfiles[verifiedSpeakers[maxIndex]].reputationScore
                ) {
                    maxIndex = j;
                }
            }

            topSpeakers[i] = verifiedSpeakers[maxIndex];

            // Swap elements
            address temp = verifiedSpeakers[i];
            verifiedSpeakers[i] = verifiedSpeakers[maxIndex];
            verifiedSpeakers[maxIndex] = temp;
        }

        return topSpeakers;
    }

    /**
     * @dev Update reputation calculation weights (only owner)
     */
    function updateReputationWeights(
        uint256 _ratingWeight,
        uint256 _sessionCountWeight,
        uint256 _stakeWeight,
        uint256 _superchatWeight
    ) external onlyOwner {
        require(
            _ratingWeight +
                _sessionCountWeight +
                _stakeWeight +
                _superchatWeight ==
                1000,
            "Weights must sum to 1000"
        );

        ratingWeight = _ratingWeight;
        sessionCountWeight = _sessionCountWeight;
        stakeWeight = _stakeWeight;
        superchatWeight = _superchatWeight;
    }

    /**
     * @dev Update dynamic pricing parameters (only owner)
     */
    function updatePricingParameters(
        uint256 _baseStakeMultiplier,
        uint256 _maxStakeMultiplier,
        uint256 _minStakeMultiplier
    ) external onlyOwner {
        require(
            _minStakeMultiplier <= _baseStakeMultiplier,
            "Min multiplier too high"
        );
        require(
            _baseStakeMultiplier <= _maxStakeMultiplier,
            "Base multiplier too high"
        );

        baseStakeMultiplier = _baseStakeMultiplier;
        maxStakeMultiplier = _maxStakeMultiplier;
        minStakeMultiplier = _minStakeMultiplier;
    }
}
