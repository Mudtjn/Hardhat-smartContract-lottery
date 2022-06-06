const { network, ethers, run } = require("hardhat")
const { verify } = require("../utils/verify")
const { networkConfig , developmentChains} = require("../helper-hardhat-config")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId; 
    let VRFCoordinatorV2Address, subscriptionId

    if (chainId == 31337 ) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address
        const transactionResponse = await VRFCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        //Fund the subscription
        await VRFCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        )   
    }
    else {
        VRFCoordinatorV2Address = networkConfig[chainId]["VRFCoordinatorV2Address"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    
    const _args = [
        VRFCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit, 
        interval
    ]
    const raffle = await  deploy("Raffle", {
        from: deployer, 
        args: _args,
        log: true, 
        waitConfirmations: network.config.blockConfirmations || 1, 
    })
    // console.log(`raffle deployed at ${raffle.address}`)

    if ( chainId !==31337 && 
        process.env.ETHERSCAN_API_KEY
    ) { 
        log("Verifying.....")
        await verify(raffle.address, _args)
    }
    
    log("------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
