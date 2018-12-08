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

    products: [],

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


function Product(vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
    this.vendorAddr = vendorAddr;
    this.regionBN = regionBN;
    this.categoryBN = categoryBN;
    this.productIdBN = productIdBN
    this.name = name;
    this.desc = desc;
    this.image = image;
    this.priceBN = this.quantityBN = null;
    this.setPriceAndQuantity = function(priceBN, QuantityBN) {
	this.priceBN = priceBN;
	this.quantityBN = quantityBN;
    };
}


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
    createStoreRegStoreDoRegButton.addEventListener('click', handleCreateStoreDoReg);
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
	enableRegisterStoreDoAddButton();
    });
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    createStoreAddProdNameArea.addEventListener('input', enableRegisterStoreDoAddButton);
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    createStoreAddProdDescArea.addEventListener('input', enableRegisterStoreDoAddButton);
    const createStoreAddProdDoAddButton = document.getElementById('createStoreAddProdDoAddButton');
    createStoreAddProdDoAddButton.addEventListener('click', handleCreateStoreDoAdd);
}


function setViewProductsButtonHandlers() {
    const createStoreViewProductsButton = document.getElementById('createStoreViewProductsButton');
    createStoreViewProductsButton.addEventListener('click', function() {
	viewProductsSubPage();
    });
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
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    common.setMenuButtonState('createStoreRegStoreDoRegButton', 'Disabled');
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
// this code is also used to edit a product:
//  productId = null => add a new product
//
function addProductSubPage(product) {
    console.log('addProductSubPage');
    common.setMenuButtonState('createStoreRegStoreButton',     'Enabled');
    common.setMenuButtonState('createStoreAddProductButton',   'Selected');
    common.setMenuButtonState('createStoreViewProductsButton', 'Enabled');
    common.replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdNote',    'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    if (!!product) {
	createStoreAddProdNameArea.value = product.name;
	createStoreAddProdDescArea.value = product.desc;
	createStoreAddProdImg.src = product.image;
	createStoreAddProdPriceArea.value = product.priceDigits();
	createStoreAddProdPriceUnits.value = product.priceUnits();
	createStoreAddProdQuantityArea.value = product.quantity;
    } else {
	createStoreAddProdNameArea.value = '';
	createStoreAddProdDescArea.value = '';
	createStoreAddProdImg.src = '#';
	createStoreAddProdPriceArea.value = '';
	createStoreAddProdQuantityArea.value = '';
	productIdBN = new BN('0', 16);
    }
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
function handleCreateStoreDoAdd(productIdBN) {
    const createStoreAddProdNameArea = document.getElementById('createStoreAddProdNameArea');
    const createStoreAddProdDescArea = document.getElementById('createStoreAddProdDescArea');
    const createStoreAddProdPriceArea = document.getElementById('createStoreAddProdPriceArea');
    const createStoreAddProdPriceUnits = document.getElementById('createStoreAddProdPriceUnits');
    const createStoreAddProdQuantityArea = document.getElementById('createStoreAddProdQuantityArea');
    const createStoreAddProdImg = document.getElementById('createStoreAddProdImg');
    let product;
    if (!!productIdBN) {
	product = products[productIdBN];
    } else {
	productIdBN = new BN('0', 16);
	product = products[productIdBN];
    }
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
    common.replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    common.replaceElemClassFromTo('createStoreViewProdsDiv',     'hidden',   'visibleB', null);
    common.replaceElemClassFromTo('createStoreEditProdStepsDiv', 'visibleB', 'hidden',   null);

    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var vendorAddr = null; //should be my addr
    console.log('viewProductsSubPage: getting product logs');
    const createStoreViewProdsTilesDiv = document.getElementById('createStoreViewProdsTilesDiv');
    while (createStoreViewProdsTilesDiv.hasChildNodes()) {
	console.log('createStoreViewProdsTilesDiv.lastChild = ' + createStoreViewProdsTilesDiv.lastChild);
	console.log('createStoreViewProdsTilesDiv.lastChild = ' + createStoreViewProdsTilesDiv.lastChild.toString());
	createStoreViewProdsTilesDiv.removeChild(createStoreViewProdsTilesDiv.lastChild);
    }
    meUtil.getProductLogs(vendorAddr, regionBN, categoryBN, function(err, results) {
	if (!err) {
	    for (var i = 0; i < results.length; ++i) {
		const tileDiv = document.createElement('div');
		tileDiv.id = 'tile' + i + 'Div';
		tileDiv.className = 'tileDiv';
		const tileImgElem = document.createElement('img');
		tileImgElem.id = 'tile' + i + 'Img';
		tileImgElem.className = 'tileImg';
		tileDiv.appendChild(tileImgElem);
		const tileNameBgDiv = document.createElement('div');
		tileNameBgDiv.id = 'tile' + i + 'NameBgDiv';
		tileNameBgDiv.className = 'tileNameBg';
		tileDiv.appendChild(tileNameBgDiv);
		const tileNameSpan = document.createElement('span');
		tileNameSpan.id = 'tile' + i + 'Name';
		tileNameSpan.className = 'tileName';
		tileDiv.appendChild(tileNameSpan);
		const tileTextBgDiv = document.createElement('div');
		tileTextBgDiv.id = 'tile' + i + 'TextBgDiv';
		tileTextBgDiv.className = 'tileTextBg';
		tileDiv.appendChild(tileTextBgDiv);
		const tileTextSpan = document.createElement('span');
		tileTextSpan.id = 'tile' + i + 'Text';
		tileTextSpan.className = 'tileText';
		tileDiv.appendChild(tileTextSpan);
		createStoreViewProdsTilesDiv.appendChild(tileDiv);
		meEther.parseRegisterProductEvent(results[i], function(err, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
		    console.log('got prodoct = 0x' + productIdBN.toString(16) + ', name = ' + name + ', desc = ' + desc);
		    tileImgElem.src = image;
		    tileNameSpan.textContent = name.substring(0, 22);
		    tileTextSpan.textContent = desc.substring(0, 70);
		    const product = new Product(vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image);
		    tileDiv.addEventListener('click', () => editProduct(product))
		});
	    }
	}
    });
}


//
// create-store - view-products -- edit-product
//
function editProduct(product) {
    console.log('edit product ' + product.productIdBN.toString(10));
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
    createStoreEditProdPriceArea.value = product.priceDigits();
    createStoreEditProdPriceUnits.value = product.priceUnits();
    createStoreEditProdQuantityArea.value = product.quantity;
}
