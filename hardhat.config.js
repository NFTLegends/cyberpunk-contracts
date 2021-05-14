require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('hardhat-deploy');
require('hardhat-deploy-ethers');

const accounts = {
  mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk',
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
      forking: {
        enabled: process.env.FORKING === 'true',
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      },
      live: false,
      saveDeployments: false,
      tags: ['test'],
    },
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ['local'],
    },
    rinkeby: {
      url: `wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 3,
      live: true,
      saveDeployments: true,
      tags: ['staging'],
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
  solidity: {
    compilers: [
      {
        version: '0.8.4',
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
