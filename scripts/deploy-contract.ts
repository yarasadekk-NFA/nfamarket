import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  explorer: string;
  envVar: string;
}

const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    name: "Sepolia Testnet",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    chainId: 11155111,
    explorer: "https://sepolia.etherscan.io",
    envVar: "VITE_ETH_CONTRACT_ADDRESS"
  },
  baseSepolia: {
    name: "Base Sepolia Testnet",
    rpcUrl: "https://sepolia.base.org",
    chainId: 84532,
    explorer: "https://sepolia.basescan.org",
    envVar: "VITE_BASE_CONTRACT_ADDRESS"
  },
  bnbTestnet: {
    name: "BNB Chain Testnet",
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    chainId: 97,
    explorer: "https://testnet.bscscan.com",
    envVar: "VITE_BNB_CONTRACT_ADDRESS"
  },
  ethereum: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    explorer: "https://etherscan.io",
    envVar: "VITE_ETH_CONTRACT_ADDRESS"
  },
  base: {
    name: "Base Mainnet",
    rpcUrl: "https://mainnet.base.org",
    chainId: 8453,
    explorer: "https://basescan.org",
    envVar: "VITE_BASE_CONTRACT_ADDRESS"
  },
  bnb: {
    name: "BNB Chain Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org",
    chainId: 56,
    explorer: "https://bscscan.com",
    envVar: "VITE_BNB_CONTRACT_ADDRESS"
  }
};

async function deploy(networkKey: string) {
  const network = NETWORKS[networkKey];
  if (!network) {
    console.error(`Unknown network: ${networkKey}`);
    console.log("Available networks:", Object.keys(NETWORKS).join(", "));
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY environment variable is required");
    process.exit(1);
  }

  const compiledPath = path.join(process.cwd(), "contracts", "evm", "compiled.json");
  if (!fs.existsSync(compiledPath)) {
    console.error("Compiled contract not found. Run: cd contracts/evm && solc --optimize --optimize-runs 200 --combined-json abi,bin NFAMarketSimple.sol > compiled.json");
    process.exit(1);
  }

  const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
  const contractData = compiled.contracts["NFAMarketSimple.sol:NFAMarket"];
  
  if (!contractData) {
    console.error("NFAMarket contract not found in compiled output");
    process.exit(1);
  }

  const abi = contractData.abi;
  const bytecode = "0x" + contractData.bin;

  console.log("=".repeat(60));
  console.log("NFA Market Contract Deployment");
  console.log("=".repeat(60));
  console.log(`\nNetwork: ${network.name} (${networkKey})`);

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH/BNB`);

  if (balance === 0n) {
    console.error("\nWallet has no funds!");
    console.log("\nGet testnet tokens from faucets:");
    console.log("   Sepolia: https://sepoliafaucet.com");
    console.log("   Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    console.log("   BNB Testnet: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  const platformWallet = "0x0eF386A46cDBb9393b5a4d64A6Eca051a95037b3";
  console.log(`Platform Wallet: ${platformWallet}`);

  console.log("\nDeploying contract...");

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // Get current gas price and set appropriate gas limit
  const feeData = await provider.getFeeData();
  console.log(`Gas Price: ${ethers.formatUnits(feeData.gasPrice || 0n, 'gwei')} gwei`);
  
  const deployOptions: any = {
    gasLimit: 2500000, // Contract deployment needs ~2M gas
  };
  
  // For Ethereum, use EIP-1559 pricing
  if (networkKey === "ethereum" && feeData.maxFeePerGas) {
    deployOptions.maxFeePerGas = feeData.maxFeePerGas;
    deployOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  }
  
  const contract = await factory.deploy(platformWallet, deployOptions);
  
  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  console.log("Waiting for confirmation...");
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log(`\nContract Address: ${contractAddress}`);
  console.log(`Explorer: ${network.explorer}/address/${contractAddress}`);
  
  console.log(`\nSet this environment variable:`);
  console.log(`   ${network.envVar}=${contractAddress}`);

  const deploymentsPath = path.join(process.cwd(), "contracts", "deployments.json");
  let deployments: Record<string, any> = {};
  
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }
  
  deployments[networkKey] = {
    address: contractAddress,
    deployer: wallet.address,
    platformWallet,
    timestamp: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash
  };
  
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`\nSaved to contracts/deployments.json`);
}

const network = process.argv[2] || "sepolia";
deploy(network).catch(console.error);
