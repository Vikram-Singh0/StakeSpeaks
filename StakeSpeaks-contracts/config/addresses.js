// Real contract addresses for PYUSD integration
const ADDRESSES = {
  // PYUSD Contract Addresses (Official Paxos)
  PYUSD_MAINNET: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // Ethereum Mainnet
  PYUSD_SEPOLIA: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", // Ethereum Sepolia Testnet

  // KDA Token Addresses (Kadena Network)
  // Get these from: https://explorer.chainweb.com/mainnet
  KDA_MAINNET: "0x0000000000000000000000000000000000000000", // Kadena Mainnet (placeholder)
  KDA_TESTNET: "0x0000000000000000000000000000000000000000", // Kadena Testnet (placeholder)

  // Mock addresses for local testing
  MOCK_KDA: "0x0000000000000000000000000000000000000000",
  MOCK_PYUSD: "0x0000000000000000000000000000000000000000",

  // Network RPC URLs
  RPC_URLS: {
    ETHEREUM_MAINNET: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    ETHEREUM_SEPOLIA: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    KADENA_TESTNET: "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc",
    KADENA_MAINNET: "https://evm.chainweb.com/chainweb/0.0/mainnet01/chain/0/evm/rpc"
  }
};

module.exports = ADDRESSES;
