# NFT Legends contracts

[![](https://img.shields.io/badge/made%20by-nftlegends%20team-blue.svg?style=flat-square)](https://nftlegends.io/)
[![](https://img.shields.io/badge/hosted%20on-ipfs-blue.svg?style=flat-square)](http://ipfs.io/)
![Solidity](https://img.shields.io/badge/solidity-v0.8.7-green)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test](https://github.com/OnGridSystems/nftlegends_solidity/actions/workflows/test.yml/badge.svg)](https://github.com/OnGridSystems/nftlegends_solidity/actions/workflows/test.yml)

NFT Legends is a part of digital art collectible metaverse. You can collect cards, sell it, play and earn.
Contracts are proxy-upgradeable to make gameplay possible to expand over time. Token is ERC-721 compatible
and has custom attributes that can be modified by gameplay contracts. `DNA` attribute can be set on character's burth,
`rarity` is set when the characters get revealed, `skill` can be set as the outcome of the combat and so on.

## Contract deployed on Ethereum Mainnet

[0x9d5eD1b12E2BB47E3bDdCC3638376B792b94530B](https://etherscan.io/address/0x9d5eD1b12E2BB47E3bDdCC3638376B792b94530B) - Proxy
[0x881DF125197b3DE62287FcCe6aBfEaF7e0816cAf](https://etherscan.io/address/0x881df125197b3de62287fcce6abfeaf7e0816caf) - Implementation

## Install dependencies

```bash
yarn
```

## Deploy contract

```bash
yarn deploy:mainnet --reset
yarn verify:mainnet 
yarn run hardhat 1-set-sale-stages --network mainnet
yarn run hardhat 2-mint-zero-batch-tokens --network mainnet
yarn run hardhat 3-mint-99-random-tokens --network mainnet
yarn run hardhat 4-reveal-zero-batch --network mainnet
yarn run hardhat 5-start-sale --network mainnet
```

## Test

```bash
yarn test
```

## Coverage

```bash
yarn coverage
```

## Lint

```bash
yarn lint
yarn lint:js:fix
```

# Authors

NFT Legends dev team <info@nftlegends.io>

# License

```
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
