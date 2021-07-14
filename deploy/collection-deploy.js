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
    await (await collection.addSaleStage('1', '100000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('2', '1000000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('3', '10000000000000000', { from: deployer })).wait();
    await (await collection.addSaleStage('4', '100000000000000000', { from: deployer })).wait();
  }
};
