require('dotenv').config();

require('@nomiclabs/hardhat-ethers');

require('./tasks/dutch-auction');
require('./tasks/nft');

module.exports = {
  solidity: '0.8.4',
  paths: {
    artifacts: './app/artifacts',
  },
};
