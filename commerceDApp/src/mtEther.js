
//
// fcns related to ethereum and low level interaction w/ MT contract
//
const common = require('./common');
const ether = require('./ether');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");
const keccak = require('keccakjs');

const mtEther = module.exports = {

    //kovan
    EMT_CONTRACT_ADDR: null,
    EMT_CONTRACT_ABI:  '[{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_messageFee","type":"uint256"},{"name":"_spamFee","type":"uint256"},{"name":"_publicKey","type":"bytes"},{"name":"_encryptedPrivateKey","type":"bytes"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_toAddr","type":"address"},{"name":"attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"sendMessage","outputs":[{"name":"_messageId","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"accounts","outputs":[{"name":"messageFee","type":"uint256"},{"name":"spamFee","type":"uint256"},{"name":"feeBalance","type":"uint256"},{"name":"recvMessageCount","type":"uint256"},{"name":"sentMessageCount","type":"uint256"},{"name":"publicKey","type":"bytes"},{"name":"encryptedPrivateKey","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"trusted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_to","type":"address"},{"name":"_startIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"}],"name":"getRecvMsgs","outputs":[{"name":"_idx","type":"uint256"},{"name":"_messageIds","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"}],"name":"getPeerMessageCount","outputs":[{"name":"_messageCount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdrawRetainedFees","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_fromAddr","type":"address"},{"name":"_toAddr","type":"address"},{"name":"attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"sendMessage","outputs":[{"name":"_messageId","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_toAddr","type":"address"}],"name":"getFee","outputs":[{"name":"_fee","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_contractSendGas","type":"uint256"}],"name":"tune","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_trustedAddr","type":"address"},{"name":"_trust","type":"bool"}],"name":"setTrust","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_from","type":"address"},{"name":"_startIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"}],"name":"getSentMsgs","outputs":[{"name":"_idx","type":"uint256"},{"name":"_messageIds","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_fromAddr","type":"address"},{"name":"_toAddr","type":"address"}],"name":"getFee","outputs":[{"name":"_fee","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_tokenAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_toAddr","type":"address"},{"indexed":true,"name":"_fromAddr","type":"address"}],"name":"InviteEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_id1","type":"uint256"},{"indexed":true,"name":"_id2","type":"uint256"},{"indexed":true,"name":"_id3","type":"uint256"},{"indexed":false,"name":"_fromAddr","type":"address"},{"indexed":false,"name":"_toAddr","type":"address"},{"indexed":false,"name":"_txCount","type":"uint256"},{"indexed":false,"name":"_rxCount","type":"uint256"},{"indexed":false,"name":"_attachmentIdx","type":"uint256"},{"indexed":false,"name":"_ref","type":"uint256"},{"indexed":false,"name":"message","type":"bytes"}],"name":"MessageEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_fromAddr","type":"address"},{"indexed":true,"name":"_txCount","type":"uint256"},{"indexed":false,"name":"_id","type":"uint256"}],"name":"MessageTxEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_toAddr","type":"address"},{"indexed":true,"name":"_rxCount","type":"uint256"},{"indexed":false,"name":"_id","type":"uint256"}],"name":"MessageRxEvent","type":"event"}]',
    ropsten_contract_addr: '0x6Bb1BCB5905c1DF052417e27321bAaCa52B2c7fc',
    kovan_contract_addr: '',
    EMTContractInstance: null,
    messageEventTopic0: null,
    messageTxEventTopic0: null,
    messageRxEventTopic0: null,
    sendMessageABI: null,
    registerABI: null,
    withdrawABI: null,

    // network = [ 'Mainnet' | 'Morden test network' | 'Ropsten test network' | 'Rinkeby test network' | 'Kovan test network' ]
    setNetwork: function(network) {
    	if (network.indexOf('Kovan') >= 0)
	    mtEther.EMT_CONTRACT_ADDR = mtEther.kovan_contract_addr;
	else if (network.indexOf('Ropsten') >= 0)
	    mtEther.EMT_CONTRACT_ADDR = mtEther.ropsten_contract_addr;
	else
	    alert(network + ' is not a supported network');
	console.log('setNetwork: emt contract addr = ' + mtEther.EMT_CONTRACT_ADDR);
    },


    accountQuery: function(web3, acct, cb) {
	if (!mtEther.EMTContractInstance)
	    initEMTContractInstance();
	mtEther.EMTContractInstance.accounts(acct, (err, resultObj) => {
	    const acctInfo = {};
	    if (!err) {
		const keys = [ 'msgFee', 'spamFee', 'feeBalance', 'recvMsgCount', 'sentMsgCount', 'publicKey', 'encryptedPrivateKey' ];
		const resultArray = Array.from(resultObj);
		for (let i = 0; i < resultArray.length; ++i)
		    acctInfo[keys[i]] = resultArray[i];
	    }
	    console.log('accountQuery: addr = ' + acct + ', result = ' + JSON.stringify(acctInfo));
	    cb(err, acctInfo);
	});
    },


    getPeerMessageCount: function(web3, from, to, cb) {
	if (!mtEther.EMTContractInstance)
	    initEMTContractInstance();
	mtEther.EMTContractInstance.getPeerMessageCount(from, to, cb);
    },


    //cb(err, lastIdx, messageIDs[])
    getRecvMsgIds: function (web3, to, startIdxBN, maxResults, cb) {
	if (!mtEther.EMTContractInstance)
	    initEMTContractInstance();
	mtEther.EMTContractInstance.getRecvMsgs(to, common.BNToHex256(startIdxBN), common.numberToHex256(maxResults), (err, result) => {
	    console.log('getRecvMsgIds: err = ' + err + ', result = ' + result);
	    const msgIds = result.toString().split(",");
	    //first entry is idx of last msgId
	    const lastIdx = msgIds.shift();
	    cb(err, lastIdx, msgIds);
	});
    },

    //cb(err, lastIdx, messageIDs[])
    getSentMsgIds: function (web3, from, startIdxBN, maxResults, cb) {
	if (!mtEther.EMTContractInstance)
	    initEMTContractInstance();
	mtEther.EMTContractInstance.getSentMsgs(from, common.BNToHex256(startIdxBN), common.numberToHex256(maxResults), (err, result) => {
	    console.log('getSentMsgIds: err = ' + err + ', result = ' + result);
	    const msgIds = result.toString().split(",");
	    //first entry is idx of last msgId
	    const lastIdx = msgIds.shift();
	    cb(err, lastIdx, msgIds);
	});
    },


    //cb(err, txid)
    sendMessage: function(web3, toAddr, attachmentIdxBN, ref, messageHex, size, cb) {
	console.log('sendMessageParms: toAddr = ' + toAddr);
	console.log('sendMessageParms: attachmentIdxBN = ' + attachmentIdxBN.toString(10));
	console.log('sendMessageParms: ref = ' + ref);
	const abiSendMessageFcn = mtEther.abiEncodeSendMessage();
	const abiParms = mtEther.abiEncodeSendMessageParms(toAddr, attachmentIdxBN, ref, messageHex);
        const sendData = "0x" + abiSendMessageFcn + abiParms;
	ether.send(web3, mtEther.EMT_CONTRACT_ADDR, size, 'wei', sendData, 0, cb);
    },

    //cb(err, txid)
    register: function(web3, messageFeeBN, spamFeeBN, publicKey, encryptedPrivateKey, cb) {
	const abiRegisterFcn = mtEther.abiEncodeRegister();
	const abiParms = mtEther.abiEncodeRegisterParms(messageFeeBN, spamFeeBN, publicKey, encryptedPrivateKey);
        const sendData = "0x" + abiRegisterFcn + abiParms;
	console.log('sendData = ' + sendData);
	ether.send(web3, mtEther.EMT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    //cb(err, txid)
    withdraw: function(web3, cb) {
	const abiWithdrawFcn = mtEther.abiEncodeWithdraw();
        const sendData = "0x" + abiWithdrawFcn;
	console.log('sendData = ' + sendData);
	ether.send(web3, mtEther.EMT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },


    getMessageEventTopic0: function() {
	if (!mtEther.messageEventTopic0) {
	    const keccak256 = new keccak(256);
	    keccak256.update("MessageEvent(uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes)");
	    mtEther.messageEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageEventTopic0 = ' + mtEther.messageEventTopic0);
	return(mtEther.messageEventTopic0);
    },

    getMessageTxEventTopic0: function() {
	if (!mtEther.messageTxEventTopic0) {
	    const keccak256 = new keccak(256);
	    keccak256.update("MessageTxEvent(address,uint256,uint256)");
	    mtEther.messageTxEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageTxEventTopic0 = ' + mtEther.messageTxEventTopic0);
	return(mtEther.messageTxEventTopic0);
    },

    getMessageRxEventTopic0: function() {
	if (!mtEther.messageRxEventTopic0) {
	    const keccak256 = new keccak(256);
	    keccak256.update("MessageRxEvent(address,uint256,uint256)");
	    mtEther.messageRxEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('MessageRxEventTopic0 = ' + mtEther.messageRxEventTopic0);
	return(mtEther.messageRxEventTopic0);
    },

    abiEncodeSendMessage: function() {
	//address toAddr, uint256 mimeType, uint256 ref, bytes message
	if (!mtEther.sendMessageABI)
	    mtEther.sendMessageABI = ethabi.methodID('sendMessage', [ 'address', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(mtEther.sendMessageABI);
    },

    abiEncodeSendMessageParms: function(toAddr, attachmentIdxBN, ref, message) {
	if (toAddr.startsWith('0x'))
	    toAddr = toAddr.substring(2);
	if (ref.startsWith('0x'))
	    ref = ref.substring(2);
	const bytes = common.hexToBytes(message);
	console.log('abiEncodeSendMessageParms: toAddr = ' + toAddr);
	console.log('abiEncodeSendMessageParms: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('abiEncodeSendMessageParms: ref = ' + ref);
	//console.log('abiEncodeSendMessageParms: message (length = ' + bytes.length + '): ' + bytes.toString(16));
	const encoded = ethabi.rawEncode([ 'address', 'uint256', 'uint256', 'bytes' ],
				   [ new BN(toAddr, 16), attachmentIdxBN, new BN(ref, 16), bytes ] ).toString('hex');
	return(encoded);
    },

    abiEncodeRegister: function() {
	//uint256 messageFee, uint256 spamFee, bytes publicKey, bytes encryptedPrivateKey
	if (!mtEther.registerABI)
	    mtEther.registerABI = ethabi.methodID('register', [ 'uint256', 'uint256', 'bytes', 'bytes' ]).toString('hex');
	return(mtEther.registerABI);
    },

    abiEncodeRegisterParms: function(messageFeeBN, spamFeeBN, publicKey, encryptedPrivateKey) {
	console.log('abiEncodeRegisterParms: messageFee = ' + messageFeeBN.toString(10));
	console.log('abiEncodeRegisterParms: spamFee = ' + spamFeeBN.toString(10));
	console.log('abiEncodeRegisterParms: publicKey (' + publicKey.length + ') = ' + publicKey);
	console.log('abiEncodeRegisterParms: encryptedPrivate (' + encryptedPrivateKey.length + ') = ' + encryptedPrivateKey);
	if (publicKey.startsWith('0x'))
	    publicKey = publicKey.substring(2);
	const publicKeyBytes = common.hexToBytes(publicKey);
	if (encryptedPrivateKey.startsWith('0x'))
	    encryptedPrivateKey = encryptedPrivateKey.substring(2);
	const encryptedPrivateKeyBytes = common.hexToBytes(encryptedPrivateKey);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'bytes', 'bytes' ],
					 [ messageFeeBN, spamFeeBN, publicKeyBytes, encryptedPrivateKeyBytes ] ).toString('hex');
	return(encoded);
    },

    abiEncodeWithdraw: function() {
	if (!mtEther.withdrawABI)
	    mtEther.withdrawABI = ethabi.methodID('withdraw', [ ]).toString('hex');
	return(mtEther.withdrawABI);
    },



    //cb(null, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date)
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    //note: this is a synchronous fcn
    parseMessageEvent: function(result, cb) {
	//event MessageEvent(uint indexed _id, address _fromAddr, address _toAddr, uint _txCount, uint _rxCount, uint _mimeType, uint _ref, bytes message);
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- id
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- id
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- id
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469     -- _fromAddr
	//                                   000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469     -- _toAddr
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _txCount
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _rxCount
	//                                   0000000000000000000000000000000000000000000000000000000000000001     -- _mimeType
	//                                   0000000000000000000000000000000000000000000000000000000000000005     -- _ref
	//                                   00000000000000000000000000000000000000000000000000000000000000b0     -- offset to message
	//                                   000000000000000000000000000000000000000000000000000000000000000d     -- message (length)
	//                                   4669727374206d65737361676500000000000000000000000000000000000000",   -- message text
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageEvent: result = ' + result);
	//console.log('parseMessageEvent: string = ' + JSON.stringify(result));
	const msgId = result.topics[1];
	//console.log('msgId: ' + msgId);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const fromAddr = '0x' + result.data.slice(0+2, 64+2).substring(12*2);
	const toAddr = '0x' + result.data.slice(64+2, 128+2).substring(12*2);
	//console.log('parseMessageEvent: fromAddr = ' + fromAddr);
	//console.log('parseMessageEvent: toAddr = ' + toAddr);
	const txCount = '0x' + result.data.slice(128+2, 192+2);
	//console.log('parseMessageEvent: txCount = ' + txCount);
	const rxCount = '0x' + result.data.slice(192+2, 256+2);
	//console.log('parseMessageEvent: rxCount = ' + rxCount);
	const attachmentIdxHex = result.data.slice(256+2, 320+2);
	const attachmentIdxBN = new BN(attachmentIdxHex, 16);
	const ref = '0x' + result.data.slice(320+2, 384+2);
	//console.log('parseMessageEvent: ref = ' + ref);
	const msgOffsetHex = result.data.slice(384+2, 448+2);
	const msgOffset = parseInt(msgOffsetHex, 16);
	const msgLenHex = result.data.slice((2*msgOffset)+2, (2*msgOffset)+64+2);
	const msgLen = parseInt(msgLenHex, 16);
	//console.log('parseMessageEvent: msgLen = 0x' + msgLen.toString(16));
	const msgHex = '0x' + result.data.slice((2*msgOffset)+64+2, (2*msgOffset)+64+2+(msgLen*2));
	const blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageEvent: blockNumber = ' + blockNumber);
	let date = 'Block #' + blockNumber.toString(10);
	if (!!result.timeStamp) {
	    const timeStamp = parseInt(result.timeStamp);
	    date = (new Date(timeStamp * 1000)).toUTCString();
	}
	//console.log('parseMessageEvent: date = ' + date);
	cb(null, msgId, fromAddr, toAddr, txCount, rxCount, attachmentIdxBN, ref, msgHex, blockNumber, date);
    },


    //cb(err, fromAddr, txCount, id, blockNumber, date);
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    //note: this is a synchronous fcn
    parseMessageTxEvent: function(result, cb) {
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- _fromAddr
	//                                  "0x0000000000000000000000000000000000000000000000000000000000000001"  -- _txCount
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469"    -- _id
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageTxEvent: result = ' + result);
	//console.log('parseMessageTxEvent: string = ' + JSON.stringify(result));
	const fromAddr = result.topics[1];
	const txCount = result.topics[2];
	//console.log('parseMessageTxEvent: fromAddr = ' + fromAddr);
	//console.log('parseMessageTxEvent: txCount = ' + txCount);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const msgId = result.data;
	const blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageTxEvent: blockNumber = ' + blockNumber);
	let date = 'Block #' + blockNumber.toString(10);
	if (!!result.timeStamp) {
	    const timeStamp = parseInt(result.timeStamp);
	    date = (new Date(timeStamp * 1000)).toUTCString();
	}
	//console.log('parseMessageTxEvent: date = ' + date);
	cb(null, fromAddr, txCount, msgId, blockNumber, date);
    },

    //cb(null, toAddr, rxCount, id, blockNumber, date);
    //pass in in a single result object
    //note: numbers may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    //note: this is a synchronous fcn
    parseMessageRxEvent: function(result, cb) {
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- _toAddr
	//                                  "0x0000000000000000000000000000000000000000000000000000000000000001"  -- _rxCount
	//                                ],
	//                    "data"    : "0x000000000000000000000000f48ae436e4813c7dcd5cdeb305131d07ca022469"    -- _id
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageRxEvent: result = ' + result);
	//console.log('parseMessageRxEvent: string = ' + JSON.stringify(result));
	const toAddr = result.topics[1];
	const rxCount = result.topics[2];
	//console.log('parseMessageRxEvent: toAddr = ' + toAddr);
	//console.log('parseMessageRxEvent: rxCount = ' + rxCount);
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const msgId = result.data;
	const blockNumber = parseInt(result.blockNumber);
	//console.log('parseMessageRxEvent: blockNumber = ' + blockNumber);
	let date = 'Block #' + blockNumber.toString(10);
	if (!!result.timeStamp) {
	    const timeStamp = parseInt(result.timeStamp);
	    date = (new Date(timeStamp * 1000)).toUTCString();
	}
	//console.log('parseMessageRxEvent: date = ' + date);
	cb(null, toAddr, rxCount, msgId, blockNumber, date);
    },

};


function initEMTContractInstance() {
    const ABIArray = JSON.parse(mtEther.EMT_CONTRACT_ABI);
    const EMTcontract = web3.eth.contract(ABIArray);
    mtEther.EMTContractInstance = EMTcontract.at(mtEther.EMT_CONTRACT_ADDR);
}
