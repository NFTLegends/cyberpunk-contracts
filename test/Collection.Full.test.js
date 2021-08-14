const { ethers } = require('hardhat');
const { expect } = require('chai');

contract('Collection Full test', function() {
  before(async function() {
    const accounts = await ethers.getSigners();
    this.provider = ethers.getDefaultProvider();
    this.deployer = accounts[0];
    this.vault = accounts[1];
    this.other = accounts[2];
    this.buyer = accounts[3];
    this.referral = accounts[4];
    this.CollectionArtifact = await ethers.getContractFactory('Collection');
  });
  beforeEach(async function() {
    this.collection = await this.CollectionArtifact.deploy();
  });

  context('set defaultRarity and defaultUri', function() {
    let price;
    beforeEach(async function() {
      await this.collection.setDefaultRarity(1);
      await this.collection.setDefaultUri('ipfs://ipfs/defaultUri');
    });

    it('start and buy should revert if vault not set', async function() {
      await expect(this.collection.start())
        .to.be.revertedWith('VM Exception while processing transaction: revert start: Vault is undefined');
      price = await this.collection.getTotalPriceFor(1);
      await expect(this.collection.connect(this.buyer).buy(1, this.referral.address, { value: price }))
        .to.be.revertedWith('VM Exception while processing transaction: revert buy: Vault is undefined');
    });

    context('after vault address set', function() {
      beforeEach(async function() {
        await this.collection.setVault(this.vault.address);
      });

      it('return defaultUri on try get token with more than max id', async function() {
        await this.collection.addBatch(19,
          'ipfs://ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a', 88);
        const batch = await this.collection.tokenURI(20);
        expect(batch).equal('ipfs://ipfs/defaultUri');
      });

      it('reverts when adding stage with wrong price', async function() {
        await expect(this.collection.addSaleStage(1, 0))
          .to.be.revertedWith('addSaleStage: weiPerToken must be non-zero');
      });

      context('add batch #0', function() {
        beforeEach(async function() {
          expect(await this.collection.batchesLength()).to.equal(0);
          const batches = await this.collection.getBatches();
          expect(batches.length).to.equal(0);
          await this.collection.addBatch(10, 'ipfs://ipfs/batchX', 12);
        });

        it('batch #0 is visible', async function() {
          expect(await this.collection.batchesLength()).to.equal(1);
          const batches = await this.collection.getBatches();
          expect(batches.length).to.equal(1);
          expect(batches[0].endId).to.equal(10);
          expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
          expect(batches[0].rarity).to.equal(12);
        });

        it('tokens from batch have batch-based rarity and URIs', async function() {
          expect(await this.collection.getRarity(0)).to.equal(12);
          expect(await this.collection.getRarity(9)).to.equal(12);
          expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
          expect(await this.collection.tokenURI(9)).to.equal('ipfs://ipfs/batchX/9.json');
        });

        it('tokens that don\'t match the batch have default rarity', async function() {
          expect(await this.collection.getRarity(999)).to.equal(1);
        });

        context('then add batch #1', function() {
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
            await expect(this.collection.getBatchByToken(20))
              .to.be.revertedWith('getBatchByToken: tokenId must be less then last token id in batches array');
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

            context('turn on Sale', function() {
              beforeEach(async function() {
                await this.collection.start();
              });

              it('sale is active', async function() {
                const active = await this.collection.saleActive();
                expect(active).equal(true);
              });
              context('mint token', function() {
                it('reverts when trying to mint after sale end', async function() {
                  await expect(this.collection.mint(this.referral.address, 11))
                    .to.be.revertedWith('revert Collection: maxSupply achieved');
                });

                it('reverts when trying to mintMultiple after sale end', async function() {
                  await expect(this.collection.mintMultiple(this.referral.address, 11))
                    .to.be.revertedWith('buy: Sale has already ended');
                });
              });

              context('buy token', function() {
                it('reverts when trying to buy after sale end', async function() {
                  price = await this.collection.getTotalPriceFor(1);
                  await expect(this.collection.connect(this.buyer).buy(1, this.referral.address, { value: price }))
                    .to.be.revertedWith('buy: Sale has already ended');
                });

                context('token attributes', function() {
                  it('get token name by id', async function() {
                    expect(await this.collection.getName(18)).equal('');
                  });

                  it('get token skill by id', async function() {
                    expect(await this.collection.getSkill(18)).equal(0);
                  });
                });
              });
            });
          });
        });
      });

      context('add saleStage #0', function() {
        beforeEach(async function() {
          expect(await this.collection.saleStagesLength()).to.equal(0);
          await this.collection.addSaleStage(9, 100);
        });
        it('check saleStage #0 available', async function() {
          expect(await this.collection.saleStagesLength()).to.equal(1);
          const saleStage = await this.collection.getSaleStage(0);
          expect(saleStage.startTokens).to.equal(0);
          expect(saleStage.endTokens).to.equal(9);
          expect(saleStage.weiPerToken).to.equal(100);
          await expect(this.collection.getSaleStage(1)).to.be.reverted;
        });
        context('then saleStage #1 added', function() {
          beforeEach(async function() {
            await this.collection.addSaleStage(19, 200);
          });

          it('both saleStages are visible', async function() {
            expect(await this.collection.saleStagesLength()).to.equal(2);
            // previously created stage is visible
            let saleStage = await this.collection.getSaleStage(0);
            expect(saleStage.startTokens).to.equal(0);
            expect(saleStage.endTokens).to.equal(9);
            expect(saleStage.weiPerToken).to.equal(100);
            // new stage is visible
            saleStage = await this.collection.getSaleStage(1);
            // fixme: token numbering in batches should be inclusive
            expect(saleStage.startTokens).to.equal(10);
            expect(saleStage.endTokens).to.equal(19);
            expect(saleStage.weiPerToken).to.equal(200);
            await expect(this.collection.getSaleStage(2)).to.be.reverted;
          });
          context('then remove saleStage #0', function() {
            beforeEach(async function() {
              // todo: need to impleent deleteSaleStage(...)
              // await this.collection.deleteSaleStage(0);
            });
          });
          context('mint token', function() {
            it('mint token when batch 0 is delete');

            it('mint with manager role', async function() {
              await this.collection.mint(this.other.address, 1);
              expect(await this.collection.totalSupply()).to.equal(1);
            });

            it('no batches before they added', async function() {
              expect(await this.collection.batchesLength()).to.equal(0);
              const batches = await this.collection.getBatches();
              expect(batches.length).to.equal(0);
            });

            it('mintMultiple token purchase', async function() {
              await this.collection.mintMultiple(this.deployer.address, 1);
              expect(await this.collection.totalSupply()).to.equal(1);

              await this.collection.mintMultiple(this.deployer.address, 2);
              expect(await this.collection.totalSupply()).to.equal(3);
            });

            it('mintMultiple reverts when trying to buy 0 nft', async function() {
              await expect(this.collection.mintMultiple(this.referral.address, 0))
                .to.be.revertedWith('buy: nfts cannot be 0');
            });

            it('mintMultiple reverts when trying to buy nfts that exceeds totalSupply', async function() {
              price = await this.collection.getTotalPriceFor(20);
              await expect(this.collection.mintMultiple(this.referral.address, 20))
                .to.be.revertedWith('buy: Exceeds _maxTotalSupply');
            });

            it('mintMultiple reverts when trying to buy after sale end', async function() {
              await this.collection.mintMultiple(
                this.referral.address, 19);
              await expect(this.collection.mintMultiple(
                this.referral.address, 19))
                .to.be.revertedWith('buy: Sale has already ended');
            });

            context('turn on Sale', function() {
              beforeEach(async function() {
                await this.collection.start();
              });

              it('sale is active', async function() {
                const active = await this.collection.saleActive();
                expect(active).equal(true);
              });
              context('buy token', function() {
                it('token purchase', async function() {
                  price = await this.collection.getTotalPriceFor(1);
                  await expect(this.collection.connect(this.buyer).buy(1, this.referral.address,
                    { value: price }))
                    .to.emit(this.collection, 'Buy')
                    .withArgs(this.buyer.address, 1, this.referral.address);
                  expect(await this.collection.totalSupply()).to.equal(1);
                  price = await this.collection.getTotalPriceFor(2);
                  await expect(this.collection.connect(this.buyer).buy(2, this.referral.address,
                    { value: price }))
                    .to.emit(this.collection, 'Buy')
                    .withArgs(this.buyer.address, 2, this.referral.address);
                  expect(await this.collection.totalSupply()).to.equal(3);
                });

                it('token purchase with zero address', async function() {
                  const ZERO_ADDRESS = ethers.constants.AddressZero;
                  price = await this.collection.getTotalPriceFor(1);
                  await expect(this.collection.connect(this.buyer).buy(1, ZERO_ADDRESS,
                    { value: price }))
                    .to.emit(this.collection, 'Buy')
                    .withArgs(this.buyer.address, 1, ZERO_ADDRESS);
                });

                it('eth goes to vault', async function() {
                  const vaultBalanceBefore = await this.vault.getBalance();
                  price = await this.collection.getTotalPriceFor(2);
                  await this.collection.buy(2, this.referral.address, { value: price });
                  const vaultBalanceAfter = await this.vault.getBalance();
                  expect(vaultBalanceAfter.sub(vaultBalanceBefore)).to.equal(price);
                });

                it('reverts when trying to buy after sale end', async function() {
                  price = await this.collection.getTotalPriceFor(19);
                  await this.collection.connect(this.buyer).buy(19, this.referral.address, { value: price });
                  expect(await this.collection.totalSupply()).to.equal(19);

                  price = await this.collection.getTotalPriceFor(11);
                  await expect(this.collection.connect(this.buyer).buy(11, this.referral.address, {
                    value: price,
                  })).to.be.revertedWith('buy: Sale has already ended');
                });

                it('reverts when trying to buy 0 nft', async function() {
                  await expect(this.collection.connect(this.buyer).buy(0, this.referral.address, {
                    value: 0,
                  })).to.be.revertedWith('buy: nfts cannot be 0');
                });

                it('reverts when trying to buy nfts that exceeds totalSupply', async function() {
                  price = await this.collection.getTotalPriceFor(20);
                  await expect(this.collection.connect(this.buyer).buy(20, this.referral.address, {
                    value: price,
                  })).to.be.revertedWith('buy: Exceeds _maxTotalSupply');
                });

                it('reverts when trying to buy more than maxPurchaseSize nft', async function() {
                  const newPurchaseSize = 30;
                  await this.collection.setMaxPurchaseSize(newPurchaseSize);
                  price = await this.collection.getTotalPriceFor(31);
                  await expect(this.collection.buy(31, this.referral.address, { value: price }))
                    .to.be.revertedWith('buy: You can not buy more than maxPurchaseSize NFTs at once');
                });

                it('reverts when send incorrect ETH value', async function() {
                  price = await this.collection.getTotalPriceFor(5);
                  await expect(this.collection.connect(this.other).buy(5, this.referral.address, {
                    value: 0,
                  }))
                    .to.be.revertedWith('buy: Ether value sent is not correct');
                });
                context('token attributes with default values', function() {

                });
              });
              it('after add saleStage we haw correct token attributes');
            });
          });
        });
      });

      context('add saleStage and batch', function() {
        beforeEach(async function() {
          await this.collection.addSaleStage(9, 100);
        });

        it('check saleStage #0 available', async function() {
          expect(await this.collection.saleStagesLength()).to.equal(1);
          const saleStage = await this.collection.getSaleStage(0);
          expect(saleStage.startTokens).to.equal(0);
          expect(saleStage.endTokens).to.equal(9);
          expect(saleStage.weiPerToken).to.equal(100);
          await expect(this.collection.getSaleStage(1)).to.be.reverted;
        });

        context('then saleStage #1 added', function() {
          beforeEach(async function() {
            await this.collection.addSaleStage(19, 200);
          });

          it('both saleStages are visible', async function() {
            expect(await this.collection.saleStagesLength()).to.equal(2);
            // previously created stage is visible
            let saleStage = await this.collection.getSaleStage(0);
            expect(saleStage.startTokens).to.equal(0);
            expect(saleStage.endTokens).to.equal(9);
            expect(saleStage.weiPerToken).to.equal(100);
            // new stage is visible
            saleStage = await this.collection.getSaleStage(1);
            // fixme: token numbering in batches should be inclusive
            expect(saleStage.startTokens).to.equal(10);
            expect(saleStage.endTokens).to.equal(19);
            expect(saleStage.weiPerToken).to.equal(200);
            await expect(this.collection.getSaleStage(2)).to.be.reverted;
          });

          context('then remove saleStage #0', function() {
            beforeEach(async function() {
              // todo: need to impleent deleteSaleStage(...)
              // await this.collection.deleteSaleStage(0);
            });

            it('saleStages #0 got removed and #1 still there');

            context('mint token', function() {
              it('mint token when batch 0 is delete');

              it('mint with manager role', async function() {
                await this.collection.mint(this.other.address, 1);
                expect(await this.collection.totalSupply()).to.equal(1);
              });

              it('no batches before they added', async function() {
                expect(await this.collection.batchesLength()).to.equal(0);
                const batches = await this.collection.getBatches();
                expect(batches.length).to.equal(0);
              });

              it('mintMultiple token purchase', async function() {
                await this.collection.mintMultiple(this.deployer.address, 1);
                expect(await this.collection.totalSupply()).to.equal(1);

                await this.collection.mintMultiple(this.deployer.address, 2);
                expect(await this.collection.totalSupply()).to.equal(3);
              });

              it('mintMultiple reverts when trying to buy 0 nft', async function() {
                await expect(this.collection.mintMultiple(this.referral.address, 0))
                  .to.be.revertedWith('buy: nfts cannot be 0');
              });

              it('mintMultiple reverts when trying to buy nfts that exceeds totalSupply', async function() {
                price = await this.collection.getTotalPriceFor(20);
                await expect(this.collection.mintMultiple(this.referral.address, 20))
                  .to.be.revertedWith('buy: Exceeds _maxTotalSupply');
              });

              it('mintMultiple reverts when trying to buy after sale end', async function() {
                await this.collection.mintMultiple(
                  this.referral.address, 19);
                await expect(this.collection.mintMultiple(
                  this.referral.address, 19))
                  .to.be.revertedWith('buy: Sale has already ended');
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

                it('return default rarity', async function() {
                  expect(await this.collection.getRarity(999)).to.equal(1);
                });

                it('return token batch rarity', async function() {
                  expect(await this.collection.getRarity(9)).to.equal(12);
                });

                it('tokenURIs are correct', async function() {
                  expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
                  expect(await this.collection.tokenURI(9)).to.equal('ipfs://ipfs/batchX/9.json');
                  // await expectRevert(
                  //   this.token.getBatchByToken(11),
                  //   'getBatchByToken: tokenId must be less then last token id in batches array',
                  // );
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
                    await expect(this.collection.getBatchByToken(20))
                      .to.be.revertedWith('getBatchByToken: tokenId must be less then last token id in batches array');
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

                    context('turn on Sale', function() {
                      beforeEach(async function() {
                        await this.collection.start();
                      });

                      it('sale is active', async function() {
                        const active = await this.collection.saleActive();
                        expect(active).equal(true);
                      });
                      context('buy token', function() {
                        it('token purchase', async function() {
                          price = await this.collection.getTotalPriceFor(1);
                          await expect(this.collection.connect(this.buyer).buy(1, this.referral.address,
                            { value: price }))
                            .to.emit(this.collection, 'Buy')
                            .withArgs(this.buyer.address, 1, this.referral.address);
                          expect(await this.collection.totalSupply()).to.equal(1);
                          price = await this.collection.getTotalPriceFor(2);
                          await expect(this.collection.connect(this.buyer).buy(2, this.referral.address,
                            { value: price }))
                            .to.emit(this.collection, 'Buy')
                            .withArgs(this.buyer.address, 2, this.referral.address);
                          expect(await this.collection.totalSupply()).to.equal(3);
                        });

                        it('token purchase with zero address', async function() {
                          const ZERO_ADDRESS = ethers.constants.AddressZero;
                          price = await this.collection.getTotalPriceFor(1);
                          await expect(this.collection.connect(this.buyer).buy(1, ZERO_ADDRESS,
                            { value: price }))
                            .to.emit(this.collection, 'Buy')
                            .withArgs(this.buyer.address, 1, ZERO_ADDRESS);
                        });

                        it('eth goes to vault', async function() {
                          const vaultBalanceBefore = await this.vault.getBalance();
                          price = await this.collection.getTotalPriceFor(2);
                          await this.collection.buy(2, this.referral.address, { value: price });
                          const vaultBalanceAfter = await this.vault.getBalance();
                          expect(vaultBalanceAfter.sub(vaultBalanceBefore)).to.equal(price);
                        });

                        it('reverts when trying to buy after sale end', async function() {
                          price = await this.collection.getTotalPriceFor(19);
                          await this.collection.connect(this.buyer).buy(19, this.referral.address, { value: price });
                          expect(await this.collection.totalSupply()).to.equal(19);

                          price = await this.collection.getTotalPriceFor(11);
                          await expect(this.collection.connect(this.buyer).buy(11, this.referral.address, {
                            value: price,
                          })).to.be.revertedWith('buy: Sale has already ended');
                        });

                        it('reverts when trying to buy 0 nft', async function() {
                          await expect(this.collection.connect(this.buyer).buy(0, this.referral.address, {
                            value: 0,
                          })).to.be.revertedWith('buy: nfts cannot be 0');
                        });

                        it('reverts when trying to buy nfts that exceeds totalSupply', async function() {
                          price = await this.collection.getTotalPriceFor(20);
                          await expect(this.collection.connect(this.buyer).buy(20, this.referral.address, {
                            value: price,
                          })).to.be.revertedWith('buy: Exceeds _maxTotalSupply');
                        });

                        it('reverts when trying to buy more than maxPurchaseSize nft', async function() {
                          const newPurchaseSize = 30;
                          await this.collection.setMaxPurchaseSize(newPurchaseSize);
                          price = await this.collection.getTotalPriceFor(31);
                          await expect(this.collection.buy(31, this.referral.address, { value: price }))
                            .to.be.revertedWith('buy: You can not buy more than maxPurchaseSize NFTs at once');
                        });

                        it('reverts when send incorrect ETH value', async function() {
                          price = await this.collection.getTotalPriceFor(5);
                          await expect(this.collection.connect(this.other).buy(5, this.referral.address, {
                            value: 0,
                          }))
                            .to.be.revertedWith('buy: Ether value sent is not correct');
                        });

                        context('token attributes', function() {
                          const newName = 'Abraham Lincoln';
                          const newSkill = 20;
                          it('get token name by id', async function() {
                            expect(await this.collection.getName(18)).equal('');
                          });

                          it('change token name', async function() {
                            await expect(this.collection.setName(18, newName))
                              .to.emit(this.collection, 'NameChange')
                              .withArgs(18, newName);
                            expect(await this.collection.getName(18)).equal(newName);
                          });

                          it('get token skill by id', async function() {
                            expect(await this.collection.getSkill(18)).equal(0);
                          });

                          it('change token skill', async function() {
                            await expect(this.collection.setSkill(18, newSkill))
                              .to.emit(this.collection, 'SkillChange')
                              .withArgs(18, newSkill);
                            expect(await this.collection.getSkill(18)).equal(newSkill);
                          });

                          context('sale end', function() {
                            beforeEach(async function() {
                              await this.collection.stop();
                            });

                            it('sale is deactivate', async function() {
                              const deactivate = await this.collection.saleActive();
                              expect(deactivate).equal(false);
                            });

                            it('reverts when trying to buy when sale is not active', async function() {
                              price = await this.collection.getTotalPriceFor(1);
                              await expect(this.collection.buy(1, this.referral.address, {
                                value: price,
                              }))
                                .to.be.revertedWith('buy: Sale is not active');
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
          context('add batches #1, #2, #3', function() {
            beforeEach(async function() {
              await this.collection.addBatch(20, 'ipfs://ipfs/second_batch', 23);
              await this.collection.addBatch(30, 'ipfs://ipfs/third_batch', 33);
              await this.collection.addBatch(40, 'ipfs://ipfs/fourth_batch', 43);
            });

            it('all batches are visible', async function() {
              expect(await this.collection.batchesLength()).to.equal(4);
              const batches = await this.collection.getBatches();
              expect(batches.length).to.equal(4);
              expect(batches[0].endId).to.equal(10);
              expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
              expect(batches[0].rarity).to.equal(12);
              expect(batches[1].endId).to.equal(20);
              expect(batches[1].baseURI).to.equal('ipfs://ipfs/second_batch');
              expect(batches[1].rarity).to.equal(23);
              expect(batches[2].endId).to.equal(30);
              expect(batches[2].baseURI).to.equal('ipfs://ipfs/third_batch');
              expect(batches[2].rarity).to.equal(33);
              expect(batches[3].endId).to.equal(40);
              expect(batches[3].baseURI).to.equal('ipfs://ipfs/fourth_batch');
              expect(batches[3].rarity).to.equal(43);
            });

            it('tokenURIs are correct', async function() {
              expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
              expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchX/10.json');
              expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/second_batch/11.json');
              expect(await this.collection.tokenURI(21)).to.equal('ipfs://ipfs/third_batch/21.json');
              expect(await this.collection.tokenURI(31)).to.equal('ipfs://ipfs/fourth_batch/31.json');
              // fixme: endId is not available
              // Error: VM Exception while processing transaction: revert getBatchByToken:
              // tokenId must be less then last token id in batches array
              // expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/batchY/19.json');
            });

            context('delete batch #1', function() {
              beforeEach(async function() {
                await this.collection.deleteBatch(1);
              });

              it('batch #1 should disappear and batches array should shorten', async function() {
                expect(await this.collection.batchesLength()).to.equal(3);
                const batches = await this.collection.getBatches();
                expect(batches.length).to.equal(3);
                expect(batches[1].endId).to.equal(40);
                expect(batches[1].baseURI).to.equal('ipfs://ipfs/fourth_batch');
                expect(batches[1].rarity).to.equal(43);
              });

              it('tokenURIs prevously served from removed batch now have batchY URI', async function() {
                expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/fourth_batch/11.json');
                expect(await this.collection.tokenURI(21)).to.equal('ipfs://ipfs/fourth_batch/21.json');
                // fixme: endId is not available
                // expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/batchY/19.json');
              });

              context('delete all batches (to load them in the correct order later)', function() {
                beforeEach(async function() {
                  await this.collection.deleteBatch(2);
                  await this.collection.deleteBatch(1);
                  await this.collection.deleteBatch(0);
                });

                it('batch lenght eq 0 if all batches deleted', async function() {
                  expect(await this.collection.batchesLength()).to.equal(0);
                });

                context('add batches #0, #1, #2, #3', function() {
                  beforeEach(async function() {
                    await this.collection.addBatch(10, 'ipfs://ipfs/first_batch', 13);
                    await this.collection.addBatch(20, 'ipfs://ipfs/second_batch', 23);
                    await this.collection.addBatch(30, 'ipfs://ipfs/third_batch', 33);
                    await this.collection.addBatch(40, 'ipfs://ipfs/fourth_batch', 43);
                  });

                  it('all batches are visible', async function() {
                    expect(await this.collection.batchesLength()).to.equal(4);
                    const batches = await this.collection.getBatches();
                    expect(batches.length).to.equal(4);
                    expect(batches[0].endId).to.equal(10);
                    expect(batches[0].baseURI).to.equal('ipfs://ipfs/first_batch');
                    expect(batches[0].rarity).to.equal(13);
                    expect(batches[1].endId).to.equal(20);
                    expect(batches[1].baseURI).to.equal('ipfs://ipfs/second_batch');
                    expect(batches[1].rarity).to.equal(23);
                    expect(batches[2].endId).to.equal(30);
                    expect(batches[2].baseURI).to.equal('ipfs://ipfs/third_batch');
                    expect(batches[2].rarity).to.equal(33);
                    expect(batches[3].endId).to.equal(40);
                    expect(batches[3].baseURI).to.equal('ipfs://ipfs/fourth_batch');
                    expect(batches[3].rarity).to.equal(43);
                  });

                  it('tokenURIs are correct', async function() {
                    expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/first_batch/0.json');
                    expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/first_batch/10.json');
                    expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/second_batch/11.json');
                    expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/second_batch/20.json');
                    expect(await this.collection.tokenURI(21)).to.equal('ipfs://ipfs/third_batch/21.json');
                    expect(await this.collection.tokenURI(30)).to.equal('ipfs://ipfs/third_batch/30.json');
                    expect(await this.collection.tokenURI(31)).to.equal('ipfs://ipfs/fourth_batch/31.json');
                    expect(await this.collection.tokenURI(40)).to.equal('ipfs://ipfs/fourth_batch/40.json');
                    // fixme: endId is not available
                    // Error: VM Exception while processing transaction: revert getBatchByToken:
                    // tokenId must be less then last token id in batches array
                    // expect(await this.collection.tokenURI(20)).to.equal('ipfs://ipfs/batchY/19.json');
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  context('check role-based access-control', function() {
    beforeEach(async function() {
      // todo: assign different roles for separate accounts and test them separately
      // this.saleAdminRole = await this.collection.SALE_ADMIN_ROLE();
      // await this.collection.grantRole(this.saleAdminRole, this.deployer.address);
    });

    it('setDefaultUri reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setDefaultUri('ipfs://ipfs/defaultUri'))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setDefaultRarity reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setDefaultRarity(1))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setVault reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setVault(this.other.address))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setDefaultUri reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setDefaultUri('ipfs://ipfs/defaultUri'))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('addSaleStage reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).addSaleStage(1, 200))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('mint reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).mint(this.other.address, 1))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('addBatch reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).addBatch(10, 'ipfs://ipfs/batchX', 12))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('sale start reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).start())
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setMaxPurchaseSize reverts if called by wrong role', async function() {
      const newPurchaseSize = 30;
      await expect(this.collection.connect(this.other).setMaxPurchaseSize(newPurchaseSize))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setName reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setName(18, 'new name'))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('setSkill reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.other).setSkill(18, 1))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });

    it('mintMultiple reverts if called by wrong role', async function() {
      await expect(this.collection.connect(this.buyer).mintMultiple(this.referral.address, 20))
        .to.be.revertedWith('VM Exception while processing transaction: revert AccessControl');
    });
  });

  it('totalSupply and maxTotalSupply are 0', async function() {
    expect(await this.collection.totalSupply()).to.equal(0);
    expect(await this.collection.maxTotalSupply()).to.equal(0);
  });

  it('getBatchByToken reverts when there is no batches', async function() {
    await expect(this.collection.getBatchByToken(999))
      .to.be.revertedWith('getBatchByToken: no batches');
  });
});
