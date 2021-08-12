const { ethers } = require('hardhat');
const { expect } = require('chai');

contract('Collection Full test', function() {
  before(async function() {
    const accounts = await ethers.getSigners();
    this.provider = ethers.getDefaultProvider();
    this.deployer = accounts[0];
    this.CollectionArtifact = await ethers.getContractFactory('Collection');
  });
  beforeEach(async function() {
    this.collection = await this.CollectionArtifact.deploy();
  });

  it('totalSupply and maxTotalSupply are 0');

  it('add saleStage reverts if endToken == 0');

  it('add saleStage reverts if called by wrong role');

  context('after saleStage #0 added', function() {
    beforeEach(async function() {
      await this.collection.addSaleStage(9, 100);
    });

    it('check saleStage #0 available', async function() {
      expect(await this.collection.saleStagesLength()).to.equal('1');
      const saleStage = await this.collection.getSaleStage(0);
      expect(saleStage.startTokens).to.equal('0');
      expect(saleStage.endTokens).to.equal('9');
      expect(saleStage.weiPerToken).to.equal('100');
      await expect(this.collection.getSaleStage(1)).to.be.reverted;
    });

    context('then saleStage #1 added', function() {
      beforeEach(async function() {
        await this.collection.addSaleStage(19, 200);
      });

      it('both saleStages are visible', async function() {
        expect(await this.collection.saleStagesLength()).to.equal('2');
        // previously created stage is visible
        let saleStage = await this.collection.getSaleStage(0);
        expect(saleStage.startTokens).to.equal('0');
        expect(saleStage.endTokens).to.equal('9');
        expect(saleStage.weiPerToken).to.equal('100');
        // new stage is visible
        saleStage = await this.collection.getSaleStage(1);
        // fixme: token numbering in batches should be inclusive
        expect(saleStage.startTokens).to.equal('10');
        expect(saleStage.endTokens).to.equal('19');
        expect(saleStage.weiPerToken).to.equal('200');
        await expect(this.collection.getSaleStage(2)).to.be.reverted;
      });

      context('then remove saleStage #0', function() {
        beforeEach(async function() {
          // todo: need to impleent deleteSaleStage(...)
          // await this.collection.deleteSaleStage(0);
        });

        it('saleStages #0 got removed and #1 still there');

        it('addBatch reverts if called by wrong role');

        it('no batches before they added', async function() {
          expect(await this.collection.batchesLength()).to.equal(0);
          const batches = await this.collection.getBatches();
          expect(batches.length).to.equal(0);
        });

        context('add batch #0', function() {
          beforeEach(async function() {
            await this.collection.addBatch(10, 'ipfs://ipfs/batchX', 12);
          });

          it('batch is visible', async function() {
            expect(await this.collection.batchesLength()).to.equal(1);
            const batches = await this.collection.getBatches();
            expect(batches.length).to.equal(1);
            expect(batches[0].endId).to.equal(10);
            expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
            expect(batches[0].rarity).to.equal(12);
          });

          it('tokenURIs are correct', async function() {
            expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
            expect(await this.collection.tokenURI(9)).to.equal('ipfs://ipfs/batchX/9.json');
            // Error: VM Exception while processing transaction: revert getBatchByToken:
            // tokenId must be less then last token id in batches array
            // expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchX/10.json');
          });

          context('add batch #1', function() {
            beforeEach(async function() {
              await this.collection.addBatch(20, 'ipfs://ipfs/batchY', 23);
            });

            it('both batches are visible', async function() {
              expect(await this.collection.batchesLength()).to.equal(2);
              const batches = await this.collection.getBatches();
              expect(batches.length).to.equal(2);
              expect(batches[0].endId).to.equal(10);
              expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
              expect(batches[0].rarity).to.equal(12);
              expect(batches[1].endId).to.equal(20);
              expect(batches[1].baseURI).to.equal('ipfs://ipfs/batchY');
              expect(batches[1].rarity).to.equal(23);
            });

            it('tokenURIs are correct', async function() {
              expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
              expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchX/10.json');
              expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/batchY/11.json');
              // fixme: endId is not available
              // Error: VM Exception while processing transaction: revert getBatchByToken:
              // tokenId must be less then last token id in batches array
              // expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/batchY/19.json');
            });

            context('delete batch #0', function() {
              beforeEach(async function() {
                await this.collection.deleteBatch(0);
              });

              it('batch 0 should disappear and batches array should shorten', async function() {
                expect(await this.collection.batchesLength()).to.equal(1);
                const batches = await this.collection.getBatches();
                expect(batches.length).to.equal(1);
                expect(batches[0].endId).to.equal(20);
                expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchY');
                expect(batches[0].rarity).to.equal(23);
              });

              it('tokenURIs prevously served from removed batch now have batchY URI', async function() {
                expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchY/10.json');
                expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/batchY/11.json');
                // fixme: endId is not available
                // expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/batchY/19.json');
              });
            });
          });
        });
      });
    });
  });
});
