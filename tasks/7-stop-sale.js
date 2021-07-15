const { task } = require('hardhat/config');

task('7-stop-sale', 'stop token sale').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();

  const collectionInstance = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    await (await collectionInstance.stop({ from: deployer })).wait();
    console.log('sale stopped');
  }
});
