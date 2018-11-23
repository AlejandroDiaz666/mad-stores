var common = require('./common');
var meEther = require('./meEther');
var BN = require("bn.js");


document.addEventListener('DOMContentLoaded', function() {
    console.log('content loaded');
    index.main();
}, false);


var index = module.exports = {
    localStoragePrefix: '',

    main: function() {
	console.log('index.main');
	setMainButtonHandlers();
	setRegisterStoreButtonHandlers();
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
	setMenuButtonState('shopButton',          'Selected');
	setMenuButtonState('dashboardButton',     'Enabled');
	setMenuButtonState('createStoreButton',   'Enabled');
	replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
	replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);

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
	handleCreateMyStorePage();
    });
    setMenuButtonState('shopButton', 'Selected');
}

function setRegisterStoreButtonHandlers() {
    var rsLoadImageButton  = document.getElementById('rsLoadImageButton');
    rsLoadImageButton.addEventListener('change', function() {
	var rsStoreImg = document.getElementById('rsStoreImg');
	if (rsLoadImageButton.files && rsLoadImageButton.files[0]) {
	    console.log('rsLoadImageButton: got ' + rsLoadImageButton.files[0].name);
            var reader = new FileReader();
            reader.onload = (e) => {
                rsStoreImg.src = e.target.result;
            };
            reader.readAsDataURL(rsLoadImageButton.files[0]);
        } else {
            rsStoreImg.src = '#';
	}
	enableRegisterStoreButton();
    });
    var rsStoreNameArea  = document.getElementById('rsStoreNameArea');
    rsStoreNameArea.addEventListener('change', function() {
	enableRegisterStoreButton();
    });
    var rsStoreDescArea  = document.getElementById('rsStoreDescArea');
    rsStoreDescArea.addEventListener('change', function() {
	enableRegisterStoreButton();
    });
    var rsRegisterStoreButton = document.getElementById('rsRegisterStoreButton');
    rsRegisterStoreButton.addEventListener('click', function() {
	handleRegisterStore();
    });
}

function beginTheBeguine(mode) {
    console.log('index.beginTheBeguine');
    //addTileToCenterTableDiv();
}


function handleCreateMyStorePage() {
    setMenuButtonState('shopButton',          'Enabled');
    setMenuButtonState('dashboardButton',     'Enabled');
    setMenuButtonState('createStoreButton',   'Selected');
    replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden', null);
    replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
    setRsMenuButtonState('rsCreateStoreButton',   'Selected');
    setRsMenuButtonState('rsAddProductButton',    'Disabled');
    setRsMenuButtonState('rsEditProductButton',   'Disabled');
    var rsRegisterStoreButton = document.getElementById('rsRegisterStoreButton');
    rsRegisterStoreButton.disabled = true;
}

function enableRegisterStoreButton() {
    var rsStoreNameArea = document.getElementById('rsStoreNameArea');
    var rsStoreDescArea = document.getElementById('rsStoreDescArea');
    var rsLoadImageButton = document.getElementById('rsLoadImageButton');
    var rsRegisterStoreButton = document.getElementById('rsRegisterStoreButton');
    rsRegisterStoreButton.disabled = (rsStoreNameArea.value.trim().length > 0 != "" &&
				      rsStoreDescArea.value.trim().length > 0 != "" &&
				      rsLoadImageButton.files && rsLoadImageButton.files[0]) ? false : true;
}

function handleRegisterStore() {
    var serviceRegionBN = new BN('000000', 2);
    var rsStoreNameArea = document.getElementById('rsStoreNameArea');
    var rsStoreDescArea = document.getElementById('rsStoreDescArea');
    var rsLoadImageButton = document.getElementById('rsLoadImageButton');
    var nameBytes = common.strToUtf8Bytes(rsStoreNameArea.value);
    var descBytes = common.strToUtf8Bytes(rsStoreDescArea.value);
    var reader = new FileReader();
    reader.onload = function(e) {
        //e.target.result is a byteArray
	var imageBytes = e.target.result;
	meEther.registerVendor(web3, serviceRegionBN, nameBytes, descBytes, imageBytes, function(err, txid) {
	    console.log('txid = ' + txid);
	    metaMaskModal.style.display = 'none';
	    var statusDiv = document.getElementById('statusDiv');
	    waitForTXID(err, txid, 'Register-Vendor', statusDiv, 'send', function() {
	    });
	});
    };
    reader.readAsDataURL(rsLoadImageButton.files[0]);
}


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
    setMenuButtonState('importantInfoButton', 'Enabled');
    setMenuButtonState('registerButton',      'Disabled');
    setMenuButtonState('viewRecvButton',      'Disabled');
    setMenuButtonState('composeButton',       'Disabled');
    setMenuButtonState('viewSentButton',      'Disabled');
    setMenuButtonState('withdrawButton',      'Disabled');
    var replyButton = document.getElementById('replyButton');
    replyButton.disabled = true;
    //
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
    button.className = 'menuBarButton' + state;
}
//state = 'Disabled' | 'Enabled' | 'Selected'
function setRsMenuButtonState(buttonID, state) {
    var button = document.getElementById(buttonID);
    button.disabled = (state == 'Enabled') ? false : true;
    button.className = 'rsMenuBarButton' + state;
}

function replaceElemClassFromTo(elemId, from, to, disabled) {
    var elem = document.getElementById(elemId);
    if (!elem)
	console.log('could not find elem: ' + elemId);
    elem.className = (elem.className).replace(from, to);
    elem.disabled = disabled;
    return(elem);
}
