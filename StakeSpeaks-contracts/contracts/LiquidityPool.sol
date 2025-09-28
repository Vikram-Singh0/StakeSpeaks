// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiquidityPool
 * @dev Manages separate liquidity pools for KDA staking and PYUSD superchats
 * KDA Pool: For staking and yield generation
 * PYUSD Pool: For superchat distribution to listeners
 */
contract LiquidityPool is ReentrancyGuard, Ownable {
    struct PoolInfo {
        uint256 totalDeposited;
        uint256 totalYield;
        uint256 lastUpdateTime;
        uint256 apy; // Annual percentage yield in basis points
        bool isActive;
    }

    struct UserPosition {
        uint256 depositAmount;
        uint256 pendingYield;
        uint256 totalYieldEarned;
        uint256 lastUpdateTime;
    }

    // Token contracts
    IERC20 public kdaToken;
    IERC20 public pyusdToken;

    // Pool information
    PoolInfo public kdaPool;
    PoolInfo public pyusdPool;

    // User positions
    mapping(address => UserPosition) public kdaPositions;
    mapping(address => UserPosition) public pyusdPositions;

    // Yield distribution settings
    uint256 public yieldToParticipantsBps = 3000; // 30% to participants
    uint256 public yieldToPoolBps = 7000; // 70% retained for compounding

    // Events
    event KdaDeposited(address indexed user, uint256 amount);
    event PyusdDeposited(address indexed user, uint256 amount);
    event KdaYieldClaimed(address indexed user, uint256 amount);
    event PyusdYieldClaimed(address indexed user, uint256 amount);
    event YieldGenerated(uint256 kdaYield, uint256 pyusdYield);
    event PoolUpdated(uint256 kdaTotal, uint256 pyusdTotal);

    constructor(address _kdaToken, address _pyusdToken) Ownable(msg.sender) {
        kdaToken = IERC20(_kdaToken);
        pyusdToken = IERC20(_pyusdToken);

        // Initialize KDA pool
        kdaPool = PoolInfo({
            totalDeposited: 0,
            totalYield: 0,
            lastUpdateTime: block.timestamp,
            apy: 500, // 5% APY
            isActive: true
        });

        // Initialize PYUSD pool (no yield, just distribution)
        pyusdPool = PoolInfo({
            totalDeposited: 0,
            totalYield: 0,
            lastUpdateTime: block.timestamp,
            apy: 0, // No yield for PYUSD
            isActive: true
        });
    }

    /**
     * @dev Deposit KDA tokens to the staking pool
     */
    function depositKda(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        require(kdaPool.isActive, "KDA pool not active");

        // Update user's pending yield before new deposit
        _updateKdaYield(msg.sender);

        // Transfer KDA tokens from user
        require(
            kdaToken.transferFrom(msg.sender, address(this), _amount),
            "KDA transfer failed"
        );

        // Update user position
        kdaPositions[msg.sender].depositAmount += _amount;
        kdaPool.totalDeposited += _amount;

        emit KdaDeposited(msg.sender, _amount);
    }

    /**
     * @dev Deposit PYUSD tokens to the superchat pool
     */
    function depositPyusd(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        require(pyusdPool.isActive, "PYUSD pool not active");

        // Transfer PYUSD tokens from user
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );

        // Update pool (PYUSD doesn't generate yield, just distribution)
        pyusdPositions[msg.sender].depositAmount += _amount;
        pyusdPool.totalDeposited += _amount;

        emit PyusdDeposited(msg.sender, _amount);
    }

    /**
     * @dev Claim KDA yield
     */
    function claimKdaYield() external nonReentrant {
        _updateKdaYield(msg.sender);

        uint256 pendingYield = kdaPositions[msg.sender].pendingYield;
        require(pendingYield > 0, "No yield to claim");

        // Calculate distribution: 30% to user, 70% compound
        uint256 userYield = (pendingYield * yieldToParticipantsBps) / 10000;
        uint256 compoundYield = pendingYield - userYield;

        // Update user position
        kdaPositions[msg.sender].pendingYield = 0;
        kdaPositions[msg.sender].totalYieldEarned += userYield;
        kdaPositions[msg.sender].depositAmount += compoundYield;
        kdaPool.totalDeposited += compoundYield;

        // Transfer user's yield
        if (userYield > 0) {
            require(
                kdaToken.transfer(msg.sender, userYield),
                "KDA yield transfer failed"
            );
        }

        emit KdaYieldClaimed(msg.sender, userYield);
    }

    /**
     * @dev Claim PYUSD from superchat pool (no yield, just distribution)
     */
    function claimPyusd() external nonReentrant {
        uint256 userAmount = pyusdPositions[msg.sender].depositAmount;
        require(userAmount > 0, "No PYUSD to claim");

        // Update position
        pyusdPositions[msg.sender].depositAmount = 0;
        pyusdPool.totalDeposited -= userAmount;

        // Transfer PYUSD
        require(
            pyusdToken.transfer(msg.sender, userAmount),
            "PYUSD transfer failed"
        );

        emit PyusdYieldClaimed(msg.sender, userAmount);
    }

    /**
     * @dev Withdraw KDA tokens and all yield
     */
    function withdrawKda(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        require(
            _amount <= kdaPositions[msg.sender].depositAmount,
            "Insufficient balance"
        );

        // Update user's pending yield
        _updateKdaYield(msg.sender);

        // Calculate total withdrawable (deposit + withdrawable yield)
        uint256 pendingYield = kdaPositions[msg.sender].pendingYield;
        uint256 withdrawableYield = (pendingYield * yieldToParticipantsBps) /
            10000;
        uint256 totalWithdrawable = kdaPositions[msg.sender].depositAmount +
            withdrawableYield;

        require(
            _amount <= totalWithdrawable,
            "Amount exceeds withdrawable balance"
        );

        // Update position
        kdaPositions[msg.sender].depositAmount -= _amount;
        kdaPool.totalDeposited -= _amount;

        // Transfer KDA
        require(
            kdaToken.transfer(msg.sender, _amount),
            "KDA withdrawal failed"
        );
    }

    /**
     * @dev Generate yield for KDA pool (called by platform)
     */
    function generateKdaYield(uint256 _sessionDuration) external onlyOwner {
        require(kdaPool.isActive, "KDA pool not active");

        uint256 timeElapsed = _sessionDuration; // Duration in seconds
        if (timeElapsed == 0) return;

        // Calculate yield based on APY and session duration
        uint256 yieldRate = (kdaPool.apy * timeElapsed) / (365 days);
        uint256 newYield = (kdaPool.totalDeposited * yieldRate) / 10000;

        kdaPool.totalYield += newYield;
        kdaPool.lastUpdateTime = block.timestamp;

        emit YieldGenerated(newYield, 0);
    }

    /**
     * @dev Distribute PYUSD superchats to listeners
     */
    function distributePyusdSuperchats(
        address[] memory _listeners,
        uint256[] memory _amounts
    ) external onlyOwner {
        require(_listeners.length == _amounts.length, "Array length mismatch");

        for (uint256 i = 0; i < _listeners.length; i++) {
            if (_amounts[i] > 0) {
                require(
                    pyusdToken.transfer(_listeners[i], _amounts[i]),
                    "PYUSD distribution failed"
                );
            }
        }
    }

    /**
     * @dev Internal function to update KDA yield for a user
     */
    function _updateKdaYield(address _user) internal {
        UserPosition storage position = kdaPositions[_user];

        if (position.depositAmount == 0) return;

        uint256 timeElapsed = block.timestamp - position.lastUpdateTime;
        if (timeElapsed == 0) return;

        // Calculate user's proportional yield
        uint256 yieldRate = (kdaPool.apy * timeElapsed) / (365 days);
        uint256 userYield = (position.depositAmount * yieldRate) / 10000;

        position.pendingYield += userYield;
        position.lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Get user's KDA position
     */
    function getKdaPosition(
        address _user
    ) external view returns (UserPosition memory) {
        UserPosition memory position = kdaPositions[_user];

        // Calculate pending yield
        if (position.depositAmount > 0) {
            uint256 timeElapsed = block.timestamp - position.lastUpdateTime;
            uint256 yieldRate = (kdaPool.apy * timeElapsed) / (365 days);
            uint256 additionalYield = (position.depositAmount * yieldRate) /
                10000;
            position.pendingYield += additionalYield;
        }

        return position;
    }

    /**
     * @dev Get user's PYUSD position
     */
    function getPyusdPosition(
        address _user
    ) external view returns (UserPosition memory) {
        return pyusdPositions[_user];
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo()
        external
        view
        returns (PoolInfo memory kda, PoolInfo memory pyusd)
    {
        return (kdaPool, pyusdPool);
    }

    /**
     * @dev Update yield distribution settings (only owner)
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
     * @dev Update KDA pool APY (only owner)
     */
    function updateKdaApy(uint256 _newApy) external onlyOwner {
        require(_newApy > 0, "APY must be positive");
        kdaPool.apy = _newApy;
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
