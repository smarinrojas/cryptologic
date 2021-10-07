const { assert } = require('chai');

const Staker = artifacts.require("Staker");
const RewardToken = artifacts.require("RewardToken");

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('Staker Test', ([owner, stakerone, stakertwo]) =>
{
    let staker;
    let rewardtoken;
    let enableWithdraw;

    before(async() => 
    {
        rewardRate = 100;
        enableWithdraw = true;

        rewardtoken = await RewardToken.new(rewardRate, tokens('5'));
        
        //Initial min of 200 tokens
        await rewardtoken.mint(owner, tokens('200'));

        // Send tokens to stakers
        await rewardtoken.transfer(stakerone, tokens('50'), { from: owner });
        await rewardtoken.transfer(stakertwo, tokens('50'), { from: owner });

        staker = await Staker.new(rewardtoken.address, enableWithdraw);
    });

    describe('Initial deploy', async() => 
    {
        it('Initial staking is zero', async() => {
            var totalStaked = await staker.getTotalStaked();
            assert.equal(totalStaked, 0);
        });

        it('Initial token balance is 100', async() => {
            var initialBalance = await rewardtoken.balanceOf(owner);
            assert.equal(initialBalance, tokens('100'));
        });
    });

    describe('deposit', async() => 
    {
        it('Users start staking', async() => 
        {
            await rewardtoken.approve(staker.address, tokens('50'), { from: stakerone })
            await staker.deposit(tokens('50'), { from : stakerone });
            var totalstake = await staker.getTotalStakedByAddress({from : stakerone });
            assert.equal(totalstake, tokens('50'));

            await rewardtoken.approve(staker.address, tokens('50'), { from: stakertwo })
            await staker.deposit(tokens('50'), { from : stakertwo });
            var totalstaketwo = await staker.getTotalStakedByAddress({from : stakertwo });
            assert.equal(totalstaketwo, tokens('50'));

            var totalStaked = await staker.getTotalStaked();
            assert.equal(totalStaked, tokens('100'));
        });
    });

    describe('Rewards', async() => 
    {
        it('Reward calculation is correct', async() => 
        {
            rewardtoken.setRewardRate(100);
            // Send tokens to the staking contract to be allocated
            await rewardtoken.transfer(staker.address, tokens('100'));

            var totalBalance =  await rewardtoken.balanceOf(staker.address);
            assert.equal(totalBalance, tokens('200'));

            var rewardAmount = await staker.calculateRewardAmount(stakerone, tokens('100'));
            assert.equal(rewardAmount.toString(), tokens('50'));

            var rewardAmountTwo = await staker.calculateRewardAmount(stakertwo, tokens('100'));
            assert.equal(rewardAmountTwo, tokens('50'));
        });

        it('Reward allocation is executed successfully', async() => 
        {
            await staker.allocaterewards();

            var stakingBalance = await staker.getTotalStakedByAddress({ from : stakerone });
            assert.equal(stakingBalance, tokens('100'));

            var stakingTwoBalance = await staker.getTotalStakedByAddress({ from : stakertwo });
            assert.equal(stakingTwoBalance.toString(), tokens('100'));

            var totalStaked = await staker.getTotalStaked();
            assert.equal(totalStaked, tokens('200'));
        });        
    });
    
    describe('Withdraw', async() => 
    {
        it('Withdraw is being execute sucessfully', async() => 
        {
            await staker.withdraw({ from : stakerone });
            
            var stakingBalance = await staker.getTotalStakedByAddress({ from : stakerone });
            assert.equal(stakingBalance, 0);

            var totalStaked = await staker.getTotalStaked();
            assert.equal(totalStaked, tokens('100'));

            var totalStakedByStaker = await staker.getTotalStakedByAddress({ from : stakerone});
            assert.equal(totalStakedByStaker, 0);

            //var withdrawfee = await rewardtoken.getWithdrawFee();
            var totaltokensearned = await rewardtoken.balanceOf(stakerone);
            assert.equal(totaltokensearned, tokens('95'));
        }); 

        it('Withdraw cant be executed if disabled', async() => 
        {
            await staker.setWithdrawStatus(false);

            try
            {
                await staker.withdraw({ from : stakerone });
            }
            catch(error)
            {
                var required = error.message.search('Withdraw is not enabled') >=0;
                assert.isTrue(required);
            }
        });
    });
});