const { task } = require('hardhat/config');

task('1-set-sale-stage', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  const chainId = await hre.getChainId();
  const collectionInstance = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    console.log('Add saleStage 1');
    await (
      await collectionInstance.addSaleStage('100', '100000000000000', {
        from: deployerAddress,
      })
    ).wait();
    console.log('Add saleStage 2');
    await (
      await collectionInstance.addSaleStage('200', '1000000000000000', {
        from: deployerAddress,
      })
    ).wait();
    console.log('Add saleStage 3');
    await (
      await collectionInstance.addSaleStage('300', '10000000000000000', {
        from: deployerAddress,
      })
    ).wait();
  }
});
