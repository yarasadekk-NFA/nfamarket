import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentCard } from "@/components/agent-card";
import { StatsCard } from "@/components/stats-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Check, 
  Settings, 
  ExternalLink,
  Bot,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Edit,
  Loader2,
  CalendarDays,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Agent, Chain, User, RentalListing, ActiveRental } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

const DEMO_USER_ID = "4601060e-bd5b-4f5c-8d85-2ce1a22d5215";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", DEMO_USER_ID],
  });

  const { data: userAgents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: userRentals, isLoading: rentalsLoading } = useQuery<{
    renting: ActiveRental[];
    rentedOut: ActiveRental[];
  }>({
    queryKey: ["/api/users", DEMO_USER_ID, "rentals"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${DEMO_USER_ID}/rentals`);
      if (!response.ok) throw new Error("Failed to fetch rentals");
      return response.json();
    },
  });

  const myRentals = userRentals?.renting;
  const rentedOut = userRentals?.rentedOut;
  const myRentalsLoading = rentalsLoading;
  const rentedOutLoading = rentalsLoading;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/users/${DEMO_USER_ID}`, {
        username: editUsername,
        bio: editBio,
        avatarUrl: editAvatarUrl || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = () => {
    setEditUsername(user?.username || "");
    setEditBio(user?.bio || "");
    setEditAvatarUrl(user?.avatarUrl || "");
    setEditDialogOpen(true);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user?.walletAddress || "0x1234567890abcdef1234567890abcdef12345678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayUsername = user?.username || "CryptoMaster";
  const displayBio = user?.bio || "AI agent creator and collector. Building the future of autonomous trading and automation.";
  const displayAvatar = user?.avatarUrl || "/images/agent-3.png";
  const displayWallet = user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "0x1234...5678";

  const demoAgents = [
    {
      id: "owned-1",
      name: "Neural Trader Pro",
      description: "Advanced trading agent with real-time market analysis.",
      imageUrl: "/images/agent-1.png",
      chain: "eth" as Chain,
      price: "0.85",
      currency: "ETH",
      capabilities: ["Trading", "Analysis"],
      modelType: "GPT-4",
      totalSales: 234,
      creatorName: "You",
    },
    {
      id: "owned-2",
      name: "Code Wizard",
      description: "Expert coding assistant for full-stack development.",
      imageUrl: "/images/agent-2.png",
      chain: "base" as Chain,
      price: "0.45",
      currency: "ETH",
      capabilities: ["Coding", "Analysis"],
      modelType: "Claude",
      totalSales: 189,
      creatorName: "You",
    },
  ];

  const createdAgents = [
    {
      id: "created-1",
      name: "Artisan AI",
      description: "Creative AI for digital art and illustrations.",
      imageUrl: "/images/agent-3.png",
      chain: "sol" as Chain,
      price: "12.5",
      currency: "SOL",
      capabilities: ["Art", "Creative"],
      modelType: "Custom",
      totalSales: 567,
      creatorName: "You",
    },
  ];

  const transactions = [
    { type: "Sold", agent: "Data Oracle", price: "0.8 BNB", date: "2 hours ago", profit: "+0.79 BNB" },
    { type: "Bought", agent: "Neural Trader Pro", price: "0.85 ETH", date: "1 day ago", profit: "-" },
    { type: "Sold", agent: "Code Wizard", price: "0.45 ETH", date: "3 days ago", profit: "+0.44 ETH" },
    { type: "Listed", agent: "Artisan AI", price: "12.5 SOL", date: "1 week ago", profit: "-" },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 relative">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
              </div>
            </div>
            
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="text-2xl">{displayUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h1 className="text-2xl font-bold">{displayUsername}</h1>
                    <Badge variant="secondary">Verified Creator</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <code className="text-sm font-mono">{displayWallet}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={copyAddress}
                      data-testid="button-copy-wallet"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={openEditDialog} data-testid="button-edit-profile">
                    <Edit className="h-4 w-4" />
                    {t("profile.editProfile")}
                  </Button>
                  <Button variant="outline" size="icon" data-testid="button-settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-muted-foreground max-w-2xl">
                {displayBio}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatsCard
            title="Agents Owned"
            value="8"
            icon={Bot}
            index={0}
          />
          <StatsCard
            title="Agents Created"
            value="3"
            icon={Wallet}
            index={1}
          />
          <StatsCard
            title="Total Sales"
            value="$12,450"
            change="+24% this month"
            changeType="positive"
            icon={TrendingUp}
            index={2}
          />
          <StatsCard
            title="Royalties Earned"
            value="$1,234"
            change="+18% this month"
            changeType="positive"
            icon={ShoppingCart}
            index={3}
          />
        </div>

        <Tabs defaultValue="owned" className="mt-8">
          <TabsList>
            <TabsTrigger value="owned" className="gap-2" data-testid="tab-owned">
              <Bot className="h-4 w-4" />
              {t("profile.owned")} (8)
            </TabsTrigger>
            <TabsTrigger value="created" className="gap-2" data-testid="tab-created">
              <Wallet className="h-4 w-4" />
              {t("profile.created")} (3)
            </TabsTrigger>
            <TabsTrigger value="rentals" className="gap-2" data-testid="tab-rentals">
              <CalendarDays className="h-4 w-4" />
              {t("profile.rentals")}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2" data-testid="tab-activity">
              <TrendingUp className="h-4 w-4" />
              {t("profile.activity")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="mt-6">
            {agentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="aspect-square bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(userAgents || demoAgents).map((agent, index) => (
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
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {createdAgents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rentals" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-500" />
                    My Rentals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myRentalsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : (myRentals || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>You haven't rented any agents yet</p>
                      <Link href="/explore">
                        <Button variant="outline" className="mt-4" data-testid="button-browse-rentals">
                          Browse Agents
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(myRentals || []).map((rental) => {
                        const endDate = new Date(rental.endDate);
                        const now = new Date();
                        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;
                        const isExpired = daysLeft <= 0;
                        
                        return (
                          <motion.div
                            key={rental.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-muted/50 border border-border/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                                  <Bot className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                  <Link href={`/agent/${rental.agentId}`}>
                                    <p className="font-medium hover:text-primary cursor-pointer" data-testid={`link-rental-agent-${rental.id}`}>
                                      Agent #{rental.agentId.slice(0, 8)}
                                    </p>
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    {rental.daysRented} days rental
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"}
                                  className={isExpiringSoon && !isExpired ? "bg-amber-500/20 text-amber-500" : ""}
                                >
                                  {isExpired ? "Expired" : `${daysLeft} days left`}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {rental.totalPrice} {rental.currency}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Rented Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rentedOutLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : (rentedOut || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>None of your agents are currently rented</p>
                      <p className="text-sm mt-1">List an agent for rent to start earning</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(rentedOut || []).map((rental) => {
                        const endDate = new Date(rental.endDate);
                        const now = new Date();
                        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <motion.div
                            key={rental.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-muted/50 border border-border/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                  <Bot className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <Link href={`/agent/${rental.agentId}`}>
                                    <p className="font-medium hover:text-primary cursor-pointer" data-testid={`link-rented-out-agent-${rental.id}`}>
                                      Agent #{rental.agentId.slice(0, 8)}
                                    </p>
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    Rented by {rental.renterId?.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-500">
                                  +{rental.totalPrice} {rental.currency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between py-4 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          tx.type === "Sold" ? "bg-green-500/10" :
                          tx.type === "Bought" ? "bg-blue-500/10" :
                          "bg-muted/50"
                        }`}>
                          {tx.type === "Sold" ? (
                            <TrendingUp className={`h-4 w-4 text-green-500`} />
                          ) : tx.type === "Bought" ? (
                            <ShoppingCart className={`h-4 w-4 text-blue-500`} />
                          ) : (
                            <Bot className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.type} <span className="text-primary">{tx.agent}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tx.price}</p>
                        {tx.profit !== "-" && (
                          <p className="text-sm text-green-500">{tx.profit}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.editProfile")}</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter your username"
                data-testid="input-edit-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                data-testid="input-edit-avatar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                data-testid="input-edit-bio"
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => updateProfileMutation.mutate()}
              disabled={!editUsername || updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
