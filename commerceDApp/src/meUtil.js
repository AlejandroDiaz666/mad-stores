
//
// high level fcns related to interaction w/ ME contract
//
var common = require('./common');
var meEther = require('./meEther');
var ether = require('./ether');
var BN = require("bn.js");

var escrowUtil = module.exports = {

    //cb(err, result)
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

}
