import axios from 'axios';
import { ethers } from 'ethers';

import DutchAuctionArtifact from './artifacts/contracts/DutchAuction.sol/DutchAuction';
import NFTArtifact from './artifacts/contracts/Tulip.sol/Tulip';

import './index.scss';

const DUTCH_AUCTION_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const NFT_TOKEN_ID = 1;
const NFT_TOKEN_METADATA_URI =
  'https://gateway.pinata.cloud/ipfs/QmSvsqbgUe5smqdgtyPGhfF2Xcahr2kDkNr1PT8hJ7REA6';

const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();

async function getDutchAuctionContract() {
  const DutchAuction = new ethers.ContractFactory(
    DutchAuctionArtifact.abi,
    DutchAuctionArtifact.bytecode,
    signer
  );

  return await DutchAuction.attach(DUTCH_AUCTION_ADDRESS);
}

async function getNftTokenListings(dutchAuctionContract, nftTokenId) {
  return await dutchAuctionContract.numAuctionsForNftToken(nftTokenId);
}

async function getNftContract(nftContractAddress) {
  const signer = provider.getSigner();

  const NFT = new ethers.ContractFactory(
    NFTArtifact.abi,
    NFTArtifact.bytecode,
    signer
  );

  return await NFT.attach(nftContractAddress);
}

async function getNftTokenMetadata() {
  return (await axios.get(NFT_TOKEN_METADATA_URI)).data;
}

function renderNftToken(nftMetadata) {
  document.getElementsByClassName('nft-name')[0].innerHTML = nftMetadata.name;
  document.getElementsByClassName('nft-description')[0].innerHTML =
    nftMetadata.description;

  const nftAttributes = document.getElementsByClassName('nft-attributes')[0];

  nftMetadata.attributes.forEach((attribute) => {
    const attributeRow = document.createElement('tr');
    attributeRow.innerHTML = `<th class="attribute">${attribute.attributeType}</th><td>${attribute.value}</td>`;
    nftAttributes.appendChild(attributeRow);
  });

  const nftImageContainer = document.getElementsByClassName(
    'nft-image-container'
  )[0];

  const nftImage = document.createElement('img');
  nftImage.src = nftMetadata.image;

  nftImageContainer.appendChild(nftImage);
}

function renderNftTokenListingForm(
  metamaskAccountAddr,
  tokenOwnerAddr,
  needsApproval
) {
  const nftFormContainer =
    document.getElementsByClassName('nft-form-container')[0];

  if (needsApproval && metamaskAccountAddr === tokenOwnerAddr) {
    const nftApproveButton = document.createElement('div');

    nftApproveButton.innerHTML = 'Approve NFT Token for Listing';
    nftApproveButton.classList.add('button', 'approve-button');

    nftFormContainer.appendChild(nftApproveButton);
  }
}

function renderActiveNftListing(nftTokenId, nftTokenListing) {
  if (typeof nftTokenListing === 'undefined') {
    const nftActiveListingContainer = document.getElementsByClassName(
      'nft-active-listing-container'
    )[0];

    const nftActiveListing = document.createElement('div');
    nftActiveListing.innerHTML = '<h3><em>None</em></h3>';
    nftActiveListingContainer.appendChild(nftActiveListing);

    return;
  }
}

function renderInactiveNftListings(nftTokenId, nftTokenListings) {
  if (
    typeof nftTokenListings === 'undefined' ||
    nftTokenListings.length === 0
  ) {
    const nftInactiveListingsContainer = document.getElementsByClassName(
      'nft-inactive-listings-container'
    )[0];

    const nftInactiveListing = document.createElement('div');
    nftInactiveListing.innerHTML = '<h3><em>None</em></h3>';
    nftInactiveListingsContainer.appendChild(nftInactiveListing);

    return;
  }
}

function renderNftTokenListings(nftTokenId, nftTokenListings) {
  renderActiveNftListing(nftTokenId, undefined);
  renderInactiveNftListings(nftTokenId, []);
}

let metamaskAccountAddr;

(async function () {
  metamaskAccountAddr = (
    await ethereum.request({ method: 'eth_requestAccounts' })
  )[0];

  const dutchAuctionContract = await getDutchAuctionContract();
  const nftContract = await getNftContract(
    await dutchAuctionContract.nftAddress()
  );

  const nftTokenMetadata = await getNftTokenMetadata();

  const nftTokenListings = await getNftTokenListings(
    dutchAuctionContract,
    NFT_TOKEN_ID
  );

  const tokenOwnerAddr = await nftContract.ownerOf(NFT_TOKEN_ID);

  const needsApproval =
    (await nftContract.getApproved(NFT_TOKEN_ID)) !==
    dutchAuctionContract.address;

  renderNftToken(nftTokenMetadata, metamaskAccountAddr, tokenOwnerAddr);
  renderNftTokenListingForm(metamaskAccountAddr, tokenOwnerAddr, needsApproval);

  renderNftTokenListings(NFT_TOKEN_ID, nftTokenListings);

  console.log(`account = ${JSON.stringify(metamaskAccountAddr)}`);
  console.log(`dutchAuctionContract.address = ${dutchAuctionContract.address}`);
  console.log(`nftContract.address = ${nftContract.address}`);
  console.log(
    `nftTokenMetadata = ${JSON.stringify(nftTokenMetadata, undefined, 2)}`
  );

  console.log(`Owner of token id '${NFT_TOKEN_ID}' = ${tokenOwnerAddr}`);
})();
