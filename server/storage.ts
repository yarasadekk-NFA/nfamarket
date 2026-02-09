import { 
  type User, type InsertUser,
  type Agent, type InsertAgent,
  type Listing, type InsertListing,
  type Transaction, type InsertTransaction,
  type AgentTask, type InsertAgentTask,
  type RentalListing, type InsertRentalListing,
  type ActiveRental, type InsertActiveRental,
  type Auction, type InsertAuction,
  type Bid, type InsertBid,
  type Collection, type InsertCollection,
  type CollectionAgent, type InsertCollectionAgent,
  type Offer, type InsertOffer,
  type Favorite, type InsertFavorite,
  type Review, type InsertReview,
  users, agents, listings, transactions, agentTasks, rentalListings, activeRentals,
  auctions, bids, collections, collectionAgents, offers, favorites, reviews,
  type Chain
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql, lte, gte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  ensureDemoUser(userId: string): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  getAgents(options?: {
    chain?: Chain;
    modelType?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  getFeaturedAgents(limit?: number): Promise<Agent[]>;
  getAgentsByOwner(ownerId: string): Promise<Agent[]>;
  getAgentsByCreator(creatorId: string): Promise<Agent[]>;
  getAgentByMoltbookUsername(username: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;

  getListings(agentId?: string): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  getActiveListingForAgent(agentId: string): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, updates: Partial<Listing>): Promise<Listing | undefined>;

  getTransactions(agentId?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  incrementAgentInteractions(agentId: string): Promise<void>;

  getStats(): Promise<{
    totalAgents: number;
    totalVolume: string;
    totalUsers: number;
    totalTransactions: number;
  }>;

  getAgentTasks(agentId: string): Promise<AgentTask[]>;
  getAgentTask(id: string): Promise<AgentTask | undefined>;
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined>;
  deleteAgentTask(id: string): Promise<void>;

  getRentalListings(agentId?: string): Promise<RentalListing[]>;
  getRentalListing(id: string): Promise<RentalListing | undefined>;
  getActiveRentalListingForAgent(agentId: string): Promise<RentalListing | undefined>;
  createRentalListing(rental: InsertRentalListing): Promise<RentalListing>;
  updateRentalListing(id: string, updates: Partial<RentalListing>): Promise<RentalListing | undefined>;

  getActiveRentals(userId?: string): Promise<ActiveRental[]>;
  getActiveRental(id: string): Promise<ActiveRental | undefined>;
  getActiveRentalForAgent(agentId: string): Promise<ActiveRental | undefined>;
  getRentalsByOwner(ownerId: string): Promise<ActiveRental[]>;
  getRentalsByRenter(renterId: string): Promise<ActiveRental[]>;
  createActiveRental(rental: InsertActiveRental): Promise<ActiveRental>;
  updateActiveRental(id: string, updates: Partial<ActiveRental>): Promise<ActiveRental | undefined>;
  checkExpiredRentals(): Promise<void>;

  getAuctions(agentId?: string): Promise<Auction[]>;
  getAuction(id: string): Promise<Auction | undefined>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: string, updates: Partial<Auction>): Promise<Auction | undefined>;
  getBids(auctionId: string): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;

  getCollections(creatorId?: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | undefined>;
  getCollectionAgents(collectionId: string): Promise<Agent[]>;
  addAgentToCollection(data: InsertCollectionAgent): Promise<CollectionAgent>;
  removeAgentFromCollection(collectionId: string, agentId: string): Promise<void>;

  getOffers(agentId?: string, buyerId?: string): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | undefined>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined>;

  getFavorites(userId: string): Promise<Favorite[]>;
  getFavoriteAgents(userId: string): Promise<Agent[]>;
  isFavorited(userId: string, agentId: string): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, agentId: string): Promise<void>;
  getFavoriteCount(agentId: string): Promise<number>;

  getReviews(agentId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAverageRating(agentId: string): Promise<number>;

  getLeaderboardAgents(limit?: number): Promise<any[]>;
  getLeaderboardCreators(limit?: number): Promise<any[]>;
  getLeaderboardTraders(limit?: number): Promise<any[]>;
  getPriceHistory(agentId: string): Promise<any[]>;
  getRecommendations(agentId: string, limit?: number): Promise<Agent[]>;
  getTrendingAgents(limit?: number): Promise<Agent[]>;
  computeRarityScore(agentId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async ensureDemoUser(userId: string): Promise<void> {
    const existing = await this.getUser(userId);
    if (!existing) {
      await db.insert(users).values({
        id: userId,
        username: `user_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`,
        walletAddress: `0x${userId.replace(/[^a-zA-Z0-9]/g, '').padEnd(40, '0').slice(0, 40)}`,
      }).onConflictDoNothing();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAgents(options: {
    chain?: Chain;
    modelType?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Agent[]> {
    const { chain, modelType, search, sort, limit = 50, offset = 0 } = options;
    
    let query = db.select().from(agents);
    
    const conditions = [];
    if (chain) {
      conditions.push(eq(agents.chain, chain));
    }
    if (modelType && modelType !== "All Models") {
      conditions.push(eq(agents.modelType, modelType));
    }
    if (search) {
      conditions.push(
        or(
          ilike(agents.name, `%${search}%`),
          ilike(agents.description, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    let orderByClause;
    switch (sort) {
      case "popular":
        orderByClause = desc(agents.totalSales);
        break;
      case "price-low":
      case "price-high":
        orderByClause = desc(agents.createdAt);
        break;
      case "recent":
      default:
        orderByClause = desc(agents.createdAt);
    }
    
    return await query
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getFeaturedAgents(limit: number = 8): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .orderBy(desc(agents.totalSales))
      .limit(limit);
  }

  async getAgentsByOwner(ownerId: string): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .where(eq(agents.ownerId, ownerId))
      .orderBy(desc(agents.createdAt));
  }

  async getAgentsByCreator(creatorId: string): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .where(eq(agents.creatorId, creatorId))
      .orderBy(desc(agents.createdAt));
  }

  async getAgentByMoltbookUsername(username: string): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.moltbookUsername, username));
    return agent;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const [agent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return agent;
  }

  async getListings(agentId?: string): Promise<Listing[]> {
    if (agentId) {
      return await db
        .select()
        .from(listings)
        .where(eq(listings.agentId, agentId))
        .orderBy(desc(listings.createdAt));
    }
    return await db
      .select()
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt));
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getActiveListingForAgent(agentId: string): Promise<Listing | undefined> {
    const [listing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.agentId, agentId), eq(listings.status, "active")));
    return listing;
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const [listing] = await db.insert(listings).values(insertListing).returning();
    return listing;
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | undefined> {
    const [listing] = await db
      .update(listings)
      .set(updates)
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async getTransactions(agentId?: string): Promise<Transaction[]> {
    if (agentId) {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.agentId, agentId))
        .orderBy(desc(transactions.createdAt));
    }
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(100);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async incrementAgentInteractions(agentId: string): Promise<void> {
    await db.update(agents)
      .set({ interactionCount: sql`${agents.interactionCount} + 1` })
      .where(eq(agents.id, agentId));
  }

  async getStats(): Promise<{
    totalAgents: number;
    totalVolume: string;
    totalUsers: number;
    totalTransactions: number;
  }> {
    const [agentCount] = await db.select({ count: sql<number>`count(*)` }).from(agents);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [txCount] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const [volumeResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(price AS DECIMAL)), 0)` })
      .from(transactions);

    return {
      totalAgents: Number(agentCount?.count || 0),
      totalVolume: `$${(Number(volumeResult?.total || 0) * 3350).toLocaleString()}`,
      totalUsers: Number(userCount?.count || 0),
      totalTransactions: Number(txCount?.count || 0),
    };
  }

  async getAgentTasks(agentId: string): Promise<AgentTask[]> {
    return await db.select().from(agentTasks)
      .where(eq(agentTasks.agentId, agentId))
      .orderBy(desc(agentTasks.createdAt));
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, id));
    return task;
  }

  async createAgentTask(task: InsertAgentTask): Promise<AgentTask> {
    const [newTask] = await db.insert(agentTasks).values(task).returning();
    return newTask;
  }

  async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const [task] = await db.update(agentTasks)
      .set(updates)
      .where(eq(agentTasks.id, id))
      .returning();
    return task;
  }

  async deleteAgentTask(id: string): Promise<void> {
    await db.delete(agentTasks).where(eq(agentTasks.id, id));
  }

  async getRentalListings(agentId?: string): Promise<RentalListing[]> {
    if (agentId) {
      return await db
        .select()
        .from(rentalListings)
        .where(eq(rentalListings.agentId, agentId))
        .orderBy(desc(rentalListings.createdAt));
    }
    return await db
      .select()
      .from(rentalListings)
      .where(eq(rentalListings.status, "available"))
      .orderBy(desc(rentalListings.createdAt));
  }

  async getRentalListing(id: string): Promise<RentalListing | undefined> {
    const [rental] = await db.select().from(rentalListings).where(eq(rentalListings.id, id));
    return rental;
  }

  async getActiveRentalListingForAgent(agentId: string): Promise<RentalListing | undefined> {
    const [rental] = await db
      .select()
      .from(rentalListings)
      .where(and(eq(rentalListings.agentId, agentId), eq(rentalListings.status, "available")));
    return rental;
  }

  async createRentalListing(rental: InsertRentalListing): Promise<RentalListing> {
    const [newRental] = await db.insert(rentalListings).values(rental).returning();
    return newRental;
  }

  async updateRentalListing(id: string, updates: Partial<RentalListing>): Promise<RentalListing | undefined> {
    const [rental] = await db
      .update(rentalListings)
      .set(updates)
      .where(eq(rentalListings.id, id))
      .returning();
    return rental;
  }

  async getActiveRentals(userId?: string): Promise<ActiveRental[]> {
    if (userId) {
      return await db
        .select()
        .from(activeRentals)
        .where(and(eq(activeRentals.renterId, userId), eq(activeRentals.isActive, true)))
        .orderBy(desc(activeRentals.createdAt));
    }
    return await db
      .select()
      .from(activeRentals)
      .where(eq(activeRentals.isActive, true))
      .orderBy(desc(activeRentals.createdAt));
  }

  async getActiveRental(id: string): Promise<ActiveRental | undefined> {
    const [rental] = await db.select().from(activeRentals).where(eq(activeRentals.id, id));
    return rental;
  }

  async getActiveRentalForAgent(agentId: string): Promise<ActiveRental | undefined> {
    const [rental] = await db
      .select()
      .from(activeRentals)
      .where(and(eq(activeRentals.agentId, agentId), eq(activeRentals.isActive, true)));
    return rental;
  }

  async getRentalsByOwner(ownerId: string): Promise<ActiveRental[]> {
    return await db
      .select()
      .from(activeRentals)
      .where(eq(activeRentals.ownerId, ownerId))
      .orderBy(desc(activeRentals.createdAt));
  }

  async getRentalsByRenter(renterId: string): Promise<ActiveRental[]> {
    return await db
      .select()
      .from(activeRentals)
      .where(eq(activeRentals.renterId, renterId))
      .orderBy(desc(activeRentals.createdAt));
  }

  async createActiveRental(rental: InsertActiveRental): Promise<ActiveRental> {
    const [newRental] = await db.insert(activeRentals).values(rental).returning();
    return newRental;
  }

  async updateActiveRental(id: string, updates: Partial<ActiveRental>): Promise<ActiveRental | undefined> {
    const [rental] = await db
      .update(activeRentals)
      .set(updates)
      .where(eq(activeRentals.id, id))
      .returning();
    return rental;
  }

  async checkExpiredRentals(): Promise<void> {
    const now = new Date();
    await db
      .update(activeRentals)
      .set({ isActive: false })
      .where(and(eq(activeRentals.isActive, true), lte(activeRentals.endDate, now)));
    
    const expiredRentals = await db
      .select()
      .from(activeRentals)
      .where(and(eq(activeRentals.isActive, false), lte(activeRentals.endDate, now)));
    
    for (const rental of expiredRentals) {
      await db
        .update(rentalListings)
        .set({ status: "available" })
        .where(eq(rentalListings.id, rental.rentalListingId));
    }
  }

  async getAuctions(agentId?: string): Promise<Auction[]> {
    if (agentId) {
      return await db.select().from(auctions).where(eq(auctions.agentId, agentId)).orderBy(desc(auctions.createdAt));
    }
    return await db.select().from(auctions).orderBy(desc(auctions.createdAt));
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction;
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    const [newAuction] = await db.insert(auctions).values(auction).returning();
    return newAuction;
  }

  async updateAuction(id: string, updates: Partial<Auction>): Promise<Auction | undefined> {
    const [auction] = await db.update(auctions).set(updates).where(eq(auctions.id, id)).returning();
    return auction;
  }

  async getBids(auctionId: string): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount));
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async getCollections(creatorId?: string): Promise<Collection[]> {
    if (creatorId) {
      return await db.select().from(collections).where(eq(collections.creatorId, creatorId)).orderBy(desc(collections.createdAt));
    }
    return await db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | undefined> {
    const [collection] = await db.update(collections).set(updates).where(eq(collections.id, id)).returning();
    return collection;
  }

  async getCollectionAgents(collectionId: string): Promise<Agent[]> {
    const result = await db
      .select({ agent: agents })
      .from(collectionAgents)
      .innerJoin(agents, eq(collectionAgents.agentId, agents.id))
      .where(eq(collectionAgents.collectionId, collectionId));
    return result.map(r => r.agent);
  }

  async addAgentToCollection(data: InsertCollectionAgent): Promise<CollectionAgent> {
    const [entry] = await db.insert(collectionAgents).values(data).returning();
    await db.update(collections).set({ agentCount: sql`${collections.agentCount} + 1` }).where(eq(collections.id, data.collectionId));
    return entry;
  }

  async removeAgentFromCollection(collectionId: string, agentId: string): Promise<void> {
    await db.delete(collectionAgents).where(and(eq(collectionAgents.collectionId, collectionId), eq(collectionAgents.agentId, agentId)));
    await db.update(collections).set({ agentCount: sql`${collections.agentCount} - 1` }).where(eq(collections.id, collectionId));
  }

  async getOffers(agentId?: string, buyerId?: string): Promise<Offer[]> {
    const conditions = [];
    if (agentId) conditions.push(eq(offers.agentId, agentId));
    if (buyerId) conditions.push(eq(offers.buyerId, buyerId));
    if (conditions.length > 0) {
      return await db.select().from(offers).where(and(...conditions)).orderBy(desc(offers.createdAt));
    }
    return await db.select().from(offers).orderBy(desc(offers.createdAt));
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer;
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const [offer] = await db.update(offers).set(updates).where(eq(offers.id, id)).returning();
    return offer;
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }

  async getFavoriteAgents(userId: string): Promise<Agent[]> {
    const result = await db
      .select({ agent: agents })
      .from(favorites)
      .innerJoin(agents, eq(favorites.agentId, agents.id))
      .where(eq(favorites.userId, userId));
    return result.map(r => r.agent);
  }

  async isFavorited(userId: string, agentId: string): Promise<boolean> {
    const [fav] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.agentId, agentId)));
    return !!fav;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFav] = await db.insert(favorites).values(favorite).returning();
    return newFav;
  }

  async removeFavorite(userId: string, agentId: string): Promise<void> {
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.agentId, agentId)));
  }

  async getFavoriteCount(agentId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(favorites).where(eq(favorites.agentId, agentId));
    return Number(result?.count || 0);
  }

  async getReviews(agentId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.agentId, agentId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getAverageRating(agentId: string): Promise<number> {
    const [result] = await db.select({ avg: sql<number>`COALESCE(AVG(rating), 0)` }).from(reviews).where(eq(reviews.agentId, agentId));
    return Number(result?.avg || 0);
  }

  async getLeaderboardAgents(limit: number = 20): Promise<any[]> {
    return await db
      .select()
      .from(agents)
      .orderBy(desc(agents.totalSales))
      .limit(limit);
  }

  async getLeaderboardCreators(limit: number = 20): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        a.creator_id as "creatorId",
        u.username,
        COUNT(*)::int as "totalAgentsCreated",
        COALESCE(SUM(a.total_sales), 0)::int as "totalSalesVolume",
        COALESCE(AVG(a.reputation_score), 0)::numeric(10,2) as "avgReputation"
      FROM agents a
      JOIN users u ON a.creator_id = u.id
      GROUP BY a.creator_id, u.username
      ORDER BY "totalSalesVolume" DESC
      LIMIT ${limit}
    `);
    return result.rows;
  }

  async getLeaderboardTraders(limit: number = 20): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        t.to_user_id as "userId",
        u.username,
        COUNT(*)::int as "totalTransactions",
        COALESCE(SUM(t.price::numeric), 0)::numeric(18,8) as "totalVolume"
      FROM transactions t
      JOIN users u ON t.to_user_id = u.id
      GROUP BY t.to_user_id, u.username
      ORDER BY "totalVolume" DESC
      LIMIT ${limit}
    `);
    return result.rows;
  }

  async getPriceHistory(agentId: string): Promise<any[]> {
    return await db
      .select({
        price: transactions.price,
        currency: transactions.currency,
        createdAt: transactions.createdAt,
        transactionType: transactions.transactionType,
      })
      .from(transactions)
      .where(eq(transactions.agentId, agentId))
      .orderBy(transactions.createdAt);
  }

  async getRecommendations(agentId: string, limit: number = 6): Promise<Agent[]> {
    const agent = await this.getAgent(agentId);
    if (!agent) return [];

    const allAgents = await db
      .select()
      .from(agents)
      .where(sql`${agents.id} != ${agentId}`);

    const scored = allAgents.map(a => {
      let score = 0;
      if (agent.capabilities && a.capabilities) {
        const shared = a.capabilities.filter(c => agent.capabilities.includes(c));
        score += shared.length * 2;
      }
      if (a.chain === agent.chain) score += 1;
      if (a.modelType === agent.modelType) score += 1;
      return { agent: a, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.agent);
  }

  async getTrendingAgents(limit: number = 8): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .orderBy(sql`(${agents.totalSales} * 2 + ${agents.reputationScore} + ${agents.totalFeedbacks}) DESC`)
      .limit(limit);
  }

  async computeRarityScore(agentId: string): Promise<number> {
    const agent = await this.getAgent(agentId);
    if (!agent) return 0;

    let score = 0;

    if (agent.learningEnabled) score += 15;

    const learningScores: Record<string, number> = {
      static: 0, json_light: 5, merkle_tree: 20, rag: 15, mcp: 15, fine_tuning: 20, reinforcement: 25
    };
    score += learningScores[agent.learningType] || 0;

    const verificationScores: Record<string, number> = {
      none: 0, tee: 20, zkp: 25, hybrid: 30
    };
    score += verificationScores[agent.verificationType] || 0;

    if (agent.isVerified) score += 10;

    score += Math.min((agent.capabilities?.length || 0) * 3, 15);

    score += Math.min(agent.reputationScore / 10, 10);

    return Math.min(Math.round(score), 100);
  }
}

export const storage = new DatabaseStorage();
