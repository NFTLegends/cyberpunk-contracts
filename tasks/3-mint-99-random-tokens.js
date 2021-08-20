const { task } = require('hardhat/config');

task('3-mint-99-random-tokens', 'Mint random 99 tokens').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  const tokenHolder = listAccounts[1];

  await execute('Collection', { from: deployerAddress, log: true }, 'mintMultiple', tokenHolder, 99);
  console.log(`99 tokens minted to ${tokenHolder}`);
});
