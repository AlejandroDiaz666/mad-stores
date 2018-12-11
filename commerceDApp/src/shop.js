/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
var BN = require("bn.js");


var shop = module.exports = {

    handleShopPage: function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Selected');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
	handleSearchProducts();
    },

    setButtonHandlers: function() {
	const shopDoSearchButton = document.getElementById('shopDoSearchButton');
	shopDoSearchButton.addEventListener('click', function() {
	    shopDoSearch();
	});
	const shopNextButton = document.getElementById('shopNextButton');
	shopNextButton.addEventListener('click', function() {
	    var regionBN = null;
	    var categoryBN = null;
	    var maxPriceBN = null;
	    var vendorAddr = null
	    console.log('shopNextButton: shopNextButton.productStartIdxBN = ' + shopNextButton.productStartIdxBN.toString(10));
	    displayProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, shopNextButton.productStartIdxBN);
	});
	//shopPrevButton
    },

};


/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
function handleSearchProducts() {
    common.setMenuButtonState('shopButton',          'Selected');
    common.setMenuButtonState('dashboardButton',     'Enabled');
    common.setMenuButtonState('createStoreButton',   'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    const shopPrevButton = document.getElementById('shopPrevButton');
    const shopNextButton = document.getElementById('shopPrevButton');
    common.setMenuButtonState('shopPrevButton', 'Disabled');
    common.setMenuButtonState('shopNextButton', 'Disabled');

}

function shopDoSearch() {
    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var maxPriceBN = null;
    var vendorAddr = null
    common.replaceElemClassFromTo('shopNextPrevDiv',  'hidden',   'visibleB', null);
    const productStartIdxBN = new BN('1', 16);
    displayProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, productStartIdxBN);
}


function displayProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, productStartIdxBN) {
    const shopTilesDiv = document.getElementById('shopTilesDiv');
    while (shopTilesDiv.hasChildNodes()) {
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild);
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild.toString());
	shopTilesDiv.removeChild(shopTilesDiv.lastChild);
    }
    console.log('displayProducts: getting product logs. productStartIdxBN = ' + productStartIdxBN.toString(10));
    const maxProducts = 8;
    meUtil.getProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, true,
		       productStartIdxBN, maxProducts, function(err, noProducts, lastProductIdBN) {
	console.log('displayProducts: err = ' + err);
	const shopPrevButton = document.getElementById('shopPrevButton');
	const shopNextButton = document.getElementById('shopNextButton');
	//this doesn't work unless we can search backwards :(
	shopPrevButton.productStartIdxBN = productStartIdxBN.subn(1);
	shopNextButton.productStartIdxBN = lastProductIdBN.addn(1);
	common.setMenuButtonState('shopPrevButton', (productStartIdxBN.ltn(8)) ? 'Disabled' : 'Enabled');
	common.setMenuButtonState('shopNextButton', (noProducts == 8) ? 'Enabled' : 'Disabled');
	console.log('displayProducts: shopNextButton.productStartIdxBN = ' + shopNextButton.productStartIdxBN.toString(10));
    }, function(err, product) {
	if (!!err)
	    return;
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
	shopTilesDiv.appendChild(tileDiv);
	//tileDiv.addEventListener('click', () => editProduct(product))
    });
}
