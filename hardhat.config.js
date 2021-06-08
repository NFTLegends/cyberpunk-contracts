require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('hardhat-deploy');
require('hardhat-deploy-ethers');

const accounts = {
  mnemonic: 'truck elbow mushroom wrong wall gossip odor ceiling plastic pole cost undo',
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
      url: 'https://rinkeby.infura.io/v3/ddd04662161d4ff8925007116003eec2',
      accounts,
      chainId: 4,
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
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
