// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldManager
 * @dev Manages yield farming and compound interest for staked KDA tokens
 */
contract YieldManager is ReentrancyGuard, Ownable {
    constructor() Ownable(msg.sender) {}

    struct Pool {
        uint256 poolId;
        string name;
        address kdaToken;
        uint256 totalDeposited;
        uint256 totalYield;
        uint256 lastUpdateTime;
        uint256 apy; // Annual percentage yield in basis points
        bool isActive;
        mapping(address => uint256) userDeposits;
        mapping(address => uint256) userYield;
        address[] depositors;
    }

    struct PoolSummary {
        uint256 poolId;
        string name;
        address kdaToken;
        uint256 totalDeposited;
        uint256 totalYield;
        uint256 lastUpdateTime;
        uint256 apy;
        bool isActive;
        uint256 depositorCount;
    }

    struct UserPosition {
        uint256 depositAmount;
        uint256 pendingYield;
        uint256 totalYieldEarned;
        uint256 lastUpdateTime;
    }

    // State variables
    mapping(uint256 => Pool) public pools;
    uint256 public nextPoolId = 1;

    // Yield distribution settings
    uint256 public compoundPercentage = 5000; // 50% compound, 50% withdrawable
    uint256 public platformFeeBps = 200; // 2%

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        string name,
        address kdaToken,
        uint256 apy
    );

    event Deposited(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount
    );

    event YieldClaimed(
        uint256 indexed poolId,
        address indexed user,
        uint256 yieldAmount,
        uint256 compoundAmount
    );

    event Withdrawn(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount
    );

    event YieldUpdated(
        uint256 indexed poolId,
        uint256 totalYield,
        uint256 timestamp
    );

    /**
     * @dev Create a new yield farming pool
     */
    function createPool(
        string memory _name,
        address _kdaToken,
        uint256 _apy
    ) external onlyOwner returns (uint256) {
        require(_kdaToken != address(0), "Invalid token address");
        require(_apy > 0, "APY must be positive");

        uint256 poolId = nextPoolId++;
        Pool storage pool = pools[poolId];

        pool.poolId = poolId;
        pool.name = _name;
        pool.kdaToken = _kdaToken;
        pool.totalDeposited = 0;
        pool.totalYield = 0;
        pool.lastUpdateTime = block.timestamp;
        pool.apy = _apy;
        pool.isActive = true;

        emit PoolCreated(poolId, _name, _kdaToken, _apy);

        return poolId;
    }

    /**
     * @dev Deposit KDA tokens into a yield pool
     */
    function deposit(uint256 _poolId, uint256 _amount) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.isActive, "Pool not active");
        require(_amount > 0, "Amount must be positive");

        // Update user's pending yield before new deposit
        _updateUserYield(_poolId, msg.sender);

        // Transfer tokens from user
        require(
            IERC20(pool.kdaToken).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Token transfer failed"
        );

        // Update pool state
        pool.userDeposits[msg.sender] += _amount;
        pool.totalDeposited += _amount;

        // Add to depositors list if first deposit
        if (pool.userDeposits[msg.sender] == _amount) {
            pool.depositors.push(msg.sender);
        }

        emit Deposited(_poolId, msg.sender, _amount);
    }

    /**
     * @dev Claim yield from a pool
     */
    function claimYield(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.isActive, "Pool not active");

        _updateUserYield(_poolId, msg.sender);

        uint256 pendingYield = pool.userYield[msg.sender];
        require(pendingYield > 0, "No yield to claim");

        // Calculate compound vs withdrawable amounts
        uint256 compoundAmount = (pendingYield * compoundPercentage) / 10000;
        uint256 withdrawableAmount = pendingYield - compoundAmount;

        // Update user state
        pool.userYield[msg.sender] = 0;
        pool.userDeposits[msg.sender] += compoundAmount;
        pool.totalDeposited += compoundAmount;

        // Transfer withdrawable yield
        if (withdrawableAmount > 0) {
            require(
                IERC20(pool.kdaToken).transfer(msg.sender, withdrawableAmount),
                "Yield transfer failed"
            );
        }

        emit YieldClaimed(_poolId, msg.sender, pendingYield, compoundAmount);
    }

    /**
     * @dev Withdraw deposited tokens and all yield
     */
    function withdraw(uint256 _poolId, uint256 _amount) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.isActive, "Pool not active");
        require(_amount > 0, "Amount must be positive");
        require(
            _amount <= pool.userDeposits[msg.sender],
            "Insufficient balance"
        );

        // Update user's pending yield
        _updateUserYield(_poolId, msg.sender);

        // Calculate total withdrawable (deposit + withdrawable yield)
        uint256 pendingYield = pool.userYield[msg.sender];
        uint256 withdrawableYield = (pendingYield *
            (10000 - compoundPercentage)) / 10000;
        uint256 totalWithdrawable = pool.userDeposits[msg.sender] +
            withdrawableYield;

        require(
            _amount <= totalWithdrawable,
            "Amount exceeds withdrawable balance"
        );

        // Update pool state
        pool.userDeposits[msg.sender] -= _amount;
        pool.totalDeposited -= _amount;

        // Transfer tokens
        require(
            IERC20(pool.kdaToken).transfer(msg.sender, _amount),
            "Withdrawal transfer failed"
        );

        emit Withdrawn(_poolId, msg.sender, _amount);
    }

    /**
     * @dev Update yield for all users in a pool
     */
    function updatePoolYield(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        require(pool.isActive, "Pool not active");

        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        if (timeElapsed == 0) return;

        // Calculate yield based on APY
        uint256 yieldRate = (pool.apy * timeElapsed) / (365 days);
        uint256 newYield = (pool.totalDeposited * yieldRate) / 10000;

        pool.totalYield += newYield;
        pool.lastUpdateTime = block.timestamp;

        emit YieldUpdated(_poolId, pool.totalYield, block.timestamp);
    }

    /**
     * @dev Internal function to update user's yield
     */
    function _updateUserYield(uint256 _poolId, address _user) internal {
        Pool storage pool = pools[_poolId];

        if (pool.userDeposits[_user] == 0) return;

        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        if (timeElapsed == 0) return;

        // Calculate user's proportional yield
        uint256 yieldRate = (pool.apy * timeElapsed) / (365 days);
        uint256 userYield = (pool.userDeposits[_user] * yieldRate) / 10000;

        pool.userYield[_user] += userYield;
    }

    /**
     * @dev Get pool summary
     */
    function getPoolSummary(
        uint256 _poolId
    ) external view returns (PoolSummary memory) {
        Pool storage pool = pools[_poolId];
        return
            PoolSummary({
                poolId: pool.poolId,
                name: pool.name,
                kdaToken: pool.kdaToken,
                totalDeposited: pool.totalDeposited,
                totalYield: pool.totalYield,
                lastUpdateTime: pool.lastUpdateTime,
                apy: pool.apy,
                isActive: pool.isActive,
                depositorCount: pool.depositors.length
            });
    }

    /**
     * @dev Get user position in a pool
     */
    function getUserPosition(
        uint256 _poolId,
        address _user
    ) external view returns (UserPosition memory) {
        Pool storage pool = pools[_poolId];

        // Calculate pending yield
        uint256 pendingYield = pool.userYield[_user];
        if (pool.userDeposits[_user] > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 yieldRate = (pool.apy * timeElapsed) / (365 days);
            uint256 additionalYield = (pool.userDeposits[_user] * yieldRate) /
                10000;
            pendingYield += additionalYield;
        }

        return
            UserPosition({
                depositAmount: pool.userDeposits[_user],
                pendingYield: pendingYield,
                totalYieldEarned: 0, // Would need additional tracking
                lastUpdateTime: pool.lastUpdateTime
            });
    }

    /**
     * @dev Get pool depositors
     */
    function getPoolDepositors(
        uint256 _poolId
    ) external view returns (address[] memory) {
        return pools[_poolId].depositors;
    }

    /**
     * @dev Update pool APY (only owner)
     */
    function updatePoolAPY(
        uint256 _poolId,
        uint256 _newAPY
    ) external onlyOwner {
        require(_newAPY > 0, "APY must be positive");

        // Update yield before changing APY
        updatePoolYield(_poolId);

        pools[_poolId].apy = _newAPY;
    }

    /**
     * @dev Update compound percentage (only owner)
     */
    function updateCompoundPercentage(
        uint256 _newPercentage
    ) external onlyOwner {
        require(_newPercentage <= 10000, "Percentage cannot exceed 100%");
        compoundPercentage = _newPercentage;
    }

    /**
     * @dev Toggle pool active status (only owner)
     */
    function togglePoolStatus(uint256 _poolId) external onlyOwner {
        pools[_poolId].isActive = !pools[_poolId].isActive;
    }

    /**
     * @dev Emergency withdraw from pool (only owner)
     */
    function emergencyWithdraw(
        uint256 _poolId,
        uint256 _amount
    ) external onlyOwner {
        Pool storage pool = pools[_poolId];
        require(
            _amount <= IERC20(pool.kdaToken).balanceOf(address(this)),
            "Insufficient balance"
        );

        IERC20(pool.kdaToken).transfer(owner(), _amount);
    }
}
