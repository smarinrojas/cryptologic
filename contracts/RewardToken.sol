// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Token Contract
/// @author Santiago Marin Rojas
/// @notice Token Contract used for staking on the staking contract
contract RewardToken is ERC20, Ownable {

    uint private rewardRate;
    uint private withDrawFee;

    constructor(uint _rewardrate, uint _withdrawfee) ERC20("RewardToken", "RTN") {
      rewardRate = _rewardrate;
      withDrawFee = _withdrawfee;
    }
    
    /// @notice this function is used to create new tokens
    /// @dev decimals by default is 18
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function getRewardRate() public view returns (uint)
    {
      return rewardRate;
    }

    function setRewardRate(uint _rewardrate) external onlyOwner
    {
      require(_rewardrate < 101, 'Reward rate cannot be more than 100');
      rewardRate = _rewardrate;
    }

    function getWithdrawFee() public view returns (uint)
    {
      return withDrawFee;
    }
    
    function setWithdrawFee(uint _withdrawfee) external onlyOwner
    {
      withDrawFee = _withdrawfee;
    }
}