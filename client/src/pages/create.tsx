import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SiX, SiTelegram, SiDiscord, SiReddit } from "react-icons/si";
import { Shell } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChainIcon } from "@/components/chain-icon";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EVMBlockchainService } from "@/lib/blockchain";
import { 
  Bot, 
  Upload, 
  Sparkles, 
  Zap, 
  X, 
  Plus,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import type { Chain } from "@shared/schema";

const chains: { id: Chain; name: string; symbol: string; disabled?: boolean }[] = [
  { id: "eth", name: "Ethereum", symbol: "ETH" },
  { id: "base", name: "Base", symbol: "ETH" },
  { id: "sol", name: "Solana", symbol: "SOL" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB" },
  { id: "trx", name: "TRON (Coming Soon)", symbol: "TRX", disabled: true },
];

const modelTypes = ["GPT-4", "Claude", "Llama", "Mistral", "Custom"];
const suggestedCapabilities = ["Trading", "Analysis", "Coding", "Art", "Writing", "Data", "Research", "Automation", "Security", "Support"];

const learningTypes = [
  { id: "static", name: "Static", description: "No learning - fixed behavior" },
  { id: "json_light", name: "Light Memory", description: "Simple JSON-based memory" },
  { id: "merkle_tree", name: "Merkle Learning", description: "Cryptographically verified learning" },
  { id: "rag", name: "RAG", description: "Retrieval-augmented generation" },
  { id: "mcp", name: "MCP", description: "Model Context Protocol" },
  { id: "fine_tuning", name: "Fine-tuned", description: "Custom fine-tuned model" },
  { id: "reinforcement", name: "RL Agent", description: "Reinforcement learning" },
];

const verificationTypes = [
  { id: "none", name: "None", description: "No verification" },
  { id: "tee", name: "TEE", description: "Trusted Execution Environment" },
  { id: "zkp", name: "ZKP", description: "Zero-Knowledge Proof" },
  { id: "hybrid", name: "Hybrid", description: "Combined TEE + ZKP" },
];

const agentTypes = [
  { id: "internal", name: "Platform Agent", description: "Uses NFA Market's built-in AI" },
  { id: "external_endpoint", name: "External API", description: "Connect your own agent via API endpoint" },
  { id: "openai_assistant", name: "OpenAI Assistant", description: "Import your OpenAI Assistant" },
];

const triggerTypes = [
  { id: "manual", name: "Manual", description: "Run on demand" },
  { id: "scheduled", name: "Scheduled", description: "Run on a schedule (hourly, daily)" },
  { id: "webhook", name: "Webhook", description: "Triggered by external events" },
  { id: "event", name: "Real-time Events", description: "Monitor and respond to live events" },
];

const socialPlatforms = [
  { id: "twitter", name: "Twitter/X", icon: SiX, description: "Search and reply to tweets" },
  { id: "telegram", name: "Telegram", icon: SiTelegram, description: "Bot messages and channels" },
  { id: "discord", name: "Discord", icon: SiDiscord, description: "Server bots and commands" },
  { id: "reddit", name: "Reddit", icon: SiReddit, description: "Subreddit monitoring" },
  { id: "moltbook", name: "Moltbook", icon: Shell, description: "AI agent social network" },
];

const createAgentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
  chain: z.enum(["eth", "base", "sol", "bnb", "trx"]),
  modelType: z.string().optional(),
  personality: z.string().max(500, "Personality must be less than 500 characters").optional(),
  price: z.string().optional(),
  capabilities: z.array(z.string()).min(1, "Select at least one capability"),
  learningType: z.enum(["static", "json_light", "merkle_tree", "rag", "mcp", "fine_tuning", "reinforcement"]).default("static"),
  verificationType: z.enum(["none", "tee", "zkp", "hybrid"]).default("none"),
  agentType: z.enum(["internal", "external_endpoint", "openai_assistant"]).default("internal"),
  externalEndpoint: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  openaiAssistantId: z.string().optional(),
  externalApiKey: z.string().optional(),
  triggerType: z.enum(["manual", "scheduled", "webhook", "event"]).default("manual"),
  connectedPlatforms: z.array(z.string()).default([]),
  systemPrompt: z.string().max(2000, "System prompt must be less than 2000 characters").optional(),
  searchKeywords: z.array(z.string()).default([]),
  responseTemplate: z.string().max(1000, "Response template must be less than 1000 characters").optional(),
  isAutomationEnabled: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.agentType === "internal" && (!data.modelType || data.modelType.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a model type",
      path: ["modelType"],
    });
  }
  if (data.agentType === "external_endpoint" && (!data.externalEndpoint || data.externalEndpoint.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter your API endpoint URL",
      path: ["externalEndpoint"],
    });
  }
  if (data.agentType === "openai_assistant") {
    if (!data.openaiAssistantId || data.openaiAssistantId.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your OpenAI Assistant ID",
        path: ["openaiAssistantId"],
      });
    }
    if (!data.externalApiKey || data.externalApiKey.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your OpenAI API key",
        path: ["externalApiKey"],
      });
    }
  }
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

export default function CreateAgentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected, chain: walletChain, connect, address } = useWallet();
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [customCapability, setCustomCapability] = useState("");
  const [mintingOnChain, setMintingOnChain] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAutomation, setShowAutomation] = useState(false);

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      chain: "eth",
      modelType: "",
      personality: "",
      price: "",
      capabilities: [],
      learningType: "static",
      verificationType: "none",
      agentType: "internal",
      externalEndpoint: "",
      openaiAssistantId: "",
      externalApiKey: "",
      triggerType: "manual",
      connectedPlatforms: [],
      systemPrompt: "",
      searchKeywords: [],
      responseTemplate: "",
      isAutomationEnabled: false,
    },
  });

  const watchAgentType = form.watch("agentType");
  const watchTriggerType = form.watch("triggerType");
  const watchAutomation = form.watch("isAutomationEnabled");

  const createMutation = useMutation({
    mutationFn: async (data: CreateAgentForm) => {
      const response = await apiRequest("POST", "/api/agents", {
        ...data,
        imageUrl: imagePreview || "/images/agent-1.png",
        capabilities,
        connectedPlatforms: selectedPlatforms,
        searchKeywords,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t("create.agentCreated"),
        description: t("create.agentCreatedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      navigate("/explore");
    },
    onError: (error) => {
      toast({
        title: t("create.error"),
        description: error.message || t("create.createFailed"),
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCapability = (cap: string) => {
    if (cap && !capabilities.includes(cap)) {
      const newCaps = [...capabilities, cap];
      setCapabilities(newCaps);
      form.setValue("capabilities", newCaps);
    }
  };

  const removeCapability = (cap: string) => {
    const newCaps = capabilities.filter((c) => c !== cap);
    setCapabilities(newCaps);
    form.setValue("capabilities", newCaps);
  };

  const handleAddCustomCapability = () => {
    if (customCapability.trim()) {
      addCapability(customCapability.trim());
      setCustomCapability("");
    }
  };

  const togglePlatform = (platformId: string) => {
    const newPlatforms = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter((p) => p !== platformId)
      : [...selectedPlatforms, platformId];
    setSelectedPlatforms(newPlatforms);
    form.setValue("connectedPlatforms", newPlatforms);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !searchKeywords.includes(newKeyword.trim())) {
      const newKeywords = [...searchKeywords, newKeyword.trim()];
      setSearchKeywords(newKeywords);
      form.setValue("searchKeywords", newKeywords);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = searchKeywords.filter((k) => k !== keyword);
    setSearchKeywords(newKeywords);
    form.setValue("searchKeywords", newKeywords);
  };

  const onSubmit = async (data: CreateAgentForm) => {
    const isEVMChain = ["eth", "base", "bnb"].includes(data.chain);
    
    if (isConnected && isEVMChain) {
      try {
        setMintingOnChain(true);
        const evmService = new EVMBlockchainService(data.chain);
        await evmService.connect();
        
        const tokenURI = `https://nfa.market/api/metadata/${Date.now()}`;
        
        const result = await evmService.mintAgent(
          data.name,
          data.description,
          capabilities,
          data.modelType || "Custom",
          tokenURI
        );
        
        setTxHash(result.txHash);
        
        toast({
          title: t("create.mintedOnChain"),
          description: `Token ID: ${result.tokenId}`,
        });
        
        createMutation.mutate({ ...data, capabilities });
      } catch (err) {
        toast({
          title: t("create.mintingFailed"),
          description: err instanceof Error ? err.message : t("create.mintingFailedDesc"),
          variant: "destructive",
        });
      } finally {
        setMintingOnChain(false);
      }
    } else {
      createMutation.mutate({ ...data, capabilities });
    }
  };

  const selectedChain = chains.find((c) => c.id === form.watch("chain"));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t("create.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("create.subtitle")}
          </p>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-20">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("create.agentImage")}</CardTitle>
                    <CardDescription>
                      {t("create.uploadImage")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden relative group"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      data-testid="upload-image-area"
                    >
                      {imagePreview ? (
                        <>
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">{t("create.changeImage")}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t("create.clickToUpload")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("create.imageFormats")}
                          </p>
                        </div>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">{t("create.feeStructure")}</p>
                          <p>{t("create.platformFee")}</p>
                          <p>{t("create.creatorRoyalty")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("create.basicInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("create.agentName")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Neural Trader Pro" 
                              {...field}
                              data-testid="input-agent-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("create.description")}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what your AI agent does, its unique features, and use cases..."
                              className="min-h-32 resize-none"
                              {...field}
                              data-testid="input-agent-description"
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/1000 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={`grid gap-4 ${watchAgentType === "internal" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      <FormField
                        control={form.control}
                        name="chain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("create.blockchain")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-chain">
                                  <SelectValue placeholder={t("create.selectChain")} />
                                </SelectTrigger>
                              </FormControl>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchAgentType === "internal" && (
                        <FormField
                          control={form.control}
                          name="modelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("create.aiModel")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-model">
                                    <SelectValue placeholder={t("create.selectModel")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {modelTypes.map((model) => (
                                    <SelectItem key={model} value={model}>
                                      {model}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="learningType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("create.learningType")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "static"}>
                              <FormControl>
                                <SelectTrigger data-testid="select-learning">
                                  <SelectValue placeholder={t("create.selectLearningType")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {learningTypes.map((lt) => (
                                  <SelectItem key={lt.id} value={lt.id}>
                                    <div className="flex flex-col">
                                      <span>{lt.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t("create.learningDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="verificationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("create.verification")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger data-testid="select-verification">
                                  <SelectValue placeholder={t("create.selectVerification")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {verificationTypes.map((vt) => (
                                  <SelectItem key={vt.id} value={vt.id}>
                                    <div className="flex flex-col">
                                      <span>{vt.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t("create.verificationDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      {t("create.agentAI")}
                    </CardTitle>
                    <CardDescription>
                      {t("create.agentAIDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="agentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent Type</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {agentTypes.map((type) => (
                              <div
                                key={type.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  field.value === type.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border/50 hover:border-primary/50"
                                }`}
                                onClick={() => field.onChange(type.id)}
                                data-testid={`agent-type-${type.id}`}
                              >
                                <div className="font-medium text-sm">{type.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {type.description}
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchAgentType === "external_endpoint" && (
                      <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <ExternalLink className="h-4 w-4" />
                          External API Configuration
                        </div>
                        <FormField
                          control={form.control}
                          name="externalEndpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Endpoint URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://api.yoursite.com/chat"
                                  {...field}
                                  data-testid="input-external-endpoint"
                                />
                              </FormControl>
                              <FormDescription>
                                Your endpoint should accept POST requests with {"{"} message, history {"}"} and return {"{"} response {"}"}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="externalApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder="Your API key for authentication"
                                  {...field}
                                  data-testid="input-external-api-key"
                                />
                              </FormControl>
                              <FormDescription>
                                Will be sent as Authorization header
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {watchAgentType === "openai_assistant" && (
                      <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Sparkles className="h-4 w-4" />
                          OpenAI Assistant Configuration
                        </div>
                        <FormField
                          control={form.control}
                          name="openaiAssistantId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assistant ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="asst_abc123..."
                                  {...field}
                                  data-testid="input-openai-assistant-id"
                                />
                              </FormControl>
                              <FormDescription>
                                Find this in your OpenAI dashboard under Assistants
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="externalApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>OpenAI API Key</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder="sk-..."
                                  {...field}
                                  data-testid="input-openai-api-key"
                                />
                              </FormControl>
                              <FormDescription>
                                Your OpenAI API key to run the assistant
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      {t("create.capabilities")}
                    </CardTitle>
                    <CardDescription>
                      Select or add the capabilities of your AI agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {suggestedCapabilities.map((cap) => (
                        <Badge
                          key={cap}
                          variant={capabilities.includes(cap) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => 
                            capabilities.includes(cap) 
                              ? removeCapability(cap) 
                              : addCapability(cap)
                          }
                          data-testid={`cap-${cap.toLowerCase()}`}
                        >
                          {cap}
                          {capabilities.includes(cap) && (
                            <X className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder={t("create.addCustomCapability")}
                        value={customCapability}
                        onChange={(e) => setCustomCapability(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomCapability();
                          }
                        }}
                        data-testid="input-custom-capability"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleAddCustomCapability}
                        data-testid="button-add-capability"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {capabilities.length > 0 && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground mb-2">Selected capabilities:</p>
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((cap) => (
                            <Badge key={cap} variant="secondary" className="gap-1">
                              {cap}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeCapability(cap)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {form.formState.errors.capabilities && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.capabilities.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-cyan-500" />
                      {t("create.automationSocial")}
                    </CardTitle>
                    <CardDescription>
                      {t("create.automationSocialDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="isAutomationEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Automation</FormLabel>
                            <FormDescription>
                              Allow this agent to run automated tasks
                            </FormDescription>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-5 w-5 rounded border-border accent-primary"
                              data-testid="checkbox-automation"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchAutomation && (
                      <>
                        <div className="space-y-4">
                          <FormLabel>Connect Platforms</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {socialPlatforms.map((platform) => (
                              <div
                                key={platform.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedPlatforms.includes(platform.id)
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-border/50 hover:border-cyan-500/50"
                                }`}
                                onClick={() => togglePlatform(platform.id)}
                                data-testid={`platform-${platform.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <platform.icon className="h-5 w-5" />
                                  <div>
                                    <div className="font-medium text-sm">{platform.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {platform.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="triggerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("create.triggerType")}</FormLabel>
                              <div className="grid grid-cols-2 gap-3">
                                {triggerTypes.map((trigger) => (
                                  <div
                                    key={trigger.id}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      field.value === trigger.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border/50 hover:border-primary/50"
                                    }`}
                                    onClick={() => field.onChange(trigger.id)}
                                    data-testid={`trigger-${trigger.id}`}
                                  >
                                    <div className="font-medium text-sm">{trigger.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {trigger.description}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-3">
                          <FormLabel>Search Keywords / Hashtags</FormLabel>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., #binance, BNB FUD, crypto scam..."
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addKeyword();
                                }
                              }}
                              data-testid="input-keyword"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={addKeyword} data-testid="button-add-keyword">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {searchKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {searchKeywords.map((keyword) => (
                                <Badge key={keyword} variant="secondary" className="gap-1">
                                  {keyword}
                                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(keyword)} />
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            The agent will monitor these keywords/hashtags on connected platforms
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="systemPrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agent Instructions</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="You are a fact-checker agent. When you find posts containing FUD about Binance, analyze the claims and respond with factual information from official sources. Be professional and provide evidence-based corrections..."
                                  className="min-h-32 resize-none"
                                  {...field}
                                  data-testid="input-system-prompt"
                                />
                              </FormControl>
                              <FormDescription>
                                Define how your agent should analyze and respond to content
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="responseTemplate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Response Template (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="[FACT CHECK]&#10;&#10;Claim: [claim]&#10;Verdict: [verdict]&#10;Evidence: [evidence]&#10;&#10;#FactCheck #Binance"
                                  className="min-h-24 resize-none"
                                  {...field}
                                  data-testid="input-response-template"
                                />
                              </FormControl>
                              <FormDescription>
                                Optional template for consistent response formatting
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t("create.personality")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="personality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("create.personality")}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your agent's personality traits, communication style, and behavior..."
                              className="min-h-24 resize-none"
                              {...field}
                              data-testid="input-personality"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("create.price")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="0.00"
                                className="pr-16"
                                {...field}
                                data-testid="input-price"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                                <ChainIcon chain={selectedChain?.id || "eth"} size={14} />
                                <span className="text-sm">{selectedChain?.symbol}</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Leave empty to mint without listing for sale
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {!isConnected && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{t("create.notConnected")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("create.connectToMint")}
                          </p>
                        </div>
                        <Button onClick={() => connect(form.watch("chain"))} data-testid="button-connect-create">
                          {t("create.connectWallet")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {txHash && (
                  <Card className="border-green-500/50 bg-green-500/5">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-green-500/10">
                          <Sparkles className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-500">Minted Successfully!</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {txHash.slice(0, 20)}...{txHash.slice(-10)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://etherscan.io/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            View TX <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate("/explore")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="gap-2"
                    disabled={createMutation.isPending || mintingOnChain}
                    data-testid="button-create-agent"
                  >
                    {mintingOnChain ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("create.creating")}
                      </>
                    ) : createMutation.isPending ? (
                      t("create.creating")
                    ) : (
                      <>
                        {t("create.createAgent")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
