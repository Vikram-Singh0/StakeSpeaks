// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PYUSDPaymentHandler
 * @dev Handles PYUSD payments for superchats and subscriptions
 */
contract PYUSDPaymentHandler is ReentrancyGuard, Ownable {
    struct Superchat {
        uint256 superchatId;
        address sender;
        address recipient;
        uint256 amount;
        string message;
        uint256 timestamp;
        bool isProcessed;
    }

    struct Subscription {
        uint256 subscriptionId;
        address subscriber;
        address speaker;
        uint256 amount;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isPaid;
    }

    // State variables
    IERC20 public pyusdToken;

    uint256 public nextSuperchatId = 1;
    uint256 public nextSubscriptionId = 1;

    mapping(uint256 => Superchat) public superchats;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSuperchats;
    mapping(address => uint256[]) public speakerSuperchats;
    mapping(address => uint256[]) public userSubscriptions;

    // Fee structure (in basis points, 100 = 1%)
    uint256 public platformFeeBps = 500; // 5%
    uint256 public speakerFeeBps = 8000; // 80% to speaker
    uint256 public poolFeeBps = 1500; // 15% to pool

    // Events
    event SuperchatSent(
        uint256 indexed superchatId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string message
    );

    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed speaker,
        uint256 amount,
        uint256 duration
    );

    event SubscriptionPaid(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 amount
    );

    constructor(address _pyusdToken) Ownable(msg.sender) {
        pyusdToken = IERC20(_pyusdToken);
    }

    /**
     * @dev Send a superchat to a speaker
     */
    function sendSuperchat(
        address _recipient,
        uint256 _amount,
        string memory _message
    ) external nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != msg.sender, "Cannot send superchat to yourself");

        // Transfer PYUSD from sender
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );

        // Create superchat record
        uint256 superchatId = nextSuperchatId++;
        superchats[superchatId] = Superchat({
            superchatId: superchatId,
            sender: msg.sender,
            recipient: _recipient,
            amount: _amount,
            message: _message,
            timestamp: block.timestamp,
            isProcessed: false
        });

        // Update user mappings
        userSuperchats[msg.sender].push(superchatId);
        speakerSuperchats[_recipient].push(superchatId);

        emit SuperchatSent(
            superchatId,
            msg.sender,
            _recipient,
            _amount,
            _message
        );

        return superchatId;
    }

    /**
     * @dev Process superchat payments (called by platform)
     */
    function processSuperchat(uint256 _superchatId) external onlyOwner {
        Superchat storage superchat = superchats[_superchatId];
        require(!superchat.isProcessed, "Superchat already processed");

        uint256 amount = superchat.amount;
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 speakerAmount = (amount * speakerFeeBps) / 10000;
        uint256 poolAmount = (amount * poolFeeBps) / 10000;

        // Transfer to speaker
        require(
            pyusdToken.transfer(superchat.recipient, speakerAmount),
            "Speaker transfer failed"
        );

        // Transfer to platform (pool)
        require(
            pyusdToken.transfer(owner(), poolAmount + platformFee),
            "Platform transfer failed"
        );

        superchat.isProcessed = true;
    }

    /**
     * @dev Create a subscription to a speaker
     */
    function createSubscription(
        address _speaker,
        uint256 _amount,
        uint256 _duration
    ) external returns (uint256) {
        require(_speaker != address(0), "Invalid speaker");
        require(_amount > 0, "Amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_speaker != msg.sender, "Cannot subscribe to yourself");

        uint256 subscriptionId = nextSubscriptionId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _duration;

        subscriptions[subscriptionId] = Subscription({
            subscriptionId: subscriptionId,
            subscriber: msg.sender,
            speaker: _speaker,
            amount: _amount,
            duration: _duration,
            startTime: startTime,
            endTime: endTime,
            isActive: false,
            isPaid: false
        });

        userSubscriptions[msg.sender].push(subscriptionId);

        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            _speaker,
            _amount,
            _duration
        );

        return subscriptionId;
    }

    /**
     * @dev Pay for a subscription
     */
    function paySubscription(uint256 _subscriptionId) external nonReentrant {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(subscription.subscriber == msg.sender, "Not the subscriber");
        require(!subscription.isPaid, "Subscription already paid");
        require(
            block.timestamp <= subscription.endTime,
            "Subscription expired"
        );

        uint256 amount = subscription.amount;
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 speakerAmount = (amount * speakerFeeBps) / 10000;
        uint256 poolAmount = (amount * poolFeeBps) / 10000;

        // Transfer PYUSD from subscriber
        require(
            pyusdToken.transferFrom(msg.sender, address(this), amount),
            "PYUSD transfer failed"
        );

        // Transfer to speaker
        require(
            pyusdToken.transfer(subscription.speaker, speakerAmount),
            "Speaker transfer failed"
        );

        // Transfer to platform (pool)
        require(
            pyusdToken.transfer(owner(), poolAmount + platformFee),
            "Platform transfer failed"
        );

        subscription.isPaid = true;
        subscription.isActive = true;

        emit SubscriptionPaid(_subscriptionId, msg.sender, amount);
    }

    /**
     * @dev Pay entry fee for a session
     */
    function payEntryFee(
        uint256 _sessionId,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer PYUSD from sender
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );

        // Calculate fees
        uint256 platformFee = (_amount * platformFeeBps) / 10000;
        uint256 poolAmount = _amount - platformFee;

        // Transfer to platform (pool)
        require(
            pyusdToken.transfer(owner(), poolAmount + platformFee),
            "Platform transfer failed"
        );

        emit SubscriptionPaid(_sessionId, msg.sender, _amount);
    }

    /**
     * @dev Get superchat details
     */
    function getSuperchat(
        uint256 _superchatId
    ) external view returns (Superchat memory) {
        return superchats[_superchatId];
    }

    /**
     * @dev Get subscription details
     */
    function getSubscription(
        uint256 _subscriptionId
    ) external view returns (Subscription memory) {
        return subscriptions[_subscriptionId];
    }

    /**
     * @dev Get user's superchats
     */
    function getUserSuperchats(
        address _user
    ) external view returns (uint256[] memory) {
        return userSuperchats[_user];
    }

    /**
     * @dev Get speaker's superchats
     */
    function getSpeakerSuperchats(
        address _speaker
    ) external view returns (uint256[] memory) {
        return speakerSuperchats[_speaker];
    }

    /**
     * @dev Get user's subscriptions
     */
    function getUserSubscriptions(
        address _user
    ) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }

    /**
     * @dev Get user's active subscriptions
     */
    function getUserActiveSubscriptions(
        address _user
    ) external view returns (uint256[] memory) {
        uint256[] memory userSubs = userSubscriptions[_user];
        uint256[] memory activeSubs = new uint256[](userSubs.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < userSubs.length; i++) {
            if (
                subscriptions[userSubs[i]].isActive &&
                subscriptions[userSubs[i]].isPaid
            ) {
                activeSubs[activeCount] = userSubs[i];
                activeCount++;
            }
        }

        // Resize array to actual active count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeSubs[i];
        }

        return result;
    }

    /**
     * @dev Get user's payment history
     */
    function getUserPayments(
        address _user
    )
        external
        view
        returns (
            uint256[] memory userSuperchatsList,
            uint256[] memory userSubscriptionsList
        )
    {
        return (userSuperchats[_user], userSubscriptions[_user]);
    }

    /**
     * @dev Update fee structure (only owner)
     */
    function updateFees(
        uint256 _platformFeeBps,
        uint256 _speakerFeeBps,
        uint256 _poolFeeBps
    ) external onlyOwner {
        require(
            _platformFeeBps + _speakerFeeBps + _poolFeeBps == 10000,
            "Fees must sum to 100%"
        );

        platformFeeBps = _platformFeeBps;
        speakerFeeBps = _speakerFeeBps;
        poolFeeBps = _poolFeeBps;
    }
}
