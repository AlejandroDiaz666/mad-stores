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
	    shop.displayedProductsStartIdx += shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, null, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				   });
	});
	const shopPrevButton = document.getElementById('shopPrevButton');
	shopPrevButton.addEventListener('click', function() {
	    shop.displayedProductsStartIdx -= shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, null, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				   });
	});
    },

    productsPerPage: 8,
    productSearchFilter: null,
    displayedProductsStartIdx: 0,
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
    common.replaceElemClassFromTo('shopNextPrevDiv',  'hidden',   'visibleB', null);
    const vendorAddr = null
    const regionBN = null;
    const categoryBN = null;
    const maxPriceBN = null;
    const onlyAvailable = false; //should be true, but now testing
    shop.displayedProductsStartIdx = 0;
    shop.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable, shop.productsPerPage);
    const shopTilesDiv = document.getElementById('shopTilesDiv');
    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, null, shop.displayedProductsStartIdx, shop.productsPerPage,
			   function(prevEnable, nextEnable) {
			       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
			       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
			   });
}
