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
    rowDiv = document.createElement("div");
    rowDiv.className = 'escrowListItemDiv';
    const escrowNoArea = common.makeTextarea(null, 'escrowListEscrowNoArea', true);
    const typeArea = common.makeTextarea(null, 'escrowListTypeArea', true);
    const addrArea = common.makeTextarea(null, 'escrowListAddrArea', true);
    const dateArea = common.makeTextarea(null, 'escrowListDateArea', true);
    const completedSpan = document.createElement("span");
    completedSpan.className = 'escrowListCompletedSpan';
    const nextStepsSpan = document.createElement("span");
    nextStepsSpan.className = 'escrowListnextStepsSpan';
    rowDiv.appendChild(escrowNoArea);
    rowDiv.appendChild(typeArea);
    rowDiv.appendChild(addrArea);
    console.log('addRow: 5.9');
    //rowDdiv.appendChild(dateArea);
    console.log('addRow: 6');
    rowDiv.appendChild(completedSpan);
    rowDiv.appendChild(nextStepsSpan);
    table.appendChild(rowDiv);
    const idx = dashboard.escrowCount - dashboard.rowCount - 1;

    //
    // completed = <funds-deposited>, [ rejected | <approved>, [ delivered | burned ] ]
    //
    // icons: money-paid, thumbs-down, thumbs-up, deliver, burn
    //
    // next-step[deposited] = rejected | approve
    // next-step[approved] = confirm-delivery | burn
    //
    //
    // ================          ===================
    // paid                      approve | refuse
    //
    // paid refused               -- escrow concluded / settled --
    //
    // paid approved             confirm-delivery | burn
    //
    // paid approved burned
    //
    // paid approved fulfilled/completed
    meEther.escrowQuery(common.web3.eth.accounts[0], idx, function(err, escrowIdBN, escrowInfo) {
        // 'isClosed', 'isApproved', 'partnerAddr', 'vendorAddr', 'customerAddr', 'productId', 'vendorBalance',
        // 'customerBalance', 'createXactId', 'modifyXactId', 'approveCancelXactId', 'releaseBurnXactId' ];
        console.log('addRow: we\'re back');
        console.log('addRow: escrowIdBN = ' + escrowIdBN.toString(10));
        escrowNoArea.value = escrowIdBN.toString(10);
        const depositedSpan = document.createElement("span");
        depositedSpan.className = 'escrowListStepDepositSpan';
        if (escrowInfo.vendorAddr == common.web3.eth.accounts[0]) {
            typeArea.value = 'Sale ';
            addrArea.value = escrowInfo.customerAddr;
            if (!escrowInfo.isApproved) {
		const approveSpan = document.createElement("span");
		approveSpan.className = 'escrowListStepSpan escrowListStepApproveSpan';
		nextStepsSpan.appendChild(approveSpan);
		approveSpan.addEventListener('click', function() {
		    doApprove(escrowInfo, common.numberToBN(escrowInfo.productId));
		});
	    }
        }
        if (escrowInfo.customerAddr == common.web3.eth.accounts[0]) {
            typeArea.value += (!!typeArea.value) ? '/ Purchase' : 'Purchase';
            addrArea.value = escrowInfo.vendorAddr;
        }
	/*
        depositedArea = document.createElement("textarea");
        depositedArea.className = 'escrowListStepArea';
        depositedArea.rows = 1;
        depositedArea.readonly = 'readonly';
        depositedArea.disabled = 'disabled';
        depositedArea.textContent = 'deposit';
        completedSpan.appendChild(depositedArea);
	*/
        completedSpan.appendChild(depositedSpan);
        if (escrowInfo.isApproved) {
	    const approveSpan = document.createElement("span");
	    approveSpan.className = 'escrowListStepSpan escrowListStepApproveSpan';
	    completedSpan.appendChild(approveSpan);
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
    meEther.escrowCountQuery(common.web3.eth.accounts[0], function(err, escrowCountBN) {
        dashboard.escrowCount = escrowCountBN.toNumber();
        console.log('buildDashboard: dashboard.escrowCount = ' + dashboard.escrowCount);
        populateRows();
        /*
        for (let i = 0; i < escrowCountBN.toNumber(); ++i) {
            meEther.escrowQuery(common.web3.eth.accounts[0], i, function(err, escrowInfo) {
            });
        }
        */
    });
    const escrowListDiv = document.getElementById('escrowListDiv');
    escrowListDiv.addEventListener('scroll', function() {
        if (dashboard.rowCount < dashboard.escrowCount)
            populateRows();
    });
}


function doApprove(escrowInfo, productIdBN) {
    meUtil.getProductById(productIdBN, function(err, product) {
	if (!!err) {
	    alert(err);
	    return;
	}
	console.log('doApprove: product.name = ' + product.name);
	const placeholderText =
	      'You are about to approve this purchase!\n' +
	      'Your bond funds will be moved into a \'MAD\' escrow account with the buyer -- and you will only be paid when the buyer confirms succesful ' +
	      'delivery of the product. Use this message to communicate to the buyer when he can expect delivery and any other important information ' +
	      'relating to the delivery of the product.\n' +
	      'In order to avoid having the buyer \'burn\' the escrow, it is crucial that you manage the buyer\'s expectations...';
	const priceBN = common.numberToBN(escrowInfo.vendorBalance);
	mtUtil.setupComposeMsgArea(escrowInfo.customerAddr, placeholderText, priceBN, null, function(err) {
	    if (!!err)
		alert(err);
	});
    });
}
