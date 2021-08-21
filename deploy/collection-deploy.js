module.exports = async({ ethers, deployments, getNamedAccounts }) => {
  const { deploy, execute } = deployments;

  const vaultAddress = '0xd2Eae8333626E5b25108962fD4d3bdD06785857E';

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
    'ipfs://QmfBCYfa9THSvegJ66bFBFN57B7vz2AYgmzhyAV3NNW3vd/back.json',
  );

  console.log('Set vault');
  await execute('Collection', { from: deployer, log: true }, 'setVault', vaultAddress);
};
