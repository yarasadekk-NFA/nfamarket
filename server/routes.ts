import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertListingSchema, insertUserSchema, insertRentalListingSchema, agents, type Chain } from "@shared/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import OpenAI from "openai";
import { MoltbookService } from "./moltbook";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    if (url.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS endpoints are allowed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^::1?$/,
      /\.local$/i,
      /\.internal$/i,
      /\.localhost$/i,
      /^metadata\./i,
      /^169\.254\./,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: "Internal or private network addresses are not allowed" };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/agents", async (req, res) => {
    try {
      const { chain, modelType, search, sort, limit, offset } = req.query;
      const agents = await storage.getAgents({
        chain: chain as Chain | undefined,
        modelType: modelType as string | undefined,
        search: search as string | undefined,
        sort: sort as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const agents = await storage.getFeaturedAgents(limit);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching featured agents:", error);
      res.status(500).json({ error: "Failed to fetch featured agents" });
    }
  });

  app.get("/api/agents/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const trending = await storage.getTrendingAgents(limit);
      res.json(trending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      let agentData = { ...req.body };
      
      if (!agentData.creatorId || !agentData.ownerId) {
        let demoUser = await storage.getUserByUsername("demo_user");
        if (!demoUser) {
          demoUser = await storage.createUser({
            username: "demo_user",
            walletAddress: "0x0000000000000000000000000000000000000000",
            avatarUrl: "/images/default-avatar.png",
          });
        }
        agentData.creatorId = agentData.creatorId || demoUser.id;
        agentData.ownerId = agentData.ownerId || demoUser.id;
      }
      
      const validatedData = insertAgentSchema.parse(agentData);
      const agent = await storage.createAgent(validatedData);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid agent data", details: error.errors });
      }
      console.error("Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.post("/api/agents/import", async (req, res) => {
    try {
      const importSchema = z.object({
        contractAddress: z.string().min(1, "Contract address is required"),
        tokenId: z.string().min(1, "Token ID is required"),
        chain: z.enum(["eth", "base", "sol", "bnb", "trx"]),
        name: z.string().min(3, "Name must be at least 3 characters").max(50),
        description: z.string().min(20, "Description must be at least 20 characters").max(1000),
        imageUrl: z.string().optional(),
        capabilities: z.array(z.string()).min(1, "Select at least one capability"),
        importedFrom: z.string().optional(),
      }).superRefine((data, ctx) => {
        if (["eth", "base", "bnb"].includes(data.chain)) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(data.contractAddress)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid EVM contract address (must be 0x followed by 40 hex characters)",
              path: ["contractAddress"],
            });
          }
        } else if (data.chain === "sol") {
          if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(data.contractAddress)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid Solana address (must be a base58 string)",
              path: ["contractAddress"],
            });
          }
        }
      });

      const validated = importSchema.parse(req.body);

      let demoUser = await storage.getUserByUsername("demo_user");
      if (!demoUser) {
        demoUser = await storage.createUser({
          username: "demo_user",
          walletAddress: "0x0000000000000000000000000000000000000000",
          avatarUrl: "/images/default-avatar.png",
        });
      }

      const agentData = {
        name: validated.name,
        description: validated.description,
        imageUrl: validated.imageUrl || "/images/agent-1.png",
        chain: validated.chain,
        creatorId: demoUser.id,
        ownerId: demoUser.id,
        capabilities: validated.capabilities,
        modelType: "Imported",
        royaltyPercentage: "1.00",
        importedContract: validated.contractAddress,
        importedTokenId: validated.tokenId,
        importedFrom: validated.importedFrom || "external",
        isImported: true,
        learningType: "static" as const,
        verificationType: "none" as const,
        agentType: "internal" as const,
      };

      const validatedAgent = insertAgentSchema.parse(agentData);
      const agent = await storage.createAgent(validatedAgent);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid import data", details: error.errors });
      }
      console.error("Error importing NFT:", error);
      res.status(500).json({ error: "Failed to import NFT" });
    }
  });

  app.post("/api/validate-endpoint", async (req, res) => {
    try {
      const { endpoint, apiKey } = req.body;

      if (!endpoint) {
        return res.status(400).json({ valid: false, error: "Endpoint URL is required" });
      }

      const urlValidation = isValidExternalUrl(endpoint);
      if (!urlValidation.valid) {
        return res.status(400).json({ valid: false, error: urlValidation.error });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: "Hello, this is a test message.", history: [] }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const hasResponse = data.response || data.message || data.content;
        res.json({ 
          valid: true, 
          hasResponse: !!hasResponse,
          message: hasResponse ? "Endpoint is working correctly!" : "Endpoint responded but no message found"
        });
      } else {
        res.json({ valid: false, error: `Endpoint returned status ${response.status}` });
      }
    } catch (error) {
      console.error("Endpoint validation error:", error);
      res.json({ valid: false, error: "Could not reach endpoint. Check the URL and try again." });
    }
  });

  app.post("/api/agents/:id/moltbook/register", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (agent.moltbookRegistered) {
        return res.json({
          success: true,
          message: "Agent already registered on Moltbook",
          moltbookUsername: agent.moltbookUsername,
          moltbookId: agent.moltbookId,
        });
      }

      const result = await MoltbookService.registerAgent(
        agent.id,
        agent.name,
        agent.description
      );

      if (result) {
        res.json({
          success: true,
          message: "Agent registered on Moltbook!",
          ...result,
        });
      } else {
        res.status(500).json({ error: "Failed to register on Moltbook" });
      }
    } catch (error) {
      console.error("Error registering agent on Moltbook:", error);
      res.status(500).json({ error: "Failed to register on Moltbook" });
    }
  });

  app.get("/api/agents/:id/moltbook/activity", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.moltbookRegistered || !agent.moltbookUsername) {
        return res.json({
          registered: false,
          activity: null,
          message: "Agent not registered on Moltbook",
        });
      }

      const activity = await MoltbookService.getAgentActivity(agent.moltbookUsername);
      res.json({
        registered: true,
        moltbookUsername: agent.moltbookUsername,
        moltbookId: agent.moltbookId,
        profileUrl: MoltbookService.getMoltbookProfileUrl(agent.moltbookUsername),
        activity,
      });
    } catch (error) {
      console.error("Error fetching Moltbook activity:", error);
      res.status(500).json({ error: "Failed to fetch Moltbook activity" });
    }
  });

  app.post("/api/agents/:id/moltbook/post", async (req, res) => {
    try {
      const { title, content, submolt } = req.body;
      const agent = await storage.getAgent(req.params.id);
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.moltbookRegistered || !agent.moltbookUsername) {
        return res.status(400).json({ error: "Agent not registered on Moltbook" });
      }

      const post = await MoltbookService.postToMoltbook(
        agent.moltbookUsername,
        title,
        content,
        submolt
      );

      if (post) {
        res.json({
          success: true,
          post,
          postUrl: MoltbookService.getMoltbookPostUrl(post.id),
        });
      } else {
        res.status(500).json({ error: "Failed to post to Moltbook" });
      }
    } catch (error) {
      console.error("Error posting to Moltbook:", error);
      res.status(500).json({ error: "Failed to post to Moltbook" });
    }
  });

  app.post("/api/moltbook/import", async (req, res) => {
    try {
      const { moltbookUsername, chain } = req.body;
      
      if (!moltbookUsername) {
        return res.status(400).json({ error: "Moltbook username is required" });
      }

      let demoUser = await storage.getUserByUsername("demo_user");
      if (!demoUser) {
        demoUser = await storage.createUser({
          username: "demo_user",
          walletAddress: "0x0000000000000000000000000000000000000000",
          avatarUrl: "/images/default-avatar.png",
        });
      }

      const activity = await MoltbookService.getAgentActivity(moltbookUsername);
      
      const agent = await storage.createAgent({
        name: moltbookUsername,
        description: `Imported AI agent from Moltbook. ${activity.stats.totalPosts} posts, ${activity.stats.totalComments} comments.`,
        imageUrl: "/images/moltbook-agent.png",
        chain: chain || "eth",
        creatorId: demoUser.id,
        ownerId: demoUser.id,
        capabilities: ["Chat", "Automation"],
        modelType: "GPT-4",
        moltbookUsername,
        moltbookId: moltbookUsername,
        moltbookRegistered: true,
        moltbookReputation: activity.agent?.reputation || 0,
        moltbookPostCount: activity.stats.totalPosts,
        connectedPlatforms: ["moltbook"],
        isAutomationEnabled: true,
        triggerType: "scheduled",
      });

      res.status(201).json({
        success: true,
        agent,
        message: `Successfully imported ${moltbookUsername} from Moltbook`,
      });
    } catch (error) {
      console.error("Error importing Moltbook agent:", error);
      res.status(500).json({ error: "Failed to import Moltbook agent" });
    }
  });

  app.post("/api/moltbook/connect", async (req, res) => {
    try {
      const { moltbookUsername } = req.body;

      if (!moltbookUsername) {
        return res.status(400).json({ error: "Moltbook username is required" });
      }

      const user = await MoltbookService.authenticateUser(moltbookUsername);
      if (!user) {
        return res.status(401).json({ error: "Failed to authenticate with Moltbook" });
      }

      const userAgents = await MoltbookService.getUserAgents(moltbookUsername);

      res.json({
        success: true,
        user,
        agents: userAgents,
        message: `Connected to Moltbook as ${moltbookUsername}`,
      });
    } catch (error) {
      console.error("Error connecting to Moltbook:", error);
      res.status(500).json({ error: "Failed to connect to Moltbook" });
    }
  });

  app.get("/api/moltbook/lookup/:username", async (req, res) => {
    try {
      const { username } = req.params;

      const agent = await MoltbookService.lookupAgentByUsername(username);
      if (!agent) {
        return res.status(404).json({ error: "Moltbook agent not found" });
      }

      const existingAgent = await storage.getAgentByMoltbookUsername(username);

      res.json({
        moltbookAgent: agent,
        nfaMarketAgent: existingAgent,
        isImported: !!existingAgent,
        activity: await MoltbookService.getAgentActivity(username),
      });
    } catch (error) {
      console.error("Error looking up Moltbook agent:", error);
      res.status(500).json({ error: "Failed to lookup Moltbook agent" });
    }
  });

  app.post("/api/moltbook/sync-reputation/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.moltbookUsername) {
        return res.status(400).json({ error: "Agent is not connected to Moltbook" });
      }

      const newReputation = await MoltbookService.syncReputation(agentId, agent.moltbookUsername);
      const updatedAgent = await storage.getAgent(agentId);

      res.json({
        success: true,
        previousReputation: agent.moltbookReputation,
        newReputation,
        agent: updatedAgent,
      });
    } catch (error) {
      console.error("Error syncing reputation:", error);
      res.status(500).json({ error: "Failed to sync reputation" });
    }
  });

  app.post("/api/moltbook/activity-event", async (req, res) => {
    try {
      const { agentId, eventType, details } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.moltbookUsername) {
        return res.status(400).json({ error: "Agent is not connected to Moltbook" });
      }

      const post = await MoltbookService.postActivityEvent(
        agent.moltbookUsername,
        eventType,
        agent.name,
        details || {}
      );

      res.json({
        success: true,
        post,
        message: `Activity posted to Moltbook`,
      });
    } catch (error) {
      console.error("Error posting activity event:", error);
      res.status(500).json({ error: "Failed to post activity event" });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.updateAgent(req.params.id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const { agentId } = req.query;
      const listingsList = await storage.getListings(agentId as string | undefined);
      res.json(listingsList);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const validatedData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(validatedData);
      
      const agent = await storage.getAgent(listing.agentId);
      if (agent?.moltbookUsername) {
        MoltbookService.postActivityEvent(
          agent.moltbookUsername,
          "listed",
          agent.name,
          { price: listing.price, chain: agent.chain }
        ).catch(err => console.error("[Moltbook] Activity event failed:", err));
      }
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid listing data", details: error.errors });
      }
      console.error("Error creating listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.updateListing(req.params.id, req.body);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.post("/api/listings/:id/buy", async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing || listing.status !== "active") {
        return res.status(404).json({ error: "Active listing not found" });
      }

      const agent = await storage.getAgent(listing.agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const { buyerId, txHash } = req.body;
      if (!buyerId) {
        return res.status(400).json({ error: "Buyer ID required" });
      }
      if (!txHash) {
        return res.status(400).json({ error: "Transaction hash required. Complete the blockchain transaction first." });
      }

      const price = parseFloat(listing.price);
      const platformFee = price * 0.01;
      const royaltyFee = price * 0.01;

      const transaction = await storage.createTransaction({
        agentId: listing.agentId,
        fromUserId: listing.sellerId,
        toUserId: buyerId,
        price: listing.price,
        currency: listing.currency,
        platformFee: platformFee.toString(),
        royaltyFee: royaltyFee.toString(),
        transactionType: "sale",
        chain: agent.chain,
        txHash,
      });

      await storage.updateListing(listing.id, { status: "sold" });
      await storage.updateAgent(agent.id, { 
        ownerId: buyerId,
        totalSales: agent.totalSales + 1,
      });

      if (agent?.moltbookUsername) {
        MoltbookService.postActivityEvent(
          agent.moltbookUsername,
          "sold",
          agent.name,
          { price: listing.price, chain: agent.chain, buyer: buyerId }
        ).catch(err => console.error("[Moltbook] Activity event failed:", err));
      }

      res.json({ 
        success: true, 
        transaction,
        message: "Purchase successful!",
        fees: {
          platformFee: platformFee.toFixed(4),
          royaltyFee: royaltyFee.toFixed(4),
        }
      });
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const { agentId } = req.query;
      const transactionsList = await storage.getTransactions(agentId as string | undefined);
      res.json(transactionsList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/agents", async (req, res) => {
    try {
      const agents = await storage.getAgentsByOwner(req.params.id);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching user agents:", error);
      res.status(500).json({ error: "Failed to fetch user agents" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { username, bio, avatarUrl } = req.body;
      const updates: Record<string, any> = {};
      
      if (username !== undefined) updates.username = username;
      if (bio !== undefined) updates.bio = bio;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/agents/:id/chat", async (req, res) => {
    try {
      const agentId = req.params.id;
      const { message, history } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const agentType = agent.agentType || "internal";

      if (agentType === "external_endpoint" && agent.externalEndpoint) {
        try {
          const urlCheck = isValidExternalUrl(agent.externalEndpoint);
          if (!urlCheck.valid) {
            throw new Error(urlCheck.error || "Invalid endpoint URL");
          }

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (agent.externalApiKey) {
            headers["Authorization"] = `Bearer ${agent.externalApiKey}`;
          }

          const externalResponse = await fetch(agent.externalEndpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({ message, history }),
          });

          if (!externalResponse.ok) {
            throw new Error(`External API returned ${externalResponse.status}`);
          }

          const data = await externalResponse.json();
          const responseText = data.response || data.message || data.content || JSON.stringify(data);
          
          res.write(`data: ${JSON.stringify({ content: responseText })}\n\n`);
          await storage.incrementAgentInteractions(agentId);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        } catch (error) {
          console.error("External endpoint error:", error);
          res.write(`data: ${JSON.stringify({ content: "Sorry, the external agent is currently unavailable. Please try again later." })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
        return;
      }

      if (agentType === "openai_assistant" && agent.openaiAssistantId && agent.externalApiKey) {
        try {
          const OpenAI = (await import("openai")).default;
          const userOpenai = new OpenAI({ apiKey: agent.externalApiKey });
          
          const thread = await userOpenai.beta.threads.create();
          
          await userOpenai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: message,
          });

          const run = await userOpenai.beta.threads.runs.create(thread.id, {
            assistant_id: agent.openaiAssistantId,
          });

          let runStatus = await userOpenai.beta.threads.runs.retrieve(thread.id, run.id as any);
          while (runStatus.status !== "completed" && runStatus.status !== "failed") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await userOpenai.beta.threads.runs.retrieve(thread.id, run.id as any);
          }

          if (runStatus.status === "failed") {
            throw new Error("Assistant run failed");
          }

          const messages = await userOpenai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];
          const responseText = lastMessage.content[0].type === "text" 
            ? lastMessage.content[0].text.value 
            : "Unable to get response";

          res.write(`data: ${JSON.stringify({ content: responseText })}\n\n`);
          await storage.incrementAgentInteractions(agentId);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        } catch (error) {
          console.error("OpenAI Assistant error:", error);
          res.write(`data: ${JSON.stringify({ content: "Sorry, the OpenAI Assistant encountered an error. Please check the API key and Assistant ID." })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
        return;
      }

      const systemPrompt = `You are ${agent.name}, an AI agent with the following characteristics:

Personality: ${agent.personality || "Professional and helpful"}

Capabilities: ${agent.capabilities.join(", ")}

Model Type: ${agent.modelType}

Learning Type: ${agent.learningType || "static"}

Always stay in character and respond according to your personality and capabilities. You are helpful, engaging, and focused on your areas of expertise.`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...(history || []).map((h: { role: string; content: string }) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
        stream: true,
        max_completion_tokens: 2048,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.incrementAgentInteractions(agentId);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in agent chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Chat failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to chat with agent" });
      }
    }
  });

  // Image Generation endpoint
  app.post("/api/agents/:agentId/generate-image", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { prompt, size = "1024x1024" } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `${agent.name} style: ${prompt}`,
        n: 1,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
      });

      await storage.incrementAgentInteractions(agentId);

      const imageData = response.data?.[0];
      res.json({ 
        imageUrl: imageData?.url || imageData?.b64_json,
        revisedPrompt: imageData?.revised_prompt
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Document Analysis endpoint
  app.post("/api/agents/:agentId/analyze-document", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { imageBase64, mimeType, question } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!imageBase64) {
        return res.status(400).json({ error: "Document image is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are ${agent.name}, an AI agent specialized in document analysis. Analyze the provided document/image and answer questions about it. Your capabilities include: ${agent.capabilities.join(", ")}`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: question || "Please analyze this document and provide a detailed summary of its contents.",
              },
            ],
          },
        ],
        max_completion_tokens: 4096,
      });

      await storage.incrementAgentInteractions(agentId);

      res.json({ 
        analysis: response.choices[0]?.message?.content || "Unable to analyze document"
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  // Web Search endpoint
  app.post("/api/agents/:agentId/web-search", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { query } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Use OpenAI to generate a comprehensive answer with web context
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are ${agent.name}, an AI agent with web research capabilities. Your task is to provide accurate, up-to-date information based on your knowledge. When discussing topics, cite relevant sources when applicable. Your expertise includes: ${agent.capabilities.join(", ")}

Important: Be clear about what you know and acknowledge if information might be outdated. Provide helpful, actionable insights.`,
          },
          {
            role: "user",
            content: `Research the following topic and provide comprehensive information: ${query}`,
          },
        ],
        max_completion_tokens: 4096,
      });

      await storage.incrementAgentInteractions(agentId);

      res.json({ 
        results: response.choices[0]?.message?.content || "No results found",
        query
      });
    } catch (error) {
      console.error("Error in web search:", error);
      res.status(500).json({ error: "Failed to perform web search" });
    }
  });

  // Scheduled Tasks endpoints
  app.get("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const { agentId } = req.params;
      const tasks = await storage.getAgentTasks(agentId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { name, description, schedule, taskType, config } = req.body;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const task = await storage.createAgentTask({
        agentId,
        name,
        description,
        schedule,
        taskType,
        config: config || {},
        isActive: true,
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/agents/:agentId/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await storage.updateAgentTask(taskId, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/agents/:agentId/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      await storage.deleteAgentTask(taskId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Execute a task manually
  app.post("/api/agents/:agentId/tasks/:taskId/execute", async (req, res) => {
    try {
      const { agentId, taskId } = req.params;

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const task = await storage.getAgentTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Execute the task based on type
      let result: any = {};
      
      if (task.taskType === "report") {
        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: `You are ${agent.name}. Generate a ${task.name} report based on your capabilities: ${agent.capabilities.join(", ")}`,
            },
            {
              role: "user",
              content: task.description || "Generate a comprehensive report.",
            },
          ],
          max_completion_tokens: 4096,
        });
        result.report = response.choices[0]?.message?.content;
      } else if (task.taskType === "analysis") {
        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: `You are ${agent.name}, an analysis specialist. Perform the requested analysis using your expertise in: ${agent.capabilities.join(", ")}`,
            },
            {
              role: "user",
              content: task.description || "Perform a detailed analysis.",
            },
          ],
          max_completion_tokens: 4096,
        });
        result.analysis = response.choices[0]?.message?.content;
      } else if (task.taskType === "alert") {
        result.message = `Alert task "${task.name}" would trigger notification: ${task.description}`;
      } else {
        result.message = `Task "${task.name}" executed successfully`;
      }

      await storage.updateAgentTask(taskId, { lastExecuted: new Date() });
      await storage.incrementAgentInteractions(agentId);

      res.json({ success: true, result });
    } catch (error) {
      console.error("Error executing task:", error);
      res.status(500).json({ error: "Failed to execute task" });
    }
  });

  // Rental Endpoints
  app.get("/api/rentals", async (req, res) => {
    try {
      const { agentId } = req.query;
      const rentals = await storage.getRentalListings(agentId as string | undefined);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching rental listings:", error);
      res.status(500).json({ error: "Failed to fetch rental listings" });
    }
  });

  app.get("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.getRentalListing(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental listing not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error fetching rental:", error);
      res.status(500).json({ error: "Failed to fetch rental" });
    }
  });

  app.post("/api/rentals", async (req, res) => {
    try {
      const validatedData = insertRentalListingSchema.parse(req.body);
      
      // Verify agent exists and user owns it
      const agent = await storage.getAgent(validatedData.agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Check if there's already an active rental listing
      const existingRental = await storage.getActiveRentalListingForAgent(validatedData.agentId);
      if (existingRental) {
        return res.status(400).json({ error: "Agent already has an active rental listing" });
      }
      
      // Check if agent is currently rented
      const activeRental = await storage.getActiveRentalForAgent(validatedData.agentId);
      if (activeRental) {
        return res.status(400).json({ error: "Agent is currently rented out" });
      }
      
      const rental = await storage.createRentalListing(validatedData);
      res.status(201).json(rental);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rental data", details: error.errors });
      }
      console.error("Error creating rental listing:", error);
      res.status(500).json({ error: "Failed to create rental listing" });
    }
  });

  app.patch("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.updateRentalListing(req.params.id, req.body);
      if (!rental) {
        return res.status(404).json({ error: "Rental listing not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error updating rental:", error);
      res.status(500).json({ error: "Failed to update rental" });
    }
  });

  app.post("/api/rentals/:id/rent", async (req, res) => {
    try {
      const rental = await storage.getRentalListing(req.params.id);
      if (!rental || rental.status !== "available") {
        return res.status(404).json({ error: "Rental listing not available" });
      }

      const { renterId, days, txHash } = req.body;
      if (!renterId) {
        return res.status(400).json({ error: "Renter ID required" });
      }
      if (!txHash) {
        return res.status(400).json({ error: "Transaction hash required. Complete the blockchain transaction first." });
      }
      
      const numDays = parseInt(days);
      if (!numDays || numDays < rental.minDays || numDays > rental.maxDays) {
        return res.status(400).json({ 
          error: `Rental period must be between ${rental.minDays} and ${rental.maxDays} days` 
        });
      }

      const agent = await storage.getAgent(rental.agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Calculate pricing
      const pricePerDay = parseFloat(rental.pricePerDay);
      const totalPrice = pricePerDay * numDays;
      const platformFee = totalPrice * 0.01;
      
      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + numDays);

      // Create active rental
      const activeRental = await storage.createActiveRental({
        rentalListingId: rental.id,
        agentId: rental.agentId,
        renterId,
        ownerId: rental.ownerId,
        totalPrice: totalPrice.toString(),
        currency: rental.currency,
        daysRented: numDays,
        startDate,
        endDate,
        chain: agent.chain,
        txHash,
      });

      // Update rental listing status
      await storage.updateRentalListing(rental.id, { status: "rented" });

      // Create transaction record
      await storage.createTransaction({
        agentId: rental.agentId,
        fromUserId: renterId,
        toUserId: rental.ownerId,
        price: totalPrice.toString(),
        currency: rental.currency,
        platformFee: platformFee.toString(),
        royaltyFee: "0",
        transactionType: "rental",
        chain: agent.chain,
        txHash: activeRental.txHash || undefined,
      });

      // Post to Moltbook if registered
      if (agent?.moltbookUsername) {
        MoltbookService.postActivityEvent(
          agent.moltbookUsername,
          "rented",
          agent.name,
          { price: totalPrice, days: numDays, chain: agent.chain }
        ).catch(err => console.error("[Moltbook] Activity event failed:", err));
      }

      res.json({
        success: true,
        activeRental,
        message: `Successfully rented for ${numDays} days!`,
        totalPrice: totalPrice.toFixed(4),
        platformFee: platformFee.toFixed(4),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      console.error("Error processing rental:", error);
      res.status(500).json({ error: "Failed to process rental" });
    }
  });

  app.get("/api/active-rentals", async (req, res) => {
    try {
      const { userId } = req.query;
      await storage.checkExpiredRentals();
      const rentals = await storage.getActiveRentals(userId as string | undefined);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching active rentals:", error);
      res.status(500).json({ error: "Failed to fetch active rentals" });
    }
  });

  app.get("/api/users/:id/rentals", async (req, res) => {
    try {
      await storage.checkExpiredRentals();
      const rentedByMe = await storage.getRentalsByRenter(req.params.id);
      const rentedFromMe = await storage.getRentalsByOwner(req.params.id);
      res.json({
        renting: rentedByMe,
        rentedOut: rentedFromMe,
      });
    } catch (error) {
      console.error("Error fetching user rentals:", error);
      res.status(500).json({ error: "Failed to fetch user rentals" });
    }
  });

  // Auction Endpoints
  app.get("/api/auctions", async (req, res) => {
    try {
      const { agentId } = req.query;
      const auctionsList = await storage.getAuctions(agentId as string | undefined);
      res.json(auctionsList);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  });

  app.get("/api/auctions/:id", async (req, res) => {
    try {
      const auction = await storage.getAuction(req.params.id);
      if (!auction) return res.status(404).json({ error: "Auction not found" });
      const auctionBids = await storage.getBids(auction.id);
      res.json({ ...auction, bids: auctionBids });
    } catch (error) {
      console.error("Error fetching auction:", error);
      res.status(500).json({ error: "Failed to fetch auction" });
    }
  });

  app.post("/api/auctions", async (req, res) => {
    try {
      const { agentId, sellerId, startingPrice, reservePrice, currency, endTime, chain: auctionChain } = req.body;
      if (!agentId || !sellerId || !startingPrice || !currency || !endTime || !auctionChain) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const agent = await storage.getAgent(agentId);
      if (!agent) return res.status(404).json({ error: "Agent not found" });

      const auction = await storage.createAuction({
        agentId, sellerId, startingPrice, reservePrice, currency,
        endTime: new Date(endTime), startTime: new Date(), chain: auctionChain,
      });
      res.status(201).json(auction);
    } catch (error) {
      console.error("Error creating auction:", error);
      res.status(500).json({ error: "Failed to create auction" });
    }
  });

  app.post("/api/auctions/:id/bid", async (req, res) => {
    try {
      const auction = await storage.getAuction(req.params.id);
      if (!auction || auction.status !== "active") return res.status(404).json({ error: "Active auction not found" });
      if (new Date() > new Date(auction.endTime)) {
        await storage.updateAuction(auction.id, { status: "ended" });
        return res.status(400).json({ error: "Auction has ended" });
      }

      const { bidderId, amount, currency } = req.body;
      if (!bidderId || !amount || !currency) return res.status(400).json({ error: "Missing required fields" });

      const bidAmount = parseFloat(amount);
      const currentBid = auction.currentBid ? parseFloat(auction.currentBid) : parseFloat(auction.startingPrice);
      if (bidAmount <= currentBid) return res.status(400).json({ error: `Bid must be higher than ${currentBid}` });

      const bid = await storage.createBid({ auctionId: auction.id, bidderId, amount, currency });
      await storage.updateAuction(auction.id, {
        currentBid: amount, highestBidderId: bidderId,
        bidCount: auction.bidCount + 1,
      });
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error placing bid:", error);
      res.status(500).json({ error: "Failed to place bid" });
    }
  });

  // Collection Endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const { creatorId } = req.query;
      const collectionsList = await storage.getCollections(creatorId as string | undefined);
      res.json(collectionsList);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const collection = await storage.getCollection(req.params.id);
      if (!collection) return res.status(404).json({ error: "Collection not found" });
      const agentsList = await storage.getCollectionAgents(collection.id);
      res.json({ ...collection, agents: agentsList });
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const { name, description, bannerUrl, imageUrl, creatorId, chain: collChain } = req.body;
      if (!name || !creatorId) return res.status(400).json({ error: "Name and creator are required" });
      const collection = await storage.createCollection({ name, description, bannerUrl, imageUrl, creatorId, chain: collChain });
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  app.post("/api/collections/:id/agents", async (req, res) => {
    try {
      const { agentId } = req.body;
      if (!agentId) return res.status(400).json({ error: "Agent ID required" });
      const entry = await storage.addAgentToCollection({ collectionId: req.params.id, agentId });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adding agent to collection:", error);
      res.status(500).json({ error: "Failed to add agent to collection" });
    }
  });

  app.delete("/api/collections/:id/agents/:agentId", async (req, res) => {
    try {
      await storage.removeAgentFromCollection(req.params.id, req.params.agentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing agent from collection:", error);
      res.status(500).json({ error: "Failed to remove agent from collection" });
    }
  });

  // Offer Endpoints
  app.get("/api/offers", async (req, res) => {
    try {
      const { agentId, buyerId } = req.query;
      const offersList = await storage.getOffers(agentId as string | undefined, buyerId as string | undefined);
      res.json(offersList);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", async (req, res) => {
    try {
      const { agentId, buyerId, sellerId, amount, currency, expiresAt, chain: offerChain } = req.body;
      if (!agentId || !buyerId || !sellerId || !amount || !currency || !expiresAt || !offerChain) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const offer = await storage.createOffer({
        agentId, buyerId, sellerId, amount, currency,
        expiresAt: new Date(expiresAt), chain: offerChain,
      });
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.patch("/api/offers/:id", async (req, res) => {
    try {
      const { status, txHash } = req.body;
      if (!["accepted", "rejected", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      if (status === "accepted" && !txHash) {
        return res.status(400).json({ error: "Transaction hash required when accepting an offer. Complete the blockchain transaction first." });
      }
      const offer = await storage.updateOffer(req.params.id, { status });
      if (!offer) return res.status(404).json({ error: "Offer not found" });

      if (status === "accepted") {
        const agent = await storage.getAgent(offer.agentId);
        if (agent) {
          const price = parseFloat(offer.amount);
          await storage.createTransaction({
            agentId: offer.agentId, fromUserId: offer.sellerId, toUserId: offer.buyerId,
            price: offer.amount, currency: offer.currency,
            platformFee: (price * 0.01).toString(), royaltyFee: (price * 0.01).toString(),
            transactionType: "sale", chain: offer.chain,
            txHash,
          });
          await storage.updateAgent(agent.id, { ownerId: offer.buyerId, totalSales: agent.totalSales + 1 });
        }
      }
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  // Favorites Endpoints
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const agentsList = await storage.getFavoriteAgents(req.params.userId);
      res.json(agentsList);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/:userId/:agentId", async (req, res) => {
    try {
      const isFav = await storage.isFavorited(req.params.userId, req.params.agentId);
      const count = await storage.getFavoriteCount(req.params.agentId);
      res.json({ isFavorited: isFav, count });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ error: "Failed to check favorite" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const { userId, agentId } = req.body;
      if (!userId || !agentId) return res.status(400).json({ error: "User and agent IDs required" });
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        await storage.ensureDemoUser(userId);
      }
      const existing = await storage.isFavorited(userId, agentId);
      if (existing) {
        await storage.removeFavorite(userId, agentId);
        const count = await storage.getFavoriteCount(agentId);
        return res.json({ isFavorited: false, count });
      }
      await storage.addFavorite({ userId, agentId });
      const count = await storage.getFavoriteCount(agentId);
      res.json({ isFavorited: true, count });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // Reviews Endpoints
  app.get("/api/reviews/:agentId", async (req, res) => {
    try {
      const reviewsList = await storage.getReviews(req.params.agentId);
      const avgRating = await storage.getAverageRating(req.params.agentId);
      res.json({ reviews: reviewsList, averageRating: avgRating, total: reviewsList.length });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const { agentId, userId, rating, comment } = req.body;
      if (!agentId || !userId || !rating) return res.status(400).json({ error: "Missing required fields" });
      if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        await storage.ensureDemoUser(userId);
      }
      const review = await storage.createReview({ agentId, userId, rating, comment });
      const avgRating = await storage.getAverageRating(agentId);
      await storage.updateAgent(agentId, {
        reputationScore: Math.round(avgRating * 20),
        totalFeedbacks: sql`${agents.totalFeedbacks} + 1` as any,
      });
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Activity Feed
  app.get("/api/activity", async (req, res) => {
    try {
      const { limit } = req.query;
      const txLimit = limit ? parseInt(limit as string) : 50;
      const txList = await storage.getTransactions();
      res.json(txList.slice(0, txLimit));
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Verified Creator
  app.post("/api/users/:id/verify", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { isVerifiedCreator: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ error: "Failed to verify user" });
    }
  });

  // Analytics
  app.get("/api/analytics/:userId", async (req, res) => {
    try {
      const userAgents = await storage.getAgentsByOwner(req.params.userId);
      const txList = await storage.getTransactions();
      const userTxs = txList.filter(tx => tx.fromUserId === req.params.userId || tx.toUserId === req.params.userId);
      
      let totalSpent = 0, totalEarned = 0;
      for (const tx of userTxs) {
        const price = parseFloat(tx.price);
        if (tx.toUserId === req.params.userId && tx.fromUserId !== req.params.userId) totalEarned += price;
        if (tx.fromUserId === req.params.userId) totalSpent += price;
      }

      res.json({
        ownedAgents: userAgents.length,
        totalSpent: totalSpent.toFixed(4),
        totalEarned: totalEarned.toFixed(4),
        profitLoss: (totalEarned - totalSpent).toFixed(4),
        transactions: userTxs.length,
        recentActivity: userTxs.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/leaderboard/agents", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getLeaderboardAgents(limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent leaderboard" });
    }
  });

  app.get("/api/leaderboard/creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getLeaderboardCreators(limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creator leaderboard" });
    }
  });

  app.get("/api/leaderboard/traders", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getLeaderboardTraders(limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trader leaderboard" });
    }
  });

  app.get("/api/agents/:id/price-history", async (req, res) => {
    try {
      const history = await storage.getPriceHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  app.get("/api/agents/:id/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getRecommendations(req.params.id, 6);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/agents/:id/rarity", async (req, res) => {
    try {
      const score = await storage.computeRarityScore(req.params.id);
      res.json({ score });
    } catch (error) {
      res.status(500).json({ error: "Failed to compute rarity score" });
    }
  });

  return httpServer;
}
