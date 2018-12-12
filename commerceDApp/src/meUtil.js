
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

    ProductSearchFilter: function(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable, maxProducts) {
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
	this.maxProducts = maxProducts;
	this.productStartIdxBN = new BN('1', 16);
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
	if (!!meUtil.productSearchResults && startIdx < meUtil.productSearchResults.length - noToDisplay) {
	    drawProducts(div, listener, startIdx, noToDisplay, () => {
		const prevEnable = (startIdx > noToDisplay);
		const nextEnable = (meUtil.productSearchResults.length > startIdx + noToDisplay);
		if (!!cb)
		    cb(nextEnable, nextEnable);
	    });
	} else {
	    let noNewProducts = noToDisplay + 1;
	    getProducts(productSearchFilter, function(err, noProducts, productSearchResults) {
		noNewProducts = noProducts;
		console.log('displayProducts: complete. err = ' + err + ', noNewProducts = ' + noNewProducts + ', meUtil.productSearchResults.length = ' + meUtil.productSearchResults.length);
		//if all the products have already been added, then that means that the last individual product callback already occurred -- and at the time
		//the aggregate callback had not occurred, so noNewProducts was still greater than noToDisplay, which in prevented us from calling drawProducts.
		//so we need to draw now.
		if (meUtil.productSearchResults.length >= startIdx + noNewProducts) {
		    drawProducts(div, listener, startIdx, noNewProducts, () => {
			if (!!cb) {
			    const prevEnable = (startIdx > noToDisplay);
			    const nextEnable = (meUtil.productSearchResults.length > startIdx + noToDisplay);
			    cb(nextEnable, nextEnable);
			}
		    });
		}
	    }, function(err, product) {
		if (!!err)
		    console.log('displayProducts: single product err = ' + err);
		//if noNewProducts has already been set, then we we're just waiting for the last product to be added
		//to the list. once the last product is added we need to draw.
		console.log('displayProducts: product. err = ' + err + ', noNewProducts = ' + noNewProducts + ', meUtil.productSearchResults.length = ' + meUtil.productSearchResults.length);
		if (meUtil.productSearchResults.length >= startIdx + noNewProducts) {
		    drawProducts(div, listener, startIdx, noNewProducts, () => {
			if (!!cb) {
			    const prevEnable = (startIdx > noToDisplay);
			    const nextEnable = (meUtil.productSearchResults.length > startIdx + noToDisplay);
			    cb(nextEnable, nextEnable);
			}
		    });
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


function drawProducts(div, listener, startIdx, noToDisplay, cb) {
    while (div.hasChildNodes()) {
	div.removeChild(div.lastChild);
    }
    for (let i = 0; i < noToDisplay; ++i) {
	const idx = startIdx + i;
	if (idx >= meUtil.productSearchResults.length) {
	    console.log('drawProducts: : bad index, ' + idx);
	    break;
	}
	const product = meUtil.productSearchResults[i];
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
function getProducts(productSearchFilter, cb, productFcn) {
    meEther.getCertainProducts(productSearchFilter.vendorAddr,
			       productSearchFilter.categoryBN,
			       productSearchFilter.regionBN,
			       productSearchFilter.maxPriceBN,
			       productSearchFilter.onlyAvailable,
			       productSearchFilter.productStartIdxBN,
			       productSearchFilter.maxProducts,
      function(err, productIDs) {
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
		      console.log('getProducts: unable to parse product info. product #' + i +
				  ', productID = ' + productIdBN.toString(10) + ', result = ' + result);
		      meUtil.productSearchResults.push(null);
		      productFcn('unable to parse product info', null);
		      if (meUtil.productSearchResults.length >= endLength)
			  cb(null, productIDs.length, meUtil.productSearchResults);
		      return;
		  }
		  meEther.parseRegisterProductEvent(result, function(err, productIdBN, name, desc, image) {
		      console.log('getProducts: got product = 0x' + productIdBN.toString(16) + ', name = ' + name + ', desc = ' + desc);
		      const product = new meUtil.Product(productIdBN, name, desc, image);
		      meEther.productInfoQuery(common.web3, productIdBN, function(err, productInfo) {
			  if (!!err) {
			      console.log('getProducts: product #' + i + ', productID = ' + productIDs[i] + ', err = ' + err);
			      meUtil.productSearchResults.push(null);
			      productFcn(err, product);
			      if (meUtil.productSearchResults.length >= endLength)
				  cb(null, productIDs.length, meUtil.productSearchResults);
			      return;
			  }
			  console.log('productInfo = ' + productInfo);
			  product.setProductInfo(productInfo);
			  meUtil.productSearchResults.push(product);
			  productFcn(null, product);
			  if (meUtil.productSearchResults.length >= endLength)
			      cb(null, productIDs.length, meUtil.productSearchResults);
		      });
		  });
	      });
	  }
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
