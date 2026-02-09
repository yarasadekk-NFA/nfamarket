// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ERC7857IntelligentNFT
 * @dev Implementation of ERC-7857 Intelligent NFTs for AI Agents
 * Enables AI agents with private metadata and secure re-encryption during transfers
 * 
 * Key Features:
 * - Encrypted metadata storage for AI models, memory, and training data
 * - Secure re-encryption during ownership transfers via oracles
 * - Dynamic metadata updates for learning agents
 * - Verification methods (TEE, ZKP) for privacy-preserving validation
 */
contract ERC7857IntelligentNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint96 public constant PLATFORM_FEE_BPS = 100;  // 1%
    uint96 public constant CREATOR_ROYALTY_BPS = 100;  // 1%
    
    address public platformWallet;
    
    // ============ Verification Methods ============
    
    enum VerificationMethod { NONE, TEE, ZKP, HYBRID }
    
    // ============ Private Metadata ============
    
    struct PrivateMetadata {
        bytes32 encryptedDataHash;       // Hash of encrypted AI model/memory
        string encryptedDataUri;          // IPFS/decentralized storage URI
        VerificationMethod verificationMethod;
        address encryptionOracle;         // Oracle for re-encryption
        uint256 lastUpdated;
    }
    
    // ============ Agent Configuration ============
    
    struct IntelligentAgent {
        string name;
        string description;
        string[] capabilities;
        string modelType;
        address creator;
        bool learningEnabled;
        bytes32 currentStateHash;         // Merkle root of learning state
        uint256 createdAt;
    }
    
    // ============ Listing ============
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        bool includePrivateData;          // Whether sale includes private metadata
    }
    
    // ============ Storage ============
    
    mapping(uint256 => IntelligentAgent) public agents;
    mapping(uint256 => PrivateMetadata) public privateMetadata;
    mapping(uint256 => Listing) public listings;
    mapping(address => bool) public trustedOracles;
    
    // ============ Events ============
    
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string name, bool learningEnabled);
    event PrivateMetadataSet(uint256 indexed tokenId, bytes32 encryptedDataHash, VerificationMethod method);
    event PrivateMetadataUpdated(uint256 indexed tokenId, bytes32 newStateHash);
    event TransferWithReEncryption(uint256 indexed tokenId, address indexed from, address indexed to, address oracle);
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price, bool includePrivateData);
    event AgentDelisted(uint256 indexed tokenId);
    event AgentSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    
    // ============ Constructor ============
    
    constructor(address _platformWallet) ERC721("ERC7857 Intelligent NFT", "iNFT") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }
    
    // ============ Oracle Management ============
    
    function addOracle(address oracle) public onlyOwner {
        trustedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }
    
    function removeOracle(address oracle) public onlyOwner {
        trustedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }
    
    // ============ Minting ============
    
    /**
     * @dev Mint a new intelligent NFT agent
     */
    function mintAgent(
        string memory name,
        string memory description,
        string[] memory capabilities,
        string memory modelType,
        string memory publicUri,
        bool learningEnabled
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, publicUri);
        _setTokenRoyalty(tokenId, msg.sender, CREATOR_ROYALTY_BPS);
        
        agents[tokenId] = IntelligentAgent({
            name: name,
            description: description,
            capabilities: capabilities,
            modelType: modelType,
            creator: msg.sender,
            learningEnabled: learningEnabled,
            currentStateHash: bytes32(0),
            createdAt: block.timestamp
        });
        
        emit AgentMinted(tokenId, msg.sender, name, learningEnabled);
        return tokenId;
    }
    
    // ============ Private Metadata Management ============
    
    /**
     * @dev Set private encrypted metadata for an agent
     */
    function setPrivateMetadata(
        uint256 tokenId,
        bytes32 encryptedDataHash,
        string memory encryptedDataUri,
        VerificationMethod method,
        address oracle
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(method == VerificationMethod.NONE || trustedOracles[oracle], "Oracle not trusted");
        
        privateMetadata[tokenId] = PrivateMetadata({
            encryptedDataHash: encryptedDataHash,
            encryptedDataUri: encryptedDataUri,
            verificationMethod: method,
            encryptionOracle: oracle,
            lastUpdated: block.timestamp
        });
        
        emit PrivateMetadataSet(tokenId, encryptedDataHash, method);
    }
    
    /**
     * @dev Update learning state (for learning-enabled agents)
     */
    function updateLearningState(uint256 tokenId, bytes32 newStateHash) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(agents[tokenId].learningEnabled, "Learning not enabled");
        
        agents[tokenId].currentStateHash = newStateHash;
        privateMetadata[tokenId].lastUpdated = block.timestamp;
        
        emit PrivateMetadataUpdated(tokenId, newStateHash);
    }
    
    /**
     * @dev Verify transfer validity (called by oracle)
     */
    function verifyTransferValidity(
        uint256 tokenId,
        bytes calldata proof
    ) public view returns (bool) {
        PrivateMetadata memory meta = privateMetadata[tokenId];
        
        if (meta.verificationMethod == VerificationMethod.NONE) {
            return true;
        }
        
        // In production, this would verify the proof against the verification method
        // For TEE: verify attestation
        // For ZKP: verify zero-knowledge proof
        return proof.length > 0;
    }
    
    /**
     * @dev Get verification method for a token
     */
    function getVerificationMethod(uint256 tokenId) public view returns (string memory) {
        VerificationMethod method = privateMetadata[tokenId].verificationMethod;
        if (method == VerificationMethod.TEE) return "TEE";
        if (method == VerificationMethod.ZKP) return "ZKP";
        if (method == VerificationMethod.HYBRID) return "HYBRID";
        return "NONE";
    }
    
    // ============ Marketplace Functions ============
    
    /**
     * @dev List agent for sale
     */
    function listAgent(uint256 tokenId, uint256 price, bool includePrivateData) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), "Contract not approved");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            includePrivateData: includePrivateData
        });
        
        emit AgentListed(tokenId, msg.sender, price, includePrivateData);
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
     * @dev Buy agent with optional re-encryption
     */
    function buyAgent(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        listing.active = false;
        
        // Calculate fees
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / 10000;
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
        uint256 sellerProceeds = price - platformFee - royaltyAmount;
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Handle re-encryption if private data included
        if (listing.includePrivateData && privateMetadata[tokenId].encryptionOracle != address(0)) {
            emit TransferWithReEncryption(
                tokenId, 
                seller, 
                msg.sender, 
                privateMetadata[tokenId].encryptionOracle
            );
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
    
    function getAgent(uint256 tokenId) public view returns (IntelligentAgent memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return agents[tokenId];
    }
    
    function getPrivateMetadata(uint256 tokenId) public view returns (PrivateMetadata memory) {
        require(ownerOf(tokenId) == msg.sender, "Only owner can view private metadata");
        return privateMetadata[tokenId];
    }
    
    function getListing(uint256 tokenId) public view returns (Listing memory) {
        return listings[tokenId];
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
