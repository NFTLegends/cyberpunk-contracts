const { task } = require('hardhat/config');

task('4-reveal-zero-batch', 'reveal zero batch').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();

  const collectionInstance = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    await (
      await collectionInstance.addBatch(3, 'ipfs://ipfs/QmfMUkL4YKfHpP9ZubfPXQMb455nnWDGBdjBPVdpfpfVgy', 0, {
        from: deployer,
      })
    ).wait();
    console.log('batch is revealed');
  }
});
