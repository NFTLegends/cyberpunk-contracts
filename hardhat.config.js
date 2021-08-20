require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('@openzeppelin/hardhat-upgrades');

require('./tasks/1-set-sale-stages.js');
require('./tasks/2-mint-zero-batch-tokens.js');
require('./tasks/3-mint-99-random-tokens.js');
require('./tasks/4-reveal-zero-batch.js');
require('./tasks/4.1-check-batch-owner.js');
require('./tasks/5-start-sale.js');
require('./tasks/6-buy-random-tokens.js');
require('./tasks/7-stop-sale.js');
require('./tasks/8-mint-remaining.js');

const accounts = {
  mnemonic: `${process.env.MNEMONIC}`,
};

module.exports = {
  paths: {
    artifacts: 'artifacts',
    cache: 'cache',
    deploy: 'deploy',
    deployments: 'deployments',
    imports: 'imports',
    sources: 'contracts',
    tests: 'test',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      hardfork: 'berlin',
    },
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ['local'],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_RINKEBY_API_KEY}`,
      accounts,
      chainId: 4,
      live: true,
      saveDeployments: true,
      tags: ['staging'],
      gasPrice: 8000000000,
    },
    mainnet: {
      url: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 1,
      live: true,
      saveDeployments: true,
      tags: ['production'],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
