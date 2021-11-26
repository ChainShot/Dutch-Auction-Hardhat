import { ethers } from 'ethers';

function unrenderNftTokenListingApprovalButton(nftFormContainer) {
  const nftApproveButton = document.getElementsByClassName('approve-button')[0];

  try {
    nftFormContainer.removeChild(nftApproveButton);
  } catch (error) {
    // silently ignore for simplicity
  }
}

function renderNftTokenListingApprovalButton({
  nftContract,
  dutchAuctionContract,
  nftTokenId,
  nftFormContainer,
}) {
  const nftApproveButton = document.createElement('div');

  nftApproveButton.innerHTML = 'Approve NFT Token for Listing';
  nftApproveButton.classList.add('button', 'approve-button');

  nftApproveButton.addEventListener('click', () => {
    nftContract.approve(dutchAuctionContract.address, nftTokenId);
  });

  nftFormContainer.appendChild(nftApproveButton);
}

function renderNftTokenListingForm(
  dutchAuctionContract,
  nftTokenId,
  nftFormContainer
) {
  const tokenListingFormTable = document.createElement('table');
  tokenListingFormTable.classList.add('token-listing-form-table');
  tokenListingFormTable.innerHTML =
    '<tr><th style="width: 35%">Starting price</th><td><input id="starting-price" type="text" name="startingPrice"></td><td><strong>ETH</strong></td></tr>';

  tokenListingFormTable.innerHTML +=
    '<tr><th>Reduction rate</th><td><input id="reduction-rate" type="text" name="reductionRate"></td><td><strong>Finney per ms</strong></td></tr>';

  tokenListingFormTable.innerHTML +=
    '<tr><th>Ends in</th><td><input id="duration" type="text" name="duration"></td>' +
    '<td><select id="duration-units" name="durationUnits"><option>Minutes</option><option>Hours</option><option>Days</option></select></td></tr>';

  const nftListButton = document.createElement('div');

  nftListButton.innerHTML = 'List NFT Token';
  nftListButton.classList.add('button', 'list-button');

  nftListButton.addEventListener('click', () => {
    const startingPrice = document.getElementById('starting-price').value;
    const reductionRate = document.getElementById('reduction-rate').value;
    const durationValue = document.getElementById('duration').value;
    const durationUnits = document.getElementById('duration-units').value;

    let duration;

    if (durationUnits === 'Minutes') {
      duration = ethers.BigNumber.from(+durationValue);
    } else if (durationUnits === 'Hours') {
      duration = ethers.BigNumber.from(+durationValue * 60);
    } else {
      duration = ethers.BigNumber.from(+durationValue * 60 * 24);
    }

    const priceReductionRate = ethers.utils.parseUnits(reductionRate, 'finney');

    // dutchAuctionContract.list(
    //   nftTokenId,
    //   ethers.utils.parseEther(startingPrice),
    //   priceReductionRate,
    //   duration
    // );

    dutchAuctionContract.list(1n, ethers.utils.parseEther('10'), 1n, 1n);
  });

  nftFormContainer.appendChild(tokenListingFormTable);
  nftFormContainer.appendChild(nftListButton);
}

function renderForTokenOwner({
  needsApproval,
  nftContract,
  dutchAuctionContract,
  nftTokenId,
  nftTokenActiveListing,
  nftFormContainer,
}) {
  if (needsApproval) {
    renderNftTokenListingApprovalButton({
      nftContract,
      dutchAuctionContract,
      nftTokenId,
      nftFormContainer,
    });
  } else if (typeof nftTokenActiveListing === 'undefined') {
    renderNftTokenListingForm(
      dutchAuctionContract,
      nftTokenId,
      nftFormContainer
    );
  }
}

function renderForTokenBuyer({
  dutchAuctionContract,
  nftTokenId,
  nftTokenActiveListing,
  metamaskAccountBalance,
  nftFormContainer,
}) {
  if (typeof nftTokenActiveListing === 'undefined') {
    return;
  }

  const nftBuyButton = document.createElement('div');
  nftBuyButton.innerHTML = 'Buy NFT Token';

  const currentPrice = ethers.BigNumber.from(
    nftTokenActiveListing.currentPrice.split('.')[0]
  );

  if (metamaskAccountBalance.gte(currentPrice)) {
    nftBuyButton.classList.add('button', 'buy-button');

    nftBuyButton.addEventListener('click', () => {
      const overrides = {
        value: currentPrice,
      };

      dutchAuctionContract.buy(nftTokenId, overrides);
    });

    nftFormContainer.appendChild(nftBuyButton);
  } else {
    nftBuyButton.classList.add('button', 'disabled-buy-button');
    nftFormContainer.appendChild(nftBuyButton);

    const notEnoughFundsMsg = document.createElement('div');
    notEnoughFundsMsg.innerHTML = '<em>Not enough funds to buy token</em>';
    notEnoughFundsMsg.classList.add('not-enough-funds-msg');

    nftFormContainer.appendChild(nftBuyButton);
    nftFormContainer.appendChild(notEnoughFundsMsg);
  }
}

export function renderApprovalToListingStateChange(
  dutchAuctionContract,
  nftTokenId
) {
  const nftFormContainer =
    document.getElementsByClassName('nft-form-container')[0];

  unrenderNftTokenListingApprovalButton(nftFormContainer);

  renderNftTokenListingForm(dutchAuctionContract, nftTokenId, nftFormContainer);
}

export function renderNftToken(nftMetadata) {
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

export function renderNftTokenForm({
  nftContract,
  nftTokenId,
  dutchAuctionContract,
  metamaskAccountAddr,
  metamaskAccountBalance,
  tokenOwnerAddr,
  needsApproval,
  nftTokenActiveListing,
}) {
  const nftFormContainer =
    document.getElementsByClassName('nft-form-container')[0];

  renderActiveNftListing(nftTokenActiveListing, nftFormContainer);

  if (metamaskAccountAddr === tokenOwnerAddr) {
    renderForTokenOwner({
      needsApproval,
      nftContract,
      dutchAuctionContract,
      nftTokenId,
      nftTokenActiveListing,
      nftFormContainer,
    });
  } else {
    renderForTokenBuyer({
      dutchAuctionContract,
      nftTokenId,
      nftTokenActiveListing,
      metamaskAccountBalance,
      nftFormContainer,
    });
  }
}

function renderActiveNftListing(nftTokenActiveListing) {
  if (typeof nftTokenActiveListing === 'undefined') {
    return;
  }

  const nftFormContainer =
    document.getElementsByClassName('nft-form-container')[0];

  const containerHeader = document.createElement('h3');
  containerHeader.classList.add('active-listing-header');
  containerHeader.innerHTML = 'Active Listing';

  nftFormContainer.appendChild(containerHeader);

  const nftActiveListingContainer = document.createElement('div');
  nftActiveListingContainer.classList.add('nft-active-listing-table-container');

  const nftActiveListingTable = document.createElement('table');
  nftActiveListingTable.classList.add('nft-active-listing-table');

  const listingId = nftTokenActiveListing.listingId;
  const price = nftTokenActiveListing.currentPrice;
  const startDate =
    nftTokenActiveListing.startDate.toISOString().split('.')[0] + 'Z';
  const endDate =
    nftTokenActiveListing.endDate.toISOString().split('.')[0] + 'Z';

  let innerHTML =
    `<tr><th>Listing Id</th><th>Price</th><th>Start Date</th><th>End Date</th></tr>` +
    `<tr><td>${listingId}</td><td>${price}</td><td>${startDate}</td><td>${endDate}</td></tr>`;

  nftActiveListingTable.innerHTML = innerHTML;

  nftActiveListingContainer.appendChild(nftActiveListingTable);
  nftFormContainer.appendChild(nftActiveListingContainer);
}

function renderPreviousNftListings(nftTokenListings) {
  const nftPreviousListingsContainer = document.getElementsByClassName(
    'nft-previous-listings-container'
  )[0];

  if (
    typeof nftTokenListings === 'undefined' ||
    nftTokenListings.length === 0
  ) {
    const nftPreviousListings = document.createElement('div');
    nftPreviousListings.innerHTML =
      '<h3 style="margin: auto; width: 50%; text-align: center"><em>None</em></h3>';
    nftPreviousListingsContainer.appendChild(nftPreviousListings);

    return;
  }

  const nftPreviousListingsTableContainer = document.createElement('div');
  nftPreviousListingsTableContainer.classList.add(
    'nft-previous-listings-table-container'
  );

  const nftPreviousListingsTable = document.createElement('table');
  nftPreviousListingsTable.classList.add('nft-previous-listings-table');

  let innerHTML = `<tr><th>Listing Id</th><th>Start Price</th><th>Start Date</th><th>End Date</th><th>Sold</th><th>Sold Date</th><th>Sold Price</th></tr>`;

  nftTokenListings.forEach((nftTokenListing) => {
    const listingId = nftTokenListing.listingId;
    const startPrice = nftTokenListing.startPrice;
    const startDate =
      nftTokenListing.startDate.toISOString().split('.')[0] + 'Z';
    const endDate = nftTokenListing.endDate.toISOString().split('.')[0] + 'Z';
    const sold = nftTokenListing.sold;
    const soldDate = nftTokenListing.soldDate.toISOString().split('.')[0] + 'Z';
    const soldPrice = nftTokenListing.soldPrice;

    innerHTML += `<tr><td>${listingId}</td><td>${startPrice}</td><td>${startDate}</td><td>${endDate}</td><td>${sold}</td><td>${soldDate}</td><td>${soldPrice}</td></tr>`;
  });

  nftPreviousListingsTable.innerHTML = innerHTML;

  nftPreviousListingsTableContainer.appendChild(nftPreviousListingsTable);
  nftPreviousListingsContainer.appendChild(nftPreviousListingsTableContainer);
}

export function renderNftTokenListings(
  nftTokenActiveListing,
  nftTokenListings
) {
  console.log(
    `nftTokenListings = ${JSON.stringify(nftTokenListings, undefined, 2)}`
  );
  console.log(
    `nftTokenActiveListing = ${JSON.stringify(
      nftTokenActiveListing,
      undefined,
      2
    )}`
  );

  renderPreviousNftListings(nftTokenListings);
}
