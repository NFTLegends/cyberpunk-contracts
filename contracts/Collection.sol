// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Collection is ERC721Enumerable {
    using SafeMath for uint256;

    struct SaleStage {
        uint256 endTokens;
        uint256 weiPerToken;
    }

    SaleStage[] internal _saleStages;
    // Maximum allowed tokenSupply boundary.
    // Can be extended by adding new batches
    uint256 internal _maxTotalSupply = 0;
    uint256 internal _maxPurchaseSize = 20;

    constructor() ERC721("CyberPunk", "CPN") {}

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
            require(totalSupply() < _maxTotalSupply, "Collection: maxSupply achieved");
        }
    }

    function saleStagesLength() public view returns (uint256) {
        return _saleStages.length;
    }

    function getSaleStage(uint256 saleStageIndex) public view returns (uint256 startTokens, uint256 endTokens, uint256 weiPerToken) {
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

    function addSaleStage(uint256 endTokens, uint256 weiPerToken) external {
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

    function setSaleStage(uint256 saleStageIndex, uint256 endTokens, uint256 weiPerToken) external {
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

    function buy(uint256 nfts) public payable {
        require(totalSupply() < _maxTotalSupply, "Sale has already ended");
        require(nfts > 0, "tokens cannot be 0");
        require(nfts <= _maxPurchaseSize, "You may not buy more than _maxPurchaseSize NFTs at once");
        require(totalSupply().add(nfts) <= _maxTotalSupply, "Exceeds MAX_NFT_SUPPLY");
        require(getTotalPriceFor(nfts) == msg.value, "Ether value sent is not correct");

        for (uint i = 0; i < nfts; i++) {
            uint mintIndex = totalSupply();
            _safeMint(msg.sender, mintIndex);
        }
    }
}
