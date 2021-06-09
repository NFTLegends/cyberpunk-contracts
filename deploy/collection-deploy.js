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
    await (await collection.addBatch('29', 'ipfs://ipfs/QmRdaLo9hs1UJiFbYW9E8owcBGTBC58hj1NnFwpwM878T1',
      { from: deployer })).wait();
    await (await collection.addBatch('59', 'ipfs://ipfs/QmPTpLEwZi84RTRYX2gFnh1SntZyeX1RCH6GANb8L2WMKg',
      { from: deployer })).wait();
    await (await collection.addBatch('89', 'ipfs://ipfs/QmYAiVT5CnbFDEW4w9VJowxwwddCNwQQkaThLWKbexSXfn',
      { from: deployer })).wait();
    await (await collection.addBatch('119', 'ipfs://ipfs/QmXXAFxQMNy8emeGtodbnyWVXAWExpP7oxhgUe9sg5xDLZ',
      { from: deployer })).wait();
    await (await collection.addBatch('149', 'ipfs://ipfs/QmdzMaqQRQ3SFTTB7zWauUUnvaUezEiGeFMnW9NyaJurB5',
      { from: deployer })).wait();
    await (await collection.addBatch('179', 'ipfs://ipfs/QmQ5f8TeQVdraVt8JDyEjmjdhvtGiFNXvGpHbABDkAvPeQ',
      { from: deployer })).wait();
    await (await collection.addBatch('209', 'ipfs://ipfs/QmeNA2sipZaDSJ2QFEppDUF7G3K2GhRMRccwfd9zJ42eVZ',
      { from: deployer })).wait();
    await (await collection.addBatch('239', 'ipfs://ipfs/QmcqTTX4kM4BrSkkVkYDZyttYXSs6q9Y8RxHzKPCAhUaYW',
      { from: deployer })).wait();
    await (await collection.addBatch('269', 'ipfs://ipfs/QmVsKPsLY5sxefnChe9efoXeKefVjJRisWfca7k7ewqAg5',
      { from: deployer })).wait();
    await (await collection.addBatch('299', 'ipfs://ipfs/QmPmn5PrAKHT8N3YUM5u8YQRdDqEjpmvskgS7CeX7HAGDr',
      { from: deployer })).wait();
  }
};
