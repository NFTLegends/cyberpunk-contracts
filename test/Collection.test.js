/* eslint-disable max-len */
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const { expect } = require('chai');

const CollectionMock = artifacts.require('Collection');
const ERC721Mock = artifacts.require('CollectionMock');

contract('Collection : ERC721', function ([ deployer, others ]) {
  const token = new BN('1');
  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    this.owner = accounts[0];
    this.batchManagerAddress = accounts[1];
    this.saleAdminAddress = accounts[2];
    this.nameSetterAddress = accounts[3];
    this.skillSetterAddress = accounts[4];
    this.noRoleAddress = accounts[5];
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

      it('reverts when trying to add from not sale stage manager', async function () {
        await expectRevert.unspecified(this.token.addSaleStage(0, 0, { from: others }));
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

      it('reverts when trying to add from not sale stage manager', async function () {
        await this.token.addSaleStage(1, 100);

        await expectRevert.unspecified(this.token.setSaleStage(0, 1, 0, { from: others }));
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
      let price;

      beforeEach(async function () {
        await this.token.addSaleStage(10, 100);
      });

      it('works', async function () {
        price = await this.token.getTotalPriceFor(1);
        await this.token.buy(1, { value: price });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('1');

        price = await this.token.getTotalPriceFor(2);
        await this.token.buy(2, { value: price });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('3');
      });

      it('reverts when trying to buy after sale end', async function () {
        price = await this.token.getTotalPriceFor(10);
        await this.token.buy(10, { value: price });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('10');

        await expectRevert(this.token.buy(10, { value: price }), 'buy: Sale has already ended');
      });

      it('reverts when trying to buy 0 nft', async function () {
        price = await this.token.getTotalPriceFor(1);
        await expectRevert(this.token.buy(0, { value: 0 }), 'buy: nfts cannot be 0');
      });

      it('reverts when trying to buy more than _maxPurchaseSize nft', async function () {
        price = await this.token.getTotalPriceFor(1);
        await expectRevert(
          this.token.buy(21, { value: 0 }),
          'buy: You can not buy more than _maxPurchaseSize NFTs at once',
        );
      });

      it('reverts when trying to buy nfts that exceeds totalSupply', async function () {
        price = await this.token.getTotalPriceFor(1);
        await expectRevert(this.token.buy(20, { value: 0 }), 'buy: Exceeds _maxTotalSupply');
      });

      it('reverts when send incorrect ETH value', async function () {
        price = await this.token.getTotalPriceFor(5);
        await expectRevert(this.token.buy(5, { value: 0 }), 'buy: Ether value sent is not correct');
      });
    });

    context('getBatch()', function () {
      let ans;

      beforeEach(async function () {
        this.batchManagerRole = await this.token.BATCH_MANAGER_ROLE();
        await this.token.grantRole(this.batchManagerRole, this.batchManagerAddress.address);
      });

      it('reverts when there is no batches', async function () {
        await expectRevert(this.token.getBatch(0), 'getBatch: no batches');
      });
      it('revertsd when tokenId greater then last token id in batches array', async function () {
        await this.token.addBatch(10, 'testBaseURI', { from: this.batchManagerAddress.address });
        await this.token.addBatch(30, 'testBaseURI2', { from: this.batchManagerAddress.address });
        await expectRevert(this.token.getBatch(31),
          'getBatch: tokenId must be less then last token id in batches array',
        );
      });
      it('works when return right baseURI', async function () {
        await this.token.addBatch(10, 'testBaseURI', { from: this.batchManagerAddress.address });
        ans = await this.token.getBatch(0);
        expect(ans.baseURI).equal('testBaseURI');
      });
      it('works when return right baseURI (second batch)', async function () {
        await this.token.addBatch(10, 'testBaseURI', { from: this.batchManagerAddress.address });
        await this.token.addBatch(30, 'testBaseURI2', { from: this.batchManagerAddress.address });
        ans = await this.token.getBatch(20);
        expect(ans.baseURI).equal('testBaseURI2');
      });
    });

    context('addBatch()', function () {
      let ans, ans1, ans2;

      beforeEach(async function () {
        this.batchManagerRole = await this.token.BATCH_MANAGER_ROLE();
        await this.token.grantRole(this.batchManagerRole, this.batchManagerAddress.address);
      });

      it('deployer can add this batch', async function () {
        await this.token.addBatch(9,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.owner.address });
        ans1 = await this.token.getBatch(8);
        expect(ans1.baseURI).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a');
      });
      it('BATCH_MANAGER_ROLE can add the batch', async function () {
        await this.token.addBatch(9,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.batchManagerAddress.address });
        ans = await this.token.getBatch(0);
        expect(ans.baseURI).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a');
      });
      it('reverts without BATCH_MANAGER_ROLE', async function () {
        await expectRevert(this.token.addBatch(0,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.noRoleAddress.address }),
        'VM Exception while processing transaction: revert AccessControl',
        );
      });
      it('reverts when first batch endTokens is zero', async function () {
        await expectRevert(this.token.addBatch(0,
          'testBaseURI',
          { from: this.batchManagerAddress.address }),
        'addBatch: batch endTokens must be non-zero',
        );
      });
      it('reverts when batchEndId greater than the endId of the last batch', async function () {
        await this.token.addBatch(10,
          'testBaseURI',
          { from: this.batchManagerAddress.address });
        await expectRevert(this.token.addBatch(10,
          'testBaseURI2',
          { from: this.batchManagerAddress.address }),
        'batchEndId must be greater than the endId of the last batch',
        );
      });
      it('works when batch is added', async function () {
        await this.token.addBatch(10,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.batchManagerAddress.address });
        ans = await this.token.getBatch(0);
        expect(ans.baseURI).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a');
      });
      it('works when batch is added (few batches)', async function () {
        await this.token.addBatch(10,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.batchManagerAddress.address });
        ans1 = await this.token.getBatch(0);
        expect(ans1.baseURI).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a');

        await this.token.addBatch(20,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.batchManagerAddress.address });
        ans2 = await this.token.getBatch(11);
        expect(ans2.baseURI).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a');
      });
    });

    context('deleteBatch()', function () {
      beforeEach(async function () {
        this.batchManagerRole = await this.token.BATCH_MANAGER_ROLE();
        await this.token.grantRole(this.batchManagerRole, this.batchManagerAddress.address);
        await this.token.addBatch(10,
          'https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3',
          { from: this.batchManagerAddress.address });
      });

      it('deployer can delete this batch', async function () {
        await this.token.deleteBatch(0, { from: this.owner.address });
        await expectRevert(this.token.getBatch(5),
          'getBatch: tokenId must be less then last token id in batches array',
        );
      });

      it('BATCH_MANAGER_ROLE can delete the batch', async function () {
        await this.token.deleteBatch(0, { from: this.batchManagerAddress.address });
        await expectRevert(this.token.getBatch(5),
          'getBatch: tokenId must be less then last token id in batches array',
        );
      });
      it('reverts then delete batch without BATCH_MANAGER_ROLE', async function () {
        await expectRevert(this.token.deleteBatch(0, { from: this.noRoleAddress.address }),
          'VM Exception while processing transaction: revert AccessControl',
        );
      });

      it('works when index out of batches length', async function () {
        await expectRevert(this.token.deleteBatch(2, { from: this.batchManagerAddress.address }),
          'deleteBatch: index out of batches length',
        );
      });
    });

    context('tokenURI()', function () {
      let ans;

      beforeEach(async function () {
        this.batchManagerRole = await this.token.BATCH_MANAGER_ROLE();
        await this.token.grantRole(this.batchManagerRole, this.batchManagerAddress.address);
        await this.token.addBatch(9,
          'https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3',
          { from: this.batchManagerAddress.address });
      });

      it('works when tokenURI is returned', async function () {
        ans = await this.token.tokenURI(0);
        expect(ans).equal('https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3/0.json');
      });
      it('works when tokenURI is returned (few tokens)', async function () {
        await this.token.addBatch(19,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          { from: this.batchManagerAddress.address });
        ans = await this.token.tokenURI(17);
        expect(ans).equal('https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a/17.json');
      });
      it('works when tokenURI is returned (10 batches)', async function () {
        await this.token.addBatch(19,
          'https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(29,
          'https://ipfs.io/ipfs/QmRhtAr9cexKezrd17iTL8DLm9ue8JkQcKwU59Ki7ntZSM',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(39,
          'https://ipfs.io/ipfs/QmZxqcENyJVVywUj6kNpiGhY7upXsMWQTAB67fEqPVUmVx',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(49,
          'https://ipfs.io/ipfs/QmZAdGuo5DTjqEXWL9Xyi3cooeScwTgTaZQiGcWAwRyjX5',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(59,
          'https://ipfs.io/ipfs/QmeTbDTpz5DZNzbM3a6TKK7srF8rAYFGxrqdiNQNqk57wR',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(69,
          'https://ipfs.io/ipfs/QmNcQmj1AbcLz16YqfRRJtWfnSVsAuBJnkzFifamHHbzqs',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(79,
          'https://ipfs.io/ipfs/Qmcq57emNzG99Efhi9EFT7JKMhWEAjxHU3PYRTYhDRsC6S',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(89,
          'https://ipfs.io/ipfs/QmZXWVccpzk8vQAcd4yRndPMdNpaDWEGXdMeFBYFe8xrpY',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(99,
          'https://ipfs.io/ipfs/QmeCWYEJjg962DhAJGGqerL25dtZ98GwhfwMequ4jmixX2',
          { from: this.batchManagerAddress.address });
        ans = await this.token.tokenURI(0);
        expect(ans).equal('https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3/0.json');
        ans = await this.token.tokenURI(10);
        expect(ans).equal('https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7/10.json');
        ans = await this.token.tokenURI(20);
        expect(ans).equal('https://ipfs.io/ipfs/QmRhtAr9cexKezrd17iTL8DLm9ue8JkQcKwU59Ki7ntZSM/20.json');
        ans = await this.token.tokenURI(30);
        expect(ans).equal('https://ipfs.io/ipfs/QmZxqcENyJVVywUj6kNpiGhY7upXsMWQTAB67fEqPVUmVx/30.json');
        ans = await this.token.tokenURI(40);
        expect(ans).equal('https://ipfs.io/ipfs/QmZAdGuo5DTjqEXWL9Xyi3cooeScwTgTaZQiGcWAwRyjX5/40.json');
        ans = await this.token.tokenURI(50);
        expect(ans).equal('https://ipfs.io/ipfs/QmeTbDTpz5DZNzbM3a6TKK7srF8rAYFGxrqdiNQNqk57wR/50.json');
        ans = await this.token.tokenURI(60);
        expect(ans).equal('https://ipfs.io/ipfs/QmNcQmj1AbcLz16YqfRRJtWfnSVsAuBJnkzFifamHHbzqs/60.json');
        ans = await this.token.tokenURI(70);
        expect(ans).equal('https://ipfs.io/ipfs/Qmcq57emNzG99Efhi9EFT7JKMhWEAjxHU3PYRTYhDRsC6S/70.json');
        ans = await this.token.tokenURI(80);
        expect(ans).equal('https://ipfs.io/ipfs/QmZXWVccpzk8vQAcd4yRndPMdNpaDWEGXdMeFBYFe8xrpY/80.json');
        ans = await this.token.tokenURI(90);
        expect(ans).equal('https://ipfs.io/ipfs/QmeCWYEJjg962DhAJGGqerL25dtZ98GwhfwMequ4jmixX2/90.json');
      });
      it('works when tokenURI is returned (few tokens in few batches)', async function () {
        await this.token.addBatch(19,
          'https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7',
          { from: this.batchManagerAddress.address });
        await this.token.addBatch(29,
          'https://ipfs.io/ipfs/QmRhtAr9cexKezrd17iTL8DLm9ue8JkQcKwU59Ki7ntZSM',
          { from: this.batchManagerAddress.address });
        ans = await this.token.tokenURI(0);
        expect(ans).equal('https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3/0.json');
        ans = await this.token.tokenURI(1);
        expect(ans).equal('https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3/1.json');
        ans = await this.token.tokenURI(2);
        expect(ans).equal('https://ipfs.io/ipfs/QmXkzp3EvcqnTPsHstwc89C91S64YAbBQotrgq8atLzHT3/2.json');
        ans = await this.token.tokenURI(10);
        expect(ans).equal('https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7/10.json');
        ans = await this.token.tokenURI(11);
        expect(ans).equal('https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7/11.json');
        ans = await this.token.tokenURI(12);
        expect(ans).equal('https://ipfs.io/ipfs/QmWADyUFUzVfcXPBfxVNceKExb4Veitt5Cy5ynMLVoeTF7/12.json');
      });
    });
  });

  describe('with Admin role', function () {
    beforeEach(async function () {
      this.saleAdminRole = await this.token.SALE_ADMIN_ROLE();
      await this.token.grantRole(this.saleAdminRole, this.saleAdminAddress.address);
    });
    it('start sale', async function () {
      expect(await this.token.start({ from: this.saleAdminAddress.address }));
      const active = await this.token.saleActive();
      expect(active).equal(true);
    });
    it('stop sale', async function () {
      expect(await this.token.stop({ from: this.saleAdminAddress.address }));
      const active = await this.token.saleActive();
      expect(active).equal(false);
    });
  });

  describe('without Admin role, start and stop should revert', function () {
    it('exception', async function () {
      await expectRevert(
        this.token.start({ from: this.noRoleAddress.address }),
        'VM Exception while processing transaction: revert AccessControl');
      await expectRevert(
        this.token.stop({ from: this.noRoleAddress.address }),
        'VM Exception while processing transaction: revert AccessControl');
    });
  });

  describe('deployer has SALE_ADMIN_ROLE', function () {
    it('start sale', async function () {
      expect(await this.token.start({ from: this.owner.address }));
      const active = await this.token.saleActive();
      expect(active).equal(true);
    });
    it('stop sale', async function () {
      expect(await this.token.stop({ from: this.owner.address }));
      const active = await this.token.saleActive();
      expect(active).equal(false);
    });
  });

  describe('setName', function () {
    const newName = 'Abraham Lincoln';
    beforeEach(async function () {
      this.token = await ERC721Mock.new();
      this.nameSetRole = await this.token.NAME_SETTER_ROLE();
      await this.token.grantRole(this.nameSetRole, this.nameSetterAddress.address);
      await this.token.mint(this.nameSetterAddress.address, token);
    });
    it('deployer has NAME_SETTER_ROLE', async function () {
      expectEvent(await this.token.setName(0, newName, { from: this.owner.address }), 'NameChange', { index: '0', newName: newName });
      expect(await this.token.getName(0)).to.be.bignumber.equal(newName);
    });
    it('NAME_SETTER_ROLE can change the name', async function () {
      expectEvent(await this.token.setName(0, newName, { from: this.nameSetterAddress.address }), 'NameChange', { index: '0', newName: newName });
      expect(await this.token.getName(0)).to.be.bignumber.equal(newName);
    });
    it('reverts without NAME_SETTER_ROLE', async function () {
      await expectRevert(
        this.token.setName(0, newName, { from: this.noRoleAddress.address }),
        'VM Exception while processing transaction: revert AccessControl',
      );
    });
  });

  describe('setSkill', function () {
    const newSkill = new BN(20);
    beforeEach(async function () {
      this.token = await ERC721Mock.new();
      this.skillSetRole = await this.token.SKILL_SETTER_ROLE();
      await this.token.grantRole(this.skillSetRole, this.skillSetterAddress.address);
      await this.token.mint(this.skillSetterAddress.address, token);
    });
    it('deployer has SKILL_SETTER_ROLE', async function () {
      expectEvent(await this.token.setSkill(0, newSkill, { from: this.owner.address }), 'SkillChange', { index: '0', newSkill: newSkill });
      expect(await this.token.getSkill(0)).to.be.bignumber.equal(newSkill);
    });
    it('SKILL_SETTER_ROLE can change the skill', async function () {
      expectEvent(await this.token.setSkill(0, newSkill, { from: this.skillSetterAddress.address }), 'SkillChange', { index: '0', newSkill: newSkill });
      expect(await this.token.getSkill(0)).to.be.bignumber.equal(newSkill);
    });
    it('reverts without SKILL_SETTER_ROLE', async function () {
      await expectRevert(
        this.token.setSkill(0, newSkill, { from: this.noRoleAddress.address }),
        'VM Exception while processing transaction: revert AccessControl',
      );
    });
  });
});
