// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Collection is ERC721 {
    constructor() ERC721("CyberPunk", "CPN") {}
}