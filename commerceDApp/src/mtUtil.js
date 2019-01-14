
//
// high level fcns related to interaction w/ EMT contract
//
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const dhcrypt = require('./dhcrypt');
const BN = require("bn.js");

const mtUtil = module.exports = {
    acctInfo: null,
    publicKey: null,
    sendCB: null,

    // create a shorter base64 message id from a long hex msgId
    // note: every 3 bytes produces 4 base64 chars; so use a multiple of 3 bytes to avoid padding chars, '=='
    abbreviateMsgId: function(msgId) {
	const idShortHex = common.leftPadTo(common.numberToBN(msgId).toString(16), 36, '0');
	return(common.hexToBase64(idShortHex));
    },


    extractSubject: function(message, maxLen) {
	if (message.startsWith('Subject: '))
	    message = message.substring(9);
	let newlineIdx = (message.indexOf('\n') > 0) ? message.indexOf('\n') :  message.length;
	if (newlineIdx > maxLen - 1)
	    newlineIdx = maxLen - 1;
	return(message.substring(0, newlineIdx));
    },


    //cb(err, msgIds)
    getSentMsgIds: function(fromAddr, batch, cb) {
	const msgIds = [];
	const startIdxBn = new BN(batch).imuln(10);
	mtEther.getSentMsgIds(common.web3, fromAddr, startIdxBn, 10, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    msgIds.push(common.numberToHex256(results[i]));
	    }
	    cb(err, msgIds);
	});
    },


    //cb(err, msgIds)
    getRecvMsgIds: function(toAddr, batch, cb) {
	const msgIds = [];
	const startIdxBn = new BN(batch).imuln(10);
	mtEther.getRecvMsgIds(common.web3, toAddr, startIdxBn, 10, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    msgIds.push(common.numberToHex256(results[i]));
	    }
	    cb(err, msgIds);
	});
    },


    //
    // get and parse a single msg
    // cb(err, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
    //
    getAndParseIdMsg: function(msgId, cb) {
	console.log('getAndParseIdMsg: enter msgId = ' + msgId);
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: mtEther.EMT_CONTRACT_ADDR,
	    topics: [mtEther.getMessageEventTopic0(), msgId ]
	};
	ether.getLogs(options, function(err, msgResult) {
	    if (!!err || !msgResult || msgResult.length == 0) {
		if (!!err)
		    console.log('getAndParseIdMsg: err = ' + err);
		//either an error, or maybe just no events
		cb(err, '', '', '', '', '', null, '', '', '', '');
		return;
	    }
	    mtEther.parseMessageEvent(msgResult[0], cb);
	});
    },


    //
    // gets up to 3 messages specified in msgIds[]
    // msgCb(err, cookie, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
    // doneCb(noMessagesProcessed)
    //
    getAndParseIdMsgs: function(msgIds, msgCookies, msgCb, doneCb) {
	console.log('getAndParseIdMsgs: enter msgIds = ' + msgIds);
	const options = {
	    fromBlock: 0,
	    toBlock: 'latest',
	    address: mtEther.EMT_CONTRACT_ADDR,
	    topics: [ mtEther.getMessageEventTopic0() ]
	};
	if (msgIds.length > 0) {
	    if (!!msgIds[0])
		options.topics.push(msgIds[0]);
	    if (options.topics.length > 1) {
		if (!!msgIds[1])
		    options.topics.push(msgIds[1]);
		if (options.topics.length > 2) {
		    if (!!msgIds[2])
			options.topics.push(msgIds[2]);
		}
	    }
	}
	console.log('getAndParseIdMsgs: options = ' + JSON.stringify(options));
	ether.getLogs3(options, function(err, msgResults) {
	    console.log('getAndParseIdMsgs: err = ' + err + ', msgResults.length = ' + msgResults.length);
	    if (!!err || !msgResults || msgResults.length == 0) {
		if (!!err)
		    console.log('getAndParseIdMsgs: err = ' + err);
		//either an error, or maybe just no events
		for (let i = 0; i < msgIds.length; ++i)
		    msgCb(err, msgCookies[msgIds[i]], msgIds[i], '', '', '', '', null, '', '', '', '');
		doneCb(msgIds.length);
		return;
	    }
	    let msgCbCount = 0;
	    let bogusCount = 0;
	    for (let i = 0; i < msgResults.length; ++i) {
		mtEther.parseMessageEvent(msgResults[i], function(err, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
		    if (!!msgCookies[msgId]) {
			console.log('getAndParseIdMsgs: msgId = ' + msgId + ', fromAddr = ' + fromAddr + ', toAddr = ' + toAddr + ', idx = ' + msgCookies[msgId].idx);
			msgCb(err, msgCookies[msgId], msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
			++msgCbCount;
		    } else {
			console.log('getAndParseIdMsgs: got an unexpected msg, msgId = ' + msgId + ', fromAddr = ' + fromAddr + ', toAddr = ' + toAddr);
			++bogusCount;
		    }
		    if (msgCbCount + bogusCount >= msgResults.length)
			doneCb(msgCbCount);
		});
	    }
	});
    },



    //
    //cb(err, decrypted)
    //decrypt and display the message in the msgTextArea. also displays the msgId, ref, date & msgNo
    //msgNo is either txCount or rxCount depending on whether the message was sent or received
    //
    decryptMsg: function(otherAddr, fromAddr, toAddr, nonce, msgHex, cb) {
	console.log('decryptMsg: otherAddr = ' + otherAddr);
	mtEther.accountQuery(common.web3, otherAddr, function(err, otherAcctInfo) {
	    const otherPublicKey = (!!otherAcctInfo) ? otherAcctInfo.publicKey : null;
	    if (!!otherPublicKey && otherPublicKey != '0x') {
		console.log('decryptMsg: otherPublicKey = ' + otherPublicKey);
		const ptk = dhcrypt.ptk(otherPublicKey, toAddr, fromAddr, nonce);
		console.log('decryptMsg: ptk = ' + ptk);
		const decrypted = dhcrypt.decrypt(ptk, msgHex);
		console.log('decryptMsg: decrypted (length = ' + decrypted.length + ') = ' + decrypted);
		cb(null, decrypted);
	    } else {
		console.log('decryptMsg: error looking up account for ' + otherAddr + ', otherPublicKey = ' + otherPublicKey);
		cb('Error looking up account for ' + otherAddr, '');
	    }
	});
    },


    /* ------------------------------------------------------------------------------------------------------------------
       display-related functions assume appropriate css
       ------------------------------------------------------------------------------------------------------------------ */

    //
    // needs to be called once, on document load
    //
    setAttachButtonHandler: function() {
	const attachmentButton = document.getElementById('attachmentButton');
	const attachmentInput = document.getElementById('attachmentInput');
	const attachmentSaveA = document.getElementById('attachmentSaveA');
	const deleteImg = document.getElementById('deleteImg');
	deleteImg.addEventListener('click', function() {
	    attachmentSaveA.href = null;
	    attachmentSaveA.download = null;
	    attachmentInput.value = attachmentInput.files = null;
	    attachmentSaveA.style.display = 'none';
	    common.replaceElemClassFromTo('attachmentInput', 'visibleIB', 'hidden', true);
	    common.replaceElemClassFromTo('attachmentButton', 'hidden', 'visibleIB', false);
	    deleteImg.style.display = 'none';
	});
	attachmentButton.addEventListener('click', function() {
	    attachmentInput.value = attachmentInput.files = null;
	    common.replaceElemClassFromTo('attachmentButton', 'visibleIB', 'hidden', true);
	    common.replaceElemClassFromTo('attachmentInput', 'hidden', 'visibleIB', false);
	});
	attachmentInput.addEventListener('change', function() {
	    console.log('attachmentInput: got change event');
	    if (attachmentInput.files && attachmentInput.files[0]) {
		console.log('attachmentInput: got ' + attachmentInput.files[0].name);
		const reader = new FileReader();
		reader.onload = (e) => {
		    //eg. e.target.result = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...
		    console.log('attachmentInput: e.target.result = ' + e.target.result);
		    //
		    attachmentSaveA.href = e.target.result;
		    attachmentSaveA.download = attachmentInput.files[0].name;
		    const attachmentSaveSpan = document.getElementById('attachmentSaveSpan');
		    attachmentSaveSpan.textContent = attachmentInput.files[0].name;
		    attachmentSaveA.style.display = 'inline-block';
		    deleteImg.style.display = 'inline-block';
		    common.replaceElemClassFromTo('attachmentInput', 'visibleIB', 'hidden', true);
		};
		reader.readAsDataURL(attachmentInput.files[0]);
            } else {
		attachmentSaveA.href = null;
	    }
	});
    },


    //
    // needs to be called once, on document load
    // the handler herein only performs the preliminary send preparation; it will call the mtUtil.sendCB to
    // perform the actual send
    //
    setSendButtonHandler: function() {
	console.log('setSendButtonHandler');
	const sendButton = document.getElementById('sendButton');
	sendButton.addEventListener('click', function() {
	    console.log('sendButton: click');
	    const msgAddrArea = document.getElementById('msgAddrArea');
	    const msgTextArea = document.getElementById('msgTextArea');
	    let message = msgTextArea.value;
	    sendButton.disabled = true;
	    msgTextArea.disabled = true;
	    //
	    let attachmentIdxBN;
	    const attachmentSaveA = document.getElementById('attachmentSaveA');
	    if (!attachmentSaveA.href || !attachmentSaveA.download) {
		attachmentIdxBN = new BN(0);
	    } else {
		const nameLenBN = new BN(attachmentSaveA.download.length);
		attachmentIdxBN = new BN(message.length).iuor(nameLenBN.ushln(248));
		message += attachmentSaveA.download + attachmentSaveA.href;
		console.log('sendButton: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
		console.log('sendButton: message = ' + message);
	    }
	    console.log('setSendButtonHandler: calling mtUtil.sendCB');
	    mtUtil.sendCB(attachmentIdxBN, message);
	});
    },


    // cb(err)
    // sendCB(attachmentIdxBN, message);
    // if priceBN is null, then price area is not displayed
    //
    setupComposeMsgArea: function(destAddr, placeholderText, priceBN, sendCB, cb) {
	console.log('setupComposeMsgArea: enter');
	mtUtil.sendCB = sendCB;
	if (!ether.validateAddr(destAddr)) {
	    cb('Error: vendor has an invalid Ethereum address.');
	    return;
	}
	//
	mtEther.accountQuery(common.web3, destAddr, function(err, toAcctInfo) {
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    if (!toPublicKey || toPublicKey == '0x') {
		cb('Error: no Message-Transport account was found for destination address.');
		return;
	    }
	    const msgPromptArea = document.getElementById('msgPromptArea');
	    msgPromptArea.value = 'To: ';
	    const msgAddrArea = document.getElementById('msgAddrArea');
	    msgAddrArea.disabled = true;
	    msgAddrArea.readonly = 'readonly';
	    msgAddrArea.value = destAddr;
	    //
	    common.replaceElemClassFromTo('msgAreaDiv',         'hidden',    'visibleB',  false);
	    //attach button can be enabled, since addr is already validated
	    common.replaceElemClassFromTo('attachmentButton',   'hidden',    'visibleIB', false);
	    common.replaceElemClassFromTo('attachmentInput',    'visibleIB', 'hidden', true);
	    const attachmentSaveA = document.getElementById('attachmentSaveA');
	    attachmentSaveA.style.display = 'none';
	    //
	    const msgTextArea = document.getElementById('msgTextArea');
	    msgTextArea.className = (msgTextArea.className).replace('hidden', 'visibleIB');
	    msgTextArea.value = '';
	    msgTextArea.disabled = false;
	    msgTextArea.readonly = '';
	    msgTextArea.placeholder = placeholderText;
	    if (!!priceBN) {
		console.log('setupMsgArea: priceBN = ' + priceBN.toString(10) + ' dai');
		const msgPriceArea = document.getElementById('msgPriceArea');
		msgPriceArea.value = 'Price: ' + meEther.daiBNToUsdStr(priceBN) + ' Dai';
	    }
	    //fees: see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(common.web3, destAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('setupMsgArea: ' + msgCount.toString(10) + ' messages have been sent from ' + destAddr + ' to me');
		const fee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		const msgFeeArea = document.getElementById('msgFeeArea');
		msgFeeArea.value = 'Fee: ' + ether.convertWeiToComfort(common.web3, fee);
		cb(null);
	    });
	});
    },

}
