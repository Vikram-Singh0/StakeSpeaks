# Contract Address Guide

## 🔍 **Where to Get Contract Addresses**

### **1. PYUSD Addresses (✅ Already Updated!)**

**Source**: Official Paxos Documentation
- **Website**: https://docs.paxos.com/stablecoin/token-contracts/pyusd
- **Mainnet**: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- **Sepolia Testnet**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

### **2. KDA Token Addresses (❌ Need to Find)**

**Source**: Kadena Explorer
- **Website**: https://explorer.chainweb.com/mainnet
- **Testnet Explorer**: https://explorer.chainweb.com/testnet

**Steps to Find KDA Addresses:**
1. Go to Kadena Explorer
2. Search for "KDA" or "Kadena Token"
3. Look for the official KDA token contract
4. Copy the contract address

**Alternative Sources:**
- **Kadena Documentation**: https://docs.kadena.io/
- **Kadena Discord**: Ask in the community
- **Kadena GitHub**: Check official repositories

### **3. Your Deployed Contract Addresses**

**After deploying your contracts, you'll get addresses like:**
```javascript
// Example deployment output
const YOUR_CONTRACTS = {
  TalkStake: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  SessionPool: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  YieldManager: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  PYUSDPaymentHandler: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  ReputationTracker: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  FilecoinStorage: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  LiquidityPool: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
};
```

## 🚀 **How to Update Addresses**

### **Step 1: Update the addresses.js file**
```javascript
// Replace placeholders with real addresses
const ADDRESSES = {
  PYUSD_MAINNET: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // ✅ Real
  PYUSD_SEPOLIA: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", // ✅ Real
  KDA_MAINNET: "0x...", // ❌ Need to find
  KDA_TESTNET: "0x...", // ❌ Need to find
};
```

### **Step 2: Update deployment scripts**
```javascript
// In deploy-with-pyusd.js
const PYUSD_ADDRESS = ADDRESSES.PYUSD_SEPOLIA; // Use testnet for testing
const KDA_ADDRESS = ADDRESSES.KDA_TESTNET; // Use testnet for testing
```

### **Step 3: Update frontend integration**
```javascript
// In your frontend
const CONTRACTS = {
  TalkStake: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6", // Your deployed address
  PYUSD: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", // Real PYUSD testnet
};
```

## 🌐 **Network-Specific Addresses**

### **For Testing (Sepolia + Kadena Testnet)**
```javascript
const TESTNET_ADDRESSES = {
  PYUSD: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
  KDA: "0x...", // Get from Kadena testnet explorer
  RPC: "https://sepolia.infura.io/v3/YOUR_KEY"
};
```

### **For Production (Mainnet)**
```javascript
const MAINNET_ADDRESSES = {
  PYUSD: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
  KDA: "0x...", // Get from Kadena mainnet explorer
  RPC: "https://mainnet.infura.io/v3/YOUR_KEY"
};
```

## 🔧 **Quick Commands to Find Addresses**

### **1. Search Kadena Explorer**
```bash
# Go to: https://explorer.chainweb.com/mainnet
# Search for: "KDA token" or "Kadena"
# Look for: Official token contract
```

### **2. Check Official Documentation**
```bash
# PYUSD: https://docs.paxos.com/stablecoin/token-contracts/pyusd
# Kadena: https://docs.kadena.io/
```

### **3. Ask Community**
```bash
# Kadena Discord: Ask for official KDA token address
# GitHub Issues: Check official repositories
```

## 📋 **Address Checklist**

- [x] **PYUSD Mainnet**: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- [x] **PYUSD Sepolia**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- [ ] **KDA Mainnet**: `0x...` (Need to find)
- [ ] **KDA Testnet**: `0x...` (Need to find)
- [ ] **Your Contract Addresses**: (After deployment)

## 🎯 **For Hackathon Submission**

**You can use these addresses right now:**
- ✅ **PYUSD Sepolia**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- ✅ **Mock KDA**: Use your deployed mock token for testing
- ✅ **Your Contracts**: Use the addresses from your deployment

**This is enough for your hackathon demo!** 🚀
