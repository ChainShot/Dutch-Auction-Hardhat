# Dutch Auction Dapp

This Dutch Auction Dapp is built with [Hardhat](https://hardhat.org/).

## Project Layout

There are three top-level folders:

1. `./app` - contains the front-end application
2. `./contracts` - contains the solidity contract
3. `./nfts` - contains nft assets and metadata
4. `./tasks` - contains hardhat tasks
5. `./tests` - contains tests for the solidity contract

## Setup

Install dependencies in the top-level directory with `npm install`.

After you have installed hardhat locally, you can use commands to test and compile the contracts, among other things. To learn more about these commands run `npx hardhat help`.

Compile the contracts using `npx hardhat compile`. The artifacts will be placed in the `/app` folder, which will make it available to the front-end. This path configuration can be found in the `hardhat.config.js` file.

### Environment

Setup a local `.env` file, which can be based on the file `./.env.example`.

### Upload NFT data to [Pinata](https://www.pinata.cloud/) or similar service.

1. If you don't already have an account on Pinata, setup a free account there now.
2. Once you have an account, upload the file `./nfts/tulip.jpg` to Pinata.
3. After you've uploaded the file, click on the file on the Pinata website. Then copy down the Pinata CID of the uploaded file. The CID is the last part of the Pinanta URL. ie: https://gateway.pinata.cloud/ipfs/CID
4. Copy the file `./nfts/tulip-metadata.json.example` to `./nfts/tulip-metadata.json`.
5. Open the file `./nfts/tulip-metadata.json` and change `<CID>` of the variable `image` to be the Pinata CID that you copied in step 3. Now upload the file `./nfts/tulip-metadata.json` to Pinata as well. Once the file has been uploaded, click on the file on Pinata website.
6. Copy the Pinata URL of the `tulip-metadata.json` you just uploaded and paste the value into your `./env` file as the value of the `NFT_TOKEN_METADATA_URI` variable.

## Run the tests

From the root dir of the project run:

```
npx hardhat test --config hardhat.test.config.js
```

and check that all the tests are passing.

Notice that here we specify a specific Hardhat config file via `--config hardhat.test.config.js`. The reason for this is that in the main `hardhat.config.js` we configure Hardhat to do 'interval mining' (ie: automatically mine blocks every given interval). We need this to simulate the behavior of a real blockchain, which produces blocks with time. However, this is bad for tests as we want them to run quickly. Hardhat's default mining strategy is 'auto mining' which means every time a transaction is sent to the blockchain (not just a query, but a state-changing transaction), which is the mining strategy we want to use for fast tests. You can read more about Hardhat's mining strategy in Hardhat's [Mining Modes](https://hardhat.org/hardhat-network/explanation/mining-modes.html) documentation section.

## Deploying contracts and minting NFTs

This project makes use of custom Hardhat Tasks to do a lot of the command-line administrative work of deploying contracts and minting NFTs. You can find these tasks in `./tasks/nft.js` and `./tasks/dutch-auction.js` respectively.

You can also learn more about the tasks by running:

```
npx hardhat --help
```

to get a list of all the Hardhat tasks.

To get even more specific information about a task you can run:

```
npx hardhat <task_name> --help
```

Hardhat Tasks provide a lot of convenience because they add a lot of CLI functionality, like parsing required CLI arguments and options and validating that the arguments are of the correct type. When a given Hardhat task runs it has all the expected CLI args that the task defines as well as access to the `HardhatRuntimeEnvironment` variable.

You can learn a lot more about Hardhat Tasks in the [HardHat Documentation](https://hardhat.org/guides/create-task.html) and by looking at the example tasks in this project in the `./tasks` dir.

For the purposes of getting this project up and running you only need to run the `deploy-all` task defined in the `./tasks/dutch-auction.js` file.

The `deploy-all` task does 3 things:

1. deploy the NFT `Tulip.sol` contract
2. deploy the `DutchAuction.sol` contract
3. mint a new Tulip NFT.

To run `deploy-all`, first start a local Hardhat node in a terminal window:

```
npx hardhat node
```

This local node is accessible at http://localhost:8545 and uses chain id 31337 by default. Once the local node is running, you are ready to deploy your contracts and mint your new NFT via:

```
npx hardhat deploy-all --network localhost --token-uri <YOUR_TOKEN_URI>
```

where `YOUR_TOKEN_URI` is the value you saved in the `NFT_TOKEN_METADATA_URI` variable of your `.env` file. Note: specifying `--network localhost` here is very important if you want your contracts to be deployed to the running Hardhat node you just started. Without `--network localhost`, your contracts will be deployed to a temporal Hardhat note that will disappear as soon as the deployment finishes.

Upon successful deployment of everything you should see a message in your console similar to this:

```
Dutch Auction for NFT '<NFT_CONTRACT_ADDR>' contract deployed to address: <DUTCH_AUCTION_CONTRACT_ADDR>
```

Take the `<DUTCH_AUCTION_CONTRACT_ADDR>` value from the console and paste it into your `.env` file as the value of the `DUTCH_AUCTION_CONTRACT_ADDR` variable.

## Front-End

Finally, you're ready to fire up the front-end and see what all this looks like in the browser. To run the front-end application cd into the `app` folder and run `npx parcel index.html`.

You can learn more about Parcel [here](https://parceljs.org/).

## :warning: Notes

Beware of Metamask `nonce` issues. Note that when the Hardhat Task `deploy-all` runs, it creates 3 transactions as described in the [Deploying contracts and minting NFTs](#deploying-contracts-and-minting-nfts) above. This means that `nonce`s 0, 1 and 2 have already been used. When you first load the front-end Dapp and connect to it using Metamask and the Hardhat 0 signer, you will see a button to approve the NFT Token for listing by the Dutch Auction contract. When you click the button to do the approval, you will need to manually override Metamask's `nonce` to be `3`, since 3 transactions will have already been done in the `deploy-all` step.
