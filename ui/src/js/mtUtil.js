
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
	if (!message)
	    return('');
	if (message.startsWith('Subject: '))
	    message = message.substring(9);
	let newlineIdx = (message.indexOf('\n') > 0) ? message.indexOf('\n') :  message.length;
	if (newlineIdx > maxLen - 1)
	    newlineIdx = maxLen - 1;
	return(message.substring(0, newlineIdx));
    },


    //cb(err, msgIds)
    getSentMsgIds: function(fromAddr, startIdx, count, cb) {
	const msgIds = [];
	const startIdxBn = common.numberToBN(startIdx);
	mtEther.getSentMsgIds(fromAddr, startIdxBn, count, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    msgIds.push(common.numberToHex256(results[i]));
	    }
	    cb(err, msgIds);
	});
    },


    //cb(err, msgIds)
    getRecvMsgIds: function(toAddr, startIdx, count, cb) {
	const msgIds = [];
	const startIdxBn = common.numberToBN(startIdx);
	mtEther.getRecvMsgIds(toAddr, startIdxBn, count, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    msgIds.push(common.numberToHex256(results[i]));
	    }
	    cb(err, msgIds);
	});
    },


    //
    // get and parse a single msg
    // cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
    //
    getAndParseIdMsg: function(msgId, cb) {
	console.log('getAndParseIdMsg: enter msgId = ' + msgId);
	const options = {
	    fromBlock: mtEther.firstBlock,
	    toBlock: 'latest',
	    address: mtEther.EMT_CONTRACT_ADDR,
	    topics: [mtEther.getMessageEventTopic0(), msgId ]
	};
	ether.getLogs(options, function(err, msgResult) {
	    if (!!err || !msgResult || msgResult.length == 0) {
		if (!!err)
		    console.log('getAndParseIdMsg: err = ' + err);
		//either an error, or maybe just no events
		cb(err, '', '', '', '', '', '', null, '', '', '', '');
		return;
	    }
	    mtEther.parseMessageEvent(msgResult[0], cb);
	});
    },


    //
    // gets up to 9 messages specified in msgIds[]
    // msgCb(err, cookie, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
    // doneCb(noMessagesProcessed)
    //
    getAndParseIdMsgs: function(msgIds, msgCookies, msgCb, doneCb) {
	console.log('getAndParseIdMsgs: enter msgIds = ' + msgIds.toString());
	const options = {
	    fromBlock: mtEther.firstBlock,
	    toBlock: 'latest',
	    address: mtEther.EMT_CONTRACT_ADDR,
	    topics: [ mtEther.getMessageEventTopic0(), [] ]
	};
	const topicGroup = options.topics[1];
	for (let i = 0; i < msgIds.length; ++i)
	    topicGroup.push(msgIds[i]);
	console.log('getAndParseIdMsgs: options = ' + JSON.stringify(options));
	ether.getLogs3(options, function(err, msgResults) {
	    console.log('getAndParseIdMsgs: err = ' + err + ', msgResults.length = ' + msgResults.length);
	    if (!!err || !msgResults || msgResults.length == 0) {
		if (!!err)
		    console.log('getAndParseIdMsgs: err = ' + err);
		//either an error, or maybe just no events
		for (let i = 0; i < msgIds.length; ++i)
		    msgCb(err, msgCookies[msgIds[i]], msgIds[i], '', '', '', '', '', null, '', '', '', '');
		doneCb(msgIds.length);
		return;
	    }
	    let msgCbCount = 0;
	    let bogusCount = 0;
	    for (let i = 0; i < msgResults.length; ++i) {
		mtEther.parseMessageEvent(msgResults[i], function(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
		    if (!!msgCookies[msgId]) {
			console.log('getAndParseIdMsgs: msgId = ' + msgId + ', fromAddr = ' + fromAddr + ', toAddr = ' + toAddr);
			msgCb(err, msgCookies[msgId], msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
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
    // cb(err, messageText, attachment)
    // decrypt message and extract attachment
    //  attachment: { name: 'name', blob: 'saveable-blob' };
    //
    decryptMsg: function(otherAddr, fromAddr, toAddr, nonce, msgHex, attachmentIdxBN, cb) {
	console.log('decryptMsg: otherAddr = ' + otherAddr);
	mtEther.accountQuery(otherAddr, function(err, otherAcctInfo) {
	    const otherPublicKey = (!!otherAcctInfo) ? otherAcctInfo.publicKey : null;
	    if (!!otherPublicKey && otherPublicKey != '0x') {
		const ptk = dhcrypt.ptk(otherPublicKey, toAddr, fromAddr, nonce);
		const decrypted = dhcrypt.decrypt(ptk, msgHex);
		console.log('decryptMsg: decrypted (length = ' + decrypted.length + ') = ' + decrypted.substring(0, 30));
		let messageText = decrypted;
		let attachment = null;
		if (!!attachmentIdxBN && !attachmentIdxBN.isZero()) {
		    console.log('decryptMsg: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
		    const idx = attachmentIdxBN.maskn(248).toNumber();
		    console.log('decryptMsg: attachment at idx ' + idx);
		    messageText = decrypted.substring(0, idx);
		    const nameLen = attachmentIdxBN.iushrn(248).toNumber();
		    attachment = { name: decrypted.substring(idx, idx + nameLen), blob: decrypted.substring(idx + nameLen) };
		}
		cb(null, messageText, attachment);
	    } else {
		console.log('decryptMsg: error looking up account for ' + otherAddr + ', otherPublicKey = ' + otherPublicKey);
		cb('Error looking up account for ' + otherAddr, '', null);
	    }
	});
    },


    // cb(err, msgFee, encrypted, msgNoBN)
    encryptMsg: function(toAddr, message, cb) {
	console.log('encryptMsg');
	mtEther.accountQuery(toAddr, function(err, toAcctInfo) {
	    //encrypt the message...
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    //console.log('encryptMsg: toPublicKey = ' + toPublicKey);
	    if (!toPublicKey || toPublicKey == '0x') {
		cb('Encryption error: unable to look up destination address in contract!', null, null);
		return;
	    }
	    //console.log('encryptMsg: mtUtil.acctInfo.sentMsgCount = ' + mtUtil.acctInfo.sentMsgCount);
	    const sentMsgCtrBN = common.numberToBN(mtUtil.acctInfo.sentMsgCount);
	    sentMsgCtrBN.iaddn(1);
	    //console.log('encryptMsg: toPublicKey = ' + toPublicKey);
	    const ptk = dhcrypt.ptk(toPublicKey, toAddr, common.web3.eth.accounts[0], '0x' + sentMsgCtrBN.toString(16));
	    //console.log('encryptMsg: ptk = ' + ptk);
	    const encrypted = (message.length == 0) ? '' : dhcrypt.encrypt(ptk, message);
	    console.log('encryptMsg: encrypted (length = ' + encrypted.length + ') = ' + encrypted);
	    //in order to figure the message fee we need to see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(toAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('encryptMsg: ' + msgCount.toString(10) + ' messages have been sent from ' + toAddr + ' to me');
		//must correct fee in MadStores contract
		const msgFee = /*(encrypted.length == 0) ? 0 :*/ (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		cb(null, msgFee, encrypted, sentMsgCtrBN);
	    });
	});
    },


    // cb(err)
    // cb is called after user clicks continue
    encryptAndSendMsg: function(msgDesc, toAddr, ref, attachmentIdxBN, message, cb) {
	console.log('encryptAndSendMsg');
	mtUtil.encryptMsg(toAddr, message, function(err, msgFee, encrypted, msgNoBN) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    console.log('encryptAndSendMsg: msgFee is ' + msgFee + ' wei');
	    common.showWaitingForMetaMask(true);
	    const continueFcn = (err, receipt) => {
		if (!err)
		    mtUtil.acctInfo.sentMsgCount = msgNoBN.toString(10);
		common.waitingForTxid = false;
		common.clearStatusDiv(statusDiv);
		cb(err);
	    };
	    mtEther.sendMessage(toAddr, attachmentIdxBN, ref, encrypted, msgFee, function(err, txid) {
		console.log('encryptAndSendMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, msgDesc, continueFcn, ether.etherscanioTxStatusHost, null);
	    });
	});
    },



    /* ------------------------------------------------------------------------------------------------------------------
       display-related functions assume appropriate css
       ------------------------------------------------------------------------------------------------------------------ */
    //
    // needs to be called once, on document load
    //
    setMsgCloseHandler: function() {
	const msgCloseImg = document.getElementById('msgCloseImg');
	msgCloseImg.addEventListener('click', function() {
	    common.replaceElemClassFromTo('msgAreaDiv', 'visibleB', 'hidden', true);
	});
    },
    setAttachButtonHandler: function() {
	const attachmentButton = document.getElementById('attachmentButton');
	const attachmentInput = document.getElementById('attachmentInput');
	const attachmentSaveA = document.getElementById('attachmentSaveA');
	const deleteImg = document.getElementById('deleteImg');
	deleteImg.addEventListener('click', function() {
	    attachmentSaveA.href = '';
	    attachmentSaveA.download = '';
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
	    if (!!mtUtil.sendCB) {
		const msgAddrArea = document.getElementById('msgAddrArea');
		const msgTextArea = document.getElementById('msgTextArea');
		let message = msgTextArea.value;
		sendButton.disabled = true;
		msgTextArea.disabled = true;
		//
		let attachmentIdxBN;
		const attachmentSaveA = document.getElementById('attachmentSaveA');
		const attachmentInput = document.getElementById('attachmentInput');
		if (!attachmentSaveA.href || !attachmentSaveA.download) {
		    attachmentIdxBN = new BN(0);
		} else {
		    const nameLenBN = new BN(attachmentSaveA.download.length);
		    attachmentIdxBN = new BN(message.length).iuor(nameLenBN.ushln(248));
		    message += attachmentSaveA.download + attachmentSaveA.href;
		    console.log('sendButton: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16) + ', attachmentSaveA.download = ' + attachmentSaveA.download);
		    console.log('sendButton: message = ' + message);
		}
		console.log('setSendButtonHandler: calling mtUtil.sendCB');
		mtUtil.sendCB(null, attachmentIdxBN, message);
	    }
	});
    },


    // cb(err, attachmentIdxBN, message);
    //
    // set up the compose area. before calling the cb any attachment is appended to the message (via the
    // attachButton and sendButton click handlers). the message is not encrypted.
    //
    setupComposeMsgArea: function(destAddr, placeholderText, priceDesc, sendButtonText, cb) {
	console.log('setupComposeMsgArea: enter');
	if (!ether.validateAddr(destAddr)) {
	    cb('Error: vendor has an invalid Ethereum address.', null, null);
	    return;
	}
	const attachmentButton = common.replaceElemClassFromTo('attachmentButton',   'hidden',    'visibleIB', false);
	const msgFeeArea       = common.replaceElemClassFromTo('msgFeeArea',         'hidden',    'visibleIB', true);
	const msgDateArea      = common.replaceElemClassFromTo('msgDateArea',        'visibleIB', 'hidden',    true);
	const msgPriceArea     = common.replaceElemClassFromTo('msgPriceArea',       'hidden',    'visibleTC', true);
                                 common.replaceElemClassFromTo('msgPricePromptArea', 'hidden',    'visibleTC', true);
	const attachmentInput  = common.replaceElemClassFromTo('attachmentInput',    'visibleIB', 'hidden',    true);
	const msgTextArea      = common.replaceElemClassFromTo('msgTextArea',        'hidden',    'visibleIB', false);
	const msgAreaDiv       = common.replaceElemClassFromTo('msgAreaDiv',         'hidden',    'visibleB',  false);
	common.replaceElemClassFromTo('msgIdArea',    'hidden',    'visibleB',  false);
	common.replaceElemClassFromTo('msgRefButton', 'hidden',    'visibleB',  false);
	const sendButton = document.getElementById('sendButton');
	sendButton.textContent = sendButtonText;
	msgPriceArea.value = priceDesc;
	sendButton.disabled = true;
	mtUtil.sendCB = null
	//
	mtEther.accountQuery(destAddr, function(err, toAcctInfo) {
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
	    const attachmentSaveA = document.getElementById('attachmentSaveA');
	    attachmentSaveA.style.display = 'none';
	    msgTextArea.value = '';
	    msgTextArea.readonly = '';
	    msgTextArea.placeholder = placeholderText;
	    //fees: see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(destAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('setupMsgArea: ' + msgCount.toString(10) + ' messages have been sent from ' + destAddr + ' to me');
		const fee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		msgFeeArea.value = 'Fee: ' + ether.convertWeiBNToComfort(common.numberToBN(fee));
		sendButton.disabled = false;
		mtUtil.sendCB = cb;
	    });
	});
    },


    // cb(err, attachmentIdxBN, message)
    //
    // set up the message-display area. if the user clicks the reply button, then the reply is constructed (via the replyToMsg fcn);
    // in that case before calling the cb any attachment is appended to the message (via the attachButton and sendButton click
    // handlers). the reply message is not encrypted.
    // clears the loading-icon when the msg is displayed
    //
    setupDisplayMsgArea: function(fromAddr, toAddr, priceDesc, txCount, date, msgId, ref, msgHex, attachmentIdxBN, cb) {
	console.log('setupDisplayMsgArea: enter');
	const attachmentButton = common.replaceElemClassFromTo('attachmentButton',   'visibleIB', 'hidden',    true);
	const msgFeeArea       = common.replaceElemClassFromTo('msgFeeArea',         'visibleIB', 'hidden',    true);
	const msgDateArea      = common.replaceElemClassFromTo('msgDateArea',        'hidden',    'visibleIB', true);
	const msgPriceArea     = common.replaceElemClassFromTo('msgPriceArea',       'hidden',    'visibleTC', true);
                                 common.replaceElemClassFromTo('msgPricePromptArea', 'hidden',    'visibleTC', true);
	const msgTextArea      = common.replaceElemClassFromTo('msgTextArea',        'hidden',    'visibleIB', true);
	const msgAreaDiv       = common.replaceElemClassFromTo('msgAreaDiv',         'hidden',    'visibleB',  false);
	showIdAndRef(msgId, ref, true);
	const sendButton = document.getElementById('sendButton');
	const otherAddr = (fromAddr == common.web3.eth.accounts[0]) ? toAddr : fromAddr;
	sendButton.textContent = (fromAddr == common.web3.eth.accounts[0]) ? 'Send again' : 'Reply';
	sendButton.disabled = true;
	mtUtil.sendCB = null;
	const msgPromptArea = document.getElementById('msgPromptArea');
	msgPromptArea.value = (fromAddr == common.web3.eth.accounts[0]) ? 'To: ' : 'From: ';
	const msgAddrArea = document.getElementById('msgAddrArea');
	msgAddrArea.disabled = true;
	msgAddrArea.readonly = 'readonly';
	msgAddrArea.value = otherAddr;
	msgPriceArea.value = priceDesc;
	msgDateArea.value = date;
	//
	mtUtil.decryptMsg(otherAddr, fromAddr, toAddr, txCount, msgHex, attachmentIdxBN, (err, text, attachment) => {
	    //msgDateArea.value = date;
	    //msgNoNotButton.textContent = parseInt(msgNo).toString(10);
	    console.log('setupDisplayMsgArea: text = ' + text);
	    msgTextArea.value = text;
	    msgTextArea.readonly = 'true';
	    const attachmentSaveA = document.getElementById('attachmentSaveA');
	    if (!!attachment) {
		attachmentSaveA.href = attachment.blob;
		attachmentSaveA.download = attachment.name;
		const attachmentSaveSpan = document.getElementById('attachmentSaveSpan');
		attachmentSaveSpan.textContent = attachment.name;
		attachmentSaveA.style.display = 'inline-block';
	    } else {
		attachmentSaveA.style.display = 'none';
	    }
	    sendButton.disabled = false;
	    common.setLoadingIcon(null);
	    mtUtil.sendCB = () => { replyToMsg(fromAddr, msgId, cb); };
	});
    },
}


// cb(err, attachmentIdxBN, message)
// before calling the cb any attachment is appended to the message (via the attachButton and sendButton click handlers).
// the reply message is not encrypted.
//
function replyToMsg(destAddr, refId, cb) {
    if (!ether.validateAddr(destAddr)) {
	cb('Error: vendor has an invalid Ethereum address.', null, null);
	return;
    }
    console.log('setupComposeMsgArea: enter');
    const attachmentButton = common.replaceElemClassFromTo('attachmentButton',   'hidden',    'visibleIB', false);
    const msgFeeArea       = common.replaceElemClassFromTo('msgFeeArea',         'hidden',    'visibleIB', true);
    const msgDateArea      = common.replaceElemClassFromTo('msgDateArea',        'visibleIB', 'hidden',    true);
    const msgPriceArea     = common.replaceElemClassFromTo('msgPriceArea',       'visibleTC', 'hidden',    true);
                             common.replaceElemClassFromTo('msgPricePromptArea', 'visibleTC', 'hidden',    true);
    const attachmentInput  = common.replaceElemClassFromTo('attachmentInput',    'visibleIB', 'hidden',    true);
    const msgTextArea      = common.replaceElemClassFromTo('msgTextArea',        'hidden',    'visibleIB', false);
    const msgAreaDiv       = common.replaceElemClassFromTo('msgAreaDiv',         'hidden',    'visibleB',  false);
    const sendButton = document.getElementById('sendButton');
    sendButton.textContent = 'Send';
    sendButton.disabled = true;
    mtUtil.sendCB = null;
    //
    mtEther.accountQuery(destAddr, function(err, toAcctInfo) {
	const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	if (!toPublicKey || toPublicKey == '0x') {
	    cb('Error: no Message-Transport account was found for destination address.', null, null);
	    return;
	}
	const msgPromptArea = document.getElementById('msgPromptArea');
	msgPromptArea.value = 'To: ';
	const msgAddrArea = document.getElementById('msgAddrArea');
	msgAddrArea.disabled = true;
	msgAddrArea.readonly = 'readonly';
	msgAddrArea.value = destAddr;
	const attachmentSaveA = document.getElementById('attachmentSaveA');
	attachmentSaveA.style.display = 'none';
	msgTextArea.value = '';
	msgTextArea.readonly = '';
	msgTextArea.placeholder = 'Type your reply here';
	//fees: see how many messages have been sent from the proposed recipient to me
	mtEther.getPeerMessageCount(destAddr, common.web3.eth.accounts[0], function(err, msgCount) {
	    console.log('replyToMsg: setupMsgArea: ' + msgCount.toString(10) + ' messages have been sent from ' + destAddr + ' to me');
	    const fee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
	    msgFeeArea.value = 'Fee: ' + ether.convertWeiBNToComfort(common.numberToBN(fee));
	    sendButton.disabled = false;
	    mtUtil.sendCB = cb;
	});
    });
}


//if enable is set, then the msgRefButton is enabled, but only if ref is nz
function showIdAndRef(msgId, ref, enable) {
    if (!!msgId) {
	const msgIdArea = document.getElementById('msgIdArea');
	msgIdArea.value = 'Msg ID: ' + mtUtil.abbreviateMsgId(msgId);
	msgIdArea.msgId = msgId;
    }
    const msgRefButton = document.getElementById('msgRefButton');
    const refShortBN = common.numberToBN(ref);
    if (refShortBN.isZero()) {
	msgRefButton.textContent = 'Ref: none';
	msgRefButton.ref = '';
	msgRefButton.disabled = true;
    } else {
	msgRefButton.textContent = 'Ref: ' + mtUtil.abbreviateMsgId(ref);
	msgRefButton.ref = ref;
	msgRefButton.disabled = (enable) ? false : true;
    }
}
