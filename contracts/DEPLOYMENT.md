# NFA Market Smart Contract Deployment Guide

## Overview
This guide covers deploying the NFA Market smart contracts to production mainnets.
The platform implements cutting-edge AI agent token standards for maximum interoperability.

## Implemented Standards

| Standard | Description | Chains |
|----------|-------------|--------|
| **ERC-8004** | Trustless Agents - Identity, Reputation, Validation | ETH, Base, BNB |
| **ERC-7857** | Intelligent NFTs with Private Metadata | ETH, Base, BNB |
| **BAP-578** | Non-Fungible Agents with Learning | BNB Chain |
| **NFAMarket** | Core marketplace with ERC-721 + Royalties | All EVM chains |

## Contract Files

| Contract | Path | Purpose |
|----------|------|---------|
| `NFAMarket.sol` | `contracts/evm/` | Core marketplace (ERC-721 + ERC-2981 royalties) |
| `ERC8004TrustlessAgents.sol` | `contracts/evm/` | Agent identity, reputation, validation |
| `ERC7857IntelligentNFT.sol` | `contracts/evm/` | Intelligent NFTs with encrypted metadata |
| `BAP578NFA.sol` | `contracts/bnb/` | Learning-enabled agents for BNB Chain |
| `NFAMarket.sol` | `contracts/tron/` | TRC-721 for TRON |

## Prerequisites
1. Wallet with sufficient funds for deployment gas on each chain
2. RPC API keys for each blockchain (optional but recommended for reliability)
3. Private key for deployment wallet (keep secure!)

## Contract Addresses (To be updated after deployment)

| Chain | Contract | Address | Explorer |
|-------|----------|---------|----------|
| Ethereum | NFAMarket | TBD | [Etherscan](https://etherscan.io) |
| Ethereum | ERC8004 | TBD | [Etherscan](https://etherscan.io) |
| Ethereum | ERC7857 | TBD | [Etherscan](https://etherscan.io) |
| Base | NFAMarket | TBD | [Basescan](https://basescan.org) |
| Base | ERC8004 | TBD | [Basescan](https://basescan.org) |
| Base | ERC7857 | TBD | [Basescan](https://basescan.org) |
| BNB Chain | NFAMarket | TBD | [BSCScan](https://bscscan.com) |
| BNB Chain | BAP578 | TBD | [BSCScan](https://bscscan.com) |
| TRON | NFAMarket | TBD | [Tronscan](https://tronscan.org) |
| Solana | Uses Metaplex | N/A | [Solscan](https://solscan.io) |

## Deployment Steps

### EVM Chains (Ethereum, Base, BNB)

#### 1. Install Hardhat (if not installed)
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

#### 2. Compile Contract
```bash
npx hardhat compile
```

#### 3. Deploy to Each Chain

**Ethereum Mainnet:**
```bash
npx hardhat run scripts/deploy.js --network ethereum
```

**Base Mainnet:**
```bash
npx hardhat run scripts/deploy.js --network base
```

**BNB Smart Chain:**
```bash
npx hardhat run scripts/deploy.js --network bnb
```

### TRON

#### 1. Install TronBox
```bash
npm install -g tronbox
```

#### 2. Deploy
```bash
tronbox migrate --network mainnet
```

### Solana

Solana uses the Metaplex NFT standard - no custom program deployment needed.
Configure an Auction House instance for marketplace functionality.

## Platform Wallet Addresses (Fee Collection)

| Chain | Platform Wallet |
|-------|----------------|
| ETH/Base/BNB | `0xce48ddb43d593b57010335c556a764ee878ee8f1` |
| Solana | `52BVTyx5FXUwWo8M57qWmjHpPUSWYbS8J7T8h1ZWo4go` |
| TRON | Set via `VITE_TRON_PLATFORM_WALLET` env var |

## Environment Variables Required

Set these in `.env` (never commit this file):

```
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Platform Wallets (pre-configured in code for EVM and Solana)
VITE_TRON_PLATFORM_WALLET=your_tron_wallet_address

# RPC URLs (optional, defaults provided)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://mainnet.base.org
BNB_RPC_URL=https://bsc-dataseed.binance.org
TRON_RPC_URL=https://api.trongrid.io
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## After Deployment

1. Update contract addresses in `client/src/lib/blockchain.ts`
2. Set environment variables:
   - `VITE_ETH_CONTRACT_ADDRESS`
   - `VITE_BASE_CONTRACT_ADDRESS`
   - `VITE_BNB_CONTRACT_ADDRESS`
   - `VITE_TRON_CONTRACT_ADDRESS`

3. Verify contracts on block explorers:
   - Etherscan: `npx hardhat verify --network ethereum DEPLOYED_ADDRESS "PLATFORM_WALLET"`
   - Basescan: `npx hardhat verify --network base DEPLOYED_ADDRESS "PLATFORM_WALLET"`
   - BSCScan: `npx hardhat verify --network bnb DEPLOYED_ADDRESS "PLATFORM_WALLET"`

## Fee Structure
- **Platform Fee**: 1% (100 basis points) - Sent to platform wallet
- **Creator Royalty**: 1% (100 basis points) - Sent to original creator on secondary sales

## Security Considerations
- Use a hardware wallet for deployment
- Deploy to testnets first for verification
- Consider using a multisig wallet for the platform wallet
- Audit contracts before mainnet deployment (recommended)

## Gas Estimates
- Contract Deployment: ~2-3M gas
- Mint Agent: ~150-200K gas
- List Agent: ~50-80K gas
- Buy Agent: ~150-200K gas
