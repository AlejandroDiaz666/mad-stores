/* ------------------------------------------------------------------------------------------------------------------
   dashboard functions
   ------------------------------------------------------------------------------------------------------------------ */
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const meUtil = require('./meUtil');
const mtUtil = require('./mtUtil');
const categories = require('./categories');
const regions = require('./regions');
const BN = require("bn.js");


var dashboard = module.exports = {
    selectedRow: -1,
    escrowCount: 0,
    rowCount: 0,

    handleDashboardPage: function() {
        common.setMenuButtonState('shopButton',          'Enabled');
        common.setMenuButtonState('dashboardButton',     'Selected');
        common.setMenuButtonState('createStoreButton',   'Enabled');
        common.replaceElemClassFromTo('shopPageDiv',           'visibleT', 'hidden',   null);
        common.replaceElemClassFromTo('selctedProductPageDiv', 'visibleB', 'hidden',   null);
        common.replaceElemClassFromTo('dashboardPageDiv',      'hidden',   'visibleB', null);
        common.replaceElemClassFromTo('createStorePageDiv',    'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('msgAreaDiv',            'visibleB', 'hidden',   false);
        buildDashboard();
    },

    setButtonHandlers: function() {
        //
        const shopDoSearchButton = document.getElementById('shopDoSearchButton');
        shopDoSearchButton.addEventListener('click', function() {
            shopDoSearch();
        });
        const shopNextButton = document.getElementById('shopNextButton');
        console.log('setButtonHandlers: shopNextButton = ' + shopNextButton);
        shopNextButton.addEventListener('click', function() {
            shop.displayedProductsStartIdx += shop.productsPerPage;
            const shopTilesDiv = document.getElementById('shopTilesDiv');
            console.log('shopNextButton: displayedProductsStartIdx = ' + shop.displayedProductsStartIdx);
            meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, showProductDetail, shop.displayedProductsStartIdx, shop.productsPerPage,
                                   function(prevEnable, nextEnable) {
                                       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
                                       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
                                   });
        });
        const shopPrevButton = document.getElementById('shopPrevButton');
        shopPrevButton.addEventListener('click', function() {
            shop.displayedProductsStartIdx -= shop.productsPerPage;
            const shopTilesDiv = document.getElementById('shopTilesDiv');
            meUtil.displayProducts(shop.productSearchFilter, shopTilesDiv, showProductDetail, shop.displayedProductsStartIdx, shop.productsPerPage,
                                   function(prevEnable, nextEnable) {
                                       common.setMenuButtonState('shopPrevButton', prevEnable ? 'Enabled' : 'Disabled');
                                       common.setMenuButtonState('shopNextButton', nextEnable ? 'Enabled' : 'Disabled');
                                   });
        });
        //
        const shopCategoryTlcSel = document.getElementById('shopCategoryTlcSel');
        const shopCategoryLlcBitsSel = document.getElementById('shopCategoryLlcBitsSel');
        shopCategoryTlcSel.addEventListener('change', () => {
            const categoryBN = common.numberToBN(shopCategoryTlcSel.value).iushln(248);
            categories.addLlcBitsOptionsElems(shopCategoryTlcSel.value, categoryBN, shopCategoryLlcBitsSel, null);
            //enable search button?
        }, {passive: true} );
        const shopRegionTlrSel = document.getElementById('shopRegionTlrSel');
        const shopRegionLlrBitsSel = document.getElementById('shopRegionLlrBitsSel');
        shopRegionTlrSel.addEventListener('change', () => {
            const categoryBN = common.numberToBN(shopRegionTlrSel.value).iushln(248);
            regions.addLlrBitsOptionsElems(shopRegionTlrSel.value, categoryBN, shopRegionLlrBitsSel, null);
            //enable search button?
        }, {passive: true} );
        //enable search button?
        //shopCategoryLlcBitsSel.addEventListener('input', enableSearchButton);

        const purchaseProductButton = document.getElementById('purchaseProductButton');
        purchaseProductButton.addEventListener('click', function() {
            if (!!shop.selectedProduct)
                handlePurchase(shop.selectedProduct);
        });

    },

    productsPerPage: 8,
    productSearchFilter: null,
    displayedProductsStartIdx: 0,
    selectedProduct: null,
};


function addRow(table) {
    console.log('addRow: enter');
    const idx = dashboard.escrowCount - dashboard.rowCount - 1;
    rowDiv = document.createElement("div");
    rowDiv.className = 'escrowListItemDiv';
    rowDiv.id = 'row-' + idx;
    const escrowNoArea = common.makeTextarea(null, 'escrowListEscrowNoArea', true);
    const typeArea = common.makeTextarea(null, 'escrowListTypeArea', true);
    const productArea = common.makeTextarea(null, 'escrowListTypeArea', true);
    const addrArea = common.makeTextarea(null, 'escrowListAddrArea', true);
    const dateArea = common.makeTextarea(null, 'escrowListDateArea', true);
    const completedSpan = document.createElement("span");
    completedSpan.className = 'escrowListCompletedSpan';
    const nextStepsSpan = document.createElement("span");
    nextStepsSpan.className = 'escrowListnextStepsSpan';
    rowDiv.appendChild(escrowNoArea);
    rowDiv.appendChild(typeArea);
    rowDiv.appendChild(productArea);
    rowDiv.appendChild(addrArea);
    //console.log('addRow: 5.9');
    //rowDdiv.appendChild(dateArea);
    //console.log('addRow: 6');
    rowDiv.appendChild(completedSpan);
    rowDiv.appendChild(nextStepsSpan);
    table.appendChild(rowDiv);
    //
    meEther.escrowQuery(common.web3.eth.accounts[0], idx, function(err, escrowIdBN, escrowInfo) {
        // 'isClosed', 'isApproved', 'partnerAddr', 'vendorAddr', 'customerAddr', 'productId', 'vendorBalance',
        // 'customerBalance', 'createXactId', 'modifyXactId', 'approveCancelXactId', 'releaseBurnXactId' ];
        console.log('addRow: escrowIdBN = ' + escrowIdBN.toString(10));
        escrowNoArea.value = escrowIdBN.toString(10);
	productArea.value = 'loading...';
	meUtil.getProductById(common.numberToBN(escrowInfo.productId), function(err, product) {
	    productArea.value = product.name;
	});
	const addStep = (idx, className, tipText, addTo, handler) => {
	    console.log('addStep: idx = ' + idx + ', className = ' + className);
            const stepSpan = document.createElement("span");
            stepSpan.className = className + ' tooltip';
	    const stepSpanTip = document.createElement("span");
	    stepSpanTip.className = 'tooltipText';
	    stepSpanTip.textContent = tipText;
	    stepSpan.appendChild(stepSpanTip);
	    stepSpan.addEventListener('click', function() {
		selectRowIdx(idx);
		handler(escrowIdBN, escrowInfo, common.numberToBN(escrowInfo.productId));
	    });
            addTo.appendChild(stepSpan);
	};
	addStep(idx, 'escrowListStepDepositSpan', 'funds for this purchase have been deposited into escrow', completedSpan, showDeposit);
        if (escrowInfo.isApproved) {
	    addStep(idx, 'escrowListStepApproveSpan', 'this purchase was approved; escrow is locked', completedSpan, showApprove);
	} else if (escrowInfo.isClosed) {
	    addStep(idx, 'escrowListStepCancelSpan', 'this purchase was canceled or declined; escrow is closed', completedSpan, showCancelOrDecline)
	    nextStepsSpan.textContent = 'Escrow Is Closed';
	}
        if (escrowInfo.vendorAddr == common.web3.eth.accounts[0]) {
            typeArea.value = 'Sale ';
            addrArea.value = escrowInfo.customerAddr;
            if (!escrowInfo.isClosed && !escrowInfo.isApproved) {
		addStep(idx, 'escrowListStepApproveSpan', 'approve this purchase; will lock funds into escrow', nextStepsSpan, doApprove);
		addStep(idx, 'escrowListStepDeclineSpan', 'decline this purchase; funds will be released from escrow', nextStepsSpan, doDecline);
	    }
        }
        if (escrowInfo.customerAddr == common.web3.eth.accounts[0]) {
            typeArea.value += (!!typeArea.value) ? '/ Purchase' : 'Purchase';
            addrArea.value = escrowInfo.vendorAddr;
	    console.log('addRow: escrowInfo.isClosed = ' + escrowInfo.isClosed + ', escrowInfo.isApproved = ' + escrowInfo.isApproved);
            if (!escrowInfo.isClosed && !escrowInfo.isApproved) {
		addStep(idx, 'escrowListStepModifySpan', 'add additional funds into escrow for this purchase', nextStepsSpan, doModifyDialog);
		addStep(idx, 'escrowListStepCancelSpan', 'cancel this purchase; funds will be released from escrow', nextStepsSpan, doCancel);
	    }
        }
    });
    ++dashboard.rowCount;
    console.log('addRow: exit');
}

function populateRows() {
    console.log('populate');
    const escrowListDiv = document.getElementById('escrowListDiv');
    for (let j = 0; j < 100; ++j) {
        console.log('scroll: scrollTop = ' + escrowListDiv.scrollTop + ', scrollHeight = ' + escrowListDiv.scrollHeight + ', clientHeight = ' + escrowListDiv.clientHeight);
        if (escrowListDiv.scrollTop + escrowListDiv.clientHeight < escrowListDiv.scrollHeight - 100)
            break;
        if (dashboard.rowCount >= dashboard.escrowCount)
            break;
        console.log('buildDashboard: dashboard.rowCount = ' + dashboard.rowCount);
        console.log('buildDashboard: dashboard.escrowCount = ' + dashboard.escrowCount);
        for (let i = 0; i < 20; ++i) {
            if (dashboard.rowCount >= dashboard.escrowCount)
                break;
            addRow(escrowListDiv);
        }
    }
}


function buildDashboard() {
    console.log('buildDashboard');
    dashboard.selectedRow = -1;
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


function showDeposit(escrowIdBN, escrowInfo, productIdBN) {
    const msgId = common.numberToHex256(escrowInfo.createXactId);
    console.log('showDeposit: createXactId = ' + msgId);
    mtUtil.getAndParseIdMsg(msgId, function(err, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	console.log('showDeposit: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	const priceDesc = 'this is the initial escrow deposit and product-purchase for this order';
	mtUtil.setupDisplayMsgArea(fromAddr, toAddr, priceDesc, txCount, date, msgId, msgHex, attachmentIdxBN, function(err, attachmentIdxBN, message) {
	    if (!!err) {
		alert(err);
		dashboard.handleDashboardPage();
		return;
	    }
	    console.log('showDeposit: reply -- about to send reply');
	    mtUtil.encryptAndSendMsg('Message-Reply', fromAddr, msgId, attachmentIdxBN, message, function(err) {
		if (!!err)
		    alert(err);
		dashboard.handleDashboardPage();
	    });
	});
    });
}


function showApprove(escrowIdBN, escrowInfo, productIdBN) {
    const msgId = common.numberToHex256(escrowInfo.approveCancelXactId);
    console.log('showApprove: approveCancelXactId = ' + msgId);
    mtUtil.getAndParseIdMsg(msgId, function(err, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	console.log('showApprove: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	const priceDesc = 'the vendor approved this escrow, and committed to deliver this product';
	mtUtil.setupDisplayMsgArea(fromAddr, toAddr, priceDesc, txCount, date, msgId, msgHex, attachmentIdxBN, function(err, attachmentIdxBN, message) {
	    if (!!err) {
		alert(err);
		dashboard.handleDashboardPage();
		return;
	    }
	    console.log('showApprove: reply -- about to send reply');
	    mtUtil.encryptAndSendMsg('Message-Reply', fromAddr, msgId, attachmentIdxBN, message, function(err) {
		if (!!err)
		    alert(err);
		dashboard.handleDashboardPage();
	    });
	});
    });
}


function showCancelOrDecline(escrowIdBN, escrowInfo, productIdBN) {
    const msgId = common.numberToHex256(escrowInfo.approveCancelXactId);
    console.log('showCancelOrDecline: approveCancelXactId = ' + msgId);
    mtUtil.getAndParseIdMsg(msgId, function(err, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	console.log('showCancelOrDecline: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	const priceDesc = (escrowInfo.vendorAddr == fromAddr) ? 'this purchase was declined' : 'this purchase was canceled';
	mtUtil.setupDisplayMsgArea(fromAddr, toAddr, priceDesc, txCount, date, msgId, msgHex, attachmentIdxBN, function(err, attachmentIdxBN, message) {
	console.log('showCancelOrDecline: setupDisplayMsgArea came back');
	    if (!!err) {
		alert(err);
		dashboard.handleDashboardPage();
		return;
	    }
	    console.log('showCancelOrDecline: reply -- about to send reply');
	    mtUtil.encryptAndSendMsg('Message-Reply', fromAddr, msgId, attachmentIdxBN, message, function(err) {
		if (!!err)
		    alert(err);
		dashboard.handleDashboardPage();
	    });
	});
    });
}


function doApprove(escrowIdBN, escrowInfo) {
    const placeholderText =
	  '\n' +
	  'Type your message here...\n\n' +
	  'You are about to approve this purchase!\n\n' +
	  'Your bond funds will be locked into a \'MAD\' escrow account with the buyer -- and you will only be paid when the buyer confirms succesful ' +
	  'delivery of the product. Use this message to communicate to the buyer when he can expect delivery and any other important information ' +
	  'relating to the delivery of the product.\n\n' +
	  'In order to avoid having the buyer \'burn\' the escrow, it is crucial that you manage the buyer\'s expectations...';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const priceDesc = 'You will lock ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
    mtUtil.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, priceDesc, 'Approve Escrow', function(err, attachmentIdxBN, message) {
	console.log('doApprove: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	modifyIdBN = common.numberToBN(escrowInfo.modifyXactId);
	const ref = modifyIdBN.isZero() ? escrowInfo.createXactId : escrowInfo.modifyXactId;
	meUtil.escrowFcnWithMessage(meEther.purchaseApprove, 'Purchase-Approve', escrowIdBN, escrowInfo, attachmentIdxBN, ref, message, function(err) {
	    if (!!err)
		  alert(err);
	    else
		alert('You have just approved an escrow for a product!\n' +
		      'It\'s very important that you deliver the product to the customer within the agreed-upon / expected timeframe. The buyer can no longer ' +
		      'cancel the escrow -- but if you do not deliver the product in a timely manner he could \'burn\' the escrow, which would cause both ' +
		      'of you to lose all of the deposited funds. So please make every effort to meet the buyer\'s expectations...\n\n' +
		      'Also be sure to check Turms Message Transport, periodically, to see if the buyer has sent you any messages.');
	    dashboard.handleDashboardPage();
	});
    });
}

function doModifyDialog(escrowIdBN, escrowInfo) {
    common.replaceElemClassFromTo('addFundsDialogNote', 'hidden', 'visibleIB', null);
    common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
    common.replaceElemClassFromTo('addFundsDialogDiv', 'hidden', 'visibleB', null);
    addFundsDialogDoButton.disabled = true;
    addFundsDialogCancelButton.disabled = false;
    addFundsDialogArea.value = '';
    //
    addFundsDialogArea.addEventListener('input', function() {
	console.log('addFundsDialogArea change event');
	common.replaceElemClassFromTo('addFundsDialogNote', 'hidden', 'visibleIB', null);
	common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
	addFundsDialogDoButton.disabled = false;
    });
    addFundsDialogCancelButton.addEventListener('click', function() {
	common.replaceElemClassFromTo('addFundsDialogDiv', 'visibleB', 'hidden', null);
    });
    //
    addFundsDialogDoButton.addEventListener('click', function() {
	addFundsDialogDoButton.disabled = true;
	addFundsDialogCancelButton.disabled = true;
	const addAmountBN = meEther.usdStrToDaiBN(addFundsDialogArea.value);
	const escrowBN = addAmountBN.muln(3/2);
	meEther.getWDaiBalance(common.web3, common.web3.eth.accounts[0], function(err, wdaiBalanceBN) {
	    if (wdaiBalanceBN.lt(escrowBN)) {
		common.replaceElemClassFromTo('addFundsDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('addFundsDialogErr', 'hidden', 'visibleIB', null);
		addFundsDialogDoButton.disabled = false;
		addFundsDialogCancelButton.disabled = false;
	    } else {
		common.replaceElemClassFromTo('addFundsDialogNote', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('addFundsDialogErr', 'visibleIB', 'hidden', null);
		common.replaceElemClassFromTo('addFundsDialogDiv', 'visibleB', 'hidden', null);
		doModify(addAmountBN, escrowIdBN, escrowInfo);
	    }
	});
    });
}

function doModify(addAmountBN, escrowIdBN, escrowInfo) {
    const placeholderText =
	  '\n' +
	  'Type your message here...\n\n' +
	  'You are about to add funds to this the price of this product!\n\n' +
	  'Additional bond funds, equal to 150% of the increase in price will be added to the \'MAD\' escrow account for this purchase.\n\n' +
	  'Use this message to communicate to the seller what extra services you are paying for with these additional funds.';
    const escrowBN = addAmountBN.muln(3/2);
    const priceDesc = 'Increase product price by ' + meEther.daiBNToUsdStr(addAmountBN) + '; add ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into the escrow account';
    mtUtil.setupComposeMsgArea(escrowInfo.vendorAddr, placeholderText, priceDesc, 'Modify Escrow', function(err, attachmentIdxBN, message) {
	console.log('doModify: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	modifyIdBN = common.numberToBN(escrowInfo.modifyXactId);
	const ref = modifyIdBN.isZero() ? escrowInfo.createXactId : escrowInfo.modifyXactId;
	//since we specify escrow, we can omit productID
	meUtil.purchaseProduct(escrowIdBN, addAmountBN, new BN(0), escrowInfo.vendorAddr, attachmentIdxBN, ref, message, function(err) {
	    if (!!err)
		  alert(err);
	    else
		alert('You have just added extra funds to an escrow!\n' +
		      'Be sure to check Turms Message Transport, periodically, to see if the seller has sent you any messages.');
	    dashboard.handleDashboardPage();
	});
    });
}


function doCancel(escrowIdBN, escrowInfo) {
    const placeholderText =
	  '\n' +
	  'Type your message here...\n\n' +
	  'You are about to cancel this purchase!\n\n' +
	  'All escrow funds will be returned to the respective parties. Please use this form for to explain to the seller why you are canceling this purchase.';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const priceDesc = 'You will lock ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
    mtUtil.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, priceDesc, 'Purchase-Decline', function(err, attachmentIdxBN, message) {
	console.log('doCancel: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	modifyIdBN = common.numberToBN(escrowInfo.modifyXactId);
	const ref = modifyIdBN.isZero() ? escrowInfo.createXactId : escrowInfo.modifyXactId;
	meUtil.escrowFcnWithMessage(meEther.purchaseCancel, 'Purchase-Cancel', escrowIdBN, escrowInfo, attachmentIdxBN, ref, message, function(err) {
	    if (!!err)
		alert(err);
	    else
		alert('You have just canceled this purchase!\n' +
		      'All funds that were held in escrow for the sale of this product have been returned to the respective parties.');
	    dashboard.handleDashboardPage();
	});
    });
}


function doDecline(escrowIdBN, escrowInfo) {
    console.log('doDecline: escrowIdBN = 0x' + escrowIdBN.toString(16));
    const placeholderText =
	  '\n' +
	  'Type your message here...\n\n' +
	  'You are about to decline this purchase!\n\n' +
	  'All escrow funds will be returned to the respective parties. Please use this form for to explain to the buyer why you are declining this purchase\n\n' +
	  'Note: if you only require more information (eg. shipping information) from the buyer, then you can send him a response to his original deposit ' +
	  'to ask for more information. In addition, if there is extra expense (eg. shipping), you can ask the buyer to add additional funds into the escrow.';
    const escrowBN = common.numberToBN(escrowInfo.vendorBalance);
    const priceDesc = 'You will lock ' + meEther.daiBNToUsdStr(escrowBN) + ' W-Dai into an escrow account';
    mtUtil.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, priceDesc, 'Purchase-Decline', function(err, attachmentIdxBN, message) {
	console.log('doDecline: setupComposeMsgArea came back');
	if (!!err) {
	    alert(err);
	    dashboard.handleDashboardPage();
	    return;
	}
	modifyIdBN = common.numberToBN(escrowInfo.modifyXactId);
	const ref = modifyIdBN.isZero() ? escrowInfo.createXactId : escrowInfo.modifyXactId;
	meUtil.escrowFcnWithMessage(meEther.purchaseDecline, 'Purchase-Decline', escrowIdBN, escrowInfo, attachmentIdxBN, ref, message, function(err) {
	    if (!!err)
		alert(err);
	    else
		alert('You have just declined selling a product!\n' +
		      'All funds that were held in escrow for the sale of this product have been returned to the respective parties.');
	    dashboard.handleDashboardPage();
	});
    });
}



function selectRowIdx(idx) {
    if (dashboard.selectedRow >= 0) {
	const oldId = 'row-' + dashboard.selectedRow;
	common.replaceElemClassFromTo(oldId, 'escrowListItemDivSelected', 'escrowListItemDiv', null);
    }
    const id = 'row-' + idx;
    dashboard.selectedRow = idx;
    common.replaceElemClassFromTo(id, 'escrowListItemDiv', 'escrowListItemDivSelected', null);
}
