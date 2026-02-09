export const TRON_PLATFORM_WALLET = import.meta.env.VITE_TRON_PLATFORM_WALLET || "TQkMkzmbnWgteGexe7AiXQtdUB3gKGxCTa";

export const TRON_CONFIG = {
  fullHost: import.meta.env.VITE_TRON_RPC_URL || "https://api.trongrid.io",
  explorerUrl: "https://tronscan.org",
  contractAddress: import.meta.env.VITE_TRON_CONTRACT_ADDRESS,
  platformWallet: TRON_PLATFORM_WALLET,
};

export class TronBlockchainService {
  private tronWeb: any = null;
  private address: string | null = null;

  async connect(): Promise<string> {
    if (typeof window === "undefined") throw new Error("Window not available");
    const tronLink = (window as any).tronLink;
    if (!tronLink) throw new Error("TronLink wallet not found. Please install TronLink.");
    const res = await tronLink.request({ method: "tron_requestAccounts" });
    if (res.code !== 200) throw new Error("Failed to connect to TronLink");
    const tronWeb = (window as any).tronWeb;
    if (!tronWeb || !tronWeb.ready) throw new Error("TronWeb not ready");
    this.tronWeb = tronWeb;
    this.address = tronWeb.defaultAddress.base58;
    return this.address!;
  }

  async getAddress(): Promise<string | null> {
    return this.address;
  }

  async getBalance(): Promise<string> {
    if (!this.tronWeb || !this.address) throw new Error("Wallet not connected");
    const balance = await this.tronWeb.trx.getBalance(this.address);
    return this.tronWeb.fromSun(balance);
  }

  async mintAgent(name: string, description: string, modelType: string, tokenURI: string): Promise<{ tokenId: string; txHash: string }> {
    if (!this.tronWeb || !this.address) throw new Error("Wallet not connected");
    if (!TRON_CONFIG.contractAddress) throw new Error("TRON contract not deployed. Set VITE_TRON_CONTRACT_ADDRESS.");
    const contract = await this.tronWeb.contract().at(TRON_CONFIG.contractAddress);
    const tx = await contract.mintAgent(name, description, modelType, tokenURI).send();
    // Wait for confirmation and extract token ID from events
    let tokenId = "0";
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const txInfo = await this.tronWeb.trx.getTransactionInfo(tx);
      if (txInfo && txInfo.log && txInfo.log.length > 0) {
        tokenId = parseInt(txInfo.log[0].topics[1], 16).toString();
      }
    } catch (e) {
      console.warn("Could not extract token ID from tx:", e);
    }
    return { tokenId, txHash: tx };
  }

  async listAgent(tokenId: string, priceInTrx: string): Promise<string> {
    if (!this.tronWeb || !this.address) throw new Error("Wallet not connected");
    if (!TRON_CONFIG.contractAddress) throw new Error("TRON contract not deployed");
    const contract = await this.tronWeb.contract().at(TRON_CONFIG.contractAddress);
    const isApproved = await contract.isApprovedForAll(this.address, TRON_CONFIG.contractAddress).call();
    if (!isApproved) {
      await contract.setApprovalForAll(TRON_CONFIG.contractAddress, true).send();
    }
    const priceInSun = this.tronWeb.toSun(priceInTrx);
    const tx = await contract.listAgent(tokenId, priceInSun).send();
    return tx;
  }

  async buyAgent(tokenId: string, priceInTrx: string): Promise<string> {
    if (!this.tronWeb || !this.address) throw new Error("Wallet not connected");
    if (!TRON_CONFIG.contractAddress) throw new Error("TRON contract not deployed");
    const contract = await this.tronWeb.contract().at(TRON_CONFIG.contractAddress);
    const priceInSun = this.tronWeb.toSun(priceInTrx);
    const tx = await contract.buyAgent(tokenId).send({ callValue: priceInSun });
    return tx;
  }

  async sendPayment(amountInTrx: string): Promise<string> {
    if (!this.tronWeb || !this.address) throw new Error("Wallet not connected");
    const amountInSun = this.tronWeb.toSun(amountInTrx);
    const tx = await this.tronWeb.trx.sendTransaction(TRON_PLATFORM_WALLET, amountInSun);
    if (!tx.result) throw new Error("TRON payment transaction failed");
    return tx.txid;
  }

  async getTransactionInfo(txHash: string): Promise<any> {
    if (!this.tronWeb) throw new Error("Wallet not connected");
    return await this.tronWeb.trx.getTransactionInfo(txHash);
  }
}
