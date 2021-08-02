module.exports = async({ ethers, deployments, getChainId }) => {
  const { deploy } = deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  const vaultAddress = listAccounts[1];

  const chainId = await getChainId();

  await deploy('Collection', {
    from: deployerAddress,
    gasLimit: 4000000,
    args: [],
    log: true,
  });

  const collection = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    console.log('Add batchManagerRole');
    await (this.batchManagerRole = await collection.BATCH_MANAGER_ROLE());
    await (await collection.grantRole(this.batchManagerRole, deployerAddress)).wait();
    console.log('Add vaultRole');
    await (this.vaultRole = await collection.VAULT_SETTER_ROLE());
    await (await collection.grantRole(this.vaultRole, deployerAddress)).wait();
    console.log('Add saleAdminRole');
    await (this.saleAdminRole = await collection.SALE_ADMIN_ROLE());
    await (await collection.grantRole(this.saleAdminRole, deployerAddress)).wait();
    console.log('Add defaultUriRole');
    await (this.defaultUriRole = await collection.DEFAULT_URI_SETTER_ROLE());
    await (await collection.grantRole(this.defaultUriRole, deployerAddress)).wait();
    console.log('Add minterRole');
    await (this.minterRole = await collection.MINTER_ROLE());
    await (await collection.grantRole(this.minterRole, deployerAddress)).wait();
    console.log('Set vault');
    await (await collection.setVault(vaultAddress, { from: deployerAddress })).wait();
    console.log('Set default uri');
    await (
      await collection.setDefaultUri('https://ipfs.io/ipfs/Qmahe3tFGHsbVSHa7i7wBKo6uEJ7MeGqS8t9qCQw4qFjo2', {
        from: deployerAddress,
      })
    ).wait();
  }
};
