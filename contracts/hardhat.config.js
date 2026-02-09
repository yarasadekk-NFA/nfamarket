require("@nomicfoundation/hardhat-toolbox");

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 11155111
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 84532
    },
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 97
    },
    ethereum: {
      url: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 1
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 8453
    },
    bnb: {
      url: process.env.BNB_RPC_URL || "https://bsc-dataseed.binance.org",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 56
    }
  },
  paths: {
    sources: "./evm",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
