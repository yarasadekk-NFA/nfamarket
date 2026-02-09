// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ERC8004TrustlessAgents
 * @dev Implementation of ERC-8004 Trustless Agents standard for NFA Market
 * Provides on-chain identity, reputation, and validation infrastructure for AI agents
 * 
 * Three Core Registries:
 * 1. Identity Registry - Agent NFT with registration file
 * 2. Reputation Registry - Feedback and scoring system
 * 3. Validation Registry - Third-party verification
 */
contract ERC8004TrustlessAgents is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextAgentId;
    
    // ============ Identity Registry ============
    
    struct AgentRegistration {
        string name;
        string description;
        string[] services;           // A2A, MCP, x402 endpoints
        string[] capabilities;
        string modelType;
        address creator;
        uint256 registeredAt;
        bool active;
    }
    
    mapping(uint256 => AgentRegistration) public agentRegistry;
    mapping(address => uint256[]) public creatorAgents;
    
    // ============ Reputation Registry ============
    
    struct Feedback {
        address client;
        uint8 score;                 // 1-100
        bytes32 tag1;
        bytes32 tag2;
        string proofUri;             // IPFS link to detailed proof
        bytes32 proofHash;
        uint256 timestamp;
    }
    
    struct ReputationSummary {
        uint64 totalFeedbacks;
        uint64 averageScore;
        uint256 lastUpdated;
    }
    
    mapping(uint256 => Feedback[]) public agentFeedbacks;
    mapping(uint256 => ReputationSummary) public reputationSummaries;
    mapping(uint256 => mapping(address => bool)) public feedbackAuthorizations;
    
    // ============ Validation Registry ============
    
    enum ValidationType { ZKML, TEE, STAKING, MANUAL }
    
    struct Validation {
        address validator;
        ValidationType validationType;
        bool passed;
        string proofUri;
        bytes32 proofHash;
        uint256 timestamp;
    }
    
    mapping(uint256 => Validation[]) public agentValidations;
    mapping(address => bool) public trustedValidators;
    
    // ============ Events ============
    
    event AgentRegistered(uint256 indexed agentId, address indexed creator, string name);
    event AgentUpdated(uint256 indexed agentId, string name);
    event AgentDeactivated(uint256 indexed agentId);
    
    event FeedbackGiven(uint256 indexed agentId, address indexed client, uint8 score);
    event FeedbackAuthorized(uint256 indexed agentId, address indexed client);
    
    event ValidationAdded(uint256 indexed agentId, address indexed validator, ValidationType validationType, bool passed);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    
    // ============ Constructor ============
    
    constructor() ERC721("ERC8004 Trustless Agent", "ERC8004") Ownable(msg.sender) {}
    
    // ============ Identity Registry Functions ============
    
    /**
     * @dev Register a new AI agent with identity NFT
     */
    function register(
        string memory name,
        string memory description,
        string[] memory services,
        string[] memory capabilities,
        string memory modelType,
        string memory registrationUri
    ) public returns (uint256) {
        uint256 agentId = _nextAgentId++;
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, registrationUri);
        
        agentRegistry[agentId] = AgentRegistration({
            name: name,
            description: description,
            services: services,
            capabilities: capabilities,
            modelType: modelType,
            creator: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });
        
        creatorAgents[msg.sender].push(agentId);
        
        emit AgentRegistered(agentId, msg.sender, name);
        return agentId;
    }
    
    /**
     * @dev Update agent registration details
     */
    function updateRegistration(
        uint256 agentId,
        string memory name,
        string memory description,
        string[] memory services,
        string[] memory capabilities,
        string memory registrationUri
    ) public {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(agentRegistry[agentId].active, "Agent not active");
        
        AgentRegistration storage agent = agentRegistry[agentId];
        agent.name = name;
        agent.description = description;
        agent.services = services;
        agent.capabilities = capabilities;
        
        _setTokenURI(agentId, registrationUri);
        
        emit AgentUpdated(agentId, name);
    }
    
    /**
     * @dev Deactivate an agent
     */
    function deactivateAgent(uint256 agentId) public {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agentRegistry[agentId].active = false;
        emit AgentDeactivated(agentId);
    }
    
    /**
     * @dev Get agent registration details
     */
    function getAgentRegistration(uint256 agentId) public view returns (AgentRegistration memory) {
        require(agentId < _nextAgentId, "Agent does not exist");
        return agentRegistry[agentId];
    }
    
    // ============ Reputation Registry Functions ============
    
    /**
     * @dev Authorize a client to give feedback (anti-gaming measure)
     */
    function authorizeFeedback(uint256 agentId, address client) public {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        feedbackAuthorizations[agentId][client] = true;
        emit FeedbackAuthorized(agentId, client);
    }
    
    /**
     * @dev Give feedback to an agent (requires prior authorization)
     */
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string memory proofUri,
        bytes32 proofHash
    ) public {
        require(agentId < _nextAgentId, "Agent does not exist");
        require(feedbackAuthorizations[agentId][msg.sender], "Not authorized to give feedback");
        require(score >= 1 && score <= 100, "Score must be 1-100");
        
        agentFeedbacks[agentId].push(Feedback({
            client: msg.sender,
            score: score,
            tag1: tag1,
            tag2: tag2,
            proofUri: proofUri,
            proofHash: proofHash,
            timestamp: block.timestamp
        }));
        
        // Update reputation summary
        ReputationSummary storage summary = reputationSummaries[agentId];
        uint256 totalScore = uint256(summary.averageScore) * summary.totalFeedbacks + score;
        summary.totalFeedbacks++;
        summary.averageScore = uint64(totalScore / summary.totalFeedbacks);
        summary.lastUpdated = block.timestamp;
        
        // Remove authorization after use
        feedbackAuthorizations[agentId][msg.sender] = false;
        
        emit FeedbackGiven(agentId, msg.sender, score);
    }
    
    /**
     * @dev Get reputation summary for an agent
     */
    function getReputationSummary(uint256 agentId) public view returns (ReputationSummary memory) {
        return reputationSummaries[agentId];
    }
    
    /**
     * @dev Get all feedbacks for an agent
     */
    function getAgentFeedbacks(uint256 agentId) public view returns (Feedback[] memory) {
        return agentFeedbacks[agentId];
    }
    
    /**
     * @dev Get filtered reputation summary by client addresses
     */
    function getSummary(
        uint256 agentId,
        address[] memory clientAddresses
    ) public view returns (uint64 count, uint8 averageScore) {
        Feedback[] memory feedbacks = agentFeedbacks[agentId];
        uint256 totalScore = 0;
        uint64 matchCount = 0;
        
        for (uint i = 0; i < feedbacks.length; i++) {
            for (uint j = 0; j < clientAddresses.length; j++) {
                if (feedbacks[i].client == clientAddresses[j]) {
                    totalScore += feedbacks[i].score;
                    matchCount++;
                    break;
                }
            }
        }
        
        if (matchCount > 0) {
            return (matchCount, uint8(totalScore / matchCount));
        }
        return (0, 0);
    }
    
    // ============ Validation Registry Functions ============
    
    /**
     * @dev Add a trusted validator
     */
    function addValidator(address validator) public onlyOwner {
        trustedValidators[validator] = true;
        emit ValidatorAdded(validator);
    }
    
    /**
     * @dev Remove a trusted validator
     */
    function removeValidator(address validator) public onlyOwner {
        trustedValidators[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    /**
     * @dev Add validation result for an agent
     */
    function addValidation(
        uint256 agentId,
        ValidationType validationType,
        bool passed,
        string memory proofUri,
        bytes32 proofHash
    ) public {
        require(trustedValidators[msg.sender], "Not a trusted validator");
        require(agentId < _nextAgentId, "Agent does not exist");
        
        agentValidations[agentId].push(Validation({
            validator: msg.sender,
            validationType: validationType,
            passed: passed,
            proofUri: proofUri,
            proofHash: proofHash,
            timestamp: block.timestamp
        }));
        
        emit ValidationAdded(agentId, msg.sender, validationType, passed);
    }
    
    /**
     * @dev Get all validations for an agent
     */
    function getAgentValidations(uint256 agentId) public view returns (Validation[] memory) {
        return agentValidations[agentId];
    }
    
    /**
     * @dev Check if agent has passed validation of a specific type
     */
    function hasValidation(uint256 agentId, ValidationType validationType) public view returns (bool) {
        Validation[] memory validations = agentValidations[agentId];
        for (uint i = 0; i < validations.length; i++) {
            if (validations[i].validationType == validationType && validations[i].passed) {
                return true;
            }
        }
        return false;
    }
    
    // ============ Override Functions ============
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
