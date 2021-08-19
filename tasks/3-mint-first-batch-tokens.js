const { task } = require('hardhat/config');

task('3-mint-first-batch-tokens', 'Mint token IDs 4 to 29').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  const tokenHolder = listAccounts[1];

  let tokenIndex;
  for (tokenIndex = 0; tokenIndex < 30; tokenIndex++) {
    console.log(`Mint ${tokenIndex} token`);
    await execute('Collection', { from: deployerAddress, log: true }, 'mint', tokenHolder, tokenIndex);
  }
});
