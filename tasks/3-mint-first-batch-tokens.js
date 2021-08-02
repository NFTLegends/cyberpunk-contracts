const { task } = require('hardhat/config');

task('3-mint-first-batch-tokens', 'Mint token IDs 4 to 29').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const listAccounts = await ethers.provider.listAccounts();
  const deployer = listAccounts[0];
  const tokenHolder = listAccounts[1];

  const chainId = await hre.getChainId();

  const collectionInstance = await ethers.getContract('Collection');
  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    let tokenIndex;
    for (tokenIndex = 4; tokenIndex < 30; tokenIndex++) {
      console.log(`Mint ${tokenIndex} token`);
      await (
        await collectionInstance.mint(tokenHolder, tokenIndex, {
          from: deployer,
        })
      ).wait();
    }
  }
});
