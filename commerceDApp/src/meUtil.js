
//
// high level fcns related to interaction w/ ME contract
//
const common = require('./common');
const meEther = require('./meEther');
const mtEther = require('./mtEther');
const mtUtil = require('./mtUtil');
const dhcrypt = require('./dhcrypt');
const ether = require('./ether');
const BN = require("bn.js");

var meUtil = module.exports = {

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
	    address: meEther.MS_CONTRACT_ADDR,
	    topics: [ meEther.getRegisterVendorEventTopic0() ]
	}
	if (!!vendorAddr)
	    options.topics.push('0x' + common.leftPadTo(vendorAddr.substring(2), 64, '0'));
	ether.getLogs(options, cb);
    },


    //
    // gets products according to the passed productSearchFilter, if necessary (we might already have the products cached)
    // displays noToDisplay products in the passed div. onclick for each product calls listener(product)
    //
    // cb(prevEnable, nextEnable)
    // listener(product)
    //
    displayProducts: function(productSearchFilter, div, listener, startIdx, noToDisplay, cb) {
	console.log('displayProducts: startIdx = ' + startIdx + ',  productSearchResults.length = ' + meUtil.productSearchResults.length + ', noToDisplay = ' + noToDisplay);
	clearProducts(div);
	drawProductTiles(div, listener, startIdx, noToDisplay);
	if (!!meUtil.productSearchResults) {
	    while (noToDisplay > 0 && startIdx < meUtil.productSearchResults.length) {
		drawProduct(startIdx);
		++startIdx;
		--noToDisplay;
	    }
	    if (noToDisplay <= 0) {
		if (!!cb) {
		    const prevEnable = (startIdx >= noToDisplay);
		    const nextEnable = (meUtil.productSearchResults.length >= startIdx + noToDisplay);
		    cb(prevEnable, nextEnable);
		}
		return;
	    }
	}
	const newProductsNeeded = startIdx + noToDisplay - meUtil.productSearchResults.length;
	console.log('displayProducts: need ' + newProductsNeeded + ' more products, starting with ' + startIdx);
	efficientGetCertainProducts(productSearchFilter, newProductsNeeded, function(err, productIds) {
	    if (!!err) {
		cb(false, false);
		return;
	    }
	    console.log('displayProducts: calling getSaveAndDrawProducts(productIds = ' + productIds + ', startIdx = ' + startIdx);
	    getSaveAndDrawProducts(productIds, 0, startIdx, function() {
		if (!!cb) {
		    const prevEnable = (startIdx >= noToDisplay);
		    const nextEnable = (meUtil.productSearchResults.length >= startIdx + noToDisplay);
		    console.log('displayProducts: prevEnable = ' + prevEnable + ', nextEnable = ' + nextEnable);
		    cb(prevEnable, nextEnable);
		}
	    });
	});
    },


    // cb(err)
    // cb is called after user clicks continue
    //
    // this is a wrapper fcn around the meEther purchaseProduct function. the message is encyrpted before sending.
    // can be used to modify an existing escrow
    //
    purchaseProduct: function(escrowIDBN, surchargeBN, productIdBN, vendorAddr, attachmentIdxBN, refBN, message, cb) {
	console.log('purchaseProduct: productIdBN = 0x' + productIdBN.toString(16));
	mtEther.accountQuery(common.web3, vendorAddr, function(err, toAcctInfo) {
	    //encrypt the message...
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    console.log('purchaseProduct: toPublicKey = ' + toPublicKey);
	    if (!toPublicKey || toPublicKey == '0x') {
		cb('Encryption error: unable to look up destination address in contract!');
		return;
	    }
	    console.log('purchaseProduct: mtUtil.acctInfo.sentMsgCount = ' + mtUtil.acctInfo.sentMsgCount);
	    const sentMsgCtrBN = common.numberToBN(mtUtil.acctInfo.sentMsgCount);
	    sentMsgCtrBN.iaddn(1);
	    console.log('purchaseProduct: toPublicKey = ' + toPublicKey);
	    const ptk = dhcrypt.ptk(toPublicKey, vendorAddr, common.web3.eth.accounts[0], '0x' + sentMsgCtrBN.toString(16));
	    console.log('purchaseProduct: ptk = ' + ptk);
	    const encrypted = dhcrypt.encrypt(ptk, message);
	    console.log('purchaseProduct: encrypted (length = ' + encrypted.length + ') = ' + encrypted);
	    //in order to figure the message fee we need to see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(common.web3, vendorAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('purchaseProduct: ' + msgCount.toString(10) + ' messages have been sent from ' + vendorAddr + ' to me');
		const msgFee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		console.log('purchaseProduct: msgFee is ' + msgFee + ' wei');
		common.showWaitingForMetaMask(true);
		const statusDiv = document.getElementById('statusDiv');
		let purchaseErr = null;
		const continueFcn = () => {
		    common.clearStatusDiv(statusDiv);
		    cb(purchaseErr);
		};
		meEther.purchaseDeposit(escrowIDBN, productIdBN, surchargeBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		    console.log('purchaseProduct: txid = ' + txid);
		    common.showWaitingForMetaMask(false);
		    common.waitForTXID(err, txid, 'Purchase-Deposit', statusDiv, continueFcn, ether.etherscanioTxStatusHost, function(err) {
			purchaseErr = err;
		    });
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
	    const statusDiv = document.getElementById('statusDiv');
	    let fcnErr = null;
	    const continueFcn = () => {
		common.clearStatusDiv(statusDiv);
		cb(fcnErr);
	    };
	    fcn(escrowIdBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		console.log('escrowFcnWithMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, fcnDesc, statusDiv, continueFcn, ether.etherscanioTxStatusHost, function(err) {
		    approveErr = err;
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
	console.log('escrowFcnWithParmMsg: escrowIdBN = 0x' + escrowIdBN.toString(16));
	mtUtil.encryptMsg(toAddr, message, function(err, msgFee, encrypted) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    common.showWaitingForMetaMask(true);
	    const statusDiv = document.getElementById('statusDiv');
	    let fcnErr = null;
	    const continueFcn = () => {
		common.clearStatusDiv(statusDiv);
		cb(fcnErr);
	    };
	    fcn(escrowIdBN, parmBN, msgFee, attachmentIdxBN, refBN, encrypted, function(err, txid) {
		console.log('escrowFcnWithParmMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, fcnDesc, statusDiv, continueFcn, ether.etherscanioTxStatusHost, function(err) {
		    approveErr = err;
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
		meEther.productInfoQuery(common.web3, productIdBN, function(err, productIdBN, productInfo) {
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
	const searchStartIdxBN = productSearchFilter.lastSearchLastIdxBN.addn(1);
	searchFcn(productSearchFilter.vendorAddr, productSearchFilter.categoryBN, productSearchFilter.regionBN,
		  productSearchFilter.maxPriceBN, productSearchFilter.onlyAvailable, searchStartIdxBN,
		  maxNewProducts, function(err, lastSearchIdx, products) {
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
// this is a helper for displayProducts
// recursive fcn, get, save & draw 3 products at a time. recursive to get, save & draw the rest
// products are saved to meUtil.productSearchResults[] in getSaveAndParse3Products
//
//
// listIdx: idx into productIds
// productIdx: idx into meUtil.productSearchResults
//
function getSaveAndDrawProducts(productIds, listIdx, productIdx, cb) {
    const threeProductIds = [];
    const productCookies = {};
    console.log('getSaveAndDrawProducts: enter: listIdx = ' + listIdx + ', productIdx = ' + productIdx)
    for (let i = 0; i < 3 && listIdx < productIds.length; ++i, ++listIdx, ++productIdx) {
	if (common.numberToBN(productIds[listIdx]).isZero())
	    break;
	console.log('getAndDrawProducts: productId = ' + productIds[listIdx] + ' goes to listIdx = ' + listIdx);
	const productId = common.numberToHex256(productIds[listIdx]);
	const productCookie = { idx: productIdx, id: productId };
	threeProductIds.push(productId);
	productCookies[productId] = productCookie;
    }
    if (threeProductIds.length == 0) {
	console.log('getSaveAndDrawProducts: no products from idx ' + productIdx + ' on');
	cb();
    } else {
	//gets up to 3 log entries; second cb when all done
	let productsToDisplay = 10000;
	let noProductsDisplayed = 0;
	getSaveAndParse3Products(threeProductIds, productCookies, function(err, cookie, product) {
	    if (!!err || !product)
		console.log('getSaveAndDrawProducts: Product data not found for product id ' + cookie.id);
	    drawProduct(cookie.idx);
	    ++noProductsDisplayed;
	    console.log('getSaveAndDrawProducts: got productCb. err = ' + err + ', productsToDisplay = ' + productsToDisplay + ', noProductsDisplayed = ' + noProductsDisplayed);
	    if (noProductsDisplayed >= productsToDisplay) {
		console.log('getSaveAndDrawProducts: exit: listIdx = ' + listIdx + ', productIdx = ' + productIdx);
		const done = (listIdx < productIds.length && !common.numberToBN(productIds[listIdx]).isZero()) ? false : true;
	    (done) ? cb() : getSaveAndDrawProducts(productIds, listIdx, productIdx, cb);
	    }
	}, function(noProductsProcessed) {
	    productsToDisplay = noProductsProcessed;
	    console.log('getSaveAndDrawProducts: got doneCb. listIdx = ' + listIdx + ', noProductsProcessed = ' + noProductsProcessed + ', noProductsDisplayed = ' + noProductsDisplayed);
	    if (noProductsDisplayed >= productsToDisplay) {
		console.log('getSaveAndDrawProducts: exit: listIdx = ' + listIdx + ', productIdx = ' + productIdx);
		const done = (listIdx < productIds.length && !common.numberToBN(productIds[listIdx]).isZero()) ? false : true;
		(done) ? cb() : getSaveAndDrawProducts(productIds, listIdx, productIdx, cb);
	    }
	});
    }
}


//
// gets up to 3 products specified in productIds[]
// products are saved to meUtil.productSearchResults[]
//
// productCb(err, cookie, product)
// doneCb(noProductsProcessed)
//
// note: product = { productIdBN, name, desc, image, priceBN, quantityBN, categoryBN, regionBN, vendorAddr }
//
function getSaveAndParse3Products(productIds, productCookies, productCb, doneCb) {
    console.log('getAndParseIdMsgs: enter productIds = ' + productIds);
    const options = {
	fromBlock: 0,
	toBlock: 'latest',
	address: meEther.MS_CONTRACT_ADDR,
	topics: [ meEther.getRegisterProductEventTopic0() ]
    };
    if (productIds.length > 0) {
	if (!!productIds[0])
	    options.topics.push(productIds[0]);
	if (options.topics.length > 1) {
	    if (!!productIds[1])
		options.topics.push(productIds[1]);
	    if (options.topics.length > 2) {
		if (!!productIds[2])
		    options.topics.push(productIds[2]);
	    }
	}
    }
    console.log('getSaveAndParse3Products: options = ' + JSON.stringify(options));
    ether.getLogs3(options, function(err, productResults) {
	console.log('getSaveAndParse3Products: err = ' + err + ', productResults.length = ' + productResults.length);
	if (!!err || !productResults || productResults.length == 0) {
	    if (!!err)
		console.log('getSaveAndParse3Products: err = ' + err);
	    //either an error, or maybe just no events
	    for (let i = 0; i < productIds.length; ++i) {
		const cookie = productCookies[productIds[i]];
		meUtil.productSearchResults[cookie.idx] = null;
		productCb(err, cookie, null);
	    }
	    doneCb(productIds.length);
	    return;
	}
	let productCbCount = 0;
	let bogusCount = 0;
	const parsedUniq = {};
	for (let i = productResults.length - 1; i >= 0; --i) {
	    meEther.parseRegisterProductEvent(productResults[i], function(err, productIdBN, name, desc, image) {
		const id256 = common.BNToHex256(productIdBN);
		const cookie = productCookies[id256];
		if (!!cookie && !parsedUniq[id256]) {
		    parsedUniq[id256] = true;
		    const newProduct = new meUtil.Product(productIdBN, name, desc, image);
		    meUtil.productSearchResults[cookie.idx] = newProduct;
		    meEther.productInfoQuery(common.web3, productIdBN, function(err, productIdBN, productInfo) {
			let cookie = null;
			let product = null;
			if (!!err) {
			    console.log('getSaveAndParse3Products: product = 0x' + product.productIdBN.toString(16) + ', name = ' + name + ', err = ' + err);
			} else {
			    cookie = productCookies[common.BNToHex256(productIdBN)];
			    product = meUtil.productSearchResults[cookie.idx];
			    product.setProductInfo(productInfo);
			    console.log('getSaveAndParse3Products: product = 0x' + product.productIdBN.toString(16) + ', name = ' + name + ', category = 0x' + product.categoryBN.toString(16));
			}
			productCb(err, cookie, product);
			if (++productCbCount + bogusCount >= productResults.length)
			    doneCb(productCbCount);
		    });
		} else {
		    console.log('getSaveAndParse3Products: got an unexpected product, productId = ' + common.BNToHex256(productIdBN) + ', name = ' + name);
		    if (productCbCount + ++bogusCount >= productResults.length)
			doneCb(productCbCount);
		}
	    });
	}
    });
}


//
// draws products in the passed div. onclick for each product calls listener(product)
// products must already have been retreived to meUtil.productSearchResults[];
//
function clearProducts(div) {
    while (div.hasChildNodes())
	div.removeChild(div.lastChild);
}

//
// draw product tiles in the passed div. tiles are not populated with data yet.
// onclick for each tile calls listener(product)
//
function drawProductTiles(div, listener, startIdx, noTiles) {
    for (let i = 0; i < noTiles; ++i, ++startIdx) {
	const id = startIdx.toString(10);
	const tileImgElemId = 'tile' + id + 'Img';
	const tileNameSpanId = 'tile' + id + 'Name';
	const tileTextSpanId = 'tile' + id + 'Text';
	const tilePriceSpanId = 'tile' + id + 'Price';
	const tileQuantitySpanId = 'tile' + id + 'Quantity';
	const tileId = 'tile' + id;
	//in case there is already a tile (on some other page?)
	var altElem = document.getElementById(tileId);
	if (!!altElem)
	    altElem.parentNode.removeChild(altElem);
	const tileDiv = document.createElement('div');
	tileDiv.id = tileId;
	tileDiv.className = 'tileDivHidden';
	const tileImgElem = document.createElement('img');
	tileImgElem.id = tileImgElemId;
	tileImgElem.className = 'tileImg';
	tileDiv.appendChild(tileImgElem);
	const tileNameSpan = document.createElement('span');
	tileNameSpan.id = tileNameSpanId;
	tileNameSpan.className = 'tileName';
	tileDiv.appendChild(tileNameSpan);
	const tileTextSpan = document.createElement('span');
	tileTextSpan.id = tileTextSpanId
	tileTextSpan.className = 'tileText';
	tileDiv.appendChild(tileTextSpan);
	const tilePriceSpan = document.createElement('span');
	tilePriceSpan.id = tilePriceSpanId
	tilePriceSpan.className = 'tilePrice';
	tileDiv.appendChild(tilePriceSpan);
	const tileQuantitySpan = document.createElement('span');
	tileQuantitySpan.id = tileQuantitySpanId;
	tileQuantitySpan.className = 'tileQuantity';
	tileDiv.appendChild(tileQuantitySpan);
	if (!!listener) {
	    const productIdx = startIdx;
	    tileDiv.addEventListener('click', function() {
		console.log('drawProductTiles: got click, productIdx = ' + productIdx);
		const product = meUtil.productSearchResults[productIdx];
		listener(product);
	    });
	}
	div.appendChild(tileDiv);
    }
}


//
// draws product specified by idx. onclick for each product calls listener(product)
// products must already have been retreived to meUtil.productSearchResults[];
//
// idx is index into meUtil.productSearchResults[]
//
function drawProduct(idx) {
    console.log('drawProduct: idx = ' + idx);
    const product = meUtil.productSearchResults[idx];
    if (!product) {
	console.log('drawProduct: no product at index, ' + idx + ', productSearchResults.length = ' + meUtil.productSearchResults.length);
	return;
    }
    const id = idx.toString(10);
    const tileId = 'tile' + id;
    const tileImgElemId = 'tile' + id + 'Img';
    const tileNameSpanId = 'tile' + id + 'Name';
    const tileTextSpanId = 'tile' + id + 'Text';
    const tilePriceSpanId = 'tile' + id + 'Price';
    const tileQuantitySpanId = 'tile' + id + 'Quantity';
    const tileDiv = document.getElementById(tileId);
    const tileImgElem = document.getElementById(tileImgElemId);
    const tileNameSpan = document.getElementById(tileNameSpanId);
    const tileTextSpan = document.getElementById(tileTextSpanId);
    const tilePriceSpan = document.getElementById(tilePriceSpanId);
    const tileQuantitySpan = document.getElementById(tileQuantitySpanId);
    tileImgElem.src = product.image;
    tileNameSpan.textContent = product.name.substring(0, 22);
    tileTextSpan.textContent = product.desc.substring(0, 70);
    tilePriceSpan.textContent = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai';
    tileQuantitySpan.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
    tileDiv.className = 'tileDivShow';
}
