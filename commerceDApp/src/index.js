var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
var BN = require("bn.js");


document.addEventListener('DOMContentLoaded', function() {
    console.log('content loaded');
    index.main();
}, false);


var index = module.exports = {
    account: null,
    acctInfo: null,
    publicKey: null,
    waitingForTxid: false,
    localStoragePrefix: '',

    main: function() {
	console.log('index.main');
	setMainButtonHandlers();
	setRegisterStoreButtonHandlers();
	setAddProductButtonHandlers();
	beginTheBeguine(null);
    },

};

function ListEntry(listIdx, div, msgId, msgNo, addr, date, ref, content) {
    this.listIdx = listIdx;
    this.div = div;
    this.msgId = msgId;
    this.msgNo = msgNo;
    this.addr = addr;
    this.date = date;
    this.ref = ref;
    this.content = content;
}



function setMainButtonHandlers() {
    var shopButton = document.getElementById('shopButton');
    shopButton.addEventListener('click', function() {
	handleShopPage();
    });
    var dashboardButton = document.getElementById('dashboardButton');
    dashboardButton.addEventListener('click', function() {
	setMenuButtonState('shopButton',          'Enabled');
	setMenuButtonState('dashboardButton',     'Selected');
	setMenuButtonState('createStoreButton',   'Enabled');
	replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden', null);
	replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    });
    var createStoreButton = document.getElementById('createStoreButton');
    createStoreButton.addEventListener('click', function() {
	handleCreateStorePage();
    });
}

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
// mode = [ 'send' | 'recv' | null ]
//
var timerIsPaused = () => {
    var viewRecvButton = document.getElementById('viewRecvButton');
    var viewSentButton = document.getElementById('viewSentButton');
    return(((index.acctInfo == null                            ||
	     viewRecvButton.className.indexOf('Selected') >= 0 ||
	     viewSentButton.className.indexOf('Selected') >= 0 ) &&
	    (!index.waitingForTxid                             ) ) ? false : true);
}

async function beginTheBeguine(mode) {
    //await doFirstIntro(false);
    if (!index.acctCheckTimer) {
	console.log('init acctCheckTimer');
	var count = 0;
	index.acctCheckTimer = setInterval(function() {
	    //if (timerIsPaused())
	    //  console.log('timerIsPaused!');
	    common.checkForMetaMask(true, function(err, w3) {
		var acct = (!err && !!w3) ? w3.eth.accounts[0] : null;
		if (acct != index.account) {
		    console.log('MetaMask account changed!');
		    console.log('acct = ' + acct + ', index.account = ' + index.account);
		    beginTheBeguine(null);
		}
	    });
	}, 10000);
    }
    common.checkForMetaMask(true, function(err, w3) {
	var acct = (!err && !!w3) ? w3.eth.accounts[0] : null;
	console.log('beginTheBeguine: checkForMetaMask acct = ' + acct);
	index.account = acct;
	if (!!err) {
	    console.log('beginTheBeguine: checkForMetaMask err = ' + err);
	    handleLockedMetaMask(err);
	} else {
	    console.log('index.beginTheBeguine');
	    setMenuButtonState('shopButton',          'Disabled');
	    setMenuButtonState('dashboardButton',     'Disabled');
	    setMenuButtonState('createStoreButton',   'Disabled');
	    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
	    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
	    replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
	    handleUnlockedMetaMask(mode);
	}
    });
}

//
// handle locked metamask
//
function handleLockedMetaMask(err) {
    setMenuButtonState('shopButton',          'Disabled');
    setMenuButtonState('dashboardButton',     'Disabled');
    setMenuButtonState('createStoreButton',   'Disabled');
    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
    //
    var networkArea = document.getElementById('networkArea');
    networkArea.value = '';
    var accountArea = document.getElementById('accountArea');
    accountArea.value = '';
    var balanceArea = document.getElementById('balanceArea');
    balanceArea.value = '';
    //var totalReceivedArea = document.getElementById('totalReceivedArea');
    //totalReceivedArea.value = '';
    //var feeBalanceArea = document.getElementById('feeBalanceArea');
    //feeBalanceArea.value = '';
    //
    var statusDiv = document.getElementById('statusDiv');
    clearStatusDiv(statusDiv);
    alert(err);
}


//
// handle unlocked metamask
// continues on to handleRegistered or handleUnregistered.
//
// note: after a transaction is completed we come back to this fcn. the mode parm provides a hint so that
// we can continue with a relevant part of the display.
//
function handleUnlockedMetaMask(mode) {
    console.log('handleUnlockedMetaMask: mode = ' + mode);
    //we can be called from the 'continue' link in waitForTXID, so clear waiting flag. this re-enables the interval
    //timer to check for changed status
    index.waitingForTxid = false;
    index.localStoragePrefix = (common.web3.eth.accounts[0]).substring(2, 10) + '-';
    var accountArea = document.getElementById('accountArea');
    accountArea.value = 'Your account: ' + common.web3.eth.accounts[0];
    ether.getNetwork(common.web3, function(err, network) {
	var networkArea = document.getElementById('networkArea');
	if (!!err) {
	    networkArea.value = 'Error: ' + err;
	} else {
	    networkArea.value = 'Network: ' + network;
	    if (network.startsWith('Mainnet'))
		networkArea.className = (networkArea.className).replace('attention', '');
	    else if (networkArea.className.indexOf(' attention' < 0))
		networkArea.className += ' attention';
	}
    });
    //console.log('handleUnlockedMetaMask: calling ether.getBalance');
    ether.getBalance(common.web3, 'szabo', function(err, balance) {
	var balanceArea = document.getElementById('balanceArea');
	var balanceSzabo = parseInt(balance);
	console.log('handleUnlockedMetaMask: balanceSzabo = ' + balanceSzabo);
	var balanceETH = (balanceSzabo / ether.SZABO_PER_ETH).toFixed(6);
	balanceArea.value = 'Balance: ' + balanceETH.toString(10) + ' Eth';
    });
    //console.log('handleUnlockedMetaMask: calling mtEther.accountQuery');
    mtEther.accountQuery(common.web3, common.web3.eth.accounts[0], function(err, _acctInfo) {
	console.log('handleUnlockedMetaMask: _acctInfo: ' + _acctInfo);
	index.acctInfo = _acctInfo;
	index.publicKey = (!!index.acctInfo) ? index.acctInfo[mtEther.ACCTINFO_PUBLICKEY] : null;
	console.log('handleUnlockedMetaMask: acctInfo: ' + JSON.stringify(index.acctInfo));
	//console.log('handleUnlockedMetaMask: publicKey: ' + index.publicKey);
	if (!index.publicKey || index.publicKey == '0x') {
	    handleUnregisteredAcct();
	} else {
	    handleRegisteredAcct(mode);
	}
    });
}


//
// handle unregistered account
//
function handleUnregisteredAcct() {
    setMenuButtonState('shopButton',          'Disabled');
    setMenuButtonState('dashboardButton',     'Disabled');
    setMenuButtonState('createStoreButton',   'Disabled');
    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
    var statusDiv = document.getElementById('statusDiv');
    clearStatusDiv(statusDiv);
    alert('You must first register with Turms Anonymous Message Transport before using Turms MAD Escrow');
}


//
// handle registered account
//
function handleRegisteredAcct(mode) {
    console.log('handleRegisteredAcct');
    setMenuButtonState('shopButton',          'Selected');
    setMenuButtonState('dashboardButton',     'Enabled');
    setMenuButtonState('createStoreButton',   'Enabled');
    replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    var statusDiv = document.getElementById('statusDiv');
    clearStatusDiv(statusDiv);
}



/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
function handleShopPage() {
    setMenuButtonState('shopButton',          'Selected');
    setMenuButtonState('dashboardButton',     'Enabled');
    setMenuButtonState('createStoreButton',   'Enabled');
    replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);

    //
    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var vendorAddr = null
    meUtil.getProductLogs(regionBN, categoryBN, vendorAddr, function(err, results) {
	if (!err) {
	    for (var i = 0; i < results.length; ++i) {
		var tileImg = document.getElementById('tile' + i + 'Img');
		var tileName = document.getElementById('tile' + i + 'Name');
		var tileText = document.getElementById('tile' + i + 'Text');
		meEther.parseRegisterProductEvent(results[i], function(err, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
		    tileImg.src = image;
		    tileName.textContent = name.substring(0, 22);
		    tileText.textContent = desc.substring(0, 70);
		});
	    }
	}
    });
}



/* ------------------------------------------------------------------------------------------------------------------
   create store functions
   create-store is divided into three: reg-store, add-prod, edit-prod
   ------------------------------------------------------------------------------------------------------------------ */
//
// create-store - reg-store
//
function handleCreateStorePage() {
    setMenuButtonState('shopButton',          'Enabled');
    setMenuButtonState('dashboardButton',     'Enabled');
    setMenuButtonState('createStoreButton',   'Selected');
    replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
    replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
    setMenuButtonState('createStoreRegStoreButton',    'Selected');
    setMenuButtonState('createStoreAddProductButton',  'Disabled');
    setMenuButtonState('createStoreEditProductButton', 'Disabled');
    replaceElemClassFromTo('createStoreRegStoreNote',   'hidden',   'visibleB', null);
    replaceElemClassFromTo('createStoreAddProdNote',    'visibleB', 'hidden',   null);
    replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'hidden',   'visibleB', null);
    replaceElemClassFromTo('createStoreAddProdStepsDiv',  'visibleB', 'hidden',   null);
    setMenuButtonState('createStoreRegStoreDoRegButton', 'Disabled');
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
	    setMenuButtonState('createStoreAddProductButton', 'Enabled');
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
    setMenuButtonState('createStoreRegStoreDoRegButton', (enable) ? 'Enabled' : 'Disabled');
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
	waitForTXID(err, txid, 'Register-Vendor', statusDiv, 'send', function() {
	});
    });
}


//
// create-store - add-product
//
function handleAddProduct() {
    console.log('handleAddProduct');
    setMenuButtonState('createStoreRegStoreButton',    'Enabled');
    setMenuButtonState('createStoreAddProductButton',  'Selected');
    setMenuButtonState('createStoreEditProductButton', 'Disabled');
    replaceElemClassFromTo('createStoreRegStoreNote',   'visibleB', 'hidden',   null);
    replaceElemClassFromTo('createStoreAddProdNote',    'hidden',   'visibleB', null);
    replaceElemClassFromTo('createStoreRegStoreStepsDiv', 'visibleB', 'hidden',   null);
    replaceElemClassFromTo('createStoreAddProdStepsDiv',  'hidden',   'visibleB', null);
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
    setMenuButtonState('createStoreAddProdDoAddButton', (enable) ? 'Enabled' : 'Disabled');
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
	waitForTXID(err, txid, 'Register-Product', statusDiv, 'send', function() {
	});
    });
}



/* ------------------------------------------------------------------------------------------------------------------
   common functions
   ------------------------------------------------------------------------------------------------------------------ */
function addTileToCenterTableDiv() {
    console.log('index.addTileToCenterTableDiv');
    var img = document.createElement("img").classname = 'tileImg';
    img.src="images/logo.png";
    img.alt = 'tile image here';
    var div = document.createElement("div");
    var centerTableDiv = document.getElementById('centerTableDiv');
    centerTableDiv.appendChild(img);
}


//
// as a convenience, in case an error has already occurred (for example if the user rejects the transaction), you can
// call this fcn with the error message and no txid.
//
function waitForTXID(err, txid, desc, statusDiv, continuationMode, callback) {
    //
    setMenuButtonState('shopButton',          'Disabled');
    setMenuButtonState('dashboardButton',     'Disabled');
    setMenuButtonState('createStoreButton',   'Disabled');
    setMenuButtonState('createStoreRegStoreButton',    'Disabled');
    setMenuButtonState('createStoreAddProductButton',  'Disabled');
    setMenuButtonState('createStoreEditProductButton', 'Disabled');
    //status div starts out hidden
    console.log('show status div');
    statusDiv.style.display = "block";
    var leftDiv = document.createElement("div");
    leftDiv.className = 'visibleIB';
    statusDiv.appendChild(leftDiv);
    var rightDiv = document.createElement("div");
    rightDiv.className = 'visibleIB';
    statusDiv.appendChild(rightDiv);
    var statusCtr = 0;
    var statusText = document.createTextNode('No status yet...');
    leftDiv.appendChild(statusText);
    if (!!err || !txid) {
	if (!err)
	    err = 'No transaction hash was generated.';
	statusText.textContent = 'Error in ' + desc + ' transaction: ' + err;
	var reloadLink = document.createElement('a');
	reloadLink.addEventListener('click', function() {
	    handleUnlockedMetaMask(continuationMode);
	});
	reloadLink.href = 'javascript:null;';
	reloadLink.innerHTML = "<h2>Continue</h2>";
	reloadLink.disabled = false;
	rightDiv.appendChild(reloadLink);
	callback(err);
	return;
    }
    //
    var viewTxLink = document.createElement('a');
    viewTxLink.href = 'https://' + ether.etherscanioTxStatusHost + '/tx/' + txid;
    viewTxLink.innerHTML = "<h2>View transaction</h2>";
    viewTxLink.target = '_blank';
    viewTxLink.disabled = false;
    leftDiv.appendChild(viewTxLink);
    //
    //cleared in handleUnlockedMetaMask, after the user clicks 'continue'
    index.waitingForTxid = true;
    var timer = setInterval(function() {
	statusText.textContent = 'Waiting for ' + desc + ' transaction: ' + ++statusCtr + ' seconds...';
	if ((statusCtr & 0xf) == 0) {
	    common.web3.eth.getTransactionReceipt(txid, function(err, receipt) {
		console.log('waitForTXID: err = ' + err);
		console.log('waitForTXID: receipt = ' + receipt);
		if (!!err || !!receipt) {
		    if (!err && !!receipt && receipt.status == 0)
			err = "Transaction Failed with REVERT opcode";
		    statusText.textContent = (!!err) ? 'Error in ' + desc + ' transaction: ' + err : desc + ' transaction succeeded!';
		    console.log('transaction is in block ' + (!!receipt ? receipt.blockNumber : 'err'));
		    //statusText.textContent = desc + ' transaction succeeded!';
		    clearInterval(timer);
		    //
		    var reloadLink = document.createElement('a');
		    reloadLink.addEventListener('click', function() {
			beginTheBeguine(continuationMode);
		    });
		    reloadLink.href = 'javascript:null;';
		    reloadLink.innerHTML = "<h2>Continue</h2>";
		    reloadLink.disabled = false;
		    rightDiv.appendChild(reloadLink);
		    callback(err);
		    return;
		}
	    });
	}
    }, 1000);
}


function clearStatusDiv(statusDiv) {
    while (statusDiv.hasChildNodes()) {
	statusDiv.removeChild(statusDiv.lastChild);
    }
    statusDiv.style.display = "none";
}


function clearMsgList() {
    var listTableBody = document.getElementById('listAreaDiv');
    while (listTableBody.hasChildNodes()) {
	var child = listTableBody.lastChild;
	if (!!child.id && child.id.startsWith("msgListHeader"))
	    break;
	listTableBody.removeChild(child);
    }
    index.listIdx = -1;
}


//state = 'Disabled' | 'Enabled' | 'Selected'
function setMenuButtonState(buttonID, state) {
    var button = document.getElementById(buttonID);
    button.disabled = (state == 'Enabled') ? false : true;
    var newClassName = 'menuBarButton' + state;
    if (button.className.indexOf('menuBarButtonDisabled') >= 0)
	button.className = (button.className).replace('menuBarButtonDisabled', newClassName);
    else if (button.className.indexOf('menuBarButtonEnabled') >= 0)
	button.className = (button.className).replace('menuBarButtonEnabled', newClassName);
    else if (button.className.indexOf('menuBarButtonSelected') >= 0)
	button.className = (button.className).replace('menuBarButtonSelected', newClassName);
    else
	button.className = (button.className).replace('menuBarButton', newClassName);
}


function replaceElemClassFromTo(elemId, from, to, disabled) {
    var elem = document.getElementById(elemId);
    if (!elem)
	console.log('could not find elem: ' + elemId);
    elem.className = (elem.className).replace(from, to);
    elem.disabled = disabled;
    return(elem);
}
