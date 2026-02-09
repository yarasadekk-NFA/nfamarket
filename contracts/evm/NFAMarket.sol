// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFAMarket is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint96 public constant PLATFORM_FEE_BPS = 100;
    uint96 public constant CREATOR_ROYALTY_BPS = 100;
    
    address public platformWallet;
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    struct AgentMetadata {
        string name;
        string description;
        string[] capabilities;
        string modelType;
        address creator;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => AgentMetadata) public agentMetadata;
    
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string name);
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event AgentDelisted(uint256 indexed tokenId);
    event AgentSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    
    constructor(address _platformWallet) ERC721("Non-Fungible Agent", "NFA") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }
    
    function mintAgent(
        string memory name,
        string memory description,
        string[] memory capabilities,
        string memory modelType,
        string memory tokenURI
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        _setTokenRoyalty(tokenId, msg.sender, CREATOR_ROYALTY_BPS);
        
        agentMetadata[tokenId] = AgentMetadata({
            name: name,
            description: description,
            capabilities: capabilities,
            modelType: modelType,
            creator: msg.sender
        });
        
        emit AgentMinted(tokenId, msg.sender, name);
        return tokenId;
    }
    
    function listAgent(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), "Contract not approved");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit AgentListed(tokenId, msg.sender, price);
    }
    
    function delistAgent(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].active, "Not listed");
        
        listings[tokenId].active = false;
        emit AgentDelisted(tokenId);
    }
    
    function buyAgent(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        listing.active = false;
        
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / 10000;
        
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
        
        uint256 sellerProceeds = price - platformFee - royaltyAmount;
        
        _transfer(seller, msg.sender, tokenId);
        
        payable(platformWallet).transfer(platformFee);
        
        if (royaltyAmount > 0 && royaltyReceiver != address(0) && royaltyReceiver != seller) {
            payable(royaltyReceiver).transfer(royaltyAmount);
        } else {
            sellerProceeds += royaltyAmount;
        }
        
        payable(seller).transfer(sellerProceeds);
        
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit AgentSold(tokenId, seller, msg.sender, price);
    }
    
    function getAgentMetadata(uint256 tokenId) public view returns (AgentMetadata memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return agentMetadata[tokenId];
    }
    
    function getListing(uint256 tokenId) public view returns (Listing memory) {
        return listings[tokenId];
    }
    
    function setPlatformWallet(address _platformWallet) public onlyOwner {
        platformWallet = _platformWallet;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
