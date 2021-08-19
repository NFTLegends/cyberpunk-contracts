const { task } = require('hardhat/config');

task('7-stop-sale', 'start token sale').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  await execute('Collection', { from: deployerAddress, log: true }, 'stop');
  console.log('sale stopped');
});
