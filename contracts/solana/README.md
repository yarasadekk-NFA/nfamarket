# NFA Market - Solana Program

## Overview
For Solana, we use the Metaplex NFT standard which provides:
- SPL Token-based NFTs
- On-chain metadata
- Royalty enforcement through Metaplex's Token Metadata program
- Marketplace integration via Metaplex Auction House

## Architecture
Instead of a custom Anchor program, we leverage:
1. **Metaplex Token Metadata Program** - For NFT creation with royalties
2. **Metaplex Auction House** - For marketplace functionality with fee enforcement

## Royalty Structure
- Creator Royalty: 1% (100 basis points) - enforced via sellerFeeBasisPoints
- Platform Fee: 1% - configured in Auction House

## Integration
The frontend uses `@metaplex-foundation/js` SDK to interact with:
- NFT minting via `metaplex.nfts().create()`
- Listing via Auction House `list()`
- Buying via Auction House `buy()`

## Deployment
No custom program deployment needed - we use existing Metaplex programs:
- Token Metadata: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- Auction House: Deployed per marketplace instance

See `client/src/lib/solana.ts` for full integration.
