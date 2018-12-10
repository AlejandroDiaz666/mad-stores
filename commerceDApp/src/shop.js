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

    //
    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var maxPriceBN = null;
    var vendorAddr = null

    const shopTilesDiv = document.getElementById('shopTilesDiv');
    while (shopTilesDiv.hasChildNodes()) {
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild);
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild.toString());
	shopTilesDiv.removeChild(shopTilesDiv.lastChild);
    }

    console.log('handleSearchProducts: getting product logs');
    meUtil.getProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, function(err) {
	console.log('viewProductsSubPage: err = ' + err);
    }, function(product) {
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
