// Enter lottery paying some amount
// Pick Random Winner (Verifiably Random)
// Winner to be selected after every X minutes
//chainlink oracle-> Randomness , Automated Execution(Chainlink Keeper)
// Raffle

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed() ;

contract Raffle is VRFConsumerBaseV2 {
    /**State  */
    uint256 private immutable i_minEntranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane ;
    uint64 private immutable i_subscriptionId ;
    uint32 private immutable i_callbackGasLimit ; 
    uint16 private constant REQUEST_CONFIRMATIONS = 3 ; 
    uint32 private constant NUM_WORDS = 1 ; 
    //number of random words wanted
    
    //Lottery variables 
    address private s_recentWinner ; 

    /**Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId); 
    event WinnerPicked(address indexed winner); 

    constructor(
        address _VRFCoordinatorv2,
        uint256 _entraceFee, 
        bytes32 gasLane, 
        uint64 subscriptionId, 
        uint32 callbackGasLimit
        )
        VRFConsumerBaseV2(_VRFCoordinatorv2)
    {
        i_minEntranceFee = _entraceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_VRFCoordinatorv2);
        i_gasLane = gasLane ; 
        i_subscriptionId = subscriptionId ;
        i_callbackGasLimit = callbackGasLimit ; 
    }

    function enterRaffle() public payable {
        if (msg.value < i_minEntranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function requestRandomWinner() external {
        // Request random winner
        // Once we get it , do something with it
        // 2 transaction process
        // Hacker cannot hack by repeatedly calling same func
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //gasLane
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId) ;
    }

    function fulfillRandomWords(
        uint256 requestId, 
        uint256[] memory randomWords)
        internal
        override
    {
        uint256 indexOfWinner = randomWords[0] % (s_players.length) ;
        address payable recentWinner = s_players[indexOfWinner] ;
        s_recentWinner = recentWinner ;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");  
        if(!success){
            revert Raffle__TransferFailed() ; 
        }
        emit WinnerPicked(recentWinner) ;
    }


    function getEntranceFee() public view returns (uint256) {
        return i_minEntranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns(address){
        return s_recentWinner ; 
    }
}
