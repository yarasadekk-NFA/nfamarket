import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Download,
  X,
  Plus,
  ArrowRight,
  FileCode,
  Hash,
  Link2,
  Loader2,
  CheckCircle2,
  Globe,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import type { Chain } from "@shared/schema";

const chains: { id: Chain; name: string; symbol: string; disabled?: boolean }[] = [
  { id: "eth", name: "Ethereum", symbol: "ETH" },
  { id: "base", name: "Base", symbol: "ETH" },
  { id: "sol", name: "Solana", symbol: "SOL" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB" },
  { id: "trx", name: "TRON (Coming Soon)", symbol: "TRX", disabled: true },
];

const suggestedCapabilities = ["Trading", "Analysis", "Coding", "Art", "Writing", "Data", "Research", "Automation", "Security", "Support"];

const importSources = [
  { id: "opensea", name: "OpenSea" },
  { id: "rarible", name: "Rarible" },
  { id: "looksrare", name: "LooksRare" },
  { id: "blur", name: "Blur" },
  { id: "magiceden", name: "Magic Eden" },
  { id: "tensor", name: "Tensor" },
  { id: "other", name: "Other" },
];

const importSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  tokenId: z.string().min(1, "Token ID is required"),
  chain: z.enum(["eth", "base", "sol", "bnb", "trx"]),
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  capabilities: z.array(z.string()).min(1, "Select at least one capability"),
  importedFrom: z.string().default("other"),
});

type ImportForm = z.infer<typeof importSchema>;

export default function ImportPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [customCapability, setCustomCapability] = useState("");

  const form = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      contractAddress: "",
      tokenId: "",
      chain: "eth",
      name: "",
      description: "",
      capabilities: [],
      importedFrom: "other",
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: ImportForm) => {
      const response = await apiRequest("POST", "/api/agents/import", {
        ...data,
        capabilities,
      });
      return response.json();
    },
    onSuccess: (agent) => {
      toast({
        title: t("import.imported"),
        description: `${agent.name} has been imported to NFA Market.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      navigate(`/agent/${agent.id}`);
    },
    onError: (error) => {
      toast({
        title: t("import.importFailed"),
        description: error instanceof Error ? error.message : "Failed to import NFT",
        variant: "destructive",
      });
    },
  });

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

  const onSubmit = (data: ImportForm) => {
    importMutation.mutate({ ...data, capabilities });
  };

  const features = [
    { icon: FileCode, title: t("import.anyContract"), desc: t("import.anyContractDesc") },
    { icon: Globe, title: t("import.anyMarketplace"), desc: t("import.anyMarketplaceDesc") },
    { icon: Shield, title: t("import.secureListing"), desc: t("import.secureListingDesc") },
  ];

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
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-import-title">{t("import.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("import.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="p-2 rounded-md bg-primary/10 shrink-0">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  {t("import.contractDetails")}
                </CardTitle>
                <CardDescription>
                  {t("import.contractDetailsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("import.blockchain")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-import-chain">
                              <SelectValue placeholder="Select chain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chains.filter(c => !c.disabled).map((chain) => (
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

                  <FormField
                    control={form.control}
                    name="importedFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("import.sourceMarketplace")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-import-source">
                              <SelectValue placeholder={t("import.sourceMarketplacePlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {importSources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("import.contractAddress")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="0x1234...abcd"
                            className="pl-10 font-mono"
                            {...field}
                            data-testid="input-contract-address"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("import.contractAddressDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tokenId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("import.tokenId")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="1234"
                            className="pl-10 font-mono"
                            {...field}
                            data-testid="input-token-id"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("import.tokenIdDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t("import.agentDetails")}</CardTitle>
                <CardDescription>
                  {t("import.agentDetailsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("import.agentName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., My Imported Agent"
                          {...field}
                          data-testid="input-import-name"
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
                      <FormLabel>{t("import.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this agent's capabilities and what makes it unique..."
                          className="min-h-24 resize-none"
                          {...field}
                          data-testid="input-import-description"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>{t("import.capabilities")}</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {suggestedCapabilities.map((cap) => (
                      <Badge
                        key={cap}
                        variant={capabilities.includes(cap) ? "default" : "outline"}
                        className="cursor-pointer toggle-elevate"
                        onClick={() =>
                          capabilities.includes(cap)
                            ? removeCapability(cap)
                            : addCapability(cap)
                        }
                        data-testid={`badge-cap-${cap.toLowerCase()}`}
                      >
                        {cap}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("import.addCustomCapability")}
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
                    <div className="flex flex-wrap gap-1 mt-3">
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
                  )}
                  {form.formState.errors.capabilities && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.capabilities.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/explore")}
                data-testid="button-cancel-import"
              >
                {t("import.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={importMutation.isPending}
                className="gap-2"
                data-testid="button-submit-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("import.importing")}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t("import.importNFT")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
