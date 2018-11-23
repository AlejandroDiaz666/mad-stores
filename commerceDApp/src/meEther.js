
//
// fcns related to ethereum and low level interaction w/ ME contract
//
var common = require('./common');
var ethUtils = require('ethereumjs-util');
var ethtx = require('ethereumjs-tx');
var ethabi = require('ethereumjs-abi');
var Buffer = require('buffer/').Buffer;
var BN = require("bn.js");
const keccak = require('keccakjs');

var meEther = module.exports = {

    SZABO_PER_ETH:     1000000,
    GWEI_PER_ETH:      1000000000,
    WEI_PER_GWEI:      1000000000,
    WEI_PER_SZABO:     1000000000000,
    WEI_PER_FINNEY:    1000000000000000,
    WEI_PER_ETH:       1000000000000000000,
    //ropsten
    ME_CONTRACT_ADDR: '0xcFba15912B6d8aF808f2C1A10393180BECF602E5',
    ME_CONTRACT_ABI:  '[{"constant":false,"inputs":[{"name":"_messageTransport","type":"address"}],"name":"setMessageTransport","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"communityAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_customerAddr","type":"address"},{"name":"_message","type":"bytes"}],"name":"purchaseReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_productID","type":"uint256"},{"name":"_surcharge","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_message","type":"bytes"}],"name":"deliveryReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_serviceRegion","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_message","type":"bytes"}],"name":"purchaseCancel","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"withdrawEscrowFees","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"communityBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_message","type":"bytes"}],"name":"deliveryApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorAccounts","outputs":[{"name":"active","type":"bool"},{"name":"serviceRegion","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_customerAddr","type":"address"},{"name":"_message","type":"bytes"}],"name":"purchaseApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_productID","type":"uint256"}],"name":"productInfo","outputs":[{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_contractSendGas","type":"uint256"}],"name":"tune","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint256"},{"name":"_productID","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"contractSendGas","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unregisterVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"depositFunds","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_messageTransport","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"message","type":"string"}],"name":"StatEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterVendorEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"_region","type":"uint256"},{"indexed":false,"name":"_category","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterProductEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_surcharge","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseDepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseCancelEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseRejectEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryRejectEvent","type":"event"}]',
    messageEventTopic0: null,
    messageTxEventTopic0: null,
    messageRxEventTopic0: null,
    etherscanioHost_kovan: 'api-kovan.etherscan.io',
    etherscanioTxStatusHost_kovan: 'kovan.etherscan.io',
    etherscanioHost_ropsten: 'api-ropsten.etherscan.io',
    etherscanioTxStatusHost_ropsten: 'ropsten.etherscan.io',
    etherscanioHost_main: 'api.etherscan.io',
    etherscanioTxStatusHost_main: 'etherscan.io',
    registerVendorABI: null,
    sendMessageABI: null,
    withdrawABI: null,

    //cb(err, network)
    getNetwork: function(web3, cb) {
	var network = 'Unknown Network';
	web3.version.getNetwork((err, netId) => {
	    switch (netId) {
	    case "1":
		network = 'Mainnet';
		console.log('This is mainnet')
		meEther.etherscanioHost = meEther.etherscanioHost_main;
		meEther.etherscanioTxStatusHost = meEther.etherscanioTxStatusHost_main;
		break
	    case "2":
		network = 'Morden test network';
		console.log('This is the deprecated Morden test network.')
		break
	    case "3":
		network = 'Ropsten test network';
		console.log('This is the ropsten test network.')
		meEther.etherscanioHost = meEther.etherscanioHost_ropsten;
		meEther.etherscanioTxStatusHost = meEther.etherscanioTxStatusHost_ropsten;
		break
	    case "4":
		network = 'Rinkeby test network';
		console.log('This is the Rinkeby test network.')
		break
	    case "42":
		network = 'Kovan test network';
		console.log('This is the Kovan test network.')
		meEther.etherscanioHost = meEther.etherscanioHost_kovan;
		meEther.etherscanioTxStatusHost = meEther.etherscanioTxStatusHost_kovan;
		break
	    default:
		console.log('This is an unknown network.')
	    }
	    cb(null, network);
	});
    },


    //cb(err, txid)
    //registerVendor: function(web3, serviceRegionBN, nameHex, descHex, imageHex, cb) {
    registerVendor: function(web3, serviceRegionBN, nameBytes, descBytes, imageBytes, cb) {
	var abiRegisterVendorFcn = meEther.abiEncodeRegisterVendor();
	var abiParms = meEther.abiEncodeRegisterVendorParms(serviceRegionBN, nameBytes, descBytes, imageBytes);
        var sendData = "0x" + abiRegisterVendorFcn + abiParms;
	console.log('sendData = ' + sendData);
	meEther.send(web3, meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterVendor: function() {
	//function registerVendor(uint256 _serviceRegion, bytes _name, bytes _desc, bytes _image) public {
	if (!meEther.registerVendorABI)
	    meEther.registerVendorABI = ethabi.methodID('registerVendor', [ 'uint256', 'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerVendorABI);
    },

    abiEncodeRegisterVendorParms: function(serviceRegionBN, nameBytes, descBytes, imageBytes) {
	/*
    abiEncodeRegisterVendorParms: function(serviceRegionBN, nameHex, descHex, imageHex) {
	var nameBytes = common.hexToBytes(nameHex);
	var descBytes = common.hexToBytes(descHex);
	var imageBytes = common.hexToBytes(imageHex);
	*/
	encoded = ethabi.rawEncode([ 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ serviceRegionBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },


    //cb(err, txid)
    withdraw: function(web3, cb) {
	var abiWithdrawFcn = meEther.abiEncodeWithdraw();
        var sendData = "0x" + abiWithdrawFcn;
	console.log('sendData = ' + sendData);
	meEther.send(web3, meEther.EMT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },


    getMessageEventTopic0: function() {
	if (!meEther.messageEventTopic0) {
	    var keccak256 = new keccak(256);
	    keccak256.update("MessageEvent(uint256,address,address,uint256,uint256,uint256,uint256,bytes)");
	    meEther.messageEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageEventTopic0 = ' + meEther.messageEventTopic0);
	return(meEther.messageEventTopic0);
    },

    getMessageTxEventTopic0: function() {
	if (!meEther.messageTxEventTopic0) {
	    var keccak256 = new keccak(256);
	    keccak256.update("MessageTxEvent(address,uint256,uint256,uint256)");
	    meEther.messageTxEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageTxEventTopic0 = ' + meEther.messageTxEventTopic0);
	return(meEther.messageTxEventTopic0);
    },

    getMessageRxEventTopic0: function() {
	if (!meEther.messageRxEventTopic0) {
	    var keccak256 = new keccak(256);
	    keccak256.update("MessageRxEvent(address,uint256,uint256,uint256)");
	    meEther.messageRxEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageTxEventTopic0 = ' + meEther.messageRxEventTopic0);
	return(meEther.messageRxEventTopic0);
    },

    abiEncodeSendMessage: function() {
	//address toAddr, uint256 mimeType, uint256 ref, bytes message
	if (!meEther.sendMessageABI)
	    meEther.sendMessageABI = ethabi.methodID('sendMessage', [ 'address', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.sendMessageABI);
    },

    abiEncodeSendMessageParms: function(toAddr, mimeType, ref, message) {
	if (toAddr.startsWith('0x'))
	    toAddr = toAddr.substring(2);
	if (mimeType.startsWith('0x'))
	    mimeType = mimeType.substring(2);
	if (ref.startsWith('0x'))
	    ref = ref.substring(2);
	var bytes = common.hexToBytes(message);
	console.log('abiEncodeSendMessageParms: toAddr = ' + toAddr);
	console.log('abiEncodeSendMessageParms: mimeType = ' + mimeType);
	console.log('abiEncodeSendMessageParms: ref = ' + ref);
	//console.log('abiEncodeSendMessageParms: message (length = ' + bytes.length + '): ' + bytes.toString(16));
	var encoded = ethabi.rawEncode([ 'address', 'uint256', 'uint256', 'bytes' ],
				   [ new BN(toAddr, 16), new BN(mimeType, 16), new BN(ref, 16), bytes ] ).toString('hex');
	return(encoded);
    },


    abiEncodeWithdraw: function() {
	if (!meEther.withdrawABI)
	    meEther.withdrawABI = ethabi.methodID('withdraw', [ ]).toString('hex');
	return(meEther.withdrawABI);
    },


    //convert an amount in wei to a comfortable representation
    //for example: 1000000000000 => '1 gwei'
    convertWeiToComfort: function(web3, wei) {
	var units =
	    (wei < meEther.WEI_PER_GWEI)   ? 'Wei'   :
	    (wei < meEther.WEI_PER_SZABO)  ? 'Gwei'   :
	    (wei < meEther.WEI_PER_FINNEY) ? 'Szabo'  :
	    (wei < meEther.WEI_PER_ETH)    ? 'Finney' : 'Eth';
	return(web3.fromWei(wei, units).toString() + ' ' + units);
    },

    validateAddr: function (addr) {
	if (!addr.startsWith('0x'))
	    return(false);
	if (!addr.length == 42)
	    return(false);
	//see EIP44
	if (!/^(0x)?[0-9a-f]{40}$/i.test(addr)) {
            // check if it has the basic requirements of an address
            return false;
	} else if (/^(0x)?[0-9a-f]{40}$/.test(addr) || /^(0x)?[0-9A-F]{40}$/.test(addr)) {
            // If it's all small caps or all upper caps, return true
            return true;
	} else {
	    // Check each case
	    addr = addr.replace('0x','');
	    var addressHash = common.web3.sha3(addr.toLowerCase());
	    addressHash = addressHash.replace('0x','');
	    for (var i = 0; i < 40; i++ ) {
		// the nth letter should be uppercase if the nth digit of casemap is 1
		if ((parseInt(addressHash[i], 16) > 7 && addr[i].toUpperCase() !== addr[i]) || (parseInt(addressHash[i], 16) <= 7 && addr[i].toLowerCase() !== addr[i])) {
		    console.log('addr = ' + addr + ', addressHash = ' + addressHash);
		    console.log('at index ' + i + ': ' + addressHash[i] + ' is not correct');
		    return false;
		}
	    }
	    return true;
	}
    },


    //
    // units: 'szabo' | 'finney' | 'ether'
    // cb(err, balance)
    //
    getBalance: function(web3, units, cb) {
	web3.eth.getBalance(web3.eth.accounts[0], function (err, balance) {
	    console.log('get_balance bal = ' + balance.toString() + ', type = ' + typeof(balance));
	    cb(null, web3.fromWei(balance, units).toString());
	});
    },


    //
    // units: 'szabo' | 'finney' | 'ether'
    //
    send: function(web3, to_addr, size, units, data, gasLimit, callback) {
	var tx = {};
	tx.from = web3.eth.accounts[0];
	tx.value = web3.toWei(size, units);
	tx.to = to_addr,
	tx.data = data;
	if (gasLimit > 0)
	    tx.gas = gasLimit;
	console.log('calling sendTransaction');
	web3.eth.sendTransaction(tx, callback)
    },


    //cb(err, result)
    //options: {
    //	fromBlock, toBlock, address, topics[]
    //
    //this is the more correct way to get logs.... except that it's not reliable :(
    /*
    getLogs: function(options, cb) {
        const filter = common.web3.eth.filter(options);
	filter.get(cb);
	filter.stopWatching();
    },
    */
    getLogs: function(options, cb) {
	var url = 'https://' + meEther.etherscanioHost   +
	    '/api?module=logs&action=getLogs'          +
	    '&fromBlock=' + options.fromBlock          +
	    '&toBlock=' + options.toBlock              +
	    '&address=' + options.address              +
	    '&topic0=' + options.topics[0];
	if (options.topics.length > 1) {
	    if (!!options.topics[1])
		url += '&topic1=' + options.topics[1];
	    if (options.topics.length > 2) {
		if (!!options.topics[2])
		    url += '&topic2=' + options.topics[2];
		if (options.topics.length > 3) {
		    if (!!options.topics[3])
			url += '&topic3=' + options.topics[3];
		}
	    }
	}
	common.fetch(url, function(str, err) {
	    if (!str || !!err) {
		var err = "error retreiving events: " + err;
		console.log('meEther.getLogs: ' + err);
		cb(err, '');
		return;
	    }
	    //typical
	    //  { "status"  : "1",
	    //    "message" : "OK",
	    //    "result"  : [...]
	    //  }
	    var eventsResp = JSON.parse(str);
	    if (eventsResp.status == 0 && eventsResp.message == 'No records found') {
		//this is not an err... just no events
		cb(err, '');
		return;
	    }
	    if (eventsResp.status != 1 || eventsResp.message != 'OK') {
		var err = "error retreiving events: bad status (" + eventsResp.status + ", " + eventsResp.message + ")";
		console.log('meEther.getLogs: ' + err);
		cb(err, '');
		return;
	    }
	    cb(null, eventsResp.result);
	});
    },


    //cb(null, msgId, fromAddr, toAddr, txCount, rxCount, mimeType, ref, msgHex, blockNumber, date)
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseMessageEvent: function(result, cb) {
	//event MessageEvent(uint indexed _id, address _fromAddr, address _toAddr, uint _txCount, uint _rxCount, uint _mimeType, uint _ref, bytes message);
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- id
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469     -- _fromAddr
	//                                   000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469     -- _toAddr
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _txCount
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _rxCount
	//                                   0000000000000000000000000000000000000000000000000000000000000001     -- _mimeType
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _ref
	//                                   00000000000000000000000000000000000000000000000000000000000000b0     -- offset to message
	//                                   000000000000000000000000000000000000000000000000000000000000000d     -- message (length)
	//                                   4669727374206d65737361676500000000000000000000000000000000000000",   -- message text
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageEvent: result = ' + result);
	//console.log('parseMessageEvent: string = ' + JSON.stringify(result));
	var msgId = result.topics[1];
	//console.log('msgId: ' + msgId);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	var fromAddr = '0x' + result.data.slice(0+2, 64+2).substring(12*2);
	var toAddr = '0x' + result.data.slice(64+2, 128+2).substring(12*2);
	//console.log('parseMessageEvent: fromAddr = ' + fromAddr);
	//console.log('parseMessageEvent: toAddr = ' + toAddr);
	var txCount = '0x' + result.data.slice(128+2, 192+2);
	//console.log('parseMessageEvent: txCount = ' + txCount);
	var rxCount = '0x' + result.data.slice(192+2, 256+2);
	//console.log('parseMessageEvent: rxCount = ' + rxCount);
	var mimeTypeHex = result.data.slice(256+2, 320+2);
	var mimeType = parseInt(mimeTypeHex, 16);
	//console.log('parseMessageEvent: mimeType = ' + mimeType.toString(10));
	var ref = '0x' + result.data.slice(320+2, 384+2);
	//console.log('parseMessageEvent: ref = ' + ref);
	var msgOffsetHex = result.data.slice(384+2, 448+2);
	var msgOffset = parseInt(msgOffsetHex, 16);
	var msgLenHex = result.data.slice((2*msgOffset)+2, (2*msgOffset)+64+2);
	var msgLen = parseInt(msgLenHex, 16);
	//console.log('parseMessageEvent: msgLen = 0x' + msgLen.toString(16));
	var msgHex = '0x' + result.data.slice((2*msgOffset)+64+2, (2*msgOffset)+64+2+(msgLen*2));
	var blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageEvent: blockNumber = ' + blockNumber);
	var timeStamp = parseInt(result.timeStamp);
	var date = (new Date(timeStamp * 1000)).toUTCString();
	//console.log('parseMessageEvent: date = ' + date);
	cb(null, msgId, fromAddr, toAddr, txCount, rxCount, mimeType, ref, msgHex, blockNumber, date);
    },


    //cb(err, fromAddr, txCount, id, blockNumber, date);
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseMessageTxEvent: function(result, cb) {
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- _fromAddr
	//                                  "0x0000000000000000000000000000000000000000000000000000000000000001"  -- _txCount
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469"    -- _id
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageTxEvent: result = ' + result);
	//console.log('parseMessageTxEvent: string = ' + JSON.stringify(result));
	var fromAddr = result.topics[1];
	var txCount = result.topics[2];
	//console.log('parseMessageTxEvent: fromAddr = ' + fromAddr);
	//console.log('parseMessageTxEvent: txCount = ' + txCount);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	var msgId = result.data;
	var blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageTxEvent: blockNumber = ' + blockNumber);
	var timeStamp = parseInt(result.timeStamp);
	var date = (new Date(timeStamp * 1000)).toUTCString();
	//console.log('parseMessageTxEvent: date = ' + date);
	cb(null, fromAddr, txCount, msgId, blockNumber, date);
    },

    //cb(null, toAddr, rxCount, id, blockNumber, date);
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseMessageRxEvent: function(result, cb) {
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- _toAddr
	//                                  "0x0000000000000000000000000000000000000000000000000000000000000001"  -- _rxCount
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469"    -- _id
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageRxEvent: result = ' + result);
	//console.log('parseMessageRxEvent: string = ' + JSON.stringify(result));
	var toAddr = result.topics[1];
	var rxCount = result.topics[2];
	//console.log('parseMessageRxEvent: toAddr = ' + toAddr);
	//console.log('parseMessageRxEvent: rxCount = ' + rxCount);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	var msgId = result.data;
	var blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageRxEvent: blockNumber = ' + blockNumber);
	var timeStamp = parseInt(result.timeStamp);
	var date = (new Date(timeStamp * 1000)).toUTCString();
	//console.log('parseMessageRxEvent: date = ' + date);
	cb(null, toAddr, rxCount, msgId, blockNumber, date);
    },

};
