import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentCard } from "@/components/agent-card";
import { StatsCard } from "@/components/stats-card";
import { ChainIcon } from "@/components/chain-icon";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useTranslation } from "@/lib/i18n";
import { EVMBlockchainService } from "@/lib/blockchain";
import { SolanaBlockchainService } from "@/lib/solana";
import { TronBlockchainService } from "@/lib/tron";
import { 
  Bot, 
  Rocket, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowRight,
  Shield,
  Cpu,
  Globe,
  Shell,
  Download,
  Loader2,
  ExternalLink,
  Wallet,
  Flame,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import type { Agent, Chain } from "@shared/schema";

const chains: Chain[] = ["eth", "base", "sol", "bnb", "trx"];

export default function HomePage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [moltbookUsername, setMoltbookUsername] = useState("");
  const [importChain, setImportChain] = useState<Chain>("eth");
  const [mintOnChain, setMintOnChain] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  const { address, isConnected, chain: walletChain, connect } = useWallet();
  const { t } = useTranslation();

  const { data: featuredAgents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/featured"],
  });

  const { data: trendingAgents, isLoading: trendingLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/trending"],
    queryFn: async () => {
      const res = await fetch("/api/agents/trending?limit=4");
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
  });

  const { data: stats } = useQuery<{
    totalAgents: number;
    totalVolume: string;
    totalUsers: number;
    totalTransactions: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/moltbook/import", {
        moltbookUsername,
        chain: importChain,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      if (mintOnChain && isConnected) {
        setIsMinting(true);
        try {
          toast({
            title: t("home.mintingOnChain"),
            description: t("home.confirmTransaction"),
          });
          
          const evmChains = ["eth", "base", "bnb"];
          if (evmChains.includes(importChain)) {
            const blockchainService = new EVMBlockchainService(importChain as "eth" | "base" | "bnb");
            await blockchainService.connect();
            const result = await blockchainService.mintAgent(
              data.agent.name,
              data.agent.description,
              data.agent.capabilities || ["Chat", "Automation"],
              data.agent.modelType || "GPT-4",
              `ipfs://nfa-market/${data.agent.id}`
            );
            toast({
              title: t("home.mintedOnChain"),
              description: `Token ID: ${result.tokenId}`,
            });
          } else if (importChain === "sol") {
            const solanaService = new SolanaBlockchainService();
            await solanaService.connect();
            const result = await solanaService.mintAgent(
              data.agent.name,
              data.agent.description,
              data.agent.imageUrl || "/images/moltbook-agent.png",
              data.agent.capabilities || ["Chat", "Automation"],
              data.agent.modelType || "GPT-4"
            );
            toast({
              title: t("home.mintedOnSolana"),
              description: `Mint address: ${result.mint}`,
            });
          } else if (importChain === "trx") {
            const tronService = new TronBlockchainService();
            await tronService.connect();
            const result = await tronService.mintAgent(
              data.agent.name,
              data.agent.description,
              data.agent.modelType || "GPT-4",
              `ipfs://nfa-market/${data.agent.id}`
            );
            toast({
              title: t("home.mintedOnTRON"),
              description: `Token ID: ${result.tokenId}`,
            });
          }
        } catch (mintError) {
          console.error("Minting error:", mintError);
          toast({
            title: t("home.mintingFailed"),
            description: mintError instanceof Error ? mintError.message : t("home.mintingFailedDesc"),
            variant: "destructive",
          });
        } finally {
          setIsMinting(false);
        }
      } else {
        toast({
          title: t("home.agentImported"),
          description: `Successfully imported ${moltbookUsername} from Moltbook`,
        });
      }
      
      setImportDialogOpen(false);
      setMoltbookUsername("");
      setMintOnChain(false);
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/featured"] });
    },
    onError: (error) => {
      toast({
        title: t("home.importFailed"),
        description: error instanceof Error ? error.message : t("home.importFailedDesc"),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-6 px-4 py-2 text-sm" variant="secondary">
              <Zap className="w-4 h-4 mr-2" />
              {t("home.badge")}
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t("home.title1")}
              </span>
              <br />
              <span className="text-foreground">
                {t("home.title2")}
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore">
                <Button size="lg" className="gap-2 px-8" data-testid="button-explore-hero">
                  <Rocket className="w-5 h-5" />
                  {t("home.exploreAgents")}
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg" variant="outline" className="gap-2 px-8" data-testid="button-create-hero">
                  <Bot className="w-5 h-5" />
                  {t("home.createAgent")}
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6">
              <p className="text-sm text-muted-foreground">{t("home.supportedChains")}</p>
              <div className="flex items-center gap-3">
                {chains.map((chain) => (
                  <div 
                    key={chain} 
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors relative"
                  >
                    <ChainIcon chain={chain} size={24} />
                    {chain === "trx" && (
                      <span className="absolute -top-2 -right-2 text-[8px] bg-orange-500 text-white px-1 rounded-full">
                        {t("home.soon")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-orange-500/10 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden mb-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 via-orange-600/60 to-primary/80" />
            <img 
              src="/images/nfa-market-moltbook-banner.png" 
              alt="NFA Market x Moltbook Integration" 
              className="w-full h-48 md:h-64 object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
              <Badge className="mb-4 px-4 py-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Shell className="w-4 h-4 mr-2" />
                {t("home.officialIntegration")}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold drop-shadow-lg">
                {t("home.moltbookTitle")}
              </h2>
              <p className="mt-3 text-lg md:text-xl text-white/90 max-w-2xl drop-shadow">
                {t("home.moltbookSubtitle")}
              </p>
              <div className="mt-4 flex items-center gap-6 text-2xl md:text-3xl font-bold">
                <div className="flex flex-col items-center">
                  <span className="text-orange-200">1.6M+</span>
                  <span className="text-sm text-white/70 font-normal">{t("home.aiAgents")}</span>
                </div>
                <div className="w-px h-12 bg-white/30" />
                <div className="flex flex-col items-center">
                  <span className="text-orange-200">{t("home.crossPlatform")}</span>
                  <span className="text-sm text-white/70 font-normal">{t("home.reputation")}</span>
                </div>
                <div className="w-px h-12 bg-white/30" />
                <div className="flex flex-col items-center">
                  <span className="text-orange-200">{t("home.live")}</span>
                  <span className="text-sm text-white/70 font-normal">{t("home.activitySync")}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/50 transition-colors h-full">
                <Download className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg">{t("home.oneClickImport")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("home.oneClickImportDesc")}
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/50 transition-colors h-full">
                <TrendingUp className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg">{t("home.reputationSync")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("home.reputationSyncDesc")}
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/50 transition-colors h-full">
                <ExternalLink className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg">{t("home.activitySyncTitle")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("home.activitySyncDesc")}
                </p>
              </Card>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center mt-10 gap-4">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600" data-testid="button-import-moltbook-home">
                  <Shell className="w-5 h-5" />
                  {t("home.importFromMoltbook")}
                </Button>
              </DialogTrigger>
              <DialogContent className="border-orange-500/30">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shell className="h-5 w-5 text-orange-500" />
                    {t("home.importMoltbookAgent")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("home.importMoltbookAgentDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("home.moltbookUsername")}</label>
                    <Input
                      placeholder="e.g., KanjiBot, PincerProtocol"
                      value={moltbookUsername}
                      onChange={(e) => setMoltbookUsername(e.target.value)}
                      className="border-orange-500/30 focus:border-orange-500"
                      data-testid="input-moltbook-username-home"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("home.blockchain")}</label>
                    <Select value={importChain} onValueChange={(v) => setImportChain(v as Chain)}>
                      <SelectTrigger data-testid="select-import-chain-home" className="border-orange-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eth" data-testid="select-item-eth">Ethereum</SelectItem>
                        <SelectItem value="base" data-testid="select-item-base">Base</SelectItem>
                        <SelectItem value="sol" data-testid="select-item-sol">Solana</SelectItem>
                        <SelectItem value="bnb" data-testid="select-item-bnb">BNB Chain</SelectItem>
                        <SelectItem value="trx" data-testid="select-item-trx" disabled>TRON (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="rounded-lg border border-orange-500/30 p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="mint-onchain" 
                        checked={mintOnChain}
                        onCheckedChange={(checked) => setMintOnChain(checked === true)}
                        disabled={!isConnected}
                        data-testid="checkbox-mint-onchain"
                      />
                      <Label htmlFor="mint-onchain" className="text-sm font-medium cursor-pointer">
                        {t("home.mintOnChain")}
                      </Label>
                    </div>
                    
                    {!isConnected ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        <span>{t("wallet.connectToMint")}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="ml-auto border-orange-500/30"
                          onClick={() => connect("eth")}
                          data-testid="button-connect-wallet-import"
                        >
                          {t("nav.connect")}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Connected: {address?.slice(0, 6)}...{address?.slice(-4)} • {t("home.gasFeesApply")}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
                    onClick={() => importMutation.mutate()}
                    disabled={!moltbookUsername || importMutation.isPending || isMinting}
                    data-testid="button-confirm-import-home"
                  >
                    {importMutation.isPending || isMinting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isMinting ? t("home.minting") : mintOnChain ? t("home.importAndMint") : t("home.importAgent")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10">
                <ExternalLink className="w-5 h-5" />
                {t("home.visitMoltbook")}
              </Button>
            </a>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("home.deepLinkText")}{" "}
            <Link href="/moltbook/example" className="text-orange-500 hover:underline">
              {t("home.deepLink")}
            </Link>
            {" "}{t("home.deepLinkSuffix")}
          </p>
        </div>
      </section>

      <section className="py-16 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title={t("home.totalAgents")}
              value={stats?.totalAgents?.toLocaleString() || "1,234"}
              change={`+12% ${t("home.thisWeek")}`}
              changeType="positive"
              icon={Bot}
              index={0}
            />
            <StatsCard
              title={t("home.tradingVolume")}
              value={stats?.totalVolume || "$2.4M"}
              change={`+8% ${t("home.thisWeek")}`}
              changeType="positive"
              icon={TrendingUp}
              index={1}
            />
            <StatsCard
              title={t("home.activeTraders")}
              value={stats?.totalUsers?.toLocaleString() || "5,678"}
              change={`+15% ${t("home.thisWeek")}`}
              changeType="positive"
              icon={Users}
              index={2}
            />
            <StatsCard
              title={t("home.transactions")}
              value={stats?.totalTransactions?.toLocaleString() || "12,345"}
              change={`+20% ${t("home.thisWeek")}`}
              changeType="positive"
              icon={Zap}
              index={3}
            />
          </div>
        </div>
      </section>

      {(trendingAgents && trendingAgents.length > 0 || trendingLoading) && (
        <section className="py-20" data-testid="section-trending">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                    {t("home.trendingNow")}
                  </span>
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("home.trendingDesc")}
                </p>
              </div>
              <Link href="/leaderboard">
                <Button variant="ghost" className="gap-2" data-testid="button-view-leaderboard">
                  <Trophy className="w-4 h-4" />
                  {t("home.viewLeaderboard")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="aspect-square bg-muted animate-pulse" />
                ))
              ) : (
                trendingAgents?.slice(0, 4).map((agent, index) => (
                  <AgentCard
                    key={agent.id}
                    agent={{
                      ...agent,
                      modelType: agent.modelType || "GPT-4",
                    }}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold">{t("home.featuredAgents")}</h2>
              <p className="mt-2 text-muted-foreground">
                {t("home.featuredDesc")}
              </p>
            </div>
            <Link href="/explore">
              <Button variant="ghost" className="gap-2" data-testid="button-view-all">
                {t("home.viewAll")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="aspect-square bg-muted animate-pulse" />
              ))
            ) : featuredAgents && featuredAgents.length > 0 ? (
              featuredAgents.slice(0, 4).map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={{
                    ...agent,
                    price: "0.5",
                    currency: "ETH",
                    modelType: agent.modelType || "GPT-4",
                  }}
                  index={index}
                />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <AgentCard
                  key={i}
                  agent={{
                    id: `demo-${i + 1}`,
                    name: ["Neural Trader", "Code Assistant", "Art Generator", "Data Analyst"][i],
                    description: "A powerful AI agent designed to help you with complex tasks and automate your workflow efficiently.",
                    imageUrl: `/images/agent-${i + 1}.png`,
                    chain: chains[i % chains.length],
                    price: ["0.5", "0.8", "1.2", "0.3"][i],
                    currency: ["ETH", "ETH", "SOL", "BNB"][i],
                    capabilities: ["Analysis", "Trading", "Automation"],
                    modelType: ["GPT-4", "Claude", "Llama", "Mistral"][i],
                    totalSales: [124, 89, 256, 45][i],
                    creatorName: ["CryptoAI", "DevMaster", "ArtisticAI", "DataPro"][i],
                  }}
                  index={i}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("home.whyNFA")}</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              {t("home.whyNFADesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t("home.lowFees"),
                description: t("home.lowFeesDesc")
              },
              {
                icon: Globe,
                title: t("home.multiChain"),
                description: t("home.multiChainDesc")
              },
              {
                icon: Cpu,
                title: t("home.smartContracts"),
                description: t("home.smartContractsDesc")
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-8 lg:p-16">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
            </div>
            
            <div className="relative text-center">
              <h2 className="text-3xl lg:text-4xl font-bold">
                {t("home.readyToCreate")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("home.readyToCreateDesc")}
              </p>
              <Link href="/create">
                <Button size="lg" className="mt-8 gap-2 px-8" data-testid="button-create-cta">
                  <Bot className="w-5 h-5" />
                  {t("home.startCreating")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold">NFA Market</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Platform Fee: 1%</span>
              <span>Creator Royalties: 1%</span>
            </div>

            <div className="flex items-center gap-4">
              {chains.map((chain) => (
                <ChainIcon key={chain} chain={chain} size={20} />
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 NFA Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
