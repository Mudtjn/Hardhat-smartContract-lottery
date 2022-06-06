const { expect, assert } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require('hardhat');
const { developmentChains , networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ?
    describe.skip 
    : describe("Raffle Unit tests", function () {
        let raffle, VRFCoordinatorV2Mock, raffleEntranceFee, deployer, interval
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
            interval = await raffle.getInterval()
        })

        describe("constructor", function () {
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
            function () {
            
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
                
                it("doesn't allow entrance when raffle is calculating",
                    async function () {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        //for this test we have to checkupkeep to be true
                        // so that performUpKeep is performed
                        // and raffle state changes to calculating 
                        await network.provider.send("evm_increaseTime", [interval.toNumber()-1])                        
                        await network.provider.send("evm_mine", [])
                        //pretend to be chainlink keeper
                        await raffle.performUpkeep([])
                        await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
                            .to.be.revertedWith("Raffle__NotOpen()")
                    })
            })
        describe("checkUpkeep",
            function () {
                it("returns false if people have not sent any ETH",
                    async function () {
                        await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                        await network.provider.request({method: "evm_mine", params: []})
                        //call checkUpkeep
                        //simulate callUpkeep using callStatic
                        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                        assert(!upkeepNeeded)
                    })
                
                it("returns false if raffle is not open",
                    async function () {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        await network.provider.send("evm_increaseTime", [interval.toNumber()-1])                        
                        await network.provider.send("evm_mine", [])
                        await raffle.performUpkeep([])
                        const raffleState = await raffle.getRaffleState()
                        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                        assert.equal(raffleState.toString(), "1")
                        assert(!upkeepNeeded)
                    })
                it("returns false if enough time hasn't passed",
                    async () => {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
                        await network.provider.request({ method: "evm_mine", params: [] })
                        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                        assert(!upkeepNeeded)
                    })
                
                it("returns true if enough time has passed, has players, eth, and is open",
                    async () => {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                        await network.provider.send("evm_mine", [] )
                        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                        assert.equal( upkeepNeeded , true )
                    })                
            })
        
        describe("performUpkeep",
            function () {
                it("should only run if checkUpkeep is true",
                    async function () {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        await network.provider.send(
                            "evm_increaseTime",
                            [interval.toNumber()+1]
                        )
                        await network.provider.send("evm_mine",[])
                        const tx = await raffle.performUpkeep([])
                        // console.log(tx)
                        assert(tx)
                    })
                it("reverts when checkUpkeep is not true",
                    async function () {
                        await expect(raffle.performUpkeep([]))
                        .to.be.revertedWith("Raffle__UpkeepNotNeeded")
                    })
                
                it("updates the raffle state , emits an event, and calls the vrf coordinator",
                    async function () {
                        await raffle.enterRaffle({ value: raffleEntranceFee })
                        await network.provider.send(
                            "evm_increaseTime",
                            [interval.toNumber()+1]
                        )
                        await network.provider.send("evm_mine",[])
                        const txResponse = await raffle.performUpkeep([])
                        const txReceipt = await txResponse.wait(1)
                        const requestId = txReceipt.events[1].args.requestId
                        const raffleState = await raffle.getRaffleState()
                        assert(requestId.toNumber() > 0)
                        assert(raffleState.toString() == "1")
                    })
            })
        
        describe("fulfillRandomWords",
            function () {
                beforeEach(async function () {
                    await raffle.enterRaffle({ value: raffleEntranceFee })
                    await network.provider.send(
                        "evm_increaseTime",
                        [interval.toNumber() + 1]
                    )
                    await network.provider.send("evm_mine", [])   
                })

                it("can only be called after performUpkeep",
                    async function () {
                        await expect(VRFCoordinatorV2Mock.fulfillRandomWords(0, raffle.address))
                            .to.be.revertedWith("nonexistent request")
                        await expect(VRFCoordinatorV2Mock.fulfillRandomWords(1, raffle.address))
                            .to.be.revertedWith("nonexistent request")
                    })
                
                it("picks a winner, resets lottery , and sends money",
                    async function () {
                        const additionalEntrants = 3
                        const startingAccountIndex = 1
                        const accounts = await ethers.getSigners()
                        for (
                            let i = startingAccountIndex; 
                            i < startingAccountIndex + additionalEntrants;
                            i++
                        ){
                            const raffleConnectAccount = await raffle.connect(accounts[i])
                            await raffleConnectAccount.enterRaffle({value: raffleEntranceFee})
                        }
                        const startingTimeStamp = await raffle.getLatestTimestamp()
                        const initialNumPlayers = await raffle.getNumberOfPlayers()
                        //performUpKeep(mock being chainlink keeper)
                        //fulfillRandomWords(mock being chainlink VRF)
                        // we will have to wait for fulfillRandomWords to be called

                        await new Promise(async function (resolve, reject) {
                            //listener
                            raffle.once("WinnerPicked", async function () {
                                // console.log("Found WinnerPicked Event!!!")
                                try {
                                    const recentWinner = await raffle.getRecentWinner()

                                    // console.log(`The winner is : ${recentWinner}`)
                                    // console.log(`account 0 : ${accounts[0].address}`)
                                    // console.log(`account 1 : ${accounts[1].address}`)
                                    // console.log(`account 2 : ${accounts[2].address}`)
                                    // console.log(`account 3 : ${accounts[3].address}`)
                                    
                                    const raffleState = await raffle.getRaffleState()
                                    const endingTimeStamp = await raffle.getLatestTimestamp()
                                    const numPlayers = await raffle.getNumberOfPlayers()
                                    const winnerFinalBalance = await accounts[1].getBalance()
                                    //s_players array has been reset to zero
                                    assert.equal(numPlayers.toString(), "0")
                                    assert.equal(raffleState.toString(), "0")
                                    assert(endingTimeStamp > startingTimeStamp )
                                    assert.equal(
                                        (winnerFinalBalance.sub(winnerStartingBalance)).toString(),
                                        (initialNumPlayers * raffleEntranceFee).toString()
                                    )

                                } catch (e) {
                                    reject(e)
                                }
                                resolve()
                            })
                            //will listen all events emit inside promise

                            const tx = await raffle.performUpkeep([])
                            const txReceipt = await tx.wait(1)
                            const winnerStartingBalance = await accounts[1].getBalance()
                            await VRFCoordinatorV2Mock.fulfillRandomWords(
                                txReceipt.events[1].args.requestId, 
                                raffle.address
                            )
                        })

                })
        })
    })
