
//
// high level fcns related to interaction w/ ME contract
//
var common = require('./common');
var meEther = require('./meEther');
var ether = require('./ether');
var BN = require("bn.js");

var escrowUtil = module.exports = {

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
    //set regionBN, categoryVB, vendorAddr to null if don't want to search based on that parameter
    getProductLogs: function(regionBN, categoryBN, vendorAddr, cb) {
	cb(null, [ "this is a stub-result; call meEther.parseRegisterProductEvent to parse it",
		   "this is a stub-result; call meEther.parseRegisterProductEvent to parse it",
		   "this is a stub-result; call meEther.parseRegisterProductEvent to parse it",
		   "this is a stub-result; call meEther.parseRegisterProductEvent to parse it",
		   "this is a stub-result; call meEther.parseRegisterProductEvent to parse it",
		   "this is a stub-result; call meEther.parseRegisterProductEvent to parse it" ]);
    },

    //cb(err, results)
    //set regionBN, categoryVB, vendorAddr to null if don't want to search based on that parameter
    getEscrowLogs: function(vendorAddr, customerAddr, stateBN, cb) {
	cb(null, [ "this is a stub-result; call meEther.parseEscrowEvent to parse it" ]);
    },

}
