const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require('./behaviors/ERC721.behavior');

const CollectionMock = artifacts.require('CollectionMock');

contract('Collection : ERC721', function (accounts) {
  const name = 'CyberPunk';
  const symbol = 'CPN';

  beforeEach(async function () {
    this.token = await CollectionMock.new();
  });

  shouldBehaveLikeERC721('ERC721', ...accounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
});
