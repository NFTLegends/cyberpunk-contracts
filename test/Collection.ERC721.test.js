const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require('./behaviors/ERC721.behavior');

const CollectionMock = artifacts.require('CollectionMock');

contract('Collection : ERC721', function (accounts) {
  const name = 'CyberPunk';
  const symbol = 'CPN';

  beforeEach(async function () {
    this.token = await CollectionMock.new();
    await this.token.addBatch(10, 'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a', 10);
  });

  shouldBehaveLikeERC721('ERC721', ...accounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
  shouldBehaveLikeERC721Enumerable('ERC721', ...accounts);
});
