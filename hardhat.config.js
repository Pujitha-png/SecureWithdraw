require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('hardhat-gas-reporter');
require('solidity-coverage');

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        enabled: false,
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 200000,
  },
};
