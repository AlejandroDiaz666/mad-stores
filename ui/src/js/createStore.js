/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add/edit-prod, view-prod
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const catEther = require('./catEther');
const meUtil = require('./meUtil');
const catUtil = require('./catUtil');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


const createStore = module.exports = {

    defaultRegionBN: null,
    productsPerPage: 8,
    productSearchFilter: null,
    maxProductPriceBN: null,
    viewProductIdBN: null,

    handleCreateStorePage: function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Selected');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('dashboardPageDiv',   'visibleB', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
	common.replaceElemClassFromTo('msgAreaDiv',         'visibleB', 'hidden',   false);
	common.replaceElemClassFromTo('addCatDialogDiv',    'visibleB', 'hidden',   null);
	regStoreSubPage();
    },

    setButtonHandlers: function() {
	setRegisterStoreButtonHandlers();
	setAddProductButtonHandlers();
	setViewProductsButtonHandlers();
    },

    doExitWarning: function() {
	const exitWarning = 'Warning: You don\'t have enough Turms W-Dia to make a bond for all of your products.\n' +
	      'Whenever a buyer deposits funds to purchase an item, the Turms Mad Escrow contract will automatically ' +
	      'make an escrow deposit on your behalf, equal to 50% of the price.\n' +
	      'Your escrow deposit will be returned to you if the escrow is cancelled or if delivery of the product is approved.\n' +
	      'Right now you don\'t have sufficient wrapped DAI to create an escrow for your most expensive product. ' +
	      'You will need to wrap additional DAI for in order for all of your products to be view-able by buyers';
	if (!!createStore.maxProductPriceBN)
	    console.log('doExitWarning: common.wdaiBalanceBN  = ' + common.wdaiBalanceBN.toString(10) + ', createStore.maxProductPriceBN = ' + createStore.maxProductPriceBN.toString(10));
	if (!!common.wdaiBalanceBN && !!createStore.maxProductPriceBN && common.wdaiBalanceBN.lt(createStore.maxProductPriceBN.divn(2))) {
	    alert(exitWarning);
	    //if we don'r set this to null here then the user will get the warning everytime he changes pages (modes), until he re-enters the
	    //create-my-store page.
	    //createStore.maxProductPriceBN = null;
	}
    },

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
		console.log('image length = ' + e.target.result.length);
                createStoreRegStoreImg.src = e.target.result;
		const imageKb = parseInt(e.target.result.length / 1024);
		if (imageKb > 25) {
		    document.getElementById('noteDialogTitle').textContent = 'Warning!';
		    document.getElementById('noteDialogIntro').textContent =
			'Images stored on the blockchain are limited to approximately 25 KB, but the size of this image is ' + imageKb + ' KB.';
		    document.getElementById('noteDialogNote').textContent =
			'Registering this store will likely fail because the filesize of the image exceeds the maximum Ethereum transaction size.\n' +
			'Please select a different image, or use image-editing software (like photoshop) to reduce the filesize of this image.';
		    common.replaceElemClassFromTo('noteDialogTitle', 'hidden', 'visibleB', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		    common.noteOkHandler = null;
		}
		enableRegisterStoreDoRegButton();
            };
            reader.readAsDataURL(createStoreRegStoreLoadImageButton.files[0]);
        } else {
            createStoreRegStoreImg.src = '';
	    enableRegisterStoreDoRegButton();
	}
    });
    const createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    createStoreRegStoreNameArea.addEventListener('input', enableRegisterStoreDoRegButton);
    const createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    createStoreRegStoreDescArea.addEventListener('input', enableRegisterStoreDoRegButton);
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
		console.log('image length = ' + e.target.result.length);
		const imageKb = parseInt(e.target.result.length / 1024);
		if (imageKb > 25) {
		    document.getElementById('noteDialogTitle').textContent = 'Warning!';
		    document.getElementById('noteDialogIntro').textContent =
			'Images stored on the blockchain are limited to approximately 25 KB, but the size of this image is ' + imageKb + ' KB.';
		    document.getElementById('noteDialogNote').textContent =
			'Registering this product will likely fail because the filesize of the image exceeds the maximum Ethereum transaction size.\n' +
			'Please select a different image, or use image-editing software (like photoshop) to reduce the filesize of this image.';
		    common.replaceElemClassFromTo('noteDialogTitle', 'hidden', 'visibleB', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		    common.noteOkHandler = null;
		}
		//console.log('createStoreAddProdLoadImageButton: createStoreAddProdImg.src = ' + createStoreAddProdImg.src);
		enableAddProductDoAddButton();
            };
            reader.readAsDataURL(createStoreAddProdLoadImageButton.files[0]);
        } else {
            createStoreAddProdImg.src = '';
	    enableAddProductDoAddButton();
	}
    });
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    createStoreAddProdNameArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    createStoreAddProdDescArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    createStoreAddProdPriceArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    createStoreAddProdQuantityArea.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdTlcSel = document.getElementById('createStoreAddProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    createStoreAddProdTlcSel.addEventListener('change', () => {
	const categoryBN = common.numberToBN(createStoreAddProdTlcSel.value).iushln(248);
	catUtil.addLlcBitsOptionsElems(createStoreAddProdTlcSel.value, categoryBN, createStoreAddProdLlcBitsSel, 'None');
	enableAddProductDoAddButton();
    }, {passive: true} );
    createStoreAddProdLlcBitsSel.addEventListener('input', enableAddProductDoAddButton);
    const createStoreAddProdDoAddButton = document.getElementById('createStoreAddProdDoAddButton');
    createStoreAddProdDoAddButton.addEventListener('click', () => addProductDoAdd(null));
    // preview product
    const createStoreAddProdPreviewButton = document.getElementById('createStoreAddProdPreviewButton');
    createStoreAddProdPreviewButton.addEventListener('click', () => { prodDoPreview('Add') }, {passive: true} );
    //
    // initial add-category button displays note if user is not allowed to add a category, else displays the
    // add-category dialog
    //
    const createStoreAddCatButton = document.getElementById('createStoreAddCatButton');
    createStoreAddCatButton.addEventListener('click', () => {
	const ttAmountBN = meEther.usdStrToDaiBN('1000000.00');
	const wdaiAmountBN = meEther.usdStrToDaiBN('10000.00');
	meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    if (!!err) {
		console.log('createStoreAddCatButton: err = ' + err);
	    } else {
		console.log('createStoreAddCatButton: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
		meEther.getTTBalance(common.web3.eth.accounts[0], function(err, ttBalanceBN) {
		    if (!!err) {
			console.log('createStoreAddCatButton: err = ' + err);
		    } else if (ttBalanceBN.lt(ttAmountBN) || wdaiBalanceBN.lt(wdaiAmountBN)) {
			document.getElementById('noteDialogIntro').textContent =
			    'To discourage careless creation of ill-considered categories, only substantial owners of Turms Tokens, and ' +
			    'vendors who hold at least 10,000 W-Dai are able to propose new categories.';
			document.getElementById('noteDialogNote').textContent =
			    'If you would like to see a new category or sub-category, but you do not meet the above criteria, then you will ' +
			    'need to either aquire at least one million Turms tokens; or wrap at least 10,000 DAI, or send a message (using ' +
			    'Turms AMT) to someone who does meet the criteria, asking them to create the new category on your behalf.';
			'and you will be able to claim all the escrow funds.';
			common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
			common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
			common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
			common.noteOkHandler = null;
		    } else {
			console.log('createStoreAddCatButton: creating category...');
			document.getElementById('addCatDialogArea').value = '';
			common.replaceElemClassFromTo('addCatDialogDiv', 'hidden', 'visibleB', null);
		    }
		});
	    }
	});
    });
    //
    const addCatDialogCancelButton = document.getElementById('addCatDialogCancelButton');
    addCatDialogCancelButton.addEventListener('click', () => {
	common.replaceElemClassFromTo('addCatDialogDiv', 'visibleB', 'hidden', null);
    });
    const addCatDialogDoButton = document.getElementById('addCatDialogDoButton');
    addCatDialogDoButton.addEventListener('click', () => {
	addCategory();
    });
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
		const imageKb = parseInt(e.target.result.length / 1024);
		if (imageKb > 25) {
		    document.getElementById('noteDialogTitle').textContent = 'Warning!';
		    document.getElementById('noteDialogIntro').textContent =
			'Images stored on the blockchain are limited to approximately 25 KB, but the size of this image is ' + imageKb + ' KB.';
		    document.getElementById('noteDialogNote').textContent =
			'Registering this product will likely fail because the filesize of the image exceeds the maximum Ethereum transaction size.\n' +
			'Please select a different image, or use image-editing software (like photoshop) to reduce the filesize of this image.';
		    common.replaceElemClassFromTo('noteDialogTitle', 'hidden', 'visibleB', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		    common.noteOkHandler = null;
		}
		enableViewProdsDoEditButton();
            };
            reader.readAsDataURL(createStoreEditProdLoadImageButton.files[0]);
        } else {
            createStoreEditProdImg.src = '';
	    enableViewProdsDoEditButton();
	}
    });
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    createStoreEditProdNameArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    createStoreEditProdDescArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    createStoreEditProdPriceArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    createStoreAddProdQuantityArea.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    createStoreEditProdTlcSel.addEventListener('change', () => {
	const categoryBN = common.numberToBN(createStoreEditProdTlcSel.value).iushln(248);
	catUtil.addLlcBitsOptionsElems(createStoreEditProdTlcSel.value, categoryBN, createStoreEditProdLlcBitsSel, 'None');
	enableViewProdsDoEditButton();
    }, {passive: true} );
    createStoreEditProdLlcBitsSel.addEventListener('input', enableViewProdsDoEditButton);
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.addEventListener('click', () => { editProdDoEdit(createStore.viewProductIdBN) }, {passive: true} );
    // preview product
    const createStoreViewProdsPreviewButton = document.getElementById('createStoreViewProdsPreviewButton');
    createStoreViewProdsPreviewButton.addEventListener('click', () => { prodDoPreview('Edit') }, {passive: true} );
}


//
// create-store - reg-store
//
function regStoreSubPage() {
    createStore.maxProductPriceBN = new BN('0', 16);
    common.setMenuButtonState('shopButton',                    'Enabled');
    common.setMenuButtonState('dashboardButton',               'Enabled');
    common.setMenuButtonState('createStoreButton',             'Selected');
    common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Selected');
    common.setButtonState('otherButton', 'createStoreAddProductButton',   'Disabled');
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Disabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddCatNote',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('addCatDialogDiv',             'visibleB', 'hidden',   null);
    common.setButtonState('otherButton', 'createStoreRegStoreDoRegButton', 'Disabled');
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
	    common.setButtonState('otherButton', 'createStoreAddProductButton', 'Enabled');
	    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Enabled');
	} else {
	    createStoreRegStoreButton.textContent = 'Create Store';
	    createStoreRegStoreDoRegButton.textContent = 'Register My Store';
	    createStoreRegStoreNameArea.value = '';
	    createStoreRegStoreDescArea.value = '';
            createStoreRegStoreImg.src = '';
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
		    !!createStoreRegStoreImg.src                              &&
		    createStoreRegStoreImg.src.startsWith('data')             &&
		    createStoreRegStoreTlrSel.value != 0                         ) ? true : false;
    common.setButtonState('otherButton', 'createStoreRegStoreDoRegButton', (enable) ? 'Enabled' : 'Disabled');
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
	common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Disabled');
	common.setButtonState('otherButton', 'createStoreAddProductButton',   'Disabled');
	common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Disabled');
	common.waitForTXID(err, txid, 'Register-Vendor', regStoreSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}


//
// create-store - add-product
//
function addProductSubPage() {
    console.log('addProductSubPage');
    common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Enabled');
    common.setButtonState('otherButton', 'createStoreAddProductButton',   'Selected');
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddCatNote',     'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('addCatDialogDiv',             'visibleB', 'hidden',   null);
    common.setButtonState('otherButton', 'createStoreAddProdDoAddButton', 'Disabled');
    common.setButtonState('otherButton', 'createStoreAddProdPreviewButton', 'Disabled');
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
    const addCatTlcSel = document.getElementById('addCatTlcSel');
    createStoreAddProdNameArea.value = '';
    createStoreAddProdDescArea.value = '';
    createStoreAddProdImg.src = '';
    createStoreAddProdPriceArea.value = '';
    createStoreAddProdQuantityArea.value = '';
    const categoryBN = new BN('0', 16);
    catUtil.addTlcOptionsElems(categoryBN, createStoreAddProdTlcSel);
    catUtil.addTlcOptionsElems(categoryBN, addCatTlcSel);
    catUtil.addLlcBitsOptionsElems(createStoreAddProdTlcSel.value, categoryBN, createStoreAddProdLlcBitsSel, 'None');
}


//
// create-store - view-products -- edit-product
//
function addProductEditProduct(product) {
    console.log('edit product ' + product.productIdBN.toString(10));
    //so the user can go back to view products
    common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
    common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Enabled');
    common.setButtonState('otherButton', 'createStoreAddProductButton',   'Selected');
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdNote',      'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddCatNote',       'hidden',   'visibleB', null);
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreAddProdLlcBitsSel = document.getElementById('createStoreAddProdLlcBitsSel');
    createStoreAddProdNameArea.value = product.name;
    createStoreAddProdDescArea.value = product.desc;
    console.log('addProductEditProduct: product.image = ' + product.image);
    createStoreAddProdImg.src = product.image;
    createStoreAddProdPriceArea.value = meEther.daiBNToUsdStr(product.priceBN);
    createStoreAddProdQuantityArea.value = product.quantityBN.toString(10);
    console.log('addProductEditProduct: product.categoryBN = 0x' + product.categoryBN.toString(16));
    catUtil.addTlcOptionsElems(product.categoryBN, createStoreAddProdTlcSel);
    catUtil.addLlcBitsOptionsElems(createStoreAddProdTlcSel.value, product.categoryBN, createStoreAddProdLlcBitsSel, 'None');
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
    console.log('enableAddProductDoAddButton: createStoreAddProdImg.src = ' + createStoreAddProdImg.src);
    const enable = (createStoreAddProdNameArea.value.trim().length > 0     &&
		    createStoreAddProdDescArea.value.trim().length > 0     &&
		    createStoreAddProdPriceArea.value.trim().length > 0    &&
		    createStoreAddProdQuantityArea.value.trim().length > 0 &&
		    !!createStoreAddProdImg.src                            &&
		    createStoreAddProdImg.src.startsWith('data')           &&
		    createStoreAddProdTlcSel.value != 0                    &&
		    createStoreAddProdLlcBitsSel.value != 0              ) ? true : false;
    console.log('enableAddProductDoAddButton: createStoreAddProdImg.src = ' + createStoreAddProdImg.src);
    common.setButtonState('otherButton', 'createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
    common.setButtonState('otherButton', 'createStoreAddProdPreviewButton', (enable) ? 'Enabled' : 'Disabled');
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
    console.log('addProdDoAdd: priceBN = ' + priceBN.toString(10) + ', createStore.maxProductPriceBN = ' + createStore.maxProductPriceBN.toString(10));
    if (priceBN.gt(createStore.maxProductPriceBN))
	createStore.maxProductPriceBN = priceBN;
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
	common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Disabled');
	common.setButtonState('otherButton', 'createStoreAddProductButton',   'Disabled');
	common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Disabled');
	common.waitForTXID(err, txid, 'Register-Product', viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}



//
// user has clicked the add-new-product => add new category button. collect the category info, execute the transaction.
//
function addCategory() {
    const addCatDialogArea = document.getElementById('addCatDialogArea');
    const name = addCatDialogArea.value.trim();
    if (!!name) {
	common.replaceElemClassFromTo('addCatDialogDiv', 'visibleB', 'hidden', null);
	const addCatTlcSel = document.getElementById('addCatTlcSel');
	const tlcBN = common.numberToBN(addCatTlcSel.value);
	const nameBytes = common.strToUtf8Bytes(name);
	const descBytes = common.strToUtf8Bytes('');
	console.log('addCategory: tlcBN = ' + tlcBN.toString(10));
	catEther.proposeCategory(tlcBN, nameBytes, descBytes, function(err, txid) {
	    console.log('txid = ' + txid);
	    common.showWaitingForMetaMask(false);
	    common.replaceElemClassFromTo('addCatDialogDiv', 'visibleB', 'hidden', null);
	    common.waitForTXID(err, txid, 'Propose-Category', viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
		catUtil.getCategories();
	    });
	});
    }
}



//
// create-store - view-products
//
function viewProductsSubPage() {
    console.log('viewProductsSubPage');
    common.setMenuButtonState('shopButton',                    'Enabled');
    common.setMenuButtonState('dashboardButton',               'Enabled');
    common.setMenuButtonState('createStoreButton',             'Selected');
    common.setButtonState('otherButton', 'createStoreRegStoreButton',     'Enabled');
    common.setButtonState('otherButton', 'createStoreAddProductButton',   'Enabled');
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Selected');
    //ensure createstorePageDiv is visible, cuz we are called after showing product detail
    common.replaceElemClassFromTo('createStorePageDiv',        'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddCatNote',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('addCatDialogDiv',             'visibleB', 'hidden',   null);
    common.waitingForTxid = false;
    common.clearStatusDiv();
    common.setButtonState('otherButton', 'createStoreViewProdsPreviewButton', 'Disabled');
    common.setButtonState('otherButton', 'createStoreViewProdsDoEditButton', 'Disabled');
    const createStoreViewProdsPreviewButton = document.getElementById('createStoreViewProdsPreviewButton');
    createStoreViewProdsPreviewButton.disabled = true;
    const regionBN = null;
    const categoryBN = null;
    const minPriceBN = null;
    const maxPriceBN = null;
    const minDeliveriesBN = null;
    const minRatingBN = null;
    const vendorAddr = common.web3.eth.accounts[0];
    const onlyAvailable = false;
    const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
    createStore.productSearchFilter = new meUtil.ProductSearchFilter(vendorAddr, regionBN, categoryBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, onlyAvailable);
    common.clearDivChildren(shopTilesDiv);
    meUtil.getProductIds(createStore.productSearchFilter, 100, function(err) {
	if (err) {
	    alert(err)
	} else {
	    meUtil.populateProductList(createStoreViewProdsTilesDiv, 0, viewProdsEditProduct, function(err) {
		if (err)
		    alert(err)
	    });
	}
    });
}


//
// create-store - view-products -- edit-product
//
function viewProdsEditProduct(product) {
    console.log('edit product ' + product.productIdBN.toString(10));
    //so the user can go back to view products
    common.replaceElemClassFromTo('createStorePageDiv',        'hidden',   'visibleT', null);
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Selected');
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'hidden',   'visibleB', null);
    common.setButtonState('otherButton', 'createStoreViewProdsPreviewButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreViewProdsNote',  'hidden',   'visibleB', null);
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    createStoreEditProdNameArea.value = product.name;
    createStoreEditProdDescArea.value = product.desc;
    createStoreEditProdImg.src = product.image;
    createStoreEditProdPriceArea.value = meEther.daiBNToUsdStr(product.priceBN);
    createStoreEditProdQuantityArea.value = product.quantityBN.toString(10);
    console.log('viewProdsEditProduct: product.categoryBN = 0x' + product.categoryBN.toString(16));
    catUtil.addTlcOptionsElems(product.categoryBN, createStoreEditProdTlcSel);
    catUtil.addLlcBitsOptionsElems(createStoreEditProdTlcSel.value, product.categoryBN, createStoreEditProdLlcBitsSel, 'None');
    createStore.viewProductIdBN = product.productIdBN;
    common.setButtonState('otherButton', 'createStoreViewProdsDoEditButton', 'Disabled');
    common.setButtonState('otherButton', 'createStoreViewProdsPreviewButton', 'Enabled');
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
    const enable = (createStoreEditProdNameArea.value.trim().length     > 0 &&
		    createStoreEditProdDescArea.value.trim().length     > 0 &&
		    createStoreEditProdPriceArea.value.trim().length    > 0 &&
		    createStoreEditProdQuantityArea.value.trim().length > 0 &&
		    !!createStoreEditProdImg.src                            &&
		    createStoreEditProdImg.src.startsWith('data')           &&
		    createStoreEditProdTlcSel.value != 0                    &&
		    createStoreEditProdLlcBitsSel.value != 0              ) ? true : false;
    common.setButtonState('otherButton', 'createStoreViewProdsDoEditButton', (enable) ? 'Enabled' : 'Disabled');
    common.setButtonState('otherButton', 'createStoreViewProdsPreviewButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the edit-product button. execute the transaction.
//
function editProdDoEdit(productIdBN) {
    //make sure we don't keep around an old version of this product info
    meUtil.invalidateProductCache(common.BNToHex256(productIdBN));
    console.log('editProdDoEdit: about to re-register productId = 0x' + productIdBN.toString(16));
    const createStoreEditProdTlcSel = document.getElementById('createStoreEditProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStoreEditProdLlcBitsSel');
    const categoryBN = common.numberToBN(createStoreEditProdTlcSel.value).iushln(248);
    for (let i = 0; i < createStoreEditProdLlcBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(createStoreEditProdLlcBitsSel.selectedOptions[i].value);
	categoryBN.iuor(llcBitsBn);
    }
    const priceBN = meEther.usdStrToDaiBN(document.getElementById('createStoreEditProdPriceArea').value);
    console.log('editProdDoEdit: priceBN = ' + priceBN.toString(10) + ', createStore.maxProductPriceBN = ' + createStore.maxProductPriceBN.toString(10));
    if (priceBN.gt(createStore.maxProductPriceBN))
	createStore.maxProductPriceBN = priceBN;
    const regionBN = createStore.defaultRegionBN;
    console.log('editProdDoEdit: categoryBN = 0x' + categoryBN.toString(16) + ' = ' + categoryBN.toString(10));
    console.log('editProdDoEdit: regionBN = 0x' + regionBN.toString(16) + ' = ' + regionBN.toString(10));
    const quantityBN = common.numberToBN(document.getElementById('createStoreEditProdQuantityArea').value);
    const nameBytes = common.strToUtf8Bytes(document.getElementById('createStoreEditProdNameArea').value);
    const descBytes = common.strToUtf8Bytes(document.getElementById('createStoreEditProdDescArea').value);
    const imageBytes = common.imageToBytes(document.getElementById('createStoreEditProdImg').src);
    common.showWaitingForMetaMask(true);
    meEther.registerProduct(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	common.showWaitingForMetaMask(false);
	common.waitForTXID(err, txid, 'Modify-Product', viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}


//
// user has clicked the product preview button. create a dummy product and display it.
// mode = 'Add' | 'Edit'
//
function prodDoPreview(mode) {
    common.setButtonState('otherButton', 'createStoreViewProductsButton', 'Disabled');
    common.replaceElemClassFromTo('createStorePageDiv', 'visibleT',   'hidden', null);
    //
    const createStoreEditProdTlcSel = document.getElementById('createStore' + mode + 'ProdTlcSel');
    const createStoreEditProdLlcBitsSel = document.getElementById('createStore' + mode + 'ProdLlcBitsSel');
    const categoryBN = common.numberToBN(createStoreEditProdTlcSel.value).iushln(248);
    for (let i = 0; i < createStoreEditProdLlcBitsSel.selectedOptions.length; ++i) {
	const llcBitsBn = common.numberToBN(createStoreEditProdLlcBitsSel.selectedOptions[i].value);
	categoryBN.iuor(llcBitsBn);
    }
    const priceBN = meEther.usdStrToDaiBN(document.getElementById('createStore' + mode + 'ProdPriceArea').value);
    const regionBN = createStore.defaultRegionBN;
    const quantity = document.getElementById('createStore' + mode + 'ProdQuantityArea').value;
    const name = document.getElementById('createStore' + mode + 'ProdNameArea').value;
    const desc = document.getElementById('createStore' + mode + 'ProdDescArea').value;
    const image = document.getElementById('createStore' + mode + 'ProdImg').src;
    const product = new meUtil.Product(new BN('0', 16), name, desc, image);
    const vendorAddr = common.web3.eth.accounts[0];
    const productInfo = new meUtil.ProductInfo(common.BNToHex256(priceBN), quantity, common.BNToHex256(categoryBN), common.BNToHex256(regionBN), vendorAddr);
    product.setProductInfo(productInfo);
    meUtil.showProductDetail(product, 'view', 'extend', () => (mode == 'Add') ? addProductEditProduct(product) : viewProdsEditProduct(product));
}
