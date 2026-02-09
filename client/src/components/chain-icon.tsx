import type { Chain } from "@shared/schema";
import { SiEthereum, SiBinance, SiSolana } from "react-icons/si";

interface ChainIconProps {
  chain: Chain;
  size?: number;
  className?: string;
}

export function ChainIcon({ chain, size = 20, className = "" }: ChainIconProps) {
  const iconProps = { size, className };
  
  switch (chain) {
    case "eth":
      return <SiEthereum {...iconProps} style={{ color: "#627EEA" }} />;
    case "base":
      return (
        <div 
          className={`flex items-center justify-center rounded-full ${className}`}
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: "#0052FF",
            fontSize: size * 0.6,
            color: "white",
            fontWeight: "bold"
          }}
        >
          B
        </div>
      );
    case "sol":
      return <SiSolana {...iconProps} style={{ color: "#9945FF" }} />;
    case "bnb":
      return <SiBinance {...iconProps} style={{ color: "#F0B90B" }} />;
    case "trx":
      return (
        <div 
          className={`flex items-center justify-center rounded-full ${className}`}
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: "#FF0013",
            fontSize: size * 0.5,
            color: "white",
            fontWeight: "bold"
          }}
        >
          T
        </div>
      );
    default:
      return null;
  }
}

export function ChainBadge({ chain, showName = true }: { chain: Chain; showName?: boolean }) {
  const chainInfo: Record<Chain, { name: string; symbol: string }> = {
    eth: { name: "Ethereum", symbol: "ETH" },
    base: { name: "Base", symbol: "ETH" },
    sol: { name: "Solana", symbol: "SOL" },
    bnb: { name: "BNB Chain", symbol: "BNB" },
    trx: { name: "TRON", symbol: "TRX" },
  };

  return (
    <div className="flex items-center gap-1.5">
      <ChainIcon chain={chain} size={16} />
      {showName && (
        <span className="text-xs font-medium text-muted-foreground">
          {chainInfo[chain].name}
        </span>
      )}
    </div>
  );
}
