// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BAP578NFA
 * @dev Implementation of BAP-578 Non-Fungible Agent (NFA) Token Standard for BNB Chain
 * Extends ERC-721 with learning capabilities and hybrid on-chain/off-chain architecture
 * 
 * Key Features:
 * - Dual-path architecture: Static agents and learning-enabled agents
 * - Hybrid on-chain/off-chain storage
 * - Merkle tree-based learning verification
 * - RAG, MCP, and fine-tuning support
 */
contract BAP578NFA is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint96 public constant PLATFORM_FEE_BPS = 100;  // 1%
    uint96 public constant CREATOR_ROYALTY_BPS = 100;  // 1%
    
    address public platformWallet;
    
    // ============ Learning Types ============
    
    enum LearningType { STATIC, JSON_LIGHT, MERKLE_TREE, RAG, MCP, FINE_TUNING, REINFORCEMENT }
    
    // ============ Agent Structure ============
    
    struct NFAgent {
        string name;
        string description;
        string[] capabilities;
        string modelType;
        address creator;
        LearningType learningType;
        bool learningEnabled;
        uint256 createdAt;
    }
    
    // ============ Learning Data (On-Chain) ============
    
    struct LearningState {
        bytes32 merkleRoot;              // Root of learning state Merkle tree
        uint256 interactionCount;
        uint256 lastLearningUpdate;
        bytes32 confidenceScore;         // Encoded confidence metrics
    }
    
    // ============ Off-Chain References ============
    
    struct OffChainData {
        string memoryVaultUri;           // Extended memory storage (IPFS/Arweave)
        string learningDataUri;          // Detailed learning data
        string behaviorConfigUri;        // Complex AI behavior configs
        string mediaAssetsUri;           // Media assets
        bytes32 dataIntegrityHash;       // Hash for verification
    }
    
    // ============ Permissions ============
    
    struct AgentPermissions {
        bool canHoldAssets;
        bool canExecuteLogic;
        bool canInteractProtocols;
        bool canBeLeasedOut;
        address[] authorizedOperators;
    }
    
    // ============ Listing ============
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        bool transferLearning;           // Include learning data in sale
    }
    
    // ============ Storage ============
    
    mapping(uint256 => NFAgent) public agents;
    mapping(uint256 => LearningState) public learningStates;
    mapping(uint256 => OffChainData) public offChainData;
    mapping(uint256 => AgentPermissions) public permissions;
    mapping(uint256 => Listing) public listings;
    
    // ============ Events ============
    
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string name, LearningType learningType);
    event LearningUpdated(uint256 indexed tokenId, bytes32 newMerkleRoot, uint256 interactionCount);
    event OffChainDataUpdated(uint256 indexed tokenId, bytes32 dataIntegrityHash);
    event PermissionsUpdated(uint256 indexed tokenId, bool canHoldAssets, bool canExecuteLogic);
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price, bool transferLearning);
    event AgentDelisted(uint256 indexed tokenId);
    event AgentSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event AgentLeased(uint256 indexed tokenId, address indexed lessee, uint256 duration);
    
    // ============ Constructor ============
    
    constructor(address _platformWallet) ERC721("BAP578 Non-Fungible Agent", "NFA") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }
    
    // ============ Minting ============
    
    /**
     * @dev Mint a new NFA with specified learning type
     */
    function mintAgent(
        string memory name,
        string memory description,
        string[] memory capabilities,
        string memory modelType,
        string memory tokenUri,
        LearningType learningType
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenUri);
        _setTokenRoyalty(tokenId, msg.sender, CREATOR_ROYALTY_BPS);
        
        agents[tokenId] = NFAgent({
            name: name,
            description: description,
            capabilities: capabilities,
            modelType: modelType,
            creator: msg.sender,
            learningType: learningType,
            learningEnabled: learningType != LearningType.STATIC,
            createdAt: block.timestamp
        });
        
        // Initialize default permissions
        address[] memory emptyOperators = new address[](0);
        permissions[tokenId] = AgentPermissions({
            canHoldAssets: true,
            canExecuteLogic: true,
            canInteractProtocols: true,
            canBeLeasedOut: true,
            authorizedOperators: emptyOperators
        });
        
        emit AgentMinted(tokenId, msg.sender, name, learningType);
        return tokenId;
    }
    
    // ============ Learning Functions ============
    
    /**
     * @dev Update learning state with new Merkle root
     * Called after off-chain learning process
     */
    function updateLearningState(
        uint256 tokenId,
        bytes32 newMerkleRoot,
        bytes32 confidenceScore
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(agents[tokenId].learningEnabled, "Learning not enabled");
        
        LearningState storage state = learningStates[tokenId];
        state.merkleRoot = newMerkleRoot;
        state.interactionCount++;
        state.lastLearningUpdate = block.timestamp;
        state.confidenceScore = confidenceScore;
        
        emit LearningUpdated(tokenId, newMerkleRoot, state.interactionCount);
    }
    
    /**
     * @dev Verify learning data against stored Merkle root
     */
    function verifyLearningData(
        uint256 tokenId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) public view returns (bool) {
        bytes32 root = learningStates[tokenId].merkleRoot;
        return _verifyMerkleProof(proof, root, leaf);
    }
    
    function _verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
    
    // ============ Off-Chain Data Management ============
    
    /**
     * @dev Update off-chain data references
     */
    function updateOffChainData(
        uint256 tokenId,
        string memory memoryVaultUri,
        string memory learningDataUri,
        string memory behaviorConfigUri,
        string memory mediaAssetsUri,
        bytes32 dataIntegrityHash
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        offChainData[tokenId] = OffChainData({
            memoryVaultUri: memoryVaultUri,
            learningDataUri: learningDataUri,
            behaviorConfigUri: behaviorConfigUri,
            mediaAssetsUri: mediaAssetsUri,
            dataIntegrityHash: dataIntegrityHash
        });
        
        emit OffChainDataUpdated(tokenId, dataIntegrityHash);
    }
    
    // ============ Permissions Management ============
    
    /**
     * @dev Update agent permissions
     */
    function updatePermissions(
        uint256 tokenId,
        bool canHoldAssets,
        bool canExecuteLogic,
        bool canInteractProtocols,
        bool canBeLeasedOut
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        AgentPermissions storage perm = permissions[tokenId];
        perm.canHoldAssets = canHoldAssets;
        perm.canExecuteLogic = canExecuteLogic;
        perm.canInteractProtocols = canInteractProtocols;
        perm.canBeLeasedOut = canBeLeasedOut;
        
        emit PermissionsUpdated(tokenId, canHoldAssets, canExecuteLogic);
    }
    
    /**
     * @dev Add authorized operator
     */
    function addOperator(uint256 tokenId, address operator) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        permissions[tokenId].authorizedOperators.push(operator);
    }
    
    // ============ Marketplace Functions ============
    
    /**
     * @dev List agent for sale
     */
    function listAgent(uint256 tokenId, uint256 price, bool transferLearning) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), "Contract not approved");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            transferLearning: transferLearning
        });
        
        emit AgentListed(tokenId, msg.sender, price, transferLearning);
    }
    
    /**
     * @dev Delist agent
     */
    function delistAgent(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].active, "Not listed");
        
        listings[tokenId].active = false;
        emit AgentDelisted(tokenId);
    }
    
    /**
     * @dev Buy agent
     */
    function buyAgent(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        bool transferLearning = listing.transferLearning;
        
        listing.active = false;
        
        // Calculate fees
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / 10000;
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
        uint256 sellerProceeds = price - platformFee - royaltyAmount;
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Handle learning data transfer
        if (!transferLearning && agents[tokenId].learningEnabled) {
            // Reset learning state if not included in sale
            delete learningStates[tokenId];
            delete offChainData[tokenId];
        }
        
        // Transfer payments
        payable(platformWallet).transfer(platformFee);
        
        if (royaltyAmount > 0 && royaltyReceiver != address(0) && royaltyReceiver != seller) {
            payable(royaltyReceiver).transfer(royaltyAmount);
        } else {
            sellerProceeds += royaltyAmount;
        }
        
        payable(seller).transfer(sellerProceeds);
        
        // Refund excess
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit AgentSold(tokenId, seller, msg.sender, price);
    }
    
    // ============ View Functions ============
    
    function getAgent(uint256 tokenId) public view returns (NFAgent memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return agents[tokenId];
    }
    
    function getLearningState(uint256 tokenId) public view returns (LearningState memory) {
        return learningStates[tokenId];
    }
    
    function getOffChainData(uint256 tokenId) public view returns (OffChainData memory) {
        return offChainData[tokenId];
    }
    
    function getPermissions(uint256 tokenId) public view returns (AgentPermissions memory) {
        return permissions[tokenId];
    }
    
    function getListing(uint256 tokenId) public view returns (Listing memory) {
        return listings[tokenId];
    }
    
    function getLearningType(uint256 tokenId) public view returns (string memory) {
        LearningType lt = agents[tokenId].learningType;
        if (lt == LearningType.STATIC) return "STATIC";
        if (lt == LearningType.JSON_LIGHT) return "JSON_LIGHT";
        if (lt == LearningType.MERKLE_TREE) return "MERKLE_TREE";
        if (lt == LearningType.RAG) return "RAG";
        if (lt == LearningType.MCP) return "MCP";
        if (lt == LearningType.FINE_TUNING) return "FINE_TUNING";
        if (lt == LearningType.REINFORCEMENT) return "REINFORCEMENT";
        return "UNKNOWN";
    }
    
    function setPlatformWallet(address _platformWallet) public onlyOwner {
        platformWallet = _platformWallet;
    }
    
    // ============ Override Functions ============
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
