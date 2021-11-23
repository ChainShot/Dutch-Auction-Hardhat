require('dotenv').config();

require('hardhat/config');

const HARDHAT_LOCAL_NETWORK = 'localhost';
const { PUBLIC_ADDR } = process.env;

task('deploy-dutch-auction', 'Deploy Dutch Auction contract for a given NFT')
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

task(
  'deploy-all',
  'Deploy NFT contract, mint NFT, and deploy Dutch Auction contract for a given NFT'
)
  .addParam('tokenUri', 'Token URI', undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory('Tulip');
    const token = await Token.deploy();

    await token.deployed();

    const [signer] = await hre.ethers.getSigners();

    const publicAddr =
      hre.network.name === HARDHAT_LOCAL_NETWORK ? signer.address : PUBLIC_ADDR;

    const mintNftTxn = await token.mintNft(publicAddr, taskArgs.tokenUri);
    await mintNftTxn.wait();

    const mintNftTxnReceipt = await mintNftTxn.wait();

    const transferEvent = mintNftTxnReceipt.events.find(
      (event) => event.event === 'Transfer'
    );

    const DutchAuction = await hre.ethers.getContractFactory('DutchAuction');
    const dutchAuction = await DutchAuction.deploy(token.address);

    await dutchAuction.deployed();

    console.log('NFT contract deployed to address: ', token.address);

    console.log(`Minted NFT via txn: ${mintNftTxn.hash}`);
    console.log(
      `NFT transferred => from: ${transferEvent.args[0]}, to: ${transferEvent.args[1]}, tokenId: ${transferEvent.args[2]}`
    );

    console.log(
      `Dutch Auction for NFT '${token.address}' contract deployed to address: ${dutchAuction.address}`
    );
  });
