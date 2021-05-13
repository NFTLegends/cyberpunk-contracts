const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CollectionMock = artifacts.require('Collection');

contract('Collection : ERC721', function (accounts) {
  beforeEach(async function () {
    this.token = await CollectionMock.new();
  });

  context('Calculator test', function () {
    context('getSaleStage()', function () {
      it('reverts when there is no stages', async function () {
        await expectRevert(this.token.getSaleStage(0), 'getSaleStage: no stages');
      });
    });

    context('addSaleStage()', function () {
      it('works when adding stages', async function () {
        let ans;

        await this.token.addSaleStage(1, 100);

        ans = await this.token.getSaleStage(0);
        expect(ans.startTokens).to.be.bignumber.equal('0');
        expect(ans.endTokens).to.be.bignumber.equal('1');
        expect(ans.weiPerToken).to.be.bignumber.equal('100');

        await this.token.addSaleStage(2, 200);

        ans = await this.token.getSaleStage(1);
        expect(ans.startTokens).to.be.bignumber.equal('1');
        expect(ans.endTokens).to.be.bignumber.equal('2');
        expect(ans.weiPerToken).to.be.bignumber.equal('200');

        await this.token.addSaleStage(3, 300);

        ans = await this.token.getSaleStage(2);
        expect(ans.startTokens).to.be.bignumber.equal('2');
        expect(ans.endTokens).to.be.bignumber.equal('3');
        expect(ans.weiPerToken).to.be.bignumber.equal('300');
      });

      it('reverts when trying to add stage with wrong endTokens', async function () {
        await expectRevert(
          this.token.addSaleStage(0, 100),
          'addSaleStage: first stage endTokens must be non-zero',
        );
        await this.token.addSaleStage(1, 100);

        await expectRevert(
          this.token.addSaleStage(1, 200),
          'addSaleStage: new endTokens must be more than current last',
        );
      });

      it('works when trying to add stage with wrong weiPerToken', async function () {
        await expectRevert(this.token.addSaleStage(0, 0), 'addSaleStage: weiPerToken must be non-zer');
      });
    });

    context('setSaleStage()', function () {
      it('works with correct params', async function () {
        await this.token.addSaleStage(1, 100);

        await this.token.setSaleStage(0, 5, 200);

        const ans = await this.token.getSaleStage(0);
        expect(ans.startTokens).to.be.bignumber.equal('0');
        expect(ans.endTokens).to.be.bignumber.equal('5');
        expect(ans.weiPerToken).to.be.bignumber.equal('200');
      });

      it('reverts when trying to set unexisting stage', async function () {
        await expectRevert(
          this.token.setSaleStage(0, 5, 200),
          'setSaleStage: saleStage with this index does not exist',
        );
      });

      it('reverts when trying to set wrong endTokens', async function () {
        await this.token.addSaleStage(1, 100);

        await expectRevert(
          this.token.setSaleStage(0, 0, 200),
          'setSaleStage: new endTokens must be more than in previous stage',
        );

        await this.token.addSaleStage(5, 100);
        await this.token.addSaleStage(10, 100);

        await expectRevert(
          this.token.setSaleStage(1, 1, 100),
          'setSaleStage: new endTokens must be more than in previous stage',
        );
        await expectRevert(
          this.token.setSaleStage(1, 10, 100),
          'setSaleStage: new endTokens must be less than in next stage',
        );
      });

      it('reverts when trying to set zero weiPerToken', async function () {
        await this.token.addSaleStage(1, 100);

        await expectRevert(this.token.setSaleStage(0, 1, 0), 'setSaleStage: weiPerToken must be non-zero');
      });
    });

    context('getTotalPriceFor()', function () {
      it('works', async function () {
        expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
        expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('0');

        await this.token.addSaleStage(1, 100);
        expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
        expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
        expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('100');

        await this.token.addSaleStage(2, 200);
        expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
        expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
        expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('300');
        expect(await this.token.getTotalPriceFor(3)).to.be.bignumber.equal('300');

        await this.token.addSaleStage(3, 300);
        expect(await this.token.getTotalPriceFor(0)).to.be.bignumber.equal('0');
        expect(await this.token.getTotalPriceFor(1)).to.be.bignumber.equal('100');
        expect(await this.token.getTotalPriceFor(2)).to.be.bignumber.equal('300');
        expect(await this.token.getTotalPriceFor(3)).to.be.bignumber.equal('600');
        expect(await this.token.getTotalPriceFor(4)).to.be.bignumber.equal('600');
        expect(await this.token.getTotalPriceFor(10)).to.be.bignumber.equal('600');
      });
    });

    context('buy()', function () {
      it('works', async function () {
        await this.token.addSaleStage(10, 100);

        let price;

        price = await this.token.getTotalPriceFor(1);
        await this.token.buy(1, { value: price });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('1');

        price = await this.token.getTotalPriceFor(2);
        await this.token.buy(2, { value: price });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('3');
      });
    });
  });
});
