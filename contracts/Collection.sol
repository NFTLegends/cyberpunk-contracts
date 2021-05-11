// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Collection is ERC721Enumerable {
    constructor() ERC721("CyberPunk", "CPN") {}
}
