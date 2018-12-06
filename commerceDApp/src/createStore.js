/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add-prod, edit-prod
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const BN = require("bn.js");


const createStore = module.exports = {

    handleCreateStorePage: function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Selected');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
	handleRegStore();
    },

    setButtonHandlers: function() {
	setRegisterStoreButtonHandlers();
	setAddProductButtonHandlers();
    },

};


function setRegisterStoreButtonHandlers() {
    const createStoreRegStoreButton = document.getElementById('createStoreRegStoreButton');
    createStoreRegStoreButton.addEventListener('click', function() {
	handleRegStore();
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
    const createStoreRegStoreDoRegButton = document.getElementById('createStoreRegStoreDoRegButton');
    createStoreRegStoreDoRegButton.addEventListener('click', handleCreateStoreDoReg);
}


function setAddProductButtonHandlers() {
    const createStoreAddProductButton = document.getElementById('createStoreAddProductButton');
    createStoreAddProductButton.addEventListener('click', function() {
	handleAddProduct();
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
	enableRegisterStoreDoAddButton();
    });
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    createStoreAddProdNameArea.addEventListener('input', enableRegisterStoreDoAddButton);
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    createStoreAddProdDescArea.addEventListener('input', enableRegisterStoreDoAddButton);
    const createStoreAddProdDoAddButton = document.getElementById('createStoreAddProdDoAddButton');
    createStoreAddProdDoAddButton.addEventListener('click', handleCreateStoreDoAdd);
}


//
// create-store - reg-store
//
function handleRegStore() {
    common.setMenuButtonState('createStoreRegStoreButton',    'Selected');
    common.setMenuButtonState('createStoreAddProductButton',  'Disabled');
    common.setMenuButtonState('createStoreEditProductButton', 'Disabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.setMenuButtonState('createStoreRegStoreDoRegButton', 'Disabled');
    //
    meUtil.getVendorLogs(common.web3.eth.accounts[0], function(err, result) {
	console.log('handleCreateMyStorePage: result.length = ' + result.length);
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
	    meEther.vendorAccountQuery(common.web3, common.web3.eth.accounts[0], function(err, vendorAcctInfo) {
		console.log('handleCreateMyStorePage: err = ' + err);
		console.log('handleCreateMyStorePage: vendorAcctInfo.activeFlag = ' + vendorAcctInfo.activeFlag);
		console.log('handleCreateMyStorePage: vendorAcctInfo.serviceRegion = ' + vendorAcctInfo.serviceRegion);
		createStoreRegStoreRegionSelector.value = common.BNToHex256(common.numberToBN(vendorAcctInfo.serviceRegion));
	    });
	    meEther.parseRegisterVendorEvent(result[result.length - 1], function(err, vendorAddr, name, desc, image) {
		createStoreRegStoreNameArea.value = name;
		createStoreRegStoreDescArea.value = desc;
		//image is eg. 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...'
		createStoreRegStoreImg.src = image;
	    });
	    common.setMenuButtonState('createStoreAddProductButton', 'Enabled');
	} else {
	    createStoreRegStoreButton.textContent = 'Create Store';
	    createStoreRegStoreDoRegButton.textContent = 'Register My Store';
	    createStoreRegStoreNameArea.value = '';
	    createStoreRegStoreDescArea.value = '';
            createStoreRegStoreImg.src = '#';
	    createStoreRegStoreRegionSelector.value = 0;
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
    const enable = (createStoreRegStoreNameArea.value.trim().length > 0 != "" &&
		    createStoreRegStoreDescArea.value.trim().length > 0 != "" &&
		    createStoreRegStoreImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreRegStoreDoRegButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the (re-)register-my-store button. execute the transaction.
//
function handleCreateStoreDoReg() {
    const createStoreRegStoreRegionSelector = document.getElementById('createStoreRegStoreRegionSelector');
    const serviceRegionBN = common.numberToBN(createStoreRegStoreRegionSelector.value);
    console.log('handleRegisterStore: serviceRegionBN.toString(hex) = ' + serviceRegionBN.toString(16));
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
    meEther.registerVendor(common.web3, serviceRegionBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	metaMaskModal.style.display = 'none';
	const statusDiv = document.getElementById('statusDiv');
	common.waitForTXID(err, txid, 'Register-Vendor', statusDiv, 'send', function() {
	});
    });
}


//
// create-store - add-product
//
function handleAddProduct() {
    console.log('handleAddProduct');
    common.setMenuButtonState('createStoreRegStoreButton',    'Enabled');
    common.setMenuButtonState('createStoreAddProductButton',  'Selected');
    common.setMenuButtonState('createStoreEditProductButton', 'Disabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
}


//
// enable the do-add
// called whenever any of the add-product-steps inputs changes
//
function enableRegisterStoreDoAddButton() {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const enable = (createStoreAddProdNameArea.value.trim().length > 0 != "" &&
		    createStoreAddProdDescArea.value.trim().length > 0 != "" &&
		    createStoreAddProdImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the add-new-product button. execute the transaction.
//
function handleCreateStoreDoAdd() {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const productIdBN = new BN('0', 16);
    const categoryBN = new BN('0', 16);
    const priceBN = common.numberToBN(createStoreAddProdPriceArea.value);
    priceBN.imul(common.numberToBN(createStoreAddProdPriceUnits.value));
    const quantityBN = common.numberToBN(createStoreAddProdQuantityArea.value);
    const nameBytes = common.strToUtf8Bytes(createStoreAddProdNameArea.value);
    const descBytes = common.strToUtf8Bytes(createStoreAddProdDescArea.value);
    const imageBytes = common.imageToBytes(createStoreAddProdImg.src);
    meEther.registerProduct(common.web3, productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	metaMaskModal.style.display = 'none';
	const statusDiv = document.getElementById('statusDiv');
	common.waitForTXID(err, txid, 'Register-Product', statusDiv, 'send', function() {
	});
    });
}
