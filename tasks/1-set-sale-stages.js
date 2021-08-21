const { task } = require('hardhat/config');

task('1-set-sale-stages', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  console.log('Add saleStage 0');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '0',
    '3999',
    ethers.utils.parseEther('0.05'),
  );

  console.log('Add saleStage 1');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '4000',
    '9999',
    ethers.utils.parseEther('0.075'),
  );

  console.log('Add saleStage 2');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '10000',
    '12999',
    ethers.utils.parseEther('0.1'),
  );

  console.log('Add saleStage 3');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '13000',
    '14999',
    ethers.utils.parseEther('0.15'),
  );

  console.log('Add saleStage 4');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '15000',
    '15999',
    ethers.utils.parseEther('0.2'),
  );

  console.log('Add saleStage 5');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '16000',
    '16379',
    ethers.utils.parseEther('0.5'),
  );

  console.log('Add saleStage 6');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addSaleStage',
    '16380',
    '16383',
    ethers.utils.parseEther('1'),
  );
});
