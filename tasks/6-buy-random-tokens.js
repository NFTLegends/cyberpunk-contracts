const { task } = require('hardhat/config');

task('6-buy-random-tokens', 'buy random tokens of a given amount')
  .addParam('amount', 'The amount of tokens')
  .setAction(async(taskArgs, hre) => {
    const ethers = hre.ethers;
    const chainId = await hre.getChainId();

    const collectionInstance = await ethers.getContract('Collection');

    if (chainId === '31337' || chainId === '1337' || chainId === '4') {
      const price = await collectionInstance.getTotalPriceFor(taskArgs.amount);

      if (collectionInstance.saleActive) {
        await (await collectionInstance.buy(taskArgs.amount, { value: price })).wait();
        console.log(`${taskArgs.amount} random tokens purchased`);
      } else {
        console.log('sale is not active');
      }
    }
  });
