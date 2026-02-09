import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChainIcon } from "@/components/chain-icon";
import {
  Trophy,
  Medal,
  Crown,
  Users,
  ArrowRightLeft,
  ShoppingCart,
  Star,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { Agent } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

interface CreatorEntry {
  userId: string;
  username: string;
  totalAgentsCreated: number;
  totalSalesVolume: number;
  avgReputation: number;
}

interface TraderEntry {
  userId: string;
  username: string;
  totalTransactions: number;
  totalVolume: string;
}

function getRankIcon(rank: number) {
  if (rank === 1) {
    return <Crown className="h-5 w-5" style={{ color: "#FFD700" }} />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5" style={{ color: "#C0C0C0" }} />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5" style={{ color: "#CD7F32" }} />;
  }
  return (
    <span className="text-sm font-bold text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-orange-700/10 border-orange-700/30";
  return "border-border/50 bg-card/50";
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-4 border-border/50 bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TopAgentsTab() {
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/leaderboard/agents"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/agents");
      if (!response.ok) throw new Error("Failed to fetch top agents");
      return response.json();
    },
  });

  if (isLoading) return <SkeletonRows />;

  if (!agents || agents.length === 0) {
    return (
      <Card
        className="p-12 border-border/50 bg-card/50 backdrop-blur-sm text-center"
        data-testid="text-no-agents"
      >
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No Agents Yet</h3>
        <p className="text-muted-foreground text-sm">
          Agents will appear here once sales are recorded.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="list-top-agents">
      {agents.map((agent, index) => {
        const rank = index + 1;
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              className={`p-4 backdrop-blur-sm hover-elevate ${getRankBg(rank)}`}
              data-testid={`card-agent-rank-${rank}`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="flex items-center justify-center w-8"
                  data-testid={`rank-agent-${rank}`}
                >
                  {getRankIcon(rank)}
                </div>

                <Link href={`/agent/${agent.id}`}>
                  <Avatar className="h-9 w-9" data-testid={`avatar-agent-${agent.id}`}>
                    <AvatarImage src={agent.imageUrl} alt={agent.name} />
                    <AvatarFallback>
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/agent/${agent.id}`}>
                      <span
                        className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                        data-testid={`link-agent-${agent.id}`}
                      >
                        {agent.name}
                      </span>
                    </Link>
                    <ChainIcon chain={agent.chain} size={14} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Badge
                        key={cap}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                        data-testid={`badge-capability-${agent.id}-${cap}`}
                      >
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right min-w-[80px]">
                    <div className="flex items-center gap-1 justify-end">
                      <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span
                        className="text-sm font-bold"
                        data-testid={`text-sales-${agent.id}`}
                      >
                        {agent.totalSales}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">sales</span>
                  </div>

                  <div className="min-w-[100px]" data-testid={`reputation-${agent.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium">
                        {agent.reputationScore}
                      </span>
                    </div>
                    <Progress
                      value={agent.reputationScore}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function TopCreatorsTab() {
  const { data: creators, isLoading } = useQuery<CreatorEntry[]>({
    queryKey: ["/api/leaderboard/creators"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/creators");
      if (!response.ok) throw new Error("Failed to fetch top creators");
      return response.json();
    },
  });

  if (isLoading) return <SkeletonRows />;

  if (!creators || creators.length === 0) {
    return (
      <Card
        className="p-12 border-border/50 bg-card/50 backdrop-blur-sm text-center"
        data-testid="text-no-creators"
      >
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No Creators Yet</h3>
        <p className="text-muted-foreground text-sm">
          Top creators will appear here once agents are created.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="list-top-creators">
      {creators.map((creator, index) => {
        const rank = index + 1;
        return (
          <motion.div
            key={creator.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              className={`p-4 backdrop-blur-sm hover-elevate ${getRankBg(rank)}`}
              data-testid={`card-creator-rank-${rank}`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="flex items-center justify-center w-8"
                  data-testid={`rank-creator-${rank}`}
                >
                  {getRankIcon(rank)}
                </div>

                <Avatar className="h-9 w-9" data-testid={`avatar-creator-${creator.userId}`}>
                  <AvatarFallback>
                    {creator.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <span
                    className="font-semibold text-sm"
                    data-testid={`text-creator-name-${creator.userId}`}
                  >
                    {creator.username}
                  </span>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="text-center" data-testid={`text-agents-created-${creator.userId}`}>
                    <p className="text-sm font-bold">{creator.totalAgentsCreated}</p>
                    <p className="text-xs text-muted-foreground">Agents</p>
                  </div>

                  <div className="text-center" data-testid={`text-sales-volume-${creator.userId}`}>
                    <div className="flex items-center gap-1 justify-center">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold">
                        {creator.totalSalesVolume.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                  </div>

                  <div className="text-center min-w-[80px]" data-testid={`text-avg-reputation-${creator.userId}`}>
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm font-bold">{creator.avgReputation}</span>
                    </div>
                    <Progress
                      value={creator.avgReputation}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function TopTradersTab() {
  const { data: traders, isLoading } = useQuery<TraderEntry[]>({
    queryKey: ["/api/leaderboard/traders"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/traders");
      if (!response.ok) throw new Error("Failed to fetch top traders");
      return response.json();
    },
  });

  if (isLoading) return <SkeletonRows />;

  if (!traders || traders.length === 0) {
    return (
      <Card
        className="p-12 border-border/50 bg-card/50 backdrop-blur-sm text-center"
        data-testid="text-no-traders"
      >
        <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No Traders Yet</h3>
        <p className="text-muted-foreground text-sm">
          Top traders will appear here once transactions are made.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="list-top-traders">
      {traders.map((trader, index) => {
        const rank = index + 1;
        return (
          <motion.div
            key={trader.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              className={`p-4 backdrop-blur-sm hover-elevate ${getRankBg(rank)}`}
              data-testid={`card-trader-rank-${rank}`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="flex items-center justify-center w-8"
                  data-testid={`rank-trader-${rank}`}
                >
                  {getRankIcon(rank)}
                </div>

                <Avatar className="h-9 w-9" data-testid={`avatar-trader-${trader.userId}`}>
                  <AvatarFallback>
                    {trader.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <span
                    className="font-semibold text-sm"
                    data-testid={`text-trader-name-${trader.userId}`}
                  >
                    {trader.username}
                  </span>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="text-center" data-testid={`text-transactions-${trader.userId}`}>
                    <div className="flex items-center gap-1 justify-center">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold">
                        {trader.totalTransactions}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                  </div>

                  <div className="text-center" data-testid={`text-volume-${trader.userId}`}>
                    <div className="flex items-center gap-1 justify-center">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold">
                        {parseFloat(trader.totalVolume).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen py-8" data-testid="page-leaderboard">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-7 w-7 text-primary" />
            <h1
              className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
              data-testid="text-leaderboard-title"
            >
              {t("leaderboard.title")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t("leaderboard.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="agents" data-testid="tabs-leaderboard">
            <TabsList className="mb-6" data-testid="tabs-list">
              <TabsTrigger value="agents" data-testid="tab-agents">
                <Trophy className="h-4 w-4 mr-2" />
                {t("leaderboard.topAgents")}
              </TabsTrigger>
              <TabsTrigger value="creators" data-testid="tab-creators">
                <Users className="h-4 w-4 mr-2" />
                {t("leaderboard.topCreators")}
              </TabsTrigger>
              <TabsTrigger value="traders" data-testid="tab-traders">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {t("leaderboard.topTraders")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <TopAgentsTab />
            </TabsContent>
            <TabsContent value="creators">
              <TopCreatorsTab />
            </TabsContent>
            <TabsContent value="traders">
              <TopTradersTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
