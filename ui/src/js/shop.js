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

    minPrice: 0,
    maxPrice: 100000,

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
	const shopTilesDiv = document.getElementById('shopTilesDiv');
	shopTilesDiv.addEventListener('scroll', function() {
	    console.log('got scroll');
	    if (!!shop.productSearchFilter) {
		meUtil.populateProductList(shopTilesDiv, 0, selectProduct, function(err) {
		    if (err)
			alert(err)
		});
	    }
	});
	//
	// slider values are 19 || 20 to 100
	// price is (exponential) 0 to 100000
	// base is float 0.0 || 1.0 to 5.0
	// price is 10^0 || 10^1.0 to 10^5.0
	const minPriceSlider = document.getElementById('minPriceSlider');
	const maxPriceSlider = document.getElementById('maxPriceSlider');
	const priceTooltip = document.getElementById('priceTooltip');
	minPriceSlider.addEventListener('change', function() {
	    if (parseInt(minPriceSlider.value) >= parseInt(maxPriceSlider.value)) {
		const newVal = parseInt(minPriceSlider.value) - 3;
		minPriceSlider.value = newVal;
	    }
	    const slideValue = minPriceSlider.value < 20 ? 0 : minPriceSlider.value;
	    const baseValue = parseFloat(slideValue) / 20;
	    shop.minPrice = (slideValue == 0) ? 0 : parseInt(Math.pow(10, baseValue));
	    priceTooltip.textContent = 'Min price: ' + shop.minPrice + ' Dai, Max price: ' + shop.maxPrice + ' Dai';
	});
	maxPriceSlider.addEventListener('change', function() {
	    if (parseInt(maxPriceSlider.value) <= parseInt(minPriceSlider.value)) {
		const newVal = parseInt(minPriceSlider.value) + 3;
		maxPriceSlider.value = newVal;
	    }
	    const slideValue = maxPriceSlider.value < 20 ? 0 : maxPriceSlider.value;
	    const baseValue = parseFloat(slideValue) / 20;
	    shop.maxPrice = (slideValue == 0) ? 0 : parseInt(Math.pow(10, baseValue));
	    priceTooltip.textContent = 'Min price: ' + shop.minPrice + ' Dai, Max price: ' + shop.maxPrice + ' Dai';
	});
	//
	const shopDoSearchButton = document.getElementById('shopDoSearchButton');
	shopDoSearchButton.addEventListener('click', function() {
	    shopDoSearch();
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
	selectedProductDetailDesc.textContent = (product.desc.length > 120) ? product.desc.substring(0, 120) + '...' : product.desc;
	if (product.desc.length < 120) {
	    selectedProductDetailDesc.textContent = product.desc;
	} else {
	    selectedProductDetailDesc.textContent = product.desc.substring(0, 120) + '...';
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
    const shopTilesDiv = document.getElementById('shopTilesDiv');
    shop.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable);
    common.clearDivChildren(shopTilesDiv);
    meUtil.getProductIds(shop.productSearchFilter, 100, function(err) {
	if (err) {
	    alert(err)
	} else {
	    meUtil.populateProductList(shopTilesDiv, 0, selectProduct, function(err) {
		if (err)
		    alert(err)
	    });
	}
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
    meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
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
