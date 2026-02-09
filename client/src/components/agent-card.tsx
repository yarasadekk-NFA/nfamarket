import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChainIcon } from "@/components/chain-icon";
import type { Agent, Chain } from "@shared/schema";
import { Heart, Eye, ShoppingCart, Star, Brain, ShieldCheck, Sparkles, Gem } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    chain: Chain;
    price?: string;
    currency?: string;
    capabilities: string[];
    modelType: string;
    totalSales: number;
    creatorName?: string;
    reputationScore?: number;
    totalFeedbacks?: number;
    learningEnabled?: boolean;
    learningType?: string;
    isVerified?: boolean;
    verificationType?: string;
  };
  index?: number;
}

function computeRarityScore(agent: AgentCardProps["agent"]): number {
  let score = 0;
  if (agent.learningEnabled) score += 15;
  const learningScores: Record<string, number> = {
    static: 0, json_light: 5, merkle_tree: 20, rag: 15, mcp: 15, fine_tuning: 20, reinforcement: 25
  };
  score += learningScores[agent.learningType || "static"] || 0;
  const verificationScores: Record<string, number> = {
    none: 0, tee: 20, zkp: 25, hybrid: 30
  };
  score += verificationScores[agent.verificationType || "none"] || 0;
  if (agent.isVerified) score += 10;
  score += Math.min((agent.capabilities?.length || 0) * 3, 15);
  score += Math.min((agent.reputationScore || 0) / 10, 10);
  return Math.min(Math.round(score), 100);
}

function getRarityColor(score: number): string {
  if (score >= 81) return "text-amber-400";
  if (score >= 61) return "text-purple-400";
  if (score >= 31) return "text-blue-400";
  return "text-muted-foreground";
}

function getRarityBg(score: number): string {
  if (score >= 81) return "bg-amber-500/90";
  if (score >= 61) return "bg-purple-500/90";
  if (score >= 31) return "bg-blue-500/90";
  return "bg-muted/90";
}

const learningTypeLabels: Record<string, string> = {
  static: "Static",
  json_light: "Light Memory",
  merkle_tree: "Merkle Learning",
  rag: "RAG",
  mcp: "MCP",
  fine_tuning: "Fine-tuned",
  reinforcement: "RL Agent",
};

export function AgentCard({ agent, index = 0 }: AgentCardProps) {
  const { t } = useTranslation();
  const rarityScore = computeRarityScore(agent);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/agent/${agent.id}`}>
        <Card 
          className="group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          data-testid={`card-agent-${agent.id}`}
        >
          <div className="relative aspect-square overflow-hidden">
            <img
              src={agent.imageUrl}
              alt={agent.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                <ChainIcon chain={agent.chain} size={14} />
                <span className="text-xs font-medium">{agent.chain.toUpperCase()}</span>
              </div>
              {agent.isVerified && (
                <div className="flex items-center gap-1 rounded-full bg-green-500/90 backdrop-blur-sm px-2 py-1">
                  <ShieldCheck className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">
                    {agent.verificationType === "tee" ? "TEE" : agent.verificationType === "zkp" ? "ZKP" : t("card.verified")}
                  </span>
                </div>
              )}
              {rarityScore > 0 && (
                <div className={`flex items-center gap-1 rounded-full ${getRarityBg(rarityScore)} backdrop-blur-sm px-2 py-1`} data-testid={`badge-rarity-${agent.id}`}>
                  <Gem className="h-3 w-3 text-white" />
                  <span className="text-xs font-bold text-white">{rarityScore}</span>
                </div>
              )}
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {agent.reputationScore !== undefined && agent.reputationScore > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-sm px-2 py-1">
                  <Star className="h-3 w-3 text-white fill-white" />
                  <span className="text-xs font-bold text-white">{agent.reputationScore}</span>
                </div>
              )}
              {agent.learningEnabled && (
                <div className="flex items-center gap-1 rounded-full bg-purple-500/90 backdrop-blur-sm px-2 py-1">
                  <Brain className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">
                    {learningTypeLabels[agent.learningType || "static"] || t("card.learning")}
                  </span>
                </div>
              )}
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute bottom-3 left-3 right-3 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
              <Button className="w-full gap-2" size="sm" data-testid={`button-buy-${agent.id}`}>
                <ShoppingCart className="h-4 w-4" />
                {t("detail.buyNow")}
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                {agent.creatorName && (
                  <p className="text-xs text-muted-foreground truncate">
                    by {agent.creatorName}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {agent.modelType}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 3).map((cap) => (
                <Badge key={cap} variant="outline" className="text-xs px-2 py-0">
                  {cap}
                </Badge>
              ))}
              {agent.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{agent.capabilities.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            {agent.price ? (
              <div>
                <p className="text-xs text-muted-foreground">{t("detail.price")}</p>
                <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {agent.price} {agent.currency}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">{t("detail.notListed")}</p>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" />
                {agent.totalSales}
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

export function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="mt-2 h-4 w-1/2 bg-muted rounded animate-pulse" />
        <div className="mt-3 flex gap-1">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}
