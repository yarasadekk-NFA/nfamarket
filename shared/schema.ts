import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chainEnum = pgEnum('chain', ['eth', 'base', 'sol', 'bnb', 'trx']);
export const listingStatusEnum = pgEnum('listing_status', ['active', 'sold', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['sale', 'listing', 'transfer', 'rental']);
export const rentalStatusEnum = pgEnum('rental_status', ['available', 'rented', 'cancelled']);
export const learningTypeEnum = pgEnum('learning_type', ['static', 'json_light', 'merkle_tree', 'rag', 'mcp', 'fine_tuning', 'reinforcement']);
export const verificationTypeEnum = pgEnum('verification_type', ['none', 'tee', 'zkp', 'hybrid']);
export const agentTypeEnum = pgEnum('agent_type', ['internal', 'external_endpoint', 'openai_assistant']);
export const triggerTypeEnum = pgEnum('trigger_type', ['manual', 'scheduled', 'webhook', 'event']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  isVerifiedCreator: boolean("is_verified_creator").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  chain: chainEnum("chain").notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  capabilities: text("capabilities").array().notNull(),
  personality: text("personality"),
  modelType: text("model_type"),
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).default("1.00").notNull(),
  totalSales: integer("total_sales").default(0).notNull(),
  learningType: learningTypeEnum("learning_type").default("static").notNull(),
  learningEnabled: boolean("learning_enabled").default(false).notNull(),
  reputationScore: integer("reputation_score").default(0).notNull(),
  totalFeedbacks: integer("total_feedbacks").default(0).notNull(),
  verificationType: verificationTypeEnum("verification_type").default("none").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  interactionCount: integer("interaction_count").default(0).notNull(),
  agentType: agentTypeEnum("agent_type").default("internal").notNull(),
  externalEndpoint: text("external_endpoint"),
  openaiAssistantId: text("openai_assistant_id"),
  externalApiKey: text("external_api_key"),
  triggerType: triggerTypeEnum("trigger_type").default("manual"),
  automationConfig: text("automation_config").default("{}"),
  connectedPlatforms: text("connected_platforms").array().default([]),
  systemPrompt: text("system_prompt"),
  searchKeywords: text("search_keywords").array().default([]),
  responseTemplate: text("response_template"),
  isAutomationEnabled: boolean("is_automation_enabled").default(false),
  moltbookUsername: text("moltbook_username"),
  moltbookId: text("moltbook_id"),
  moltbookReputation: integer("moltbook_reputation").default(0),
  moltbookPostCount: integer("moltbook_post_count").default(0),
  moltbookRegistered: boolean("moltbook_registered").default(false),
  importedContract: text("imported_contract"),
  importedTokenId: text("imported_token_id"),
  importedFrom: text("imported_from"),
  isImported: boolean("is_imported").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: listingStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  platformFee: decimal("platform_fee", { precision: 18, scale: 8 }).notNull(),
  royaltyFee: decimal("royalty_fee", { precision: 18, scale: 8 }).notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  txHash: text("tx_hash"),
  chain: chainEnum("chain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  totalSales: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type Chain = 'eth' | 'base' | 'sol' | 'bnb' | 'trx';

export const chainInfo: Record<Chain, { name: string; symbol: string; color: string; icon: string }> = {
  eth: { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'ethereum' },
  base: { name: 'Base', symbol: 'ETH', color: '#0052FF', icon: 'base' },
  sol: { name: 'Solana', symbol: 'SOL', color: '#9945FF', icon: 'solana' },
  bnb: { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', icon: 'bnb' },
  trx: { name: 'TRON', symbol: 'TRX', color: '#FF0013', icon: 'tron' },
};

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskTypeEnum = pgEnum('task_type', ['report', 'analysis', 'alert', 'automation', 'custom']);
export const taskScheduleEnum = pgEnum('task_schedule', ['once', 'hourly', 'daily', 'weekly', 'monthly']);

export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  taskType: taskTypeEnum("task_type").default("custom").notNull(),
  schedule: taskScheduleEnum("schedule").default("once").notNull(),
  config: text("config").default("{}").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastExecuted: timestamp("last_executed"),
  nextExecution: timestamp("next_execution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentChats = pgTable("agent_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentMessages = pgTable("agent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").references(() => agentChats.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentChatSchema = createInsertSchema(agentChats).omit({
  id: true,
  createdAt: true,
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  lastExecuted: true,
  nextExecution: true,
});

export type InsertAgentChat = z.infer<typeof insertAgentChatSchema>;
export type AgentChat = typeof agentChats.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;

export const rentalListings = pgTable("rental_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  pricePerDay: decimal("price_per_day", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  minDays: integer("min_days").default(1).notNull(),
  maxDays: integer("max_days").default(100).notNull(),
  status: rentalStatusEnum("status").default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activeRentals = pgTable("active_rentals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalListingId: varchar("rental_listing_id").references(() => rentalListings.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  renterId: varchar("renter_id").references(() => users.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  totalPrice: decimal("total_price", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  daysRented: integer("days_rented").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  txHash: text("tx_hash"),
  chain: chainEnum("chain").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRentalListingSchema = createInsertSchema(rentalListings).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertActiveRentalSchema = createInsertSchema(activeRentals).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export type InsertRentalListing = z.infer<typeof insertRentalListingSchema>;
export type RentalListing = typeof rentalListings.$inferSelect;
export type InsertActiveRental = z.infer<typeof insertActiveRentalSchema>;
export type ActiveRental = typeof activeRentals.$inferSelect;

export const auctionStatusEnum = pgEnum('auction_status', ['active', 'ended', 'cancelled']);

export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  startingPrice: decimal("starting_price", { precision: 18, scale: 8 }).notNull(),
  reservePrice: decimal("reserve_price", { precision: 18, scale: 8 }),
  currentBid: decimal("current_bid", { precision: 18, scale: 8 }),
  currency: text("currency").notNull(),
  status: auctionStatusEnum("status").default("active").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time").notNull(),
  highestBidderId: varchar("highest_bidder_id").references(() => users.id),
  bidCount: integer("bid_count").default(0).notNull(),
  chain: chainEnum("chain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").references(() => auctions.id).notNull(),
  bidderId: varchar("bidder_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  imageUrl: text("image_url"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  chain: chainEnum("chain"),
  floorPrice: decimal("floor_price", { precision: 18, scale: 8 }),
  totalVolume: decimal("total_volume", { precision: 18, scale: 8 }).default("0"),
  agentCount: integer("agent_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectionAgents = pgTable("collection_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => collections.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const offerStatusEnum = pgEnum('offer_status', ['pending', 'accepted', 'rejected', 'expired', 'cancelled']);

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: offerStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  chain: chainEnum("chain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({ id: true, createdAt: true, status: true, currentBid: true, highestBidderId: true, bidCount: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, floorPrice: true, totalVolume: true, agentCount: true });
export const insertCollectionAgentSchema = createInsertSchema(collectionAgents).omit({ id: true, addedAt: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, status: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type CollectionAgent = typeof collectionAgents.$inferSelect;
export type InsertCollectionAgent = z.infer<typeof insertCollectionAgentSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
