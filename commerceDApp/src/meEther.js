
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


    productQuery: function(web3, addr, cb) {
    },
    escrowQuery: function(web3, addr, cb) {
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
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
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



    //cb(null, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image)
    //pass in in a single result object
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseRegisterProductEvent: function(result, cb) {
	//RegisterProductEvent(address indexed _vendorAddr, uint256 indexed _region, uint256 indexed _category,
	//                     uint256 _productID, bytes name, bytes desc, bytes image);
	var vendorAddr = '0x7DfA67646B74b6e223b1779a3086c5C4F45782A2';
	var regionBN = new BN('2', 16);
	var categoryBN = new BN('3', 16);
	var productIdBN = new BN('4', 16);
	var name = 'Adidas Women\'s Running Shoes';
	var desc = 'Finest running shoes in all of India. You won\'t beleive how light you feel when you\'re wearing these puppies!';
	var image = 'data:image/png;base64,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';
	cb(null, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image);
    },


    parseEscrowEvent: function(result, cb) {
	//EScrowEvent(address indexed _vendorAddr, address customerAddr, uint256 _escrowID,
	//            uint256 _productID, uint256 _state, uint256 _msgNo);
	var vendorAddr = '0x7DfA67646B74b6e223b1779a3086c5C4F45782A2';
	var customerAddr = common.web3.eth.accounts[0];
	var escrowIdBN = new BN('5', 16);
	var productIdBN = new BN('4', 16);
	var state = 0x5;
	var msgNo = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
	var timeStamp = parseInt('0x5b9a2cf4');
	var date = (new Date(timeStamp * 1000)).toUTCString();
	cb(null, vendorAddr, customerAddr, escrowIdBN, prodictIdBN, state, msgNo, date);
    },
};
