// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import './RewardToken.sol';
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Staking contract
/// @author Santiago Marin Rojas
/// @notice Staking contract allows stakers to recieve rewards.
contract Staker is Ownable, ReentrancyGuard 
{
  using SafeMath for uint256;

  RewardToken private rewardToken;
  bool private enabledwithdraw;
  uint private totalStaked;

  mapping(address => bool) private isStaking;
  mapping(address => bool) private hasStaked;

  address[] private stakers;
  mapping(address => uint) private stakingToBalance;

  constructor(RewardToken _rewardToken, bool _enabledwithdraw) ReentrancyGuard()
  {
    rewardToken = _rewardToken;
    enabledwithdraw = _enabledwithdraw;
  }

  /// @notice users can deposit tokens to earn rewards.
  /// @param _stakingamount The number of tokens user wants to stake
  function deposit(uint _stakingamount) nonReentrant() external
  {
    require(_stakingamount > 0, "Staking amount should be greater than 0");

    stakingToBalance[msg.sender] += _stakingamount;
    totalStaked += _stakingamount;

    // Add user to stakers array onlye if they haven't staked already
    if(!hasStaked[msg.sender]) {
        stakers.push(msg.sender);
    }

    // Update staking status
    isStaking[msg.sender] = true;
    hasStaked[msg.sender] = true;

    rewardToken.transferFrom(msg.sender, address(this), _stakingamount);
  }

  /// @notice Withdraw only works if it is enabled. fees apply
  function withdraw() nonReentrant() external
  {
    require(enabledwithdraw, 'Withdraw is not enabled');
    uint balance = stakingToBalance[msg.sender];
    require(balance > 0, "staking balance cannot be 0");

    stakingToBalance[msg.sender] = 0;
    isStaking[msg.sender] = false;
    totalStaked -= balance;

    rewardToken.transfer(msg.sender, balance.sub(rewardToken.getWithdrawFee()));
  }

  /// @notice rewards are calculated and allocated
  /// @dev rewards are calculated proportionaly to the stake amount.
  function allocaterewards() external onlyOwner nonReentrant()
  {
    uint tokenBalance = rewardToken.balanceOf(address(this));
    uint rewardAmountToAllocate = 0;
    uint tempRewards = 0;

    if(tokenBalance > totalStaked){
      rewardAmountToAllocate = tokenBalance.sub(totalStaked);
    }

    require(rewardAmountToAllocate > 0, 'There are not rewards to allocate');

    for (uint i=0; i<stakers.length; i++) 
    {    
        address staker = stakers[i];
        uint rewardAmount = calculateRewardAmount(staker, rewardAmountToAllocate);
        if(rewardAmount > 0) {
          stakingToBalance[staker] += rewardAmount;
          tempRewards += rewardAmount;
        }
    }

    totalStaked += tempRewards;
  }
  
  function getTotalStaked() public view returns (uint)
  {
    return totalStaked;
  }

  function getTotalStakedByAddress() public view returns (uint)
  {
    return stakingToBalance[msg.sender];
  }

  /// @notice rewards are calculated proportionaly to the stake amount.
  /// @dev reward rate is also taken into account.
  /// @param _stakerAddress address of the staker.
  /// @param _rewardsAmount reward amount to be allocated.
  function calculateRewardAmount(address _stakerAddress, uint _rewardsAmount) public view returns (uint)
  { 
    uint stakedBalance = stakingToBalance[_stakerAddress];
    uint influencePercentage = calculateProportionalShare(stakedBalance, totalStaked);
    uint rewardAmount = getRewardAmount(influencePercentage, _rewardsAmount);
    return getRewardAmountByRewardRate(rewardAmount, rewardToken.getRewardRate());
  }

  /// @notice function to enable/disable withdraw
  /// @dev by default is active
  /// @param _enabled set the status
  function setWithdrawStatus(bool _enabled) external onlyOwner
  {
    enabledwithdraw = _enabled;
  }

  /// @notice get the percentage of share accordingly the amount of stake.
  /// @dev by default is active
  /// @param _stakingBalance amount on which the reward will be calculated 
  /// @param _totalStaked amount total staking in the contract 
  function calculateProportionalShare(uint _stakingBalance, uint _totalStaked) internal pure returns (uint)
  { 
    return _stakingBalance.mul(100).div(_totalStaked);
  }

  /// @notice get the amount of rewards corresponding to the percentage of share
  /// @param _proportionalShare amount on which the reward will be calculated 
  /// @param _totalStaked amount total staking in the contract 
  function getRewardAmount(uint _proportionalShare, uint _totalStaked) internal pure returns (uint)
  {
    return _proportionalShare.mul(_totalStaked).div(100);
  }

  /// @notice apply the reward rate, by default is 100%
  /// @param _rewardAmount calculated reward amount
  /// @param _rewardRate reward rate in the token contract.
  function getRewardAmountByRewardRate(uint _rewardAmount, uint _rewardRate) internal pure returns (uint)
  {
    return _rewardAmount.mul(_rewardRate).div(100);
  }
}
