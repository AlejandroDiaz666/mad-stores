/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const mtUtil = require('./mtUtil');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


var shop = module.exports = {

    handleShopPage: function() {
	common.setMenuButtonState('shopButton',          'Selected');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Enabled');
	common.replaceElemClassFromTo('shopPageDiv',            'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv',     'hidden',   'visibleT', null);
	common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden',   null);
	common.replaceElemClassFromTo('msgAreaDiv',             'visibleB', 'hidden',   false);
	const categoryBN = new BN('0', 16);
	const shopCategoryTlcSel = document.getElementById('shopCategoryTlcSel');
	const shopCategoryLlcBitsSel = document.getElementById('shopCategoryLlcBitsSel');
	categories.addTlcOptionsElems(categoryBN, shopCategoryTlcSel);
	categories.addLlcBitsOptionsElems(shopCategoryTlcSel.value, categoryBN, shopCategoryLlcBitsSel, null);
	const shopRegionTlrSel = document.getElementById('shopRegionTlrSel');
	const shopRegionLlrBitsSel = document.getElementById('shopRegionLlrBitsSel');
	regions.addTlrOptionsElems(categoryBN, shopRegionTlrSel);
	regions.addLlrBitsOptionsElems(shopRegionTlrSel.value, categoryBN, shopRegionLlrBitsSel, null);
	shop.selectedProductCloseFcn = null;
	handleSearchProducts();
    },

    setButtonHandlers: function() {
	//
	const shopDoSearchButton = document.getElementById('shopDoSearchButton');
	shopDoSearchButton.addEventListener('click', function() {
	    shopDoSearch();
	});
	const shopNextButton = document.getElementById('shopNextButton');
	console.log('setButtonHandlers: shopNextButton = ' + shopNextButton);
	shopNextButton.addEventListener('click', function() {
	    common.setLoadingIcon('start');
	    shop.displayedProductsStartIdx += shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    console.log('shopNextButton: displayedProductsStartIdx = ' + shop.displayedProductsStartIdx);
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, selectProduct, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				       common.setLoadingIcon(null);
				   });
	});
	const shopPrevButton = document.getElementById('shopPrevButton');
	shopPrevButton.addEventListener('click', function() {
	    shop.displayedProductsStartIdx -= shop.productsPerPage;
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, selectProduct, shop.displayedProductsStartIdx, shop.productsPerPage,
				   function(prevEnable, nextEnable) {
				       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
				       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
				   });
	});
	//initialize these to disabled now. we don't want to modify their state when the page is reloaded
	common.setMenuButtonState('shopPrevButton', 'Disabled');
	common.setMenuButtonState('shopNextButton', 'Disabled');
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
	const purchaseProductButton = document.getElementById('purchaseProductButton');
	purchaseProductButton.addEventListener('click', function() {
	    if (!!shop.selectedProduct)
		handlePurchase(shop.selectedProduct);
	});
	const selectedProductCloseImg = document.getElementById('selectedProductCloseImg');
	selectedProductCloseImg.addEventListener('click', function() {
	    console.log('selectedProductCloseImg: got click');
	    if (!!shop.selectedProductCloseFcn)
		shop.selectedProductCloseFcn();
	});
    },

    productsPerPage: 8,
    productSearchFilter: null,
    displayedProductsStartIdx: 0,
    selectedProduct: null,
    selectedProductCloseFcn: null,

    //
    // this fcn shows the product, as it appears in the shop/product-detail page. but it can be used by other
    // pages to review how the product advertisement looks
    //
    // mode = [ 'shop' | 'view' ]
    //
    hideProductDetail: function() {
	common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden', null);
	shop.selectedProductCloseFcn = null;
    },
    showProductDetail: function(product, mode, closeCB) {
	console.log('showProductDetail: productIdBN = 0x' + product.productIdBN.toString(16) + ', name = ' + product.name);
	common.replaceElemClassFromTo('selectedProductPageDiv', 'hidden', 'visibleB', null);
	common.setElemClassToOneOf('selectedProductPageDiv', 'shop', 'view', mode);
	shop.selectedProductCloseFcn = closeCB;
	//
	const selectedProductDetailImg = document.getElementById('selectedProductDetailImg');
	const selectedProductDetailName = document.getElementById('selectedProductDetailName');
	const selectedProductDetailDesc = document.getElementById('selectedProductDetailDesc');
	const selectedProductDetailPrice = document.getElementById('selectedProductDetailPrice');
	const selectedProductDetailQuantity = document.getElementById('selectedProductDetailQuantity');
	//
	selectedProductDetailImg.src = product.image;
	selectedProductDetailName.textContent = product.name.substring(0, 22);
	selectedProductDetailDesc.textContent = product.desc.substring(0, 140);
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
		meEther.vendorAccountQuery(common.web3, product.vendorAddr, function(err, vendorAcctInfo) {
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
		    selectedProductSellerBurns.textContent = deliveriesRejectedBN.toString(10) + ' deliveries rejected out of ' + totalBN.toString(10);
		    selectedProductSellerRating.textContent = 'Average rating: ' + avgRatingBN.toString(10) + ' (' + grade + ')';
		});
		meEther.parseRegisterVendorEvent(result[result.length - 1], function(err, vendorAddr, name, desc, image) {
		    selectedProductSellerName.textContent = name;
		    selectedProductSellerDesc.textContent = desc;
		    selectedProductSellerImg.src = image;
		});
	    }
	});
    },

};


/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
function handleSearchProducts() {
    common.setMenuButtonState('shopButton',          'Selected');
    common.setMenuButtonState('dashboardButton',     'Enabled');
    common.setMenuButtonState('createStoreButton',   'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',            'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('dashboardPageDiv',       'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStorePageDiv',     'visibleT', 'hidden',   null);
    common.replaceElemClassFromTo('msgAreaDiv',             'visibleB', 'hidden',   false);
    shop.selectedProduct = null;
}


function shopDoSearch() {
    // after user enters earch parameters....
    common.replaceElemClassFromTo('shopNextPrevDiv',  'hidden',   'visibleB', null);
    common.setLoadingIcon('start');
    const vendorAddr = null
    const maxPriceBN = null;
    const onlyAvailable = true;
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
    meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, selectProduct, shop.displayedProductsStartIdx, shop.productsPerPage,
			   function(prevEnable, nextEnable) {
			       console.log('shopDoSearch: prevEnable = ' + prevEnable + ', nextEnable = ' + nextEnable);
			       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
			       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
			       common.setLoadingIcon(null);
			   });
}


//
// called when user selects a product from the shop page
function selectProduct(product) {
    console.log('selectProduct: productIdBN = 0x' + product.productIdBN.toString(16) + ', name = ' + product.name);
    //so user can go back to search (but not to create store... cuz we need to clean up)
    common.setMenuButtonState('shopButton',        'Enabled');
    common.setMenuButtonState('createStoreButton', 'Disabled');
    common.replaceElemClassFromTo('shopPageDiv',            'visibleT', 'hidden',    null);
    common.replaceElemClassFromTo('selectedProductPageDiv', 'hidden',   'visibleB',  null);
    common.replaceElemClassFromTo('msgAreaDiv',             'visibleB', 'hidden',    true);
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    shop.selectedProduct = product;
    shop.showProductDetail(product, 'shop', handleSearchProducts);
}


function handlePurchase(product) {
    meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	console.log('handlePurchase: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	const escrowBN = product.priceBN.muln(3).divn(2);
	if (wdaiBalanceBN.lt(escrowBN)) {
	    alert('You don\'t have enough W-Dai to purchase this product.\n\n' +
		  'The price is ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai, so you will need ' +
		  meEther.daiBNToUsdStr(escrowBN) + ' W-Dai to put into escrow.');
	} else {
	    const placeholderText =
		  '\n' +
		  'Type your message here...\n\n' +
		  'You are about to move funds into an escrow account to purchase this prodct!\n\n' +
		  'Enter data pertinent to your purchase here.\n' +
		  'For example, if a shipping address is required, then enter it here. Also if you have any special instructions for a custom order, ' +
		  'enter them here.\n\n' +
		  'The seller will have a chance to review your instructions / shipping address before approving the purchase. If the seller does not ' +
		  'approve the purchase, then the escrow will be canceled, and all your funds will be returned.';
	    const priceDesc = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai; You will deposit ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
	    mtUtil.setupComposeMsgArea(product.vendorAddr, placeholderText, priceDesc, 'Send/Purchase', function(err, attachmentIdxBN, message) {
		if (!!err) {
		    alert(err);
		    return;
		}
		//new escrow, no surcharge beyond advertised product price
		meUtil.purchaseProduct(new BN(0), new BN(0),
				       shop.selectedProduct.productIdBN, shop.selectedProduct.vendorAddr, attachmentIdxBN, new BN(0), message, function(err) {
		    if (!!err)
			alert(err);
		    else
			alert('You have just ordered a product; please give the seller\n' +
			      'some time to review and approve or reject your order.\n' +
			      'You can track the progress of your order on the dashboard\n' +
			      'page\n\n' +
			      'Be sure to check Turms Message Transport, periodically,\n' +
			      'to see if the seller has sent you any messages.');
		    handleSearchProducts();
		});
	    });
	}
    });
}
