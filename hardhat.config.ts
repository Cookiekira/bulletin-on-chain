import { vars, type HardhatUserConfig } from 'hardhat/config.js'
import '@nomicfoundation/hardhat-toolbox-viem'

const SEPOLIA_PRIVATE_KEY = vars.get('SEPOLIA_PRIVATE_KEY')
const INFURA_API_KEY = vars.get('INFURA_API_KEY')
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY')

const config: HardhatUserConfig = {
  solidity: '0.8.27',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }
}

export default config
