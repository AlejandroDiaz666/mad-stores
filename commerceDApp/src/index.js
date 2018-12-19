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
	setOptionsButtonHandlers();
	setMainButtonHandlers();
	createStore.setButtonHandlers();
	shop.setButtonHandlers();
	beginTheBeguine(null);
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
	meEther.getDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, daiBalanceBN) {
	    balanceArea.value = 'Balance: ' + balanceETH.toString(10) + ' Eth, ' + meEther.daiBNToUsdStr(daiBalanceBN, 6) + ' Dai';
	});
	meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    console.log('handleRegisteredAcct: wdaiBalanceBN = ' + wdaiBalanceBN.toString(10));
	    const wdaiBalanceArea = document.getElementById('wdaiBalanceArea');
	    wdaiBalanceArea.value = 'Balance: ' + meEther.daiBNToUsdStr(wdaiBalanceBN) + ' W-Dai';
	});
    });
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
