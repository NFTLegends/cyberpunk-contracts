// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collection is ERC721Enumerable, AccessControl {
    event NameChange (uint256 indexed index, string newName);
    event SkillChange (uint256 indexed index, uint256 newSkill);
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
        uint256 endId;
        string baseURI;
    }

    // Array of heroes batches
    Batch[] internal _batches;
    // Array of sale stages
    SaleStage[] internal _saleStages;
    // Maximum allowed tokenSupply boundary. Can be extended by adding new stages.
    uint256 internal _maxTotalSupply = 0;
    // Max NFTs that can be bought at once.
    uint256 internal _maxPurchaseSize = 20;
    // Role with add & set sale stages permissions
    bytes32 public constant SALE_STAGES_MANAGER_ROLE = keccak256("SALE_STAGES_MANAGER_ROLE");
    // Role with add & delete permissions
    bytes32 public constant BATCH_MANAGER_ROLE = keccak256("BATCH_MANAGER_ROLE");
    bytes32 public constant SALE_ADMIN_ROLE = keccak256("SALE_ADMIN_ROLE");
    bytes32 public constant NAME_SETTER_ROLE = keccak256("NAME_SETTER_ROLE");
    bytes32 public constant SKILL_SETTER_ROLE = keccak256("SKILL_SETTER_ROLE");

    constructor() ERC721("CyberPunk", "CPN") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SALE_STAGES_MANAGER_ROLE, _msgSender());
        _setupRole(BATCH_MANAGER_ROLE, _msgSender());
        _setupRole(SALE_ADMIN_ROLE, _msgSender());
        _setupRole(NAME_SETTER_ROLE, _msgSender());
        _setupRole(SKILL_SETTER_ROLE, _msgSender());
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
     * @notice Return token batch URI
     */
    function getBatch(uint256 tokenId) public view returns (Batch memory) {
        require(_batches.length > 0, "getBatch: no batches");
        require(
            tokenId < _batches[_batches.length - 1].endId,
            "getBatch: tokenId must be less then last token id in batches array"
        );

        for (uint256 i; i < _batches.length; i++) {
            if (tokenId > _batches[i].endId) {
                continue;
            } else {
                return _batches[i];
            }
        }
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
        string memory baseURI = getBatch(tokenId).baseURI;

        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(baseURI, "/", tokenId.toString(), ".json")
                )
                : "";
    }

    /**
     * @notice Add tokens batch to batches array
     */
    function addBatch(uint256 batchEndId, string memory baseURI)
    external
    onlyRole(BATCH_MANAGER_ROLE)
        {
        uint256 batchesLength = _batches.length;

        require(batchEndId > 0, "addBatch: batch endTokens must be non-zero");
        if (batchesLength > 0) {
            require(
                batchEndId > _batches[batchesLength - 1].endId,
                "addBatch: batchEndId must be greater than the endId of the last batch"
            );
        }

        _batches.push(Batch(batchEndId, baseURI));
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
        delete _batches[batchIndex];
    }

    /**
     * @notice Adds new sale stage with given params at the end of `saleStages array`.
     */
    function addSaleStage(uint256 endTokens, uint256 weiPerToken)
        external
        onlyRole(SALE_STAGES_MANAGER_ROLE)
    {
        require(weiPerToken > 0, "addSaleStage: weiPerToken must be non-zero");
        uint256 saleStagesLength = _saleStages.length;
        if (0 == saleStagesLength) {
            require(endTokens > 0, "addSaleStage: first stage endTokens must be non-zero");
        }
        else {
            (,uint256 currentSaleStageEndTokens,) = getSaleStage(saleStagesLength.sub(1));
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
        uint256 saleStagesLength = _saleStages.length;
        require(saleStageIndex < saleStagesLength, "setSaleStage: saleStage with this index does not exist");
        require(weiPerToken > 0, "setSaleStage: weiPerToken must be non-zero");

        (uint256 previousSaleStageEndTokens,,) = getSaleStage(saleStageIndex);
        require(endTokens > previousSaleStageEndTokens, "setSaleStage: new endTokens must be more than in previous stage");

        if (saleStageIndex.add(1) < saleStagesLength) {
            (,uint256 nextSaleStageEndTokens,) = getSaleStage(saleStageIndex.add(1));
            require(endTokens > nextSaleStageEndTokens, "setSaleStage: new endTokens must be less than in next stage");
        }

        _saleStages[saleStageIndex] = SaleStage(endTokens, weiPerToken);
    }

    /**
     * @notice Returns summary price for given number of tokens.
     */
    function getTotalPriceFor(uint256 tokens) public view returns (uint256) {
        uint256 saleStagesLength = _saleStages.length;
        uint256 totalSupply = totalSupply();
        uint256 tokensLeft = tokens;

        uint256 totalPrice = 0;
        uint256 tokensDiff;

        SaleStage memory saleStage;
        for (uint256 i = 0; i < saleStagesLength; i++) {
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
    function buy(uint256 nfts) public payable {
        require(totalSupply() < _maxTotalSupply, "buy: Sale has already ended");
        require(nfts > 0, "buy: nfts cannot be 0");
        require(nfts <= _maxPurchaseSize, "buy: You can not buy more than _maxPurchaseSize NFTs at once");
        require(totalSupply().add(nfts) <= _maxTotalSupply, "buy: Exceeds _maxTotalSupply");
        require(getTotalPriceFor(nfts) == msg.value, "buy: Ether value sent is not correct");

        for (uint i = 0; i < nfts; i++) {
            uint256 mintIndex = _getRandomAvailableIndex();
            _safeMint(msg.sender, mintIndex);
        }
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
     * @dev Returns name of the NFT at index
     */
    function getName(uint256 index) public view returns (string memory) {
        return _tokenName[index];
    }

    /**
     * @dev Returns skill of the NFT at index
     */
    function getSkill(uint256 index) public view returns (uint256) {
                return _tokenSkill[index];
    }

    /**
     * @dev Starts sale
     */
    function start() public onlyRole(SALE_ADMIN_ROLE) {
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
}
