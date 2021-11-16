require('dotenv').config();

require('hardhat/config');

task('dutch-auction-deploy', 'Deploy Dutch Auction contract for a given NFT')
  .addParam(
    'nftAddress',
    'Address of the NFT contract for the dutch auction',
    undefined,
    types.address
  )
  .setAction(async (taskArgs, hre) => {
    const DutchAuction = await hre.ethers.getContractFactory('DutchAuction');
    const dutchAuction = await DutchAuction.deploy(taskArgs.nftAddress);

    await dutchAuction.deployed();

    console.log(
      `Dutch Auction for NFT '${taskArgs.nftAddress}' contract deployed to address: ${dutchAuction.address}`
    );
  });
