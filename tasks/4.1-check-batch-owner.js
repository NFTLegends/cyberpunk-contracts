const { task } = require('hardhat/config');

task('4.1-check-batch-owner', 'check batch owner').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const collection = await ethers.getContract('Collection');
  console.log('tokenURI: ', await collection.tokenURI(0));
});
