pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTLegends is ERC721 {
    constructor() ERC721("NFTLegends", "NFTL") {}
}
