import * as fs from "fs";
import * as path from "path";

const TRONGRID_API = "https://api.trongrid.io";
const PLATFORM_WALLET = "TQkMkzmbnWgteGexe7AiXQtdUB3gKGxCTa"; // T-address format

interface TronDeployResult {
  txID: string;
  contract_address: string;
}

async function compileTronContract(): Promise<{ abi: any[]; bytecode: string }> {
  const compiledPath = path.join(process.cwd(), "contracts", "tron", "compiled.json");
  
  if (!fs.existsSync(compiledPath)) {
    console.log("Compiling TRON contract...");
    const { execSync } = await import("child_process");
    execSync(
      `cd contracts/tron && solc --optimize --optimize-runs 200 --combined-json abi,bin NFAMarket.sol > compiled.json`,
      { stdio: "inherit" }
    );
  }
  
  const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
  const contractData = compiled.contracts["NFAMarket.sol:NFAMarketTron"];
  
  if (!contractData) {
    throw new Error("NFAMarketTron contract not found in compiled output");
  }
  
  return {
    abi: contractData.abi,
    bytecode: contractData.bin,
  };
}

function hexToBase58(hexAddress: string): string {
  const bytes = Buffer.from(hexAddress.replace("0x", ""), "hex");
  const sha256_1 = require("crypto").createHash("sha256").update(bytes).digest();
  const sha256_2 = require("crypto").createHash("sha256").update(sha256_1).digest();
  const checksum = sha256_2.slice(0, 4);
  const addressWithChecksum = Buffer.concat([bytes, checksum]);
  
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + addressWithChecksum.toString("hex"));
  let result = "";
  
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  
  for (let i = 0; i < addressWithChecksum.length && addressWithChecksum[i] === 0; i++) {
    result = "1" + result;
  }
  
  return result;
}

async function deploy() {
  console.log("=".repeat(60));
  console.log("NFA Market TRON Contract Deployment");
  console.log("=".repeat(60));

  const privateKey = process.env.TRON_PRIVATE_KEY;
  if (!privateKey) {
    console.error("\nTRON_PRIVATE_KEY environment variable is required");
    console.log("\nTo deploy on TRON:");
    console.log("1. Install TronLink wallet");
    console.log("2. Export your private key (hex format without 0x prefix)");
    console.log("3. Set TRON_PRIVATE_KEY as an environment variable");
    console.log("4. Make sure your wallet has TRX for gas fees");
    process.exit(1);
  }

  // Compile contract
  console.log("\nCompiling contract...");
  const { abi, bytecode } = await compileTronContract();
  console.log("Contract compiled successfully");

  // Get account info
  const accountRes = await fetch(`${TRONGRID_API}/wallet/getaccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: privateKey.slice(0, 42), // This would need proper key derivation
      visible: true,
    }),
  });

  console.log("\nDeployment requires TronWeb or TronLink.");
  console.log("For TRON mainnet deployment, use one of these methods:");
  console.log("\n1. TronIDE: https://www.tronide.io/");
  console.log("   - Import NFAMarket.sol");
  console.log("   - Connect TronLink wallet");
  console.log("   - Deploy with constructor parameter: <platform_wallet>");
  console.log("\n2. TronScan Contract Deployment:");
  console.log("   - https://tronscan.org/#/contracts/contract-compiler");
  console.log("   - Upload and compile contract");
  console.log("   - Deploy using TronLink");

  console.log("\n" + "=".repeat(60));
  console.log("Contract ABI and Bytecode saved for manual deployment");
  console.log("=".repeat(60));

  // Save deployment info
  const deploymentInfo = {
    abi,
    bytecode,
    platformWallet: PLATFORM_WALLET,
    network: "TRON Mainnet",
    instructions: "Deploy using TronIDE or TronScan with TronLink wallet",
  };

  const outputPath = path.join(process.cwd(), "contracts", "tron", "deployment-ready.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${outputPath}`);
}

deploy().catch(console.error);
