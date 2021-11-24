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

function renderNftTokenListingApprovalButton(
  nftContract,
  dutchAuctionContract,
  nftTokenId
) {
  const nftApproveButton = document.createElement('div');

  nftApproveButton.innerHTML = 'Approve NFT Token for Listing';
  nftApproveButton.classList.add('button', 'approve-button');

  nftApproveButton.addEventListener('click', () => {
    nftContract.approve(dutchAuctionContract.address, nftTokenId);
  });

  nftFormContainer.appendChild(nftApproveButton);
}

function renderForTokenOwner(
  needsApproval,
  nftContract,
  dutchAuctionContract,
  nftTokenId,
  isListingActive,
  nftFormContainer
) {
  if (needsApproval) {
    renderNftTokenListingApprovalButton(
      nftContract,
      dutchAuctionContract,
      nftTokenId
    );
  } else if (!isListingActive) {
    const nftListButton = document.createElement('div');

    nftListButton.innerHTML = 'List NFT Token';
    nftListButton.classList.add('button', 'list-button');

    nftListButton.addEventListener('click', () => {
      dutchAuctionContract.list(nftTokenId, 10, 1, 10);
    });

    nftFormContainer.appendChild(nftListButton);
  }
}

function renderForTokenBuyer(
  dutchAuctionContract,
  nftTokenId,
  isListingActive,
  listingPrice,
  metamaskAccountBalance,
  nftFormContainer
) {
  if (!isListingActive) {
    return;
  }

  const nftBuyButton = document.createElement('div');
  nftBuyButton.innerHTML = 'Buy NFT Token';

  if (metamaskAccountBalance.gte(listingPrice)) {
    console.log(`here`);
    nftBuyButton.classList.add('button', 'buy-button');

    nftBuyButton.addEventListener('click', () => {
      const overrides = {
        value: listingPrice,
      };

      dutchAuctionContract.buy(nftTokenId, overrides);
    });

    nftFormContainer.appendChild(nftBuyButton);
  } else {
    console.log(`there`);
    nftBuyButton.classList.add('button', 'disabled-buy-button');
    nftFormContainer.appendChild(nftBuyButton);

    const notEnoughFundsMsg = document.createElement('div');
    notEnoughFundsMsg.innerHTML = '<em>Not enough funds to buy token</em>';
    notEnoughFundsMsg.classList.add('not-enough-funds-msg');

    nftFormContainer.appendChild(nftBuyButton);
    nftFormContainer.appendChild(notEnoughFundsMsg);
  }
}

export function renderNftTokenForm(
  nftContract,
  nftTokenId,
  dutchAuctionContract,
  metamaskAccountAddr,
  metamaskAccountBalance,
  tokenOwnerAddr,
  needsApproval,
  isListingActive,
  listingPrice
) {
  const nftFormContainer =
    document.getElementsByClassName('nft-form-container')[0];

  if (metamaskAccountAddr === tokenOwnerAddr) {
    renderForTokenOwner(
      needsApproval,
      nftContract,
      dutchAuctionContract,
      nftTokenId,
      isListingActive,
      nftFormContainer
    );
  } else {
    renderForTokenBuyer(
      dutchAuctionContract,
      nftTokenId,
      isListingActive,
      listingPrice,
      metamaskAccountBalance,
      nftFormContainer
    );
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

export function renderNftTokenListings(nftTokenId, nftTokenListings) {
  renderActiveNftListing(nftTokenId, undefined);
  renderInactiveNftListings(nftTokenId, []);
}
