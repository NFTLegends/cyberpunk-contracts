// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Collection is ERC721Enumerable {
    // Don't enforce the limits until batches added
    uint256 private constant _MAX_INT = 2**256 - 1;

    // Maximum allowed tokenSupply boundary.
    // Can be extended by adding new batches
    uint256 private _maxTotalSupply = _MAX_INT;

    constructor() ERC721("CyberPunk", "CPN") {}

    function maxTotalSupply() public view virtual returns (uint256) {
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
}
