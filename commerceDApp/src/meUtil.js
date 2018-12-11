
//
// high level fcns related to interaction w/ ME contract
//
var common = require('./common');
var meEther = require('./meEther');
var ether = require('./ether');
var BN = require("bn.js");

var meUtil = module.exports = {

    Product: function (productIdBN, name, desc, image) {
	this.productIdBN = productIdBN
	this.name = name;
	this.desc = desc;
	this.image = image;
	this.priceBN = this.quantityBN = this.categoryBN = this.serviceRegionsBN = this.vendorAddr = null;
	this.setProductInfo = function(productInfo) {
	    this.priceBN = common.numberToBN(productInfo.price);
	    this.quantityBN = common.numberToBN(productInfo.quantity);
	    this.categoryBN = common.numberToBN(productInfo.category);
	    this.serviceRegionsBN = common.numberToBN(productInfo.serviceRegions);
	    this.vendorAddr = productInfo.vendorAddr;
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


    //
    // fcn(err, product)
    // cb(err, noProducts, lastProductIdBN)
    //
    // fcn is called once for each product; err in case of an error specific to that product
    // cb is called once to indicate the number of products
    //
    getProducts: function(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable, productStartIdxBN, maxProducts, cb, productFcn) {
	if (!vendorAddr)
	    vendorAddr = '0x0';
	if (!regionBN)
	    regionBN = new BN('0', 16);
	if (!categoryBN)
	    categoryBN = new BN('0', 16);
	if (!maxPriceBN)
	    maxPriceBN = new BN('0', 16);
	meEther.getCertainProducts(vendorAddr, categoryBN, regionBN, maxPriceBN, onlyAvailable,
				   productStartIdxBN, maxProducts, function(err, productIDs) {
	    if (!!err) {
		cb(err, 0);
		return;
	    }
	    for (var i = 0; i < productIDs.length; ++i) {
		if (!productIDs[i] || productIDs[i] == '0') {
		    // productID == 0 => all done
		    const lastProductIdBN = common.numberToBN((i > 0) ? productIDs[i - 1] : 0);
		    console.log('getProducts: short batch. lastProductIdBN = ' + lastProductIdBN.toString(10));
		    cb(null, i, lastProductIdBN);
		    return;
		}
		console.log('getProducts: call getProductLogs(product #' + i + ', productID = ' + productIDs[i] + ')');
		getProductLogs(common.numberToBN(productIDs[i]), function(err, productIdBN, results) {
		    if (!!err) {
			console.log('getProducts: product #' + i + ', productID = ' + productIdBN.toString(10) + ', err = ' + err);
			return;
		    }
		    const result = results[results.length - 1];
		    if (!result) {
			console.log('getProducts: product #' + i + ', productID = ' + productIdBN.toString(10) + ', result = ' + result);
			return;
		    }
		    meEther.parseRegisterProductEvent(result, function(err, productIdBN, name, desc, image) {
			console.log('getProducts: got product = 0x' + productIdBN.toString(16) + ', name = ' + name + ', desc = ' + desc);
			const product = new meUtil.Product(productIdBN, name, desc, image);
			meEther.productInfoQuery(common.web3, productIdBN, function(err, productPriceInfo) {
			    if (!!err) {
				console.log('getProducts: product #' + i + ', productID = ' + productIDs[i] + ', err = ' + err);
				productFcn(err, product);
				return;
			    }
			    console.log('productPriceInfo = ' + productPriceInfo);
			    product.setProductInfo(productPriceInfo);
			    productFcn(null, product);
			});
		    });
		});
	    }
	    const lastProductIdBN = common.numberToBN(productIDs[productIDs.length - 1]);
	    console.log('getProducts: complete. lastProductIdBN = ' + lastProductIdBN.toString(10));
	    cb(null, productIDs.length, lastProductIdBN);
	});
    },


    //cb(err, results)
    //set regionBN, categoryVB, vendorAddr to null if don't want to search based on that parameter
    getEscrowLogs: function(vendorAddr, customerAddr, stateBN, cb) {
	cb(null, [ "this is a stub-result; call meEther.parseEscrowEvent to parse it" ]);
    },

}


//cb(err, productIdBN, results)
function getProductLogs(productIdBN, cb) {
    const options = {
	fromBlock: 0,
	toBlock: 'latest',
	address: meEther.ME_CONTRACT_ADDR,
	topics: [ meEther.getRegisterProductEventTopic0(), common.BNToHex256(productIdBN) ]
    }
    ether.getLogs(options, function(err, results) {
	cb(err, productIdBN, results);
    });
}
