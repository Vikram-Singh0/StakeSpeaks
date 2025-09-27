// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FilecoinStorage
 * @dev Verifies Filecoin storage proofs for session data and recordings
 */
contract FilecoinStorage is Ownable {
    constructor() Ownable(msg.sender) {}

    struct StorageProof {
        uint256 proofId;
        uint256 sessionId;
        string fileHash; // IPFS hash
        string filecoinDealId;
        uint256 dealSize; // in bytes
        uint256 dealDuration; // in seconds
        uint256 dealPrice; // in FIL
        uint256 timestamp;
        bool isVerified;
        bool isActive;
    }

    struct SessionArchive {
        uint256 sessionId;
        string audioHash; // IPFS hash for audio recording
        string chatLogHash; // IPFS hash for chat logs
        string metadataHash; // IPFS hash for session metadata
        string transcriptHash; // IPFS hash for transcript
        uint256 totalSize; // Total size in bytes
        uint256 archiveTimestamp;
        bool isArchived;
        mapping(string => StorageProof) storageProofs; // fileHash => StorageProof
    }

    struct ArchiveSummary {
        uint256 sessionId;
        string audioHash;
        string chatLogHash;
        string metadataHash;
        string transcriptHash;
        uint256 totalSize;
        uint256 archiveTimestamp;
        bool isArchived;
        uint256 proofCount;
    }

    // State variables
    mapping(uint256 => SessionArchive) public sessionArchives;
    mapping(string => StorageProof) public storageProofs;
    mapping(address => uint256[]) public userArchives;

    uint256 public nextProofId = 1;

    // Filecoin network parameters
    uint256 public minDealDuration = 365 days; // Minimum 1 year
    uint256 public maxDealPrice = 1 ether; // Maximum 1 FIL per deal
    uint256 public minDealSize = 1024; // Minimum 1KB

    // Events
    event SessionArchived(
        uint256 indexed sessionId,
        string audioHash,
        string chatLogHash,
        string metadataHash,
        string transcriptHash,
        uint256 totalSize
    );

    event StorageProofAdded(
        uint256 indexed proofId,
        uint256 indexed sessionId,
        string fileHash,
        string filecoinDealId,
        uint256 dealSize,
        uint256 dealPrice
    );

    event StorageProofVerified(
        uint256 indexed proofId,
        string fileHash,
        bool isValid
    );

    event ArchiveAccessed(
        uint256 indexed sessionId,
        address indexed user,
        string fileType
    );

    /**
     * @dev Archive session data to Filecoin
     */
    function archiveSession(
        uint256 _sessionId,
        string memory _audioHash,
        string memory _chatLogHash,
        string memory _metadataHash,
        string memory _transcriptHash,
        uint256 _totalSize
    ) external {
        require(_sessionId > 0, "Invalid session ID");
        require(bytes(_audioHash).length > 0, "Audio hash required");
        require(_totalSize > 0, "Total size must be positive");

        SessionArchive storage archive = sessionArchives[_sessionId];
        require(!archive.isArchived, "Session already archived");

        archive.sessionId = _sessionId;
        archive.audioHash = _audioHash;
        archive.chatLogHash = _chatLogHash;
        archive.metadataHash = _metadataHash;
        archive.transcriptHash = _transcriptHash;
        archive.totalSize = _totalSize;
        archive.archiveTimestamp = block.timestamp;
        archive.isArchived = true;

        userArchives[msg.sender].push(_sessionId);

        emit SessionArchived(
            _sessionId,
            _audioHash,
            _chatLogHash,
            _metadataHash,
            _transcriptHash,
            _totalSize
        );
    }

    /**
     * @dev Add storage proof for a file
     */
    function addStorageProof(
        uint256 _sessionId,
        string memory _fileHash,
        string memory _filecoinDealId,
        uint256 _dealSize,
        uint256 _dealDuration,
        uint256 _dealPrice
    ) external {
        require(_sessionId > 0, "Invalid session ID");
        require(bytes(_fileHash).length > 0, "File hash required");
        require(bytes(_filecoinDealId).length > 0, "Deal ID required");
        require(_dealSize >= minDealSize, "Deal size too small");
        require(_dealDuration >= minDealDuration, "Deal duration too short");
        require(_dealPrice <= maxDealPrice, "Deal price too high");

        SessionArchive storage archive = sessionArchives[_sessionId];
        require(archive.isArchived, "Session not archived");

        uint256 proofId = nextProofId++;
        StorageProof storage proof = storageProofs[_fileHash];

        proof.proofId = proofId;
        proof.sessionId = _sessionId;
        proof.fileHash = _fileHash;
        proof.filecoinDealId = _filecoinDealId;
        proof.dealSize = _dealSize;
        proof.dealDuration = _dealDuration;
        proof.dealPrice = _dealPrice;
        proof.timestamp = block.timestamp;
        proof.isVerified = false;
        proof.isActive = true;

        archive.storageProofs[_fileHash] = proof;

        emit StorageProofAdded(
            proofId,
            _sessionId,
            _fileHash,
            _filecoinDealId,
            _dealSize,
            _dealPrice
        );
    }

    /**
     * @dev Verify storage proof (only owner or oracle)
     */
    function verifyStorageProof(
        string memory _fileHash,
        bool _isValid
    ) external onlyOwner {
        StorageProof storage proof = storageProofs[_fileHash];
        require(proof.proofId != 0, "Proof not found");
        require(!proof.isVerified, "Proof already verified");

        proof.isVerified = _isValid;

        emit StorageProofVerified(proof.proofId, _fileHash, _isValid);
    }

    /**
     * @dev Access archived session data
     */
    function accessArchive(
        uint256 _sessionId,
        string memory _fileType
    ) external {
        SessionArchive storage archive = sessionArchives[_sessionId];
        require(archive.isArchived, "Session not archived");

        // Check if user has access (simplified - in real implementation, check permissions)
        require(bytes(_fileType).length > 0, "File type required");

        emit ArchiveAccessed(_sessionId, msg.sender, _fileType);
    }

    /**
     * @dev Get session archive summary
     */
    function getArchiveSummary(
        uint256 _sessionId
    ) external view returns (ArchiveSummary memory) {
        SessionArchive storage archive = sessionArchives[_sessionId];

        // Count storage proofs
        uint256 proofCount = 0;
        if (bytes(archive.audioHash).length > 0) proofCount++;
        if (bytes(archive.chatLogHash).length > 0) proofCount++;
        if (bytes(archive.metadataHash).length > 0) proofCount++;
        if (bytes(archive.transcriptHash).length > 0) proofCount++;

        return
            ArchiveSummary({
                sessionId: archive.sessionId,
                audioHash: archive.audioHash,
                chatLogHash: archive.chatLogHash,
                metadataHash: archive.metadataHash,
                transcriptHash: archive.transcriptHash,
                totalSize: archive.totalSize,
                archiveTimestamp: archive.archiveTimestamp,
                isArchived: archive.isArchived,
                proofCount: proofCount
            });
    }

    /**
     * @dev Get storage proof details
     */
    function getStorageProof(
        string memory _fileHash
    ) external view returns (StorageProof memory) {
        return storageProofs[_fileHash];
    }

    /**
     * @dev Get user's archived sessions
     */
    function getUserArchives(
        address _user
    ) external view returns (uint256[] memory) {
        return userArchives[_user];
    }

    /**
     * @dev Check if file is stored and verified
     */
    function isFileStoredAndVerified(
        string memory _fileHash
    ) external view returns (bool) {
        StorageProof storage proof = storageProofs[_fileHash];
        return proof.isVerified && proof.isActive;
    }

    /**
     * @dev Get total storage size for a session
     */
    function getSessionStorageSize(
        uint256 _sessionId
    ) external view returns (uint256) {
        SessionArchive storage archive = sessionArchives[_sessionId];
        return archive.totalSize;
    }

    /**
     * @dev Update Filecoin network parameters (only owner)
     */
    function updateNetworkParameters(
        uint256 _minDealDuration,
        uint256 _maxDealPrice,
        uint256 _minDealSize
    ) external onlyOwner {
        require(_minDealDuration > 0, "Min deal duration must be positive");
        require(_maxDealPrice > 0, "Max deal price must be positive");
        require(_minDealSize > 0, "Min deal size must be positive");

        minDealDuration = _minDealDuration;
        maxDealPrice = _maxDealPrice;
        minDealSize = _minDealSize;
    }

    /**
     * @dev Store session data (simplified interface for TalkStake integration)
     */
    function storeSessionData(
        uint256 _sessionId,
        string memory _sessionMetadata,
        string memory _audioHash,
        string memory _chatLogsHash
    ) external returns (string memory) {
        // Archive the session data
        this.archiveSession(
            _sessionId,
            _audioHash,
            _chatLogsHash,
            _sessionMetadata,
            "", // transcript hash (empty for now)
            1024 // placeholder size
        );

        // Return a combined hash for the session
        return
            string(
                abi.encodePacked(
                    "QmSession_",
                    _sessionId,
                    "_",
                    _audioHash,
                    "_",
                    _chatLogsHash
                )
            );
    }

    /**
     * @dev Get session hash (simplified interface for TalkStake integration)
     */
    function getSessionHash(
        uint256 _sessionId
    ) external view returns (string memory) {
        SessionArchive storage archive = sessionArchives[_sessionId];
        if (!archive.isArchived) {
            return "";
        }

        return
            string(
                abi.encodePacked(
                    "QmSession_",
                    _sessionId,
                    "_",
                    archive.audioHash,
                    "_",
                    archive.chatLogHash
                )
            );
    }

    /**
     * @dev Get storage statistics
     */
    function getStorageStats()
        external
        view
        returns (
            uint256 totalArchives,
            uint256 totalProofs,
            uint256 verifiedProofs,
            uint256 totalSize
        )
    {
        // This would require iterating through all archives and proofs
        // In a real implementation, you'd maintain counters
        return (0, 0, 0, 0);
    }
}
