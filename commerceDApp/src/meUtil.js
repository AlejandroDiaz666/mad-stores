
//
// high level fcns related to interaction w/ ME contract
//
var common = require('./common');
var meEther = require('./meEther');
var ether = require('./ether');
var BN = require("bn.js");

var escrowUtil = module.exports = {

    Product: function (vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
	this.vendorAddr = vendorAddr;
	this.regionBN = regionBN;
	this.categoryBN = categoryBN;
	this.productIdBN = productIdBN
	this.name = name;
	this.desc = desc;
	this.image = image;
	this.priceBN = this.quantityBN = null;
	this.setPriceAndQuantity = function(priceBN, QuantityBN) {
	    this.priceBN = priceBN;
	    this.quantityBN = quantityBN;
	};
	this.setPriceInfo = function(priceInfo) {
	    this.priceBN = common.numberToBN(priceInfo.price);
	    this.quantityBN = common.numberToBN(priceInfo.quantity);
	};
    },

    //cb(err, results)
    getVendorLogs: function(vendorAddr, cb) {
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: meEther.ME_CONTRACT_ADDR,
	    topics: [ meEther.getRegisterVendorEventTopic0() ]
	}
	if (!!vendorAddr)
	    options.topics.push('0x' + common.leftPadTo(vendorAddr.substring(2), 64, '0'));
	ether.getLogs(options, cb);
    },


    //cb(err, results)
    //set vendorAddr, regionBN, categoryVB to null if don't want to search based on that parameter
    getProductLogs: function(vendorAddr, regionBN, categoryBN, cb) {
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: meEther.ME_CONTRACT_ADDR,
	    topics: [ meEther.getRegisterProductEventTopic0() ]
	}
	//for topics that don't exist, if there are subsequent topics then push null to
	//keep the topic numbers straight.
	if (!!vendorAddr)
	    options.topics.push('0x' + common.leftPadTo(vendorAddr.substring(2), 64, '0'));
	else if (!!regionBN || !!categoryBN)
	    options.topics.push(null);
	if (!!regionBN)
	    options.topics.push('0x' + common.leftPadTo(regionBN.toString(16), 64, '0'));
	else if (!!categoryBN)
	    options.topics.push(null);
	if (!!categoryBN)
	    options.topics.push('0x' + common.leftPadTo(categoryBN.toString(16), 64, '0'));
	ether.getLogs(options, cb);
    },

    //cb(err, results)
    //set regionBN, categoryVB, vendorAddr to null if don't want to search based on that parameter
    getEscrowLogs: function(vendorAddr, customerAddr, stateBN, cb) {
	cb(null, [ "this is a stub-result; call meEther.parseEscrowEvent to parse it" ]);
    },

}
