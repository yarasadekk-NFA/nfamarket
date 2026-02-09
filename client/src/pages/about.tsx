import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChainIcon } from "@/components/chain-icon";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import {
  Bot,
  Rocket,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Cpu,
  Globe,
  ArrowRight,
  Crown,
  Layers,
  Brain,
  Lock,
  Code,
  Gavel,
  Star,
  Heart,
  BarChart3,
  Clock,
  Sparkles,
  CheckCircle2,
  Target,
  Blocks,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Chain } from "@shared/schema";

const chains: Chain[] = ["eth", "base", "sol", "bnb", "trx"];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function AboutPage() {
  const { t } = useTranslation();
  const { data: stats } = useQuery<{
    totalAgents: number;
    totalVolume: string;
    totalUsers: number;
    totalTransactions: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const statsData = [
    { label: t("about.aiAgents"), value: stats?.totalAgents?.toLocaleString() || "1,200+", icon: Bot },
    { label: t("about.tradingVolume"), value: stats?.totalVolume || "$2.4M+", icon: TrendingUp },
    { label: t("about.activeTraders"), value: stats?.totalUsers?.toLocaleString() || "5,600+", icon: Users },
    { label: t("about.transactions"), value: stats?.totalTransactions?.toLocaleString() || "12,000+", icon: Zap },
  ];

  const featureCards = [
    {
      icon: Globe,
      title: t("about.5chains"),
      description: t("about.5chainsDesc"),
      highlight: t("about.5chainsHighlight"),
    },
    {
      icon: Brain,
      title: t("about.3standards"),
      description: t("about.3standardsDesc"),
      highlight: t("about.3standardsHighlight"),
    },
    {
      icon: Gavel,
      title: t("about.tradingSuite"),
      description: t("about.tradingSuiteDesc"),
      highlight: t("about.tradingSuiteHighlight"),
    },
    {
      icon: ShieldCheck,
      title: t("about.verifiable"),
      description: t("about.verifiableDesc"),
      highlight: t("about.verifiableHighlight"),
    },
    {
      icon: Layers,
      title: t("about.learning"),
      description: t("about.learningDesc"),
      highlight: t("about.learningHighlight"),
    },
    {
      icon: Code,
      title: t("about.byoa"),
      description: t("about.byoaDesc"),
      highlight: t("about.byoaHighlight"),
    },
  ];

  const capabilityCards = [
    { icon: Bot, title: t("about.createMint"), desc: t("about.createMintDesc") },
    { icon: TrendingUp, title: t("about.buySell"), desc: t("about.buySellDesc") },
    { icon: Clock, title: t("about.rentAgents"), desc: t("about.rentAgentsDesc") },
    { icon: Gavel, title: t("about.auctions"), desc: t("about.auctionsDesc") },
    { icon: Heart, title: t("about.offersBids"), desc: t("about.offersBidsDesc") },
    { icon: Layers, title: t("about.collections"), desc: t("about.collectionsDesc") },
    { icon: Star, title: t("about.reviewsRatings"), desc: t("about.reviewsRatingsDesc") },
    { icon: BarChart3, title: t("about.analytics"), desc: t("about.analyticsDesc") },
  ];

  const standardCards = [
    {
      standard: "ERC-8004",
      title: t("about.trustlessAgents"),
      description: t("about.trustlessAgentsDesc"),
      features: [t("about.identityRegistry"), t("about.reputationScore"), t("about.validationSystem"), t("about.interactionTracking")],
    },
    {
      standard: "ERC-7857",
      title: t("about.intelligentNFTs"),
      description: t("about.intelligentNFTsDesc"),
      features: [t("about.encryptedMetadata"), t("about.secureTransfers"), t("about.teeVerification"), t("about.zkpPrivacy")],
    },
    {
      standard: "BAP-578",
      title: t("about.learningAgents"),
      description: t("about.learningAgentsDesc"),
      features: [t("about.ragSupport"), t("about.mcpIntegration"), t("about.fineTuning"), t("about.merkleProofs")],
    },
  ];

  const trustCards = [
    { icon: Lock, title: t("about.smartContractSecurity"), desc: t("about.smartContractSecurityDesc") },
    { icon: Shield, title: t("about.1percentFee"), desc: t("about.1percentFeeDesc") },
    { icon: ShieldCheck, title: t("about.verifiedCreators"), desc: t("about.verifiedCreatorsDesc") },
    { icon: Cpu, title: t("about.agentVerification"), desc: t("about.agentVerificationDesc") },
  ];

  return (
    <div className="min-h-screen" data-testid="page-about">
      <section className="relative overflow-hidden py-24 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "0.8s" }} />
        </div>

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <Badge className="mb-6 px-5 py-2.5 text-sm" variant="secondary" data-testid="badge-pioneer">
              <Crown className="w-4 h-4 mr-2" />
              {t("about.badge")}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
              <span className="text-foreground">{t("about.title1")}</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t("about.title2")}
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("about.subtitle")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore">
                <Button size="lg" className="gap-2 px-8" data-testid="button-explore-about">
                  <Rocket className="w-5 h-5" />
                  {t("about.exploreMarketplace")}
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg" variant="outline" className="gap-2 px-8" data-testid="button-create-about">
                  <Bot className="w-5 h-5" />
                  {t("about.createYourAgent")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat) => (
                <Card key={stat.label} className="p-6 border-border/50 bg-card/50 backdrop-blur-sm text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Target className="w-4 h-4 mr-2" />
              {t("about.ourMission")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t("about.whyExists")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("about.whyExistsDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0 }}>
              <Card className="p-8 h-full border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-xl bg-primary/10 w-fit">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{t("about.problemTitle")}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {t("about.problemDesc")}
                </p>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
              <Card className="p-8 h-full border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-xl bg-accent/10 w-fit">
                  <Crown className="h-7 w-7 text-accent" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{t("about.solutionTitle")}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {t("about.solutionDesc")}
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              {t("about.industryFirst")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t("about.whyWeAre1")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("about.whyWeAre1Desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featureCards.map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors" data-testid={`card-feature-${index}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="p-3 rounded-xl bg-primary/10 w-fit">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs text-primary border-primary/30">
                      {item.highlight}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Blocks className="w-4 h-4 mr-2" />
              {t("about.completePlatform")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t("about.everythingYouNeed")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("about.everythingYouNeedDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {capabilityCards.map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <Card className="p-5 h-full border-border/50 bg-card/50 backdrop-blur-sm" data-testid={`card-capability-${index}`}>
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              {t("about.multiChainArch")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t("about.oneMarketplace")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("about.oneMarketplaceDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { chain: "eth" as Chain, name: "Ethereum", contract: "ERC-721 + ERC-2981", wallet: "MetaMask" },
              { chain: "base" as Chain, name: "Base", contract: "ERC-721 + ERC-2981", wallet: "MetaMask" },
              { chain: "sol" as Chain, name: "Solana", contract: "Metaplex NFT", wallet: "Phantom" },
              { chain: "bnb" as Chain, name: "BNB Chain", contract: "BAP-578 NFA", wallet: "MetaMask" },
              { chain: "trx" as Chain, name: "TRON", contract: "TRC-721", wallet: "TronLink" },
            ].map((c, index) => (
              <motion.div
                key={c.chain}
                {...fadeUp}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Card className="p-5 h-full border-border/50 bg-card/50 backdrop-blur-sm text-center" data-testid={`card-chain-${c.chain}`}>
                  <div className="mx-auto w-fit p-3 rounded-xl bg-primary/10 mb-3">
                    <ChainIcon chain={c.chain} size={28} />
                  </div>
                  <h3 className="font-bold text-sm">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{c.contract}</p>
                  <Badge variant="outline" className="mt-3 text-xs">
                    {c.wallet}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Lock className="w-4 h-4 mr-2" />
              {t("about.aiTokenStandards")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t("about.cuttingEdge")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
              {t("about.cuttingEdgeDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {standardCards.map((item, index) => (
              <motion.div
                key={item.standard}
                {...fadeUp}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full border-border/50 bg-card/50 backdrop-blur-sm" data-testid={`card-standard-${item.standard}`}>
                  <Badge variant="secondary" className="text-xs font-mono mb-4">
                    {item.standard}
                  </Badge>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  <div className="mt-5 space-y-2">
                    {item.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              {t("about.trustTransparency")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t("about.howWeProtect")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {trustCards.map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm text-center" data-testid={`card-trust-${index}`}>
                  <div className="mx-auto w-fit p-3 rounded-xl bg-primary/10 mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-10 lg:p-20 max-w-5xl mx-auto">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
            </div>

            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="relative text-center">
              <h2 className="text-3xl lg:text-5xl font-bold">
                {t("about.joinRevolution")}
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("about.joinRevolutionDesc")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/create">
                  <Button size="lg" className="gap-2 px-8" data-testid="button-create-cta-about">
                    <Bot className="w-5 h-5" />
                    {t("about.createFirstAgent")}
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="gap-2 px-8" data-testid="button-explore-cta-about">
                    <ArrowRight className="w-5 h-5" />
                    {t("about.browseMarketplace")}
                  </Button>
                </Link>
              </div>
            </motion.div>
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
            <p>&copy; 2025 NFA Market. {t("about.badge")}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
