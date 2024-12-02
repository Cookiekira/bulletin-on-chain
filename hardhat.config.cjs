/* eslint-disable @typescript-eslint/no-require-imports */
const { vars } = require('hardhat/config')
require('@nomicfoundation/hardhat-toolbox-viem')

const SEPOLIA_PRIVATE_KEY = vars.get('SEPOLIA_PRIVATE_KEY')
const INFURA_API_KEY = process.env.INFURA_API_KEY ?? vars.get('INFURA_API_KEY')
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY', '')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.27',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: vars.has('SEPOLIA_PRIVATE_KEY') ? [SEPOLIA_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }
}
