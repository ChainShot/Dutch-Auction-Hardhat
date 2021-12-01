import {
  getDutchAuctionContract,
  getNftContract,
  setDutchAuctionContractAddr,
  setMetamaskAccountAddr,
  setNftTokenId,
  setNftTokenMetaDataUri,
} from './smart-contract-utils';

import {
  render,
  renderApprovalToListingStateChange,
  renderListingToBoughtStateChange,
  renderListingToListedStateChange,
  unrenderAll,
} from './render';

import './index.scss';

const DUTCH_AUCTION_CONTRACT_ADDR = process.env.DUTCH_AUCTION_CONTRACT_ADDR;
const NFT_TOKEN_METADATA_URI = process.env.NFT_TOKEN_METADATA_URI;
const NFT_TOKEN_ID = process.env.NFT_TOKEN_ID;

function registerContractEventListeners() {
  const nftContract = getNftContract();
  const dutchAuctionContract = getDutchAuctionContract();

  nftContract.on('Approval', renderApprovalToListingStateChange);
  dutchAuctionContract.on('List', renderListingToListedStateChange);
  dutchAuctionContract.on('Buy', renderListingToBoughtStateChange);
}

function unregisterContractEventListeners() {
  const nftContract = getNftContract();
  const dutchAuctionContract = getDutchAuctionContract();

  nftContract.off('Approval', renderApprovalToListingStateChange);
  dutchAuctionContract.off('List', renderListingToListedStateChange);
  dutchAuctionContract.off('Buy', renderListingToBoughtStateChange);
}

////////////////////////////////////////////
////////////////////////////////////////////

async function handleAccountsChanged(accounts) {
  // clear all event listeners
  ethereum.removeListener('accountsChanged', handleAccountsChanged);

  unregisterContractEventListeners();

  // if metamask account changes unrender everything and then reload the page
  unrenderAll();

  // TODO set accounts[0] as signer of contracts via signer.connect();
  accounts[0];

  await main(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
}

async function main(dutchAuctionContractAddr, nftTokenMetadataUri, nftTokenId) {
  // if metamask is locked this will open up the metamask dialog to enter password and
  // unlock metamask
  const metamaskAccountAddr = (
    await ethereum.request({ method: 'eth_requestAccounts' })
  )[0];

  setMetamaskAccountAddr(metamaskAccountAddr);
  await setDutchAuctionContractAddr(dutchAuctionContractAddr);
  await setNftTokenMetaDataUri(nftTokenMetadataUri);
  setNftTokenId(nftTokenId);

  ethereum.on('accountsChanged', handleAccountsChanged);

  registerContractEventListeners();

  await render();
}

(async function (dutchAuctionContractAddr, nftTokenMetadataUri, nftTokenId) {
  await main(dutchAuctionContractAddr, nftTokenMetadataUri, nftTokenId);
})(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
