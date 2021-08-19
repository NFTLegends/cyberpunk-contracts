module.exports = async({ ethers, deployments }) => {
  const { deploy, execute } = deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const vaultAddress = listAccounts[1];

  const { deployer } = await getNamedAccounts();

  await deploy('Collection', {
    from: deployer,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      methodName: 'initialize',
    },
    log: true,
  });

  console.log('Set default uri');
  await execute(
    'Collection',
    { from: deployer, log: true },
    'setDefaultUri',
    'https://ipfs.io/ipfs/Qmahe3tFGHsbVSHa7i7wBKo6uEJ7MeGqS8t9qCQw4qFjo2',
  );

  console.log('Set vault');
  await execute('Collection', { from: deployer, log: true }, 'setVault', vaultAddress);
};
