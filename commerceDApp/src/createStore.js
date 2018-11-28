/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add-prod, edit-prod
   ------------------------------------------------------------------------------------------------------------------ */
var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
var BN = require("bn.js");


var createStore = module.exports = {

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
    var createStoreRegStoreButton = document.getElementById('createStoreRegStoreButton');
    createStoreRegStoreButton.addEventListener('click', function() {
	handleCreateStorePage();
    });
    //create-store / reg store steps
    var createStoreRegStoreLoadImageButton = document.getElementById('createStoreRegStoreLoadImageButton');
    createStoreRegStoreLoadImageButton.addEventListener('change', function() {
	var createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
	if (createStoreRegStoreLoadImageButton.files && createStoreRegStoreLoadImageButton.files[0]) {
	    console.log('createStoreRegStoreLoadImageButton: got ' + URL.createObjectURL(createStoreRegStoreLoadImageButton.files[0]));
	    console.log('createStoreRegStoreLoadImageButton: got ' + createStoreRegStoreLoadImageButton.files[0].name);
            var reader = new FileReader();
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
    var createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    createStoreRegStoreNameArea.addEventListener('input', enableRegisterStoreDoRegButton);
    var createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    createStoreRegStoreDescArea.addEventListener('input', enableRegisterStoreDoRegButton);
    var createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    createStoreAddProdPriceArea.addEventListener('change', enableRegisterStoreDoRegButton);
    var createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    createStoreAddProdQuantityArea.addEventListener('change', enableRegisterStoreDoRegButton);
    var createStoreRegStoreDoRegButton = document.getElementById('createStoreRegStoreDoRegButton');
    createStoreRegStoreDoRegButton.addEventListener('click', handleCreateStoreDoReg);
}


function setAddProductButtonHandlers() {
    var createStoreAddProductButton = document.getElementById('createStoreAddProductButton');
    createStoreAddProductButton.addEventListener('click', function() {
	handleAddProduct();
    });
    //create-store / add product steps
    var createStoreAddProdLoadImageButton = document.getElementById('createStoreAddProdLoadImageButton');
    createStoreAddProdLoadImageButton.addEventListener('change', function() {
	var createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
	if (createStoreAddProdLoadImageButton.files && createStoreAddProdLoadImageButton.files[0]) {
	    console.log('createStoreAddProdLoadImageButton: got ' + createStoreAddProdLoadImageButton.files[0].name);
            var reader = new FileReader();
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
    var createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    createStoreAddProdNameArea.addEventListener('input', enableRegisterStoreDoAddButton);
    var createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    createStoreAddProdDescArea.addEventListener('input', enableRegisterStoreDoAddButton);

    var createStoreAddProdRegisterButton = document.getElementById('createStoreAddProdRegisterButton');
    createStoreAddProdRegisterButton.addEventListener('click', handleCreateStoreDoAdd);
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
	var createStoreRegStoreButton = document.getElementById('createStoreRegStoreButton');
	var createStoreRegStoreDoRegButton = document.getElementById('createStoreRegStoreDoRegButton');
	var createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
	var createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
	var createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
	var createStoreRegStoreRegionSelector = document.getElementById('createStoreRegStoreRegionSelector');
	var createStoreRegStoreLoadImageButton = document.getElementById('createStoreRegStoreLoadImageButton');
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
    var createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    var createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    var createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
    var enable = (createStoreRegStoreNameArea.value.trim().length > 0 != "" &&
		  createStoreRegStoreDescArea.value.trim().length > 0 != "" &&
		  createStoreRegStoreImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreRegStoreDoRegButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the (re-)register-my-store button. execute the transaction.
//
function handleCreateStoreDoReg() {
    var createStoreRegStoreRegionSelector = document.getElementById('createStoreRegStoreRegionSelector');
    var serviceRegionBN = common.numberToBN(createStoreRegStoreRegionSelector.value);
    console.log('handleRegisterStore: serviceRegionBN.toString(hex) = ' + serviceRegionBN.toString(16));
    var createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    var createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    var nameBytes = common.strToUtf8Bytes(createStoreRegStoreNameArea.value);
    var descBytes = common.strToUtf8Bytes(createStoreRegStoreDescArea.value);
    var createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
    //console.log('handleRegisterStore: createStoreRegStoreImg.src = ' + createStoreRegStoreImg.src);
    //rsStoreImg.src is "data:image/png;base64," + base64ImageData;
    var imageBytes = common.imageToBytes(createStoreRegStoreImg.src);
    //console.log('handleRegisterStore: imageBytes = ' + imageBytes);
    //console.log('handleRegisterStore: imageBytes.length = ' + imageBytes.length);
    meEther.registerVendor(common.web3, serviceRegionBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	metaMaskModal.style.display = 'none';
	var statusDiv = document.getElementById('statusDiv');
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
    var createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    var createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    var createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    var enable = (createStoreAddProdNameArea.value.trim().length > 0 != "" &&
		  createStoreAddProdDescArea.value.trim().length > 0 != "" &&
		  createStoreAddProdImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the add-new-product button. execute the transaction.
//
function handleCreateStoreDoAdd() {
    var createStoreRegStoreNameArea = document.getElementById('createStoreRegStoreNameArea');
    var createStoreRegStoreDescArea = document.getElementById('createStoreRegStoreDescArea');
    var createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    var createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    var createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    var createStoreRegStoreImg = document.getElementById('createStoreRegStoreImg');
    var productIdBN = new BN('0', 16);
    var categoryBN = new BN('0', 16);
    var priceBN = common.numberToBN(createStoreAddProdPriceArea.value);
    priceBN.imul(common.numberToBN(createStoreAddProdPriceUnits.value));
    var quantityBN = common.numberToBN(createStoreAddProdQuantityArea.value);
    var nameBytes = common.strToUtf8Bytes(createStoreRegStoreNameArea.value);
    var descBytes = common.strToUtf8Bytes(createStoreRegStoreDescArea.value);
    var imageBytes = common.imageToBytes(createStoreRegStoreImg.src);
    meEther.registerProduct(common.web3, productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	metaMaskModal.style.display = 'none';
	var statusDiv = document.getElementById('statusDiv');
	common.waitForTXID(err, txid, 'Register-Product', statusDiv, 'send', function() {
	});
    });
}
