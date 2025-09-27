
import '@kadena/hardhat-chainweb';
import "@nomicfoundation/hardhat-toolbox";

const deployerKey = process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const accounts = deployerKey ? [deployerKey] : [];

module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  chainweb: {
    hardhat: {
      chains: 2,
      logging: "info",
      networkOptions: {
        forking: {
          url: `https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc`,
          enabled: process.env.TESTNET_FORKING_ENABLED === "true",
        },
      },
    },
    testnet: {
      type: "external",
      chains: 5,
      accounts: accounts,
      chainIdOffset: 5920,
      chainwebChainIdOffset: 20,
      externalHostUrl:
        "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet",
      etherscan: {
        apiKey: "abc", // Any non-empty string works for Blockscout
        apiURLTemplate:
          "https://chain-{cid}.evm-testnet-blockscout.chainweb.com/api/",
        browserURLTemplate:
          "https://chain-{cid}.evm-testnet-blockscout.chainweb.com",
      },
    },
  },
};
