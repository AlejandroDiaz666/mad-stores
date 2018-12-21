var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
var createStore = require('./createStore');
var shop = require('./shop');
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
	index.setButtonHandlers();
	createStore.setButtonHandlers();
	shop.setButtonHandlers();
	beginTheBeguine(null);
    },

    setButtonHandlers: function() {
	setOptionsButtonHandlers();
	setMainButtonHandlers();
	setWrapButtonHandlers();
	setUnwrapButtonHandlers();
    },

};


function setOptionsButtonHandlers() {
}


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
	shop.handleShopPage();
    });
    var dashboardButton = document.getElementById('dashboardButton');
    dashboardButton.addEventListener('click', function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Selected');
	common.setMenuButtonState('createStoreButton',   'Enabled');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden', null);
	common.replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    });
    var createStoreButton = document.getElementById('createStoreButton');
    createStoreButton.addEventListener('click', function() {
	createStore.handleCreateStorePage();
    });
}

function setWrapButtonHandlers() {
    const wrapButton = document.getElementById('wrapButton');
    const unwrapButton = document.getElementById('unwrapButton');
    const wrapDialogDoButton = document.getElementById('wrapDialogDoButton');
    const wrapDialogCancelButton = document.getElementById('wrapDialogCancelButton');
    const wrapDialogArea = document.getElementById('wrapDialogArea');
    wrapDialogDoButton.addEventListener('click', function() {
	wrapDialogDoButton.disabled = true;
	wrapDialogCancelButton.disabled = true;
	const daiAmountBN = meEther.usdStrToDaiBN(wrapDialogArea.value);
	console.log('wrapDialogDoButton: daiAmountBN = ' + daiAmountBN.toString(10));
	meEther.getDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	    console.log('wrapDialogDoButton: daiBalanceBN = ' + daiBalanceBN.toString(10));
	    if (daiBalanceBN.lt(daiAmountBN)) {
		common.replaceElemClassFromTo('wrapDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('wrapDialogErr', 'hidden', 'visibleIB', null);
		wrapDialogDoButton.disabled = false;
		wrapDialogCancelButton.disabled = false;
	    } else {
		const metaMaskModal = document.getElementById('metaMaskModal');
		metaMaskModal.style.display = 'block';
		const allDoneFcn = () => {
		    common.replaceElemClassFromTo('wrapDialogDiv', 'visibleB', 'hidden', null);
		    wrapButton.disabled = false;
		    unwrapButton.disabled = false;
		    common.clearStatusDiv(statusDiv);
		    updateDaiAndWDai();
		};
		const statusDiv = document.getElementById('statusDiv');
		meEther.wrapDaiApprove(daiAmountBN, function(err, approveTxid) {
		    metaMaskModal.style.display = 'none';
		    common.waitForTXID(err, approveTxid, 'approve (Dai transfer)', statusDiv, null, ether.etherscanioTxStatusHost, function() {
			common.clearStatusDiv(statusDiv);
			metaMaskModal.style.display = 'block';
			meEther.wrapDaiTransfer(daiAmountBN, function(err, wrapDaiTxid) {
			    metaMaskModal.style.display = 'none';
			    common.waitForTXID(err, wrapDaiTxid, 'wrap Dai', statusDiv, allDoneFcn, ether.etherscanioTxStatusHost, null);
			});
		    });
		});
	    }
	});
    });
    wrapDialogArea.addEventListener('input', function() {
	console.log('wrapDialogArea change event');
	common.replaceElemClassFromTo('wrapDialogNote', 'hidden', 'visibleIB', null);
	common.replaceElemClassFromTo('wrapDialogErr', 'visibleIB', 'hidden', null);
	wrapDialogDoButton.disabled = false;
    });
    wrapDialogCancelButton.addEventListener('click', function() {
	common.replaceElemClassFromTo('wrapDialogDiv', 'visibleB', 'hidden', null);
	wrapButton.disabled = false;
	unwrapButton.disabled = false;
    });
    wrapButton.addEventListener('click', function() {
	common.replaceElemClassFromTo('wrapDialogNote', 'hidden', 'visibleIB', null);
	common.replaceElemClassFromTo('wrapDialogErr', 'visibleIB', 'hidden', null);
	common.replaceElemClassFromTo('wrapDialogDiv', 'hidden', 'visibleB', null);
	wrapButton.disabled = true;
	unwrapButton.disabled = true;
	wrapDialogDoButton.disabled = true;
	wrapDialogCancelButton.disabled = false;
	wrapDialogArea.value = '';
    });
}

function setUnwrapButtonHandlers() {
    const wrapButton = document.getElementById('wrapButton');
    const unwrapButton = document.getElementById('unwrapButton');
    const unwrapDialogDoButton = document.getElementById('unwrapDialogDoButton');
    const unwrapDialogCancelButton = document.getElementById('unwrapDialogCancelButton');
    const unwrapDialogArea = document.getElementById('unwrapDialogArea');
    unwrapDialogDoButton.addEventListener('click', function() {
	unwrapDialogDoButton.disabled = true;
	unwrapDialogCancelButton.disabled = true;
	const wdaiAmountBN = meEther.usdStrToDaiBN(unwrapDialogArea.value);
	console.log('unwrapDialogDoButton: wdaiAmountBN = ' + wdaiAmountBN.toString(10));
	meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    console.log('unwrapDialogDoButton: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	    if (wdaiBalanceBN.lt(wdaiAmountBN)) {
		common.replaceElemClassFromTo('unwrapDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('unwrapDialogErr', 'hidden', 'visibleIB', null);
		unwrapDialogDoButton.disabled = false;
		unwrapDialogCancelButton.disabled = false;
	    } else {
		const metaMaskModal = document.getElementById('metaMaskModal');
		metaMaskModal.style.display = 'block';
		const allDoneFcn = () => {
		    common.replaceElemClassFromTo('unwrapDialogDiv', 'visibleB', 'hidden', null);
		    wrapButton.disabled = false;
		    unwrapButton.disabled = false;
		    common.clearStatusDiv(statusDiv);
		    updateDaiAndWDai();
		};
		const statusDiv = document.getElementById('statusDiv');
		meEther.unwrapDai(wdaiAmountBN, function(err, txid) {
		    metaMaskModal.style.display = 'none';
		    common.waitForTXID(err, txid, 'unwrap Dai', statusDiv, allDoneFcn, ether.etherscanioTxStatusHost, null);
		});
	    }
	});
    });
    unwrapDialogArea.addEventListener('input', function() {
	console.log('unwrapDialogArea change event');
	common.replaceElemClassFromTo('unwrapDialogNote', 'hidden', 'visibleIB', null);
	common.replaceElemClassFromTo('unwrapDialogErr', 'visibleIB', 'hidden', null);
	unwrapDialogDoButton.disabled = false;
    });
    unwrapDialogCancelButton.addEventListener('click', function() {
	common.replaceElemClassFromTo('unwrapDialogDiv', 'visibleB', 'hidden', null);
	wrapButton.disabled = false;
	unwrapButton.disabled = false;
    });
    unwrapButton.addEventListener('click', function() {
	common.replaceElemClassFromTo('unwrapDialogNote', 'hidden', 'visibleIB', null);
	common.replaceElemClassFromTo('unwrapDialogErr', 'visibleIB', 'hidden', null);
	common.replaceElemClassFromTo('unwrapDialogDiv', 'hidden', 'visibleB', null);
	wrapButton.disabled = true;
	unwrapButton.disabled = true;
	unwrapDialogDoButton.disabled = true;
	unwrapDialogCancelButton.disabled = false;
	unwrapDialogArea.value = '';
    });
}



//
// mode = [ 'send' | 'recv' | null ]
//
var timerIsPaused = () => {
    var viewRecvButton = document.getElementById('viewRecvButton');
    var viewSentButton = document.getElementById('viewSentButton');
    return(((common.acctInfo == null                            ||
	     viewRecvButton.className.indexOf('Selected') >= 0 ||
	     viewSentButton.className.indexOf('Selected') >= 0 ) &&
	    (!common.waitingForTxid                             ) ) ? false : true);
}

async function beginTheBeguine(mode) {
    //await doFirstIntro(false);
    if (!common.acctCheckTimer) {
	console.log('init acctCheckTimer');
	var count = 0;
	common.acctCheckTimer = setInterval(function() {
	    //if (timerIsPaused())
	    //  console.log('timerIsPaused!');
	    common.checkForMetaMask(true, function(err, w3) {
		var acct = (!err && !!w3) ? w3.eth.accounts[0] : null;
		if (acct != common.account) {
		    console.log('MetaMask account changed!');
		    console.log('acct = ' + acct + ', common.account = ' + common.account);
		    beginTheBeguine(null);
		}
	    });
	}, 10000);
    }
    common.checkForMetaMask(true, function(err, w3) {
	var acct = (!err && !!w3) ? w3.eth.accounts[0] : null;
	console.log('beginTheBeguine: checkForMetaMask acct = ' + acct);
	common.account = acct;
	if (!!err) {
	    console.log('beginTheBeguine: checkForMetaMask err = ' + err);
	    handleLockedMetaMask(err);
	} else {
	    console.log('common.beginTheBeguine');
	    common.setMenuButtonState('shopButton',          'Disabled');
	    common.setMenuButtonState('dashboardButton',     'Disabled');
	    common.setMenuButtonState('createStoreButton',   'Disabled');
	    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
	    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
	    common.replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
	    handleUnlockedMetaMask(mode);
	}
    });
}

//
// handle locked metamask
//
function handleLockedMetaMask(err) {
    common.setMenuButtonState('shopButton',          'Disabled');
    common.setMenuButtonState('dashboardButton',     'Disabled');
    common.setMenuButtonState('createStoreButton',   'Disabled');
    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    common.replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
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
    common.clearStatusDiv(statusDiv);
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
    //we can be called from the 'continue' link in common.waitForTXID, so clear waiting flag. this re-enables the interval
    //timer to check for changed status
    common.waitingForTxid = false;
    common.localStoragePrefix = (common.web3.eth.accounts[0]).substring(2, 10) + '-';
    var accountArea = document.getElementById('accountArea');
    accountArea.value = 'Your account: ' + common.web3.eth.accounts[0];
    ether.getBalance(common.web3, 'szabo', function(err, balance) {
	const balanceArea = document.getElementById('balanceArea');
	const balanceSzabo = parseInt(balance);
	console.log('balanceSzabo = ' + balanceSzabo);
	const balanceETH = (balanceSzabo / ether.SZABO_PER_ETH).toFixed(6);
	balanceArea.value = '  Eth Balance: ' + balanceETH.toString(10) + ' Eth'
    });
    updateDaiAndWDai();
    ether.getNetwork(common.web3, function(err, network) {
	const networkArea = document.getElementById('networkArea');
	if (!!err) {
	    networkArea.value = 'Error: ' + err;
	} else {
	    networkArea.value = 'Network: ' + network;
	    mtEther.setNetwork(network);
	    if (network.startsWith('Mainnet'))
		networkArea.className = (networkArea.className).replace('attention', '');
	    else if (networkArea.className.indexOf(' attention' < 0))
		networkArea.className += ' attention';
	}
	mtEther.accountQuery(common.web3, common.web3.eth.accounts[0], function(err, _acctInfo) {
	    console.log('handleUnlockedMetaMask: _acctInfo: ' + _acctInfo);
	    common.acctInfo = _acctInfo;
	    common.publicKey = (!!common.acctInfo) ? common.acctInfo[mtEther.ACCTINFO_PUBLICKEY] : null;
	    console.log('handleUnlockedMetaMask: acctInfo: ' + JSON.stringify(common.acctInfo));
	    //console.log('handleUnlockedMetaMask: publicKey: ' + common.publicKey);
	    if (!common.publicKey || common.publicKey == '0x') {
		handleUnregisteredAcct();
	    } else {
		handleRegisteredAcct(mode);
	    }
	});
    });
}

//
// handle unregistered account
//
function updateDaiAndWDai() {
    meEther.getDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	const daiBalanceArea = document.getElementById('daiBalanceArea');
	daiBalanceArea.value = '  Dai Balance: ' + meEther.daiBNToUsdStr(daiBalanceBN, 6) + ' Dai';
    });
    meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	console.log('handleRegisteredAcct: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	const wdaiBalanceArea = document.getElementById('wdaiBalanceArea');
	wdaiBalanceArea.value = 'W-Dai Balance: ' + meEther.daiBNToUsdStr(wdaiBalanceBN) + ' W-Dai';
    });
}


//
// handle unregistered account
//
function handleUnregisteredAcct() {
    common.setMenuButtonState('shopButton',          'Disabled');
    common.setMenuButtonState('dashboardButton',     'Disabled');
    common.setMenuButtonState('createStoreButton',   'Disabled');
    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    common.replaceElemClassFromTo('shopPageDiv',       'visibleT', 'hidden', null);
    common.replaceElemClassFromTo('createStorePageDiv','visibleT', 'hidden', null);
    var statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    alert('You must first register with Turms Anonymous Message Transport before using Turms MAD Escrow');
}


//
// handle registered account
//
function handleRegisteredAcct(mode) {
    console.log('handleRegisteredAcct');
    common.setMenuButtonState('shopButton',          'Selected');
    common.setMenuButtonState('dashboardButton',     'Enabled');
    common.setMenuButtonState('createStoreButton',   'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    var statusDiv = document.getElementById('statusDiv');
    common.clearStatusDiv(statusDiv);
    shop.handleShopPage();
}
