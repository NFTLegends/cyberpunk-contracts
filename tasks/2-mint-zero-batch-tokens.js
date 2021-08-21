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
    '0x80eA9CF6B42777b2153db7f6eb1828bFc819e03A',
    0,
  );
  console.log('Mint second token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x80eA9CF6B42777b2153db7f6eb1828bFc819e03A',
    1,
  );
  console.log('Mint third token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x80eA9CF6B42777b2153db7f6eb1828bFc819e03A',
    2,
  );
  console.log('Mint fourth token');
  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'mint',
    '0x80eA9CF6B42777b2153db7f6eb1828bFc819e03A',
    3,
  );
});
