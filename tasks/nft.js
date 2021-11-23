require('dotenv').config();

require('hardhat/config');

const HARDHAT_LOCAL_NETWORK = 'localhost';
const { PUBLIC_ADDR } = process.env;

task('deploy-nft', 'Deploy NFT token contract', async (_, hre) => {
  const NFT = await hre.ethers.getContractFactory('Tulip');
  const token = await NFT.deploy();

  await token.deployed();

  console.log('NFT contract deployed to address: ', token.address);
});

task('nft-mint', 'Mint an NFT token')
  .addParam(
    'nftAddress',
    'Address of the NFT contract address',
    undefined,
    types.address
  )
  .addParam('tokenUri', 'Token URI', undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory('Tulip');
    const token = await Token.attach(taskArgs.nftAddress);

    console.log(`Connected to NFT contract at address = ${token.address}`);

    const [signer] = await hre.ethers.getSigners();

    const publicAddr =
      hre.network.name === HARDHAT_LOCAL_NETWORK ? signer.address : PUBLIC_ADDR;

    const mintNftTxn = await token.mintNft(publicAddr, taskArgs.tokenUri);
    await mintNftTxn.wait();

    const mintNftTxnReceipt = await mintNftTxn.wait();

    const transferEvent = mintNftTxnReceipt.events.find(
      (event) => event.event === 'Transfer'
    );

    console.log(`Minted NFT via txn: ${mintNftTxn.hash}`);
    console.log(
      `NFT transferred => from: ${transferEvent.args[0]}, to: ${transferEvent.args[1]}, tokenId: ${transferEvent.args[2]}`
    );
  });

task('nft-token-uri', 'Get the Token URI for given NFT token id')
  .addParam(
    'nftAddress',
    'Address of the NFT contract address',
    undefined,
    types.address
  )
  .addParam('tokenId', 'Token URI', undefined, types.BigNumber)
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory('Tulip');
    const token = await Token.attach(taskArgs.nftAddress);

    console.log(`Connected to NFT contract at address = ${token.address}`);

    const tokenUri = await token.tokenURI(taskArgs.tokenId);

    console.log(`NFT Token URI for token id ${taskArgs.tokenId}: ${tokenUri}`);
  });
