module.exports = async ({
  ethers,
  getNamedAccounts,
  deployments,
  getChainId,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();

  await deploy('Collection', {
    from: deployer,
    gasLimit: 4000000,
    args: [],
    log: true,
  });

  const collection = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337') {
    await collection.addSaleStage('1000', '1000', { from: deployer });
  }
};
