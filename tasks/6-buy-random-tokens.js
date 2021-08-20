const { task } = require('hardhat/config');
task('6-buy-random-tokens', 'buy random tokens of a given amount')
  .addParam('amount', 'The amount of tokens')
  .setAction(async(taskArgs, hre) => {
    const ethers = hre.ethers;

    const { execute } = hre.deployments;

    const listAccounts = await ethers.provider.listAccounts();
    const deployerAddress = listAccounts[0];
    const referalAddress = listAccounts[1];

    let price;

    try {
      const collection = await ethers.getContract('Collection');
      price = await collection.getTotalPriceFor(taskArgs.amount);
    } catch (e) {
      console.log(e);
    }

    try {
      await execute(
        'Collection',
        { from: deployerAddress, log: true, value: price },
        'buy',
        taskArgs.amount,
        referalAddress,
      );
      console.log(`${taskArgs.amount} random tokens purchased`);
    } catch (e) {
      console.log(e);
    }
  });
