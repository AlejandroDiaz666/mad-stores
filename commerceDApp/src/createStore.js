/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add/edit-prod, view-prod
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
	regStoreSubPage();
    },

    setButtonHandlers: function() {
	setRegisterStoreButtonHandlers();
	setAddProductButtonHandlers();
	setViewProductsButtonHandlers();
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
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.addEventListener('click', () => editProdDoEdit(createStoreViewProdsDoEditButton.productIdBN));
}


//
// create-store - reg-store
//
function regStoreSubPage() {
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
    common.setMenuButtonState('createStoreRegStoreDoRegButton', 'Disabled');
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
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
	    meEther.vendorAccountQuery(common.web3, common.web3.eth.accounts[0], function(err, vendorAcctInfo) {
		console.log('regStorePageSubPage: err = ' + err);
		console.log('regStorePageSubPage: vendorAcctInfo.activeFlag = ' + vendorAcctInfo.activeFlag);
		console.log('regStorePageSubPage: vendorAcctInfo.serviceRegion = ' + vendorAcctInfo.serviceRegion);
		createStoreRegStoreRegionSelector.value = common.BNToHex256(common.numberToBN(vendorAcctInfo.serviceRegion));
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
function registerStoreDoReg() {
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
	common.setMenuButtonState('shopButton',          'Disabled');
	common.setMenuButtonState('dashboardButton',     'Disabled');
	common.setMenuButtonState('createStoreButton',   'Disabled');
	common.setMenuButtonState('createStoreRegStoreButton',     'Disabled');
	common.setMenuButtonState('createStoreAddProductButton',   'Disabled');
	common.setMenuButtonState('createStoreViewProductsButton', 'Disabled');
	common.waitForTXID(err, txid, 'Register-Vendor', statusDiv, regStoreSubPage, ether.etherscanioTxStatusHost, function() {
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
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    //
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    createStoreAddProdNameArea.value = '';
    createStoreAddProdDescArea.value = '';
    createStoreAddProdImg.src = '#';
    createStoreAddProdPriceArea.value = '';
    createStoreAddProdQuantityArea.value = '';
}


//
// enable the do-add
// called whenever any of the add-product-steps inputs changes
//
function enableAddProductDoAddButton() {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const enable = (createStoreAddProdNameArea.value.trim().length > 0 &&
		    createStoreAddProdDescArea.value.trim().length > 0 &&
		    createStoreAddProdImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the add-new-product button. execute the transaction.
//
function addProductDoAdd(productIdBN) {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
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
	common.waitForTXID(err, txid, 'Register-Product', statusDiv, viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}



//
// create-store - view-products
//
function viewProductsSubPage() {
    console.log('viewProductsSubPage');
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
    const statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    const createStoreViewProdsDoEditButton = document.getElementById('createStoreViewProdsDoEditButton');
    createStoreViewProdsDoEditButton.disabled = true;
    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var maxPriceBN = null;
    var vendorAddr = null; //should be my addr
    const productStartIdxBN = new BN('1', 16);
    const maxProducts = 100;
    console.log('viewProductsSubPage: getting product logs');
    const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
    while (createStoreViewProdsTilesDiv.hasChildNodes()) {
	console.log('createStoreViewProdsTilesDiv.lastChild = ' + createStoreViewProdsTilesDiv.lastChild);
	console.log('createStoreViewProdsTilesDiv.lastChild = ' + createStoreViewProdsTilesDiv.lastChild.toString());
	createStoreViewProdsTilesDiv.removeChild(createStoreViewProdsTilesDiv.lastChild);
    }
    meUtil.getProducts(vendorAddr, regionBN, categoryBN, maxPriceBN, productStartIdxBN, maxProducts, function(err, noProducts, lastProductIdBN) {
	console.log('viewProductsSubPage: err = ' + err);
    }, function(err, product) {
	if (!!err)
	    return;
	console.log('viewProductsSubPage: product = ' + JSON.stringify(product));
	const id = product.productIdBN.toString(10);
	const tileDiv = document.createElement('div');
	tileDiv.id = 'tile' + id + 'Div';
	tileDiv.className = 'tileDiv';
	const tileImgElem = document.createElement('img');
	tileImgElem.id = 'tile' + id + 'Img';
	tileImgElem.className = 'tileImg';
	tileDiv.appendChild(tileImgElem);
	const tileNameSpan = document.createElement('span');
	tileNameSpan.id = 'tile' + id + 'Name';
	tileNameSpan.className = 'tileName';
	tileDiv.appendChild(tileNameSpan);
	const tileTextSpan = document.createElement('span');
	tileTextSpan.id = 'tile' + id + 'Text';
	tileTextSpan.className = 'tileText';
	tileDiv.appendChild(tileTextSpan);
	const tilePriceSpan = document.createElement('span');
	tilePriceSpan.id = 'tile' + id + 'Price';
	tilePriceSpan.className = 'tilePrice';
	tileDiv.appendChild(tilePriceSpan);
	const tileQuantitySpan = document.createElement('span');
	tileQuantitySpan.id = 'tile' + id + 'Quantity';
	tileQuantitySpan.className = 'tileQuantity';
	tileDiv.appendChild(tileQuantitySpan);
	tileImgElem.src = product.image;
	tileNameSpan.textContent = product.name.substring(0, 22);
	tileTextSpan.textContent = product.desc.substring(0, 70);
	const priceNumberAndUnits = ether.convertWeiBNToNumberAndUnits(product.priceBN);
	tilePriceSpan.textContent = 'Price: ' + priceNumberAndUnits.number.toString(10) + ' ' + priceNumberAndUnits.units;
	tileQuantitySpan.textContent = 'Quantity available: ' + product.quantityBN.toString(10);
	createStoreViewProdsTilesDiv.appendChild(tileDiv);
	tileDiv.addEventListener('click', () => viewProdsEditProduct(product))
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
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdPriceUnits = document.getElementById('createStoreEditProdPriceUnits');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    createStoreEditProdNameArea.value = product.name;
    createStoreEditProdDescArea.value = product.desc;
    createStoreEditProdImg.src = product.image;
    const numberAndUnits = ether.convertWeiBNToNumberAndUnits(product.priceBN);
    createStoreEditProdPriceArea.value = numberAndUnits.number;
    createStoreEditProdPriceUnits.selectedIndex = numberAndUnits.index;
    createStoreEditProdQuantityArea.value = product.quantityBN.toString(10);
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
    const createStoreEditProdPriceUnits = document.getElementById('createStoreEditProdPriceUnits');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    const enable = (createStoreEditProdNameArea.value.trim().length > 0 &&
		    createStoreEditProdDescArea.value.trim().length > 0 &&
		    createStoreEditProdImg.src != '#') ? true : false;
    common.setMenuButtonState('createStoreViewProdsDoEditButton', (enable) ? 'Enabled' : 'Disabled');
}


//
// user has clicked the edit-product button. execute the transaction.
//
function editProdDoEdit(productIdBN) {
    const createStoreEditProdNameArea = document.getElementById('createStoreEditProdNameArea');
    const createStoreEditProdDescArea = document.getElementById('createStoreEditProdDescArea');
    const createStoreEditProdPriceArea = document.getElementById('createStoreEditProdPriceArea');
    const createStoreEditProdPriceUnits = document.getElementById('createStoreEditProdPriceUnits');
    const createStoreEditProdQuantityArea = document.getElementById('createStoreEditProdQuantityArea');
    const createStoreEditProdImg = document.getElementById('createStoreEditProdImg');
    const categoryBN = new BN('0', 16);
    const priceBN = common.numberToBN(createStoreEditProdPriceArea.value);
    priceBN.imul(common.numberToBN(createStoreEditProdPriceUnits.value));
    const quantityBN = common.numberToBN(createStoreEditProdQuantityArea.value);
    const nameBytes = common.strToUtf8Bytes(createStoreEditProdNameArea.value);
    const descBytes = common.strToUtf8Bytes(createStoreEditProdDescArea.value);
    const imageBytes = common.imageToBytes(createStoreEditProdImg.src);
    meEther.registerProduct(common.web3, productIdBN, categoryBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	console.log('txid = ' + txid);
	metaMaskModal.style.display = 'none';
	const statusDiv = document.getElementById('statusDiv');
	common.waitForTXID(err, txid, 'Modify-Product', statusDiv, viewProductsSubPage, ether.etherscanioTxStatusHost, function() {
	});
    });
}
