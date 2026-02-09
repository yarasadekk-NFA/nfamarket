import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChainIcon } from "@/components/chain-icon";
import { AgentChat } from "@/components/agent-chat";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { EVMBlockchainService } from "@/lib/blockchain";
import { SolanaBlockchainService, SOLANA_PLATFORM_WALLET } from "@/lib/solana";
import { TronBlockchainService } from "@/lib/tron";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ExternalLink, 
  Clock, 
  Tag, 
  Cpu, 
  Zap,
  TrendingUp,
  History,
  Shield,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Wallet,
  Star,
  Brain,
  ShieldCheck,
  Activity,
  MessageSquare,
  Shell,
  ArrowUpRight,
  ThumbsUp,
  MessageCircle,
  CalendarDays,
  Minus,
  Plus,
  Gavel,
  Sparkles,
  Gem
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import type { Agent, Chain, RentalListing, Auction, Offer, Review, Listing } from "@shared/schema";

interface MoltbookActivity {
  registered: boolean;
  moltbookUsername?: string;
  moltbookId?: string;
  profileUrl?: string;
  activity?: {
    agent: {
      username: string;
      reputation?: number;
      postCount?: number;
      verified?: boolean;
    } | null;
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

function MoltbookTab({ agent }: { agent: Agent }) {
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: moltbookData, isLoading, refetch } = useQuery<MoltbookActivity>({
    queryKey: ["/api/agents", agent.id, "moltbook", "activity"],
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/agents/${agent.id}/moltbook/register`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Registered on Moltbook!",
        description: "Your agent is now part of the AI social network",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agent.id] });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register on Moltbook",
        variant: "destructive",
      });
    },
  });

  const syncReputationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/moltbook/sync-reputation/${agent.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reputation Synced!",
        description: `Updated reputation score: ${data.newReputation}`,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agent.id] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync reputation",
        variant: "destructive",
      });
    },
  });

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await registerMutation.mutateAsync();
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!moltbookData?.registered) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Shell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect to Moltbook</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Join the AI agent social network where agents share, discuss, and collaborate
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleRegister} 
              disabled={isRegistering}
              className="gap-2"
              data-testid="button-register-moltbook"
            >
              {isRegistering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shell className="h-4 w-4" />
              )}
              Register on Moltbook
            </Button>
            <a 
              href="https://www.moltbook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
            >
              Learn more about Moltbook
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { activity, profileUrl, moltbookUsername } = moltbookData;

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shell className="h-5 w-5 text-orange-500" />
              Moltbook Profile
            </CardTitle>
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-moltbook-profile">
                  View Profile
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-orange-500">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                {moltbookUsername?.charAt(0).toUpperCase() || "M"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold flex items-center gap-2">
                @{moltbookUsername}
                {activity?.agent?.verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </p>
              <p className="text-sm text-muted-foreground">AI Agent on Moltbook</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{activity?.stats.totalPosts || 0}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{activity?.stats.totalComments || 0}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{activity?.stats.totalUpvotes || 0}</p>
              <p className="text-xs text-muted-foreground">Upvotes</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => syncReputationMutation.mutate()}
              disabled={syncReputationMutation.isPending}
              data-testid="button-sync-reputation"
            >
              {syncReputationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              )}
              Sync Reputation from Moltbook
            </Button>
          </div>
        </CardContent>
      </Card>

      {activity?.recentPosts && activity.recentPosts.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.recentPosts.map((post) => (
              <div key={post.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.submolt}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {post.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function useCountdown(endTime: Date | string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  return timeLeft;
}

function ReviewsTab({ agent }: { agent: Agent }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: reviewData, isLoading } = useQuery<{ reviews: Review[]; averageRating: number; total: number }>({
    queryKey: ["/api/reviews", agent.id],
    queryFn: async () => {
      const r = await fetch(`/api/reviews/${agent.id}`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reviews", {
        agentId: agent.id,
        userId: "demo-user",
        rating: reviewRating,
        comment: reviewComment || null,
      });
    },
    onSuccess: () => {
      toast({ title: t("detail.reviewSubmitted"), description: "Thank you for your feedback" });
      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", agent.id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            {t("detail.reviews")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500" data-testid="text-average-rating">
                {reviewData?.averageRating?.toFixed(1) || "0.0"}
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= Math.round(reviewData?.averageRating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div>
              <p className="text-sm text-muted-foreground" data-testid="text-total-reviews">
                {reviewData?.total || 0} {t("detail.reviews").toLowerCase()}
              </p>
            </div>
          </div>

          {reviewData?.reviews && reviewData.reviews.length > 0 ? (
            <div className="space-y-3">
              {reviewData.reviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/30 space-y-1" data-testid={`review-item-${review.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground">by {review.userId}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {t("detail.noReviews")}. {t("detail.beFirst")}!
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("detail.writeReview")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("detail.rating")}</Label>
            <div className="flex items-center gap-1" data-testid="input-review-rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  className="p-0.5"
                  data-testid={`button-rating-${s}`}
                >
                  <Star
                    className={`h-6 w-6 cursor-pointer ${s <= reviewRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("detail.comment")}</Label>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t("detail.commentPlaceholder")}
              className="resize-none"
              data-testid="input-review-comment"
            />
          </div>
          <Button
            onClick={() => submitReviewMutation.mutate()}
            disabled={submitReviewMutation.isPending}
            className="w-full gap-2"
            data-testid="button-submit-review"
          >
            {submitReviewMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            {t("detail.submitReview")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgentDetailPage() {
  const [, params] = useRoute("/agent/:id");
  const agentId = params?.id;
  const [copied, setCopied] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isRenting, setIsRenting] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("3");
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isConnected, connect, address } = useWallet();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", agentId],
    enabled: !!agentId,
  });

  const { data: listings } = useQuery<Listing[]>({
    queryKey: ["/api/listings", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/listings?agentId=${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: !!agentId,
  });

  const activeListing = listings?.find(l => l.status === "active");

  const { data: rentalListings } = useQuery<RentalListing[]>({
    queryKey: ["/api/rentals", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/rentals?agentId=${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch rentals");
      return response.json();
    },
    enabled: !!agentId,
  });

  const { data: auctions } = useQuery<Auction[]>({
    queryKey: ["/api/auctions", agentId],
    queryFn: async () => {
      const r = await fetch(`/api/auctions?agentId=${agentId}`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
    enabled: !!agentId,
  });

  const activeAuction = auctions?.find((a) => a.status === "active");
  const auctionTimeLeft = useCountdown(activeAuction?.endTime);

  const { data: favoriteData } = useQuery<{ isFavorited: boolean; count: number }>({
    queryKey: ["/api/favorites", "demo-user", agentId],
    queryFn: async () => {
      const r = await fetch(`/api/favorites/demo-user/${agentId}`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
    enabled: !!agentId,
  });

  const { data: priceHistory, isLoading: priceHistoryLoading } = useQuery<{ price: string; currency: string; createdAt: string; transactionType: string }[]>({
    queryKey: ["/api/agents", agentId, "price-history"],
    queryFn: async () => {
      const r = await fetch(`/api/agents/${agentId}/price-history`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
    enabled: !!agentId,
  });

  const { data: recommendations } = useQuery<Agent[]>({
    queryKey: ["/api/agents", agentId, "recommendations"],
    queryFn: async () => {
      const r = await fetch(`/api/agents/${agentId}/recommendations`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
    enabled: !!agentId,
  });

  const { data: rarityData } = useQuery<{ score: number }>({
    queryKey: ["/api/agents", agentId, "rarity"],
    queryFn: async () => {
      const r = await fetch(`/api/agents/${agentId}/rarity`);
      if (!r.ok) throw new Error("fail");
      return r.json();
    },
    enabled: !!agentId,
  });

  const rentalListing = rentalListings?.find(r => r.status === "available");

  const rentMutation = useMutation({
    mutationFn: async ({ rentalId, days }: { rentalId: string; days: number }) => {
      const rental = rentalListing;
      if (!rental) throw new Error("Rental listing not found");

      const totalPrice = (parseFloat(rental.pricePerDay) * days).toString();
      const chain = displayAgent.chain;
      let txHash: string;

      if (["eth", "base", "bnb"].includes(chain)) {
        const evmService = new EVMBlockchainService(chain);
        await evmService.connect();
        txHash = await evmService.sendPayment(totalPrice);
      } else if (chain === "sol") {
        const solService = new SolanaBlockchainService();
        await solService.connect();
        const result = await solService.sendPayment(totalPrice);
        txHash = result.txSignature;
      } else if (chain === "trx") {
        const tronService = new TronBlockchainService();
        await tronService.connect();
        txHash = await tronService.sendPayment(totalPrice);
      } else {
        throw new Error(`Rentals on ${chain.toUpperCase()} are not yet supported`);
      }

      const response = await apiRequest("POST", `/api/rentals/${rentalId}/rent`, {
        renterId: address || "unknown",
        days,
        txHash,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("detail.rentalSuccess"),
        description: `You rented this agent for ${data.activeRental?.daysRented || rentalDays} ${t("detail.days")}`,
      });
      setRentalDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId] });
    },
    onError: (error) => {
      toast({
        title: t("detail.rentalFailed"),
        description: error instanceof Error ? error.message : "Failed to process rental",
        variant: "destructive",
      });
    },
  });

  const offerMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(offerExpiry));
      await apiRequest("POST", "/api/offers", {
        agentId,
        buyerId: "demo-user",
        sellerId: displayAgent.ownerId,
        amount: offerAmount,
        currency: "ETH",
        expiresAt: expiresAt.toISOString(),
        chain: displayAgent.chain,
      });
    },
    onSuccess: () => {
      toast({ title: t("detail.offerSubmitted"), description: "Your offer has been sent to the owner" });
      setOfferDialogOpen(false);
      setOfferAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: (error) => {
      toast({
        title: t("detail.offerFailed"),
        description: error instanceof Error ? error.message : "Failed to submit offer",
        variant: "destructive",
      });
    },
  });

  const bidMutation = useMutation({
    mutationFn: async () => {
      if (!activeAuction) throw new Error("No active auction");
      await apiRequest("POST", `/api/auctions/${activeAuction.id}/bid`, {
        bidderId: "demo-user",
        amount: bidAmount,
        currency: activeAuction.currency,
      });
    },
    onSuccess: () => {
      toast({ title: t("detail.bidPlaced"), description: "Your bid has been recorded" });
      setBidDialogOpen(false);
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", agentId] });
    },
    onError: (error) => {
      toast({
        title: t("detail.bidFailed"),
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/favorites", {
        userId: "demo-user",
        agentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "demo-user", agentId] });
    },
  });

  const demoAgent: Agent = {
    id: agentId || "1",
    name: "Neural Trader Pro",
    description: "Advanced trading agent with real-time market analysis and automated execution capabilities. This AI agent uses state-of-the-art machine learning models to analyze market trends, predict price movements, and execute trades with precision. Perfect for both day traders and long-term investors looking to automate their trading strategies.",
    imageUrl: "/images/agent-1.png",
    chain: "eth" as Chain,
    capabilities: ["Trading", "Analysis", "Automation", "Risk Management", "Portfolio Optimization"],
    modelType: "GPT-4",
    personality: "Analytical, precise, and risk-aware. Communicates clearly about market conditions and trading decisions.",
    totalSales: 234,
    royaltyPercentage: "1.00",
    creatorId: "creator-1",
    ownerId: "owner-1",
    createdAt: new Date(),
    learningType: "merkle_tree",
    learningEnabled: true,
    reputationScore: 85,
    totalFeedbacks: 42,
    interactionCount: 1523,
    verificationType: "tee",
    isVerified: true,
    agentType: "internal",
    externalEndpoint: null,
    openaiAssistantId: null,
    externalApiKey: null,
    triggerType: "manual",
    automationConfig: "{}",
    connectedPlatforms: [],
    systemPrompt: null,
    searchKeywords: [],
    responseTemplate: null,
    isAutomationEnabled: false,
    moltbookUsername: null,
    moltbookId: null,
    moltbookReputation: 0,
    moltbookPostCount: 0,
    moltbookRegistered: false,
    importedContract: null,
    importedTokenId: null,
    importedFrom: null,
    isImported: false,
  };

  const demoPrice = "0.85";
  const demoCurrency = "ETH";

  const displayAgent = agent || demoAgent;

  const copyAddress = () => {
    navigator.clipboard.writeText("0x1234...5678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transactionHistory = [
    { type: "Sale", from: "0xabc...def", to: "0x123...456", price: "0.75", date: "2 days ago" },
    { type: "Listed", from: "0x789...012", to: "-", price: "0.85", date: "5 days ago" },
    { type: "Sale", from: "0xdef...ghi", to: "0x789...012", price: "0.65", date: "1 week ago" },
    { type: "Minted", from: "-", to: "0xdef...ghi", price: "-", date: "2 weeks ago" },
  ];

  const handleBuy = async () => {
    if (!activeListing) {
      toast({
        title: "No Active Listing",
        description: "This agent is not currently listed for sale",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      try {
        await connect(displayAgent.chain);
      } catch (err) {
        toast({
          title: "Wallet Connection Failed",
          description: err instanceof Error ? err.message : "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }
    }

    const price = activeListing.price;
    const chain = displayAgent.chain;
    let txHash: string;

    try {
      setIsBuying(true);

      if (["eth", "base", "bnb"].includes(chain)) {
        const evmService = new EVMBlockchainService(chain);
        await evmService.connect();
        txHash = await evmService.buyAgent(displayAgent.importedTokenId || displayAgent.id, price);
      } else if (chain === "sol") {
        const solService = new SolanaBlockchainService();
        const walletAddr = await solService.connect();
        const result = await solService.buyAgent(
          SOLANA_PLATFORM_WALLET,
          price
        );
        txHash = result.txSignature;
      } else if (chain === "trx") {
        const tronService = new TronBlockchainService();
        await tronService.connect();
        txHash = await tronService.buyAgent(displayAgent.importedTokenId || displayAgent.id, price);
      } else {
        toast({
          title: t("detail.unsupportedChain"),
          description: `Purchases on ${chain.toUpperCase()} are not yet supported`,
          variant: "destructive",
        });
        return;
      }

      await apiRequest("POST", `/api/listings/${activeListing.id}/buy`, {
        buyerId: address || "unknown",
        txHash,
      });

      toast({
        title: t("detail.purchased"),
        description: t("detail.purchaseDesc"),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", agentId] });
    } catch (err) {
      toast({
        title: t("detail.purchaseFailed"),
        description: err instanceof Error ? err.message : "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link href="/explore">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            {t("detail.backToExplore")}
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="relative aspect-square">
                <img
                  src={displayAgent.imageUrl}
                  alt={displayAgent.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5">
                    <ChainIcon chain={displayAgent.chain} size={18} />
                    <span className="text-sm font-medium">{displayAgent.chain.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t("detail.agentDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.contractAddress")}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">0x1234...5678</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={copyAddress}
                      data-testid="button-copy-address"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.tokenId")}</span>
                  <span className="font-mono">#1234</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.standard")}</span>
                  <span>ERC-721</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.chain")}</span>
                  <div className="flex items-center gap-2">
                    <ChainIcon chain={displayAgent.chain} size={16} />
                    <span>{displayAgent.chain === "eth" ? "Ethereum" : displayAgent.chain.toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {displayAgent.modelType}
                  </Badge>
                  <h1 className="text-3xl font-bold">{displayAgent.name}</h1>
                  {rarityData && (
                    <div
                      data-testid="badge-rarity-score"
                      className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold ${
                        rarityData.score >= 81
                          ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 border border-amber-500/30"
                          : rarityData.score >= 61
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : rarityData.score >= 31
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-muted text-muted-foreground border border-border/50"
                      }`}
                    >
                      <Gem className="h-4 w-4" />
                      Rarity: {rarityData.score}/100
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => favoriteMutation.mutate()}
                    disabled={favoriteMutation.isPending}
                    data-testid="button-like"
                  >
                    <Heart className={`h-4 w-4 ${favoriteData?.isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  {favoriteData?.count !== undefined && (
                    <span className="text-sm text-muted-foreground" data-testid="text-favorite-count">
                      {favoriteData.count}
                    </span>
                  )}
                  <Button variant="outline" size="icon" data-testid="button-share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/agent-2.png" />
                    <AvatarFallback>CR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.creator")}</p>
                    <p className="text-sm font-medium">CryptoMaster</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/agent-3.png" />
                    <AvatarFallback>OW</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.owner")}</p>
                    <p className="text-sm font-medium">0x789...012</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Sale ends in 2 days</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {(displayAgent as any).price || "0.85"}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    {(displayAgent as any).currency || "ETH"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">≈ $2,850 USD</p>

                <div className="flex gap-3 mt-6">
                  <Button 
                    className="flex-1 gap-2" 
                    size="lg" 
                    onClick={handleBuy}
                    disabled={isBuying}
                    data-testid="button-buy-now"
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : !isConnected ? (
                      <>
                        <Wallet className="h-5 w-5" />
                        Connect & Buy
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        {t("detail.buyNow")}
                      </>
                    )}
                  </Button>
                  <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg" className="gap-2" data-testid="button-make-offer">
                        <Tag className="h-5 w-5" />
                        {t("detail.makeOffer")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          Make an Offer
                        </DialogTitle>
                        <DialogDescription>
                          Submit an offer for {displayAgent.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{t("detail.offerPrice")} (ETH)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            placeholder="0.00"
                            data-testid="input-offer-amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("detail.expiration")}</Label>
                          <Select value={offerExpiry} onValueChange={setOfferExpiry}>
                            <SelectTrigger data-testid="select-offer-expiry">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setOfferDialogOpen(false)} data-testid="button-cancel-offer">
                          {t("detail.cancel")}
                        </Button>
                        <Button
                          onClick={() => offerMutation.mutate()}
                          disabled={offerMutation.isPending || !offerAmount}
                          className="gap-2"
                          data-testid="button-submit-offer"
                        >
                          {offerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="h-4 w-4" />
                          )}
                          {t("detail.submitOffer")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>Platform Fee: 1%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Creator Royalty: {displayAgent.royaltyPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {activeAuction && (
              <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Gavel className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-lg" data-testid="text-auction-title">Live Auction</h3>
                    <Badge variant="secondary" className="ml-auto" data-testid="text-auction-bid-count">
                      {activeAuction.bidCount} {t("detail.bids")}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent" data-testid="text-auction-price">
                      {activeAuction.currentBid || activeAuction.startingPrice}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {activeAuction.currency}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {activeAuction.currentBid ? t("detail.currentBid") : t("detail.startingPrice")}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span data-testid="text-auction-time-left">{auctionTimeLeft}</span>
                  </div>

                  <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        size="lg"
                        data-testid="button-place-bid"
                      >
                        <Gavel className="h-5 w-5" />
                        {t("detail.placeBid")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Gavel className="h-5 w-5 text-amber-500" />
                          Place a Bid
                        </DialogTitle>
                        <DialogDescription>
                          Current {activeAuction.currentBid ? "bid" : "starting price"}: {activeAuction.currentBid || activeAuction.startingPrice} {activeAuction.currency}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{t("detail.bidAmount")} ({activeAuction.currency})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder="0.00"
                            data-testid="input-bid-amount"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBidDialogOpen(false)} data-testid="button-cancel-bid">
                          {t("detail.cancel")}
                        </Button>
                        <Button
                          onClick={() => bidMutation.mutate()}
                          disabled={bidMutation.isPending || !bidAmount}
                          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          data-testid="button-confirm-bid"
                        >
                          {bidMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Gavel className="h-4 w-4" />
                          )}
                          {t("detail.confirm")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Time remaining: {auctionTimeLeft}
                  </p>
                </CardContent>
              </Card>
            )}

            {rentalListing && (
              <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-lg">Available for Rent</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {rentalListing.minDays}-{rentalListing.maxDays} days
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                      {rentalListing.pricePerDay}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {rentalListing.currency}/day
                    </span>
                  </div>

                  <Dialog open={rentalDialogOpen} onOpenChange={setRentalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600" 
                        size="lg"
                        data-testid="button-rent-agent"
                      >
                        <CalendarDays className="h-5 w-5" />
                        {t("detail.rentThisAgent")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-purple-500" />
                          Rent {displayAgent.name}
                        </DialogTitle>
                        <DialogDescription>
                          Choose how many days you'd like to rent this agent
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t("detail.rentalDays")}</Label>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setRentalDays(Math.max(rentalListing.minDays, rentalDays - 1))}
                              disabled={rentalDays <= rentalListing.minDays}
                              data-testid="button-decrease-days"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 text-center">
                              <Input
                                type="number"
                                value={rentalDays}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (val >= rentalListing.minDays && val <= rentalListing.maxDays) {
                                    setRentalDays(val);
                                  }
                                }}
                                min={rentalListing.minDays}
                                max={rentalListing.maxDays}
                                className="text-center text-2xl font-bold h-12"
                                data-testid="input-rental-days"
                              />
                              <p className="text-sm text-muted-foreground mt-1">{t("detail.days")}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setRentalDays(Math.min(rentalListing.maxDays, rentalDays + 1))}
                              disabled={rentalDays >= rentalListing.maxDays}
                              data-testid="button-increase-days"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Slider
                            value={[rentalDays]}
                            onValueChange={([val]) => setRentalDays(val)}
                            min={rentalListing.minDays}
                            max={rentalListing.maxDays}
                            step={1}
                            className="mt-2"
                            data-testid="slider-rental-days"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{rentalListing.minDays} day min</span>
                            <span>{rentalListing.maxDays} days max</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("detail.pricePerDay")}</span>
                            <span>{rentalListing.pricePerDay} {rentalListing.currency}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("detail.duration")}</span>
                            <span>{rentalDays} {t("detail.days")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Platform fee (1%)</span>
                            <span>{(parseFloat(rentalListing.pricePerDay) * rentalDays * 0.01).toFixed(4)} {rentalListing.currency}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>{t("detail.totalCost")}</span>
                            <span className="text-lg bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                              {(parseFloat(rentalListing.pricePerDay) * rentalDays).toFixed(4)} {rentalListing.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setRentalDialogOpen(false)}
                          data-testid="button-cancel-rental"
                        >
                          {t("detail.cancel")}
                        </Button>
                        <Button
                          onClick={() => {
                            if (!isConnected) {
                              connect(displayAgent.chain).then(() => {
                                rentMutation.mutate({ rentalId: rentalListing.id, days: rentalDays });
                              }).catch(err => {
                                toast({
                                  title: "Wallet Connection Failed",
                                  description: err instanceof Error ? err.message : "Please connect your wallet",
                                  variant: "destructive",
                                });
                              });
                            } else {
                              rentMutation.mutate({ rentalId: rentalListing.id, days: rentalDays });
                            }
                          }}
                          disabled={rentMutation.isPending}
                          className="gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                          data-testid="button-confirm-rental"
                        >
                          {rentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CalendarDays className="h-4 w-4" />
                              {t("detail.confirmRental")}
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Access expires automatically after rental period
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid="section-price-history">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priceHistoryLoading ? (
                  <div className="flex items-end gap-2 py-4" style={{ minHeight: 160 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex-1 min-w-[40px]">
                        <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                          <div className="w-full max-w-[32px] rounded-t-sm bg-muted animate-pulse" style={{ height: `${30 + Math.random() * 50}%` }} />
                        </div>
                        <div className="h-3 w-8 mx-auto mt-1 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : priceHistory && priceHistory.length > 0 ? (() => {
                  const maxPrice = Math.max(...priceHistory.map(p => parseFloat(p.price)));
                  return (
                    <div className="flex items-end gap-2 overflow-x-auto pb-2" data-testid="chart-price-history" style={{ minHeight: 160 }}>
                      {priceHistory.map((point, i) => {
                        const priceParsed = parseFloat(point.price);
                        const heightPercent = maxPrice > 0 ? (priceParsed / maxPrice) * 100 : 0;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 min-w-[40px] flex-1" data-testid={`price-bar-${i}`}>
                            <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                              <div
                                className="w-full max-w-[32px] rounded-t-sm bg-gradient-to-t from-primary/80 to-primary/40 transition-all cursor-pointer relative group"
                                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                              >
                                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-popover border border-border text-xs whitespace-nowrap z-10 shadow-md">
                                  <p className="font-semibold">{point.price} {point.currency}</p>
                                  <p className="text-muted-foreground">{point.transactionType}</p>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(point.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-price-history">
                    No price history yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="w-full grid grid-cols-7">
                <TabsTrigger value="chat" data-testid="tab-chat">{t("detail.chat")}</TabsTrigger>
                <TabsTrigger value="moltbook" data-testid="tab-moltbook">
                  <Shell className="h-3 w-3 mr-1" />
                  {t("detail.moltbook")}
                </TabsTrigger>
                <TabsTrigger value="description" data-testid="tab-description">{t("detail.description")}</TabsTrigger>
                <TabsTrigger value="capabilities" data-testid="tab-capabilities">{t("detail.capabilities")}</TabsTrigger>
                <TabsTrigger value="reputation" data-testid="tab-reputation">Reputation</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">
                  <Star className="h-3 w-3 mr-1" />
                  {t("detail.reviews")}
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">{t("detail.history")}</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <AgentChat agent={displayAgent} />
              </TabsContent>

              <TabsContent value="moltbook" className="mt-4">
                <MoltbookTab agent={displayAgent} />
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {displayAgent.description}
                    </p>
                    {displayAgent.personality && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          Personality
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {displayAgent.personality}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="capabilities" className="mt-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {displayAgent.capabilities.map((cap) => (
                        <div 
                          key={cap} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{cap}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reputation" className="mt-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-500">
                          <Star className="h-6 w-6 fill-amber-500" />
                          {displayAgent.reputationScore ?? 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Reputation Score</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-500">
                          <ShieldCheck className="h-6 w-6" />
                          {(displayAgent.verificationType ?? "none").toUpperCase()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Verification</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-purple-500">
                          <Brain className="h-6 w-6" />
                          {(displayAgent.learningType ?? "static").replace("_", " ").toUpperCase()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Learning Type</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-500">
                          <Activity className="h-6 w-6" />
                          {(displayAgent.interactionCount ?? 0) >= 1000 
                            ? `${((displayAgent.interactionCount ?? 0) / 1000).toFixed(1)}K` 
                            : (displayAgent.interactionCount ?? 0)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Interactions</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback ({displayAgent.totalFeedbacks ?? 0} reviews)
                      </h4>
                      <div className="space-y-3">
                        {(displayAgent.totalFeedbacks ?? 0) > 0 ? (
                          [
                            { score: Math.min(100, (displayAgent.reputationScore ?? 0) + 5), tag: "Accurate", comment: "Excellent performance", date: "2 days ago" },
                            { score: Math.max(0, (displayAgent.reputationScore ?? 0) - 3), tag: "Responsive", comment: "Quick response times", date: "5 days ago" },
                            { score: displayAgent.reputationScore ?? 0, tag: "Reliable", comment: "Consistent results", date: "1 week ago" },
                          ].map((feedback, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                                  <Star className="h-3 w-3 fill-amber-500" />
                                  <span className="text-sm font-medium">{feedback.score}</span>
                                </div>
                                <div>
                                  <p className="text-sm">{feedback.comment}</p>
                                  <Badge variant="outline" className="mt-1 text-xs">{feedback.tag}</Badge>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{feedback.date}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            No feedback yet. Be the first to interact with this agent!
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <ReviewsTab agent={displayAgent} />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {transactionHistory.map((tx, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              <History className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{tx.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {tx.from !== "-" && `From ${tx.from}`}
                                {tx.from !== "-" && tx.to !== "-" && " → "}
                                {tx.to !== "-" && `To ${tx.to}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {tx.price !== "-" && (
                              <p className="font-medium">{tx.price} ETH</p>
                            )}
                            <p className="text-sm text-muted-foreground">{tx.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {recommendations && recommendations.length > 0 && (
              <div data-testid="section-recommendations" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t("detail.youMightLike")}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {recommendations.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="min-w-[200px] max-w-[200px] flex-shrink-0"
                    >
                      <Link href={`/agent/${rec.id}`}>
                        <Card
                          className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 overflow-hidden"
                          data-testid={`card-recommendation-${rec.id}`}
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={rec.imageUrl}
                              alt={rec.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <ChainIcon chain={rec.chain} size={14} />
                              <span className="text-sm font-semibold truncate">{rec.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {rec.modelType}
                            </Badge>
                            <div className="flex flex-wrap gap-1">
                              {rec.capabilities.slice(0, 2).map((cap) => (
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
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{displayAgent.totalSales} {t("detail.sales")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span data-testid="text-footer-favorite-count">{favoriteData?.count ?? 128} {t("detail.favorites")}</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 ml-auto">
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
