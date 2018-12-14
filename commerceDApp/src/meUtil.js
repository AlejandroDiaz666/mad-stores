
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
	console.log('Product: productIdBN = 0x' + productIdBN.toString(16) + ', name = ' + name);
	this.priceBN = this.quantityBN = this.categoryBN = this.serviceRegionsBN = this.vendorAddr = null;
	this.setProductInfo = function(productInfo) {
	    this.priceBN = common.numberToBN(productInfo.price);
	    this.quantityBN = common.numberToBN(productInfo.quantity);
	    //console.log('Product.setProductInfo: productInfo.category = ' + productInfo.category);
	    this.categoryBN = common.numberToBN(productInfo.category);
	    console.log('Product.setProductInfo: categoryBN = 0x' + this.categoryBN.toString(16));
	    this.serviceRegionsBN = common.numberToBN(productInfo.region);
	    this.vendorAddr = productInfo.vendorAddr;
	};
    },

    ProductSearchFilter: function(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable) {
	if (!vendorAddr)
	    vendorAddr = '0x0';
	if (!regionBN)
	    regionBN = new BN('0', 16);
	if (!categoryBN)
	    categoryBN = new BN('0', 16);
	if (!maxPriceBN)
	    maxPriceBN = new BN('0', 16);
	this.vendorAddr = vendorAddr;
	this.regionBN = regionBN;
	this.categoryBN = categoryBN;
	this.maxPriceBN = maxPriceBN;
	this.onlyAvailable = onlyAvailable;
	this.previousSearch = null;
	this.lastSearchLastIdxBN = new BN('0', 16);
	meUtil.productSearchResults = [];
    },

    productSearchResults: [],


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


    //cb(prevEnable, nextEnable)
    //listener(product)
    displayProducts: function(productSearchFilter, div, listener, startIdx, noToDisplay, cb) {
	console.log('displayProducts: startIdx = ' + startIdx + ',  productSearchResults.length = ' + meUtil.productSearchResults.length + ', noToDisplay = ' + noToDisplay);
	if (!!meUtil.productSearchResults && startIdx < meUtil.productSearchResults.length) {
	    drawProducts(div, listener, startIdx, noToDisplay);
	    if (!!cb) {
		const prevEnable = (startIdx >= noToDisplay);
		const nextEnable = (meUtil.productSearchResults.length >= startIdx + noToDisplay);
		cb(prevEnable, nextEnable);
	    }
	} else {
	    let noNewProducts = noToDisplay + 1;
	    getProducts(productSearchFilter, noToDisplay, function(err, noProducts, productSearchResults) {
		noNewProducts = noProducts;
		console.log('displayProducts: got all products. err = ' + err + ', noNewProducts = ' + noNewProducts + ', meUtil.productSearchResults.length = ' + meUtil.productSearchResults.length);
		//if all the products have already been added, then that means that the last individual product callback already occurred -- and at the time
		//the aggregate callback had not occurred, so noNewProducts was still greater than noToDisplay, which in prevented us from calling drawProducts.
		//so we need to draw now.
		if (meUtil.productSearchResults.length >= startIdx + noNewProducts) {
		    drawProducts(div, listener, startIdx, noNewProducts);
		    if (!!cb) {
			const prevEnable = (startIdx >= noToDisplay);
			const nextEnable = (meUtil.productSearchResults.length >= startIdx + noToDisplay);
			console.log('displayProducts: prevEnable = ' + prevEnable + ', nextEnable = ' + nextEnable);
			cb(prevEnable, nextEnable);
		    }
		}
	    }, function(err, product) {
		if (!!err)
		    console.log('displayProducts: single product err = ' + err);
		//if noNewProducts has already been set, then we we're just waiting for the last product to be added
		//to the list. once the last product is added we need to draw.
		console.log('displayProducts: got one product. err = ' + err + ', noNewProducts = ' + noNewProducts + ', meUtil.productSearchResults.length = ' + meUtil.productSearchResults.length);
		if (meUtil.productSearchResults.length >= startIdx + noNewProducts) {
		    drawProducts(div, listener, startIdx, noNewProducts);
		    if (!!cb) {
			const prevEnable = (startIdx >= noToDisplay);
			const nextEnable = (meUtil.productSearchResults.length > startIdx + noToDisplay);
			cb(prevEnable, nextEnable);
		    }
		}
	    });
	}
    },


    //cb(err, results)
    //set regionBN, categoryVB, vendorAddr to null if don't want to search based on that parameter
    getEscrowLogs: function(vendorAddr, customerAddr, stateBN, cb) {
	cb(null, [ "this is a stub-result; call meEther.parseEscrowEvent to parse it" ]);
    },

}


function drawProducts(div, listener, startIdx, noToDisplay) {
    while (div.hasChildNodes()) {
	div.removeChild(div.lastChild);
    }
    for (let i = 0; i < noToDisplay; ++i) {
	const idx = startIdx + i;
	if (idx >= meUtil.productSearchResults.length) {
	    console.log('drawProducts: : bad index, ' + idx);
	    break;
	}
	const product = meUtil.productSearchResults[idx];
	if (!product) {
	    console.log('drawProducts: : no product at index, ' + idx + ', productSearchResults.length = ' + meUtil.productSearchResults.length);
	    break;
	}
	const id = product.productIdBN.toString(10);
	const tileDiv = document.createElement('div');
	tileDiv.id = 'tile' + id + 'Div';
	tileDiv.className = 'tileDiv';
	const tileImgElem = document.createElement('img');
	tileImgElem.id = 'tile' + id + 'Img';
	tileImgElem.className = 'tileImg';
	tileDiv.appendChild(tileImgElem);
	const tileNameSpan = document.createElement('span');
	tileNameSpan.id = 'tile' + id + 'Name';
	tileNameSpan.className = 'tileName';
	tileDiv.appendChild(tileNameSpan);
	const tileTextSpan = document.createElement('span');
	tileTextSpan.id = 'tile' + id + 'Text';
	tileTextSpan.className = 'tileText';
	tileDiv.appendChild(tileTextSpan);
	const tilePriceSpan = document.createElement('span');
	tilePriceSpan.id = 'tile' + id + 'Price';
	tilePriceSpan.className = 'tilePrice';
	tileDiv.appendChild(tilePriceSpan);
	const tileQuantitySpan = document.createElement('span');
	tileQuantitySpan.id = 'tile' + id + 'Quantity';
	tileQuantitySpan.className = 'tileQuantity';
	tileDiv.appendChild(tileQuantitySpan);
	tileImgElem.src = product.image;
	tileNameSpan.textContent = product.name.substring(0, 22);
	tileTextSpan.textContent = product.desc.substring(0, 70);
	const priceNumberAndUnits = ether.convertWeiBNToNumberAndUnits(product.priceBN);
	tilePriceSpan.textContent = 'Price: ' + priceNumberAndUnits.number.toString(10) + ' ' + priceNumberAndUnits.units;
	tileQuantitySpan.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
	if (!!listener)
	    tileDiv.addEventListener('click', function() {
		listener(product);
	    });
	div.appendChild(tileDiv);
    }
}


//
// fcn(err, product)
// cb(err, noProducts, products[])
//
// fcn is called once for each product; err is set in case of an error specific to that product.
// cb is called once with the number of products retreived from this call, and the entire array of
// products (including products from prior calls)
//
function getProducts(productSearchFilter, maxProducts, cb, productFcn) {
    efficientGetCertainProducts(productSearchFilter, maxProducts, function(err, productIDs) {
	if (!!err) {
	    cb(err, 0, meUtil.productSearchResults);
	    return;
	}
	const endLength = meUtil.productSearchResults.length + productIDs.length;
	for (var i = 0; i < productIDs.length; ++i) {
	    if (!productIDs[i] || productIDs[i] == '0') {
		// productID == 0 => all done
		const lastProductIdBN = common.numberToBN((i > 0) ? productIDs[i - 1] : 0);
		console.log('getProducts: short batch. lastProductIdBN = ' + lastProductIdBN.toString(10));
		cb(null, i, meUtil.productSearchResults);
		return;
	    }
	    console.log('getProducts: call getProductLogs(product #' + i + ', productID = ' + productIDs[i] + ')');
	    getProductLogs(common.numberToBN(productIDs[i]), function(err, productIdBN, results) {
		if (!!err) {
		    console.log('getProducts: product #' + i + ', productID = ' + productIdBN.toString(10) + ', err = ' + err);
		    meUtil.productSearchResults.push(null);
		    productFcn(err, null);
		    if (meUtil.productSearchResults.length >= endLength)
			cb(null, productIDs.length, meUtil.productSearchResults);
		    return;
		}
		const result = results[results.length - 1];
		if (!result) {
		    console.log('getProducts: no event log for product #' + i + ', productID = ' + productIdBN.toString(10) + ', result = ' + result);
		    //since it's just a missing event log, we create a dummy product and indicate that we were unable to find the log entry.
		    const product = new meUtil.Product(productIdBN, 'No data yet', 'Event log for this product is not accessible yet', 'images/product-err.jpg');
		    getProductInfo(productIDs, product, endLength, cb, productFcn);
		    return;
		}
		meEther.parseRegisterProductEvent(result, function(err, productIdBN, name, desc, image) {
		    console.log('getProducts: got product = 0x' + productIdBN.toString(16) + ', name = ' + name + ', desc = ' + desc);
		    const product = new meUtil.Product(productIdBN, name, desc, image);
		    getProductInfo(productIDs, product, endLength, cb, productFcn);
		});
	    });
	}
    });
}


//cb(err, productIDs)
//
// this is a heloer for getProducts
// this fcn finds the most efficient way to search a list of products. searches can be performed via getCertainProducts, getVendorProducts, getRegionProducts,
// or getCategoryProducts. the most efficient way to search is to use the call that searches through the smallest set of products.
//
function efficientGetCertainProducts(productSearchFilter, maxProducts, cb) {
    selectEddicientSearch(productSearchFilter, function(err, searchFcn, searchFcnId) {
	if (!!err) {
	    cb(err, null);
	    return;
	}
	const searchStartIdxBN = productSearchFilter.lastSearchLastIdxBN.addn(1);
	searchFcn(productSearchFilter.vendorAddr, productSearchFilter.categoryBN, productSearchFilter.regionBN,
		  productSearchFilter.maxPriceBN, productSearchFilter.onlyAvailable, searchStartIdxBN,
		  maxProducts, function(err, nextSearchIdx, products) {
		      if (!err)
			  productSearchFilter.lastSearchLastIdxBN = common.numberToBN(nextSearchIdx);
		      cb(err, products);
		  });
    });
}


//cb(err, searchFcn, searchFcnId)
function selectEddicientSearch(productSearchFilter, cb) {
    if (productSearchFilter.previousSearch == 'vendorAddr' || productSearchFilter.vendorAddr != '0x0') {
	//this is probably the most efficient.... how many products could one vendor have?
	cb(null, meEther.getVendorProducts, 'vendorAddr');
    } else if ((productSearchFilter.previousSearch == 'region'                                   ) ||
	       (productSearchFilter.categoryBN.isZero() && !productSearchFilter.regionBN.isZero())) {
	cb(null, meEther.getRegionProducts, 'region');
    } else if ((productSearchFilter.previousSearch == 'category'                               ) ||
	       (!productSearchFilter.categoryBN.isZero() && productSearchFilter.regionBN.isZero())) {
	cb(null, meEther.getCategoryProducts, 'category');
    } else if ((productSearchFilter.previousSearch == 'general'                                  ) ||
	       (productSearchFilter.categoryBN.isZero() && productSearchFilter.regionBN.isZero())) {
	//search everything!
	cb(null, meEther.getCertainProducts, 'general');
    } else {
	//see which of search condition entails seraching the least entries
	const regionTlcBN = productSearchFilter.regionBN.ushrn(248);
	const categoryTlcBN = productSearchFilter.categoryBN.ushrn(248);
	meEther.regionProductCount(regionTlcBN, function(err, regionCountBN) {
	    if (!!err) {
		cb(err, null, null);
		return;
	    }
	    meEther.categoryProductCount(categoryTlcBN, function(err, categoryCountBN) {
		if (!!err) {
		    cb(err, null, null);
		    return;
		}
		console.log('efficientGetCertainProducts: regionCountBN = ' + regionCountBN.toString(10) + ', categoryCountBN = ' + categoryCountBN.toString(10));
		if (regionCountBN.lt(categoryCountBN))
		    cb(null, meEther.getRegionProducts, 'region');
		else
		    cb(null, meEther.getCategoryProducts, 'category');
	    });
	});
    }
}


//
// productIDs -- array of product ID's for which we are creating products in meUtil.productSearchResults[]
// product    -- the current product that we are working on. already has name, desc, image
// endLength  -- when meUtil.productSearchResults is this long, then were done
// cb(err, noProducts, products[]) -- called when we're all done
// productFcn(err, product) -- called after each product
//
// this is a helper for getProducts. once the product {name,desc,image} have been set, here we get the rest of the product info.
// then we call the single-product callback, and if this is the last product we call the completed callback.
//
function getProductInfo(productIDs, product, endLength, cb, productFcn) {
    console.log('getProductInfo: working on product = 0x' + product.productIdBN.toString(16) + ', name = ' + product.name);
    meEther.productInfoQuery(common.web3, product.productIdBN, function(err, productInfo) {
	if (!!err) {
	    console.log('getProductInfo: product = 0x' + product.productIdBN.toString(16) + ', err = ' + err);
	    meUtil.productSearchResults.push(null);
	    productFcn(err, product);
	    if (meUtil.productSearchResults.length >= endLength)
		cb(null, productIDs.length, meUtil.productSearchResults);
	    return;
	}
	product.setProductInfo(productInfo);
	console.log('getProductInfo: product = 0x' + product.productIdBN + ', category = 0x' + product.categoryBN.toString(16));
	meUtil.productSearchResults.push(product);
	productFcn(null, product);
	if (meUtil.productSearchResults.length >= endLength)
	    cb(null, productIDs.length, meUtil.productSearchResults);
    });
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
