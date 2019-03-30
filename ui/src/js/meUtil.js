
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
	//could we somehow save old products?
	meUtil.productListProducts = [];
	//should we delete old tiles?
	meUtil.productTiles = [];
    },

    // just the ids (hex256), in the order returned by the contract search fcn
    productSearchResults: [],
    // complete Products. indexed by productId's (hex256)
    productListProducts: [],
    // list of elems, in display order
    productTiles: [],


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
	    if (callDepth == 0)
		common.setLoadingIcon('start');
	    ++callCount;
	    ++callDepth;
	    //
	    // now make up to 3 new elems
	    //
	    const tilesById = {};
	    const productIds = [];
	    const noElems = Math.min(3, meUtil.productSearchResults.length - meUtil.productTiles.length);
	    //const startProductIdx = elemIdxToMsgNo(isRx, lastElemIdx);
            console.log('populateMsgList: productTiles.length = ' + meUtil.productTiles.length + ', noElems = ' + noElems);
	    for (let i = 0; i < noElems; ++i) {
		const elemIdx = meUtil.productTiles.length;
		const searchResultIdx = meUtil.productSearchResults.length - elemIdx - 1;
		const productId = meUtil.productSearchResults[searchResultIdx]
		console.log('populateMsgList: productTile[' + elemIdx + '], productId = ' + productId);
		const productTile = new meUtil.ProductTile(parentDiv, elemIdx, productId, listener);
		meUtil.productTiles.push(productTile);
		tilesById[productId] = productTile;
		productIds.push(productId);
	    }
	    // colleect and draw those 3 elems asynchronously
	    const productCb = (err, productId) => { !err && tilesById[productId].drawProduct(); };
	    const doneCb = () => { if (--callDepth <= 0) { common.setLoadingIcon(null); cb(null); } };
	    getSaveAndParse3Products(productIds, productCb, doneCb);
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
	mtEther.accountQuery(vendorAddr, function(err, toAcctInfo) {
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
	    mtEther.getPeerMessageCount(vendorAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('purchaseProduct: ' + msgCount.toString(10) + ' messages have been sent from ' + vendorAddr + ' to me');
		const msgFee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		console.log('purchaseProduct: msgFee is ' + msgFee + ' wei');
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
		  productSearchFilter.minPriceBN, productSearchFilter.maxPriceBN, productSearchFilter.minDeliveriesBN, productSearchFilter.minRatingBN,
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
function getSaveAndParse3Products(productIds, productCb, doneCb) {
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
	console.log('getSaveAndParse3Products: err = ' + err);
	if (!!productResults)
	    console.log('getSaveAndParse3Products: productResults.length = ' + productResults.length);
	if (!!err || !productResults || productResults.length == 0) {
	    if (!!err)
		console.log('getSaveAndParse3Products: err = ' + err);
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
		    console.log('getSaveAndParse3Products: got an unexpected product, productId = ' + common.BNToHex256(productIdBN) + ', name = ' + name);
		    if (productCbCount + ++bogusCount >= productResults.length) {
			doneCb(productCbCount);
		    }
		} else {
		    const product = new meUtil.Product(productIdBN, name, desc, image);
		    meUtil.productListProducts[productId] = product;
		    meEther.productInfoQuery(productIdBN, function(err, productIdBN, productInfo) {
			const productId = common.BNToHex256(productIdBN);
			if (!!err) {
			    console.log('getSaveAndParse3Products: product = ' + productId + ', err = ' + err);
			} else {
			    const product = meUtil.productListProducts[productId];
			    product.setProductInfo(productInfo);
			    console.log('getSaveAndParse3Products: product = ' + productId);
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


//
// draws products in the passed div. onclick for each product calls listener(product)
// products must already have been retreived to meUtil.productSearchResults[];
//
function clearProducts(div) {
    while (div.hasChildNodes())
	div.removeChild(div.lastChild);
}
