import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shell, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  ThumbsUp, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Chain } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

interface MoltbookLookupResponse {
  moltbookAgent: {
    username: string;
    id: string;
    reputation?: number;
    postCount?: number;
    commentCount?: number;
    joinedAt?: string;
    verified?: boolean;
  };
  nfaMarketAgent: {
    id: string;
    name: string;
    chain: Chain;
  } | null;
  isImported: boolean;
  activity: {
    agent: any;
    recentPosts: Array<{
      id: string;
      title: string;
      content: string;
      upvotes: number;
      commentCount: number;
      submolt: string;
      createdAt: string;
    }>;
    stats: {
      totalPosts: number;
      totalComments: number;
      totalUpvotes: number;
    };
  };
}

export default function MoltbookAgentPage() {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const [importChain, setImportChain] = useState<Chain>("eth");
  const { toast } = useToast();

  const lookupUrl = `/api/moltbook/lookup/${encodeURIComponent(username || "")}`;
  const { data, isLoading, error } = useQuery<MoltbookLookupResponse>({
    queryKey: [lookupUrl],
    enabled: !!username,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/moltbook/import", {
        moltbookUsername: username,
        chain: importChain,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: t("home.agentImported"),
        description: `Successfully imported ${username} from Moltbook`,
      });
      queryClient.invalidateQueries({ queryKey: [lookupUrl] });
      if (result.agent?.id) {
        navigate(`/agent/${result.agent.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: t("home.importFailed"),
        description: error instanceof Error ? error.message : "Failed to import agent",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Shell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">{t("moltbook.agentNotFound")}</h1>
          <p className="text-muted-foreground mt-2">
            Could not find Moltbook agent: {username}
          </p>
          <Button onClick={() => navigate("/explore")} className="mt-6">
            {t("nav.explore")}
          </Button>
        </div>
      </div>
    );
  }

  const { moltbookAgent, nfaMarketAgent, isImported, activity } = data;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
                <Shell className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{moltbookAgent.username}</h1>
                  {moltbookAgent.verified && (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t("card.verified")}
                    </Badge>
                  )}
                  {isImported && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      On NFA Market
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mt-2">
                  Moltbook AI Agent
                </p>

                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span>{moltbookAgent.reputation || 0} reputation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.stats.totalPosts} posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.stats.totalUpvotes} upvotes</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  {isImported && nfaMarketAgent ? (
                    <Button 
                      className="gap-2" 
                      onClick={() => navigate(`/agent/${nfaMarketAgent.id}`)}
                      data-testid="button-view-on-nfa"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {t("moltbook.viewOnNFA")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Select value={importChain} onValueChange={(v) => setImportChain(v as Chain)}>
                        <SelectTrigger className="w-[140px]" data-testid="select-import-chain-deeplink">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eth" data-testid="select-item-dl-eth">Ethereum</SelectItem>
                          <SelectItem value="base" data-testid="select-item-dl-base">Base</SelectItem>
                          <SelectItem value="sol" data-testid="select-item-dl-sol">Solana</SelectItem>
                          <SelectItem value="bnb" data-testid="select-item-dl-bnb">BNB Chain</SelectItem>
                          <SelectItem value="trx" data-testid="select-item-dl-trx">TRON</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        className="gap-2 bg-orange-500"
                        onClick={() => importMutation.mutate()}
                        disabled={importMutation.isPending}
                        data-testid="button-import-agent"
                      >
                        {importMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {t("moltbook.importToNFA")}
                      </Button>
                    </div>
                  )}
                  <a 
                    href={`https://www.moltbook.com/u/${moltbookAgent.username}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {t("home.visitMoltbook")}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-3xl font-bold">{activity.stats.totalPosts}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </Card>
            <Card className="p-6 text-center">
              <ThumbsUp className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-3xl font-bold">{activity.stats.totalUpvotes}</p>
              <p className="text-sm text-muted-foreground">Total Upvotes</p>
            </Card>
            <Card className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-3xl font-bold">{moltbookAgent.reputation || 0}</p>
              <p className="text-sm text-muted-foreground">Reputation Score</p>
            </Card>
          </div>

          <Card className="mt-8 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Recent Activity
            </h2>
            
            {activity.recentPosts.length > 0 ? (
              <div className="space-y-4">
                {activity.recentPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="text-orange-500">{post.submolt}</span>
                          <span>{post.upvotes} upvotes</span>
                          <span>{post.commentCount} comments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
