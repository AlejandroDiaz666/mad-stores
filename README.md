# Turms MAD STores

## Introduction

Turms MAD Stores is a Decentralized, Anonymous Ethereum-based Marketplace. It uses Ethereum Smart Contracts to:
 - keep track of sellers products, prices and inventory
 - maintain a list of product categories
 - provide escrow services between sellers and buyers
 - it uses Turms Anonymous Message Transport for communications between sellers and buyers


## MAD Escrow

MAD stands for Mutually Assurred Destruction. In every purchase transaction both parties place a bond into escrow. If either party cheats, then both parties lose their deposits!
 - When you purchase an item in MAD Stores you will deposit 150% of the price into an escrow account.
 - Automatically, the seller will also deposit a bond into the escrow account, equal to 50% of the purchase price.
 - All funds are released from the MAD Escrow when the buyer confirms satisfactory delivery of the product.
 - If the product was not as advertised, or was if it was not delivered, then the buyer and seller are encouraged to communicate, using Turms Anonymous Message Transport, to work out a satisfactory resolution.
 - In case no resolution can be reached, the buyer has the option to "burn" the escrow. That is, to destroy all the funds that are held in the Escrow.


## Building

* `Install browserfy`
* `cd ui`
* `npm install`
* `make`
* `cp -R build/* /var/web/html/`

To make a deployable version

* `make deploy`
