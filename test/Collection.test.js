const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CollectionMock = artifacts.require('Collection');

contract('Collection : ERC721', function ([ deployer, others ]) {
  beforeEach(async function () {
    this.token = await CollectionMock.new();
  });

  context('Calculator test', function () {
    context('getSaleStage()', function () {
      it('reverts when there is no stages', async function () {
        await expectRevert(this.token.getSaleStage(0), 'getSaleStage: no stages');
      });
    });

    // context('addSaleStage()', function () {
    //   it('works when adding stages', async function () {
    //     let ans;

    //     await this.token.addSaleStage(1, 100);

    //     ans = await this.token.getSaleStage(0);
    //     expect(ans.startTokens).to.be.bignumber.equal('0');
    //     expect(ans.endTokens).to.be.bignumber.equal('1');
    //     expect(ans.weiPerToken).to.be.bignumber.equal('100');

    //     await this.token.addSaleStage(2, 200);

    //     ans = await this.token.getSaleStage(1);
    //     expect(ans.startTokens).to.be.bignumber.equal('1');
    //     expect(ans.endTokens).to.be.bignumber.equal('2');
    //     expect(ans.weiPerToken).to.be.bignumber.equal('200');

    //     await this.token.addSaleStage(3, 300);

    //     ans = await this.token.getSaleStage(2);
    //     expect(ans.startTokens).to.be.bignumber.equal('2');
    //     expect(ans.endTokens).to.be.bignumber.equal('3');
    //     expect(ans.weiPerToken).to.be.bignumber.equal('300');
    //   });

    //   it('reverts when trying to add stage with wrong endTokens', async function () {
    //     await expectRevert(
    //       this.token.addSaleStage(0, 100),
    //       'addSaleStage: first stage endTokens must be non-zero',
    //     );
    //     await this.token.addSaleStage(1, 100);

    //     await expectRevert(
    //       this.token.addSaleStage(1, 200),
    //       'addSaleStage: new endTokens must be more than current last',
    //     );
    //   });

    //   it('works when trying to add stage with wrong weiPerToken', async function () {
    //     await expectRevert(this.token.addSaleStage(0, 0), 'addSaleStage: weiPerToken must be non-zer');
    //   });

    //   it('reverts when trying to add from not sale stage manager', async function () {
    //     await expectRevert.unspecified(this.token.addSaleStage(0, 0, { from: others }));
    //   });
    // });

    // context('setSaleStage()', function () {
    //   it('works with correct params', async function () {
    //     await this.token.addSaleStage(1, 100);

    //     await this.token.setSaleStage(0, 5, 200);

    //     const ans = await this.token.getSaleStage(0);
    //     expect(ans.startTokens).to.be.bignumber.equal('0');
    //     expect(ans.endTokens).to.be.bignumber.equal('5');
    //     expect(ans.weiPerToken).to.be.bignumber.equal('200');
    //   });

    //   it('reverts when trying to set unexisting stage', async function () {
    //     await expectRevert(
    //       this.token.setSaleStage(0, 5, 200),
    //       'setSaleStage: saleStage with this index does not exist',
    //     );
    //   });

    //   it('reverts when trying to set wrong endTokens', async function () {
    //     await this.token.addSaleStage(1, 100);

    //     await expectRevert(
    //       this.token.setSaleStage(0, 0, 200),
    //       'setSaleStage: new endTokens must be more than in previous stage',
    //     );

    //     await this.token.addSaleStage(5, 100);
    //     await this.token.addSaleStage(10, 100);

    //     await expectRevert(
    //       this.token.setSaleStage(1, 1, 100),
    //       'setSaleStage: new endTokens must be more than in previous stage',
    //     );
    //     await expectRevert(
    //       this.token.setSaleStage(1, 10, 100),
    //       'setSaleStage: new endTokens must be less than in next stage',
    //     );
    //   });

    //   it('reverts when trying to set zero weiPerToken', async function () {
    //     await this.token.addSaleStage(1, 100);

    //     await expectRevert(this.token.setSaleStage(0, 1, 0), 'setSaleStage: weiPerToken must be non-zero');
    //   });

    //   it('reverts when trying to add from not sale stage manager', async function () {
    //     await this.token.addSaleStage(1, 100);

    //     await expectRevert.unspecified(this.token.setSaleStage(0, 1, 0, { from: others }));
    //   });
    // });

    // context('getTotalPriceFor()', function () {
    //   it('works', async function () {
    //     expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
    //     expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('0');

    //     await this.token.addSaleStage(1, 100);
    //     expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
    //     expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
    //     expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('100');

    //     await this.token.addSaleStage(2, 200);
    //     expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
    //     expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
    //     expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('300');
    //     expect(await this.token.getTotalPriceFor(3)).to.be.bignumber.equal('300');

    //     await this.token.addSaleStage(3, 300);
    //     expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
    //     expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
    //     expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('300');
    //     expect(await this.token.getTotalPriceFor(3)).to.be.bignumber.equal('600');
    //     expect(await this.token.getTotalPriceFor(4)).to.be.bignumber.equal('600');
    //     expect(await this.token.getTotalPriceFor(10)).to.be.bignumber.equal('600');
    //   });
    // });

    // context('buy()', function () {
    //   let price;

    //   beforeEach(async function () {
    //     await this.token.addSaleStage(10, 100);
    //   });

    //   it('works', async function () {
    //     price = await this.token.getTotalPriceFor(1);
    //     await this.token.buy(1, { value: price });
    //     expect(await this.token.totalSupply()).to.be.bignumber.equal('1');

    //     price = await this.token.getTotalPriceFor(2);
    //     await this.token.buy(2, { value: price });
    //     expect(await this.token.totalSupply()).to.be.bignumber.equal('3');
    //   });

    //   it('reverts when trying to buy after sale end', async function () {
    //     price = await this.token.getTotalPriceFor(10);
    //     await this.token.buy(10, { value: price });
    //     expect(await this.token.totalSupply()).to.be.bignumber.equal('10');

    //     await expectRevert(this.token.buy(10, { value: price }), 'buy: Sale has already ended');
    //   });

    //   it('reverts when trying to buy 0 nft', async function () {
    //     price = await this.token.getTotalPriceFor(1);
    //     await expectRevert(this.token.buy(0, { value: 0 }), 'buy: nfts cannot be 0');
    //   });

    //   it('reverts when trying to buy more than _maxPurchaseSize nft', async function () {
    //     price = await this.token.getTotalPriceFor(1);
    //     await expectRevert(
    //       this.token.buy(21, { value: 0 }),
    //       'buy: You can not buy more than _maxPurchaseSize NFTs at once',
    //     );
    //   });

    //   it('reverts when trying to buy nfts that exceeds totalSupply', async function () {
    //     price = await this.token.getTotalPriceFor(1);
    //     await expectRevert(this.token.buy(20, { value: 0 }), 'buy: Exceeds _maxTotalSupply');
    //   });

    //   it('reverts when send incorrect ETH value', async function () {
    //     price = await this.token.getTotalPriceFor(5);
    //     await expectRevert(this.token.buy(5, { value: 0 }), 'buy: Ether value sent is not correct');
    //   });
    // });

    context('getBatch()', function () {
      it('reverts when there is no bathes', async function () {
        await expectRevert(this.token.getBatch(0), 'getBatch: no batches');
      });
      it('works when return right baseURI', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        ans = await this.token.getBatch(0);
        expect(ans).equal('testBaseURI');
      });
      it('works when return right baseURI (second batch)', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        await this.token.addBatch(30, 'testBaseURI2');
        ans = await this.token.getBatch(20);
        expect(ans).equal('testBaseURI2');
      });
      it('works when tokenId greater then last token id in batches array', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        await this.token.addBatch(30, 'testBaseURI2');
        await expectRevert(this.token.getBatch(31),
          'getBatch: tokenId must be less then last token id in batches array',
        );
      });
    });

    context('addBatch()', function () {
      it('reverts when first batch endTokens is zero', async function () {
        await expectRevert(this.token.addBatch(0, 'testBaseURI'),
          'addBatch: batch endTokens must be non-zero',
        );
      });
      it('reverts when batchEndId greater than the endId of the last batch', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        await expectRevert(this.token.addBatch(10, 'testBaseURI2'),
          'batchEndId must be greater than the endId of the last batch',
        );
      });
    });
    context('deleteBatch()', function () {
      it('works when index out of batches length', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        await expectRevert(this.token.deleteBatch(2),
          "deleteBatch: index out of batches length",
        );
      });
      it('works when batch is deleted', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        ans = await this.token.getBatch(5);
        expect(ans).equal('testBaseURI');
        await this.token.deleteBatch(0);
        await expectRevert(this.token.getBatch(5),
          "getBatch: tokenId must be less then last token id in batches array",
        );
      });
    });
    context('tokenURI()', function () {
      it('works when tokenURI is returned', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        ans = await this.token.tokenURI(2);
        expect(ans).equal('testBaseURI/2.json');
      });
      it('works when tokenURI is returned 2', async function () {
        await this.token.addBatch(10, 'testBaseURI');
        await this.token.addBatch(20, 'testBaseURI2');
        ans = await this.token.tokenURI(12);
        expect(ans).equal('testBaseURI2/12.json');
      });
    });
  });
});
