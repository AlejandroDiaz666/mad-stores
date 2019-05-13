
//
// high level fcns related to interaction w/ ME contract
//
const common = require('./common');
const meEther = require('./meEther');
const mtEther = require('./mtEther');
const mtUtil = require('./mtUtil');
const ether = require('./ether');
const BN = require("bn.js");

var meUtil = module.exports = {

    productDetailCloseFcn: null,
    // just the ids (hex256), in the order returned by the contract search fcn
    productSearchResults: [],
    // complete Products. indexed by productId's (hex256)
    productListProducts: [],
    // list of elems, in display order
    productTiles: [],


    setButtonHandlers: function() {
	const selectedProductCloseImg = document.getElementById('selectedProductCloseImg');
	selectedProductCloseImg.addEventListener('click', function() {
	    console.log('selectedProductCloseImg: got click');
	    common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden', null);
	    if (!!meUtil.productDetailCloseFcn) {
		meUtil.productDetailCloseFcn();
		meUtil.productDetailCloseFcn = null;
	    }
	});
    },

    Product: function (productIdBN, name, desc, image) {
	this.productIdBN = productIdBN
	this.name = name;
	this.desc = desc;
	this.image = image;
	console.log('Product: productIdBN = 0x' + productIdBN.toString(16) + ', name = ' + name);
	this.priceBN = this.quantityBN = this.categoryBN = this.regionBN = this.vendorAddr = null;
	this.setProductInfo = function(productInfo) {
	    this.priceBN = common.numberToBN(productInfo.price);
	    this.quantityBN = common.numberToBN(productInfo.quantity);
	    //console.log('Product.setProductInfo: productInfo.category = ' + productInfo.category);
	    this.categoryBN = common.numberToBN(productInfo.category);
	    //console.log('Product.setProductInfo: categoryBN = 0x' + this.categoryBN.toString(16));
	    this.regionBN = common.numberToBN(productInfo.region);
	    //console.log('Product.setProductInfo: regionBN = 0x' + this.regionBN.toString(16));
	    this.vendorAddr = productInfo.vendorAddr;
	};
    },


    ProductInfo: function(price, quantity, category, region, vendorAddr) {
	this.price = price;
	this.quantity = quantity;
	this.category = category;
	this.region = region;
	this.vendorAddr = vendorAddr;
    },


    ProductTile: function(parentDiv, elemIdx, productId, listener) {
	const id = elemIdx.toString(10);
	//const tileImgElemId = 'tile' + id + 'Img';
	//const tileNameSpanId = 'tile' + id + 'Name';
	//const tileTextSpanId = 'tile' + id + 'Text';
	//const tilePriceSpanId = 'tile' + id + 'Price';
	//const tileQuantitySpanId = 'tile' + id + 'Quantity';
	const tileId = 'tile' + id;
	//in case there is already a tile (on some other page?)
	var altElem = document.getElementById(tileId);
	if (!!altElem)
	    altElem.parentNode.removeChild(altElem);
	this.div = document.createElement('div');
	this.div.id = tileId;
	this.div.className = 'tileDivHidden';
	this.imgElem = document.createElement('img');
	//this.imgElem.id = tileImgElemId;
	this.imgElem.className = 'tileImg';
	this.div.appendChild(this.imgElem);
	this.nameSpan = document.createElement('span');
	//this.nameSpan.id = tileNameSpanId;
	this.nameSpan.className = 'tileName';
	this.div.appendChild(this.nameSpan);
	this.textSpan = document.createElement('span');
	//this.textSpan.id = tileTextSpanId
	this.textSpan.className = 'tileText';
	this.div.appendChild(this.textSpan);
	this.priceSpan = document.createElement('span');
	//this.priceSpan.id = tilePriceSpanId
	this.priceSpan.className = 'tilePrice';
	this.div.appendChild(this.priceSpan);
	this.quantitySpan = document.createElement('span');
	//this.quantitySpan.id = tileQuantitySpanId;
	this.quantitySpan.className = 'tileQuantity';
	this.div.appendChild(this.quantitySpan);
	//this.elemIdx = elemIdx;
	this.productId = productId;
	console.log('ProductTile: this.productId = ' + productId);
	parentDiv.appendChild(this.div);
	if (!!listener) {
	    this.div.addEventListener('click', function() {
		console.log('ProductTile: got click, productId = ' + productId);
		const product = meUtil.productListProducts[productId];
		!!product && !!product.priceBN && listener(product);
	    });
	}
	//
	this.drawProduct = function() {
	    const product = meUtil.productListProducts[this.productId];
	    if (!!product) {
		this.imgElem.src = product.image;
		this.nameSpan.textContent = product.name.substring(0, 22);
		this.textSpan.textContent = product.desc.substring(0, 70);
		this.priceSpan.textContent = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai';
		this.quantitySpan.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
		this.div.className = 'tileDivShow';
	    }
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
	this.minPriceBN = new BN('0', 16);
	this.minDeliveriesBN = new BN('0', 16);
	this.minRatingBN = new BN('0', 16);
	meUtil.productSearchResults = [];
	//should we delete old tiles?
	meUtil.productTiles = [];
    },


    //cb(err, results)
    getVendorLogs: function(vendorAddr, cb) {
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: meEther.MS_CONTRACT_ADDR,
	    topics: [ meEther.getRegisterVendorEventTopic0() ]
	}
	if (!!vendorAddr)
	    options.topics.push('0x' + common.leftPadTo(vendorAddr.substring(2), 64, '0'));
	ether.getLogs(options, cb);
    },


    // cb(err)
    // note product ids returned from search functions are not necessarily hex256. so be careful!
    getProductIds: function(productSearchFilter, maxIds, cb) {
	efficientGetCertainProducts(productSearchFilter, maxIds, function(err, productIds) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    for (let i = 0; i < productIds.length; ++i) {
		const productIdBN = common.numberToBN(productIds[i]);
		if (!productIdBN.isZero())
		    meUtil.productSearchResults.push(common.BNToHex256(productIdBN));
		else
		    break;
	    }
	    cb(null);
	});
    },


    //
    // invalidate either one or all products from product list
    //
    invalidateProductCache: function(productId) {
	if (!!productId)
	    meUtil.productListProducts[productId] = null;
	else
	    meUtil.productListProducts = [];
    },


    //
    // cb(err)
    // create sufficient productSearchResults elements to accomodate the current scroll position of the passed productListDiv.
    // the elements will be populated (ie. filled-in) asynchronously after the product details are retreived
    //
    // if minElemIdx is set, then we continue populating at least until we have retreived that idx
    //
    populateProductList: function(parentDiv, minElemIdx, listener, cb) {
	console.log('populateProductList');
	if (!meUtil.productSearchResults || meUtil.productSearchResults.length == 0) {
	    cb('no products to display');
	    return;
	}
	let callDepth = 0;
	let callCount = 0;
	for (let j = 0; j < 10; ++j) {
	    //scrollHeight is the entire height, including the part of the elem that is now viewable because it is scrolled
	    //scrollTop is a measurement of the distance from the element's top to its topmost visible content
            console.log('populateProductList: scrollHeight = ' + parentDiv.scrollHeight + ', scrollTop = ' + parentDiv.scrollTop + ', clientHeight = ' + parentDiv.clientHeight);
	    if (meUtil.productTiles.length >= meUtil.productSearchResults.length)
		break;
	    else if (!!minElemIdx && meUtil.productTiles.length < minElemIdx + 1)
		;
            else if (parentDiv.scrollHeight > parentDiv.scrollTop + parentDiv.clientHeight + 50)
		break;
	    //
	    // now make up to 9 new tile elems. if we already have products for any tiles, then we can just
	    // draw those tiles right here.
	    //
	    const tilesById = {};
	    const productIds = [];
	    do {
		const elemIdx = meUtil.productTiles.length;
		const searchResultIdx = meUtil.productSearchResults.length - elemIdx - 1;
		const productId = meUtil.productSearchResults[searchResultIdx]
		const tile = new meUtil.ProductTile(parentDiv, elemIdx, productId, listener);
		meUtil.productTiles.push(tile);
		const product = meUtil.productListProducts[productId];
		if (!!product) {
		    tile.drawProduct();
		} else {
		    tilesById[productId] = tile;
		    productIds.push(productId);
		}
	    } while (productIds.length < 9 && meUtil.productTiles.length < meUtil.productSearchResults.length);
	    //
	    // colleect and draw those 9 elems asynchronously
	    if (productIds.length > 0) {
		if (callDepth == 0)
		    common.setLoadingIcon('start');
		++callCount;
		++callDepth;
		const productCb = (err, productId) => { !err && !!tilesById[productId] && tilesById[productId].drawProduct(); };
		const doneCb = () => { if (--callDepth <= 0) { common.setLoadingIcon(null); cb(null); } };
		getSaveAndParse9Products(productIds, productCb, doneCb);
	    }
	}
	if (callCount == 0)
	    cb(null);
    },


    // cb(err)
    // cb is called after user clicks continue
    //
    // this is a wrapper fcn around the meEther purchaseProduct function. the message is encyrpted before sending.
    // can be used to modify an existing escrow
    //
    purchaseProduct: function(escrowIDBN, surchargeBN, productIdBN, vendorAddr, attachmentIdxBN, refBN, message, cb) {
	console.log('purchaseProduct: productIdBN = 0x' + productIdBN.toString(16));
	mtUtil.encryptMsg(vendorAddr, message, function(err, msgFee, encrypted) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    common.showWaitingForMetaMask(true);
	    let purchaseErr = null;
	    const continueFcn = () => {
		common.waitingForTxid = false;
		common.clearStatusDiv();
		cb(purchaseErr);
	    };
	    meEther.purchaseDeposit(escrowIDBN, productIdBN, surchargeBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		console.log('purchaseProduct: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, 'Purchase-Deposit', continueFcn, ether.etherscanioTxStatusHost, function(err) {
		    purchaseErr = err;
		});
	    });
	});
    },


    // cb(err)
    // cb is called after user clicks continue
    //
    // this is a wrapper fcn around a family of escrow functions that all take the same parameters:
    //  escrowIdBN, msgFee, attachmentIdxBN, refBN, messageHex
    // pass in the function, and description of the function (which is displayed in the wait-for-txid status message)
    // the message is encyrpted before sending.
    //
    escrowFcnWithMsg: function(fcn, fcnDesc, escrowIdBN, toAddr, attachmentIdxBN, refBN, message, cb) {
	console.log('escrowFcnWithMsg: escrowIdBN = 0x' + escrowIdBN.toString(16));
	mtUtil.encryptMsg(toAddr, message, function(err, msgFee, encrypted) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    common.showWaitingForMetaMask(true);
	    let fcnErr = null;
	    const continueFcn = () => {
		common.waitingForTxid = false;
		common.clearStatusDiv();
		cb(fcnErr);
	    };
	    fcn(escrowIdBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		console.log('escrowFcnWithMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, fcnDesc, continueFcn, ether.etherscanioTxStatusHost, function(err) {
		    fcnErr = err;
		});
	    });
	});
    },


    // cb(err)
    // cb is called after user clicks continue
    //
    // this is a wrapper fcn around a family of escrow functions that all take the same parameters:
    //  escrowIdBN, parmBN, msgFee, attachmentIdxBN, refBN, messageHex
    // pass in the function, and description of the function (which is displayed in the wait-for-txid status message)
    // the message is encyrpted before sending.
    //
    escrowFcnWithParmMsg: function(fcn, fcnDesc, escrowIdBN, parmBN, toAddr, attachmentIdxBN, refBN, message, cb) {
	console.log('escrowFcnWithParmMsg: escrowIdBN = 0x' + escrowIdBN.toString(16) + ', toAddr = ' + toAddr);
	mtUtil.encryptMsg(toAddr, message, function(err, msgFee, encrypted) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    common.showWaitingForMetaMask(true);
	    let fcnErr = null;
	    const continueFcn = () => {
		common.waitingForTxid = false;
		common.clearStatusDiv();
		cb(fcnErr);
	    };
	    fcn(escrowIdBN, parmBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		console.log('escrowFcnWithParmMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, fcnDesc, continueFcn, ether.etherscanioTxStatusHost, function(err) {
		    fcnErr = err;
		});
	    });
	});
    },


    //cb(err, product)
    getProductById: function(productIdBN, cb) {
	console.log('getProductById: productIdBN = 0x' + productIdBN.toString(16));
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: meEther.MS_CONTRACT_ADDR,
	    topics: [ meEther.getRegisterProductEventTopic0(), common.BNToHex256(productIdBN) ]
	}
	ether.getLogs(options, function(err, results) {
	    if (!!err) {
		cb('error retreiving product logs', null);
		return;
	    }
	    console.log('getProductById: got ' + results.length + ' events');
	    meEther.parseRegisterProductEvent(results[results.length - 1], function(err, productIdBN, name, desc, image) {
		if (!!err) {
		    cb('error parsing product logs', null);
		    return;
		}
		const product = new meUtil.Product(productIdBN, name, desc, image);
		meEther.productInfoQuery(productIdBN, function(err, productIdBN, productInfo) {
		    if (!!err) {
			cb('error retreiving product info', null);
			return;
		    }
		    product.setProductInfo(productInfo);
		    cb(err, product);
		});
	    });
	});
    },



    // ---------------------------------------------------------------------------------------------------------------
    // display functions
    // ---------------------------------------------------------------------------------------------------------------

    // this fcn shows the product, as it appears in the shop/product-detail page. but it can be used by other
    // pages to review how the product advertisement looks
    //
    hideProductDetail: function() {
	common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden', null);
	meUtil.productDetailCloseFcn = null;
    },

    //
    // this fcn displays a product's details
    // viewMode   = 'shop' | 'view'
    // extendMode = 'limit' | 'extend'
    //
    showProductDetail: function(product, viewMode, extendMode, closeCB) {
	console.log('showProductDetail: productIdBN = 0x' + product.productIdBN.toString(16) + ', name = ' + product.name + ', viewMode = ' + viewMode);
	common.replaceElemClassFromTo('selectedProductPageDiv', 'hidden', 'visibleB', null);
	common.setElemClassToOneOf('selectedProductPageDiv', 'shop', 'view', viewMode);
	common.setElemClassToOneOf('selectedProductPageDiv', 'limit', 'extend', extendMode);
	meUtil.productDetailCloseFcn = closeCB;
	//
	const selectedProductSellerAddr = document.getElementById('selectedProductSellerAddr');
	const selectedProductDetailImg = document.getElementById('selectedProductDetailImg');
	const selectedProductDetailName = document.getElementById('selectedProductDetailName');
	const selectedProductDetailDesc = document.getElementById('selectedProductDetailDesc');
	const selectedProductDetailPrice = document.getElementById('selectedProductDetailPrice');
	const selectedProductDetailQuantity = document.getElementById('selectedProductDetailQuantity');
	//
	ether.ensReverseLookup(product.vendorAddr, function(err, name) {
	    let addrStr = product.vendorAddr;
	    if (!err && !!name)
		addrStr = abbreviateAddrForEns(-2, product.vendorAddr, name);
	    document.getElementById('selectedProductSellerAddrArea').value = addrStr;
	    document.getElementById('selectedProductSellerAddrFull').textContent = product.vendorAddr;
	});
	if (product.name.length < 25) {
	    selectedProductDetailName.textContent = product.name;
	} else {
	    selectedProductDetailName.textContent = product.name.substring(0, 25) + '...';
	    const productDetailFullName = document.createElement("span");
	    productDetailFullName.className = 'tooltipText';
	    productDetailFullName.id = 'productDetailFullName';
	    productDetailFullName.textContent = product.name;
	    selectedProductDetailName.appendChild(productDetailFullName);
	}
	//product description height is adjustable!
	selectedProductDetailDesc.style.height = (selectedProductFrameDiv.clientHeight - 260) + 'px';
	console.log('showProductDetail: frame height = ' + selectedProductFrameDiv.clientHeight);
	console.log('showProductDetail: desc  height = ' + selectedProductDetailDesc.clientHeight);
	selectedProductDetailDesc.textContent = product.desc;

	/*
	selectedProductDetailDesc.textContent = (product.desc.length > 120) ? product.desc.substring(0, 120) + '...' : product.desc;
	console.log('showProductDetail: ' + common.occurrences(product.desc, '\n', false) + ' newlines');
	//product.desc.length < 1200 && common.occurrences(product.desc, '\n', false) < 5) {
	*/

	if (common.isOverflown(selectedProductDetailDesc)) {
	    let limit = product.desc.length - 4;
	    while (common.isOverflown(selectedProductDetailDesc)) {
		selectedProductDetailDesc.textContent = product.desc.substring(0, limit) + '...';
		if (--limit < 10)
		    break;
	    }
	    //selectedProductDetailDesc.textContent = product.desc.substring(0, 120) + '...';
	    const productDetailFullDesc = document.createElement("span");
	    productDetailFullDesc.className = 'tooltipText';
	    productDetailFullDesc.id = product.desc.indexOf('\n') < 0 ? 'productDetailFullDesc' : 'productDetailFullDescPre';
	    productDetailFullDesc.textContent = product.desc;
	    selectedProductDetailDesc.appendChild(productDetailFullDesc);
	}
	selectedProductDetailImg.src = product.image;
	//
	selectedProductDetailPrice.textContent = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai';
	selectedProductDetailQuantity.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
	//
	const selectedProductSellerImg = document.getElementById('selectedProductSellerImg');
	const selectedProductSellerName = document.getElementById('selectedProductSellerName');
	const selectedProductSellerDesc = document.getElementById('selectedProductSellerDesc');
	const selectedProductSellerRegion = document.getElementById('selectedProductSellerRegion');
	const selectedProductSellerRating = document.getElementById('selectedProductSellerRating');
	const selectedProductSellerBurns = document.getElementById('selectedProductSellerBurns');
	//
	meUtil.getVendorLogs(product.vendorAddr, function(err, result) {
	    console.log('showProductDetail: result.length = ' + result.length);
	    if (!!result && result.length > 0) {
		meEther.vendorAccountQuery(product.vendorAddr, function(err, vendorAcctInfo) {
		    console.log('regStorePageSubPage: err = ' + err);
		    console.log('regStorePageSubPage: vendorAcctInfo.activeFlag = ' + vendorAcctInfo.activeFlag);
		    console.log('regStorePageSubPage: vendorAcctInfo.region = ' + vendorAcctInfo.region);
		    const defaultRegionBN = common.numberToBN(vendorAcctInfo.region);
		    const ratingSumBN = common.numberToBN(vendorAcctInfo.ratingSum);
		    const deliveriesApprovedBN = common.numberToBN(vendorAcctInfo.deliveriesApproved);
		    const deliveriesRejectedBN = common.numberToBN(vendorAcctInfo.deliveriesRejected);
		    const totalBN = deliveriesApprovedBN.add(deliveriesRejectedBN);
		    const avgRatingBN = totalBN.isZero() ? new BN(0) : ratingSumBN.div(totalBN);
		    let grade = 'A+';
		    if (totalBN.isZero()) {
			grade = 'N/A';
		    } else {
			switch(avgRatingBN.toNumber()) {
			case 0: grade = 'F-'; break;
			case 1: grade = 'F'; break;
			case 2: grade = 'D-'; break;
			case 3: grade = 'D'; break;
			case 4: grade = 'C-'; break;
			case 5: grade = 'C'; break;
			case 6: grade = 'B-'; break;
			case 7: grade = 'B'; break;
			case 8: grade = 'A-'; break;
			case 9: grade = 'A'; break;
			default: grade = 'A+'; break;
			}
		    }
		    selectedProductSellerBurns.textContent = deliveriesRejectedBN.toString(10) + ' deliveries rejected out of ' + totalBN.toString(10);
		    selectedProductSellerRating.textContent = 'Average rating: ' + avgRatingBN.toString(10) + ' (' + grade + ')';
		});
		meEther.parseRegisterVendorEvent(result[result.length - 1], function(err, vendorAddr, name, desc, image) {
		    if (name.length < 70) {
			selectedProductSellerName.textContent = name;
		    } else {
			selectedProductSellerName.textContent = name.substring(0, 70) + '...';
			const sellerFullName = document.createElement("span");
			sellerFullName.className = 'tooltipText';
			sellerFullName.id = 'productDetailSellerFullName';
			sellerFullName.textContent = name;
			selectedProductSellerName.appendChild(sellerFullName);
		    }
		    console.log('seller desc length = ' + desc.length);
		    if (desc.length < 110) {
			selectedProductSellerDesc.textContent = desc;
		    } else {
			selectedProductSellerDesc.textContent = desc.substring(0, 110) + '...';
			const sellerFullDesc = document.createElement("span");
			sellerFullDesc.className = 'tooltipText';
			sellerFullDesc.id = 'productDetailSellerFullDesc';
			sellerFullDesc.textContent = desc;
			selectedProductSellerDesc.appendChild(sellerFullDesc);
		    }
		    selectedProductSellerImg.src = image;
		});
	    }
	});
    },

};


//
// this is a helper for displayProducts
// this fcn finds the most efficient way to search a list of products. searches can be performed via getCertainProducts, getVendorProducts, getRegionProducts,
// or getCategoryProducts. the most efficient way to search is to use the call that searches through the smallest set of products.
//
// cb(err, productIds)
//
function efficientGetCertainProducts(productSearchFilter, maxNewProducts, cb) {
    selectEfficientSearch(productSearchFilter, function(err, searchFcn, searchFcnId) {
	if (!!err) {
	    cb(err, null);
	    return;
	}
	const lastActivityBN = new BN('0', 16);
	const searchStartIdxBN = productSearchFilter.lastSearchLastIdxBN.addn(1);
	searchFcn(productSearchFilter.vendorAddr, productSearchFilter.categoryBN, productSearchFilter.regionBN, productSearchFilter.minPriceBN,
		  productSearchFilter.maxPriceBN, productSearchFilter.minDeliveriesBN, productSearchFilter.minRatingBN, lastActivityBN,
		  productSearchFilter.onlyAvailable, searchStartIdxBN, maxNewProducts, function(err, lastSearchIdx, products) {
		      if (!err) {
			  productSearchFilter.lastSearchLastIdxBN = common.numberToBN(lastSearchIdx);
			  console.log('efficientGetCertainProducts: lastSearchIdx = ' + lastSearchIdx + ', products = ' + products);
		      }
		      cb(err, products);
		  });
    });
}


//cb(err, searchFcn, searchFcnId)
function selectEfficientSearch(productSearchFilter, cb) {
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
// gets up to 3 products specified in productIds[]
// products are saved to meUtil.productListProducts[], which is indexed by by Hex256(productIds)
//
// productCb(err, productId)
// doneCb(noProductsProcessed)
//
// note: product = { productIdBN, name, desc, image, priceBN, quantityBN, categoryBN, regionBN, vendorAddr }
//
function getSaveAndParse9Products(productIds, productCb, doneCb) {
    console.log('getAndParseIdMsgs: enter productIds = ' + productIds);
    const options = {
	fromBlock: 0,
	toBlock: 'latest',
	address: meEther.MS_CONTRACT_ADDR,
	topics: [ meEther.getRegisterProductEventTopic0(), [] ]
    };
    const topicGroup = options.topics[1];
    for (let i = 0; i < productIds.length; ++i)
	topicGroup.push(productIds[i]);
    console.log('getSaveAndParse9Products: options = ' + JSON.stringify(options));
    ether.getLogs3(options, function(err, productResults) {
	console.log('getSaveAndParse9Products: err = ' + err);
	if (!!productResults)
	    console.log('getSaveAndParse9Products: productResults.length = ' + productResults.length);
	if (!!err || !productResults || productResults.length == 0) {
	    if (!!err)
		console.log('getSaveAndParse9Products: err = ' + err);
	    //either an error, or maybe just no events
	    for (let i = 0; i < productIds.length; ++i) {
		meUtil.productListProducts[productIds[i]] = null;
		productCb(err, productIds[i]);
	    }
	    doneCb(productIds.length);
	    return;
	}
	let bogusCount = 0;
	let productCbCount = 0;
	// scan backwards to get most recent edit of each product
	for (let i = productResults.length - 1; i >= 0; --i) {
	    meEther.parseRegisterProductEvent(productResults[i], function(err, productIdBN, name, desc, image) {
		const productId = common.BNToHex256(productIdBN);
		if (!!meUtil.productListProducts[productId]) {
		    //could be a duplicate
		    console.log('getSaveAndParse9Products: got an unexpected product, productId = ' + common.BNToHex256(productIdBN) + ', name = ' + name);
		    if (productCbCount + ++bogusCount >= productResults.length) {
			doneCb(productCbCount);
		    }
		} else {
		    const product = new meUtil.Product(productIdBN, name, desc, image);
		    meUtil.productListProducts[productId] = product;
		    meEther.productInfoQuery(productIdBN, function(err, productIdBN, productInfo) {
			const productId = common.BNToHex256(productIdBN);
			if (!!err) {
			    console.log('getSaveAndParse9Products: product = ' + productId + ', err = ' + err);
			} else {
			    const product = meUtil.productListProducts[productId];
			    product.setProductInfo(productInfo);
			    console.log('getSaveAndParse9Products: product = ' + productId);
			}
			productCb(err, productId);
			if (++productCbCount + bogusCount >= productResults.length)
			    doneCb(productCbCount);
		    });
		}
	    });
	}
    });
}


// maxEnsLength is the maximum length ens name that will fit in the field, together without abbreviating
// as in, 'ensname (0xADDRESS)'
// note: maxEnsLength can be negative if you can't fit the ' ()'
function abbreviateAddrForEns(maxEnsLength, addr, ensName) {
    let addrNumericStr = addr;
    if (ensName.length >= maxEnsLength) {
	console.log('abbreviateAddrForEns: ensName = ' + ensName);
	// normal length of addr is '0x' + 40 chars. field can fit maxEnsLength + ' (' + '0x' + 40 + ')'. or
	// replace addr chars with XXXX...XXXX
	const noAddrChars = Math.max( 40 - (((ensName.length - maxEnsLength) + 3 + 1) & 0xfffe), 6);
	const cut = 40 - noAddrChars;
	console.log('abbreviateAddrForEns: ensName.length = ' + ensName.length + ', cut = ' + cut);
	const remain2 = (40 - cut) / 2;
	console.log('abbreviateAddrForEns: remain2 = ' + remain2);
	addrNumericStr = addr.substring(0, 2 + remain2) + '...' + addr.substring(2 + 40 - remain2);
    }
    return(ensName + ' (' + addrNumericStr + ')');
}
