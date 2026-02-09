import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainIcon } from "@/components/chain-icon";
import {
  Activity,
  TrendingUp,
  ArrowRightLeft,
  ShoppingCart,
  Tag,
  Clock,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import type { Transaction, Chain } from "@shared/schema";
import { chainInfo } from "@shared/schema";

type TransactionFilter = "all" | "sale" | "listing" | "transfer" | "rental";

function getTransactionIcon(type: Transaction["transactionType"]) {
  switch (type) {
    case "sale":
      return <ShoppingCart className="h-4 w-4" />;
    case "listing":
      return <Tag className="h-4 w-4" />;
    case "transfer":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "rental":
      return <CalendarDays className="h-4 w-4" />;
  }
}

function getTransactionColor(type: Transaction["transactionType"]) {
  switch (type) {
    case "sale":
      return "text-green-400";
    case "listing":
      return "text-blue-400";
    case "transfer":
      return "text-purple-400";
    case "rental":
      return "text-orange-400";
  }
}

function shortenAddress(address: string | null) {
  if (!address) return "—";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(date: string | Date, justNowLabel: string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return justNowLabel;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function ActivityPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const filterOptions: { id: TransactionFilter; label: string; icon: typeof Activity }[] = [
    { id: "all", label: t("activity.all"), icon: Activity },
    { id: "sale", label: t("activity.sales"), icon: ShoppingCart },
    { id: "listing", label: t("activity.listings"), icon: Tag },
    { id: "transfer", label: t("activity.transfers"), icon: ArrowRightLeft },
    { id: "rental", label: t("activity.rentals"), icon: CalendarDays },
  ];

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/activity", 50],
    queryFn: async () => {
      const response = await fetch("/api/activity?limit=50");
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.transactionType === filter);
  }, [transactions, filter]);

  const stats = useMemo(() => {
    if (!transactions) return { total: 0, volume: "0" };
    const total = transactions.length;
    const volume = transactions.reduce((sum, t) => sum + parseFloat(t.price), 0);
    return { total, volume: volume.toFixed(4) };
  }, [transactions]);

  return (
    <div className="min-h-screen py-8" data-testid="page-activity">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-activity-title">
              {t("activity.title")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t("activity.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm" data-testid="card-stat-total">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("activity.totalTransactions")}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="text-stat-total">
                    {stats.total}
                  </p>
                )}
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm" data-testid="card-stat-volume">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("activity.totalVolume")}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="text-stat-volume">
                    {stats.volume}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-3 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant={filter === option.id ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setFilter(option.id)}
                    data-testid={`filter-${option.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
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
          ) : filteredTransactions.length === 0 ? (
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur-sm text-center" data-testid="text-no-activity">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">{t("activity.noActivity")}</h3>
              <p className="text-muted-foreground text-sm">
                {filter === "all"
                  ? t("activity.noTransactions")
                  : `No ${filter} transactions found.`}
              </p>
            </Card>
          ) : (
            filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover-elevate"
                  data-testid={`card-activity-${tx.id}`}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div
                      className={`p-2 rounded-md bg-card ${getTransactionColor(tx.transactionType)}`}
                    >
                      {getTransactionIcon(tx.transactionType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize" data-testid={`badge-type-${tx.id}`}>
                          {tx.transactionType}
                        </Badge>
                        <span
                          className="text-sm font-medium truncate"
                          data-testid={`text-agent-${tx.id}`}
                        >
                          Agent #{tx.agentId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span data-testid={`text-from-${tx.id}`}>
                          {t("activity.from")} {shortenAddress(tx.fromUserId)}
                        </span>
                        <ArrowRightLeft className="h-3 w-3" />
                        <span data-testid={`text-to-${tx.id}`}>
                          {t("activity.to")} {shortenAddress(tx.toUserId)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-price-${tx.id}`}>
                          {parseFloat(tx.price).toFixed(4)} {tx.currency}
                        </p>
                        <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`text-date-${tx.id}`}>
                            {formatDate(tx.createdAt, t("activity.justNow"))}
                          </span>
                        </div>
                      </div>

                      <div data-testid={`chain-icon-${tx.id}`}>
                        <ChainIcon chain={tx.chain} size={20} />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
