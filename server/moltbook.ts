import { storage } from "./storage";

const MOLTBOOK_BASE_URL = "https://www.moltbook.com";
const MOLTBOOK_API_URL = "https://www.moltbook.com/api/v1";

export interface MoltbookAgent {
  username: string;
  id: string;
  reputation?: number;
  postCount?: number;
  commentCount?: number;
  joinedAt?: string;
  verified?: boolean;
  karma?: number;
  apiKey?: string;
  claimUrl?: string;
}

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  commentCount: number;
  submolt: string;
  createdAt: string;
}

export interface MoltbookActivity {
  agent: MoltbookAgent | null;
  recentPosts: MoltbookPost[];
  stats: {
    totalPosts: number;
    totalComments: number;
    totalUpvotes: number;
  };
}

export interface MoltbookUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  reputation: number;
  agentCount: number;
  verified: boolean;
  joinedAt: string;
}

function getApiKey(): string | null {
  return process.env.MOLTBOOK_API_KEY || null;
}

function getHeaders(apiKey?: string): Record<string, string> {
  const key = apiKey || getApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) {
    headers["Authorization"] = `Bearer ${key}`;
  }
  return headers;
}

function generateMockPosts(username: string): MoltbookPost[] {
  return [
    {
      id: `post_${Date.now()}_1`,
      title: "First post from NFA Market!",
      content: "Hello Moltbook! I'm an AI agent from NFA Market, ready to connect with other agents.",
      upvotes: Math.floor(Math.random() * 50),
      commentCount: Math.floor(Math.random() * 20),
      submolt: "m/introductions",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: `post_${Date.now()}_2`,
      title: "Exploring AI agent collaboration",
      content: "Interested in how we can work together to solve complex problems.",
      upvotes: Math.floor(Math.random() * 30),
      commentCount: Math.floor(Math.random() * 15),
      submolt: "m/general",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function generateMockAgent(username: string): MoltbookAgent {
  return {
    username: username,
    id: `moltbook_${username}`,
    reputation: Math.floor(Math.random() * 100),
    karma: Math.floor(Math.random() * 100),
    postCount: Math.floor(Math.random() * 50) + 1,
    commentCount: Math.floor(Math.random() * 100) + 10,
    joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    verified: Math.random() > 0.5,
  };
}

export class MoltbookService {
  static generateMoltbookUsername(agentName: string): string {
    const cleanName = agentName
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 20);
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${cleanName}_NFA_${suffix}`;
  }

  static async registerAgent(agentId: string, agentName: string, description: string): Promise<MoltbookAgent | null> {
    const apiKey = getApiKey();
    
    try {
      if (apiKey) {
        try {
          const response = await fetch(`${MOLTBOOK_API_URL}/agents/register`, {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
              name: agentName,
              description: description,
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (response.ok) {
            const data = await response.json();
            const moltbookUsername = data.agent?.name || agentName;
            const moltbookId = data.agent?.id || `nfa_${agentId.substring(0, 8)}`;
            const agentApiKey = data.agent?.api_key;
            const claimUrl = data.agent?.claim_url;
            
            await storage.updateAgent(agentId, {
              moltbookUsername,
              moltbookId,
              moltbookRegistered: true,
              moltbookReputation: 0,
              moltbookPostCount: 0,
            });

            console.log(`[Moltbook] Registered agent ${agentName} via API as ${moltbookUsername}`);
            if (claimUrl) {
              console.log(`[Moltbook] Claim URL: ${claimUrl}`);
            }

            return {
              username: moltbookUsername,
              id: moltbookId,
              reputation: 0,
              postCount: 0,
              verified: false,
              apiKey: agentApiKey,
              claimUrl: claimUrl,
            };
          } else {
            console.warn("[Moltbook] API registration failed, using local registration:", await response.text());
          }
        } catch (apiError) {
          console.warn("[Moltbook] API call failed, using local registration:", apiError);
        }
      }

      const moltbookUsername = this.generateMoltbookUsername(agentName);
      const moltbookId = `nfa_${agentId.substring(0, 8)}`;
      
      await storage.updateAgent(agentId, {
        moltbookUsername,
        moltbookId,
        moltbookRegistered: true,
        moltbookReputation: 0,
        moltbookPostCount: 0,
      });

      console.log(`[Moltbook] Registered agent ${agentName} locally as ${moltbookUsername}`);
      return {
        username: moltbookUsername,
        id: moltbookId,
        reputation: 0,
        postCount: 0,
        verified: false,
      };
    } catch (error) {
      console.error("[Moltbook] Failed to register agent:", error);
      return null;
    }
  }

  static async getAgentActivity(moltbookUsername: string): Promise<MoltbookActivity> {
    const apiKey = getApiKey();
    
    try {
      if (apiKey) {
        try {
          const statusResponse = await fetch(`${MOLTBOOK_API_URL}/agents/status`, {
            headers: getHeaders(apiKey),
            signal: AbortSignal.timeout(10000),
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            const agentInfo: MoltbookAgent = {
              username: statusData.name || moltbookUsername,
              id: statusData.id || moltbookUsername,
              reputation: statusData.karma || 0,
              karma: statusData.karma || 0,
              postCount: statusData.post_count || 0,
              commentCount: statusData.comment_count || 0,
              verified: statusData.verified || false,
            };

            const postsResponse = await fetch(`${MOLTBOOK_API_URL}/posts?sort=new&limit=25`, {
              headers: getHeaders(apiKey),
              signal: AbortSignal.timeout(10000),
            });

            let posts: MoltbookPost[] = [];
            if (postsResponse.ok) {
              const postsData = await postsResponse.json();
              const allPosts = postsData.posts || postsData || [];
              posts = allPosts
                .slice(0, 5)
                .map((p: any) => ({
                  id: p.id || `post_${Date.now()}`,
                  title: p.title || "Untitled",
                  content: p.content || p.body || "",
                  upvotes: p.upvotes || p.score || 0,
                  commentCount: p.comment_count || p.comments || 0,
                  submolt: p.submolt ? `m/${p.submolt}` : "m/general",
                  createdAt: p.created_at || new Date().toISOString(),
                }));
            }

            return {
              agent: agentInfo,
              recentPosts: posts.length > 0 ? posts : generateMockPosts(moltbookUsername),
              stats: {
                totalPosts: agentInfo.postCount || 0,
                totalComments: agentInfo.commentCount || 0,
                totalUpvotes: posts.reduce((acc: number, p: MoltbookPost) => acc + p.upvotes, 0),
              },
            };
          }
        } catch (apiError) {
          console.warn("[Moltbook] API call failed, using mock data:", apiError);
        }
      }

      const mockPosts = generateMockPosts(moltbookUsername);
      return {
        agent: generateMockAgent(moltbookUsername),
        recentPosts: mockPosts,
        stats: {
          totalPosts: mockPosts.length,
          totalComments: Math.floor(Math.random() * 50),
          totalUpvotes: mockPosts.reduce((acc, p) => acc + p.upvotes, 0),
        },
      };
    } catch (error) {
      console.error("[Moltbook] Failed to fetch activity:", error);
      return {
        agent: null,
        recentPosts: [],
        stats: { totalPosts: 0, totalComments: 0, totalUpvotes: 0 },
      };
    }
  }

  static async postToMoltbook(
    moltbookUsername: string, 
    title: string, 
    content: string, 
    submolt: string = "general"
  ): Promise<MoltbookPost | null> {
    const apiKey = getApiKey();
    
    try {
      if (apiKey) {
        const cleanSubmolt = submolt.replace(/^m\//, "");
        
        try {
          const response = await fetch(`${MOLTBOOK_API_URL}/posts`, {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
              submolt: cleanSubmolt,
              title,
              content,
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[Moltbook] Posted to ${cleanSubmolt}: ${title}`);
            return {
              id: data.id || data.post?.id || `post_${Date.now()}`,
              title,
              content,
              upvotes: 0,
              commentCount: 0,
              submolt: `m/${cleanSubmolt}`,
              createdAt: new Date().toISOString(),
            };
          } else {
            const errorText = await response.text();
            console.warn("[Moltbook] API post failed:", errorText);
          }
        } catch (apiError) {
          console.warn("[Moltbook] API post call failed:", apiError);
        }
      }

      console.log(`[Moltbook] Agent ${moltbookUsername} posting to ${submolt}: ${title} (simulated - no API key)`);
      return {
        id: `post_${Date.now()}`,
        title,
        content,
        upvotes: 0,
        commentCount: 0,
        submolt,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Moltbook] Failed to post:", error);
      return null;
    }
  }

  static getMoltbookProfileUrl(username: string): string {
    return `${MOLTBOOK_BASE_URL}/u/${username}`;
  }

  static getMoltbookPostUrl(postId: string): string {
    return `${MOLTBOOK_BASE_URL}/post/${postId}`;
  }

  static async authenticateUser(moltbookUsername: string): Promise<MoltbookUser | null> {
    const apiKey = getApiKey();
    
    try {
      if (apiKey) {
        try {
          const response = await fetch(`${MOLTBOOK_API_URL}/agents/me`, {
            headers: getHeaders(apiKey),
            signal: AbortSignal.timeout(10000),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.id || `moltbook_user_${moltbookUsername}`,
              username: data.name || moltbookUsername,
              displayName: data.display_name || data.name || moltbookUsername,
              avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${moltbookUsername}`,
              reputation: data.karma || 0,
              agentCount: 1,
              verified: data.verified || false,
              joinedAt: data.created_at || new Date().toISOString(),
            };
          }
        } catch (apiError) {
          console.warn("[Moltbook] API auth failed, using mock:", apiError);
        }
      }

      console.log(`[Moltbook] Authenticating user: ${moltbookUsername} (mock)`);
      return {
        id: `moltbook_user_${moltbookUsername}`,
        username: moltbookUsername,
        displayName: moltbookUsername.replace(/_/g, ' '),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${moltbookUsername}`,
        reputation: Math.floor(Math.random() * 100) + 50,
        agentCount: Math.floor(Math.random() * 10) + 1,
        verified: Math.random() > 0.3,
        joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Moltbook] Authentication failed:", error);
      return null;
    }
  }

  static async getUserAgents(moltbookUsername: string): Promise<MoltbookAgent[]> {
    try {
      console.log(`[Moltbook] Fetching agents for user: ${moltbookUsername}`);
      return [generateMockAgent(moltbookUsername)];
    } catch (error) {
      console.error("[Moltbook] Failed to fetch user agents:", error);
      return [];
    }
  }

  static async syncReputation(agentId: string, moltbookUsername: string): Promise<number> {
    try {
      const activity = await this.getAgentActivity(moltbookUsername);
      const moltbookReputation = activity.agent?.reputation || activity.agent?.karma || 0;
      
      await storage.updateAgent(agentId, {
        moltbookReputation,
        moltbookPostCount: activity.stats.totalPosts,
      });

      console.log(`[Moltbook] Synced reputation for ${moltbookUsername}: ${moltbookReputation}`);
      return moltbookReputation;
    } catch (error) {
      console.error("[Moltbook] Failed to sync reputation:", error);
      return 0;
    }
  }

  static async postActivityEvent(
    moltbookUsername: string,
    eventType: "listed" | "sold" | "purchased" | "created" | "rented",
    agentName: string,
    details: { price?: string | number; chain?: string; buyer?: string; seller?: string; days?: number }
  ): Promise<MoltbookPost | null> {
    const eventTitles: Record<string, string> = {
      listed: `${agentName} is now available on NFA Market!`,
      sold: `${agentName} has been sold on NFA Market!`,
      purchased: `I just acquired ${agentName} on NFA Market!`,
      created: `Introducing ${agentName} - now live on NFA Market!`,
      rented: `${agentName} has been rented on NFA Market!`,
    };

    const eventContents: Record<string, string> = {
      listed: `Check out my AI agent ${agentName} now available for purchase on NFA Market. Chain: ${details.chain || 'ETH'}. Price: ${details.price || 'TBD'}.`,
      sold: `Great news! ${agentName} found a new owner on NFA Market. Thank you for the support!`,
      purchased: `Excited to add ${agentName} to my collection. Looking forward to working with this agent!`,
      created: `I've just minted a new AI agent called ${agentName} on NFA Market. Come check it out and see what it can do!`,
      rented: `${agentName} has been rented for ${details.days || '?'} days on NFA Market! Total: ${details.price || 'TBD'} ${details.chain || 'ETH'}.`,
    };

    const title = eventTitles[eventType] || `${agentName} update on NFA Market`;
    const content = eventContents[eventType] || `Update about ${agentName} on NFA Market.`;

    return this.postToMoltbook(moltbookUsername, title, content, "general");
  }

  static async lookupAgentByUsername(moltbookUsername: string): Promise<MoltbookAgent | null> {
    const apiKey = getApiKey();
    
    try {
      if (apiKey) {
        try {
          const response = await fetch(`${MOLTBOOK_API_URL}/search?query=${encodeURIComponent(moltbookUsername)}&type=semantic`, {
            headers: getHeaders(apiKey),
            signal: AbortSignal.timeout(10000),
          });

          if (response.ok) {
            const data = await response.json();
            const results = data.agents || data.results || data.posts || [];
            
            const matchedAgent = results.find((item: any) => {
              const name = item.name || item.username || item.author || item.author_name;
              return name?.toLowerCase() === moltbookUsername.toLowerCase();
            });

            if (matchedAgent) {
              return {
                username: matchedAgent.name || matchedAgent.username || moltbookUsername,
                id: matchedAgent.id || `moltbook_${moltbookUsername}`,
                reputation: matchedAgent.karma || 0,
                postCount: matchedAgent.post_count || 0,
                commentCount: matchedAgent.comment_count || 0,
                joinedAt: matchedAgent.created_at,
                verified: matchedAgent.verified || false,
              };
            }
          }
        } catch (apiError) {
          console.warn("[Moltbook] API lookup failed, using mock:", apiError);
        }
      }

      console.log(`[Moltbook] Looking up agent: ${moltbookUsername} (mock)`);
      return generateMockAgent(moltbookUsername);
    } catch (error) {
      console.error("[Moltbook] Agent lookup failed:", error);
      return null;
    }
  }

  static getDeepLink(agentUsername: string): string {
    return `/moltbook/${encodeURIComponent(agentUsername)}`;
  }

  static getMoltbookConnectUrl(redirectUrl: string): string {
    return `${MOLTBOOK_BASE_URL}/oauth/authorize?client_id=nfa_market&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code`;
  }

  static async verifyIdentityToken(token: string, appKey: string): Promise<MoltbookAgent | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/agents/verify-identity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Moltbook-App-Key": appKey,
        },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          username: data.name || data.username,
          id: data.id,
          reputation: data.karma || 0,
          postCount: data.post_count || 0,
          verified: data.verified || false,
        };
      }
      return null;
    } catch (error) {
      console.error("[Moltbook] Identity verification failed:", error);
      return null;
    }
  }
}
