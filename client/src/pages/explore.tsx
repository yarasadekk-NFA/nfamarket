import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AgentCard, AgentCardSkeleton } from "@/components/agent-card";
import { ChainIcon } from "@/components/chain-icon";
import { Search, SlidersHorizontal, Grid3X3, LayoutList, X, Shell, Loader2, Download, CalendarDays, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import type { Agent, Chain, RentalListing } from "@shared/schema";

const capabilities = ["Trading", "Analysis", "Coding", "Art", "Writing", "Data", "Research"];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState<Chain | "all">("all");
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [moltbookUsername, setMoltbookUsername] = useState("");
  const [importChain, setImportChain] = useState<Chain>("eth");
  const { toast } = useToast();
  const { t } = useTranslation();

  const chains: { id: Chain | "all"; name: string; disabled?: boolean }[] = [
    { id: "all", name: t("explore.allChains") },
    { id: "eth", name: "Ethereum" },
    { id: "base", name: "Base" },
    { id: "sol", name: "Solana" },
    { id: "bnb", name: "BNB Chain" },
    { id: "trx", name: t("explore.tronComingSoon"), disabled: true },
  ];

  const modelTypes = [t("explore.allModels"), "GPT-4", "Claude", "Llama", "Mistral", "Custom"];
  const sortOptions = [
    { value: "recent", label: t("explore.recentlyAdded") },
    { value: "price-low", label: t("explore.priceLowHigh") },
    { value: "price-high", label: t("explore.priceHighLow") },
    { value: "popular", label: t("explore.mostPopular") },
  ];

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/moltbook/import", {
        moltbookUsername,
        chain: importChain,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("explore.agentImported"),
        description: `Successfully imported ${moltbookUsername} from Moltbook`,
      });
      setImportDialogOpen(false);
      setMoltbookUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
    onError: (error) => {
      toast({
        title: t("explore.importFailed"),
        description: error instanceof Error ? error.message : "Failed to import agent",
        variant: "destructive",
      });
    },
  });

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents", selectedChain, selectedModel, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedChain !== "all") params.append("chain", selectedChain);
      if (selectedModel !== "All Models") params.append("modelType", selectedModel);
      if (searchQuery) params.append("search", searchQuery);
      if (sortBy) params.append("sort", sortBy);
      
      const response = await fetch(`/api/agents?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
  });

  const { data: rentalListings, isLoading: rentalsLoading } = useQuery<RentalListing[]>({
    queryKey: ["/api/rentals", "available"],
    queryFn: async () => {
      const response = await fetch("/api/rentals?status=available");
      if (!response.ok) throw new Error("Failed to fetch rentals");
      return response.json();
    },
    enabled: listingType === "rent",
  });

  const toggleCapability = (cap: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedChain("all");
    setSelectedModel("All Models");
    setSelectedCapabilities([]);
    setSortBy("recent");
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedChain !== "all" || 
    selectedModel !== "All Models" || 
    selectedCapabilities.length > 0;

  const demoAgents = [
    {
      id: "1",
      name: "Neural Trader Pro",
      description: "Advanced trading agent with real-time market analysis and automated execution capabilities.",
      imageUrl: "/images/agent-1.png",
      chain: "eth" as Chain,
      price: "0.85",
      currency: "ETH",
      capabilities: ["Trading", "Analysis", "Automation"],
      modelType: "GPT-4",
      totalSales: 234,
      creatorName: "CryptoMaster",
    },
    {
      id: "2",
      name: "Code Wizard",
      description: "Expert coding assistant that helps with debugging, code review, and full-stack development.",
      imageUrl: "/images/agent-2.png",
      chain: "base" as Chain,
      price: "0.45",
      currency: "ETH",
      capabilities: ["Coding", "Analysis", "Research"],
      modelType: "Claude",
      totalSales: 189,
      creatorName: "DevPro",
    },
    {
      id: "3",
      name: "Artisan AI",
      description: "Creative AI agent specializing in digital art, illustrations, and visual content generation.",
      imageUrl: "/images/agent-3.png",
      chain: "sol" as Chain,
      price: "12.5",
      currency: "SOL",
      capabilities: ["Art", "Writing", "Creative"],
      modelType: "Custom",
      totalSales: 567,
      creatorName: "ArtisticMind",
    },
    {
      id: "4",
      name: "Data Oracle",
      description: "Powerful data analysis agent with advanced statistical modeling and visualization.",
      imageUrl: "/images/agent-4.png",
      chain: "bnb" as Chain,
      price: "0.8",
      currency: "BNB",
      capabilities: ["Data", "Analysis", "Research"],
      modelType: "Llama",
      totalSales: 123,
      creatorName: "DataGenius",
    },
    {
      id: "5",
      name: "Guardian Agent",
      description: "Security-focused agent for smart contract auditing and vulnerability detection.",
      imageUrl: "/images/agent-5.png",
      chain: "trx" as Chain,
      price: "1500",
      currency: "TRX",
      capabilities: ["Analysis", "Research", "Security"],
      modelType: "Mistral",
      totalSales: 78,
      creatorName: "SecureAI",
    },
    {
      id: "6",
      name: "Market Sentinel",
      description: "24/7 market monitoring agent with alerts and trend detection across multiple exchanges.",
      imageUrl: "/images/agent-1.png",
      chain: "eth" as Chain,
      price: "1.2",
      currency: "ETH",
      capabilities: ["Trading", "Analysis", "Monitoring"],
      modelType: "GPT-4",
      totalSales: 345,
      creatorName: "TradeWatch",
    },
  ];

  const displayAgents = !isLoading && agents && agents.length > 0 ? agents : (isLoading ? [] : demoAgents);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">{t("explore.title")}</h1>
              <p className="mt-2 text-muted-foreground">
                {t("explore.subtitle")}
              </p>
            </div>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-import-moltbook">
                  <Shell className="h-4 w-4" />
                  {t("explore.importFromMoltbook")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shell className="h-5 w-5 text-orange-500" />
                    {t("explore.importMoltbookAgent")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("explore.importMoltbookAgentDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("explore.moltbookUsername")}</label>
                    <Input
                      placeholder="e.g., KanjiBot, PincerProtocol"
                      value={moltbookUsername}
                      onChange={(e) => setMoltbookUsername(e.target.value)}
                      data-testid="input-moltbook-username"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("explore.moltbookUsernameHint")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blockchain</label>
                    <Select value={importChain} onValueChange={(v) => setImportChain(v as Chain)}>
                      <SelectTrigger data-testid="select-import-chain">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eth">Ethereum</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="sol">Solana</SelectItem>
                        <SelectItem value="bnb">BNB Chain</SelectItem>
                        <SelectItem value="trx">TRON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => importMutation.mutate()}
                    disabled={!moltbookUsername || importMutation.isPending}
                    data-testid="button-confirm-import"
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Import Agent
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <Tabs value={listingType} onValueChange={(v) => setListingType(v as "sale" | "rent")} className="mb-6">
          <TabsList>
            <TabsTrigger value="sale" className="gap-2" data-testid="tab-for-sale">
              <ShoppingCart className="h-4 w-4" />
              {t("explore.forSale")}
            </TabsTrigger>
            <TabsTrigger value="rent" className="gap-2" data-testid="tab-for-rent">
              <CalendarDays className="h-4 w-4" />
              {t("explore.forRent")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col lg:flex-row gap-8">
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 shrink-0"
              >
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{t("explore.filters")}</h3>
                    {hasActiveFilters && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        data-testid="button-clear-filters"
                      >
                        {t("explore.clearAll")}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("explore.chain")}</label>
                      <div className="space-y-1">
                        {chains.map((chain) => (
                          <Button
                            key={chain.id}
                            variant={selectedChain === chain.id ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => setSelectedChain(chain.id)}
                            data-testid={`filter-chain-${chain.id}`}
                          >
                            {chain.id !== "all" && <ChainIcon chain={chain.id as Chain} size={16} />}
                            {chain.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("explore.modelType")}</label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger data-testid="select-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelTypes.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("explore.capabilities")}</label>
                      <div className="flex flex-wrap gap-2">
                        {capabilities.map((cap) => (
                          <Badge
                            key={cap}
                            variant={selectedCapabilities.includes(cap) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleCapability(cap)}
                            data-testid={`filter-cap-${cap.toLowerCase()}`}
                          >
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.aside>
            )}
          </AnimatePresence>

          <main className="flex-1">
            <Card className="p-4 mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("explore.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-explore"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                    data-testid="button-toggle-filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="hidden sm:flex border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      data-testid="button-view-grid"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      data-testid="button-view-list"
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{t("explore.activeFilters")}</span>
                  {selectedChain !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {chains.find(c => c.id === selectedChain)?.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedChain("all")}
                      />
                    </Badge>
                  )}
                  {selectedModel !== "All Models" && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedModel}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedModel("All Models")}
                      />
                    </Badge>
                  )}
                  {selectedCapabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="gap-1">
                      {cap}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleCapability(cap)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {listingType === "sale" ? (
              <>
                {isLoading ? (
                  <div className={`grid gap-6 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <AgentCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className={`grid gap-6 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    {displayAgents.map((agent, index) => (
                      <AgentCard
                        key={agent.id}
                        agent={{
                          id: agent.id,
                          name: agent.name,
                          description: agent.description,
                          imageUrl: agent.imageUrl,
                          chain: agent.chain,
                          price: (agent as any).price,
                          currency: (agent as any).currency,
                          capabilities: agent.capabilities,
                          modelType: agent.modelType || "GPT-4",
                          totalSales: agent.totalSales,
                          creatorName: (agent as any).creatorName,
                        }}
                        index={index}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && displayAgents.length === 0 && (
                  <Card className="p-12 text-center border-border/50 bg-card/50">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{t("explore.noAgentsFound")}</h3>
                    <p className="mt-2 text-muted-foreground">
                      {t("explore.adjustFilters")}
                    </p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      {t("explore.clearFilters")}
                    </Button>
                  </Card>
                )}
              </>
            ) : (
              <>
                {rentalsLoading ? (
                  <div className={`grid gap-6 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <AgentCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (rentalListings || []).length > 0 ? (
                  <div className={`grid gap-6 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    {(rentalListings || []).map((rental, index) => (
                      <motion.div
                        key={rental.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/agent/${rental.agentId}`}>
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover-elevate cursor-pointer" data-testid={`card-rental-${rental.id}`}>
                            <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                              <CalendarDays className="h-16 w-16 text-purple-500/50" />
                              <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0">
                                {t("explore.forRent")}
                              </Badge>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg">Agent #{rental.agentId.slice(0, 8)}</h3>
                              <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                                  {rental.pricePerDay}
                                </span>
                                <span className="text-muted-foreground">{rental.currency}{t("explore.perDay")}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>{rental.minDays}-{rental.maxDays} days</span>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center border-border/50 bg-card/50">
                    <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 w-fit mx-auto mb-4">
                      <CalendarDays className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold">{t("explore.noRentals")}</h3>
                    <p className="mt-2 text-muted-foreground">
                      {t("explore.noRentalsDesc")}
                    </p>
                    <Button variant="outline" onClick={() => setListingType("sale")} className="mt-4" data-testid="button-switch-to-sale">
                      View Agents For Sale
                    </Button>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
