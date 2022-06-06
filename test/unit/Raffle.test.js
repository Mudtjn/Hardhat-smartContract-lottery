const { expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { developmentChains , networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ?
    describe.skip 
    : describe("Raffle Unit tests", async function () {
        let raffle, VRFCoordinatorV2Mock, raffleEntranceFee, deployer
        const chainId = network.config.chainId
        
        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            //deploy all with tag of "all"
            raffle = await ethers.getContract("Raffle", deployer)
            VRFCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock", deployer
            )
            raffleEntranceFee = await raffle.getEntranceFee()
        })

        describe("constructor", async function () {
            //initialized raffle correctly
            it("should initialize raffle correctly",
                async function () {
                    const raffleState = await raffle.getRaffleState()
                    const entranceFee = await raffle.getEntranceFee()
                    const interval = await raffle.getInterval()

                    expect(raffleState.toString())
                        .to.equal("0")
                    expect(entranceFee)
                        .to.equal(networkConfig[chainId]["entranceFee"])
                    expect(interval.toString())
                        .to.equal((networkConfig[chainId]["interval"]).toString())
            })
        })

        describe("enter raffle state",
            async function () {
            
                it("reverts when you don't pay enough",
                    async function () {
                        await expect(raffle.enterRaffle())
                            .to.be.revertedWith("Raffle__NotEnoughEthEntered()")
                    })
                
                it("records players when they enter",
                    async function () {
                        await raffle.enterRaffle({
                            value: raffleEntranceFee
                        })
                        const player1 = await raffle.getPlayers(0)
                        expect(player1).to.equal(deployer)
                    })
                it("emit events on entry of player",
                    async function () {
                        await expect(raffle.enterRaffle({
                            value: raffleEntranceFee
                        })).to.emit(
                            raffle, 
                            "RaffleEnter"
                        )
                })
        })
    })
