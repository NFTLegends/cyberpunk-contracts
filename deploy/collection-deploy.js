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

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    console.log('Add saleStages');
    await (await collection.addSaleStage('100', '100000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('200', '1000000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('300', '10000000000000000', { from: deployer })).wait();
    console.log('Add batches');
    await (await collection.addBatch('9', 'ipfs://ipfs/', { from: deployer })).wait();
    await (await collection.addBatch('19', 'ipfs://ipfs/', { from: deployer })).wait();
  }
};
