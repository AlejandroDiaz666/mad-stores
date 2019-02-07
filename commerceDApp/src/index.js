const common = require('./common');
const ether = require('./ether');
const dhcrypt = require('./dhcrypt');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const mtUtil = require('./mtUtil');
const dashboard = require('./dashboard');
const createStore = require('./createStore');
const shop = require('./shop');
const BN = require("bn.js");


document.addEventListener('DOMContentLoaded', function() {
    console.log('content loaded');
    index.main();
}, false);


var index = module.exports = {
    waitingForTxid: false,
    localStoragePrefix: '',

    main: function() {
	console.log('index.main');
	index.setButtonHandlers();
	createStore.setButtonHandlers();
	shop.setButtonHandlers();
	dashboard.setButtonHandlers();
	beginTheBeguine();
    },

    setButtonHandlers: function() {
	setOptionsButtonHandlers();
	setMainButtonHandlers();
	setWrapButtonHandlers();
	setUnwrapButtonHandlers();
	//for message transport
	mtUtil.setMsgCloseHandler();
	mtUtil.setAttachButtonHandler();
	mtUtil.setSendButtonHandler();
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
	dashboard.handleDashboardPage();
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
	meEther.getDaiBalance(common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	    console.log('wrapDialogDoButton: daiBalanceBN = ' + daiBalanceBN.toString(10));
	    if (daiBalanceBN.lt(daiAmountBN)) {
		common.replaceElemClassFromTo('wrapDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('wrapDialogErr', 'hidden', 'visibleIB', null);
		wrapDialogDoButton.disabled = false;
		wrapDialogCancelButton.disabled = false;
	    } else {
		common.showWaitingForMetaMask(true, false);
		const allDoneFcn = () => {
		    common.replaceElemClassFromTo('wrapDialogDiv', 'visibleB', 'hidden', null);
		    wrapButton.disabled = false;
		    unwrapButton.disabled = false;
		    common.clearStatusDiv();
		    updateDaiAndWDai();
		};
		meEther.wrapDaiApprove(daiAmountBN, function(err, approveTxid) {
		    common.showWaitingForMetaMask(false, false);
		    common.waitForTXID(err, approveTxid, 'approve (Dai transfer)', null, ether.etherscanioTxStatusHost, function() {
			common.clearStatusDiv();
			common.showWaitingForMetaMask(true, true);
			meEther.wrapDaiTransfer(daiAmountBN, function(err, wrapDaiTxid) {
			    common.showWaitingForMetaMask(false, false);
			    common.waitForTXID(err, wrapDaiTxid, 'wrap Dai', allDoneFcn, ether.etherscanioTxStatusHost, null);
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
	meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    console.log('unwrapDialogDoButton: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	    if (wdaiBalanceBN.lt(wdaiAmountBN)) {
		common.replaceElemClassFromTo('unwrapDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('unwrapDialogErr', 'hidden', 'visibleIB', null);
		unwrapDialogDoButton.disabled = false;
		unwrapDialogCancelButton.disabled = false;
	    } else {
		common.showWaitingForMetaMask(true, false);
		const allDoneFcn = () => {
		    common.replaceElemClassFromTo('unwrapDialogDiv', 'visibleB', 'hidden', null);
		    wrapButton.disabled = false;
		    unwrapButton.disabled = false;
		    common.clearStatusDiv();
		    updateDaiAndWDai();
		};
		meEther.unwrapDai(wdaiAmountBN, function(err, txid) {
		    common.showWaitingForMetaMask(false, false);
		    common.waitForTXID(err, txid, 'unwrap Dai', allDoneFcn, ether.etherscanioTxStatusHost, null);
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
// beginTheBeguine -- start this enchilada
//
var timerIsPaused = () => {
    var viewRecvButton = document.getElementById('viewRecvButton');
    var viewSentButton = document.getElementById('viewSentButton');
    return(((mtUtil.acctInfo == null                           ||
	     viewRecvButton.className.indexOf('Selected') >= 0 ||
	     viewSentButton.className.indexOf('Selected') >= 0 ) &&
	    (!common.waitingForTxid                             ) ) ? false : true);
}

async function beginTheBeguine() {
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
		    beginTheBeguine();
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
	    handleUnlockedMetaMask();
	}
    });
}

//
// handle locked metamask
//
function handleLockedMetaMask(err) {
    console.log('handleLlockedMetaMask');
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
// note: after a transaction is completed we come back to this fcn.
//
function handleUnlockedMetaMask() {
    console.log('handleUnlockedMetaMask');
    //we can be called from the 'continue' link in common.waitForTXID, so clear waiting flag. this re-enables the interval
    //timer to check for changed status
    common.waitingForTxid = false;
    common.localStoragePrefix = (common.web3.eth.accounts[0]).substring(2, 10) + '-';
    var accountArea = document.getElementById('accountArea');
    accountArea.value = 'Your account: ' + common.web3.eth.accounts[0];
    ether.getBalance('ether', function(err, balance) {
	const balanceArea = document.getElementById('balanceArea');
	console.log('balance (eth) = ' + balance);
	const balanceETH = parseFloat(balance).toFixed(6);
	balanceArea.value = '  Eth Balance: ' + balanceETH.toString(10) + ' Eth';
    });
    updateDaiAndWDai();
    ether.getNetwork(function(err, network) {
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
	mtEther.accountQuery(common.web3.eth.accounts[0], function(err, _acctInfo) {
	    console.log('handleUnlockedMetaMask: _acctInfo: ' + _acctInfo);
	    mtUtil.acctInfo = _acctInfo;
	    mtUtil.publicKey = (!!mtUtil.acctInfo) ? mtUtil.acctInfo.publicKey : null;
	    console.log('handleUnlockedMetaMask: acctInfo: ' + JSON.stringify(mtUtil.acctInfo));
	    //console.log('handleUnlockedMetaMask: publicKey: ' + mtUtil.publicKey);
	    if (!mtUtil.publicKey || mtUtil.publicKey == '0x') {
		handleUnregisteredAcct();
	    } else {
		handleRegisteredAcct();
	    }
	});
    });
}

//
// handle unregistered account
//
function updateDaiAndWDai() {
    meEther.getDaiBalance(common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	const daiBalanceArea = document.getElementById('daiBalanceArea');
	daiBalanceArea.value = '  Dai Balance: ' + meEther.daiBNToUsdStr(daiBalanceBN, 6) + ' Dai';
    });
    meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
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
    common.clearStatusDiv();
    alert('You must first register with Turms Anonymous Message Transport before using Turms MAD Escrow');
}


//
// handle registered account
//
function handleRegisteredAcct() {
    console.log('handleRegisteredAcct');
    common.setMenuButtonState('shopButton',          'Selected');
    common.setMenuButtonState('dashboardButton',     'Enabled');
    common.setMenuButtonState('createStoreButton',   'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);
    // we need access to the message transport private key
    if (!!dhcrypt.dh && mtUtil.publicKey == dhcrypt.publicKey()) {
	console.log('handleRegisteredAcct: messageTransport key is already unlocked');
    } else {
	common.showWaitingForMetaMask(true);
	const encryptedPrivateKey = mtUtil.acctInfo.encryptedPrivateKey;
	dhcrypt.initDH(encryptedPrivateKey, function(err) {
	    common.showWaitingForMetaMask(false);
	    metaMaskModal.style.display = 'none';
	    if (!!err)
		alert(err);
	    else
		shop.handleShopPage();
	});
    }
    common.clearStatusDiv();
}
