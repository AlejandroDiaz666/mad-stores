/* ------------------------------------------------------------------------------------------------------------------
   dashboard functions
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const shop = require('./shop');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const mtUtil = require('./mtUtil');
const mtDisplay = require('./mtDisplay');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


var dashboard = module.exports = {
    selectedEscrowIdx: -1,
    escrowCount: 0,
    rowCount: 0,
    selectedEscrowIdBN: null,
    selectedEscrowInfo: null,
    inDialog: false,
    STEP_COMPLETE: true,
    //
    // prefix for local stoarage of highest msgId that has been read for each escrow
    localStoragePrefix: '',
    hiMsgIdPrefix: '',
    //
    stepNames:        [ 'purchase', 'modify', 'cancel', 'decline', 'approve', 'release', 'burn' ],
    stepTileClasses:  [ 'escrowListStepDepositSpan', 'escrowListStepModifySpan', 'escrowListStepCancelSpan',
		        'escrowListStepDeclineSpan', 'escrowListStepApproveSpan', 'escrowListStepReleaseSpan',
			'escrowListStepBurnSpan', 'escrowListStepClaimSpan' ],
    //tooltips per completed step
    completeStepTips: [ 'funds for this purchase have been deposited into escrow',
			'additional funds for this purchase have been deposited into escrow',
			'this purchase was canceled; escrow is closed',
			'this purchase was declined; escrow is closed',
			'this purchase was approved; escrow is locked',
			'this escrow is completed',
			'this escrow was burned',
			'this escrow was abandoned by the buyer and claimed by the seller' ],
    //description of xact when no message was sent
    noMsgDefaultDesc: [ 'funds for this purchase have been deposited into escrow.',
			'additional funds for this purchase have been deposited into escrow.',
			'this purchase was canceled by the buyer. Escrow is closed.',
			'this purchase was declined by the seller. Escrow is closed.',
			'this purchase was approved by the seller. Escrow is locked.',
			'delivery was confirmed by the buyer. Escrow is completed.',
			'this escrow was burned by the buyer. All funds are lost!',
			'this escrow was abandoned by the buyer and claimed by the seller.' ],
    //tooltips per to-do step
    toDoStepTips:     [ null,
			'add additional funds into escrow for this purchase',
			'cancel this purchase; funds will be released from escrow',
			'decline this purchase; funds will be released from escrow',
			'approve this purchase; will lock funds into escrow',
			'confirm satisfactory delivery of product; all escrow funds will be released',
			'burn this escrow; ALL FUNDS WILL BE LOST!',
			'claim all funds from this abandoned escrow' ],
    //name of message passed to mtDisplay.setupDisplayMsgArea
    msgNames: [ 'deposit/purchase', 'modify', 'cancel', 'decline', 'approve', 'release', 'burn', 'claim' ],
    //description of original transaction message passed to mtDisplay.setupDisplayMsgArea
    firstMsgDescs: [ 'this is the initial escrow deposit and product-purchase for this order',
		     'this is the transaction that modifed the escrow deposit for this order',
		     'the customer canceled this purchase',
		     'the vendor declined this purchase',
		     'the vendor approved this escrow, and committed to deliver this product by DATE',
		     'delivery of this item was confirmed; all escrow funds have been released',
		     'item not delivered, or delivery was rejected; all escrow funds have been burned',
		     'buyer abandoned this escrow, and vendor claimed all funds' ],
    //description of follow-up transaction message passed to mtDisplay.setupDisplayMsgArea
    followMsgDescs: [ 'this is a follow-up message to product-purchase transaction for this order',
		      'this is a follow-up message to the escrow modification transaction for this order',
		      'this is a follow-up message to the escrow cancellation transaction for this order',
		      'this is a follow-up message to the decline transaction for this order',
		      'this is a follow-up message to the approve transaction for this order',
		      'this is a follow-up message to the delivery confirmation transaction for this order',
		      'this is a follow-up message to the burn transaction for this order',
		      'this is a follow-up message to the claim-abandoned transaction for this escrow' ],
    replyAlerts:  [ 'You have attached a new message to the purchase transaction!\n',
		    'You have attached a new message to the modify transaction!\n',
		    'This escrow is already closed and you have attached a new message to the cancel transaction!\n',
		    'This escrow is already closed and you have attached a new message to the decline transaction!\n',
		    'You have attached a new message to the approve transaction!\n',
		    'This escrow is already successfully completed and you have attached a new message to the release transaction!\n',
		    'This escrow is already burned and you have attached a new message to the burn transaction!\n',
		    'This escrow was abandoned and claimed and you have attached a new message to the claim transaction!\n' ],


    handleDashboardPage: function() {
        common.setMenuButtonState('shopButton',          'Enabled');
        common.setMenuButtonState('dashboardButton',     'Selected');
        common.setMenuButtonState('createStoreButton',   'Enabled');
        common.replaceElemClassFromTo('shopPageDiv',           'visibleT', 'hidden',   null);
        common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden',   null);
        common.replaceElemClassFromTo('dashboardPageDiv',      'hidden',   'visibleB', null);
        common.replaceElemClassFromTo('createStorePageDiv',    'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('msgAreaDiv',            'visibleB', 'hidden',   false);
	dashboard.localStoragePrefix = common.web3.eth.accounts[0].substring(2, 10) + '-';
	dashboard.hiMsgIdPrefix = dashboard.localStoragePrefix + 'escrowHiMsg' + '-';
        buildDashboard();
    },

    setButtonHandlers: function() {
	// approve dialog
	const approveDialogDoButton = document.getElementById('approveDialogDoButton');
	const approveDialogCancelButton = document.getElementById('approveDialogCancelButton');
	const approveDialogArea = document.getElementById('approveDialogArea');
	approveDialogArea.addEventListener('input', function() {
	    console.log('approveDialogArea change event');
	    approveDialogDoButton.disabled = false;
	});
	approveDialogCancelButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    common.replaceElemClassFromTo('approveDialogDiv', 'visibleB', 'hidden', null);
	});
	approveDialogDoButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    approveDialogDoButton.disabled = true;
	    approveDialogCancelButton.disabled = true;
	    const secsBN = common.numberToBN(approveDialogSelect.value);
	    secsBN.imuln(parseInt(approveDialogArea.value));
	    common.replaceElemClassFromTo('approveDialogNote', 'visibleIB', 'hidden', null);
	    common.replaceElemClassFromTo('approveDialogDiv', 'visibleB', 'hidden', null);
	    doApprove(secsBN, dashboard.selectedEscrowIdBN, dashboard.selectedEscrowInfo);
	});
	// modify (add funds) dialog
	const addFundsDialogDoButton = document.getElementById('addFundsDialogDoButton');
	const addFundsDialogCancelButton = document.getElementById('addFundsDialogCancelButton');
	const addFundsDialogArea = document.getElementById('addFundsDialogArea');
	addFundsDialogArea.addEventListener('input', function() {
	    console.log('addFundsDialogArea change event');
	    common.replaceElemClassFromTo('addFundsDialogNote', 'hidden', 'visibleIB', null);
	    common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
	    addFundsDialogDoButton.disabled = false;
	});
	addFundsDialogCancelButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    common.replaceElemClassFromTo('addFundsDialogDiv', 'visibleB', 'hidden', null);
	});
	addFundsDialogDoButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    addFundsDialogDoButton.disabled = true;
	    addFundsDialogCancelButton.disabled = true;
	    const addAmountBN = meEther.usdStrToDaiBN(addFundsDialogArea.value);
	    const escrowBN = addAmountBN.muln(3).divn(2);
	    meEther.getWDaiBalance(common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
		if (wdaiBalanceBN.lt(escrowBN)) {
		    common.replaceElemClassFromTo('addFundsDialogNote', 'visibleIB', 'hidden', null);
		    common.replaceElemClassFromTo('addFundsDialogErr', 'hidden', 'visibleIB', null);
		    addFundsDialogDoButton.disabled = false;
		    addFundsDialogCancelButton.disabled = false;
		} else {
		    common.replaceElemClassFromTo('addFundsDialogNote', 'visibleIB', 'hidden', null);
		    common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
		    common.replaceElemClassFromTo('addFundsDialogDiv', 'visibleB', 'hidden', null);
		    doModify(addAmountBN, dashboard.selectedEscrowIdBN, dashboard.selectedEscrowInfo);
		}
	    });
	});
	// release dialog
	const releaseDialogDoButton = document.getElementById('releaseDialogDoButton');
	const releaseDialogCancelButton = document.getElementById('releaseDialogCancelButton');
	const releaseDialogSelect = document.getElementById('releaseDialogSelect');
	releaseDialogCancelButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    common.replaceElemClassFromTo('releaseDialogDiv', 'visibleB', 'hidden', null);
	});
	releaseDialogDoButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    releaseDialogDoButton.disabled = true;
	    releaseDialogCancelButton.disabled = true;
	    const ratingBN = common.numberToBN(releaseDialogSelect.value);
	    common.replaceElemClassFromTo('releaseDialogNote', 'visibleIB', 'hidden', null);
	    common.replaceElemClassFromTo('releaseDialogDiv', 'visibleB', 'hidden', null);
	    doRelease(ratingBN, dashboard.selectedEscrowIdBN, dashboard.selectedEscrowInfo);
	});
	// burn dialog
	const burnDialogDoButton = document.getElementById('burnDialogDoButton');
	const burnDialogCancelButton = document.getElementById('burnDialogCancelButton');
	const burnDialogSelect = document.getElementById('burnDialogSelect');
	burnDialogCancelButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    common.replaceElemClassFromTo('burnDialogDiv', 'visibleB', 'hidden', null);
	});
	burnDialogDoButton.addEventListener('click', function() {
	    dashboard.inDialog = false;
	    burnDialogDoButton.disabled = true;
	    burnDialogCancelButton.disabled = true;
	    const ratingBN = common.numberToBN(burnDialogSelect.value);
	    common.replaceElemClassFromTo('burnDialogNote', 'visibleIB', 'hidden', null);
	    common.replaceElemClassFromTo('burnDialogDiv', 'visibleB', 'hidden', null);
	    doBurn(ratingBN, dashboard.selectedEscrowIdBN, dashboard.selectedEscrowInfo);
	});
    },

};


//
// addStep helper to addRow
//
// a "step" refers to a step in the purchase/approval/delivery process (one of dashboard.steps[])
// each step is represented by a tile, which is added to the addTo div.
// clicking the tile will invoke the passed handler.
//
function addStep(escrowIdBN, escrowInfo, escrowIdx, step, complete, addTo, handler) {
    const className = dashboard.stepTileClasses[step];
    const tipText = complete ? dashboard.completeStepTips[step] : dashboard.toDoStepTips[step]
    console.log('addStep: escrowIdx = ' + escrowIdx + ', className = ' + className);
    const stepSpan = document.createElement("span");
    stepSpan.className = className;
    if (escrowIdx > dashboard.escrowCount - 15) {
	//at some point of scrolling the tooltips stop lining up up with the buttons; anyhow, after
	//the first few line the user probably gets the idea and the tooltips are just plain annoying.
	//first 15 (highest numbered) escrow only..
	stepSpan.className = className + ' tooltip';
	const stepSpanTip = document.createElement("span");
	const tiptextId = className.replace('escrowListStep', 'tooltipText');
	console.log('addStep: classname = ' + className + ', id = ' + tiptextId);
	stepSpanTip.className = 'tooltipText ' + tiptextId;
	stepSpanTip.textContent = tipText;
	stepSpan.appendChild(stepSpanTip);
    }
    stepSpan.addEventListener('click', function() {
	hideAllModals();
	selectRow(escrowIdx);
	handler(escrowIdBN, escrowInfo, common.numberToBN(escrowInfo.productId), step);
    });
    addTo.appendChild(stepSpan);
}


//
// helper fcn for makeRow
// add step tiles to the completedSpan for each completed step
//
function addCompletedStepsToRow(escrowIdBN, escrowInfo, escrowIdx, completedSpan) {
    for (let step = 0; step < meEther.xactKeys.length; ++step) {
	const mask = (1 << step)
	// some message was sent for this step
	if ((escrowInfo.state & mask) != 0)
	    addStep(escrowIdBN, escrowInfo, escrowIdx, step, dashboard.STEP_COMPLETE, completedSpan, showCompletedStep);
    }
}

//
// cb()
// helper fcn for makeRow
// add step tiles to the nextStepsSpan for each possible next step
//
function addNextStepsToRow(escrowIdBN, escrowInfo, escrowIdx, nextStepsSpan, cb) {
    const hiMsgIdBN = common.getIndexedBN(dashboard.hiMsgIdPrefix, escrowIdBN);
    checkForUnreadMsgs(hiMsgIdBN, escrowIdBN, escrowInfo, 0, function(haveUnread) {
	if (haveUnread) {
	    nextStepsSpan.textContent = 'Check Messaages!';
	    nextStepsSpan.className += ' attention';
	} else if (escrowInfo.isClosed) {
	    nextStepsSpan.textContent = 'Escrow Is Closed';
	} else if (escrowInfo.vendorAddr == common.web3.eth.accounts[0] && (escrowInfo.state & (1 << meEther.STEP_APPROVE)) != 0) {
	    addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_CLAIM, !dashboard.STEP_COMPLETE, nextStepsSpan, doClaimDialog);
	} else {
	    if (escrowInfo.vendorAddr == common.web3.eth.accounts[0] && (escrowInfo.state & (1 << meEther.STEP_APPROVE)) == 0) {
		addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_APPROVE, !dashboard.STEP_COMPLETE, nextStepsSpan, doApproveDialog);
		addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_DECLINE, !dashboard.STEP_COMPLETE, nextStepsSpan, doDecline);
	    }
	    if (escrowInfo.customerAddr == common.web3.eth.accounts[0]) {
		if ((escrowInfo.state & (1 << meEther.STEP_APPROVE)) == 0) {
		    addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_MODIFY, !dashboard.STEP_COMPLETE, nextStepsSpan, doModifyDialog);
		    addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_CANCEL, !dashboard.STEP_COMPLETE, nextStepsSpan, doCancel);
		} else if (!escrowInfo.isClosed) {
		    addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_RELEASE, !dashboard.STEP_COMPLETE, nextStepsSpan, doReleaseDialog);
		    addStep(escrowIdBN, escrowInfo, escrowIdx, meEther.STEP_BURN, !dashboard.STEP_COMPLETE, nextStepsSpan, doBurnDialog);
		}
	    }
	}
	if (!!cb)
	    cb();
    });
}


//
// cb()
// another helper for addRow
// creates the entire row, given just an empty div container
//
function makeRow(rowDiv, escrowIdx, cb) {
    console.log('makeRow: escrowIdx = ' + escrowIdx);
    rowDiv.className = 'escrowListItemDiv';
    rowDiv.id = 'row-' + escrowIdx;
    //
    const leftDiv = document.createElement("div");
    leftDiv.className = 'escrowListItemLeftDiv';
    const leftSubDiv0 = document.createElement("div");
    leftSubDiv0.className = 'escrowListItemLeftSubDiv0';
    const leftSubDiv1 = document.createElement("div");
    leftSubDiv1.className = 'escrowListItemLeftSubDiv1';
    //
    const escrowNoArea = common.makeTextarea(null, 'escrowListEscrowNoArea', true);
    const typeArea = common.makeTextarea(null, 'escrowListTypeArea', true);
    const productArea = common.makeTextarea(null, 'escrowListProductArea', true);
    const addrArea = common.makeTextarea(null, 'escrowListAddrArea', true);
    const dateArea = common.makeTextarea(null, 'escrowListDateArea', true);
    const completedSpan = document.createElement("span");
    completedSpan.className = 'escrowListCompletedSpan';
    const nextStepsSpan = document.createElement("span");
    nextStepsSpan.className = 'escrowListnextStepsSpan';
    //const infoArea = common.makeTextarea(null, 'escrowListInfoArea', true);
    //
    leftSubDiv0.appendChild(escrowNoArea);
    leftSubDiv0.appendChild(typeArea);
    leftSubDiv0.appendChild(productArea);
    leftSubDiv0.appendChild(addrArea);
    //leftSubDiv1.appendChild(infoArea);
    leftDiv.appendChild(leftSubDiv0);
    leftDiv.appendChild(leftSubDiv1);
    rowDiv.appendChild(leftDiv);
    rowDiv.appendChild(completedSpan);
    rowDiv.appendChild(nextStepsSpan);
    //
    const selectedProductPageDiv = document.getElementById('selectedProductPageDiv');
    const msgAreaDiv = document.getElementById('msgAreaDiv');
    leftDiv.addEventListener('mouseover', function() {
	if (!dashboard.inDialog && selectedProductPageDiv.className.indexOf('hidden') >= 0 && msgAreaDiv.className.indexOf('hidden') >= 0)
	    selectRow(escrowIdx);
    });
    meEther.escrowQuery(common.web3.eth.accounts[0], escrowIdx, function(err, escrowIdBN, escrowInfo) {
        console.log('addRow: escrowIdBN = ' + escrowIdBN.toString(10));
        escrowNoArea.value = escrowIdBN.toString(10);
	productArea.value = 'loading...';
	meUtil.getProductById(common.numberToBN(escrowInfo.productId), function(err, product) {
	    productArea.value = product.name;
	    leftDiv.addEventListener('click', function() {
		console.log('productArea: got click');
		hideAllModals();
		selectRow(escrowIdx);
		meUtil.showProductDetail(product, 'view', 'limit', null);
	    });
	});
	if (!escrowInfo.isClosed) {
	    const sellerBN = common.numberToBN(escrowInfo.vendorBalance);
	    const buyerBN = common.numberToBN(escrowInfo.customerBalance);
	    leftSubDiv1.textContent = 'Buyer deposit: ' + meEther.daiBNToUsdStr(buyerBN) + ' W-Dai; Seller deposit: ' + meEther.daiBNToUsdStr(sellerBN) + ' W-Dai';
	}
	// transaction type
        if (escrowInfo.vendorAddr == common.web3.eth.accounts[0]) {
            typeArea.value = 'Sale ';
	    ether.ensReverseLookup(escrowInfo.customerAddr, function(err, name) {
		let addrStr = escrowInfo.customerAddr;
		if (!err && !!name)
		    addrStr = common.abbreviateAddrForEns(escrowInfo.customerAddr, name, 0);
		addrArea.value = addrStr;
	    });
        }
        if (escrowInfo.customerAddr == common.web3.eth.accounts[0]) {
            typeArea.value += (!!typeArea.value) ? '/ Purchase' : 'Purchase';
	    ether.ensReverseLookup(escrowInfo.vendorAddr, function(err, name) {
		let addrStr = escrowInfo.vendorAddr;
		if (!err && !!name)
		    addrStr = common.abbreviateAddrForEns(escrowInfo.vendorAddr, name, 0);
		addrArea.value = addrStr;
	    });
        }
	// completed steps, next steps
	addCompletedStepsToRow(escrowIdBN, escrowInfo, escrowIdx, completedSpan);
	addNextStepsToRow(escrowIdBN, escrowInfo, escrowIdx, nextStepsSpan, cb);
    });
}


//
// repaint a row
//
function remakeRow(escrowIdx) {
    const id = 'row-' + escrowIdx;
    const rowDiv = document.getElementById(id);
    common.clearDivChildren(rowDiv);
    makeRow(rowDiv, escrowIdx, null);
}


//
// cb()
// add a new row
//
function addRow(tableElem, cb) {
    console.log('addRow: enter');
    const escrowIdx = dashboard.escrowCount - dashboard.rowCount - 1;
    const rowDiv = document.createElement("div");
    makeRow(rowDiv, escrowIdx, cb);
    tableElem.appendChild(rowDiv);
    ++dashboard.rowCount;
    console.log('addRow: exit');
}


//
//
//
function populateRows() {
    console.log('populate');
    const escrowListDiv = document.getElementById('escrowListDiv');
    let callDepth = 0;
    let callCount = 0;
    for (let j = 0; j < 100; ++j) {
        console.log('scroll: scrollTop = ' + escrowListDiv.scrollTop + ', scrollHeight = ' + escrowListDiv.scrollHeight + ', clientHeight = ' + escrowListDiv.clientHeight);
        if (escrowListDiv.scrollTop + escrowListDiv.clientHeight < escrowListDiv.scrollHeight - 100)
            break;
        if (dashboard.rowCount >= dashboard.escrowCount)
            break;
        console.log('populateRows: dashboard.rowCount = ' + dashboard.rowCount);
        console.log('populateRows: dashboard.escrowCount = ' + dashboard.escrowCount);
        for (let i = 0; i < 20; ++i) {
            if (dashboard.rowCount >= dashboard.escrowCount)
                break;
	    if (callDepth == 0)
		common.setLoadingIcon('start');
	    ++callCount;
	    ++callDepth;
            addRow(escrowListDiv, function() {
		if (--callDepth <= 0) {
		    common.setLoadingIcon(null);
		}
	    });
        }
    }
}


function selectRow(escrowIdx) {
    if (dashboard.selectedEscrowIdx >= 0) {
	const oldId = 'row-' + dashboard.selectedEscrowIdx;
	common.replaceElemClassFromTo(oldId, 'escrowListItemDivSelected', 'escrowListItemDiv', null);
    }
    dashboard.selectedEscrowIdx = escrowIdx;
    if (escrowIdx >= 0) {
	const id = 'row-' + escrowIdx;
	common.replaceElemClassFromTo(id, 'escrowListItemDiv', 'escrowListItemDivSelected', null);
    }
}



function buildDashboard() {
    console.log('buildDashboard');
    selectRow(-1);
    hideAllModals();
    //TODO: must update w-dai balance
    meEther.escrowCountQuery(common.web3.eth.accounts[0], function(err, escrowCountBN) {
        dashboard.escrowCount = escrowCountBN.toNumber();
        console.log('buildDashboard: dashboard.escrowCount = ' + dashboard.escrowCount);
        populateRows();
    });
    const escrowListDiv = document.getElementById('escrowListDiv');
    escrowListDiv.addEventListener('scroll', function() {
        if (dashboard.rowCount < dashboard.escrowCount)
            populateRows();
    });
}

//
// cb(haveUnread)
// recursive fcn to check for any unread messages in the passed escrow
// hiMsgIdBN is the id of the already-read message with the highest id
// for initial call set step = 0.
//
function checkForUnreadMsgs(hiMsgIdBN, escrowIdBN, escrowInfo, step, cb) {
    console.log('checkForUnreadMsgs: step = ' + step + ', meEther.xactKeys[step] = ' + meEther.xactKeys[step]);
    const msgIdBN = escrowInfo[meEther.xactKeys[step]];
    console.log('msgId = 0x' + msgIdBN.toString(16) + ', highest read = 0x' + hiMsgIdBN.toString(16));
    if (!msgIdBN.gt(hiMsgIdBN)) {
	if (step >= meEther.xactKeys.length - 1)
	    cb(false);
	else
	    checkForUnreadMsgs(hiMsgIdBN, escrowIdBN, escrowInfo, step + 1, cb);
    } else {
	const msgId = common.BNToHex256(msgIdBN);
	mtUtil.getParseDecryptMsg(msgId, function(err, message) {
	    if (message.fromAddr != common.web3.eth.accounts[0]) {
		cb(true);
	    } else {
		// since this msg was sent by user, set it to read, to speed this process up next time round
		common.setIndexedBN(dashboard.hiMsgIdPrefix, escrowIdBN, msgIdBN);
		if (step >= meEther.xactKeys.length - 1)
		    cb(false);
		else
		    checkForUnreadMsgs(hiMsgIdBN, escrowIdBN, escrowInfo, step + 1, cb);
	    }
	});
    }
}

//
// this is the unified handlers for all completed  steps
//
function showCompletedStep(escrowIdBN, escrowInfo, productIdBN, step) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    console.log('step = ' + step);
    const msgBN = escrowInfo[meEther.xactKeys[step]];
    const msgId = common.BNToHex256(msgBN);
    console.log('showCompletedStep: meEther.xactKeys[step] = ' + msgId);
    if (msgBN.isZero()) {
	document.getElementById('noteDialogTitle').textContent = 'No Message';
	document.getElementById('noteDialogIntro').textContent = 'No message was sent with this transaction, however ' + dashboard.noMsgDefaultDesc[step];
	document.getElementById('noteDialogNote').textContent = 'Note: sometimes people don\'t send messages because your message fee is set too high.';
	common.replaceElemClassFromTo('noteDialogTitle', 'hidden', 'visibleB', true);
	common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
	common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
	common.noteOkHandler = null;
	return;
    }
    common.setLoadingIcon('start');
    mtUtil.getParseDecryptMsg(msgId, function(err, message) {
	common.setLoadingIcon(null);
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	const msgName = dashboard.msgNames[step];
	let msgDesc = common.numberToBN(message.ref).isZero() ? dashboard.firstMsgDescs[step] : dashboard.followMsgDescs[step];
	dateIdx = msgDesc.indexOf('DATE');
	if (dateIdx >= 0) {
	    const deliveryDate = parseInt(escrowInfo.deliveryDate);
	    const dateStr = (new Date(deliveryDate * 1000)).toUTCString();
	    msgDesc = msgDesc.replace('DATE', dateStr);
	}
	let newHiMsgId = false;
	const hiMsgIdBN = common.getIndexedBN(dashboard.hiMsgIdPrefix, escrowIdBN);
	if (msgBN.gt(hiMsgIdBN)) {
	    common.setIndexedBN(dashboard.hiMsgIdPrefix, escrowIdBN, msgBN);
	    newHiMsgId = true;
	}
	// if the user sends a reply
	const sendCb = (err, attachmentIdxBN, sendMsgText) => {
	    if (!!err) {
		alert(err);
		dashboard.handleDashboardPage();
		return;
	    }
	    console.log('showCompletedStep: reply -- about to send reply');
	    meUtil.escrowFcnWithMsg(meEther.recordReponse, 'Record-Response', escrowIdBN, message.otherAddr, attachmentIdxBN, msgBN, sendMsgText, function(err) {
		if (!!err)
		    alert(err);
		else {
		    document.getElementById('noteDialogIntro').textContent = dashboard.replyAlerts[step];
		    document.getElementById('noteDialogNote').textContent = escrowStateLine(escrowInfo);
		    common.replaceElemClassFromTo('noteDialogTitle', 'hidden', 'visibleB', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		    common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		    common.noteOkHandler = null;
		}
		remakeRow(escrowIdx);
		dashboard.handleDashboardPage();
	    });
	};
	// when the user closes the displayed msg
	const closeCb = () => {
	    console.log('showCompletedStep: got closeCb. newHiMsgId = ' + newHiMsgId);
	    if (newHiMsgId) {
		remakeRow(escrowIdx);
		dashboard.handleDashboardPage();
	    }
	};
	//clears loading-icon
	mtDisplay.setupDisplayMsgArea(msgName, msgDesc, message, null, closeCb, sendCb);
    });
}


function doApproveDialog(escrowIdBN, escrowInfo) {
    dashboard.selectedEscrowIdBN = escrowIdBN;
    dashboard.selectedEscrowInfo = escrowInfo;
    dashboard.inDialog = true;
    common.replaceElemClassFromTo('approveDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('approveDialogDiv', 'hidden', 'visibleB', null);
    const approveDialogDoButton = document.getElementById('approveDialogDoButton');
    const approveDialogCancelButton = document.getElementById('approveDialogCancelButton');
    const approveDialogArea = document.getElementById('approveDialogArea');
    approveDialogDoButton.disabled = true;
    approveDialogCancelButton.disabled = false;
    approveDialogArea.value = '';
}

function doApprove(secsBN, escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    console.log('doApprove: secsBN = ' + secsBN.toString(10));
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to approve this purchase and commit to a delivery date\n\n' +
	  'Your bond funds (and the buyer\'s bond funds and payment) will be locked into a \'MAD\' escrow account -- and you will only be paid ' +
	  'when the buyer confirms succesful delivery of the product. Use this message to communicate any special delivery instructions to the buyer, such as a ' +
	  'pick-up location or any required code. If none of these are applicable to this purchase, then you can simply use this message to thank the buyer for ' +
	  'his patronage.';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const msgDesc = 'You will lock ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
    const refBN = new BN('0');
    mtDisplay.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, msgDesc, null, refBN, 'Approve Escrow', function(err, attachmentIdxBN, message) {
	console.log('doApprove: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	meUtil.escrowFcnWithParmMsg(meEther.purchaseApprove, 'Purchase-Approve', escrowIdBN, secsBN, escrowInfo.customerAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		  alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just approved an escrow for a product and committed to a delivery-date! It\'s very important that you ' +
		    'deliver the product to the customer within the agreed-upon / expected timeframe.';
		document.getElementById('noteDialogNote').textContent =
		    'Since the escrow is \"locked,\" the buyer can no longer cancel the purchase -- but if you do not deliver the product ' +
		    'in a timely manner he could \'burn\' the escrow, which would cause both of you to lose all of the deposited funds. So ' +
		    'please make every effort to meet the buyer\'s expectations.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogSmall', 'noteDialogLarge', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}

function doModifyDialog(escrowIdBN, escrowInfo) {
    dashboard.selectedEscrowIdBN = escrowIdBN;
    dashboard.selectedEscrowInfo = escrowInfo;
    dashboard.inDialog = true;
    common.replaceElemClassFromTo('addFundsDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
    common.replaceElemClassFromTo('addFundsDialogDiv', 'hidden', 'visibleB', null);
    const addFundsDialogDoButton = document.getElementById('addFundsDialogDoButton');
    const addFundsDialogCancelButton = document.getElementById('addFundsDialogCancelButton');
    const addFundsDialogArea = document.getElementById('addFundsDialogArea');
    addFundsDialogDoButton.disabled = true;
    addFundsDialogCancelButton.disabled = false;
    addFundsDialogArea.value = '';
}

function doModify(addAmountBN, escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to add funds to this the price of this product!\n\n' +
	  'Additional bond funds, equal to 150% of the increase in price will be added to the \'MAD\' escrow account for this purchase.\n\n' +
	  'Use this message to communicate to the seller what extra services you are paying for with these additional funds.';
    const escrowBN = addAmountBN.muln(3).divn(2);
    const msgDesc = 'Increase product price by ' + meEther.daiBNToUsdStr(addAmountBN) + '; add ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into the escrow account';
    //if nz, then we want to refernce any existing modify... they will all be chained together
    const refBN = escrowInfo.modifyXactIdBN;
    mtDisplay.setupComposeMsgArea(escrowInfo.vendorAddr, placeholderText, msgDesc, null, refBN, 'Modify Escrow', function(err, attachmentIdxBN, message) {
	console.log('doModify: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	//since we specify escrow, we can omit productID
	meUtil.purchaseProduct(escrowIdBN, addAmountBN, new BN(0), escrowInfo.vendorAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		  alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just added extra funds to an escrow. This represents a negotiated increase in the product\'s price. The extra ' +
		    'funds that you deposited are equal to 150% of the increase in price. Automatically, the seller\'s bond has also been ' +
		    'increased proportionally (by 50% of the increase in price).';
		document.getElementById('noteDialogNote').textContent =
		    'Since the escrow has not yet been "approved" by the seller, it is not \"locked,\". So you can still cancel, or the seller ' +
		    'could still decline the escrow.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogSmall', 'noteDialogLarge', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    shop.updateDaiAndWDai();
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}


function doCancel(escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to cancel this purchase!\n\n' +
	  'All escrow funds will be returned to the respective parties. Please use this form for to explain to the seller why you are canceling this purchase.';
    const escrowBN = common.numberToBN(escrowInfo.customerBalance);
    const msgDesc = meEther.daiBNToUsdStr(escrowBN) + ' W-Dai will be returned to you from the escrow account';
    const refBN = new BN('0');
    mtDisplay.setupComposeMsgArea(escrowInfo.vendorAddr, placeholderText, msgDesc, null, refBN, 'Cancel this Escrow', function(err, attachmentIdxBN, message) {
	console.log('doCancel: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	meUtil.escrowFcnWithMsg(meEther.purchaseCancel, 'Purchase-Cancel', escrowIdBN, escrowInfo.vendorAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just canceled this escrow';
		document.getElementById('noteDialogNote').textContent =
		    'All funds that were held in the escrow have been returned to the respective parties.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    shop.updateDaiAndWDai();
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}


function doDecline(escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    console.log('doDecline: escrowIdBN = 0x' + escrowIdBN.toString(16));
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to decline this purchase!\n\n' +
	  'All escrow funds will be returned to the respective parties. Please use this form for to explain to the buyer why you are declining this purchase\n\n' +
	  'Note: if you only require more information (eg. shipping information) from the buyer, then you can send him a response to his original deposit ' +
	  'to ask for more information. In addition, if there is extra expense (eg. shipping), you can ask the buyer to add additional funds into the escrow.';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const msgDesc = meEther.daiBNToUsdStr(escrowBN) + ' W-Dai will be returned to you from the escrow account';
    const refBN = new BN('0');
    mtDisplay.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, msgDesc, null, refBN, 'Decline', function(err, attachmentIdxBN, message) {
	console.log('doDecline: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	meUtil.escrowFcnWithMsg(meEther.purchaseCancel, 'Purchase-Decline', escrowIdBN, escrowInfo.customerAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just declined this escrow';
		document.getElementById('noteDialogNote').textContent =
		    'All funds that were held in the escrow have been returned to the respective parties.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    shop.updateDaiAndWDai();
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}


function doReleaseDialog(escrowIdBN, escrowInfo) {
    dashboard.selectedEscrowIdBN = escrowIdBN;
    dashboard.selectedEscrowInfo = escrowInfo;
    dashboard.inDialog = true;
    common.replaceElemClassFromTo('releaseDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('releaseDialogDiv', 'hidden', 'visibleB', null);
    const releaseDialogDoButton = document.getElementById('releaseDialogDoButton');
    const releaseDialogCancelButton = document.getElementById('releaseDialogCancelButton');
    const releaseDialogSelect = document.getElementById('releaseDialogSelect');
    releaseDialogDoButton.disabled = false;
    releaseDialogCancelButton.disabled = false;
}

function doRelease(ratingBN, escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    console.log('doRelease: escrowIdBN = 0x' + escrowIdBN.toString(16));
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to confirm satisfactory delivery of the purchased product -- and release all funds from escrow to the respective parties:\n\n' +
	  'The total purchase price will be released to the seller, together with the seller\'s bond (50% of the purchase price);\n' +
	  'The buyer\'s bond (50% of the purchase price) will be released back to you.\n\n' +
	  'Please use this form to offer any suggestions, criticisms, or compliments to the seller.';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const msgDesc = meEther.daiBNToUsdStr(escrowBN) + ' W-Dai will be returned to you from the escrow account';
    const refBN = new BN('0');
    mtDisplay.setupComposeMsgArea(escrowInfo.vendorAddr, placeholderText, msgDesc, null, refBN, 'Delivery-Approve', function(err, attachmentIdxBN, message) {
	console.log('doRelease: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	meUtil.escrowFcnWithParmMsg(meEther.deliveryApprove, 'Delivery-Approve', escrowIdBN, ratingBN, escrowInfo.vendorAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just released this escrow';
		document.getElementById('noteDialogNote').textContent =
		    'Your bond of ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai has been returned to you. The full price of the product, plus the ' +
		    'seller\'s bond has been released to the seller.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    shop.updateDaiAndWDai();
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}


function doBurnDialog(escrowIdBN, escrowInfo) {
    dashboard.selectedEscrowIdBN = escrowIdBN;
    dashboard.selectedEscrowInfo = escrowInfo;
    dashboard.inDialog = true;
    common.replaceElemClassFromTo('burnDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('burnDialogDiv', 'hidden', 'visibleB', null);
    const burnDialogDoButton = document.getElementById('burnDialogDoButton');
    const burnDialogCancelButton = document.getElementById('burnDialogCancelButton');
    const burnDialogSelect = document.getElementById('burnDialogSelect');
    burnDialogDoButton.disabled = false;
    burnDialogCancelButton.disabled = false;
}

function doBurn(ratingBN, escrowIdBN, escrowInfo) {
    const escrowIdx = dashboard.selectedEscrowIdx;
    console.log('doBurn: escrowIdx = ' + escrowIdx + ', escrowIdBN = 0x' + escrowIdBN.toString(16));
    const placeholderText =
	  '\n' +
	  'Type your message here...\n' +
	  'NOTE: always include the escrow ID in your message...\n\n' +
	  'You are about to burn this escrow!!\n\n' +
	  'You will lose the entire amount that you deposited into the escrow, including the price of the product, and you buyer-bond (50% of the ' +
	  'purchase price). The seller will also not receive any payment for the product, and will lose his bond (also 50% of the purchase price).\n\n' +
	  'This is a drastic measure, but it is appropriate if you believe that the seller is utterly dishonest. At any rate, please use this form to ' +
	  'explain to the seller how they have been less than truthful -- perhaps they can improve...';
    const escrowBN = common.numberToBN(escrowInfo.customerBalance);
    const msgDesc = meEther.daiBNToUsdStr(escrowBN) + ' W-Dai that you deposited will be lost!';
    const refBN = new BN('0');
    mtDisplay.setupComposeMsgArea(escrowInfo.vendorAddr, placeholderText, msgDesc, null, refBN, 'Delivery-Reject', function(err, attachmentIdxBN, message) {
	console.log('doBurn: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	meUtil.escrowFcnWithParmMsg(meEther.deliveryReject, 'Delivery-Approve', escrowIdBN, ratingBN, escrowInfo.vendorAddr, attachmentIdxBN, refBN, message, function(err) {
	    if (!!err)
		alert(err);
	    else {
		document.getElementById('noteDialogIntro').textContent =
		    'You have just burned this escrow';
		document.getElementById('noteDialogNote').textContent =
		    'All the funds you deposited, ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai, is lost. The seller\'s bond is also burned.';
		common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
		common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
		common.noteOkHandler = null;
	    }
	    remakeRow(escrowIdx);
	    dashboard.handleDashboardPage();
	});
    });
}

function doClaimDialog(escrowIdBN, escrowInfo) {
    dashboard.selectedEscrowIdBN = escrowIdBN;
    dashboard.selectedEscrowInfo = escrowInfo;
    dashboard.inDialog = true;
    //
    const nowSec = Date.now() * 1000;
    const deliveryDate = parseInt(escrowInfo.deliveryDate);
    const deliveryDateSec = deliveryDate * 1000;
    const abandonedDateSec = deliveryDateSec + (30 * 24 * 60 * 60);
    const deliveryDateStr = (new Date(deliveryDateSec)).toUTCString();
    const abandonedDateStr = (new Date(deliveryDateSec)).toUTCString();
    if (nowSec < abandonedDateSec) {
	document.getElementById('noteDialogIntro').textContent =
	    'You commited to deliver this product before ' + deliveryDateStr + '. The buyer has until ' + abandonedDateStr + ' to decide either to ' +
	    'release the funds, or to burn the escrow';
	document.getElementById('noteDialogNote').textContent =
	    'If by ' + abandonedDateStr + ' the buyer neither releases the escrow funds, nor burns the escrow, then the escrow will be considered abandoned, ' +
	    'and you can claim all the escrow funds';
	common.replaceElemClassFromTo('noteDialogTitle', 'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('noteDialogDiv', 'noteDialogLarge', 'noteDialogSmall', true);
	common.replaceElemClassFromTo('noteDialogDiv', 'hidden', 'visibleB', true);
	common.noteOkHandler = null;
    }
    //
    /*
    common.replaceElemClassFromTo('burnDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('burnDialogDiv', 'hidden', 'visibleB', null);
    const burnDialogDoButton = document.getElementById('burnDialogDoButton');
    const burnDialogCancelButton = document.getElementById('burnDialogCancelButton');
    const burnDialogSelect = document.getElementById('burnDialogSelect');
    burnDialogDoButton.disabled = false;
    burnDialogCancelButton.disabled = false;
    */
}




function hideAllModals() {
    meUtil.hideProductDetail();
    common.replaceElemClassFromTo('approveDialogDiv', 'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('addFundsDialogDiv', 'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('releaseDialogDiv', 'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('burnDialogDiv', 'visibleB', 'hidden', null);
    common.replaceElemClassFromTo('msgAreaDiv', 'visibleB', 'hidden', false);
    dashboard.inDialog = false;

}

//
// create a line such as:
// 'Funds have been deposited into the escrow, but the escrow hasn't been approved yet'
// suitable for disaply as a note in the noteDialog
//
function escrowStateLine(escrowInfo) {
    if (!escrowInfo.burnXactIdBN.isZero())
	return('This escrow has been "burned". All the funds that were deposited, including the purchase price and the buyer\'s and seller\'s bonds have been forfeit.');
    else if (!escrowInfo.releaseXactIdBN.isZero())
	return('This escrow has been "released". The seller has been credited with the purchase price, and the buyer\'s and seller\'s bonds have been returned.');
    else if (!escrowInfo.approveXactIdBN.isZero())
	return('This escrow has been "approved". The seller will deliver the product. Then it\'s up to the buyer to "release" the escrow (or "burn" it in case of fraud).');
    else if (!escrowInfo.declineXactIdBN.isZero())
	return('This escrow has been "declined" by the seller. All the funds that were deposited have been returned to their respective parties.');
    else if (!escrowInfo.cancelXactIdBN.isZero())
	return('This escrow has been "canceled" by the buyer. All the funds that were deposited have been returned to their respective parties.');
    else if (!escrowInfo.modifyXactIdBN.isZero())
	return('Additional funds have been deposited into this escrow, but it has yet not been approved by the seller. The escrow can still be canceled by the buyer or declined by the seller.');
    else if (!escrowInfo.createXactIdBN.isZero())
	return('Funds have been deposited into this escrow, but it has yet not been approved by the seller. The escrow can still be canceled by the buyer or declined by the seller.');
    else
	return('The initial deposit transaction for this escrow is missing!');
}
