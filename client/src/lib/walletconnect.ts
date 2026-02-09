import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, base, bsc } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const metadata = {
  name: 'NFA Market',
  description: 'Multi-chain AI Agent Marketplace - Trade Non-Fungible Agents',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nfamarket.io',
  icons: ['/favicon.png']
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, base, bsc];

let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function initAppKit() {
  if (!projectId) {
    console.warn('[WalletConnect] No project ID configured. WalletConnect will be disabled.');
    return null;
  }

  if (appKitInstance) {
    return appKitInstance;
  }

  try {
    appKitInstance = createAppKit({
      adapters: [new EthersAdapter()],
      networks,
      projectId,
      metadata,
      features: {
        analytics: true,
        email: true,
        socials: ['google', 'github', 'discord'],
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#a855f7',
        '--w3m-border-radius-master': '4px',
      }
    });

    console.log('[WalletConnect] AppKit initialized successfully');
    return appKitInstance;
  } catch (error) {
    console.error('[WalletConnect] Failed to initialize AppKit:', error);
    return null;
  }
}

export function isWalletConnectEnabled(): boolean {
  return !!projectId && projectId.length > 0;
}

export { projectId, networks };
