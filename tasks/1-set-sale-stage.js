const { task } = require('hardhat/config');

task('1-set-sale-stage', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  
  console.log('Add saleStage 0'); 
  await execute('Collection', { from: deployerAddress, log: true }, 'addSaleStage', '0', '1', '100');

  console.log('Add saleStage 2');
  await execute('Collection', { from: deployerAddress, log: true }, 'addSaleStage', '2', '3', '200');

  console.log('Add saleStage 3');
  await execute('Collection', { from: deployerAddress, log: true }, 'addSaleStage', '4', '5', '300');
});
