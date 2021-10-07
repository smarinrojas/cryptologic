const RewardToken = artifacts.require("RewardToken");

module.exports = async function(deployer, network, accounts) {

    await deployer.deploy(RewardToken, 100, 5);
    const rewardTokens = await RewardToken.deployed();
}