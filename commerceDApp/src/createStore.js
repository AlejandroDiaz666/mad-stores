/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add/edit-prod, view-prod
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


const createStore = module.exports = {

    handleCreateStorePage: function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Selected');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('dashboardPageDiv',   'visibleB', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
	common.replaceElemClassFromTo('msgAreaDiv',         'visibleB', 'hidden',   false);
	regStoreSubPage();
    },

    setButtonHandlers: function() {
	setRegisterStoreButtonHandlers();
	setAddProductButtonHandlers();
	setViewProductsButtonHandlers();
    },

    defaultRegionBN: null,
    productsPerPage: 8,
    productSearchFilter: null,
    displayedProductsStartIdx: 0,
};


function setRegisterStoreButtonHandlers() {
    const createStoreRegStoreButton = document.getElementById('createStoreRegStoreButton');
    createStoreRegStoreButton.addEventListener('click', function() {
	regStoreSubPage();
    });
    //create-store / reg store steps
    const createStoreRegStoreLoadImageButton = document.getElementById('createStoreRegStoreLoadImageButton');
    createStoreRegStoreLoadImageButton.addEventListener('change', function() {
	const createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
	if (createStoreRegStoreLoadImageButton.files && createStoreRegStoreLoadImageButton.files[0]) {
	    console.log('createStoreRegStoreLoadImageButton: got ' + URL.createObjectURL(createStoreRegStoreLoadImageButton.files[0]));
	    console.log('createStoreRegStoreLoadImageButton: got ' + createStoreRegStoreLoadImageButton.files[0].name);
            const reader = new FileReader();
            reader.onload = (e) => {
		//eg. createStoreRegStoreLoadImageButton: e.target.result = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...
                createStoreRegStoreImg.src = e.target.result;
            };
            reader.readAsDataURL(createStoreRegStoreLoadImageButton.files[0]);
        } else {
            createStoreRegStoreImg.src = '#';
	}
	enableRegisterStoreDoRegButton();
    });
    const createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    createStoreRegStoreNameArea.addEventListener('input', enableRegisterStoreDoRegButton);
    const createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    createStoreRegStoreDescArea.addEventListener('input', enableRegisterStoreDoRegButton);
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    createStoreAddProdPriceArea.addEventListener('change', enableRegisterStoreDoRegButton);
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    createStoreAddProdQuantityArea.addEventListener('change', enableRegisterStoreDoRegButton);
    const createStoreRegStoreTlrSel = document.getElementById('createStoreRegStoreTlrSel');
    const createStoreRegStoreLlrBitsSel = document.getElementById('createStoreRegStoreLlrBitsSel');
    createStoreRegStoreTlrSel.addEventListener('change', () => {
	const regionBN = common.numberToBN(createStoreRegStoreTlrSel.value).iushln(248);
	regions.addLlrBitsOptionsElems(createStoreRegStoreTlrSel.value, regionBN, createStoreRegStoreLlrBitsSel, 'All Regions');
	enableRegisterStoreDoRegButton();
    }, {passive: true} );
    createStoreRegStoreLlrBitsSel.addEventListener('input', enableRegisterStoreDoRegButton);
    const createStoreRegStoreDoRegButton = document.getElementById('createStoreRegStoreDoRegButton');
    createStoreRegStoreDoRegButton.addEventListener('click', registerStoreDoReg);
}


function setAddProductButtonHandlers() {
    const createStoreAddProductButton = document.getElementById('createStoreAddProductButton');
    createStoreAddProductButton.addEventListener('click', function() {
	addProductSubPage();
    });
    //create-store / add product steps
    const createStoreAddProdLoadImageButton = document.getElementById('createStoreAddProdLoadImageButton');
    createStoreAddProdLoadImageButton.addEventListener('change', function() {
	const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
	if (createStoreAddProdLoadImageButton.files && createStoreAddProdLoadImageButton.files[0]) {
	    console.log('createStoreAddProdLoadImageButton: got ' + createStoreAddProdLoadImageButton.files[0].name);
            const reader = new FileReader();
            reader.onload = (e) => {
		//console.log('createStoreAddProdLoadImageButton: e.target.result = ' + e.target.result);
		//eg. createStoreAddProdLoadImageButton: e.target.result = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...
                createStoreAddProdImg.src = e.target.result;
            };
            reader.readAsDataURL(createStoreAddProdLoadImageButton.files[0]);
        } else {
            createStoreAddProdImg.src = '#';
	}
	enableAddProductDoAddButton();
    });
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    createStoreAddProdNameArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    createStoreAddProdDescArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    createStoreAddProdPriceArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdTlcSel = document.getElementById('createStoreAddProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    createStoreAddProdTlcSel.addEventListener('change', () => {
	const categoryBN = common.numberToBN(createStoreAddProdTlcSel.value).iushln(248);
	categories.addLlcBitsOptionsElems(createStoreAddProdTlcSel.value, categoryBN, createStoreAddProdLlcBitsSel, 'None');
	enableAddProductDoAddButton();
    }, {passive: true} );
    createStoreAddProdLlcBitsSel.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdDoAddButton = document.getElementById('createStoreAddProdDoAddButton');
    createStoreAddProdDoAddButton.addEventListener('click', () => addProductDoAdd(null));
}


function setViewProductsButtonHandlers() {
    const createStoreViewProductsButton = document.getElementById('createStoreViewProductsButton');
    createStoreViewProductsButton.addEventListener('click', function() {
	viewProductsSubPage();
    });
    //create-store / edit product steps
    const createStoreEditProdLoadImageButton = document.getElementById('createStoreEditProdLoadImageButton');
    createStoreEditProdLoadImageButton.addEventListener('change', function() {
	const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
	if (createStoreEditProdLoadImageButton.files && createStoreEditProdLoadImageButton.files[0]) {
	    console.log('createStoreEditProdLoadImageButton: got ' + createStoreEditProdLoadImageButton.files[0].name);
            const reader = new FileReader();
            reader.onload = (e) => {
		//console.log('createStoreEditProdLoadImageButton: e.target.result = ' + e.target.result);
		//eg. createStoreEditProdLoadImageButton: e.target.result = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...
                createStoreEditProdImg.src = e.target.result;
            };
            reader.readAsDataURL(createStoreEditProdLoadImageButton.files[0]);
        } else {
            createStoreEditProdImg.src = '#';
	}
	enableViewProdsDoEditButton();
    });
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    createStoreEditProdNameArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    createStoreEditProdDescArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    createStoreEditProdPriceArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    createStoreEditProdTlcSel.addEventListener('change', () => {
	const categoryBN = common.numberToBN(createStoreEditProdTlcSel.value).iushln(248);
	categories.addLlcBitsOptionsElems(createStoreEditProdTlcSel.value, categoryBN, createStoreEditProdLlcBitsSel, 'None');
	enableViewProdsDoEditButton();
    }, {passive: true} );
    createStoreEditProdLlcBitsSel.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.addEventListener('click', () => { editProdDoEdit(createStoreViewProdsDoEditButton.productIdBN) }, {passive: true} );
    //
    const createStoreNextButton = document.getElementById('createStoreNextButton');
    console.log('setButtonHandlers: shopNextButton = ' + shopNextButton);
    createStoreNextButton.addEventListener('click', function() {
	createStore.displayedProductsStartIdx += createStore.productsPerPage;
	const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
	meUtil.displayProducts(createStore.productSearchFilter, createStoreViewProdsTilesDiv, viewProdsEditProduct, createStore.displayedProductsStartIdx, createStore.productsPerPage,
			       function(prevEnable, nextEnable) {
				   common.setMenuButtonState('createStorePrevButton', prevEnable ? 'Enabled' : 'Disabled');
				   common.setMenuButtonState('createStoreNextButton', nextEnable ? 'Enabled' : 'Disabled');
			       });
    });
    const createStorePrevButton = document.getElementById('createStorePrevButton');
    createStorePrevButton.addEventListener('click', function() {
	createStore.displayedProductsStartIdx -= createStore.productsPerPage;
	const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
	meUtil.displayProducts(createStore.productSearchFilter, createStoreViewProdsTilesDiv, viewProdsEditProduct, createStore.displayedProductsStartIdx, createStore.productsPerPage,
			       function(prevEnable, nextEnable) {
				   common.setMenuButtonState('createStorePrevButton', prevEnable ? 'Enabled' : 'Disabled');
				   common.setMenuButtonState('createStoreNextButton', nextEnable ? 'Enabled' : 'Disabled');
			       });
    });
}


//
// create-store - reg-store
//
function regStoreSubPage() {
    common.setMenuButtonState('shopButton',                    'Enabled');
    common.setMenuButtonState('dashboardButton',               'Enabled');
    common.setMenuButtonState('createStoreButton',             'Selected');
    common.setMenuButtonState('createStoreRegStoreButton',     'Selected');
    common.setMenuButtonState('createStoreAddProductButton',   'Disabled');
    common.setMenuButtonState('createStoreViewProductsButton', 'Disabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreNextPrevDiv',      'visibleB',   'hidden', null);
    common.setMenuButtonState('createStoreRegStoreDoRegButton', 'Disabled');
    common.waitingForTxid = false;
    common.clearStatusDiv();
    //
    meUtil.getVendorLogs(common.web3.eth.accounts[0], function(err, result) {
	console.log('regStoreSubPage: result.length = ' + result.length);
	const createStoreRegStoreButton = document.getElementById('createStoreRegStoreButton');
	const createStoreRegStoreDoRegButton = document.getElementById('createStoreRegStoreDoRegButton');
	const createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
	const createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
	const createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
	const createStoreRegStoreRegionSelector = document.getElementById('createStoreRegStoreRegionSelector');
	const createStoreRegStoreLoadImageButton = document.getElementById('createStoreRegStoreLoadImageButton');
	if (!!result && result.length > 0) {
	    createStoreRegStoreButton.textContent = 'Modify Store';
	    createStoreRegStoreDoRegButton.textContent = 'Re-register My Store';
	    meEther.vendorAccountQuery(common.web3.eth.accounts[0], function(err, vendorAcctInfo) {
		console.log('regStorePageSubPage: err = ' + err);
		console.log('regStorePageSubPage: vendorAcctInfo.activeFlag = ' + vendorAcctInfo.activeFlag);
		console.log('regStorePageSubPage: vendorAcctInfo.region = ' + vendorAcctInfo.region);
		createStore.defaultRegionBN = common.numberToBN(vendorAcctInfo.region);
		const createStoreRegStoreTlrSel = document.getElementById('createStoreRegStoreTlrSel');
		console.log('regStorePageSubPage: defaultRegionBN = 0x' + createStore.defaultRegionBN.toString(16));
		regions.addTlrOptionsElems(createStore.defaultRegionBN, createStoreRegStoreTlrSel);
		const createStoreRegStoreLlrBitsSel = document.getElementById('createStoreRegStoreLlrBitsSel');
		regions.addLlrBitsOptionsElems(createStoreRegStoreTlrSel.value, createStore.defaultRegionBN, createStoreRegStoreLlrBitsSel, 'None');
	    });
	    meEther.parseRegisterVendorEvent(result[result.length - 1], function(err, vendorAddr, name, desc, image) {
		createStoreRegStoreNameArea.value = name;
		createStoreRegStoreDescArea.value = desc;
		//image is eg. 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...'
		createStoreRegStoreImg.src = image;
	    });
	    common.setMenuButtonState('createStoreAddProductButton', 'Enabled');
	    common.setMenuButtonState('createStoreViewProductsButton', 'Enabled');
	} else {
	    createStoreRegStoreButton.textContent = 'Create Store';
	    createStoreRegStoreDoRegButton.textContent = 'Register My Store';
	    createStoreRegStoreNameArea.value = '';
	    createStoreRegStoreDescArea.value = '';
            createStoreRegStoreImg.src = '#';
	    createStore.defaultRegionBN = new BN('0', 16);
	    const createStoreRegStoreTlrSel = document.getElementById('createStoreRegStoreTlrSel');
	    console.log('regStorePageSubPage: defaultRegionBN = 0x' + createStore.defaultRegionBN.toString(16));
	    regions.addTlrOptionsElems(createStore.defaultRegionBN, createStoreRegStoreTlrSel);
	    const createStoreRegStoreLlrBitsSel = document.getElementById('createStoreRegStoreLlrBitsSel');
	    regions.addLlrBitsOptionsElems(createStoreRegStoreTlrSel.value, createStore.defaultRegionBN, createStoreRegStoreLlrBitsSel, 'None');
	}
    });
}

//
// enable the do-register
// called whenever any of the register-steps inputs changes
//
function enableRegisterStoreDoRegButton() {
    const createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    const createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    const createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
    const createStoreRegStoreTlrSel = document.getElementById('createStoreRegStoreTlrSel');
    const createStoreRegStoreLlrBitsSel = document.getElementById('createStoreRegStoreLlrBitsSel');
    //it's ok for createStoreRegStoreLlrBitsSel.value = zero
    const enable = (createStoreRegStoreNameArea.value.trim().length > 0 != "" &&
		    createStoreRegStoreDescArea.value.trim().length > 0 != "" &&
		    createStoreRegStoreImg.src != '#'                         &&
		    createStoreRegStoreTlrSel.value != 0                         ) ? true : false;
    common.setMenuButtonState('createStoreRegStoreDoRegButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the (re-)register-my-store button. execute the transaction.
//
function registerStoreDoReg() {
    const createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    const createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    const nameBytes = common.strToUtf8Bytes(createStoreRegStoreNameArea.value);
    const descBytes = common.strToUtf8Bytes(createStoreRegStoreDescArea.value);
    const createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
    //console.log('handleRegisterStore: createStoreRegStoreImg.src = ' + createStoreRegStoreImg.src);
    //rsStoreImg.src is "data:image/png;base64," + base64ImageData;
    const imageBytes = common.imageToBytes(createStoreRegStoreImg.src);
    //console.log('handleRegisterStore: imageBytes = ' + imageBytes);
    //console.log('handleRegisterStore: imageBytes.length = ' + imageBytes.length);
    const createStoreRegStoreTlrSel = document.getElementById('createStoreRegStoreTlrSel');
    const createStoreRegStoreLlrBitsSel = document.getElementById('createStoreRegStoreLlrBitsSel');
    const regionBN = common.numberToBN(createStoreRegStoreTlrSel.value).iushln(248);
    for (let i = 0; i < createStoreRegStoreLlrBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(createStoreRegStoreLlrBitsSel.selectedOptions[i].value);
	regionBN.iuor(llcBitsBn);
    }
    console.log('editProdDoEdit: regionBN = 0x' + regionBN.toString(16) + ' = ' + regionBN.toString(10));
    common.showWaitingForMetaMask(true);
    meEther.registerVendor(regionBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	common.showWaitingForMetaMask(false);
	common.setMenuButtonState('shopButton',          'Disabled');
	common.setMenuButtonState('dashboardButton',     'Disabled');
	common.setMenuButtonState('createStoreButton',   'Disabled');
	common.setMenuButtonState('createStoreRegStoreButton',     'Disabled');
	common.setMenuButtonState('createStoreAddProductButton',   'Disabled');
	common.setMenuButtonState('createStoreViewProductsButton', 'Disabled');
	common.waitForTXID(err, txid, 'Register-Vendor', regStoreSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}


//
// create-store - add-product
//
function addProductSubPage() {
    console.log('addProductSubPage');
    common.setMenuButtonState('createStoreRegStoreButton',     'Enabled');
    common.setMenuButtonState('createStoreAddProductButton',   'Selected');
    common.setMenuButtonState('createStoreViewProductsButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreNextPrevDiv',      'visibleB',   'hidden', null);
    common.setMenuButtonState('createStoreAddProdDoAddButton', 'Disabled');
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    //
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    createStoreAddProdNameArea.value = '';
    createStoreAddProdDescArea.value = '';
    createStoreAddProdImg.src = '#';
    createStoreAddProdPriceArea.value = '';
    createStoreAddProdQuantityArea.value = '';
    const categoryBN = new BN('0', 16);
    categories.addTlcOptionsElems(categoryBN, createStoreAddProdTlcSel);
    categories.addLlcBitsOptionsElems(createStoreAddProdTlcSel.value, categoryBN, createStoreAddProdLlcBitsSel, 'None');
}


//
// enable the do-add
// called whenever any of the add-product-steps inputs changes
//
function enableAddProductDoAddButton() {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreAddProdTlcSel = document.getElementById('createStoreAddProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    const enable = (createStoreAddProdNameArea.value.trim().length > 0 &&
		    createStoreAddProdDescArea.value.trim().length > 0 &&
		    createStoreAddProdImg.src != '#'                   &&
		    createStoreAddProdTlcSel.value != 0                &&
		    createStoreAddProdLlcBitsSel.value != 0              ) ? true : false;
    console.log('enableAddProductDoAddButton: createStoreAddProdImg.src = ' + createStoreAddProdImg.src);
    common.setMenuButtonState('createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the add-new-product button. execute the transaction.
//
function addProductDoAdd(productIdBN) {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdTlcSel = document.getElementById('createStoreAddProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    const categoryBN = common.numberToBN(createStoreAddProdTlcSel.value).iushln(248);
    for (let i = 0; i < createStoreAddProdLlcBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(createStoreAddProdLlcBitsSel.selectedOptions[i].value);
	categoryBN.iuor(llcBitsBn);
    }
    console.log('addProductDoAdd: categoryBN = 0x' + categoryBN.toString(16));
    const regionBN = createStore.defaultRegionBN;
    console.log('addProdDoAdd: regionBN = 0x' + regionBN.toString(16) + ' = ' + regionBN.toString(10));
    const priceBN = meEther.usdStrToDaiBN(createStoreAddProdPriceArea.value);
    const quantityBN = common.numberToBN(createStoreAddProdQuantityArea.value);
    const nameBytes = common.strToUtf8Bytes(createStoreAddProdNameArea.value);
    const descBytes = common.strToUtf8Bytes(createStoreAddProdDescArea.value);
    const imageBytes = common.imageToBytes(createStoreAddProdImg.src);
    common.showWaitingForMetaMask(true);
    meEther.registerProduct(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	common.showWaitingForMetaMask(false);
	common.setMenuButtonState('shopButton',          'Disabled');
	common.setMenuButtonState('dashboardButton',     'Disabled');
	common.setMenuButtonState('createStoreButton',   'Disabled');
	common.setMenuButtonState('createStoreRegStoreButton',     'Disabled');
	common.setMenuButtonState('createStoreAddProductButton',   'Disabled');
	common.setMenuButtonState('createStoreViewProductsButton', 'Disabled');
	common.waitForTXID(err, txid, 'Register-Product', viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}



//
// create-store - view-products
//
function viewProductsSubPage() {
    console.log('viewProductsSubPage');
    common.setMenuButtonState('shopButton',                    'Enabled');
    common.setMenuButtonState('dashboardButton',               'Enabled');
    common.setMenuButtonState('createStoreButton',             'Selected');
    common.setMenuButtonState('createStoreRegStoreButton',     'Enabled');
    common.setMenuButtonState('createStoreAddProductButton',   'Enabled');
    common.setMenuButtonState('createStoreViewProductsButton', 'Selected');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreNextPrevDiv',      'hidden',   'visibleB', null);
    common.waitingForTxid = false;
    common.clearStatusDiv();
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.disabled = true;
    var regionBN = null;
    var categoryBN = null;
    var maxPriceBN = null;
    var vendorAddr = common.web3.eth.accounts[0];
    const onlyAvailable = false; //should be true, but now testing
    const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
    createStore.displayedProductsStartIdx = 0;
    createStore.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, maxPriceBN, onlyAvailable);
    common.setLoadingIcon('start');
    meUtil.displayProducts(createStore.productSearchFilter, createStoreViewProdsTilesDiv, viewProdsEditProduct, createStore.displayedProductsStartIdx, createStore.productsPerPage,
			   function(prevEnable, nextEnable) {
			       common.setMenuButtonState('createStorePrevButton', prevEnable ? 'Enabled' : 'Disabled');
			       common.setMenuButtonState('createStoreNextButton', nextEnable ? 'Enabled' : 'Disabled');
			       common.setLoadingIcon(null);
			   });
}


//
// create-store - view-products -- edit-product
//
function viewProdsEditProduct(product) {
    console.log('edit product ' + product.productIdBN.toString(10));
    //so the user can go back to view products
    common.setMenuButtonState('createStoreViewProductsButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreNextPrevDiv',      'visibleB',   'hidden', null);
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    createStoreEditProdNameArea.value = product.name;
    createStoreEditProdDescArea.value = product.desc;
    createStoreEditProdImg.src = product.image;
    createStoreEditProdPriceArea.value = meEther.daiBNToUsdStr(product.priceBN);
    createStoreEditProdQuantityArea.value = product.quantityBN.toString(10);
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    console.log('viewProdsEditProduct: product.categoryBN = 0x' + product.categoryBN.toString(16));
    categories.addTlcOptionsElems(product.categoryBN, createStoreEditProdTlcSel);
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    categories.addLlcBitsOptionsElems(createStoreEditProdTlcSel.value, product.categoryBN, createStoreEditProdLlcBitsSel, 'None');
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.productIdBN = product.productIdBN;
    common.setMenuButtonState('createStoreViewProdsDoEditButton', 'Disabled');
}


//
// enable the do-edit
// called whenever any of the edit-product-steps inputs changes
//
function enableViewProdsDoEditButton() {
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    const enable = (createStoreEditProdNameArea.value.trim().length > 0 &&
		    createStoreEditProdDescArea.value.trim().length > 0 &&
		    createStoreEditProdImg.src != '#'                   &&
		    createStoreEditProdTlcSel.value != 0                &&
		    createStoreEditProdLlcBitsSel.value != 0              ) ? true : false;
    common.setMenuButtonState('createStoreViewProdsDoEditButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the edit-product button. execute the transaction.
//
function editProdDoEdit(productIdBN) {
    console.log('editProdDoEdit: about to re-register productId = 0x' + productIdBN.toString(16));
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    const categoryBN = common.numberToBN(createStoreEditProdTlcSel.value).iushln(248);
    for (let i = 0; i < createStoreEditProdLlcBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(createStoreEditProdLlcBitsSel.selectedOptions[i].value);
	categoryBN.iuor(llcBitsBn);
    }
    console.log('editProdDoEdit: categoryBN = 0x' + categoryBN.toString(16) + ' = ' + categoryBN.toString(10));
    const regionBN = createStore.defaultRegionBN;
    console.log('editProdDoEdit: regionBN = 0x' + regionBN.toString(16) + ' = ' + regionBN.toString(10));
    const priceBN = meEther.usdStrToDaiBN(createStoreEditProdPriceArea.value);
    const quantityBN = common.numberToBN(createStoreEditProdQuantityArea.value);
    const nameBytes = common.strToUtf8Bytes(createStoreEditProdNameArea.value);
    const descBytes = common.strToUtf8Bytes(createStoreEditProdDescArea.value);
    const imageBytes = common.imageToBytes(createStoreEditProdImg.src);
    common.showWaitingForMetaMask(true);
    meEther.registerProduct(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	common.showWaitingForMetaMask(false);
	common.waitForTXID(err, txid, 'Modify-Product', viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}
