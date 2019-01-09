/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const dhcrypt = require('./dhcrypt');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
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
	//for message transport
	setAttachButtonHandler();
	setSendButtonHandler();
	//
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

	const purchaseProductButton = document.getElementById('purchaseProductButton');
	purchaseProductButton.addEventListener('click', function() {
	    if (!!shop.selectedProduct)
		handlePurchase(shop.selectedProduct);
	});

    },

    productsPerPage: 8,
    productSearchFilter: null,
    displayedProductsStartIdx: 0,
    selectedProduct: null,
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
    shop.selectedProduct = null;
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
    common.replaceElemClassFromTo('shopPageDiv',           'visibleT', 'hidden',    null);
    common.replaceElemClassFromTo('selctedProductPageDiv', 'hidden',   'visibleB',  null);
    common.replaceElemClassFromTo('msgAreaDiv',            'visibleB',    'hidden', true);
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
    shop.selectedProduct = product;
}

function handlePurchase(product) {
    meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	console.log('handlePurchase: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	if (wdaiBalanceBN.gte(product.priceBN))
	    setupMsgArea(product.vendorAddr, product.productIdBN, product.priceBN, function(err) {
		if (!!err)
		    alert(err);
	    });
	else
	    alert("You don't have enough W-Dai to purchase this product.");
    });
}


/* ------------------------------------------------------------------------------------------------------------------
   message functions
   ------------------------------------------------------------------------------------------------------------------ */
function setupMsgArea(vendorAddr, productIdBN, priceBN, cb) {
    if (!ether.validateAddr(vendorAddr)) {
	cb('Error: vendor has an invalid Ethereum address.');
	return;
    }
    //
    mtEther.accountQuery(common.web3, vendorAddr, function(err, toAcctInfo) {
	const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	if (!toPublicKey || toPublicKey == '0x') {
	    cb('Error: no Message-Transport account was found for vendor address.');
	    return;
	}
	const msgPromptArea = document.getElementById('msgPromptArea');
	msgPromptArea.value = 'To: ';
	const msgAddrArea = document.getElementById('msgAddrArea');
	msgAddrArea.disabled = true;
	msgAddrArea.readonly = 'readonly';
	msgAddrArea.value = vendorAddr;
	//
	common.replaceElemClassFromTo('msgAreaDiv',         'hidden',    'visibleB',  false);
	//attach button can be enabled, since addr is already validated
	common.replaceElemClassFromTo('attachmentButton',   'hidden',    'visibleIB', false);
	common.replaceElemClassFromTo('attachmentInput',    'visibleIB', 'hidden', true);
	const attachmentSaveA = document.getElementById('attachmentSaveA');
	attachmentSaveA.style.display = 'none';
	//
	const msgTextArea = document.getElementById('msgTextArea');
	msgTextArea.className = (msgTextArea.className).replace('hidden', 'visibleIB');
	msgTextArea.value = '';
	msgTextArea.disabled = false;
	msgTextArea.readonly = '';
	msgTextArea.placeholder='Enter data pertinent to your purchase here.\nFor example, if a shipping address is required, then enter it here. ' +
	    'Also if you have any special instructions for a custom order, enter them here.\n\nThe seller will have a chance to review your ' +
	    'instructions / shipping address before approving the purchase. If the seller does not approve the purchase, then the escrow will ' +
	    'be canceled, and all your funds will be returned.';

	const msgPriceArea = document.getElementById('msgPriceArea');
	msgPriceArea.value = 'Price: ' + meEther.daiBNToUsdStr(priceBN) + ' Dai';
	//fees: see how many messages have been sent from the proposed recipient to me
	mtEther.getPeerMessageCount(common.web3, vendorAddr, common.web3.eth.accounts[0], function(err, msgCount) {
	    console.log('setupMsgArea: ' + msgCount.toString(10) + ' messages have been sent from ' + vendorAddr + ' to me');
	    const fee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
	    const msgFeeArea = document.getElementById('msgFeeArea');
	    msgFeeArea.value = 'Fee: ' + ether.convertWeiToComfort(common.web3, fee);
	    cb(null);
	});
	const statusDiv = document.getElementById('statusDiv');
	common.clearStatusDiv(statusDiv);
    });
}



function setAttachButtonHandler() {
    const attachmentButton = document.getElementById('attachmentButton');
    const attachmentInput = document.getElementById('attachmentInput');
    const attachmentSaveA = document.getElementById('attachmentSaveA');
    const deleteImg = document.getElementById('deleteImg');
    deleteImg.addEventListener('click', function() {
	attachmentSaveA.href = null;
	attachmentSaveA.download = null;
	attachmentInput.value = attachmentInput.files = null;
	attachmentSaveA.style.display = 'none';
	common.replaceElemClassFromTo('attachmentInput', 'visibleIB', 'hidden', true);
	common.replaceElemClassFromTo('attachmentButton', 'hidden', 'visibleIB', false);
	deleteImg.style.display = 'none';
    });
    attachmentButton.addEventListener('click', function() {
	attachmentInput.value = attachmentInput.files = null;
	common.replaceElemClassFromTo('attachmentButton', 'visibleIB', 'hidden', true);
	common.replaceElemClassFromTo('attachmentInput', 'hidden', 'visibleIB', false);
    });
    attachmentInput.addEventListener('change', function() {
	console.log('attachmentInput: got change event');
	if (attachmentInput.files && attachmentInput.files[0]) {
	    console.log('attachmentInput: got ' + attachmentInput.files[0].name);
            const reader = new FileReader();
            reader.onload = (e) => {
		//eg. e.target.result = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...
		console.log('attachmentInput: e.target.result = ' + e.target.result);
		//
		attachmentSaveA.href = e.target.result;
		attachmentSaveA.download = attachmentInput.files[0].name;
		const attachmentSaveSpan = document.getElementById('attachmentSaveSpan');
		attachmentSaveSpan.textContent = attachmentInput.files[0].name;
		attachmentSaveA.style.display = 'inline-block';
		deleteImg.style.display = 'inline-block';
		common.replaceElemClassFromTo('attachmentInput', 'visibleIB', 'hidden', true);
            };
            reader.readAsDataURL(attachmentInput.files[0]);
        } else {
	    attachmentSaveA.href = null;
	}
    });
}


//
// the send button performs the purchase
//
function setSendButtonHandler() {
    console.log('setSendButtonHandler');
    const sendButton = document.getElementById('sendButton');
    sendButton.addEventListener('click', function() {
	console.log('sendButton');
	const msgAddrArea = document.getElementById('msgAddrArea');
	const msgTextArea = document.getElementById('msgTextArea');
	let message = msgTextArea.value;
	sendButton.disabled = true;
	msgTextArea.disabled = true;
	msgAddrArea.disabled = true;
	//
	let attachmentIdxBN;
	const attachmentSaveA = document.getElementById('attachmentSaveA');
	if (!attachmentSaveA.href || !attachmentSaveA.download) {
	    attachmentIdxBN = new BN(0);
	} else {
	    const nameLenBN = new BN(attachmentSaveA.download.length);
	    attachmentIdxBN = new BN(message.length).iuor(nameLenBN.ushln(248));
	    message += attachmentSaveA.download + attachmentSaveA.href;
	    console.log('sendButton: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	    console.log('sendButton: message = ' + message);
	}
	//
	const toAddr = msgAddrArea.value;
	//the toAddr has already been validated. really.
	mtEther.accountQuery(common.web3, toAddr, function(err, toAcctInfo) {
	    //encrypt the message...
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    if (!toPublicKey || toPublicKey == '0x') {
		alert('Encryption error: unable to look up destination address in contract!');
		handleUnlockedMetaMask(null);
		return;
	    }
	    const sentMsgCtrBN = common.numberToBN(common.acctInfo.sentMsgCount);
	    sentMsgCtrBN.iaddn(1);
	    console.log('setSendButtonHandlers: toPublicKey = ' + toPublicKey);
	    const ptk = dhcrypt.ptk(toPublicKey, toAddr, common.web3.eth.accounts[0], '0x' + sentMsgCtrBN.toString(16));
	    console.log('setSendButtonHandlers: ptk = ' + ptk);
	    const encrypted = dhcrypt.encrypt(ptk, message);
	    console.log('setSendButtonHandlers: encrypted (length = ' + encrypted.length + ') = ' + encrypted);
	    //in order to figure the message fee we need to see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(common.web3, toAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log(msgCount.toString(10) + ' messages have been sent from ' + toAddr + ' to me');
		const msgFee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		console.log('msgFee is ' + msgFee + ' wei');
		//display "waiting for metamask" in case metamask dialog is hidden
		const metaMaskModal = document.getElementById('metaMaskModal');
		metaMaskModal.style.display = 'block';
		const escrowIDBN = new BN(0);
		const surchargeBN = new BN(0);
		meEther.purchaseDeposit(escrowIDBN, shop.selectedProduct.productIdBN, surchargeBN, msgFee, attachmentIdxBN, encrypted, function(err, txid) {
		    console.log('txid = ' + txid);
		    metaMaskModal.style.display = 'none';
		    const statusDiv = document.getElementById('statusDiv');
		    common.waitForTXID(err, txid, 'Purchase-Deposit', statusDiv, handleSearchProducts, ether.etherscanioTxStatusHost, function() {
		    });
		});
	    });
	});
    });
}
