import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ChainIcon } from "@/components/chain-icon";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FolderOpen,
  Plus,
  Users,
  TrendingUp,
  Layers,
  X,
  Loader2,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { Collection, Agent, Chain } from "@shared/schema";

const chains: { id: Chain; name: string }[] = [
  { id: "eth", name: "Ethereum" },
  { id: "base", name: "Base" },
  { id: "sol", name: "Solana" },
  { id: "bnb", name: "BNB Chain" },
  { id: "trx", name: "TRON" },
];

function CollectionCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <div className="aspect-[16/9] bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="mt-2 h-4 w-full bg-muted rounded animate-pulse" />
        <div className="mt-3 flex gap-3">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function CollectionDetail({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<Collection & { agents: Agent[] }>({
    queryKey: ["/api/collections", collectionId],
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="col-span-full"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("collections.loading")}</span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="col-span-full"
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid={`detail-collection-${collectionId}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold" data-testid={`text-detail-name-${collectionId}`}>{data.name}</h2>
              {data.description && (
                <p className="mt-1 text-sm text-muted-foreground">{data.description}</p>
              )}
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {data.chain && (
                  <div className="flex items-center gap-1.5">
                    <ChainIcon chain={data.chain} size={14} />
                    <span className="text-xs text-muted-foreground">{data.chain.toUpperCase()}</span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {data.agentCount} {t("collections.agents")}
                </span>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} data-testid={`button-close-detail-${collectionId}`}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {data.agents && data.agents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/agent/${agent.id}`}>
                    <Card
                      className="group cursor-pointer overflow-hidden border-border/50 bg-background/50 transition-all duration-300 hover:border-primary/50"
                      data-testid={`card-collection-agent-${agent.id}`}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={agent.imageUrl}
                          alt={agent.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-2 left-2">
                          <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5">
                            <ChainIcon chain={agent.chain} size={12} />
                            <span className="text-xs">{agent.chain.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {agent.name}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {agent.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 2).map((cap) => (
                            <Badge key={cap} variant="outline" className="text-xs px-1.5 py-0">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("collections.noAgents")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CollectionsPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newChain, setNewChain] = useState<Chain | "">("");
  const { toast } = useToast();

  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: { name: string; description: string; creatorId: string; chain?: Chain } = {
        name: newName,
        description: newDescription,
        creatorId: "demo-user",
      };
      if (newChain) body.chain = newChain;
      const response = await apiRequest("POST", "/api/collections", body);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("collections.created"),
        description: `"${newName}" has been created successfully.`,
      });
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewChain("");
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
    onError: (error) => {
      toast({
        title: t("collections.creationFailed"),
        description: error instanceof Error ? error.message : "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-collections-title">{t("collections.title")}</h1>
                <p className="mt-1 text-muted-foreground">
                  {t("collections.subtitle")}
                </p>
              </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-collection">
                  <Plus className="h-4 w-4" />
                  {t("collections.createCollection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {t("collections.createCollection")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("collections.createCollectionDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("collections.name")}</label>
                    <Input
                      placeholder={t("collections.namePlaceholder")}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      data-testid="input-collection-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("collections.description")}</label>
                    <Textarea
                      placeholder={t("collections.descriptionPlaceholder")}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      data-testid="input-collection-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("collections.chainOptional")}</label>
                    <Select value={newChain} onValueChange={(v) => setNewChain(v as Chain)}>
                      <SelectTrigger data-testid="select-collection-chain">
                        <SelectValue placeholder={t("collections.anyChain")} />
                      </SelectTrigger>
                      <SelectContent>
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>
                            <div className="flex items-center gap-2">
                              <ChainIcon chain={chain.id} size={16} />
                              {chain.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    data-testid="button-submit-collection"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {createMutation.isPending ? t("collections.creating") : t("collections.createCollection")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={expandedId === collection.id ? "col-span-full" : ""}
              >
                {expandedId === collection.id ? (
                  <CollectionDetail
                    collectionId={collection.id}
                    onClose={() => setExpandedId(null)}
                  />
                ) : (
                  <Card
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                    onClick={() => handleToggleExpand(collection.id)}
                    data-testid={`card-collection-${collection.id}`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {collection.bannerUrl || collection.imageUrl ? (
                        <img
                          src={collection.bannerUrl || collection.imageUrl || ""}
                          alt={collection.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                      {collection.chain && (
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                            <ChainIcon chain={collection.chain} size={14} />
                            <span className="text-xs font-medium">{collection.chain.toUpperCase()}</span>
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-lg text-foreground truncate" data-testid={`text-collection-name-${collection.id}`}>
                          {collection.name}
                        </h3>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-collection-desc-${collection.id}`}>
                          {collection.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-xs text-muted-foreground" data-testid={`text-collection-creator-${collection.id}`}>
                          {t("collections.by")} {collection.creatorId}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" data-testid={`text-collection-agents-${collection.id}`}>
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{collection.agentCount} {t("collections.agents")}</span>
                        </div>
                        {collection.floorPrice && (
                          <div className="flex items-center gap-1.5" data-testid={`text-collection-floor-${collection.id}`}>
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{t("collections.floor")} {collection.floorPrice}</span>
                          </div>
                        )}
                        {collection.totalVolume && collection.totalVolume !== "0" && (
                          <div className="flex items-center gap-1.5" data-testid={`text-collection-volume-${collection.id}`}>
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{t("collections.vol")} {collection.totalVolume}</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="gap-1 text-xs" data-testid={`button-expand-${collection.id}`}>
                        {t("collections.view")}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("collections.noCollections")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("collections.noCollectionsDesc")}
            </p>
            <Button className="gap-2" onClick={() => setCreateOpen(true)} data-testid="button-create-first-collection">
              <Plus className="h-4 w-4" />
              {t("collections.createFirst")}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
