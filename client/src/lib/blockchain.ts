import { ethers } from "ethers";

export type SupportedChain = "eth" | "base" | "sol" | "bnb" | "trx";

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contractAddress?: string;
  platformWallet: string;
}

export const EVM_PLATFORM_WALLET = import.meta.env.VITE_PLATFORM_WALLET || "0x0eF386A46cDBb9393b5a4d64A6Eca051a95037b3";

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  eth: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: import.meta.env.VITE_ETH_RPC_URL || "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contractAddress: import.meta.env.VITE_ETH_CONTRACT_ADDRESS,
    platformWallet: EVM_PLATFORM_WALLET,
  },
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contractAddress: import.meta.env.VITE_BASE_CONTRACT_ADDRESS,
    platformWallet: EVM_PLATFORM_WALLET,
  },
  bnb: {
    chainId: 56,
    name: "BNB Smart Chain",
    rpcUrl: import.meta.env.VITE_BNB_RPC_URL || "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    contractAddress: import.meta.env.VITE_BNB_CONTRACT_ADDRESS,
    platformWallet: EVM_PLATFORM_WALLET,
  },
};

const NFA_MARKET_ABI = [
  "function mintAgent(string name, string description, string[] capabilities, string modelType, string tokenURI) returns (uint256)",
  "function listAgent(uint256 tokenId, uint256 price)",
  "function delistAgent(uint256 tokenId)",
  "function buyAgent(uint256 tokenId) payable",
  "function getAgentMetadata(uint256 tokenId) view returns (tuple(string name, string description, string[] capabilities, string modelType, address creator))",
  "function getListing(uint256 tokenId) view returns (tuple(address seller, uint256 price, bool active))",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "event AgentMinted(uint256 indexed tokenId, address indexed creator, string name)",
  "event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event AgentSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
];

export class EVMBlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private chain: SupportedChain;

  constructor(chain: SupportedChain = "eth") {
    this.chain = chain;
  }

  async connect(): Promise<string> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("MetaMask or compatible wallet not found");
    }

    this.provider = new ethers.BrowserProvider((window as any).ethereum);
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig) throw new Error(`Chain ${this.chain} not supported for EVM`);

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${chainConfig.chainId.toString(16)}`,
            chainName: chainConfig.name,
            rpcUrls: [chainConfig.rpcUrl],
            nativeCurrency: chainConfig.nativeCurrency,
            blockExplorerUrls: [chainConfig.explorerUrl],
          }],
        });
      }
    }

    this.signer = await this.provider.getSigner();
    return await this.signer.getAddress();
  }

  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async mintAgent(
    name: string,
    description: string,
    capabilities: string[],
    modelType: string,
    tokenURI: string
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig?.contractAddress) {
      throw new Error(`Contract not deployed on ${this.chain}`);
    }

    const contract = new ethers.Contract(
      chainConfig.contractAddress,
      NFA_MARKET_ABI,
      this.signer
    );

    const tx = await contract.mintAgent(name, description, capabilities, modelType, tokenURI);
    const receipt = await tx.wait();
    
    const mintEvent = receipt.logs.find(
      (log: ethers.Log) => log.topics[0] === ethers.id("AgentMinted(uint256,address,string)")
    );
    
    const tokenId = mintEvent ? ethers.toNumber(mintEvent.topics[1]) : "0";
    
    return { tokenId: tokenId.toString(), txHash: receipt.hash };
  }

  async listAgent(tokenId: string, priceInEth: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig?.contractAddress) {
      throw new Error(`Contract not deployed on ${this.chain}`);
    }

    const contract = new ethers.Contract(
      chainConfig.contractAddress,
      NFA_MARKET_ABI,
      this.signer
    );

    const isApproved = await contract.isApprovedForAll(
      await this.signer.getAddress(),
      chainConfig.contractAddress
    );

    if (!isApproved) {
      const approveTx = await contract.setApprovalForAll(chainConfig.contractAddress, true);
      await approveTx.wait();
    }

    const priceWei = ethers.parseEther(priceInEth);
    const tx = await contract.listAgent(tokenId, priceWei);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async buyAgent(tokenId: string, priceInEth: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig?.contractAddress) {
      throw new Error(`Contract not deployed on ${this.chain}`);
    }

    const contract = new ethers.Contract(
      chainConfig.contractAddress,
      NFA_MARKET_ABI,
      this.signer
    );

    const priceWei = ethers.parseEther(priceInEth);
    const tx = await contract.buyAgent(tokenId, { value: priceWei });
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async delistAgent(tokenId: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig?.contractAddress) {
      throw new Error(`Contract not deployed on ${this.chain}`);
    }

    const contract = new ethers.Contract(
      chainConfig.contractAddress,
      NFA_MARKET_ABI,
      this.signer
    );

    const tx = await contract.delistAgent(tokenId);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error("Provider not initialized");
      }
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    }
    return await this.provider.getTransactionReceipt(txHash);
  }

  async sendPayment(amountInEth: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const chainConfig = CHAIN_CONFIGS[this.chain];
    if (!chainConfig) throw new Error(`Chain ${this.chain} not supported`);

    const tx = await this.signer.sendTransaction({
      to: chainConfig.platformWallet,
      value: ethers.parseEther(amountInEth),
    });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed");
    return receipt.hash;
  }

  async getNativeBalance(): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    if (!this.provider) throw new Error("Provider not initialized");
    const balance = await this.provider.getBalance(await this.signer.getAddress());
    return ethers.formatEther(balance);
  }
}
