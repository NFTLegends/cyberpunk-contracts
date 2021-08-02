const { task } = require('hardhat/config');

task('8-mint-remaining', 'set token sale stages').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];
  const tokenHolder = listAccounts[1];

  const chainId = await hre.getChainId();
  const collectionInstance = await ethers.getContract('Collection');

  if (chainId === '31337' || chainId === '1337' || chainId === '4') {
    let tokenIndex;
    const maxTotalSupply = await collectionInstance.maxTotalSupply();

    for (tokenIndex = 0; tokenIndex < maxTotalSupply; tokenIndex++) {
      try {
        console.log(`check if the ${tokenIndex} token has an owner`);
        await collectionInstance.ownerOf(tokenIndex);
      } catch (e) {
        console.log(`${tokenIndex} token hasn't owner. Mint him`);
        await (
          await collectionInstance.mint(tokenHolder, tokenIndex, {
            from: deployerAddress,
          })
        ).wait();
      }
    }
  }
});
