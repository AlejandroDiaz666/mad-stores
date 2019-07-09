//
// display fcns related to message transport
//
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const meEther = require('./meEther');
const mtUtil = require('./mtUtil');
const dhcrypt = require('./dhcrypt');
const BN = require("bn.js");

const mtDisplay = module.exports = {
    //sendCb(null, attachmentIdxBN, message);
    sendCb: null,
    //closeCb()
    closeCb: null,
    //refCb(refId)
    refCb: null,
    //fee iff message is not empty
    composeFee: 0,
    COMPOSE_MODE: true,
    DISPLAY_MODE: false,
    //
    // needs to be called once, on document load
    //
    setButtonHandlers: function() {
	setMsgCloseHandler();
	setRefHandler();
	setAttachButtonHandler();
	setSendButtonHandler();
	setTextAreaHandler();
    },


    // sendCb(err, attachmentIdxBN, message);
    //
    // set up the compose area. before calling the cb any attachment is appended to the message (via the
    // attachButton and sendButton click handlers). the message is not encrypted.
    //
    setupComposeMsgArea: function(destAddr, placeholderText, defaultText, msgDesc, ref, sendButtonText, sendCb) {
	console.log('setupComposeMsgArea: enter');
	if (!ether.validateAddr(destAddr)) {
	    sendCb('Error: vendor has an invalid Ethereum address.', null, null);
	    return;
	}
	setMsgArea(mtDisplay.COMPOSE_MODE, 'To: ', destAddr, null, ref, msgDesc, null, sendButtonText);
	mtDisplay.sendCb = null
	mtEther.accountQuery(destAddr, function(err, toAcctInfo) {
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    if (!toPublicKey || toPublicKey == '0x') {
		cb('Error: no Message-Transport account was found for destination address.');
		return;
	    }
	    document.getElementById('attachmentSaveA').style.display = 'none';
	    const msgTextArea = document.getElementById('msgTextArea');
	    msgTextArea.readonly = '';
	    msgTextArea.disabled = false;
	    msgTextArea.value = defaultText;
	    msgTextArea.placeholder = placeholderText;
	    //fees: see how many messages have been sent from the proposed recipient to me
	    mtEther.getPeerMessageCount(destAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		console.log('setupMsgArea: ' + msgCount.toString(10) + ' messages have been sent from ' + destAddr + ' to me');
		mtDisplay.composeFee = (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		if (msgTextArea.value == '')
		    document.getElementById('msgFeeArea').value = 'Fee: 0 Wei';
		else
		    document.getElementById('msgFeeArea').value = 'Fee: ' + ether.convertWeiBNToComfort(common.numberToBN(mtDisplay.composeFee));
		document.getElementById('sendButton').disabled = false;
		mtDisplay.sendCb = sendCb;
	    });
	});
    },


    // closeCb()
    // sendCb(err, attachmentIdxBN, message)
    //
    // set up the message-display area.
    // this is a versatile function!
    //
    // 1) to display the most recent message in a message thread, set prevMsgId to null and message.msgId equal to mostRecentMsgId.
    //    in this case the user can click the send button to add another message to the thread. that is, reply to the message, or
    //    send another follow-up message. set the sendCb to the function that will be called to perform the actual encrpytion and
    //    send.
    //
    // 2) to display a message that is not necessarily the most recent message in a message thread, but the most recent message for
    //    a particular sub-thread, set prevMsgId to null and message.msgId not equal to mostRecentMsgId. in this case the send button
    //    is actually a button to display the most recent message. set the sendCb to the function that will be called to perform the
    //    actual encrpytion and send, if and when a reply is sent to the most recent message.
    //
    // 3) to display a message that is part of a chain of messages, set prevMsgId to previous message (which came later chronologically,
    //    but is 'previous' in the sense that it was displayed previously). and message.msgId not equal to mostRecentMsgId. in this
    //    case the send button will redisplay the previous message. that is to say, the send button acts as a 'back' button.
    //
    // recursive operation:
    // the function can operate in a recursive fashion. imagine a series of messages in a message thread, A => B => C, where message A
    // was the first message and message C is the most recent message. if called initially to display message B, the the 'send' button
    // actually displays the most recent message, C via a recursive call. if the user clicks the ref button, then message A is displayed
    // via a recursive call. but in that call prevMsgId refers to a message B. that is, the sendCb fcn that is passed in the recursive
    // call just redisplays the current message; that is to say, the send button acts as a back button.
    //
    setupDisplayMsgArea: function(msgDesc, message, mostRecentMsgName, mostRecentMsgId, prevMsgId, closeCb, sendCb) {
	console.log('setupDisplayMsgArea: enter msgId = ' + message.msgId + ', mostRecentMsgId = ' + mostRecentMsgId + ', text = ' + message.text);
	const addrPrompt = (message.fromAddr == common.web3.eth.accounts[0]) ? 'To: ' : 'From: ';
	const sendButtonText = (message.msgId == mostRecentMsgId) ?
	      ((message.fromAddr == common.web3.eth.accounts[0]) ? 'Send follow-up' : 'Reply') :
	      (!!prevMsgId && prevMsgId != mostRecentMsgId) ? 'Subsequent Message' : 'Most Recent Message';
	setMsgArea(mtDisplay.DISPLAY_MODE, addrPrompt, message.otherAddr, message.msgId, message.ref, msgDesc, message.date, sendButtonText);
	mtDisplay.closeCb = closeCb;
	mtDisplay.refCb = null;
	mtDisplay.sendCb = null;
	//
	// iff there's a nz ref, and the user clicks on the ref to display it, then we pass the backCb to the display fcn in place of the sendCb.
	// in that case the send button acts as a back button, to redisplay the current message
	document.getElementById('msgTextArea').readonly = 'true';
	document.getElementById('msgTextArea').value = message.text;
	if (!!message.attachment) {
	    attachmentSaveA.href = message.attachment.blob;
	    attachmentSaveA.download = message.attachment.name;
	    const attachmentSaveSpan = document.getElementById('attachmentSaveSpan');
	    attachmentSaveSpan.textContent = message.attachment.name;
	    attachmentSaveA.style.display = 'inline-block';
	} else {
	    attachmentSaveA.style.display = 'none';
	}
	document.getElementById('sendButton').disabled = false;
	//
	// if there is a ref, then clicking on it displays the ref, and within that message the sendCb is really a back button, which bring us
	// back to the current msg
	//
	const backCb = () => mtDisplay.setupDisplayMsgArea(msgDesc, message, mostRecentMsgName, mostRecentMsgId, prevMsgId, closeCb, sendCb);
	if (!!message.ref) {
	    const thisMsgId = message.msgId;
	    mtDisplay.refCb = (refId) => {
		common.setLoadingIcon('start');
		mtUtil.getParseDecryptMsg(refId, function(err, refMessage) {
		    common.setLoadingIcon(null);
		    if (!!err) {
			alert(err);
			return;
		    }
		    const msgDesc = 'This is a previous message in the thread of messages for this escrow';
		    //no reply except replying to the most recent message
		    mtDisplay.setupDisplayMsgArea(msgDesc, refMessage, mostRecentMsgName, mostRecentMsgId, thisMsgId, closeCb, backCb);
		});
	    };
	}
	//
	// send button really is a send button iff this is the most recent message
	//
	if (message.msgId == mostRecentMsgId) {
	    mtDisplay.sendCb = () => {
		const msgDesc = 'Enter additional notes regarding the previous ' + mostRecentMsgName + ' message';
		const placeholderText =
		      '\n' +
		      'Type your message here...\n' +
		      'NOTE: The previous message was:\n' + message.text;
		mtDisplay.setupComposeMsgArea(message.otherAddr, placeholderText, '', msgDesc, message.msgId, 'send', sendCb);
	    };
	} else if (!!prevMsgId) {
	    //
	    // send button is really a 'back' button to return to the previous (newer) message. this is the backCb defined above, which
	    // has been passed into us in a recursive call
	    //
	    mtDisplay.sendCb = sendCb;
	} else {
	    //
	    // the is the most recent message we have in the partial thread -- but it's still not the most recent message. sendCb
	    // is really a button to go to the most recent message.
	    //
	    mtDisplay.sendCb = () => {
		common.setLoadingIcon('start');
		mtUtil.getParseDecryptMsg(mostRecentMsgId, function(err, mostRecentMessage) {
		    common.setLoadingIcon(null);
		    if (!!err) {
			alert(err);
			return;
		    }
		    const msgDesc = 'This is the most recent message for this escrow';
		    mtDisplay.setupDisplayMsgArea(msgDesc, mostRecentMessage, mostRecentMsgName, mostRecentMsgId, null, closeCb, sendCb);
		});
	    };
	}
    },
};


//
// call once on document load
// just hides the entire msgAreaDiv
//
function setMsgCloseHandler() {
    const msgCloseImg = document.getElementById('msgCloseImg');
    msgCloseImg.addEventListener('click', function() {
	common.replaceElemClassFromTo('msgAreaDiv', 'visibleB', 'hidden', true);
	if (!!mtDisplay.closeCb)
	    mtDisplay.closeCb();
    });
}

//
// call once on document load
// just calls the refCb
//
function setRefHandler() {
    const refHandler = () => {
	console.log('setRefHandler: refId = ' + msgRefButton.ref);
	if (!!msgRefButton.ref) {
	    const refId = common.numberToHex256(msgRefButton.ref);
	    mtDisplay.refCb(refId);
	}
    };
    document.getElementById('msgRefButton').addEventListener('click', refHandler);
    document.getElementById('prevButton').addEventListener('click', refHandler);
}

//
// call once on document load
// clicking the attach button displays the attachment input
// clicking the attachment input loads the specified file, and stores it in attachmentSaveA.href
// clicking the deleteImg clears the attachmentSaveA.href and hides the attachment input
//
function setAttachButtonHandler() {
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
	if (msgTextArea.value == '')
	    document.getElementById('msgFeeArea').value = 'Fee: 0 Wei';
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
		//message has content...
		document.getElementById('msgFeeArea').value = 'Fee: ' + ether.convertWeiBNToComfort(common.numberToBN(mtDisplay.composeFee));
	    };
	    reader.readAsDataURL(attachmentInput.files[0]);
        } else {
	    attachmentSaveA.href = null;
	}
    });
}


//
// needs to be called once, on document load
// the handler herein only performs the preliminary send preparation:
//  concatenates the attachment to the unencrypted message text
//  sets the attachmentIdxBN
// then it calls sendCb(null, attachmentIdxBN, message) to perform the actual send
//
function setSendButtonHandler() {
    console.log('setSendButtonHandler');
    const sendButton = document.getElementById('sendButton');
    sendButton.addEventListener('click', function() {
	console.log('sendButton: click');
	if (!!mtDisplay.sendCb) {
	    const msgTextArea = document.getElementById('msgTextArea');
	    if (msgTextArea.disabled) {
		//send button is back button
		console.log('sendButton: sendCb is backCb');
		mtDisplay.sendCb();
	    } else {
		const msgAddrArea = document.getElementById('msgAddrArea');
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
		console.log('setSendButtonHandler: calling mtDisplay.sendCb');
		mtDisplay.sendCb(null, attachmentIdxBN, message);
	    }
	}
    });
}

//
// handle any changes in the message text area:
// if the message is empty then the fee is zero.
//
function setTextAreaHandler() {
    const msgTextArea = document.getElementById('msgTextArea');
    msgTextArea.addEventListener('input', function() {
	console.log('setTextAreaHandler: msgTextArea.value = ' + msgTextArea.value);
	if (msgTextArea.value == '' && (!attachmentSaveA.href || !attachmentSaveA.download))
	    document.getElementById('msgFeeArea').value = 'Fee: 0 Wei';
	else
	    document.getElementById('msgFeeArea').value = 'Fee: ' + ether.convertWeiBNToComfort(common.numberToBN(mtDisplay.composeFee));
    });
}


//
// setup the msg area for either compose mode or display mode
//
function setMsgArea(composeMode, addrPrompt, otherAddr, msgId, ref, msgDesc, date, sendButtonText) {
    //always display...
    const msgPromptArea = document.getElementById('msgPromptArea');
    msgPromptArea.value = addrPrompt;
    const msgAddrArea = document.getElementById('msgAddrArea');
    msgAddrArea.disabled = true;
    msgAddrArea.readonly = 'readonly';
    msgAddrArea.value = otherAddr;
    if (ether.validateAddr(otherAddr)) {
	ether.ensReverseLookup(otherAddr, function(err, name) {
	    if (!err && !!name)
		msgAddrArea.value = common.abbreviateAddrForEns(otherAddr, name, 5);
	});
    } else {
	ether.ensLookup(otherAddr, function(err, addr) {
	    if (!err && !!addr)
		msgAddrArea.value = common.abbreviateAddrForEns(addr, otherAddr, 5);
	});
    }
    //
    if (!msgId && !ref) {
	common.replaceElemClassFromTo('msgAreaIdAndRef', 'visibleTR', 'hidden',    true);
    } else {
	common.replaceElemClassFromTo('msgIdArea',       'hidden', 'visibleB',  false);
	common.replaceElemClassFromTo('msgRefButton',    'hidden', 'visibleB',  false);
	common.replaceElemClassFromTo('msgAreaIdAndRef', 'hidden', 'visibleTR', true);
	//we don't support backtracking references in the compose mode
	showIdAndRef(msgId, ref, composeMode ? false : true);
    }
    //
    const msgDescArea = common.replaceElemClassFromTo('msgDescArea', 'hidden', 'visibleTC', true);
                        common.replaceElemClassFromTo('msgDescPromptArea', 'hidden', 'visibleTC', true);
    msgDescArea.value = msgDesc;
    //
    const msgTextArea = common.replaceElemClassFromTo('msgTextArea', 'hidden', 'visibleIB', true);
    msgTextArea.value = '';
    //
    if (!date) {
	common.replaceElemClassFromTo('msgDateArea', 'visibleIB', 'hidden', true);
    } else {
	const msgDateArea = common.replaceElemClassFromTo('msgDateArea', 'hidden', 'visibleIB', true);
	msgDateArea.value = date;
    }
    //
    if (!sendButtonText) {
	common.replaceElemClassFromTo('sendButton', 'hidden', 'visibleB', true);
    } else {
	//send button is always disabled at this time. called must enable.
	const sendButton = common.replaceElemClassFromTo('sendButton', 'hidden', 'visibleB', true);
	sendButton.textContent = sendButtonText;
    }
    //
    if (!!composeMode) {
	common.replaceElemClassFromTo('msgFeeArea',         'hidden',           'visibleIB',        true);
	common.replaceElemClassFromTo('attachmentButton',   'hidden',           'visibleIB',        false);
	common.replaceElemClassFromTo('attachmentInput',    'visibleIB',        'hidden',           true);
	common.replaceElemClassFromTo('prevButton',         'visibleB',         'hidden',           true);
	common.replaceElemClassFromTo('sendButton',         'sendButtonIsNext', 'sendButtonIsSend', false);
    } else {
	common.replaceElemClassFromTo('attachmentButton',   'visibleIB',        'hidden',           true);
	common.replaceElemClassFromTo('attachmentInput',    'visibleIB',        'hidden',           true);
	common.replaceElemClassFromTo('msgFeeArea',         'visibleIB',        'hidden',           true);
	if (!!ref && !common.numberToBN(ref).isZero())
	    common.replaceElemClassFromTo('prevButton',     'hidden',           'visibleB',         false);
	else
	    common.replaceElemClassFromTo('prevButton',     'visibleB',         'hidden',           true);
	common.replaceElemClassFromTo('sendButton',         'sendButtonIsSend', 'sendButtonIsNext', false);

    }
    common.replaceElemClassFromTo('msgAreaDiv', 'hidden', 'visibleB',  true);
}


//if enable is set, then the msgRefButton is enabled, but only if ref is nz
function showIdAndRef(msgId, ref, enable) {
    console.log('showIdAndRef: msgId = ' + msgId + ', ref = ' + ref);
    const msgIdArea = document.getElementById('msgIdArea');
    if (!!msgId) {
	msgIdArea.value = 'Msg ID: ' + mtUtil.abbreviateMsgId(msgId);
	msgIdArea.msgId = msgId;
    } else {
	msgIdArea.value = 'Msg ID: unassigned';
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
