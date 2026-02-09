import { useState, useCallback, useEffect } from "react";
import { EVMBlockchainService, SupportedChain } from "@/lib/blockchain";
import { SolanaBlockchainService } from "@/lib/solana";
import { TronBlockchainService } from "@/lib/tron";

export type WalletType = "metamask" | "phantom" | "tronlink";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chain: SupportedChain;
  walletType: WalletType | null;
  isConnecting: boolean;
  error: string | null;
}

const evmServices: Partial<Record<SupportedChain, EVMBlockchainService>> = {};
const solanaService = new SolanaBlockchainService();
const tronService = new TronBlockchainService();

function getEVMService(chain: SupportedChain): EVMBlockchainService {
  if (!evmServices[chain]) {
    evmServices[chain] = new EVMBlockchainService(chain);
  }
  return evmServices[chain]!;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chain: "eth",
    walletType: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async (chain: SupportedChain) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      let address: string;
      let walletType: WalletType;

      if (chain === "sol") {
        address = await solanaService.connect();
        walletType = "phantom";
      } else if (chain === "trx") {
        address = await tronService.connect();
        walletType = "tronlink";
      } else {
        const evmService = getEVMService(chain);
        address = await evmService.connect();
        walletType = "metamask";
      }

      setState({
        isConnected: true,
        address,
        chain,
        walletType,
        isConnecting: false,
        error: null,
      });

      localStorage.setItem("nfa_wallet_connected", JSON.stringify({ chain, address }));
      
      return address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chain: "eth",
      walletType: null,
      isConnecting: false,
      error: null,
    });
    localStorage.removeItem("nfa_wallet_connected");
  }, []);

  const switchChain = useCallback(async (newChain: SupportedChain) => {
    if (!state.isConnected) {
      setState(prev => ({ ...prev, chain: newChain }));
      return;
    }

    await connect(newChain);
  }, [state.isConnected, connect]);

  useEffect(() => {
    const saved = localStorage.getItem("nfa_wallet_connected");
    if (saved) {
      try {
        const { chain } = JSON.parse(saved) as { chain: SupportedChain; address: string };
        connect(chain).catch(() => {
          localStorage.removeItem("nfa_wallet_connected");
        });
      } catch {
        localStorage.removeItem("nfa_wallet_connected");
      }
    }
  }, [connect]);

  const getBlockchainService = useCallback(() => {
    if (state.chain === "sol") return solanaService;
    if (state.chain === "trx") return tronService;
    return getEVMService(state.chain);
  }, [state.chain]);

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
    getBlockchainService,
    shortenAddress: (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`,
  };
}
