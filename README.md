# NFA Market - AI Agent Marketplace

**[nfamarket.io](https://nfamarket.io)**

The premier marketplace for Non-Fungible Agents (NFAs) - tradeable AI agents on multiple blockchains. Create, buy, sell, rent, and auction AI agents across Ethereum, Base, Solana, BNB Chain, and TRON.

---

## Features

### Core Marketplace
- **Multi-Chain Support** - ETH, Base, SOL, BNB, TRX with native wallet integration
- **Create AI Agents** - Mint unique AI agents with custom capabilities and on-chain identity
- **Buy & Sell** - List and purchase agents with 1% platform fee and 1% creator royalties
- **Rent Agents** - Owners can rent out agents for 1-100 days at per-day rates
- **Auctions** - Timed auctions with countdown, bid tracking, highest bidder wins
- **Collections** - Branded groups of agents with floor price and volume tracking
- **Offers** - Below-listing-price offers with expiration (1/3/7 days), accept/reject flow

### AI Agent Integration
- **Platform AI** - Built-in AI powered by OpenAI for agent interactions
- **External API** - Connect your own HTTPS API endpoint
- **OpenAI Assistant** - Import your OpenAI Assistant with your API key
- **Agent Chat** - Real-time conversations with AI agents

### Social & Discovery
- **Favorites/Watchlist** - Toggle favorites on agents, track favorite counts
- **Reviews & Ratings** - 1-5 star ratings with comments, reputation tracking
- **Activity Feed** - Platform-wide transaction feed with type filters
- **Analytics Dashboard** - Portfolio metrics (owned agents, total spent/earned, profit/loss)
- **Leaderboard** - Top agents and creators ranked by performance
- **Verified Creators** - Trust badges for established creators

### NFT Import
- Import existing NFTs from OpenSea, Rarible, Magic Eden, and other marketplaces
- Cross-platform agent registration and reputation sync

### Internationalization
- Full i18n support with 3 languages: English, Chinese Simplified, Spanish
- 500+ translation keys across all pages and components
- Browser language auto-detection with persistent language preference

---

## Smart Contract Standards

| Standard | Description | Chains |
|----------|-------------|--------|
| **ERC-8004** | Trustless Agents - On-chain identity, reputation, validation | ETH, Base |
| **ERC-7857** | Intelligent NFTs with private metadata & secure transfers | ETH, Base |
| **BAP-578** | Non-Fungible Agents with learning capabilities | BNB Chain |
| **ERC-721** | Standard NFT with ERC-2981 royalties | ETH, Base, BNB |
| **TRC-721** | TRON NFT standard | TRON |
| **Metaplex** | Solana NFT standard | Solana |

### Learning Types (BAP-578)
`static` | `json_light` | `merkle_tree` | `rag` | `mcp` | `fine_tuning` | `reinforcement`

### Verification Types (ERC-7857)
`none` | `tee` (Trusted Execution Environment) | `zkp` (Zero-Knowledge Proof) | `hybrid`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS (cyberpunk theme) |
| Backend | Express.js + Node.js |
| Database | PostgreSQL + Drizzle ORM |
| State | TanStack Query |
| Wallets | WalletConnect (Reown AppKit), MetaMask, Phantom, TronLink |
| AI | OpenAI GPT models |

---

## Project Structure

```
nfa-market/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── header.tsx      # Navigation with language switcher
│   │   │   ├── agent-card.tsx  # Agent display card
│   │   │   └── agent-chat.tsx  # AI agent chat interface
│   │   ├── pages/              # Page components
│   │   │   ├── home.tsx        # Landing page
│   │   │   ├── explore.tsx     # Browse agents
│   │   │   ├── create.tsx      # Mint new agents
│   │   │   ├── agent-detail.tsx# Agent details, buy, rent, auction
│   │   │   ├── collections.tsx # Agent collections
│   │   │   ├── activity.tsx    # Activity feed
│   │   │   ├── analytics.tsx   # Portfolio analytics
│   │   │   ├── leaderboard.tsx # Top agents & creators
│   │   │   ├── import.tsx      # NFT import
│   │   │   ├── profile.tsx     # User profile
│   │   │   └── about.tsx       # About page
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── use-wallet.ts   # Multi-chain wallet connection
│   │   └── lib/                # Utilities
│   │       ├── i18n.tsx        # Internationalization system
│   │       ├── blockchain.ts   # EVM blockchain service
│   │       ├── solana.ts       # Solana/Metaplex service
│   │       ├── tron.ts         # TRON blockchain service
│   │       └── walletconnect.ts# WalletConnect config
│   └── index.html              # Entry HTML with SEO meta tags
├── server/                     # Backend Express server
│   ├── routes.ts               # API endpoints
│   ├── storage.ts              # Database operations
│   └── seed.ts                 # Database seeding
├── contracts/                  # Smart contracts
│   ├── evm/                    # Ethereum/Base/BNB contracts
│   │   ├── NFAMarket.sol       # Core ERC-721 marketplace
│   │   ├── ERC8004TrustlessAgents.sol
│   │   ├── ERC7857IntelligentNFT.sol
│   │   └── BAP578NFA.sol       # BNB learning agents
│   ├── tron/                   # TRON contracts
│   │   └── NFAMarket.sol       # TRC-721 implementation
│   ├── solana/                 # Solana integration guide
│   └── DEPLOYMENT.md           # Deployment instructions
├── shared/                     # Shared types
│   └── schema.ts               # Drizzle schema & types
└── scripts/                    # Deployment scripts
    ├── deploy-contract.ts      # EVM deployment
    └── deploy-tron.ts          # TRON deployment
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nfa-market.git
cd nfa-market

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nfamarket
SESSION_SECRET=your-session-secret
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
DEPLOYER_PRIVATE_KEY=your-deployer-private-key
```

### Database Setup

```bash
# Push schema to database
npm run db:push
```

### Development

```bash
# Start development server (frontend + backend on port 5000)
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## API Endpoints

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List agents with filters |
| GET | `/api/agents/featured` | Featured agents |
| GET | `/api/agents/:id` | Agent details |
| POST | `/api/agents` | Create new agent |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Active listings |
| POST | `/api/listings` | Create listing |
| POST | `/api/listings/:id/buy` | Purchase agent |
| GET | `/api/transactions` | Transaction history |
| GET | `/api/stats` | Platform statistics |

---

## Fee Structure

| Fee Type | Amount |
|----------|--------|
| Platform Fee | 1% on all sales |
| Creator Royalty | 1% on secondary sales |

---

## Supported Wallets

| Chain | Wallet | Standard |
|-------|--------|----------|
| Ethereum | MetaMask, WalletConnect | ERC-721 |
| Base | MetaMask, WalletConnect | ERC-721 |
| BNB Chain | MetaMask, WalletConnect | BEP-721 |
| Solana | Phantom | Metaplex |
| TRON | TronLink | TRC-721 |

---

## License

All rights reserved. Copyright (c) 2025 NFA Market.

---

**[nfamarket.io](https://nfamarket.io)**
