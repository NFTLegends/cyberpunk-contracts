const { task } = require('hardhat/config');

task('1-set-sale-stages', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  console.log('Add saleStage 0');
  await execute('Collection', { from: deployerAddress, log: true }, 'addSaleStage', '0', '3999', '50000000000000000');

  console.log('Add saleStage 1');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '4000',
    '9999',
    '75000000000000000',
  );

  console.log('Add saleStage 2');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '10000',
    '12999',
    '100000000000000000',
  );

  console.log('Add saleStage 3');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '13000',
    '14999',
    '150000000000000000',
  );

  console.log('Add saleStage 4');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '15000',
    '15999',
    '200000000000000000',
  );

  console.log('Add saleStage 5');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '16000',
    '16379',
    '500000000000000000',
  );

  console.log('Add saleStage 6');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '16380',
    '16383',
    '1000000000000000000',
  );
});
