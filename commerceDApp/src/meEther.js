
//
// fcns related to ethereum and low level interaction w/ ME contract
//
var common = require('./common');
var ether = require('./ether');
var ethUtils = require('ethereumjs-util');
var ethtx = require('ethereumjs-tx');
var ethabi = require('ethereumjs-abi');
var Buffer = require('buffer/').Buffer;
var BN = require("bn.js");
const keccak = require('keccakjs');

var meEther = module.exports = {

    //ropsten
    ME_CONTRACT_ADDR: '0x6F827b4E97E7fb22BD2A5deAb37928E523AbE078',
    ME_CONTRACT_ABI:  '[{"constant":false,"inputs":[{"name":"_messageTransport","type":"address"}],"name":"setMessageTransport","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"communityAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseCancel","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_serviceRegion","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"escrowCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdrawEscrowFees","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"products","outputs":[{"name":"price","type":"uint256"},{"name":"quantity","type":"uint256"},{"name":"vendorAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"communityBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorAccounts","outputs":[{"name":"active","type":"bool"},{"name":"serviceRegion","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_productID","type":"uint256"}],"name":"productInfo","outputs":[{"name":"_vendorAddr","type":"address"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_available","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_contractSendGas","type":"uint256"}],"name":"tune","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_category","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"contractSendGas","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_productID","type":"uint256"},{"name":"_surcharge","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"unregisterVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"productCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"depositFunds","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"escrowAccounts","outputs":[{"name":"approved","type":"bool"},{"name":"customerAddr","type":"address"},{"name":"productID","type":"uint256"},{"name":"vendorBalance","type":"uint256"},{"name":"customerBalance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_messageTransport","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"message","type":"string"}],"name":"StatEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterVendorEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"_region","type":"uint256"},{"indexed":true,"name":"_category","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterProductEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_surcharge","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseDepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseCancelEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseRejectEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryRejectEvent","type":"event"}]',
    registerVendorEventTopic0: null,
    messageEventTopic0: null,
    messageTxEventTopic0: null,
    messageRxEventTopic0: null,
    registerVendorABI: null,
    registerProductABI: null,
    withdrawABI: null,


    //cb(err, txid)
    registerVendor: function(web3, serviceRegionBN, nameBytes, descBytes, imageBytes, cb) {
	var abiRegisterVendorFcn = meEther.abiEncodeRegisterVendor();
	var abiParms = meEther.abiEncodeRegisterVendorParms(serviceRegionBN, nameBytes, descBytes, imageBytes);
        var sendData = "0x" + abiRegisterVendorFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(web3, meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterVendor: function() {
	//function registerVendor(uint256 _serviceRegion, bytes _name, bytes _desc, bytes _image) public
	if (!meEther.registerVendorABI)
	    meEther.registerVendorABI = ethabi.methodID('registerVendor', [ 'uint256', 'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerVendorABI);
    },

    abiEncodeRegisterVendorParms: function(serviceRegionBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ serviceRegionBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },


    getRegisterVendorEventTopic0: function() {
	if (!meEther.registerVendorEventTopic0) {
	    var keccak256 = new keccak(256);
	    //RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
	    keccak256.update("RegisterVendorEvent(address,bytes,bytes,bytes)");
	    meEther.registerVendorEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('registerVendorEventTopic0 = ' + meEther.registerVendorEventTopic0);
	return(meEther.registerVendorEventTopic0);
    },


    //cb(err, txid)
    //this fcn is also used to edit a product.
    //productID = 0 => register new product, else edit existing product
    registerProduct: function(web3, productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, cb) {
	var abiRegisterProductFcn = meEther.abiEncodeRegisterProduct();
	var abiParms = meEther.abiEncodeRegisterVendorParms(productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes);
        var sendData = "0x" + abiRegisterVendorFcn + abiParms;
	console.log('sendData.length = ' + sendData.length);
	console.log('sendData = ' + sendData);
	ether.send(web3, meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterProduct: function() {
	//function registerProduct(uint256 _productID, uint256 _category, uint256 _price, uint256 _quantity, bytes _name, bytes _desc, bytes _image)
	if (!meEther.registerProductABI)
	    meEther.registerProductABI = ethabi.methodID('registerProduct', [ 'uint256', 'uint256', 'uint256', 'uint256',
									     'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerProductABI);
    },

    abiEncodeRegisterProductParms: function(productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },



    //cb(err, { activeFlag: bool, serviceRegion: uint256 } )
    vendorAccountQuery: function(web3, addr, cb) {
	var ABIArray = JSON.parse(meEther.ME_CONTRACT_ABI);
	var MEcontract = web3.eth.contract(ABIArray);
	console.log('contract: ' + MEcontract);
	console.log('contract addr: ' + meEther.ME_CONTRACT_ADDR);
	var MEContractInstance = MEcontract.at(meEther.ME_CONTRACT_ADDR);
	console.log('contract: ' + MEContractInstance);
	MEContractInstance.vendorAccounts(addr, (err, resultObj) => {
	    var vendorAccountInfo = {};
	    var vendorAccountInfo = {};
	    if (!err) {
		//result = { true, 0 }
		var keys = [ 'activeFlag', 'serviceRegion' ];
		var resultArray = Array.from(resultObj);
		for (var i = 0; i < resultArray.length; ++i)
		    vendorAccountInfo[keys[i]] = resultArray[i];
	    }
	    cb(err, vendorAccountInfo);
	});
    },


    //cb(err, txid)
    withdraw: function(web3, cb) {
	var abiWithdrawFcn = meEther.abiEncodeWithdraw();
        var sendData = "0x" + abiWithdrawFcn;
	console.log('sendData = ' + sendData);
	ether.send(web3, meEther.EMT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },






    //cb(null, vendorAddr, name, desc, image)
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseRegisterVendorEvent: function(result, cb) {
	//RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- vendorAddr
	//                                ],
	//                    "data"    : "0x0000000000000000000000000000000000000000000000000000000000000060     -- offset to name
	//                                   00000000000000000000000000000000000000000000000000000000000000a0     -- offset to desc
	//                                   0000000000000000000000000000000000000000000000000000000000000100     -- offset to image
	//                                   0000000000000000000000000000000000000000000000000000000000000016     -- length of name
	//                                   546573742053746f72652030202d2d2065646974656400000000000000000000     -- name...
	//                                   0000000000000000000000000000000000000000000000000000000000000035     -- length of desc
	//                                   49742773207374696c6c207468652066697273742073746f72652c206f6e6c79     -- desc...
	//                                   206564697465640a486f77647920706172746e65720000000000000000000000     -- desc...
	//                                   000000000000000000000000000000000000000000000000000000000000104e     -- length of image
	//                                   ......                                                               -- image
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
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	var vendorAddr = result.topics[1].substring(2+(12*2));
	var nameOffset = parseInt(result.data.slice(2+0, 2+64), 16);
	var nameLen    = parseInt(result.data.slice(2+(2*nameOffset), 2+(2*nameOffset)+64), 16);
	console.log('parseRegisterVendorEvent: nameOffset = ' + nameOffset.toString(16) + ', nameLen = ' + nameLen.toString(16));
	var nameHex = '0x' + result.data.slice(2+(2*nameOffset)+64, 2+(2*nameOffset)+64+(nameLen*2));
	var descOffset = parseInt(result.data.slice(2+64, 2+128), 16);
	var descLen    = parseInt(result.data.slice(2+(2*descOffset), 2+(2*descOffset)+64), 16);
	console.log('parseRegisterVendorEvent: descOffset = ' + descOffset.toString(16) + ', descLen = ' + descLen.toString(16));
	var descHex = '0x' + result.data.slice(2+(2*descOffset)+64, 2+(2*descOffset)+64+(descLen*2));
	var imageOffset = parseInt(result.data.slice(2+128, 2+192), 16);
	var imageLen    = parseInt(result.data.slice(2+(2*imageOffset), 2+(2*imageOffset)+64), 16);
	console.log('parseRegisterVendorEvent: imageOffset = ' + imageOffset.toString(16) + ', imageLen = ' + imageLen.toString(16));
	var imageHex = '0x' + result.data.slice(2+(2*imageOffset)+64, 2+(2*imageOffset)+64+(imageLen*2));
	var name = common.Utf8HexToStr(nameHex);
	var desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	var image = common.hexToImage(imageHex);
	cb(null, vendorAddr, name, desc, image)
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
