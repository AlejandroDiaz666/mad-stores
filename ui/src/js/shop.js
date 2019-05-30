/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const dhcrypt = require('./dhcrypt');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const mtUtil = require('./mtUtil');
const mtDisplay = require('./mtDisplay');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


var shop = module.exports = {

    minPrice: 0,
    maxPrice: 100000,
    productsPerPage: 8,
    productSearchFilter: null,
    selectedProduct: null,

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
	    if (!mtUtil.publicKey || mtUtil.publicKey == '0x' || !dhcrypt.dh || mtUtil.publicKey != dhcrypt.publicKey()) {
		document.getElementById('noteDialogIntro').textContent =
		    'The current MetaMask account is not registered with Turms AMT. in order to purchase an item ' +
		    'you will need an Ethereum address registered with Turms AMT.';
		document.getElementById('noteDialogNote').innerHTML =
		    'To register this address please visit<br/>' +
		    '<a href="https://ipfs.io/ipns/messagetransport.turmsanonymous.io/">Turms AMT</a>';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    } else {
		if (!!shop.selectedProduct)
		    handlePurchase(shop.selectedProduct);
	    }
	});
    },

    //
    // updateDaiAndWDai
    // helper for handleUnlockedMetaMask
    //
    updateDaiAndWDai: function() {
	meEther.getDaiBalance(common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	    const daiBalanceArea = document.getElementById('daiBalanceArea');
	    daiBalanceArea.value = '  Dai Balance: ' + meEther.daiBNToUsdStr(daiBalanceBN, 6) + ' Dai';
	});
	meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    common.wdaiBalanceBN = wdaiBalanceBN;
	    console.log('updateDaiAndWDai: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	    const wdaiBalanceArea = document.getElementById('wdaiBalanceArea');
	    wdaiBalanceArea.value = 'W-Dai Balance: ' + meEther.daiBNToUsdStr(wdaiBalanceBN) + ' W-Dai';
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
    common.replaceElemClassFromTo('dashboardPageDiv',       'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStorePageDiv',     'visibleT', 'hidden',   null);
    common.replaceElemClassFromTo('msgAreaDiv',             'visibleB', 'hidden',   false);
    shop.selectedProduct = null;
}


function shopDoSearch() {
    const minPriceBN = meEther.usdStrToDaiBN(shop.minPrice);
    const maxPriceBN = meEther.usdStrToDaiBN(shop.maxPrice);
    const minRatingBN = common.numberToBN(document.getElementById('searchRatingSelect').value);
    const minDeliveriesBN = common.numberToBN(document.getElementById('searchSalesSelect').value);
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
    const onlyAvailable = true;
    const storeAddrArea = document.getElementById('storeAddrArea');
    // fcn to validate vendor addr
    const validateAddr = (vendorAddrIn, cb) => {
	console.log('shopDoSearch: vendorAddrIn = ' + vendorAddrIn);
	if (!!vendorAddrIn && vendorAddrIn.indexOf(' ') >= 0) {
	    //for ens names, pick up the name
	    vendorAddrIn = vendorAddrIn.substring(0, vendorAddrIn.indexOf(' '));
	    console.log('shopDoSearch: extracted vendorAddrIn = ' + vendorAddrIn);
	}
	if (!vendorAddrIn) {
	    cb(null, null);
	} else if (ether.validateAddr(vendorAddrIn)) {
	    ether.ensReverseLookup(vendorAddrIn, function(err, name) {
		console.log('validateAddrButton: reverse ENS results: err = ' + err + ', name = ' + name);
		if (!err && !!name)
		    storeAddrArea.value = common.abbreviateAddrForEns(vendorAddrIn, name, -3);
	    });
	    cb(null, vendorAddrIn);
	} else {
	    ether.ensLookup(vendorAddrIn, function(err, addr) {
		if (!err && !!addr) {
		    storeAddrArea.value = common.abbreviateAddrForEns(addr, vendorAddrIn, -3);
		    cb(null, addr);
		} else
		    cb('invalid vendor address', null);
	    });
	}
    };
    validateAddr(storeAddrArea.value.trim(), function(err, vendorAddr) {
	if (!!err) {
	    alert(err);
	} else {
	    const shopTilesDiv = document.getElementById('shopTilesDiv');
	    shop.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, onlyAvailable);
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
    common.replaceElemClassFromTo('msgAreaDiv',             'visibleB', 'hidden',    true);
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    shop.selectedProduct = product;
    meUtil.showProductDetail(product, 'shop', 'extend', handleSearchProducts);
}


function handlePurchase(product) {
    meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	console.log('handlePurchase: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	const escrowBN = product.priceBN.muln(3).divn(2);
	if (wdaiBalanceBN.lt(escrowBN)) {
	    document.getElementById('noteDialogIntro').textContent =
		'You don\'t have enough W-Dai to purchase this product.';
	    document.getElementById('noteDialogNote').textContent =
		'The price is ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai, so you will need ' +
		meEther.daiBNToUsdStr(escrowBN) + ' W-Dai to put into escrow.';
	    common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
	    common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
	    common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
	    common.noteOkHandler = null;
	} else {
	    const placeholderText =
		  '\n' +
		  'Type your message here...\n\n' +
		  'You are about to move funds into an escrow account to purchase this product!\n\n' +
		  'Enter data pertinent to your purchase here.\n' +
		  'For example, if a shipping address is required, then enter it here. Also if you have any special instructions for a custom order, ' +
		  'enter them here.\n\n' +
		  'The seller will have a chance to review your instructions / shipping address before approving the purchase. If the seller does not ' +
		  'approve the purchase, then the escrow will be canceled, and all your funds will be returned.';
	    const msgDesc = 'Price: ' + meEther.daiBNToUsdStr(product.priceBN) + ' Dai; You will deposit ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
	    mtDisplay.setupComposeMsgArea(product.vendorAddr, placeholderText, msgDesc, null, null, 'Send/Purchase', function(err, attachmentIdxBN, message) {
		if (!!err) {
		    alert(err);
		    return;
		}
		//new escrow, no surcharge beyond advertised product price
		meUtil.purchaseProduct(new BN(0), new BN(0),
				       shop.selectedProduct.productIdBN, shop.selectedProduct.vendorAddr, attachmentIdxBN, new BN(0), message, function(err) {
		   meUtil.hideProductDetail();
		   if (!!err)
			alert(err);
		   else {
		       document.getElementById('noteDialogIntro').textContent =
			   'You have just ordered a product; please give the seller some time to review and approve ' +
			   'or reject your order. You can track the progress of your order on the dashboard page.';
		       document.getElementById('noteDialogNote').textContent =
			   'Be sure to check periodically to see if the seller has sent you any messages.';
		       common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		       common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		       common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		       common.noteOkHandler = handleSearchProducts;
		   }
		});
	    });
	}
    });
}
