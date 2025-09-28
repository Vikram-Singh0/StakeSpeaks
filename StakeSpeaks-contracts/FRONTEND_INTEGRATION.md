# Frontend Integration Guide for PYUSD

## 🚀 **PYUSD Integration Steps for Your Frontend Partner**

### **Step 1: Contract Addresses**

```javascript
// Contract addresses (update these after deployment)
const CONTRACTS = {
  TalkStake: "0x...", // Main integration contract
  SessionPool: "0x...", // Session management
  PYUSDPaymentHandler: "0x...", // PYUSD payments
  LiquidityPool: "0x...", // Liquidity pools
  PYUSD: "0x6c3ea9036406852006290770bedfcaba0e23a0e8" // Real PYUSD contract
};
```

### **Step 2: Web3 Setup**

```javascript
// Install required packages
// npm install ethers @metamask/detect-provider

import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// Connect to MetaMask
const provider = await detectEthereumProvider();
const web3Provider = new ethers.BrowserProvider(provider);
const signer = await web3Provider.getSigner();
```

### **Step 3: Contract Interactions**

#### **A. Create Session with Dynamic Pricing**
```javascript
const talkStakeContract = new ethers.Contract(
  CONTRACTS.TalkStake,
  TalkStakeABI,
  signer
);

// Create session
const tx = await talkStakeContract.createSessionWithReputation(
  "DeFi Future Trends", // topic
  ethers.parseEther("10"), // base stake (10 KDA)
  5, // max participants
  Math.floor(Date.now() / 1000) + 3600, // start time (1 hour from now)
  3600 // duration (1 hour)
);
await tx.wait();
```

#### **B. Join Session (Stake KDA)**
```javascript
// First, approve KDA spending
const kdaContract = new ethers.Contract(CONTRACTS.KDA, ERC20ABI, signer);
await kdaContract.approve(CONTRACTS.SessionPool, ethers.parseEther("10"));

// Then join session
const sessionPoolContract = new ethers.Contract(
  CONTRACTS.SessionPool,
  SessionPoolABI,
  signer
);

const tx = await sessionPoolContract.joinSession(
  sessionId, // session ID
  ethers.parseEther("10") // stake amount
);
await tx.wait();
```

#### **C. Send PYUSD Superchat**
```javascript
// First, approve PYUSD spending
const pyusdContract = new ethers.Contract(CONTRACTS.PYUSD, ERC20ABI, signer);
await pyusdContract.approve(CONTRACTS.PYUSDPaymentHandler, ethers.parseUnits("10", 6));

// Then send superchat
const pyusdPaymentContract = new ethers.Contract(
  CONTRACTS.PYUSDPaymentHandler,
  PYUSDPaymentABI,
  signer
);

const tx = await pyusdPaymentContract.sendSuperchat(
  speakerAddress, // recipient
  ethers.parseUnits("10", 6), // amount (10 PYUSD)
  "Great point!" // message
);
await tx.wait();
```

### **Step 4: Real-time Updates**

#### **A. Listen to Events**
```javascript
// Listen to superchat events
pyusdPaymentContract.on("SuperchatSent", (superchatId, sender, recipient, amount, message) => {
  console.log(`Superchat received: ${ethers.formatUnits(amount, 6)} PYUSD from ${sender}`);
  // Update UI with new superchat
});

// Listen to session events
sessionPoolContract.on("SessionJoined", (sessionId, participant, stakeAmount) => {
  console.log(`User joined session: ${participant} staked ${ethers.formatEther(stakeAmount)} KDA`);
  // Update participant count
});
```

#### **B. WebSocket Integration**
```javascript
// Connect to your WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'superchat':
      // Handle superchat notification
      showSuperchatNotification(data);
      break;
    case 'session_update':
      // Handle session updates
      updateSessionInfo(data);
      break;
  }
};
```

### **Step 5: User Experience Flow**

#### **A. Speaker Journey**
```javascript
// 1. Register speaker
await reputationTracker.registerSpeaker(speakerAddress);

// 2. Create session
const sessionId = await talkStake.createSessionWithReputation(...);

// 3. Start session
await sessionPool.startSession(sessionId);

// 4. Receive superchats (real-time)
// 5. Complete session
await talkStake.completeSessionWithStorage(sessionId, metadata, audioHash, chatHash);
```

#### **B. Listener Journey**
```javascript
// 1. Browse sessions
const sessions = await sessionPool.getActiveSessions();

// 2. Join session (stake KDA)
await sessionPool.joinSession(sessionId, stakeAmount);

// 3. Send superchats (PYUSD)
await pyusdPayment.sendSuperchat(speakerAddress, amount, message);

// 4. Claim rewards after session
await liquidityPool.claimKdaYield();
await liquidityPool.claimPyusd();
```

### **Step 6: Error Handling**

```javascript
try {
  const tx = await contract.functionName(...args);
  await tx.wait();
  console.log("Transaction successful");
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log("Insufficient funds");
  } else if (error.code === 'USER_REJECTED') {
    console.log("User rejected transaction");
  } else {
    console.error("Transaction failed:", error.message);
  }
}
```

### **Step 7: Testing with Real PYUSD**

#### **A. Get Test PYUSD**
1. Go to [Paxos Faucet](https://github.com/paxosglobal/pyusd-contract)
2. Request test PYUSD tokens
3. Use these for testing

#### **B. Test Transactions**
```javascript
// Check PYUSD balance
const balance = await pyusdContract.balanceOf(userAddress);
console.log(`PYUSD Balance: ${ethers.formatUnits(balance, 6)}`);

// Test small superchat
await pyusdPayment.sendSuperchat(
  speakerAddress,
  ethers.parseUnits("1", 6), // 1 PYUSD
  "Test superchat"
);
```

### **Step 8: Production Deployment**

#### **A. Update Contract Addresses**
```javascript
// Production addresses
const PRODUCTION_CONTRACTS = {
  TalkStake: "0x...", // Deployed contract address
  PYUSD: "0x6c3ea9036406852006290770bedfcaba0e23a0e8" // Real PYUSD
};
```

#### **B. Network Configuration**
```javascript
// Ethereum Mainnet
const mainnetProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');

// Kadena Testnet
const kadenaProvider = new ethers.JsonRpcProvider('https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc');
```

## 🎯 **Key Features for PYUSD Track**

1. **Real-time Superchats**: Instant PYUSD payments to speakers
2. **PayPal Integration**: Seamless UX for PayPal users
3. **Cross-border Payments**: Global speaker monetization
4. **Stablecoin Stability**: No volatility in payments
5. **Consumer-friendly**: Familiar PayPal experience

## 🚀 **Ready for Hackathon Submission!**

Your frontend partner can now integrate with these contracts to create a fully functional PYUSD-powered discussion platform!
