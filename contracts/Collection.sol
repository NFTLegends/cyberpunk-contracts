// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collection is ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable {
    event NameChange(uint256 indexed index, string _newName);
    event SkillChange(uint256 indexed index, uint256 _newSkill);
    event DnaChange(uint256 indexed index, uint256 _newDna);
    event Buy(address indexed _from, uint256 _nfts, address _referral);

    mapping(uint256 => string) private _tokenName;
    mapping(uint256 => uint256) private _tokenSkill;
    mapping(uint256 => uint256) private _tokenDna;

    bool public saleActive;

    using SafeMath for uint256;
    using Strings for uint256;

    // Sale Stage Info struct
    struct SaleStage {
        uint256 _startSaleTokenId;
        uint256 _endSaleTokenId;
        uint256 _weiPerToken;
    }

    struct Batch {
        uint256 _startBatchTokenId;
        uint256 _endBatchTokenId;
        string _baseURI;
        uint256 _rarity;
    }

    // Array of heroes batches
    Batch[] internal _batches;
    // Array of sale stages
    SaleStage[] internal _saleStages;
    // Maximum allowed tokenSupply boundary. Can be extended by adding new stages.
    uint256 internal _maxTotalSupply;
    // Max NFTs that can be bought at once.
    uint256 public _maxPurchaseSize;

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
    bytes32 public constant DNA_SETTER_ROLE = keccak256("DNA_SETTER_ROLE");
    bytes32 public constant MAX_PURCHASE_SIZE_SETTER_ROLE = keccak256("MAX_PURCHASE_SIZE_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEFAULT_URI_SETTER_ROLE = keccak256("DEFAULT_URI_SETTER_ROLE");
    bytes32 public constant DEFAULT_RARITY_SETTER_ROLE = keccak256("DEFAULT_RARITY_SETTER_ROLE");
    bytes32 public constant VAULT_SETTER_ROLE = keccak256("VAULT_SETTER_ROLE");
    bytes32 public constant DEFAULT_NAME_SETTER_ROLE = keccak256("DEFAULT_NAME_SETTER_ROLE");
    bytes32 public constant DEFAULT_SKILL_SETTER_ROLE = keccak256("DEFAULT_SKILL_SETTER_ROLE");
    address payable public _vault;

    function initialize() public initializer {
        __ERC721_init("CyberPunk", "A-12");
        __ERC721Enumerable_init();
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SALE_STAGES_MANAGER_ROLE, _msgSender());
        _setupRole(BATCH_MANAGER_ROLE, _msgSender());
        _setupRole(SALE_ADMIN_ROLE, _msgSender());
        _setupRole(NAME_SETTER_ROLE, _msgSender());
        _setupRole(SKILL_SETTER_ROLE, _msgSender());
        _setupRole(DNA_SETTER_ROLE, _msgSender());
        _setupRole(MAX_PURCHASE_SIZE_SETTER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(DEFAULT_URI_SETTER_ROLE, _msgSender());
        _setupRole(VAULT_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_RARITY_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_NAME_SETTER_ROLE, _msgSender());
        _setupRole(DEFAULT_SKILL_SETTER_ROLE, _msgSender());
        _maxPurchaseSize = 20;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Returns current `_maxTotalSupply` value.
     */
    function maxTotalSupply() public view virtual returns (uint256) {
        return _maxTotalSupply;
    }

    /**
     * @dev Hook that is called before any token transfer incl. minting
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
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
    function getSaleStage(uint256 saleStageIndex) public view returns (SaleStage memory) {
        require(_saleStages.length > 0, "getSaleStage: no stages");
        require(saleStageIndex < _saleStages.length, "saleStageIndex must be less than sale stages length");

        return _saleStages[saleStageIndex];
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
     * @notice Returns `_batches`.
     */
    function getSaleStages() public view returns (SaleStage[] memory) {
        return _saleStages;
    }

    /**
     * @notice Return batch by its sequential Id
     Note: batch ids can change over time and reorder as the result of batch removal
     */
    function getBatch(uint256 batchIndex) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatch: no batches");
        require(batchIndex < _batches.length, "getBatch: batchId must be less than batch length");

        return _batches[batchIndex];
    }

    /**
     * @notice Return token batch URI
     */
    function getBatchByToken(uint256 tokenId) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatchByToken: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i]._endBatchTokenId || tokenId < _batches[i]._startBatchTokenId) {
                continue;
            } else {
                return _batches[i];
            }
        }
        revert("batch doesn't exist");
    }

    /**
     * @notice Return tokenURI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_batches.length > 0, "tokenURI: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i]._endBatchTokenId || tokenId < _batches[i]._startBatchTokenId) {
                continue;
            } else {
                return string(abi.encodePacked(_batches[i]._baseURI, "/", tokenId.toString(), ".json"));
            }
        }
        return _defaultUri;
    }

    /**
     * @notice Add tokens batch to batches array
     */
    function addBatch(
        uint256 startTokenId,
        uint256 endTokenId,
        string memory baseURI,
        uint256 rarity
    ) external onlyRole(BATCH_MANAGER_ROLE) {
        uint256 _batchesLength = _batches.length;

        require(startTokenId <= endTokenId, "addBatch: batchStartID must be equal or less than batchEndId");
        if (_batchesLength > 0) {
            for (uint256 _batchId; _batchId < _batchesLength; _batchId++) {
                // if both bounds are lower or higher than iter batch
                if (
                    (startTokenId < _batches[_batchId]._startBatchTokenId &&
                        endTokenId < _batches[_batchId]._startBatchTokenId) ||
                    (startTokenId > _batches[_batchId]._endBatchTokenId &&
                        endTokenId > _batches[_batchId]._endBatchTokenId)
                ) {
                    continue;
                } else {
                    revert("batches intersect");
                }
            }
        }

        _batches.push(Batch(startTokenId, endTokenId, baseURI, rarity));
    }

    /**
     * @notice Update batch by its index (index can change over time)
     */
    function setBatch(
        uint256 batchIndex,
        uint256 batchStartId,
        uint256 batchEndId,
        string memory baseURI,
        uint256 rarity
    ) external onlyRole(BATCH_MANAGER_ROLE) {
        uint256 _batchesLength = _batches.length;
        require(_batchesLength > 0, "setBatch: batches is empty");
        require(batchStartId <= batchEndId, "setBatch: batchStartID must be equal or less than batchEndId");

        for (uint256 _batchId; _batchId < _batchesLength; _batchId++) {
            if (_batchId == batchIndex) {
                continue;
            } else {
                // if both bounds are lower or higher than iter batch
                if (
                    (batchStartId < _batches[_batchId]._startBatchTokenId &&
                        batchEndId < _batches[_batchId]._startBatchTokenId) ||
                    (batchStartId > _batches[_batchId]._endBatchTokenId &&
                        batchEndId > _batches[_batchId]._endBatchTokenId)
                ) {
                    continue;
                } else {
                    revert("batches intersect");
                }
            }
        }

        _batches[_batchIndex]._startBatchTokenId = _batchStartId;
        _batches[_batchIndex]._endBatchTokenId = _batchEndId;
        _batches[_batchIndex]._baseURI = _baseURI;
        _batches[_batchIndex]._rarity = _rarity;
    }

    /**
     * @notice Removes batch at the given index
     */
    function deleteBatch(uint256 batchIndex) external onlyRole(BATCH_MANAGER_ROLE) {
        require(_batches.length > batchIndex, "index out of batches length");
        _batches[batchIndex] = _batches[_batches.length - 1];
        _batches.pop();
    }

    /**
     * @notice Adds new sale stage with given params at the end of `saleStages array`.
     */
    function addSaleStage(
        uint256 startTokenId,
        uint256 endTokenId,
        uint256 weiPerToken
    ) external onlyRole(SALE_STAGES_MANAGER_ROLE) {
        require(startTokenId <= endTokenId, "startTokenId must be equal or less than endTokenId");
        require(weiPerToken > 0, "weiPerToken must be non-zero");
        uint256 _saleStagesLength = _saleStages.length;

        if (_saleStagesLength > 0) {
            for (uint256 _saleStageId; _saleStageId < _saleStagesLength; _saleStageId++) {
                // if both bounds are lower or higher than iter sale stage
                if (
                    (startTokenId < _saleStages[_saleStageId]._startSaleTokenId &&
                        endTokenId < _saleStages[_saleStageId]._startSaleTokenId) ||
                    (startTokenId > _saleStages[_saleStageId]._endSaleTokenId &&
                        endTokenId > _saleStages[_saleStageId]._endSaleTokenId)
                ) {
                    continue;
                } else {
                    revert("intersection _saleStages");
                }
            }
        }

        _saleStages.push(SaleStage(startTokenId, endTokenId, weiPerToken));
        _maxTotalSupply += endTokenId - startTokenId + 1;
    }

    /**
     * @notice Rewrites sale stage properties with given index.
     */
    function setSaleStage(
        uint256 saleStageId,
        uint256 startTokenId,
        uint256 saleStageEndId,
        uint256 weiPerToken
    ) external onlyRole(SALE_STAGES_MANAGER_ROLE) {
        uint256 _saleStagesLength = _saleStages.length;
        require(_saleStagesLength > 0, "batches is empty");
        require(startTokenId <= saleStageEndId, "startTokenId must be equal or less than saleStageEndId");
        for (uint256 _saleStageId; _saleStageId < _saleStagesLength; _saleStageId++) {
            if (_saleStageId == saleStageId) {
                continue;
            } else {
                // if both bounds are lower or higher than iter sale stage
                if (
                    (startTokenId < _saleStages[_staleSaleId]._startSaleTokenId &&
                        saleStageEndId < _saleStages[_staleSaleId]._startSaleTokenId) ||
                    (startTokenId > _saleStages[_staleSaleId]._endSaleTokenId &&
                        saleStageEndId > _saleStages[_staleSaleId]._endSaleTokenId)
                ) {
                    continue;
                } else {
                    revert("intersection _saleStages");
                }
            }
        }
        SaleStage memory _saleStage = _saleStages[saleStageId];
        _maxTotalSupply =
            _maxTotalSupply -
            (_saleStage._endSaleTokenId - _saleStage._startSaleTokenId + 1) +
            (_saleStageEndId - startTokenId + 1);

        _saleStages[_saleStageId]._startSaleTokenId = startTokenId;
        _saleStages[_saleStageId]._endSaleTokenId = saleStageEndId;
        _saleStages[_saleStageId]._weiPerToken = weiPerToken;
    }

    function deleteSaleStage(uint256 saleStageIndex) external onlyRole(BATCH_MANAGER_ROLE) {
        require(_saleStages.length > saleStageIndex, "index out of sale stage length");
        SaleStage memory _saleStage = _saleStages[saleStageIndex];
        _maxTotalSupply -= _saleStage._endSaleTokenId - _saleStage._startSaleTokenId + 1;

        _saleStages[saleStageIndex] = _saleStages[_saleStages.length - 1];
        _saleStages.pop();
    }

    /**
     * @notice Returns summary price for given number of tokens.
     */
    function getTotalPriceFor(uint256 tokens) public view returns (uint256) {
        require(tokens > 0, "tokens must be more then 0");

        uint256 _saleStagesLength = _saleStages.length;
        uint256 totalSupply = totalSupply();
        uint256 iterPrice = 0;
        uint256 totalPrice = 0;

        SaleStage memory saleStage;
        for (uint256 tokenIndex = 0; tokenIndex < tokens; tokenIndex++) {
            iterPrice = 0;
            for (uint256 i = 0; i < _saleStagesLength; i++) {
                saleStage = _saleStages[i];
                if (totalSupply > saleStage._endSaleTokenId || totalSupply < saleStage._startSaleTokenId) continue;
                iterPrice += saleStage._weiPerToken;
            }
            if (iterPrice == 0) {
                revert("saleStage doesn't exist");
            }
            totalPrice += iterPrice;
            totalSupply += 1;
        }
        return totalPrice;
    }

    /**
     * @notice Method to purchase and get random available NFTs.
     */
    function _mintMultiple(address to, uint256 nfts) internal {
        require(totalSupply() < _maxTotalSupply, "Sale has already ended");
        require(nfts > 0, "nfts cannot be 0");
        require(totalSupply().add(nfts) <= _maxTotalSupply, "Exceeds _maxTotalSupply");

        for (uint256 i = 0; i < nfts; i++) {
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
        require(saleActive, "Sale is not active");
        require(nfts <= _maxPurchaseSize, "You can not buy more than maxPurchaseSize NFTs at once");
        require(getTotalPriceFor(nfts) == msg.value, "Ether value sent is not correct");
        emit Buy(msg.sender, nfts, referral);
        _vault.transfer(msg.value);
        _mintMultiple(msg.sender, nfts);
    }

    /**
     * @dev Pseudo-random index generator. Returns new free of owner token index.
     */
    function _getRandomAvailableIndex() internal view returns (uint256) {
        uint256 index = (uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp, /* solhint-disable not-rely-on-time */
                    gasleft(),
                    blockhash(block.number - 1)
                )
            )
        ) % _maxTotalSupply);
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
        require(_batches.length > 0, "getBatchByToken: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i].endTokenId || tokenId < _batches[i].startTokenId) {
                continue;
            } else {
                return _batches[i].rarity;
            }
        }
        return _defaultRarity;
    }

    /**
     * @dev Returns name of the NFT at index
     */
    function getName(uint256 index) public view returns (string memory) {
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
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
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
        if (_tokenSkill[index] == 0) {
            return _defaultSkill;
        }
        return _tokenSkill[index];
    }

    /**
     * @dev Returns DNA of the NFT at index
     */
    function getDna(uint256 index) public view returns (uint256) {
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
        return _tokenDna[index];
    }

    /**
     * @dev Starts sale
     */
    function start() public onlyRole(SALE_ADMIN_ROLE) {
        require(bytes(_defaultUri).length > 0, "_defaultUri is undefined");
        require(_vault != address(0), "Vault is undefined");
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
    function setName(uint256 index, string memory newName) public onlyRole(NAME_SETTER_ROLE) {
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
        _tokenName[index] = newName;
        emit NameChange(index, newName);
    }

    /**
     * @dev Change token skill
     */
    function setSkill(uint256 index, uint256 newSkill) public onlyRole(SKILL_SETTER_ROLE) {
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
        _tokenSkill[index] = newSkill;
        emit SkillChange(index, newSkill);
    }

    /**
     * @dev Change token DNA attribute
     */
    function setDna(uint256 index, uint256 newDna) public onlyRole(DNA_SETTER_ROLE) {
        require(index < _maxTotalSupply, "index < _maxTotalSupply");
        _tokenDna[index] = newDna;
        emit DnaChange(index, newDna);
    }

    /**
     * @dev Change max purchase size.
     */
    function setMaxPurchaseSize(uint256 newPurchaseSize) public onlyRole(MAX_PURCHASE_SIZE_SETTER_ROLE) {
        _maxPurchaseSize = newPurchaseSize;
    }

    /**
     * @dev Set defaultUri.
     */
    function setDefaultUri(string memory uri) public onlyRole(DEFAULT_URI_SETTER_ROLE) {
        _defaultUri = uri;
    }

    /**
     * @dev Change vault.
     */
    function setVault(address payable newVault) public onlyRole(VAULT_SETTER_ROLE) {
        _vault = newVault;
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
    function setDefaultName(string memory name) public onlyRole(DEFAULT_NAME_SETTER_ROLE) {
        _defaultName = name;
    }

    /**
     * @dev Set default skill.
     */
    function setDefaultSkill(uint256 skill) public onlyRole(DEFAULT_SKILL_SETTER_ROLE) {
        _defaultSkill = skill;
    }
}
