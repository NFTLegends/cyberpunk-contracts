// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collection is ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable {
    event NameChange(uint256 indexed index, string newName);
    event SkillChange(uint256 indexed index, uint256 newSkill);
    event DnaChange(uint256 indexed index, uint256 newDna);
    event Buy(address indexed _from, uint256 nfts, address referral);

    mapping(uint256 => string) private _tokenName;
    mapping(uint256 => uint256) private _tokenSkill;
    mapping(uint256 => uint256) private _tokenDna;

    bool public saleActive;

    using SafeMath for uint256;
    using Strings for uint256;

    // Sale Stage Info struct
    struct SaleStage {
        uint256 startSaleTokenId;
        uint256 endSaleTokenId;
        uint256 weiPerToken;
    }

    struct Batch {
        uint256 startBatchTokenId;
        uint256 endBatchTokenId;
        string baseURI;
        uint256 rarity;
    }

    // Array of heroes batches
    Batch[] internal _batches;
    // Array of sale stages
    SaleStage[] internal _saleStages;
    // Maximum allowed tokenSupply boundary. Can be extended by adding new stages.
    uint256 internal _maxTotalSupply;
    // Max NFTs that can be bought at once.
    uint256 public maxPurchaseSize;

    string internal _defaultUri;
    uint256 internal _defaultRarity;
    string internal _defaultName;
    uint256 internal _defaultSkill;
    // Role with add & set sale stages permissions
    bytes32 public constant NAME_SETTER_ROLE = keccak256("NAME_SETTER_ROLE");
    bytes32 public constant SKILL_SETTER_ROLE = keccak256("SKILL_SETTER_ROLE");
    bytes32 public constant DNA_SETTER_ROLE = keccak256("DNA_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address payable public vault;

    function initialize() public initializer {
        __ERC721_init("CyberPunk", "A-12");
        __ERC721Enumerable_init();
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(NAME_SETTER_ROLE, _msgSender());
        _setupRole(SKILL_SETTER_ROLE, _msgSender());
        _setupRole(DNA_SETTER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        maxPurchaseSize = 20;
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
        require(saleStageIndex < _saleStages.length, "Id must be < sale stages length");

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
        require(batchIndex < _batches.length, "Id must be < batch length");

        return _batches[batchIndex];
    }

    /**
     * @notice Return token batch URI
     */
    function getBatchByToken(uint256 tokenId) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatchByToken: no batches");

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i].endBatchTokenId || tokenId < _batches[i].startBatchTokenId) {
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
            if (tokenId > _batches[i].endBatchTokenId || tokenId < _batches[i].startBatchTokenId) {
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
    function addBatch(
        uint256 startTokenId,
        uint256 endTokenId,
        string memory baseURI,
        uint256 rarity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _batchesLength = _batches.length;

        require(startTokenId <= endTokenId, "startId must be <= than EndId");
        if (_batchesLength > 0) {
            for (uint256 _batchId; _batchId < _batchesLength; _batchId++) {
                // if both bounds are lower or higher than iter batch
                if (
                    (startTokenId < _batches[_batchId].startBatchTokenId &&
                        endTokenId < _batches[_batchId].startBatchTokenId) ||
                    (startTokenId > _batches[_batchId].endBatchTokenId &&
                        endTokenId > _batches[_batchId].endBatchTokenId)
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _batchesLength = _batches.length;
        require(_batchesLength > 0, "setBatch: batches is empty");
        require(batchStartId <= batchEndId, "startId must be <= than EndId");

        for (uint256 _batchId; _batchId < _batchesLength; _batchId++) {
            if (_batchId == batchIndex) {
                continue;
            } else {
                // if both bounds are lower or higher than iter batch
                if (
                    (batchStartId < _batches[_batchId].startBatchTokenId &&
                        batchEndId < _batches[_batchId].startBatchTokenId) ||
                    (batchStartId > _batches[_batchId].endBatchTokenId &&
                        batchEndId > _batches[_batchId].endBatchTokenId)
                ) {
                    continue;
                } else {
                    revert("batches intersect");
                }
            }
        }

        _batches[batchIndex].startBatchTokenId = batchStartId;
        _batches[batchIndex].endBatchTokenId = batchEndId;
        _batches[batchIndex].baseURI = baseURI;
        _batches[batchIndex].rarity = rarity;
    }

    /**
     * @notice Removes batch at the given index
     */
    function deleteBatch(uint256 batchIndex) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(startTokenId <= endTokenId, "startId must be <= than EndId");
        require(weiPerToken > 0, "weiPerToken must be non-zero");
        uint256 _saleStagesLength = _saleStages.length;

        if (_saleStagesLength > 0) {
            for (uint256 _saleStageId; _saleStageId < _saleStagesLength; _saleStageId++) {
                // if both bounds are lower or higher than iter sale stage
                if (
                    (startTokenId < _saleStages[_saleStageId].startSaleTokenId &&
                        endTokenId < _saleStages[_saleStageId].startSaleTokenId) ||
                    (startTokenId > _saleStages[_saleStageId].endSaleTokenId &&
                        endTokenId > _saleStages[_saleStageId].endSaleTokenId)
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _saleStagesLength = _saleStages.length;
        require(_saleStagesLength > 0, "batches is empty");
        require(startTokenId <= saleStageEndId, "startId must be <= than EndId");
        for (uint256 _staleSaleId; _staleSaleId < _saleStagesLength; _staleSaleId++) {
            if (_staleSaleId == saleStageId) {
                continue;
            } else {
                // if both bounds are lower or higher than iter sale stage
                if (
                    (startTokenId < _saleStages[_staleSaleId].startSaleTokenId &&
                        saleStageEndId < _saleStages[_staleSaleId].startSaleTokenId) ||
                    (startTokenId > _saleStages[_staleSaleId].endSaleTokenId &&
                        saleStageEndId > _saleStages[_staleSaleId].endSaleTokenId)
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
            (_saleStage.endSaleTokenId - _saleStage.startSaleTokenId + 1) +
            (saleStageEndId - startTokenId + 1);

        _saleStages[saleStageId].startSaleTokenId = startTokenId;
        _saleStages[saleStageId].endSaleTokenId = saleStageEndId;
        _saleStages[saleStageId].weiPerToken = weiPerToken;
    }

    function deleteSaleStage(uint256 saleStageIndex) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_saleStages.length > saleStageIndex, "index out of sale stage length");
        SaleStage memory _saleStage = _saleStages[saleStageIndex];
        _maxTotalSupply -= _saleStage.endSaleTokenId - _saleStage.startSaleTokenId + 1;

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
                if (totalSupply > saleStage.endSaleTokenId || totalSupply < saleStage.startSaleTokenId) continue;
                iterPrice += saleStage.weiPerToken;
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
        require(nfts <= maxPurchaseSize, "Can not buy > maxPurchaseSize");
        require(getTotalPriceFor(nfts) == msg.value, "Ether value sent is not correct");
        emit Buy(msg.sender, nfts, referral);
        vault.transfer(msg.value);
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
            if (tokenId > _batches[i].endBatchTokenId || tokenId < _batches[i].startBatchTokenId) {
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
    function start() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(_defaultUri).length > 0, "_defaultUri is undefined");
        require(vault != address(0), "Vault is undefined");
        saleActive = true;
    }

    /**
     * @dev Stops sale
     */
    function stop() public onlyRole(DEFAULT_ADMIN_ROLE) {
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
    function setMaxPurchaseSize(uint256 newPurchaseSize) public onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPurchaseSize = newPurchaseSize;
    }

    /**
     * @dev Set defaultUri.
     */
    function setDefaultUri(string memory uri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _defaultUri = uri;
    }

    /**
     * @dev Change vault.
     */
    function setVault(address payable newVault) public onlyRole(DEFAULT_ADMIN_ROLE) {
        vault = newVault;
    }

    /**
     * @dev Set defaultRarity.
     */
    function setDefaultRarity(uint256 rarity) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _defaultRarity = rarity;
    }

    /**
     * @dev Set default name.
     */
    function setDefaultName(string memory name) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _defaultName = name;
    }

    /**
     * @dev Set default skill.
     */
    function setDefaultSkill(uint256 skill) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _defaultSkill = skill;
    }
}
