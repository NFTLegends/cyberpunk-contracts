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
      await this.collection.connect(this.deployer).setDefaultName('CyberName');
      await this.collection.connect(this.deployer).setDefaultSkill(1490);
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
        await this.collection.addBatch(11, 20,
          'ipfs://ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a', 88);
        const batch = await this.collection.tokenURI(21);
        expect(batch).equal('ipfs://ipfs/defaultUri');
      });

      it('reverts when adding stage with wrong price', async function() {
        await expect(this.collection.addSaleStage(1, 0))
          .to.be.revertedWith('addSaleStage: weiPerToken must be non-zero');
      });

      it('no batches before they added', async function() {
        expect(await this.collection.batchesLength()).to.equal(0);
        const batches = await this.collection.getBatches();
        expect(batches.length).to.equal(0);
      });

      it('revert when batches intersect', async function() {
        await this.collection.addBatch(0, 9, 'ipfs://ipfs/first_batch', 12);
        await this.collection.addBatch(10, 19, 'ipfs://ipfs/second_batch', 23);
        await expect(this.collection.addBatch(5, 15, 'ipfs://ipfs/fourth_batch', 43)).to.be.revertedWith(
          'addBatch: batches intersect',
        );
      });

      it('revert when batchStartID more than batchEndId', async function() {
        await expect(this.collection.addBatch(9, 0, 'ipfs://ipfs/first_batch', 12)).to.be.revertedWith(
          'addBatch: batchStartID must be equal or less than batchEndId',
        );
      });

      it('revert when batch batchEndId = 0', async function() {
        await expect(this.collection.addBatch(9, 0, 'ipfs://ipfs/first_batch', 12)).to.be.revertedWith(
          'addBatch: batchStartID must be equal or less than batchEndId',
        );
      });

      it('revert when batches is empty', async function() {
        await expect(this.collection.setBatch(0, 15, 5, 'ipfs://ipfs/first_batch', 13)).to.be.revertedWith(
          'setBatch: batches is empty',
        );
      });

      it('revert getBatchByToken with no batches', async function() {
        await expect(this.collection.getBatchByToken(0)).to.be.revertedWith('getBatchByToken: no batches');
      });

      it('revert getBatch with no batches', async function() {
        await expect(this.collection.getBatch(0)).to.be.revertedWith('getBatch: no batches');
      });

      it('revert tokenURI with no batches', async function() {
        await expect(this.collection.tokenURI(0)).to.be.revertedWith('tokenURI: no batches');
      });

      it('get default token name by id', async function() {
        expect(await this.collection.getName(999)).equal('CyberName');
      });

      it('get default token skill by id', async function() {
        expect(await this.collection.getSkill(999)).equal(1490);
      });

      context('add batch #0', function() {
        beforeEach(async function() {
          await this.collection.addBatch(0, 10, 'ipfs://ipfs/batchX', 12);
        });

        it('batch is visible', async function() {
          expect(await this.collection.batchesLength()).to.equal(1);
          const batches = await this.collection.getBatches();
          const zeroBatch = await this.collection.getBatch(0);
          expect(batches.length).to.equal(1);

          expect(zeroBatch.startTokenId).to.equal(0);
          expect(zeroBatch.endTokenId).to.equal(10);
          expect(zeroBatch.baseURI).to.equal('ipfs://ipfs/batchX');
          expect(zeroBatch.rarity).to.equal(12);

          expect(batches[0].startTokenId).to.equal(0);
          expect(batches[0].endTokenId).to.equal(10);
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

        it('get default token name by id', async function() {
          expect(await this.collection.getName(999)).equal('CyberName');
        });

        it('get default token skill by id', async function() {
          expect(await this.collection.getSkill(999)).equal(1490);
        });

        context('set batch #0', function() {
          beforeEach(async function() {
            await this.collection.setBatch(0, 0, 20, 'ipfs://ipfs/first_batch', 13);
          });

          it('batch #0 is visible', async function() {
            expect(await this.collection.batchesLength()).to.equal(1);
            const batches = await this.collection.getBatches();
            expect(batches.length).to.equal(1);
            expect(batches[0].startTokenId).to.equal(0);
            expect(batches[0].endTokenId).to.equal(20);
            expect(batches[0].baseURI).to.equal('ipfs://ipfs/first_batch');
            expect(batches[0].rarity).to.equal(13);
          });

          it('there are empty indices between two batches');

          it('getTokenUri works on indices from 0 to 20');
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
            it('reverts when trying to mint if sale stage no set', async function() {
              await expect(this.collection.mint(this.referral.address, 11))
                .to.be.revertedWith('revert Collection: maxSupply achieved');
            });

            it('reverts when trying to mintMultiple if sale stage no set', async function() {
              await expect(this.collection.mintMultiple(this.referral.address, 11))
                .to.be.revertedWith('buy: Sale has already ended');
            });
          });

          context('buy token', function() {
            it('reverts when trying to buy if sale stage no set', async function() {
              price = await this.collection.getTotalPriceFor(1);
              await expect(this.collection.connect(this.buyer).buy(1, this.referral.address, { value: price }))
                .to.be.revertedWith('buy: Sale has already ended');
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
                  // it('get token name by id', async function() {
                  //   expect(await this.collection.getName(18)).equal('');
                  // });
                  //
                  // it('get token skill by id', async function() {
                  //   expect(await this.collection.getSkill(18)).equal(0);
                  // });
                });
                it('after add batch we haw correct token attributes');
              });
            });
          });
        });
      });

      context('add saleStage and batch', function() {
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
                  await this.collection.addBatch(0, 10, 'ipfs://ipfs/batchX', 12);
                });

                it('batch is visible', async function() {
                  expect(await this.collection.batchesLength()).to.equal(1);
                  const batches = await this.collection.getBatches();
                  const zeroBatch = await this.collection.getBatch(0);
                  expect(batches.length).to.equal(1);

                  expect(zeroBatch.startTokenId).to.equal(0);
                  expect(zeroBatch.endTokenId).to.equal(10);
                  expect(zeroBatch.baseURI).to.equal('ipfs://ipfs/batchX');
                  expect(zeroBatch.rarity).to.equal(12);

                  expect(batches[0].startTokenId).to.equal(0);
                  expect(batches[0].endTokenId).to.equal(10);
                  expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
                  expect(batches[0].rarity).to.equal(12);
                });

                it('get batch by token are correct', async function() {
                  const zeroTokenBatch = expect(await this.collection.getBatchByToken(0));
                  const zeroBatch = await this.collection.getBatch(0);
                  expect(zeroTokenBatch === zeroBatch);
                });

                it('tokenURIs are correct', async function() {
                  expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
                  expect(await this.collection.tokenURI(9)).to.equal('ipfs://ipfs/batchX/9.json');
                });

                it('revert when index out of batches length', async function() {
                  await expect(this.collection.deleteBatch(1)).to.be.revertedWith(
                    'deleteBatch: index out of batches length');
                });

                it('revert when batchStartID more than batchEndId', async function() {
                  await expect(this.collection.setBatch(0, 15, 5, 'ipfs://ipfs/first_batch', 13)).to.be.revertedWith(
                    'setBatch: batchStartID must be equal or less than batchEndId',
                  );
                });

                it('revert getBatch with batchId more than batch length', async function() {
                  await expect(this.collection.getBatch(1)).to.be.revertedWith(
                    'getBatch: batchId must be less than batch length',
                  );
                });

                context('set batch #0', function() {
                  beforeEach(async function() {
                    await this.collection.setBatch(0, 0, 20, 'ipfs://ipfs/first_batch', 13);
                  });

                  it('batch #0 is visible', async function() {
                    expect(await this.collection.batchesLength()).to.equal(1);
                    const batches = await this.collection.getBatches();
                    expect(batches.length).to.equal(1);
                    expect(batches[0].startTokenId).to.equal(0);
                    expect(batches[0].endTokenId).to.equal(20);
                    expect(batches[0].baseURI).to.equal('ipfs://ipfs/first_batch');
                    expect(batches[0].rarity).to.equal(13);
                  });

                  it('there are empty indices between two batches');

                  it('getTokenUri works on indices from 0 to 20');
                });

                context('add batch #1', function() {
                  beforeEach(async function() {
                    await this.collection.addBatch(11, 20, 'ipfs://ipfs/batchY', 23);
                  });

                  it('both batches are visible', async function() {
                    expect(await this.collection.batchesLength()).to.equal(2);
                    const batches = await this.collection.getBatches();
                    expect(batches.length).to.equal(2);
                    expect(batches[0].startTokenId).to.equal(0);
                    expect(batches[0].endTokenId).to.equal(10);
                    expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
                    expect(batches[0].rarity).to.equal(12);
                    expect(batches[1].startTokenId).to.equal(11);
                    expect(batches[1].endTokenId).to.equal(20);
                    expect(batches[1].baseURI).to.equal('ipfs://ipfs/batchY');
                    expect(batches[1].rarity).to.equal(23);
                  });

                  it('tokenURIs are correct', async function() {
                    expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
                    expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchX/10.json');
                    expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/batchY/11.json');
                  });

                  it('revert when a batch intersection occurs when set batch', async function() {
                    await expect(this.collection.setBatch(1, 5, 15, 'ipfs://ipfs/second_batch', 13)).to.be.revertedWith(
                      'setBatch: batches intersect',
                    );
                  });

                  context('set batch #1', function() {
                    beforeEach(async function() {
                      await this.collection.setBatch(1, 21, 30, 'ipfs://ipfs/second_batch', 13);
                    });

                    it('batch #1 is visible', async function() {
                      expect(await this.collection.batchesLength()).to.equal(2);
                      const batches = await this.collection.getBatches();
                      expect(batches.length).to.equal(2);
                      expect(batches[1].startTokenId).to.equal(21);
                      expect(batches[1].endTokenId).to.equal(30);
                      expect(batches[1].baseURI).to.equal('ipfs://ipfs/second_batch');
                      expect(batches[1].rarity).to.equal(13);
                    });

                    it('there are empty indices between two batches');

                    it('getTokenUri works on indices from 21 to 30');
                  });

                  context('delete batch #0', function() {
                    beforeEach(async function() {
                      await this.collection.deleteBatch(0);
                    });

                    it('batch 0 should disappear and batches array should shorten', async function() {
                      expect(await this.collection.batchesLength()).to.equal(1);
                      const batches = await this.collection.getBatches();
                      expect(batches.length).to.equal(1);
                      expect(batches[0].startTokenId).to.equal(11);
                      expect(batches[0].endTokenId).to.equal(20);
                      expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchY');
                      expect(batches[0].rarity).to.equal(23);
                    });

                    it('tokenURIs prevously served from removed batch now have batchY URI', async function() {
                      expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/defaultUri');
                      expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/batchY/11.json');
                    });
                  });
                });
                context('add batches #1, #2, #3', function() {
                  beforeEach(async function() {
                    await this.collection.addBatch(11, 20, 'ipfs://ipfs/second_batch', 23);
                    await this.collection.addBatch(21, 30, 'ipfs://ipfs/third_batch', 33);
                    await this.collection.addBatch(31, 40, 'ipfs://ipfs/fourth_batch', 43);
                  });

                  it('all batches are visible', async function() {
                    let batchByToken;
                    let batch;
                    const batches = await this.collection.getBatches();

                    expect(await this.collection.batchesLength()).to.equal(4);
                    expect(batches.length).to.equal(4);
                    expect(batches[0].startTokenId).to.equal(0);
                    expect(batches[0].endTokenId).to.equal(10);
                    expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
                    expect(batches[0].rarity).to.equal(12);
                    expect(batches[1].startTokenId).to.equal(11);
                    expect(batches[1].endTokenId).to.equal(20);
                    expect(batches[1].baseURI).to.equal('ipfs://ipfs/second_batch');
                    expect(batches[1].rarity).to.equal(23);
                    expect(batches[2].startTokenId).to.equal(21);
                    expect(batches[2].endTokenId).to.equal(30);
                    expect(batches[2].baseURI).to.equal('ipfs://ipfs/third_batch');
                    expect(batches[2].rarity).to.equal(33);
                    expect(batches[3].startTokenId).to.equal(31);
                    expect(batches[3].endTokenId).to.equal(40);
                    expect(batches[3].baseURI).to.equal('ipfs://ipfs/fourth_batch');
                    expect(batches[3].rarity).to.equal(43);

                    batchByToken = expect(await this.collection.getBatchByToken(0));
                    batch = await this.collection.getBatch(0);
                    expect(batchByToken === batch);
                    batchByToken = expect(await this.collection.getBatchByToken(11));
                    batch = await this.collection.getBatch(1);
                    expect(batchByToken === batch);
                    batchByToken = expect(await this.collection.getBatchByToken(21));
                    batch = await this.collection.getBatch(2);
                    expect(batchByToken === batch);
                    batchByToken = expect(await this.collection.getBatchByToken(31));
                    batch = await this.collection.getBatch(3);
                    expect(batchByToken === batch);
                  });

                  it('tokenURIs are correct', async function() {
                    expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
                    expect(await this.collection.tokenURI(10)).to.equal('ipfs://ipfs/batchX/10.json');
                    expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/second_batch/11.json');
                    expect(await this.collection.tokenURI(21)).to.equal('ipfs://ipfs/third_batch/21.json');
                    expect(await this.collection.tokenURI(31)).to.equal('ipfs://ipfs/fourth_batch/31.json');
                  });

                  context('delete batch #1', function() {
                    beforeEach(async function() {
                      await this.collection.deleteBatch(1);
                    });

                    it('all batches are visible', async function() {
                      const batches = await this.collection.getBatches();

                      expect(await this.collection.batchesLength()).to.equal(3);
                      expect(batches.length).to.equal(3);
                      expect(batches[0].startTokenId).to.equal(0);
                      expect(batches[0].endTokenId).to.equal(10);
                      expect(batches[0].baseURI).to.equal('ipfs://ipfs/batchX');
                      expect(batches[0].rarity).to.equal(12);
                      expect(batches[1].startTokenId).to.equal(31);
                      expect(batches[1].endTokenId).to.equal(40);
                      expect(batches[1].baseURI).to.equal('ipfs://ipfs/fourth_batch');
                      expect(batches[1].rarity).to.equal(43);
                      expect(batches[2].startTokenId).to.equal(21);
                      expect(batches[2].endTokenId).to.equal(30);
                      expect(batches[2].baseURI).to.equal('ipfs://ipfs/third_batch');
                      expect(batches[2].rarity).to.equal(33);
                    });

                    it('batch #1 should disappear and batches array should shorten', async function() {
                      let batchByToken;
                      const batches = await this.collection.getBatches();
                      expect(await this.collection.batchesLength()).to.equal(3);
                      expect(batches.length).to.equal(3);
                      expect(batches[1].startTokenId).to.equal(31);
                      expect(batches[1].endTokenId).to.equal(40);
                      expect(batches[1].baseURI).to.equal('ipfs://ipfs/fourth_batch');
                      expect(batches[1].rarity).to.equal(43);

                      batchByToken = await this.collection.getBatchByToken(0);
                      expect(await batchByToken.startTokenId).to.equal(0);
                      expect(await batchByToken.endTokenId).to.equal(10);

                      await expect(this.collection.getBatchByToken(11)).to.be.revertedWith(
                        'getBatchByToken: batch doesn\'t exist',
                      );

                      batchByToken = await this.collection.getBatchByToken(35);
                      expect(await batchByToken.startTokenId).to.equal(31);
                      expect(await batchByToken.endTokenId).to.equal(40);

                      batchByToken = await this.collection.getBatchByToken(25);
                      expect(await batchByToken.startTokenId).to.equal(21);
                      expect(await batchByToken.endTokenId).to.equal(30);
                    });

                    it('tokenURI return default uri if not found batch', async function() {
                      expect(await this.collection.tokenURI(0)).to.equal('ipfs://ipfs/batchX/0.json');
                      expect(await this.collection.tokenURI(11)).to.equal('ipfs://ipfs/defaultUri');
                      expect(await this.collection.tokenURI(21)).to.equal('ipfs://ipfs/third_batch/21.json');
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
                          await this.collection.addBatch(0, 10, 'ipfs://ipfs/first_batch', 13);
                          await this.collection.addBatch(11, 20, 'ipfs://ipfs/second_batch', 23);
                          await this.collection.addBatch(21, 30, 'ipfs://ipfs/third_batch', 33);
                          await this.collection.addBatch(31, 40, 'ipfs://ipfs/fourth_batch', 43);
                        });

                        it('all batches are visible', async function() {
                          expect(await this.collection.batchesLength()).to.equal(4);
                          const batches = await this.collection.getBatches();
                          expect(batches.length).to.equal(4);
                          expect(batches[0].startTokenId).to.equal(0);
                          expect(batches[0].endTokenId).to.equal(10);
                          expect(batches[0].baseURI).to.equal('ipfs://ipfs/first_batch');
                          expect(batches[0].rarity).to.equal(13);
                          expect(batches[1].startTokenId).to.equal(11);
                          expect(batches[1].endTokenId).to.equal(20);
                          expect(batches[1].baseURI).to.equal('ipfs://ipfs/second_batch');
                          expect(batches[1].rarity).to.equal(23);
                          expect(batches[2].startTokenId).to.equal(21);
                          expect(batches[2].endTokenId).to.equal(30);
                          expect(batches[2].baseURI).to.equal('ipfs://ipfs/third_batch');
                          expect(batches[2].rarity).to.equal(33);
                          expect(batches[3].startTokenId).to.equal(31);
                          expect(batches[3].endTokenId).to.equal(40);
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
                              await this.collection.connect(this.buyer).buy(19, this.referral.address,
                                { value: price });
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
                                expect(await this.collection.getName(1448)).equal('CyberName');
                              });

                              it('change token name', async function() {
                                await expect(this.collection.setName(1, newName))
                                  .to.emit(this.collection, 'NameChange')
                                  .withArgs(1, newName);
                                expect(await this.collection.getName(1)).equal(newName);
                              });

                              it('get token skill by id', async function() {
                                expect(await this.collection.getSkill(1)).equal(1490);
                              });

                              it('change token skill', async function() {
                                await expect(this.collection.setSkill(1, newSkill))
                                  .to.emit(this.collection, 'SkillChange')
                                  .withArgs(1, newSkill);
                                expect(await this.collection.getSkill(1)).equal(newSkill);
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
      await expect(this.collection.connect(this.other).addBatch(0, 10, 'ipfs://ipfs/batchX', 12))
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
