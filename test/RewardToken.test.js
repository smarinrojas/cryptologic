const { assert } = require('chai');
const RewardToken = artifacts.require("RewardToken");
const web3 = require('web3');

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('Reward Token Deploy', ([owner, stakerone, stakertwo]) =>
{
    let rewardToken;
    let rewardRate;
    let withDrawFee;

    before(async() => 
    {
        rewardRate = 100;
        withDrawFee = 5;
        rewardToken = await RewardToken.new(100, 5);
    });

    describe('Initial deploy', async() => 
    {
        it('Initial reward rate is correct', async() => {
            var rewardRate = await rewardToken.getRewardRate();
            assert.equal(rewardRate, 100);
        });

        it('Initial withdraw fee is correct', async() => {
            var withdrawfee = await rewardToken.getWithdrawFee();
            assert.equal(withdrawfee, 5);
        });

        it('Initial mint is correct', async() => {
            await rewardToken.mint(owner, tokens('100'), { from : owner });
            assert.equal(await rewardToken.totalSupply(), tokens('100'));
        });
    });

    describe('Updating data', async() => 
    {
        it('Reward rate is being updated', async() => {
            await rewardToken.setRewardRate(50);
            var rewardRate = await rewardToken.getRewardRate();
            assert.equal(rewardRate, 50);
        });

        it('Reward rate cannot be more than 100', async() => {
            try {
                await rewardToken.setRewardRate(101);
            }
            catch(error)
            {
                var required = error.message.search('cannot be more than 100') >=0;
                assert.isTrue(required);
            } 
        });

        it('Initial withdraw is being updated', async() => {
            await rewardToken.setWithdrawFee(tokens('10'));
            var withdrawfee = await rewardToken.getWithdrawFee();
            assert.equal(withdrawfee, tokens('10'));
        });


    });

    describe('Access control', async() => 
    {
        it('Minting only can be called by the owner', async() => 
        {
            try
            {
                await rewardToken.mint(owner, tokens('100'), { from : stakerone });
            }
            catch(error)
            {
                var required = error.message.search('caller is not the owner') >=0;
                assert.isTrue(required);
            }
        });

        it('Update Withdraw only can be called by the owner', async() =>
        {
            try
            {
                await rewardToken.setWithdrawFee(tokens('50'), { from : stakerone });
            }
            catch(error)
            {
                var required = error.message.search('caller is not the owner') >=0;
                assert.isTrue(required);
            }
        });

        it('Update Reward rate only can be called by the owner', async() =>
        {
            try
            {
                await rewardToken.setRewardRate(50, { from : stakerone });
            }
            catch(error)
            {
                var required = error.message.search('caller is not the owner') >=0;
                assert.isTrue(required);
            }
        });

    });

});