// SPDX-License-Identifier: MIT
// TRC-721 Compatible Contract for TRON Network
pragma solidity ^0.8.0;

interface ITRC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface ITRC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract NFAMarketTron is ITRC721, ITRC721Metadata {
    string private _name;
    string private _symbol;
    
    uint256 private _nextTokenId;
    address public owner;
    address public platformWallet;
    
    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public constant CREATOR_ROYALTY_BPS = 100;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _creators;
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    struct AgentMetadata {
        string agentName;
        string description;
        string modelType;
        address creator;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => AgentMetadata) public agentMetadata;
    
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string agentName);
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event AgentDelisted(uint256 indexed tokenId);
    event AgentSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _platformWallet) {
        _name = "Non-Fungible Agent";
        _symbol = "NFA";
        owner = msg.sender;
        platformWallet = _platformWallet;
    }
    
    function name() public view override returns (string memory) {
        return _name;
    }
    
    function symbol() public view override returns (string memory) {
        return _symbol;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    function balanceOf(address tokenOwner) public view override returns (uint256) {
        require(tokenOwner != address(0), "Zero address");
        return _balances[tokenOwner];
    }
    
    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }
    
    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender));
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Not owner");
        require(to != address(0), "Zero address");
        
        _tokenApprovals[tokenId] = address(0);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function mintAgent(
        string memory agentName,
        string memory description,
        string memory modelType,
        string memory uri
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _balances[msg.sender] += 1;
        _owners[tokenId] = msg.sender;
        _tokenURIs[tokenId] = uri;
        _creators[tokenId] = msg.sender;
        
        agentMetadata[tokenId] = AgentMetadata({
            agentName: agentName,
            description: description,
            modelType: modelType,
            creator: msg.sender
        });
        
        emit Transfer(address(0), msg.sender, tokenId);
        emit AgentMinted(tokenId, msg.sender, agentName);
        
        return tokenId;
    }
    
    function listAgent(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");
        require(getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit AgentListed(tokenId, msg.sender, price);
    }
    
    function delistAgent(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        require(listings[tokenId].active, "Not listed");
        
        listings[tokenId].active = false;
        emit AgentDelisted(tokenId);
    }
    
    function buyAgent(uint256 tokenId) public payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        address creator = _creators[tokenId];
        
        listing.active = false;
        
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / 10000;
        uint256 creatorRoyalty = 0;
        
        if (creator != seller) {
            creatorRoyalty = (price * CREATOR_ROYALTY_BPS) / 10000;
        }
        
        uint256 sellerProceeds = price - platformFee - creatorRoyalty;
        
        _transfer(seller, msg.sender, tokenId);
        
        payable(platformWallet).transfer(platformFee);
        
        if (creatorRoyalty > 0) {
            payable(creator).transfer(creatorRoyalty);
        }
        
        payable(seller).transfer(sellerProceeds);
        
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit AgentSold(tokenId, seller, msg.sender, price);
    }
    
    function getCreator(uint256 tokenId) public view returns (address) {
        return _creators[tokenId];
    }
    
    function setPlatformWallet(address _platformWallet) public onlyOwner {
        platformWallet = _platformWallet;
    }
}
