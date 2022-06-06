const { ethers } = require("hardhat")

const networkConfig = {
    80001: {
        name: "polygon", 
        VRFCoordinatorV2Address: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        subscriptionId: "0", 
        callbackGasLimit: "50000",
        interval: 30 //30 seconds new lottery
    },
    4: {
        name: "rinkeby",
        VRFCoordinatorV2Address: "	0x6168499c0cFfCaCD319c818142124B7A15E857ab", 
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "0",
        callbackGasLimit: "50000",
        interval: 60
    },
    31337: {
        name:"hardhat", 
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        //any gas lane would work here since we are mocking it
        callbackGasLimit: "50000", 
        interval: 30
    }
}

const developmentChains = ["hardhat", "localhost"]


module.exports = {
    networkConfig, 
    developmentChains
}
