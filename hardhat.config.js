require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat", 
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
      blockConfirmations: 2,
    },
    hardhat: {
      chainId: 31337, 
      blockConfirmations: 1
    },
    rinkeby: {
      chainId: 4,
      blockConfirmations: 6,
      accounts: [process.env.PRIVATE_KEY],
      url: process.env.RINKEBY_RPC_URL
    }
  },
  solidity: "0.8.9",
  namedAccounts: {
    deployer: {
      default: 0, 
    }, 
    player: {
      default: 1, 
    },
  },
  gasReporter: {
    enabled: true,
    currency: "INR",
    noColors: true,
    token: "ETH",
    outputFile: 'gas_report.txt'
  },
  etherscan: {
     apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 300000, //timeout of max 300 seconds
  }
}
