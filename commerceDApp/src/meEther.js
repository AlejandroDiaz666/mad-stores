
//
// fcns related to ethereum and low level interaction w/ MadEscrow (ME) and MadStores (MS) contracts
//
const common = require('./common');
const ether = require('./ether');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");
const keccak = require('keccakjs');

const meEther = module.exports = {

    //ropsten
    //MadStores
    MS_CONTRACT_ADDR: '0xB7858a53345055401E64Dcb7ACf520b914F4e969',
    MS_CONTRACT_ABI:  '[{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseCancel","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"categoryProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_defaultRegion","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"},{"name":"","type":"uint256"}],"name":"categoryProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getCategoryProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"vendorProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getRegionProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"products","outputs":[{"name":"price","type":"uint256"},{"name":"quantity","type":"uint256"},{"name":"category","type":"uint256"},{"name":"categoryProductIdx","type":"uint256"},{"name":"region","type":"uint256"},{"name":"regionProductIdx","type":"uint256"},{"name":"vendorAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorAccounts","outputs":[{"name":"deliveriesApproved","type":"uint256"},{"name":"deliveriesRejected","type":"uint256"},{"name":"region","type":"uint256"},{"name":"activeFlag","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getCertainProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_productID","type":"uint256"}],"name":"productInfo","outputs":[{"name":"_vendorAddr","type":"address"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_available","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"regionProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_productID","type":"uint256"},{"name":"_surcharge","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"productCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_messageTransport","type":"address"},{"name":"_madEscrow","type":"address"}],"name":"setPartners","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getVendorProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"name":"regionProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_messageTransport","type":"address"},{"name":"_madEscrow","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"message","type":"string"}],"name":"StatEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterVendorEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_productID","type":"uint256"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterProductEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_surcharge","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseDepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseCancelEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"PurchaseRejectEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgNo","type":"uint256"}],"name":"DeliveryRejectEvent","type":"event"}]',
    //MadEscrow
    ME_CONTRACT_ADDR: '0x4c0C3751928C667aa313Ab2b4A1bb594cD8E2C69',
    ME_CONTRACT_ABI: '[{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"}],"name":"approveEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"retainedFees","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_surcharge","type":"uint256"}],"name":"modifyEscrowPrice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"_decimals","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"}],"name":"burnEscrow","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"escrowCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"trusted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_daiAmount","type":"uint256"}],"name":"wrapDai","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_vendorAddr","type":"address"},{"name":"_customerAddr","type":"address"}],"name":"createEscrow","outputs":[{"name":"_escrowID","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"withdrawEscrowFees","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"daiDecimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_trustedAddr","type":"address"},{"name":"_trust","type":"bool"}],"name":"setTrust","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_vendorAddr","type":"address"}],"name":"verifyEscrowVendor","outputs":[{"name":"_productID","type":"uint256"},{"name":"_customerAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_vendorAddr","type":"address"},{"name":"_customerAddr","type":"address"}],"name":"verifyEscrow","outputs":[{"name":"_productID","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"}],"name":"cancelEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_customerAddr","type":"address"}],"name":"verifyEscrowCustomer","outputs":[{"name":"_productID","type":"uint256"},{"name":"_vendorAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_feesTokenAddr","type":"address"},{"name":"_daiTokenAddr","type":"address"}],"name":"setPartners","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"}],"name":"releaseEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"escrowAccounts","outputs":[{"name":"closed","type":"bool"},{"name":"approved","type":"bool"},{"name":"vendorAddr","type":"address"},{"name":"customerAddr","type":"address"},{"name":"productID","type":"uint256"},{"name":"vendorBalance","type":"uint256"},{"name":"customerBalance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unwrapDai","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_feesTokenAddr","type":"address"},{"name":"_daiTokenAddr","type":"address"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PaymentEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"TransferEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"ApprovalEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]',
    //Dai
    DAI_CONTRACT_ADDR: '0x3559030a806305158E752a1D07f6e40BF45f72F2',
    ERC20_ABI: '[{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"value","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]',
    registerVendorEventTopic0: null,
    registerProductEventTopic0: null,
    registerVendorABI: null,
    registerProductABI: null,
    withdrawABI: null,
    MSContractInstance: null,
    MEContractInstance: null,
    daiContractInstance: null,
    approveABI: null,


    // ---------------------------------------------------------------------------------------------------------
    // registerVendor
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, txid)
    registerVendor: function(web3, regionBN, nameBytes, descBytes, imageBytes, cb) {
	const abiRegisterVendorFcn = meEther.abiEncodeRegisterVendor();
	const abiParms = meEther.abiEncodeRegisterVendorParms(regionBN, nameBytes, descBytes, imageBytes);
        const sendData = "0x" + abiRegisterVendorFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(web3, meEther.MS_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterVendor: function() {
	//function registerVendor(uint256 _defaultRegion, bytes _name, bytes _desc, bytes _image) public
	if (!meEther.registerVendorABI)
	    meEther.registerVendorABI = ethabi.methodID('registerVendor', [ 'uint256', 'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerVendorABI);
    },

    abiEncodeRegisterVendorParms: function(regionBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ regionBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },

    getRegisterVendorEventTopic0: function() {
	if (!meEther.registerVendorEventTopic0) {
	    const keccak256 = new keccak(256);
	    //RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
	    keccak256.update("RegisterVendorEvent(address,bytes,bytes,bytes)");
	    meEther.registerVendorEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('registerVendorEventTopic0 = ' + meEther.registerVendorEventTopic0);
	return(meEther.registerVendorEventTopic0);
    },

    //cb(err, { activeFlag: bool, region: uint256 } )
    vendorAccountQuery: function(web3, addr, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.vendorAccounts(addr, (err, resultObj) => {
	    const vendorAccountInfo = {};
	    if (!err) {
		//result = { true, 0 }
		const keys = [ 'deliveriesApproved', 'deliveriesRejected', 'region', 'activeFlag' ];
		const resultArray = Array.from(resultObj);
		for (let i = 0; i < resultArray.length; ++i)
		    vendorAccountInfo[keys[i]] = resultArray[i];
	    }
	    cb(err, vendorAccountInfo);
	});
    },


    // ---------------------------------------------------------------------------------------------------------
    // registerProduct
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, txid)
    //this fcn is also used to edit a product.
    //productID = 0 => register new product, else edit existing product
    registerProduct: function(web3, productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, cb) {
	if (!productIdBN)
	    productIdBN = new BN('0', 16);
	const abiRegisterProductFcn = meEther.abiEncodeRegisterProduct();
	const abiParms = meEther.abiEncodeRegisterProductParms(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes);
        const sendData = "0x" + abiRegisterProductFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(web3, meEther.MS_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterProduct: function() {
	//function registerProduct(uint256 _productID, uint256 _category, uint256 _price, uint256 _quantity, bytes _name, bytes _desc, bytes _image)
	if (!meEther.registerProductABI)
	    meEther.registerProductABI = ethabi.methodID('registerProduct', [ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
									     'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerProductABI);
    },

    abiEncodeRegisterProductParms: function(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },

    getRegisterProductEventTopic0: function() {
	if (!meEther.registerProductEventTopic0) {
	    const keccak256 = new keccak(256);
	    //RegisterProductEvent(uint256 indexed _productID, bytes name, bytes desc, bytes image);
	    keccak256.update("RegisterProductEvent(uint256,bytes,bytes,bytes)");
	    meEther.registerProductEventTopic0 = '0x' + keccak256.digest('hex');
	    //console.log('registerProductEventTopic0 = ' + meEther.registerProductEventTopic0);
	}
	return(meEther.registerProductEventTopic0);
    },

    //cb(err, { price: uint256, quantity: uint256, category: uint256, region: uint256, vendorAddr: address } )
    productInfoQuery: function(web3, productIdBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.products(common.BNToHex256(productIdBN), (err, resultObj) => {
	    console.log('productInfoQuery: productID = ' + common.BNToHex256(productIdBN) + ', err = ' + err + ', result = ' + resultObj.toString());
	    const productPriceInfo = {};
	    if (!err) {
		//result = { true, 0 }
		const keys = [ 'price', 'quantity', 'category', 'categoryProductIdx', 'region', 'regionProductIdx', 'vendorAddr' ];
		const resultArray = Array.from(resultObj);
		//console.log('productInfoQuery: resultArray = ' + resultArray);
		for (let i = 0; i < resultArray.length; ++i) {
		    productPriceInfo[keys[i]] = resultArray[i];
		    //console.log('productInfoQuery: productPriceInfo[' + keys[i] + '] = ' + productPriceInfo[keys[i]]);
		}
	    }
	    cb(err, productPriceInfo);
	});
    },

    //cb(err, lastSearchIdx, productIDs[])
    getCertainProducts: function(vendorAddr, categoryBN, regionBN, maxPriceBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getCertainProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN), common.BNToHex256(maxPriceBN),
						      common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							  console.log('getCertainProducts: err = ' + err + ', result = ' + result);
							  const products = result.toString().split(",");
							  //first entry is idx of last product
							  const lastSearchIdx = products.shift();
							  cb(err, lastSearchIdx, products);
						      });
    },

    //cb(err, lastSearchIdx, productIDs[])
    getVendorProducts: function (vendorAddr, categoryBN, regionBN, maxPriceBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getVendorProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN), common.BNToHex256(maxPriceBN),
						     common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							 console.log('getVendorProducts: err = ' + err + ', result = ' + result);
							 const products = result.toString().split(",");
							 //first entry is idx of last product
							 const lastSearchIdx = products.shift();
							 cb(err, lastSearchIdx, products);
						     });

    },

    //cb(err, lastSearchIdx, productIDs[])
    getCategoryProducts: function (vendorAddr, categoryBN, regionBN, maxPriceBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	console.log('getCategoryProducts: categoryBN = 0x' + categoryBN.toString(16));
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getCategoryProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN), common.BNToHex256(maxPriceBN),
						       common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							   console.log('getCategoryProducts: err = ' + err + ', result = ' + result);
							   const products = result.toString().split(",");
							   //first entry is idx of last product
							   const lastSearchIdx = products.shift();
							   cb(err, lastSearchIdx, products);
						       });
    },

    //cb(err, lastSearchIdx, productIDs[])
    getRegionProducts: function (vendorAddr, categoryBN, regionBN, maxPriceBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getRegionProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN), common.BNToHex256(maxPriceBN),
						     common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							 console.log('getRegionProducts: err = ' + err + ', result = ' + result);
							 const products = result.toString().split(",");
							 //first entry is idx of last product
							 const lastSearchIdx = products.shift();
							 cb(err, lastSearchIdx, products);
						     });
    },

    //cb(err, countBN);
    regionProductCount: function(regionTlcBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.regionProductCounts(common.BNToHex256(regionTlcBN), (err, resultObj) => {
	    if (!!err)
		cb(err, null);
	    else {
		const countBN = common.numberToBN(resultObj);
		console.log('regionProductCount: err = ' + err + ', count[' + common.BNToHex256(regionTlcBN) + '], result = ' + countBN.toString(10));
		cb(err, countBN);
	    }
	});
    },

    //cb(err, countBN);
    categoryProductCount: function(categoryTlcBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.categoryProductCounts(common.BNToHex256(categoryTlcBN), (err, resultObj) => {
	    if (!!err)
		cb(err, null);
	    else {
		const countBN = common.numberToBN(resultObj);
		console.log('categoryProductCount: err = ' + err + ', count[' + common.BNToHex256(categoryTlcBN) + '], result = ' + countBN.toString(10));
		cb(err, countBN);
	    }
	});
    },


    // ---------------------------------------------------------------------------------------------------------
    // wrapDai
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, balanceBN)
    //this retuens the amount of actual dai owned by this address
    getDaiBalance: function(web3, acctAddr, cb) {
	if (!meEther.daiContractInstance)
	    initDaiContractInstance();
	meEther.daiContractInstance.balanceOf(acctAddr, (err, resultObj) => {
	    console.log('getDaiBalance: acctAddr = ' + acctAddr + ', err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null);
		return;
	    }
	    const balanceBN = common.numberToBN(resultObj);
	    cb(err, balanceBN);
	});
    },

    //approveCb(err, txid)
    //wrapping dai is a 2-part process: first wrapDaiApprove, then wrapDaiTransfer
    wrapDaiApprove: function(daiAmountBN, approveCb) {
	const abiApproveFcn = meEther.abiEncodeApprove();
	const abiParms = meEther.abiEncodeApproveParms(meEther.ME_CONTRACT_ADDR, daiAmountBN);
        const sendData = "0x" + abiApproveFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(web3, meEther.DAI_CONTRACT_ADDR, 0, 'wei', sendData, 0, approveCb);
    },

    //transferCb(err, txid)
    wrapDaiTransfer: function(daiAmountBN, transferCb) {
	const abiWrapDaiFcn = meEther.abiEncodeWrapDai();
	const abiParms = meEther.abiEncodeWrapDaiParms(daiAmountBN);
        const sendData = "0x" + abiWrapDaiFcn + abiParms;
	ether.send(web3, meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, transferCb);
    },

    abiEncodeApprove: function() {
	//function approve(address spender, uint value) public returns (bool ok);
	if (!meEther.approveABI)
	    meEther.approveABI = ethabi.methodID('approve', [ 'address', 'uint256' ]).toString('hex');
	return(meEther.approveABI);
    },

    abiEncodeApproveParms: function(spender, amountBN) {
	encoded = ethabi.rawEncode([ 'address', 'uint256' ],
				   [ spender, amountBN ] ).toString('hex');
	return(encoded);
    },

    abiEncodeWrapDai: function() {
	//function wrapDai(uint256 _daiAmount)
	if (!meEther.wrapDaiABI)
	    meEther.wrapDaiABI = ethabi.methodID('wrapDai', [ 'uint256' ]).toString('hex');
	return(meEther.wrapDaiABI);
    },

    abiEncodeWrapDaiParms: function(amountBN) {
	encoded = ethabi.rawEncode([ 'uint256' ], [ amountBN ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // unwrapDai
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, balanceBN)
    //this retuens the amount of dai in the madescrow contract, aka wrapped-dai
    getWDaiBalance: function(web3, acctAddr, cb) {
	if (!meEther.MEContractInstance)
	    initMEContractInstance();
	meEther.MEContractInstance.balances(acctAddr, (err, resultObj) => {
	    console.log('balanceQuery: acctAddr = ' +acctAddr + ', err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null);
		return;
	    }
	    const balanceBN = common.numberToBN(resultObj);
	    cb(err, balanceBN);
	});
    },

    //transferCb(err, txid)
    unwrapDai: function(wdaiAmountBN, transferCb) {
	const abiUnwrapDaiFcn = meEther.abiEncodeUnwrapDai();
	const abiParms = meEther.abiEncodeUnwrapDaiParms(wdaiAmountBN);
        const sendData = "0x" + abiUnwrapDaiFcn + abiParms;
	ether.send(web3, meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, transferCb);
    },

    abiEncodeUnwrapDai: function() {
	//function unwrapDai(uint256 _wdaiAmount)

	// next version of MadEscrow will take wdaiAmount parm...
	//if (!meEther.unwrapDaiABI)
	//    meEther.unwrapDaiABI = ethabi.methodID('unwrapDai', [ 'uint256' ]).toString('hex');
	if (!meEther.unwrapDaiABI)
	    meEther.unwrapDaiABI = ethabi.methodID('unwrapDai', [ ]).toString('hex');
	return(meEther.unwrapDaiABI);
    },

    abiEncodeUnwrapDaiParms: function(amountBN) {
	// next version of MadEscrow will take wdaiAmount parm...
	//encoded = ethabi.rawEncode([ 'uint256' ], [ amountBN ] ).toString('hex');
	encoded = '';
	return(encoded);
    },




    escrowQuery: function(web3, addr, cb) {
    },



    //cb(err, txid)
    withdraw: function(web3, cb) {
	const abiWithdrawFcn = meEther.abiEncodeWithdraw();
        const sendData = "0x" + abiWithdrawFcn;
	console.log('meEther.withdraw: sendData = ' + sendData);
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
	const vendorAddr = result.topics[1].substring(2+(12*2));
	const nameHex = ether.extractHexData(result.data, 2+0);
	const descHex = ether.extractHexData(result.data, 2+64);
	const imageHex = ether.extractHexData(result.data, 2+128);
	const name = common.Utf8HexToStr(nameHex);
	const desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	const image = common.hexToImage(imageHex);
	cb(null, vendorAddr, name, desc, image)
    },



    //cb(null, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image)
    //pass in in a single result object
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseRegisterProductEvent: function(result, cb) {
	//RegisterProductEvent(address indexed _vendorAddr, uint256 indexed _region, uint256 indexed _category,
	//                     uint256 _productID, bytes name, bytes desc, bytes image);
	//typical
	//                   { "address"    :  "0x6d6e8314bc319b3315bc51b7941e43adedf25b26",
	//                     "topics"     : [
	//                                     "0xe5cf209e623f9e36231ee0a288bb82ce7372e79dd57c5356f0a64e3a5a575db6",
	//                                     "0x0000000000000000000000000000000000000000000000000000000000000003", -- productId
	//                                    ],
	//                     "data":         "0x0000000000000000000000000000000000000000000000000000000000000060   -- offset to name
	//                                        00000000000000000000000000000000000000000000000000000000000000a0   -- offset to desc
	//                                        0000000000000000000000000000000000000000000000000000000000000120   -- offset to image
	//                                        000000000000000000000000000000000000000000000000000000000000000c   -- length of name
	//                                        546573742053746f726520300000000000000000000000000000000000000000   -- name
	//                                        0000000000000000000000000000000000000000000000000000000000000046   -- length of desc
	//                                        5468697320697320546573742053746f726520302e20446f6e277420666f7267   -- desc
	//                                        657420746f2073686f77206d657373616765206665657320616e642072657075...",....
	//                     "blockNumber" : "0x45c792",
	//                     "timeStamp"   : "0x5c095dd6",
	//                     "gasPrice"    : "0x3b9aca00",
	//                     "gasUsed"     : "0x59e4d",
	//                     "logIndex"    :  "0x11",
	//                     "transactionHash"  : "0xcd6d86016f0cc1cc488ca8ab56ece99cc80b8e76d6e59665c227f9a9500bd8af",
	//                     "transactionIndex" : "0x1a"
	//                    }
	//
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const productIdBN = common.numberToBN(result.topics[1]);
	const nameHex = ether.extractHexData(result.data, 2+0);
	const descHex = ether.extractHexData(result.data, 2+64);
	const imageHex = ether.extractHexData(result.data, 2+128);
	const name = common.Utf8HexToStr(nameHex);
	console.log('parseRegisterProductEvent: nameHex = ' + nameHex + ', name = ' + name);
	const desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	const image = common.hexToImage(imageHex);
	cb(null, productIdBN, name, desc, image);
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


    //produces a price string, eg. nominal USD, with 2 decimals from price, which is demoninated in
    //cononical dai (ie, 18 decimals)
    daiBNToUsdStr: function(daiBN, places) {
	//real dai is 18 decimals... not 6
	//const daiBNx16 = daiBN.divn(10000000000000000);
	//const cents = daiBNx16.toNumber();
	const daiBNx4 = daiBN.divn(10000);
	const cents = daiBNx4.toNumber();
	const usd = cents / 100;
	console.log('daiBNToUsdStr: daiBN = ' + daiBN.toString(10) + ' => ' + usd.toString(10));
	return(usd.toFixed(!!places ? places : 2));
    },

    //produces a Dai BN (ie, 18 decimals) from nominal dai, AKA USD
    usdStrToDaiBN: function(usdStr) {
	const cents = parseFloat(usdStr) * 100;
	//real dai is 18 decimals... not 6
	//const daiBNx16 = new BN(cents);
	//const daiBN = daiBNx16.muln(10000000000000000);
	const daiBNx4 = new BN(cents);
	const daiBN = daiBNx4.muln(10000);
	console.log('usdStrToDaiBN: cents = ' + cents + ', daiBN = ' + daiBN.toString(10));
	return(daiBN);
    },

};

function initMSContractInstance() {
    const ABIArray = JSON.parse(meEther.MS_CONTRACT_ABI);
    const MScontract = web3.eth.contract(ABIArray);
    console.log('meEther.initMSContractInstance: contract: ' + MScontract);
    console.log('meEther.initMSContractInstance: contract addr: ' + meEther.MS_CONTRACT_ADDR);
    meEther.MSContractInstance = MScontract.at(meEther.MS_CONTRACT_ADDR);
}

function initMEContractInstance() {
    const ABIArray = JSON.parse(meEther.ME_CONTRACT_ABI);
    const MEcontract = web3.eth.contract(ABIArray);
    console.log('meEther.initMEContractInstance: contract: ' + MEcontract);
    console.log('meEther.initMEContractInstance: contract addr: ' + meEther.ME_CONTRACT_ADDR);
    meEther.MEContractInstance = MEcontract.at(meEther.ME_CONTRACT_ADDR);
}

function initDaiContractInstance() {
    const ABIArray = JSON.parse(meEther.ERC20_ABI);
    const daiContract = web3.eth.contract(ABIArray);
    //this will change....
    console.log('meEther.initDaiInstance: contract addr: ' + meEther.DAI_CONTRACT_ADDR);
    meEther.daiContractInstance = daiContract.at(meEther.DAI_CONTRACT_ADDR);
}
