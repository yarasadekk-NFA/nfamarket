const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("Deploying NFAMarket contract...");
  console.log("Network:", network);
  console.log("Deployer address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH/BNB");
  
  if (balance === 0n) {
    console.error("ERROR: Deployer wallet has no funds!");
    console.log("\nTo get testnet funds:");
    console.log("- Sepolia ETH: https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("- Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    console.log("- BNB Testnet: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  console.log("Platform wallet:", platformWallet);

  const NFAMarket = await hre.ethers.getContractFactory("NFAMarket");
  const nfaMarket = await NFAMarket.deploy(platformWallet);
  
  await nfaMarket.waitForDeployment();
  
  const contractAddress = await nfaMarket.getAddress();
  console.log("\n✅ NFAMarket deployed successfully!");
  console.log("Contract address:", contractAddress);
  
  const networkToEnvVar = {
    sepolia: "VITE_ETH_CONTRACT_ADDRESS",
    baseSepolia: "VITE_BASE_CONTRACT_ADDRESS", 
    bnbTestnet: "VITE_BNB_CONTRACT_ADDRESS",
    ethereum: "VITE_ETH_CONTRACT_ADDRESS",
    base: "VITE_BASE_CONTRACT_ADDRESS",
    bnb: "VITE_BNB_CONTRACT_ADDRESS"
  };

  const envVar = networkToEnvVar[network];
  console.log(`\nSet this environment variable in your .env file:`);
  console.log(`${envVar}=${contractAddress}`);

  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  let deployments = {};
  
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }
  
  deployments[network] = {
    address: contractAddress,
    deployer: deployer.address,
    platformWallet: platformWallet,
    timestamp: new Date().toISOString(),
    transactionHash: nfaMarket.deploymentTransaction()?.hash
  };
  
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\nDeployment info saved to contracts/deployments.json");

  if (network === "sepolia" || network === "baseSepolia" || network === "bnbTestnet") {
    console.log("\n🔗 View on block explorer:");
    const explorers = {
      sepolia: `https://sepolia.etherscan.io/address/${contractAddress}`,
      baseSepolia: `https://sepolia.basescan.org/address/${contractAddress}`,
      bnbTestnet: `https://testnet.bscscan.com/address/${contractAddress}`
    };
    console.log(explorers[network]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
