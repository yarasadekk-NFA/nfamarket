import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Bot,
  Clock,
  ArrowRightLeft,
  ShoppingCart,
  Tag,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface RecentActivityItem {
  id: string;
  type: string;
  agentName: string;
  price: string;
  currency: string;
  date: string;
}

interface AnalyticsData {
  ownedAgents: number;
  totalSpent: string;
  totalEarned: string;
  profitLoss: string;
  transactions: number;
  recentActivity: RecentActivityItem[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case "sale":
      return <ShoppingCart className="h-4 w-4" />;
    case "listing":
      return <Tag className="h-4 w-4" />;
    case "transfer":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "rental":
      return <CalendarDays className="h-4 w-4" />;
    default:
      return <ArrowRightLeft className="h-4 w-4" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "sale":
      return "text-green-400";
    case "listing":
      return "text-blue-400";
    case "transfer":
      return "text-purple-400";
    case "rental":
      return "text-orange-400";
    default:
      return "text-muted-foreground";
  }
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const userId = "demo-user";

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", userId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const profitLossValue = analytics ? parseFloat(analytics.profitLoss) : 0;
  const isProfit = profitLossValue >= 0;

  const summaryCards = [
    {
      title: t("analytics.ownedAgents"),
      value: analytics?.ownedAgents?.toString() ?? "0",
      icon: Bot,
      color: "text-primary",
    },
    {
      title: t("analytics.totalSpent"),
      value: analytics ? `${parseFloat(analytics.totalSpent).toFixed(4)}` : "0.0000",
      icon: Wallet,
      color: "text-orange-400",
    },
    {
      title: t("analytics.totalEarned"),
      value: analytics ? `${parseFloat(analytics.totalEarned).toFixed(4)}` : "0.0000",
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: t("analytics.profitLoss"),
      value: analytics
        ? `${isProfit ? "+" : ""}${parseFloat(analytics.profitLoss).toFixed(4)}`
        : "0.0000",
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? "text-green-500" : "text-red-500",
    },
  ];

  return (
    <div className="min-h-screen py-8" data-testid="page-analytics">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-analytics-title">
              {t("analytics.title")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t("analytics.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  className="relative border-border/50 bg-card/50 backdrop-blur-sm p-6"
                  data-testid={`card-summary-${card.title.toLowerCase().replace(/[\s/]+/g, "-")}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-20 mt-2" />
                      ) : (
                        <p
                          className={`mt-2 text-3xl font-bold ${card.color}`}
                          data-testid={`text-summary-${card.title.toLowerCase().replace(/[\s/]+/g, "-")}`}
                        >
                          {card.value}
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid="card-transactions-summary">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("analytics.transactionSummary")}
              </CardTitle>
              {!isLoading && analytics && (
                <Badge variant="secondary" data-testid="badge-transaction-count">
                  {analytics.transactions} {t("analytics.total")}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-transaction-count">
                  {t("analytics.transactionsCount", { count: String(analytics?.transactions ?? 0) })}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold" data-testid="text-recent-activity-title">
              {t("analytics.recentActivity")}
            </h2>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  className="p-4 border-border/50 bg-card/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </Card>
              ))
            ) : !analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
              <Card
                className="p-12 border-border/50 bg-card/50 backdrop-blur-sm text-center"
                data-testid="text-no-recent-activity"
              >
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">{t("analytics.noRecentActivity")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("analytics.noRecentActivityDesc")}
                </p>
              </Card>
            ) : (
              analytics.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <Card
                    className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover-elevate"
                    data-testid={`card-activity-${activity.id}`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div
                        className={`p-2 rounded-md bg-card ${getActivityColor(activity.type)}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="capitalize"
                            data-testid={`badge-activity-type-${activity.id}`}
                          >
                            {activity.type}
                          </Badge>
                          <span
                            className="text-sm font-medium truncate"
                            data-testid={`text-activity-agent-${activity.id}`}
                          >
                            {activity.agentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`text-activity-date-${activity.id}`}>
                            {activity.date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className="font-semibold"
                          data-testid={`text-activity-price-${activity.id}`}
                        >
                          {activity.price} {activity.currency}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
