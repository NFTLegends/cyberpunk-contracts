const { task } = require('hardhat/config');

task('2-mint-zero-batch-tokens', 'Mint token IDs 0 to 3').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  console.log('Mint first token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0xff440f57a2621952DdBC438D0100C50ACC507Cc4',
    0,
  );
  console.log('Mint second token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x097C0c85e6d49a4e541deDd86B8153C7f4882688',
    1,
  );
  console.log('Mint third token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x7107a4d60DEb424BDdC3449ec718ee34FE2f715A',
    2,
  );
  console.log('Mint fourth token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x70bee23E578d678F8F5a109e4EBDDf55176c2452',
    3,
  );
});
