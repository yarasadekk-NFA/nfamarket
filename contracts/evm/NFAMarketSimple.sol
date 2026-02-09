// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract NFAMarket {
    string public name = "Non-Fungible Agent";
    string public symbol = "NFA";
    
    address public owner;
    address public platformWallet;
    uint256 public platformFeeBps = 100; // 1%
    uint256 public royaltyBps = 100; // 1%
    
    uint256 private _tokenIdCounter;
    
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
    mapping(uint256 => Listing) public listings;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event AgentSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _platformWallet) {
        owner = msg.sender;
        platformWallet = _platformWallet;
    }
    
    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "Zero address");
        return _balances[_owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token not exists");
        return tokenOwner;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token not exists");
        return _tokenURIs[tokenId];
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Approve to owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token not exists");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Approve to self");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address _owner, address operator) public view returns (bool) {
        return _operatorApprovals[_owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Non-receiver");
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender));
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Not owner");
        require(to != address(0), "Zero address");
        
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        if (listings[tokenId].active) {
            listings[tokenId].active = false;
        }
        
        emit Transfer(from, to, tokenId);
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch {
                return false;
            }
        }
        return true;
    }
    
    function mintAgent(string memory _tokenURI) public returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _balances[msg.sender] += 1;
        _owners[tokenId] = msg.sender;
        _tokenURIs[tokenId] = _tokenURI;
        _creators[tokenId] = msg.sender;
        
        emit Transfer(address(0), msg.sender, tokenId);
        emit AgentMinted(tokenId, msg.sender, _tokenURI);
        
        return tokenId;
    }
    
    function listAgent(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit AgentListed(tokenId, msg.sender, price);
    }
    
    function cancelListing(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        require(listings[tokenId].active, "Not listed");
        
        listings[tokenId].active = false;
        emit ListingCancelled(tokenId);
    }
    
    function buyAgent(uint256 tokenId) public payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listings[tokenId].active = false;
        
        uint256 platformFee = (listing.price * platformFeeBps) / 10000;
        uint256 royalty = (listing.price * royaltyBps) / 10000;
        uint256 sellerAmount = listing.price - platformFee - royalty;
        
        _transfer(listing.seller, msg.sender, tokenId);
        
        payable(platformWallet).transfer(platformFee);
        payable(_creators[tokenId]).transfer(royalty);
        payable(listing.seller).transfer(sellerAmount);
        
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit AgentSold(tokenId, msg.sender, listing.seller, listing.price);
    }
    
    function getCreator(uint256 tokenId) public view returns (address) {
        return _creators[tokenId];
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function setPlatformWallet(address _platformWallet) public onlyOwner {
        platformWallet = _platformWallet;
    }
    
    function setPlatformFee(uint256 _feeBps) public onlyOwner {
        require(_feeBps <= 500, "Max 5%");
        platformFeeBps = _feeBps;
    }
    
    function setRoyalty(uint256 _royaltyBps) public onlyOwner {
        require(_royaltyBps <= 500, "Max 5%");
        royaltyBps = _royaltyBps;
    }
    
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f || interfaceId == 0x01ffc9a7;
    }
}
