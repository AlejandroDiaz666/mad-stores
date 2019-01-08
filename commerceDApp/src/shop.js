/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


var shop = module.exports = {

    handleShopPage: function() {
	common.setMenuButtonState('shopButton',          'Selected');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Enabled');
	common.replaceElemClassFromTo('shopPageDiv',           'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv',    'hidden',   'visibleT', null);
	common.replaceElemClassFromTo('selctedProductPageDiv', 'visibleB', 'hidden',   null);
	const categoryBN = new BN('0', 16);
	const shopCategoryTlcSel = document.getElementById('shopCategoryTlcSel');
	const shopCategoryLlcBitsSel = document.getElementById('shopCategoryLlcBitsSel');
	categories.addTlcOptionsElems(categoryBN, shopCategoryTlcSel);
	categories.addLlcBitsOptionsElems(shopCategoryTlcSel.value, categoryBN, shopCategoryLlcBitsSel, null);
	const shopRegionTlrSel = document.getElementById('shopRegionTlrSel');
	const shopRegionLlrBitsSel = document.getElementById('shopRegionLlrBitsSel');
	regions.addTlrOptionsElems(categoryBN, shopRegionTlrSel);
	regions.addLlrBitsOptionsElems(shopRegionTlrSel.value, categoryBN, shopRegionLlrBitsSel, null);
	handleSearchProducts();
    },

    setButtonHandlers: function() {
	const shopDoSearchButton = document.getElementById('shopDoSearchButton');
	shopDoSearchButton.addEventListener('click', function() {
	    shopDoSearch();
	});
	const shopNextButton = document.getElementById('shopNextButton');
	console.log('setButtonHandlers: shopNextButton = ' + shopNextButton);
	shopNextButton.addEventListener('click', function() {
	    shop.displayedProductsStartIdx += shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    console.log('shopNextButton: displayedProductsStartIdx = ' + shop.displayedProductsStartIdx);
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, showProductDetail, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				   });
	});
	const shopPrevButton = document.getElementById('shopPrevButton');
	shopPrevButton.addEventListener('click', function() {
	    shop.displayedProductsStartIdx -= shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, showProductDetail, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				   });
	});
	//
	const shopCategoryTlcSel = document.getElementById('shopCategoryTlcSel');
	const shopCategoryLlcBitsSel = document.getElementById('shopCategoryLlcBitsSel');
	shopCategoryTlcSel.addEventListener('change', () => {
	    const categoryBN = common.numberToBN(shopCategoryTlcSel.value).iushln(248);
	    categories.addLlcBitsOptionsElems(shopCategoryTlcSel.value, categoryBN, shopCategoryLlcBitsSel, null);
	    //enable search button?
	}, {passive: true} );
	const shopRegionTlrSel = document.getElementById('shopRegionTlrSel');
	const shopRegionLlrBitsSel = document.getElementById('shopRegionLlrBitsSel');
	shopRegionTlrSel.addEventListener('change', () => {
	    const categoryBN = common.numberToBN(shopRegionTlrSel.value).iushln(248);
	    regions.addLlrBitsOptionsElems(shopRegionTlrSel.value, categoryBN, shopRegionLlrBitsSel, null);
	    //enable search button?
	}, {passive: true} );
	//enable search button?
	//shopCategoryLlcBitsSel.addEventListener('input', enableSearchButton);
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
    const maxPriceBN = null;
    const onlyAvailable = false; //should be true, but now testing
    //
    const shopCategoryTlcSel = document.getElementById('shopCategoryTlcSel');
    const shopCategoryLlcBitsSel = document.getElementById('shopCategoryLlcBitsSel');
    const categoryBN = common.numberToBN(shopCategoryTlcSel.value).iushln(248);
    for (let i = 0; i < shopCategoryLlcBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(shopCategoryLlcBitsSel.selectedOptions[i].value);
	categoryBN.iuor(llcBitsBn);
    }
    console.log('shopDoSearch: categoryBN = 0x' + categoryBN.toString(16));
    const shopRegionTlrSel = document.getElementById('shopRegionTlrSel');
    const shopRegionLlrBitsSel = document.getElementById('shopRegionLlrBitsSel');
    const regionBN = common.numberToBN(shopRegionTlrSel.value).iushln(248);
    for (let i = 0; i < shopRegionLlrBitsSel.selectedOptions.length; ++i) {
	const llrBitsBn = common.numberToBN(shopRegionLlrBitsSel.selectedOptions[i].value);
	regionBN.iuor(llrBitsBn);
    }
    console.log('shopDoSearch: regionBN = 0x' + regionBN.toString(16));
    //
    shop.displayedProductsStartIdx = 0;
    shop.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable);
    const shopTilesDiv = document.getElementById('shopTilesDiv');
    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, showProductDetail, shop.displayedProductsStartIdx, shop.productsPerPage,
			   function(prevEnable, nextEnable) {
			       console.log('shopDoSearch: prevEnable = ' + prevEnable + ', nextEnable = ' + nextEnable);
			       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
			       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
			   });
}


function showProductDetail(product) {
    console.log('showProductDetail: productIdBN = 0x' + product.productIdBN.toString(16) + ', name = ' + product.name);
    //so user can go back to search
    common.setMenuButtonState('shopButton', 'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',           'visibleT', 'hidden',   null);
    common.replaceElemClassFromTo('selctedProductPageDiv', 'hidden',   'visibleB', null);
    //
    const shopProductDetailImg = document.getElementById('shopProductDetailImg');
    const shopProductDetailName = document.getElementById('shopProductDetailName');
    const shopProductDetailDesc = document.getElementById('shopProductDetailDesc');
    const shopProductDetailPrice = document.getElementById('shopProductDetailPrice');
    const shopProductDetailQuantity = document.getElementById('shopProductDetailQuantity');
    //
    shopProductDetailImg.src = product.image;
    shopProductDetailName.textContent = product.name.substring(0, 22);
    shopProductDetailDesc.textContent = product.desc.substring(0, 70);
    shopProductDetailPrice.textContent = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai';
    shopProductDetailQuantity.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
}
