import { ethers } from 'ethers';

import {
  dutchAuctonNeedsNftTokenApproval,
  getDutchAuctionContract,
  getDutchAuctionContractAddr,
  getMetamaskAccountBalance,
  getNftContract,
  getNftTokenActiveListing,
  getNftTokenId,
  getNftTokenListings,
  getNftTokenMetadata,
  isListingActive,
  isTokenOwner,
} from './smart-contract-utils';

const CURRENT_PRICE_POLLING_INTERVAL = 5000;

let currentPriceTimer;

const nftName = document.getElementById('nft-name');
const nftDescription = document.getElementById('nft-description');
const nftAttributes = document.getElementById('nft-attributes');
const nftImageContainer = document.getElementById('nft-image-container');
const nftListingContainer = document.getElementById('nft-listing-container');
const nftPreviousListingsContainer = document.getElementById(
  'nft-previous-listings-container'
);

async function renderPreviousNftListings() {
  const previousListingsHeader = document.createElement('h2');
  previousListingsHeader.innerHTML = 'Previous Listings';

  nftPreviousListingsContainer.appendChild(previousListingsHeader);

  const { nftTokenListings } = await getNftTokenListings();

  if (nftTokenListings.length === 0) {
    const nftPreviousListings = document.createElement('div');

    nftPreviousListings.innerHTML = '<h3><em>None</em></h3>';
    nftPreviousListingsContainer.appendChild(nftPreviousListings);

    return;
  }

  const nftPreviousListingsTableContainer = document.createElement('div');
  nftPreviousListingsTableContainer.setAttribute(
    'id',
    'nft-previous-listings-table-container'
  );

  const nftPreviousListingsTable = document.createElement('table');
  nftPreviousListingsTable.setAttribute('id', 'nft-previous-listings-table');

  let innerHTML = `
    <tr><th>Auction Id</th><th>Start Price</th><th>Start Date</th><th>End Date</th><th>Sold</th><th>Sold Date</th><th>Sold Price</th></tr>
  `;

  nftTokenListings.forEach((nftTokenListing) => {
    innerHTML += `
      <tr>
        <td>${nftTokenListing.auctionId}</td>
        <td>${nftTokenListing.startPrice}</td>
        <td>${nftTokenListing.startDate}</td>
        <td>${nftTokenListing.endDate}</td>
        <td>${nftTokenListing.sold}</td>
        <td>${nftTokenListing.sold ? nftTokenListing.soldDate : 'N/A'}</td>
        <td>${nftTokenListing.sold ? nftTokenListing.soldPrice : 'N/A'}</td>
      </tr>
    `;
  });

  nftPreviousListingsTable.innerHTML = innerHTML;

  nftPreviousListingsTableContainer.appendChild(nftPreviousListingsTable);
  nftPreviousListingsContainer.appendChild(nftPreviousListingsTableContainer);
}

function renderNftToken() {
  const nftMetadata = getNftTokenMetadata();

  document.getElementById('nft-name').innerHTML = nftMetadata.name;
  document.getElementById('nft-description').innerHTML =
    nftMetadata.description;

  const nftAttributes = document.getElementById('nft-attributes');

  nftMetadata.attributes.forEach((attribute) => {
    const attributeRow = document.createElement('tr');
    attributeRow.innerHTML = `<th class="attribute">${attribute.attributeType}</th><td>${attribute.value}</td>`;
    nftAttributes.appendChild(attributeRow);
  });

  const nftImageContainer = document.getElementById('nft-image-container');

  const nftImage = document.createElement('img');

  nftImage.src = nftMetadata.image;
  nftImageContainer.appendChild(nftImage);
}

function renderNftTokenApprovalButton() {
  if (document.getElementById('approve-button')) {
    return;
  }

  const nftContract = getNftContract();
  const dutchAuctionContractAddr = getDutchAuctionContractAddr();
  const nftTokenId = getNftTokenId();

  const nftApproveButton = document.createElement('div');

  nftApproveButton.innerHTML = `Approve NFT Token for Listing`;
  nftApproveButton.classList.add('button');
  nftApproveButton.setAttribute('id', 'approve-button');

  nftApproveButton.addEventListener('click', async () => {
    await nftContract.approve(dutchAuctionContractAddr, nftTokenId);
  });

  nftListingContainer.appendChild(nftApproveButton);
}

async function renderNftTokenBuyButton() {
  const buyerBalance = await getMetamaskAccountBalance();
  const nftTokenId = getNftTokenId();
  const dutchAuctionContract = getDutchAuctionContract();
  const nftTokenActiveListing = await getNftTokenActiveListing();

  if (typeof nftTokenActiveListing === 'undefined') {
    return;
  }

  const currentPrice = ethers.utils.parseEther(
    nftTokenActiveListing.currentPrice
  );

  const nftBuyButton = document.createElement('div');
  nftBuyButton.innerHTML = 'Buy NFT Token';
  nftBuyButton.setAttribute('id', 'buy-button');
  nftBuyButton.classList.add('button');

  nftListingContainer.appendChild(nftBuyButton);

  if (buyerBalance.gte(currentPrice)) {
    nftBuyButton.addEventListener('click', async () => {
      const overrides = {
        // ethers.js takes a BigNumber value for overrides.value
        value: currentPrice,
      };

      await dutchAuctionContract.buy(nftTokenId, overrides);
    });
  } else {
    nftBuyButton.classList.add('disabled-button');

    const notEnoughFundsMsg = document.createElement('div');
    notEnoughFundsMsg.innerHTML = '<em>Not enough funds to buy token</em>';
    notEnoughFundsMsg.setAttribute('id', 'not-enough-funds-msg');
    nftListingContainer.appendChild(notEnoughFundsMsg);
  }
}

async function renderNftListingContainerForOwner() {
  if (await dutchAuctonNeedsNftTokenApproval()) {
    renderNftTokenApprovalButton();
    return;
  }

  if (!(await isListingActive())) {
    renderNftTokenListingForm();
    return;
  }

  renderActiveNftListing();
}

async function renderNftListingContainerForBuyer() {
  if (!(await isListingActive())) {
    return;
  }

  await renderActiveNftListing();
  renderNftTokenBuyButton();
}

async function renderNftListingContainer() {
  if (await isTokenOwner()) {
    renderNftListingContainerForOwner();
  } else {
    renderNftListingContainerForBuyer();
  }
}

function unrenderNftMetadata() {
  nftName.innerHTML = '';
  nftDescription.innerHTML = '';

  nftAttributes.replaceChildren();
}

function unrenderNftTokenListingApprovalButton() {
  const nftApproveButton = document.getElementById('approve-button');

  if (!nftApproveButton) {
    return;
  }

  nftApproveButton.parentElement.removeChild(nftApproveButton);
}

function unrenderImageContainer() {
  nftImageContainer.replaceChildren();
}

function unrenderNftListingContainer() {
  nftListingContainer.replaceChildren();
}

function unrenderNftPreviousListingsContainer() {
  nftPreviousListingsContainer.replaceChildren();
}

function unrenderNft() {
  unrenderNftMetadata();
  unrenderNftTokenListingApprovalButton();
  unrenderImageContainer();
  unrenderNftListingContainer();
}

export function unrenderAll() {
  clearCurrentPriceTimer();

  unrenderNft();
  unrenderNftPreviousListingsContainer();
}

function clearCurrentPriceTimer() {
  clearTimeout(currentPriceTimer);

  currentPriceTimer = undefined;
}

async function renderNftTokenListingForm() {
  const dutchAuctionContract = getDutchAuctionContract();
  const nftTokenId = getNftTokenId();

  const tokenListingFormTable = document.createElement('table');
  tokenListingFormTable.setAttribute('id', 'token-listing-form-table');

  tokenListingFormTable.innerHTML = `
    <tr>
      <th>Starting price</th>
      <td><input id="starting-price" type="text" name="startingPrice"></td>
      <td><strong>ETH</strong></td>
    </tr>
    <tr>
      <th>Reduction rate</th>
      <td><input id="reduction-rate" type="text" name="reductionRate"></td>
      <td><strong>Finney per second <a href="https://ethdocs.org/en/latest/ether.html">(?)</a></strong></td>
    </tr>
    <tr>
      <th>Ends in</th>
      <td><input id="duration" type="text" name="duration"></td>
      <td><strong>Minutes</strong></td>
    </tr>
  `;

  const nftListButton = document.createElement('div');

  nftListButton.innerHTML = `List NFT Token`;
  nftListButton.setAttribute('id', 'list-button');
  nftListButton.classList.add('button');

  nftListButton.addEventListener('click', async () => {
    const startingPrice = document.getElementById('starting-price').value;
    const reductionRate = document.getElementById('reduction-rate').value;
    const durationValue = document.getElementById('duration').value;

    const duration = ethers.BigNumber.from(+durationValue);

    //
    // remember all the sub-units of Ether? what unit is a finney?
    // ether - 1e18 wei
    // finney - 1e15 wei
    //
    // reference: https://ethdocs.org/en/latest/ether.html
    //
    const priceReductionRate = ethers.utils.parseUnits(reductionRate, 'finney');

    dutchAuctionContract.list(
      nftTokenId,
      ethers.utils.parseEther(startingPrice),
      priceReductionRate,
      duration
    );
  });

  nftListingContainer.appendChild(tokenListingFormTable);
  nftListingContainer.appendChild(nftListButton);
}

async function renderCurrentPrice() {
  clearCurrentPriceTimer();

  const currentPriceElement = document.getElementById('current-price');

  if (!currentPriceElement) {
    return;
  }

  const dutchAuctionContract = getDutchAuctionContract();
  const nftTokenId = getNftTokenId();

  const currentPrice = await dutchAuctionContract.currentPrice(nftTokenId);

  if (!(await dutchAuctionContract.isListingActive(nftTokenId))) {
    renderListedToEndedStateChange();

    return;
  }

  currentPriceElement.innerHTML = ethers.utils.formatEther(currentPrice);

  currentPriceTimer = setTimeout(
    renderCurrentPrice,
    CURRENT_PRICE_POLLING_INTERVAL
  );
}

async function renderActiveNftListing() {
  const nftTokenActiveListing = await getNftTokenActiveListing();

  if (typeof nftTokenActiveListing === 'undefined') {
    return;
  }

  const containerHeader = document.createElement('h3');

  containerHeader.classList.add('active-listing-header');
  containerHeader.setAttribute('id', 'active-listing-header');

  containerHeader.innerHTML = `Active Listing`;

  const nftActiveListingContainer = document.createElement('div');
  nftActiveListingContainer.setAttribute(
    'id',
    'nft-active-listing-table-container'
  );

  const nftActiveListingTable = document.createElement('table');
  nftActiveListingTable.setAttribute('id', 'nft-active-listing-table');

  nftActiveListingTable.innerHTML = `<tr><th>Auction Id</th><th>Price (ETH)</th><th>Start Date</th><th>End Date</th></tr>
    <tr>
      <td>${nftTokenActiveListing.auctionId}</td>
      <td id="current-price">${nftTokenActiveListing.currentPrice}</td>
      <td>${nftTokenActiveListing.startDate}</td>
      <td>${nftTokenActiveListing.endDate}</td>
    </tr>
  `;

  nftListingContainer.appendChild(containerHeader);
  nftActiveListingContainer.appendChild(nftActiveListingTable);
  nftListingContainer.appendChild(nftActiveListingContainer);

  renderCurrentPrice();
}

export function renderApprovalToListingStateChange() {
  unrenderNftTokenListingApprovalButton();

  renderNftListingContainer();
}

export function renderListingToListedStateChange() {
  unrenderNftListingContainer();

  renderNftListingContainer();
}

export function renderListedToEndedStateChange() {
  clearCurrentPriceTimer();

  unrenderNftListingContainer();
  unrenderNftPreviousListingsContainer();

  renderNftListingContainer();
  renderPreviousNftListings();
}

export async function render() {
  renderNftToken();
  renderNftListingContainer();
  renderPreviousNftListings();
}
