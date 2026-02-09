import { db } from "./db";
import { users, agents, listings, type Chain } from "@shared/schema";
import { sql } from "drizzle-orm";

const sampleUsers = [
  {
    username: "CryptoMaster",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    avatarUrl: "/images/agent-1.png",
    bio: "AI agent creator and collector. Building the future of autonomous trading.",
  },
  {
    username: "DevPro",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    avatarUrl: "/images/agent-2.png",
    bio: "Full-stack developer specializing in AI-powered coding assistants.",
  },
  {
    username: "ArtisticMind",
    walletAddress: "0x567890abcdef1234567890abcdef123456789012",
    avatarUrl: "/images/agent-3.png",
    bio: "Digital artist and AI enthusiast. Creating beautiful AI art generators.",
  },
  {
    username: "DataGenius",
    walletAddress: "0x890abcdef1234567890abcdef1234567890abcd",
    avatarUrl: "/images/agent-4.png",
    bio: "Data scientist building AI agents for analytics and research.",
  },
  {
    username: "SecureAI",
    walletAddress: "0xdef1234567890abcdef1234567890abcdef1234",
    avatarUrl: "/images/agent-5.png",
    bio: "Security researcher focused on smart contract auditing AI.",
  },
];

const sampleAgents = [
  {
    name: "Neural Trader Pro",
    description: "Advanced trading agent with real-time market analysis and automated execution capabilities. Uses state-of-the-art machine learning to predict market trends and execute optimal trades.",
    imageUrl: "/images/agent-1.png",
    chain: "eth" as Chain,
    capabilities: ["Trading", "Analysis", "Automation", "Risk Management"],
    personality: "Analytical, precise, and risk-aware. Communicates clearly about market conditions.",
    modelType: "GPT-4",
    royaltyPercentage: "1.00",
    totalSales: 234,
    learningType: "rag" as const,
    learningEnabled: true,
    reputationScore: 92,
    totalFeedbacks: 156,
    verificationType: "tee" as const,
    isVerified: true,
    interactionCount: 12500,
  },
  {
    name: "Code Wizard",
    description: "Expert coding assistant for full-stack development. Helps with debugging, code review, architecture design, and implementing complex features across multiple languages.",
    imageUrl: "/images/agent-2.png",
    chain: "base" as Chain,
    capabilities: ["Coding", "Analysis", "Research", "Debugging"],
    personality: "Patient, thorough, and educational. Explains concepts clearly and suggests best practices.",
    modelType: "Claude",
    royaltyPercentage: "1.00",
    totalSales: 189,
    learningType: "mcp" as const,
    learningEnabled: true,
    reputationScore: 88,
    totalFeedbacks: 234,
    verificationType: "zkp" as const,
    isVerified: true,
    interactionCount: 8900,
  },
  {
    name: "Artisan AI",
    description: "Creative AI agent specializing in digital art, illustrations, and visual content generation. Perfect for artists, designers, and content creators.",
    imageUrl: "/images/agent-3.png",
    chain: "sol" as Chain,
    capabilities: ["Art", "Creative", "Design", "Writing"],
    personality: "Creative, imaginative, and inspiring. Offers artistic suggestions and creative direction.",
    modelType: "Custom",
    royaltyPercentage: "1.00",
    totalSales: 567,
    learningType: "fine_tuning" as const,
    learningEnabled: true,
    reputationScore: 95,
    totalFeedbacks: 412,
    verificationType: "none" as const,
    isVerified: false,
    interactionCount: 25000,
  },
  {
    name: "Data Oracle",
    description: "Powerful data analysis agent with advanced statistical modeling, machine learning, and visualization capabilities. Transform raw data into actionable insights.",
    imageUrl: "/images/agent-4.png",
    chain: "bnb" as Chain,
    capabilities: ["Data", "Analysis", "Research", "Visualization"],
    personality: "Methodical, detail-oriented, and insightful. Presents findings clearly with supporting evidence.",
    modelType: "Llama",
    royaltyPercentage: "1.00",
    totalSales: 123,
    learningType: "merkle_tree" as const,
    learningEnabled: true,
    reputationScore: 78,
    totalFeedbacks: 89,
    verificationType: "hybrid" as const,
    isVerified: true,
    interactionCount: 5600,
  },
  {
    name: "Guardian Agent",
    description: "Security-focused agent for smart contract auditing, vulnerability detection, and blockchain security analysis. Protects your Web3 projects.",
    imageUrl: "/images/agent-5.png",
    chain: "trx" as Chain,
    capabilities: ["Security", "Analysis", "Auditing", "Research"],
    personality: "Vigilant, thorough, and protective. Reports findings with severity levels and remediation steps.",
    modelType: "Mistral",
    royaltyPercentage: "1.00",
    totalSales: 78,
    learningType: "static" as const,
    learningEnabled: false,
    reputationScore: 85,
    totalFeedbacks: 67,
    verificationType: "tee" as const,
    isVerified: true,
    interactionCount: 3200,
  },
  {
    name: "Market Sentinel",
    description: "24/7 market monitoring agent with real-time alerts, trend detection, and portfolio tracking across multiple exchanges and chains.",
    imageUrl: "/images/agent-1.png",
    chain: "eth" as Chain,
    capabilities: ["Trading", "Monitoring", "Analysis", "Alerts"],
    personality: "Alert, responsive, and informative. Provides timely updates without overwhelming.",
    modelType: "GPT-4",
    royaltyPercentage: "1.00",
    totalSales: 345,
    learningType: "reinforcement" as const,
    learningEnabled: true,
    reputationScore: 91,
    totalFeedbacks: 289,
    verificationType: "zkp" as const,
    isVerified: true,
    interactionCount: 18700,
  },
];

const listingPrices = [
  { price: "0.85", currency: "ETH" },
  { price: "0.45", currency: "ETH" },
  { price: "12.5", currency: "SOL" },
  { price: "0.8", currency: "BNB" },
  { price: "1500", currency: "TRX" },
  { price: "1.2", currency: "ETH" },
];

export async function seedDatabase() {
  try {
    const existingAgents = await db.select({ count: sql<number>`count(*)` }).from(agents);
    
    if (Number(existingAgents[0]?.count) > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    const createdUsers = await db.insert(users).values(sampleUsers).returning();
    console.log(`Created ${createdUsers.length} users`);

    const agentsWithOwners = sampleAgents.map((agent, index) => ({
      ...agent,
      creatorId: createdUsers[index % createdUsers.length].id,
      ownerId: createdUsers[(index + 1) % createdUsers.length].id,
    }));

    const createdAgents = await db.insert(agents).values(agentsWithOwners).returning();
    console.log(`Created ${createdAgents.length} agents`);

    const listingsToCreate = createdAgents.slice(0, 5).map((agent, index) => ({
      agentId: agent.id,
      sellerId: agent.ownerId,
      price: listingPrices[index].price,
      currency: listingPrices[index].currency,
    }));

    const createdListings = await db.insert(listings).values(listingsToCreate).returning();
    console.log(`Created ${createdListings.length} listings`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
