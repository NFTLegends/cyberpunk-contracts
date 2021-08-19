const { task } = require('hardhat/config');

task('8-mint-remaining', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  const tokenHolder = listAccounts[1];

  collection = await ethers.getContract('Collection');
  maxTotalSupply = await collection.maxTotalSupply();

  let tokenIndex;
  for (tokenIndex = 0; tokenIndex < maxTotalSupply; tokenIndex++) {
    try {
      console.log(`check if the ${tokenIndex} token has an owner`);
      await collection.ownerOf(tokenIndex);
    } catch (e) {
      console.log(`${tokenIndex} token hasn't owner. Mint him`);
      await execute('Collection', { from: deployerAddress, log: true }, 'mint', tokenHolder, tokenIndex);
    }
  }
});

  
  