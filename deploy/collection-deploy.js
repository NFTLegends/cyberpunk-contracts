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
    console.log('Add Role');
    await (this.batchManagerRole = await collection.BATCH_MANAGER_ROLE());
    await (await collection.grantRole(this.batchManagerRole, '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35')).wait();
    await (this.vaultRole = await collection.VAULT_SETTER_ROLE());
    await (await collection.grantRole(this.vaultRole, '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35')).wait();
    await (this.saleAdminRole = await collection.SALE_ADMIN_ROLE());
    await (await collection.grantRole(this.saleAdminRole, '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35')).wait();
    await (this.defaultUriRole = await collection.DEFAULT_URI_SETTER_ROLE());
    await (await collection.grantRole(this.defaultUriRole, '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35')).wait();
    console.log('Add saleStages');
    await (await collection.addSaleStage('100', '100000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('200', '1000000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('300', '10000000000000000', { from: deployer })).wait();
    console.log('Add batches');
    await (await collection.addBatch('29', 'ipfs://ipfs/QmbKKgA76koVJfcLEyUcUZCbb8SZUU8mgp3UT4V9iFcWLJ', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('59', 'ipfs://ipfs/QmZD1TVFjLXz7xYo7PJEUajhHKhYtzW4skCMWVPpaPKtx1', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('89', 'ipfs://ipfs/QmbuPvkFNYApxvxe7NvdNs6dA29UniQJ6vehVFe7Ggb13D', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('119', 'ipfs://ipfs/QmdmwyBK8TWSeoVi1kYzdFNwEX2LPBQPuxJwWKLP9FDBQ2', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('149', 'ipfs://ipfs/QmQCk4YFMxHKpgczEUqtLChJzH8NLTKVeAvBt598oXgYr1', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('179', 'ipfs://ipfs/QmYDSS1W6M4nhAADGjCVTUMPAGGtw4CQft867BLenxLuVw', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('209', 'ipfs://ipfs/QmWjVCjvubXML6h5iPX1AqpXqmRbpPpX55RcwW8zz2JKkX', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('239', 'ipfs://ipfs/QmdRcpnJGjEYgh59SmjZ1LsVdPDACV54WFUtGhMBKaJTDi', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('269', 'ipfs://ipfs/QmRSPWETBPNR2ZStmNpQUCAGpyF6RLWTcjoPUB23bAkdVE', '10',
      { from: deployer })).wait();
    await (await collection.addBatch('299', 'ipfs://ipfs/Qmdy3f5zKm1E5xthJyPC2m5WhgNCiYVPxcwNtbViHR3Pyk', '10',
      { from: deployer })).wait();
    // console.log('Set default uri')
    // await (await collection.setDefaultUri('https://app-staging.nftlegends.io/', 
    //   { from: '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35' })).wait();
    // console.log('Start sale')
    // await (await collection.start({ from: '0xb30eB58f2e560E3b5dadaE5F6c3558Ececb46C35' })).wait();
  }
};