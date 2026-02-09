import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { ChainIcon } from "@/components/chain-icon";
import { useWallet } from "@/hooks/use-wallet";
import { useTranslation, languageNames } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { Bot, Search, User, Menu, Sun, Moon, Wallet, ChevronDown, Loader2, Globe } from "lucide-react";
import type { Chain } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isWalletConnectEnabled } from "@/lib/walletconnect";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

const chains: { id: Chain; name: string }[] = [
  { id: "eth", name: "Ethereum" },
  { id: "base", name: "Base" },
  { id: "sol", name: "Solana" },
  { id: "bnb", name: "BNB Chain" },
  { id: "trx", name: "TRON" },
];

export function Header() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const walletConnectEnabled = isWalletConnectEnabled();
  
  const { 
    isConnected: isLegacyConnected, 
    address: legacyAddress, 
    chain, 
    isConnecting, 
    connect, 
    disconnect: legacyDisconnect, 
    switchChain,
    shortenAddress 
  } = useWallet();

  const appKit = walletConnectEnabled ? useAppKit() : null;
  const appKitAccount = walletConnectEnabled ? useAppKitAccount() : { address: undefined, isConnected: false };

  const isConnected = walletConnectEnabled ? appKitAccount.isConnected : isLegacyConnected;
  const address = walletConnectEnabled ? appKitAccount.address : legacyAddress;

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/explore", label: t("nav.explore") },
    { href: "/create", label: t("nav.create") },
    { href: "/collections", label: t("nav.collections") },
    { href: "/activity", label: t("nav.activity") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
  ];

  const moreLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/import", label: t("nav.import") },
    { href: "/analytics", label: t("nav.analytics") },
  ];

  const handleConnect = async () => {
    if (walletConnectEnabled && appKit) {
      appKit.open();
      return;
    }
    try {
      await connect(chain);
      toast({
        title: t("wallet.connected"),
        description: t("wallet.connectedTo", { name: chains.find(c => c.id === chain)?.name || "" }),
      });
    } catch (err) {
      toast({
        title: t("wallet.connectionFailed"),
        description: err instanceof Error ? err.message : t("wallet.connectionFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    if (walletConnectEnabled && appKit) {
      appKit.open();
    } else {
      legacyDisconnect();
    }
  };

  const handleChainSwitch = async (newChain: Chain) => {
    try {
      await switchChain(newChain);
      if (isConnected) {
        toast({
          title: t("wallet.networkSwitched"),
          description: t("wallet.switchedTo", { name: chains.find(c => c.id === newChain)?.name || "" }),
        });
      }
    } catch (err) {
      toast({
        title: t("wallet.switchFailed"),
        description: err instanceof Error ? err.message : t("wallet.switchFailedDesc"),
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <Bot className="h-8 w-8 text-primary" />
                <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                NFA Market
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1" data-testid="button-more-menu">
                  {t("nav.more")}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {moreLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <DropdownMenuItem data-testid={`link-nav-${link.href.replace("/", "")}`}>
                      {link.label}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("nav.search")}
              className="pl-10 bg-muted/50 border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-chain-selector">
                <ChainIcon chain={chain} size={18} />
                <span className="hidden sm:inline">{chains.find(c => c.id === chain)?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {chains.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => handleChainSwitch(c.id)}
                  className="gap-2"
                  data-testid={`menu-chain-${c.id}`}
                >
                  <ChainIcon chain={c.id} size={18} />
                  {c.name}
                  {chain === c.id && <span className="ml-auto text-primary">&#9679;</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-language-switcher">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <DropdownMenuItem
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className="gap-2"
                  data-testid={`menu-lang-${lang}`}
                >
                  {languageNames[lang]}
                  {language === lang && <span className="ml-auto text-primary">&#9679;</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-wallet-menu">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent" />
                  <span className="hidden sm:inline font-mono text-xs">{shortenAddress(address)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleDisconnect} data-testid="menu-disconnect">
                  <Wallet className="mr-2 h-4 w-4" />
                  {t("nav.disconnect")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={handleConnect} 
              className="gap-2" 
              data-testid="button-connect-wallet"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isConnecting ? t("nav.connecting") : t("nav.connect")}</span>
            </Button>
          )}

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[...navLinks, ...moreLinks].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <DropdownMenuItem>{link.label}</DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
