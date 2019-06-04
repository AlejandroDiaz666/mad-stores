
//
// High level fcns related to interaction w/ EMT contract
//
const common = require('./common');
const ether = require('./ether');
const mtEther = require('./mtEther');
const dhcrypt = require('./dhcrypt');
const BN = require("bn.js");
const swarmjs = require("swarm-js");

const mtUtil = module.exports = {
    acctInfo: null,
    publicKey: null,
    //set internally by encryptMsg
    reCacheAccount: true,
    // msgIds indexed by recv count, sent count
    recvMsgIdsCache: [],
    sentMsgIdsCache: [],
    // complete messages, by msgId
    messageCache: [],
    // storageMode: 'ethereum' | 'swarm' | 'auto'
    storageMode: 'ethereum',
    //timeout in ms
    swarmTimeout: 4000,
    swarm: null,

    //
    // usually when you first create a Message you pass in null text, and then update
    // the Message text and attachment after decryption. but if an error occurs, then you
    // can set the text to the error message that you would like to be displayed when
    // the message detail is shown
    //
    Message: function(msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text) {
	this.msgId = msgId;
	this.fromAddr = fromAddr;
	this.toAddr = toAddr;
	this.otherAddr = (fromAddr == common.web3.eth.accounts[0]) ? toAddr : fromAddr;
	this.viaAddr = viaAddr;
	this.txCount = txCount;
	this.rxCount = rxCount;
	this.date = date;
	this.ref = ref;
	this.text = text;
	this.attachment = null;
	this.ensName = null;
	//
	this.setText = function(text, attachment) {
	    this.text = text;
	    this.attachment = attachment;
	};
    },


    // mode: 'ethereum' | 'swarm' | 'auto'
    setMessageStorage: function(mode, swarmGateway) {
	mtUtil.storageMode = mode;
	mtUtil.swarm = swarmjs.at(swarmGateway);
	console.log('setMessageStorage: mtUtil.swarm = ' + !!mtUtil.swarm + ', gateway = ' + swarmGateway);
    },

    // timeout is timeout in ms
    setSwarmTimeout(timeout) {
	mtUtil.swarmTimeout = timeout;
    },

    //cb(err, acctInfo)
    refreshAcctInfo: function(force, cb) {
	if (!force && !mtUtil.reCacheAccount && !!mtUtil.acctInfo && !!mtUtil.acctInfo.publicKey) {
	    cb(null, mtUtil.acctInfo);
	} else {
	    mtEther.accountQuery(common.web3.eth.accounts[0], function(err, _acctInfo) {
		console.log('refreshAcctInfo: acctInfo: ' + JSON.stringify(_acctInfo));
		if (!!err) {
		    cb(err, null);
		} else {
		    mtUtil.reCacheAccount = false;
		    mtUtil.acctInfo = _acctInfo;
		    mtUtil.publicKey = (!!mtUtil.acctInfo) ? mtUtil.acctInfo.publicKey : null;
		    cb(err, mtUtil.acctInfo);
		}
	    });
	}
    },


    // create a shorter base64 message id from a long hex msgId
    // note: every 3 bytes produces 4 base64 chars; so use a multiple of 3 bytes to avoid padding chars, '=='
    abbreviateMsgId: function(msgId) {
	const idShortHex = common.leftPadTo(common.numberToBN(msgId).toString(16), 36, '0');
	return(common.hexToBase64(idShortHex));
    },


    extractSubject: function(msgText, maxLen) {
	if (!msgText)
	    return('');
	if (msgText.startsWith('Subject: '))
	    msgText = msgText.substring(9);
	let newlineIdx = (msgText.indexOf('\n') > 0) ? msgText.indexOf('\n') :  msgText.length;
	if (newlineIdx > maxLen - 1)
	    newlineIdx = maxLen - 1;
	return(msgText.substring(0, newlineIdx));
    },


    // cb(err)
    // gets msg ids to the sentMsgIdsCache
    getSentMsgIds: function(fromAddr, startIdx, count, cb) {
	const msgIds = [];
	const startIdxBn = common.numberToBN(startIdx);
	mtEther.getSentMsgIds(fromAddr, startIdxBn, count, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    mtUtil.sentMsgIdsCache[startIdx + i] = common.numberToHex256(results[i]);
	    }
	    cb(err, msgIds);
	});
    },


    // cb(err)
    // gets msg ids to the recvMsgIdsCache
    getRecvMsgIds: function(toAddr, startIdx, count, cb) {
	const msgIds = [];
	const startIdxBn = common.numberToBN(startIdx);
	mtEther.getRecvMsgIds(toAddr, startIdxBn, count, function(err, lastIdx, results) {
	    if (!err) {
		for (let i = 0; i < results.length; ++i)
		    mtUtil.recvMsgIdsCache[startIdx + i] = common.numberToHex256(results[i])
	    }
	    cb(err, msgIds);
	});
    },


    //
    // wrapper around mtEther.sendMessage which masks the use of swarm
    // cb(err, txid)
    //
    sendMessage: function(toAddr, attachmentIdxBN, ref, encrypted, msgFee, cb) {
	if ((!!mtUtil.swarm                                                                                ) &&
	    (encrypted.length > 0                                                                          ) &&
	    (mtUtil.storageMode == 'swarm' || (mtUtil.storageMode == 'auto' && !attachmentIdxBN.isZero())) ) {
	    const swarmAttachmentIdxBN = attachmentIdxBN.setn(247, 1);
	    console.log('sendMessage: swarmAttachmentIdxBN = 0x' + swarmAttachmentIdxBN.toString(16));
	    const was = common.setLoadingIcon('start');
	    mtUtil.swarm.upload(encrypted).then(hash => {
		console.log("Uploaded file. Address:", hash);
		common.setLoadingIcon(was);
		if (!!hash) {
		    mtEther.sendMessage(toAddr, swarmAttachmentIdxBN, ref, hash, msgFee, cb)
		} else {
		    alert('swarm upload -- no hash!');
		    cb('error uploading to swarm', null);
		}
	    }).catch((err, status) => {
		common.setLoadingIcon(was);
		console.log('sendMessage: swarm upload error: ' + err.toString());
		err = err.message + '\nmessage too large?';
		cb(err, null); });
	} else {
	    mtEther.sendMessage(toAddr, attachmentIdxBN, ref, encrypted, msgFee, cb);
	}
    },


    //
    // get, parse and then decrypt a single msg
    // cb(err, message)
    //
    getParseDecryptMsg: function(msgId, cb) {
	console.log('getParseDecryptMsg: enter msgId = ' + msgId);
	const cachedMessage = mtUtil.messageCache[msgId];
	if (!!cachedMessage) {
	    cb(null, cachedMessage);
	} else {
	    getAndParseMsg(msgId, function(err, message, attachmentIdxBN, msgHex) {
		if (!!err) {
		    if (!message.text)
			message.text = err.toString();
		    cb(err, message);
		} else {
		    mtUtil.decryptMsg(message, attachmentIdxBN, msgHex, (err, message) => {
			if (!!err && !message.text)
			    message.text = err.toString();
			console.log('getParseDecryptMsgs: msgId = ' + message.msgId + ', text = ' + message.text + ', attachment = ' + message.attachment);
			cb(err, message);
		    });
		}
	    });
	}
    },


    //
    // msgCb(err, cookie, message)
    // doneCb(noMessagesProcessed)
    // gets up to 9 messages specified in msgIds[]
    // msgCb is called once for each message passing msgCookies[msgId]
    // messages that are sucessfully decrypted are cached
    //
    getParseDecryptMsgs: function(msgIds, msgCookies, msgCb, doneCb) {
	console.log('getParseDecryptMsgs: ' + msgIds.length + ' msgIds');
	const msgFcn = (err, cookie, message, attachmentIdxBN, msgHex) => {
	    if (!!err) {
		if (!message.text)
		    message.text = err.toString();
		console.log('getParseDecryptMsgs: msgId = ' + message.msgId + ', err = ' + err + ', text = ' + message.text);
		msgCb(err, cookie, message);
	    } else {
		mtUtil.decryptMsg(message, attachmentIdxBN, msgHex, (err, message) => {
		    if (!!err && !message.text)
			message.text = err.toString();
		    console.log('getParseDecryptMsgs: msgId = ' + message.msgId + ', text = ' + message.text + ', attachment = ' + message.attachment);
		    msgCb(err, cookie, message);
		});
	    }
	};
	getAndParseMsgs(msgIds, msgCookies, msgFcn, doneCb);
    },



    //
    // cb(err, message)
    // decrypt message and extract attachment
    //  attachment: { name: 'name', blob: 'saveable-blob' };
    //
    decryptMsg: function(message, attachmentIdxBN, msgHex, cb) {
	console.log('decryptMsg: otherAddr = ' + message.otherAddr);
	mtEther.accountQuery(message.otherAddr, function(err, otherAcctInfo) {
	    const otherPublicKey = (!!otherAcctInfo) ? otherAcctInfo.publicKey : null;
	    if (!!otherPublicKey && otherPublicKey != '0x') {
		const ptk = dhcrypt.ptk(otherPublicKey, message.toAddr, message.fromAddr, message.txCount);
		dhcrypt.decrypt(ptk, msgHex, false, function(err, decrypted) {
		    console.log('decryptMsg: decrypted (length = ' + decrypted.length + ') = ' + decrypted.substring(0, 30));
		    let messageText = decrypted;
		    let attachment = null;
		    if (!!err) {
			message.setText(err.toString(), null);
			cb(err, message);
		    } else {
			if (!!attachmentIdxBN && !attachmentIdxBN.isZero()) {
			    console.log('decryptMsg: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
			    const idx = attachmentIdxBN.maskn(53).toNumber();
			    console.log('decryptMsg: attachment at idx ' + idx);
			    if (idx > 0) {
				messageText = decrypted.substring(0, idx);
				const nameLen = attachmentIdxBN.iushrn(248).toNumber();
				attachment = { name: decrypted.substring(idx, idx + nameLen), blob: decrypted.substring(idx + nameLen) };
			    }
			}
			message.setText(messageText, attachment);
			mtUtil.messageCache[message.msgId] = message;
			ether.ensReverseLookup(message.otherAddr, function(ensErr, name) {
			    if (!ensErr && !!name)
				message.ensName = name;
			    cb(err, message);
			});
		    }
		});
	    } else {
		console.log('decryptMsg: error looking up account for ' + message.otherAddr + ', otherPublicKey = ' + otherPublicKey);
		cb('Error looking up account for ' + message.otherAddr, message);
	    }
	});
    },


    // cb(err, msgFee, encrypted, msgNoBN)
    encryptMsg: function(toAddr, clearText, cb) {
	console.log('encryptMsg');
	mtEther.accountQuery(toAddr, function(err, toAcctInfo) {
	    //encrypt the clearText...
	    const toPublicKey = (!!toAcctInfo) ? toAcctInfo.publicKey : null;
	    //console.log('encryptMsg: toPublicKey = ' + toPublicKey);
	    if (!toPublicKey || toPublicKey == '0x') {
		cb('Encryption error: unable to look up destination address in contract!', null, null);
		return;
	    }
	    mtUtil.refreshAcctInfo(false, function() {
		//console.log('encryptMsg: mtUtil.acctInfo.sentMsgCount = ' + mtUtil.acctInfo.sentMsgCount);
		const sentMsgCtrBN = common.numberToBN(mtUtil.acctInfo.sentMsgCount);
		sentMsgCtrBN.iaddn(1);
		//console.log('encryptMsg: toPublicKey = ' + toPublicKey);
		const ptk = dhcrypt.ptk(toPublicKey, toAddr, common.web3.eth.accounts[0], '0x' + sentMsgCtrBN.toString(16));
		//console.log('encryptMsg: ptk = ' + ptk);
		const encrypted = (clearText.length == 0) ? '' : dhcrypt.encrypt(ptk, clearText);
		console.log('encryptMsg: encrypted (length = ' + encrypted.length + ') = ' + encrypted);
		//in order to figure the message fee we need to see how many messages have been sent from the proposed recipient to me
		mtEther.getPeerMessageCount(toAddr, common.web3.eth.accounts[0], function(err, msgCount) {
		    console.log('encryptMsg: ' + msgCount.toString(10) + ' messages have been sent from ' + toAddr + ' to me');
		    //TODO: must correct fee in MadStores contract
		    const msgFee = (encrypted.length == 0) ? 0 : (msgCount > 0) ? toAcctInfo.msgFee : toAcctInfo.spamFee;
		    mtUtil.reCacheAccount = true;
		    cb(null, msgFee, encrypted, sentMsgCtrBN);
		});
	    });
	});
    },


    // cb(err)
    // cb is called after user clicks continue
    encryptAndSendMsg: function(msgDesc, toAddr, ref, attachmentIdxBN, clearText, cb) {
	console.log('encryptAndSendMsg');
	mtUtil.encryptMsg(toAddr, clearText, function(err, msgFee, encrypted, msgNoBN) {
	    if (!!err) {
		cb(err);
		return;
	    }
	    console.log('encryptAndSendMsg: msgFee is ' + msgFee + ' wei');
	    common.showWaitingForMetaMask(true);
	    const continueFcn = (err, receipt) => {
		common.waitingForTxid = false;
		common.clearStatusDiv(statusDiv);
		cb(err);
	    };
	    mtUtil.sendMessage(toAddr, attachmentIdxBN, ref, encrypted, msgFee, function(err, txid) {
		console.log('encryptAndSendMsg: txid = ' + txid);
		common.showWaitingForMetaMask(false);
		common.waitForTXID(err, txid, msgDesc, continueFcn, ether.etherscanioTxStatusHost, null);
	    });
	});
    },

};


//
// cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
// wrapper around mtEther.parseMessageEvent which masks the use of swarm
//
function parseMessageEvent(msgResult, cb) {
    mtEther.parseMessageEvent(msgResult, function(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
	if (!attachmentIdxBN.testn(247)) {
	    cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
	} else if (msgHex.length != 66) {
	    console.log('parseMessageEvent: ignoring crazy swarm hash = ' + hash);
	    cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
	} else {
	    const bit247BN = (new BN('0', 16)).setn(247, 1);
	    attachmentIdxBN.ixor(bit247BN);
	    const hash = msgHex.substring(2);
	    console.log('parseMessageEvent: msgId = ' + msgId + ', swarm hash = ' + hash);
	    //
	    let timeout = false;
	    let complete = false;
	    const swarmTimer = setTimeout(function() {
		timeout = true;
		if (complete == true) {
		    return;
		} else {
		    console.log('parseMessageEvent: msgId = ' + msgId + ', timeout retrieving ' + hash);
		    const err = 'timeout retrieving message from Swarm';
		    cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
		}
	    }, mtUtil.swarmTimeout);
	    //
	    mtUtil.swarm.download(hash).then(array => {
		clearTimeout(swarmTimer);
		complete = true;
		const swarmMsgHex = mtUtil.swarm.toString(array);
		//msg should be encrypted, never 'Code:'
		const err = swarmMsgHex.startsWith('Code:') ? 'error retrieving message from Swarm\n' + swarmMsgHex : null;
		if (timeout == false) {
		    //console.log("parseMessageEvent: swarm downloaded:", swarmMsgHex);
		    cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, swarmMsgHex, blockNumber, date);
		} else {
		    // we can't call the cb function, since the timeout already occurred, but we can processs the message
		    // and put it into the cache, to avoid future timeouts..
		    console.log('parseMessageEvent: msgId = ' + msgId + ', download returned after timeout!');
		    if (!err) {
			//                                 msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text)
			const message = new mtUtil.Message(msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, '');
			cb(err, message, attachmentIdxBN, msgHex);
			mtUtil.decryptMsg(message, attachmentIdxBN, swarmMsgHex, (err, message) => {
			    if (!err)
				console.log('parseMessageEvent: msgId = ' + msgId + ', swarm message successfully cached after timeout');
			});
		    }
		}
	    }).catch(err => {
		complete = true;
		console.log('parseMessageEvent: swarm error downloading: err = ' + err + ', hash = ', hash);
		if (timeout == true)
		    console.log('parseMessageEvent: error occurred after timeout! hash = ' + hash);
		else
		    cb(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
	    });
	}
    });
}


//
// get and parse a single msg
// cb(err, message, attachmentIdxBN, msgHex)
//
function getAndParseMsg(msgId, cb) {
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
	    //                                 msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text)
	    const message = new mtUtil.Message(msgId, '',       '',     '',      0,       0,       '',   '',  err);
	    cb(err, message);
	    return;
	}
	parseMessageEvent(msgResult[0], function(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
	    //                                 msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text)
	    const message = new mtUtil.Message(msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, '');
	    cb(err, message, attachmentIdxBN, msgHex);
	});
    });
}


//
// msgCb(err, cookie, message, attachmentIdxBN, msgHex)
// doneCb(noMessagesProcessed)
// gets up to 9 messages specified in msgIds[]
// msgCb is called once for each message passing msgCookies[msgId]
//
function getAndParseMsgs(msgIds, msgCookies, msgCb, doneCb) {
    console.log('getAndParseIdMsgs: ' + msgIds.length + ' msgIds');
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
	    console.log('getAndParseIdMsgs: err = ' + err);
	    err = (!!err) ? err : 'Message data not found';
	    //either an error, or maybe just no events
	    for (let i = 0; i < msgIds.length; ++i) {
		//                                 msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text)
		const message = new mtUtil.Message(msgId, '',       '',     '',      0,       0,       '',   '',  err);
		msgCb(err, msgCookies[msgId], message, null, '');
	    }
	    doneCb(msgIds.length);
	    return;
	}
	let msgCbCount = 0;
	let bogusCount = 0;
	for (let i = 0; i < msgResults.length; ++i) {
	    parseMessageEvent(msgResults[i], function(err, msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date) {
		if (!!msgCookies[msgId]) {
		    console.log('getAndParseIdMsgs: msgId = ' + msgId + ', fromAddr = ' + fromAddr + ', toAddr = ' + toAddr);
		    //                                 msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, text)
		    const message = new mtUtil.Message(msgId, fromAddr, toAddr, viaAddr, txCount, rxCount, date, ref, '');
		    msgCb(err, msgCookies[msgId], message, attachmentIdxBN, msgHex);
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
}
