// test helper vars and functions to reduce repetitive code in the tests

const { ethers } = require('hardhat');

const TOKEN_URI =
  'https://gateway.pinata.cloud/ipfs/QmTxbn5FMxrbPhvCpLDHZA7bhjNXPtY1LEoNApHUrTDUE6';

async function deployNft() {
  const Tulip = await ethers.getContractFactory('Tulip');
  const tulip = await Tulip.deploy();

  await tulip.deployed();

  return tulip;
}

async function mintNftToken(nftContract, tokenOwnerAddress) {
  const Tulip = await ethers.getContractFactory('Tulip');
  const tulip = await Tulip.attach(nftContract.address);

  const mintNFTTxn = await tulip.mintNFT(tokenOwnerAddress, TOKEN_URI);
  const mintNFTTxnReceipt = await mintNFTTxn.wait();

  const transferEvent = mintNFTTxnReceipt.events.find(
    (event) => event.event === 'Transfer'
  );

  // per the ERC721 Transfer event, the token id is the 3rd arg of the event
  // reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol
  return transferEvent.args[2];
}

async function deployDutchAuction() {
  const nftContract = await deployNft();
  const DutchAuction = await ethers.getContractFactory('DutchAuction');
  const dutchAuction = await DutchAuction.deploy(nftContract.address);

  await dutchAuction.deployed();

  return dutchAuction;
}

exports.deployNft = deployNft;
exports.mintNftToken = mintNftToken;
exports.deployDutchAuction = deployDutchAuction;