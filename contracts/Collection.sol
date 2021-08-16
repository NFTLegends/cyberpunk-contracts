// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collection is ERC721Enumerable, AccessControl {
    event NameChange (uint256 indexed index, string newName);
    event SkillChange (uint256 indexed index, uint256 newSkill);
    event Buy (address indexed _from, uint256 nfts, address referral);

    mapping(uint256 => string) private _tokenName;
    mapping(uint256 => uint256) private _tokenSkill;

    bool public saleActive = false;

    using SafeMath for uint256;
    using Strings for uint256;

    // Sale Stage Info struct
    struct SaleStage {
        uint256 endTokens;
        uint256 weiPerToken;
    }

    struct Batch {
        uint256 startTokenId;
        uint256 endTokenId;
        string baseURI;
        uint256 rarity;
    }

    // Array of heroes batches
    Batch[] internal _batches;
    // Array of sale stages
    SaleStage[] internal _saleStages;
    // Maximum allowed tokenSupply boundary. Can be extended by adding new stages.
    uint256 internal _maxTotalSupply = 0;
    // Max NFTs that can be bought at once.
    uint256 public maxPurchaseSize = 20;

    string internal _defaultUri;
    uint256 internal _defaultRarity;
    string internal _defaultName;
    uint256 internal _defaultSkill;
    // Role with add & set sale stages permissions
    bytes32 public constant SALE_STAGES_MANAGER_ROLE = keccak256("SALE_STAGES_MANAGER_ROLE");
    // Role with add & delete permissions
    bytes32 public constant BATCH_MANAGER_ROLE = keccak256("BATCH_MANAGER_ROLE");
    bytes32 public constant SALE_ADMIN_ROLE = keccak256("SALE_ADMIN_ROLE");
    bytes32 public constant NAME_SETTER_ROLE = keccak256("NAME_SETTER_ROLE");
    bytes32 public constant SKILL_SETTER_ROLE = keccak256("SKILL_SETTER_ROLE");
    bytes32 public constant MAX_PURCHASE_SIZE_SETTER_ROLE = keccak256("MAX_PURCHASE_SIZE_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEFAULT_URI_SETTER_ROLE = keccak256("DEFAULT_URI_SETTER_ROLE");
    bytes32 public constant DEFAULT_RARITY_SETTER_ROLE = keccak256("DEFAULT_RARITY_SETTER_ROLE");
    bytes32 public constant VAULT_SETTER_ROLE = keccak256("VAULT_SETTER_ROLE");
    bytes32 public constant DEFAULT_NAME_SETTER_ROLE = keccak256("DEFAULT_NAME_SETTER_ROLE");
    bytes32 public constant DEFAULT_SKILL_SETTER_ROLE = keccak256("DEFAULT_SKILL_SETTER_ROLE");
    address payable public vault;

    constructor() ERC721("CyberPunk", "A-12") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SALE_STAGES_MANAGER_ROLE, _msgSender());
        _setupRole(BATCH_MANAGER_ROLE, _msgSender());
        _setupRole(SALE_ADMIN_ROLE, _msgSender());
        _setupRole(NAME_SETTER_ROLE, _msgSender());
        _setupRole(SKILL_SETTER_ROLE, _msgSender());
        _setupRole(MAX_PURCHASE_SIZE_SETTER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(DEFAULT_URI_SETTER_ROLE, _msgSender());
        _setupRole(VAULT_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_RARITY_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_NAME_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_SKILL_SETTER_ROLE, _msgSender());
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Returns current `_maxTotalSupply` value.
     */
    function maxTotalSupply() public virtual view returns (uint256) {
        return _maxTotalSupply;
    }

    /**
     * @dev Hook that is called before any token transfer incl. minting
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        // check maxTotalSupply is not exceeded on mint
        if (from == address(0)) {
            require(totalSupply() <= _maxTotalSupply, "Collection: maxSupply achieved");
        }
    }

    /**
     * @notice Returns current `_saleStages` array length.
     */
    function saleStagesLength() public view returns (uint256) {
        return _saleStages.length;
    }

    /**
     * @notice Returns info about sale stage with given index.
     */
    function getSaleStage(uint256 saleStageIndex)
    public
    view
    returns (
        uint256 startTokens,
        uint256 endTokens,
        uint256 weiPerToken
    )
    {
        require(_saleStages.length > 0, "getSaleStage: no stages");

        if (0 == saleStageIndex) {
            SaleStage memory saleStage = _saleStages[saleStageIndex];
            return (0, saleStage.endTokens, saleStage.weiPerToken);
        } else {
            SaleStage memory previousSaleStage = _saleStages[saleStageIndex.sub(1)];
            SaleStage memory saleStage = _saleStages[saleStageIndex];
            return (previousSaleStage.endTokens, saleStage.endTokens, saleStage.weiPerToken);
        }
    }

    /**
     * @notice Returns current `_batches` array length.
     */
    function batchesLength() public view returns (uint256) {
        return _batches.length;
    }

    /**
     * @notice Returns `_batches`.
     */
    function getBatches() public view returns (Batch[] memory) {
        return _batches;
    }

    /**
     * @notice Return batch by its sequential Id
     Note: batch ids can change over time and reorder as the result of batch removal
     */
    function getBatch(uint256 batchId) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatch: no batches");
        require(
            batchId < _batches.length,
            "getBatch: batchId must be less than batch length"
        );

        return _batches[batchId];
    }

    /**
     * @notice Return token batch URI
     */
    function getBatchByToken(uint256 tokenId) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatchByToken: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i].endTokenId || tokenId < _batches[i].startTokenId) {
                continue;
            } else {
                return _batches[i];
            }
        }
        revert("getBatchByToken: batch doesn't exist");
    }

    /**
     * @notice Return tokenURI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_batches.length > 0, "tokenURI: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i].endTokenId || tokenId < _batches[i].startTokenId) {
                continue;
            } else {
                return string(abi.encodePacked(_batches[i].baseURI, "/", tokenId.toString(), ".json"));
            }
        }
        return _defaultUri;
    }

    /**
     * @notice Add tokens batch to batches array
     */
    function addBatch(uint256 startTokenId, uint256 endTokenId, string memory baseURI, uint256 rarity)
    external
    onlyRole(BATCH_MANAGER_ROLE)
        {
        uint256 batchesLength = _batches.length;

        require(startTokenId <= endTokenId, "addBatch: batchStartID must be equal or less than batchEndId");
        if (batchesLength > 0) {
            for (uint256 _batchId; _batchId < batchesLength; _batchId++) {
                // if both bounds are lower or higher than iter batch
                if (startTokenId < _batches[_batchId].startTokenId
                    && endTokenId < _batches[_batchId].startTokenId
                    || startTokenId > _batches[_batchId].endTokenId
                    && endTokenId > _batches[_batchId].endTokenId) {
                    continue;
                } else {
                    revert("addBatch: batches intersect");
                }
            }
        }

        _batches.push(Batch(startTokenId, endTokenId, baseURI, rarity));
    }

    /**
     * @notice Update batch by its index (index can change over time)
     */
    function setBatch(uint256 batchId, uint256 batchStartId,uint256 batchEndId, string memory baseURI, uint256 rarity)
    external
    onlyRole(BATCH_MANAGER_ROLE)
        {
        uint256 batchesLength = _batches.length;
        require(batchesLength > 0, "setBatch: batches is empty");
        require(batchStartId <= batchEndId, "setBatch: batchStartID must be equal or less than batchEndId");

        for (uint256 _batchId; _batchId < batchesLength; _batchId++) {
            if (_batchId == batchId) {
                continue;
            } else {
            // if both bounds are lower or higher than iter batch
                if (batchStartId < _batches[_batchId].startTokenId
                    && batchEndId < _batches[_batchId].startTokenId
                    || batchStartId > _batches[_batchId].endTokenId
                    && batchEndId > _batches[_batchId].endTokenId) {
                    continue;
                } else {
                    revert("setBatch: batches intersect");
                }
            }
        }

        _batches[batchId].startTokenId = batchStartId;
        _batches[batchId].endTokenId = batchEndId;
        _batches[batchId].baseURI = baseURI;
        _batches[batchId].rarity = rarity;
    }

    /**
     * @notice Removes batch at the given index
     */
    function deleteBatch(uint256 batchIndex)
    external
    onlyRole(BATCH_MANAGER_ROLE)
    {
        require(
            _batches.length > batchIndex,
            "deleteBatch: index out of batches length"
        );
        _batches[batchIndex] = _batches[_batches.length - 1];
        _batches.pop();
    }

    /**
     * @notice Adds new sale stage with given params at the end of `saleStages array`.
     */
    function addSaleStage(uint256 endTokens, uint256 weiPerToken)
    external
    onlyRole(SALE_STAGES_MANAGER_ROLE)
    {
        require(weiPerToken > 0, "addSaleStage: weiPerToken must be non-zero");
        uint256 _saleStagesLength = _saleStages.length;
        if (0 == _saleStagesLength) {
            require(endTokens > 0, "addSaleStage: first stage endTokens must be non-zero");
        }
        else {
            (,uint256 currentSaleStageEndTokens,) = getSaleStage(_saleStagesLength.sub(1));
            require(endTokens > currentSaleStageEndTokens, "addSaleStage: new endTokens must be more than current last");
        }

        _saleStages.push(SaleStage(endTokens, weiPerToken));
        _maxTotalSupply = endTokens;
    }

    /**
     * @notice Rewrites sale stage properties with given index.
     */
    function setSaleStage(uint256 saleStageIndex, uint256 endTokens, uint256 weiPerToken)
    external
    onlyRole(SALE_STAGES_MANAGER_ROLE)
    {
        uint256 _saleStagesLength = _saleStages.length;
        require(saleStageIndex < _saleStagesLength, "setSaleStage: saleStage with this index does not exist");
        require(weiPerToken > 0, "setSaleStage: weiPerToken must be non-zero");

        (uint256 previousSaleStageEndTokens,,) = getSaleStage(saleStageIndex);
        require(endTokens > previousSaleStageEndTokens, "setSaleStage: new endTokens must be more than in previous stage");

        if (saleStageIndex.add(1) < _saleStagesLength) {
            (,uint256 nextSaleStageEndTokens,) = getSaleStage(saleStageIndex.add(1));
            require(endTokens > nextSaleStageEndTokens, "setSaleStage: new endTokens must be less than in next stage");
        }

        _saleStages[saleStageIndex] = SaleStage(endTokens, weiPerToken);
    }

    /**
     * @notice Returns summary price for given number of tokens.
     */
    function getTotalPriceFor(uint256 tokens) public view returns (uint256) {
        uint256 _saleStagesLength = _saleStages.length;
        uint256 totalSupply = totalSupply();
        uint256 tokensLeft = tokens;

        uint256 totalPrice = 0;
        uint256 tokensDiff;

        SaleStage memory saleStage;
        for (uint256 i = 0; i < _saleStagesLength; i++) {
            saleStage = _saleStages[i];
            if (totalSupply > saleStage.endTokens)
                continue;
            tokensDiff = (saleStage.endTokens).sub(totalSupply);
            if (tokensLeft > 0) {
                if (tokensLeft > tokensDiff) {
                    totalPrice = totalPrice.add(tokensDiff.mul(saleStage.weiPerToken));
                    tokensLeft = tokensLeft.sub(tokensDiff);
                    totalSupply = totalSupply.add(tokensDiff);
                }
                else {
                    totalPrice = totalPrice.add(tokensLeft.mul(saleStage.weiPerToken));
                    tokensLeft = 0;
                    totalSupply = totalSupply.add(tokensLeft);
                }
            }
            else {
                break;
            }
        }
        return totalPrice;
    }

    /**
     * @notice Method to purchase and get random available NFTs.
     */
    function _mintMultiple(address to, uint256 nfts) internal {
        require(totalSupply() < _maxTotalSupply, "buy: Sale has already ended");
        require(nfts > 0, "buy: nfts cannot be 0");
        require(totalSupply().add(nfts) <= _maxTotalSupply, "buy: Exceeds _maxTotalSupply");

        for (uint i = 0; i < nfts; i++) {
            uint256 mintIndex = _getRandomAvailableIndex();
            _safeMint(to, mintIndex);
        }
    }

    function mint(address to, uint256 mintIndex) public onlyRole(MINTER_ROLE) {
        _safeMint(to, mintIndex);
    }

    /**
     * @notice Mint a set of random NFTs without purchase (for MINTER_ROLE only).
     */
    function mintMultiple(address to, uint256 nfts) public onlyRole(MINTER_ROLE) {
        _mintMultiple(to, nfts);
    }

    /**
     * @notice Method to purchase and get random available NFTs.
     */
    function buy(uint256 nfts, address referral) public payable {
        require(vault != address(0), "buy: Vault is undefined");
        require(nfts <= maxPurchaseSize, "buy: You can not buy more than maxPurchaseSize NFTs at once");
        require(getTotalPriceFor(nfts) == msg.value, "buy: Ether value sent is not correct");
        require(saleActive, "buy: Sale is not active");
        emit Buy(msg.sender, nfts, referral);
        vault.transfer(msg.value);
        _mintMultiple(msg.sender, nfts);
    }

    /**
     * @dev Pseudo-random index generator. Returns new free of owner token index.
     */
    function _getRandomAvailableIndex() internal view returns (uint256) {
        uint256 index = (
        uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp, /* solhint-disable not-rely-on-time */
                    gasleft(),
                    blockhash(block.number - 1)
                )
            )
        ) % _maxTotalSupply
        );
        while (_exists(index)) {
            index += 1;
            if (index >= _maxTotalSupply) {
                index = 0;
            }
        }
        return index;
    }

    /**
     * @dev Returns rarity of the NFT at token Id
     */
    function getRarity(uint256 tokenId) public view returns (uint256) {
        if (tokenId > _batches[_batches.length - 1].endTokenId) {
            return _defaultRarity;
        }
        return getBatchByToken(tokenId).rarity;
    }

    /**
     * @dev Returns name of the NFT at index
     */
    function getName(uint256 index) public view returns (string memory) {
        bytes memory _tokenWeight = bytes(_tokenName[index]);
        if (_tokenWeight.length == 0) {
            return _defaultName;
        }
        return _tokenName[index];
    }

    /**
     * @dev Returns skill of the NFT at index
     */
    function getSkill(uint256 index) public view returns (uint256) {
        if (_tokenSkill[index] == 0) {
            return _defaultSkill;
        }
        return _tokenSkill[index];
    }

    /**
     * @dev Starts sale
     */
    function start() public onlyRole(SALE_ADMIN_ROLE) {
        require(bytes(_defaultUri).length > 0, "start: _defaultUri is undefined");
        require(vault != address(0), "start: Vault is undefined");
        saleActive = true;
    }

    /**
     * @dev Stops sale
     */
    function stop() public onlyRole(SALE_ADMIN_ROLE) {
        saleActive = false;
    }

    /**
     * @dev Change token name
     */
    function setName(uint256 id, string memory newName) public onlyRole(NAME_SETTER_ROLE) {
        _tokenName[id] = newName;
        emit NameChange(id, newName);
    }

    /**
     * @dev Change token skill
     */
    function setSkill(uint256 id, uint256 newSkill) public onlyRole(SKILL_SETTER_ROLE) {
        _tokenSkill[id] = newSkill;
        emit SkillChange(id, newSkill);
    }

    /**
    * @dev Change max purchase size.
    */
    function setMaxPurchaseSize(uint256 newPurchaseSize) public onlyRole(MAX_PURCHASE_SIZE_SETTER_ROLE) {
        maxPurchaseSize = newPurchaseSize;
    }

    /**
    * @dev Set defaultUri.
    */
    function setDefaultUri(string memory uri) public onlyRole (DEFAULT_URI_SETTER_ROLE) {
        _defaultUri = uri;
    }

    /**
     * @dev Change vault.
     */
    function setVault(address payable newVault) public onlyRole (VAULT_SETTER_ROLE) {
        vault = newVault;
    }

    /**
     * @dev Set defaultRarity.
     */
    function setDefaultRarity(uint256 rarity) public onlyRole(DEFAULT_RARITY_SETTER_ROLE) {
        _defaultRarity = rarity;
    }

    /**
     * @dev Set default name.
     */
    function setDefaultName(string memory name) public onlyRole (DEFAULT_NAME_SETTER_ROLE) {
        _defaultName = name;
    }

    /**
     * @dev Set default skill.
     */
    function setDefaultSkill(uint256 skill) public onlyRole(DEFAULT_SKILL_SETTER_ROLE) {
        _defaultSkill = skill;
    }
}
