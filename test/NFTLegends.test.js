const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require('./behaviors/ERC721.behavior');

const NFTLegendsMock = artifacts.require('NFTLegendsMock');

contract('NFTLegends', function (accounts) {
  const name = 'NFTLegends';
  const symbol = 'NFTL';

  beforeEach(async function () {
    this.token = await NFTLegendsMock.new();
  });

  shouldBehaveLikeERC721('ERC721', ...accounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
});
