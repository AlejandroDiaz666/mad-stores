/*
 * common functions -- no local dependancies here!
 */
var BN = require("bn.js");
var Buffer = require('buffer/').Buffer;

var common = module.exports = {

    web3:              null,

    //
    // if requireAcct, then not only must mm be installed, but also an acct must be unlocked
    // callback(err, myWeb3)
    //
    checkForMetaMask: async function(requireAcct, cb) {
	if (window.ethereum) {
	    // Modern dapp browsers...
            common.web3 = new Web3(ethereum);
	    //console.log('checkForMetaMask: found new metamask');
	    //provider: ' + common.web3.currentProvider.toString());
            try {
		// Request account access if needed
		await ethereum.enable();
		cb(null, common.web3);
            } catch (error) {
		// User denied account access...
		console.log('checkForMetaMask: err = ' + error.toString());
		common.web3 = null;
		cb('You must enable the MetaMask plugin to use this utility', null);
            }
	} else if (typeof window.web3 !== 'undefined') {
	    // Legacy dapp browsers...
	    common.web3 = new Web3(web3.currentProvider);
	    console.log('found old metamask. prvider: ' + web3.currentProvider.toString());
	    web3.version.getNetwork((err, netId) => {
		if (!!err)
		    cb(err,null)
		else if (false && netId != "1")
		    cb('MetaMask must be set to mainnet!', null);
		else if (!!requireAcct && !web3.eth.accounts[0])
		    cb('To use this utility, a MetaMask account must be unlocked', null);
		else
		    cb(null, common.web3);
	    });
	} else {
	    common.web3 = null;
	    cb('You must enable the MetaMask plugin to use this utility', null);
	}
    },


    //number can be a numver or a string, with or without '0x'
    numberToBN: function(number) {
	//first ensure passed parm is a string
	var numberStr = number.toString();
	var base = 10;
	if (numberStr.startsWith('0x')) {
	    base = 16;
	    numberStr = numberStr.substring(2);
	}
	return(new BN(numberStr, base));
    },

    stripNonNumber: function(number) {
	//first ensure passed parm is a string
	var numberStr = number.toString();
	if (numberStr.startsWith('0x')) {
	    numberStr = numberStr.substring(2);
	    numberStr = '0x' + numberStr.replace(/[^0-9a-fA-F]/g, '');
	} else {
	    numberStr = numberStr.replace(/[^0-9]/g, '');
	}
	return(numberStr);
    },

    //Hex256 string will be '0x' followed by 64 hex digits
    BNToHex256: function(xBN) {
	return('0x' + common.leftPadTo(xBN.toString(16), 64, '0'));
    },

    hexToAscii: function(hexStr) {
	console.log('hexToAscii');
	//first ensure passed parm is a string
	var hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	var str = '';
	for (var i = 0; i < hex.length; i += 2)
	    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
    },


    hexToBytes: function(hexStr) {
	console.log('hexToBytes');
	//first ensure passed parm is a string
	var hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	var bytes = new Uint8Array(hex.length / 2);
	for (var i = 0, j = 0; i < hex.length; i += 2)
	    bytes[j++] = parseInt(hex.substr(i, 2), 16);
	return bytes;
    },


    bytesToHex: function(byteArray) {
	var hex = Array.from(byteArray, function(byte) {
	    return('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('')
	console.log('bytesToHex: ' + hex);
	return(hex);
    },


    strToUtf8Hex: function(str) {
	//javascript encodes strings as UCS2, so for convert to a buffer of UTF8
	var utf8Buf = Buffer.from(str, 'utf8');
	return(common.bytesToHex(utf8Buf));
    },

    Utf8HexToStr: function(utf8Hex) {
	var utf8Buf = common.hexToBytes(utf8Hex);
	//javascript encodes strings as UCS2, so convert from UTF8
	return(Buffer.toString('utf8'));
    },


    hexToBase64: function(hexStr) {
	//first ensure passed parm is a string
	var hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	var base64String = Buffer.from(hex, 'hex').toString('base64');
	return(base64String);
    },

    leftPadTo: function(str, desiredLen, ch) {
	var padChar = (typeof ch !== 'undefined') ? ch : ' ';
	var pad = new Array(1 + desiredLen).join(padChar);
	var padded = (pad + str.toString()).slice(-desiredLen);
	return padded;
    },

    rightPadTo: function(str, desiredLen) {
	var bigPad = '                                                                                                    ';
	return((str + bigPad).slice(0, desiredLen));
    },

    setIndexedFlag: function(prefix, index, flag) {
	var wordIdx = Math.floor(index / 48);
	var bitIdx = index % 48;
	var wordIdxStr = '0x' + wordIdx.toString(16)
	var wordStr = localStorage[prefix + '-' + wordIdxStr];
	//console.log('setIndexedFlag: flag = ' + flag + ', wordStr = ' + wordStr + ', bitIdx = ' + bitIdx);
	var word = (!!wordStr) ? parseInt(wordStr) : 0;
	if (!!flag)
	    word |= (1 << bitIdx);
	else
	    word &= ~(1 << bitIdx);
	wordStr = '0x' + word.toString(16);
	localStorage[prefix + '-' + wordIdxStr] = '0x' + word.toString(16);
	//console.log('setIndexedFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = ' + wordStr);
    },

    chkIndexedFlag: function(prefix, index) {
	var wordIdx = Math.floor(index / 48);
	var bitIdx = index % 48;
	var wordIdxStr = '0x' + wordIdx.toString(16)
	var wordStr = localStorage[prefix + '-' + wordIdxStr];
	console.log('chkIndexedFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = ' + wordStr);
	var word = (!!wordStr) ? parseInt(wordStr) : 0;
	var flag = (word & (1 << bitIdx)) ? true : false;
	return(flag);
    },


    //find the index of the first flag that is z or nz, starting with begIndex, goin forward or backwards
    //to endIndex. returns -1 if no flag found.
    findIndexedFlag: function(prefix, begIndex, endIndex, nz) {
	var allOnes = (1 << 48) - 1;
	var increment = (endIndex > begIndex) ? 1 : -1;
	var wordIdx = Math.floor(begIndex / 48);
	var bitIdx = begIndex % 48;
	do {
	    var wordIdxStr = '0x' + wordIdx.toString(16)
	    var wordStr = localStorage[prefix + '-' + wordIdxStr];
	    var word = (!!wordStr) ? parseInt(wordStr) : 0;
	    console.log('findFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = 0x' + word.toString(16));
	    if ((!!nz && word != 0) || (!nz && (word & allOnes) != allOnes)) {
		do {
		    if ((!!nz && (word & (1 << bitIdx)) != 0) ||
			( !nz && (word & (1 << bitIdx)) == 0) ) {
			var foundIdx = wordIdx * 48 + bitIdx;
			console.log('findFlag: foundIdx = ' + foundIdx);
			return((increment > 0 && foundIdx <= endIndex) ||
			       (increment < 0 && foundIdx >= endIndex) ? foundIdx : -1);
		    }
		    bitIdx += increment;
		} while ((increment > 0 && bitIdx < 48) || (increment < 0 && bitIdx >= 0));
		//first time through it's possible to fall out, if the nz bit was
		//lt the start bitIdx
	    }
	    bitIdx = (increment > 0) ? 0 : 47;
	    wordIdx += increment;
	} while ((increment > 0 &&  wordIdx      * 48 < endIndex) ||
		 (increment < 0 && (wordIdx + 1) * 48 > endIndex));
	return(-1);
    },


    //
    // query string: ?foo=lorem&bar=&baz
    // var foo = getUrlParameterByName('foo'); // "lorem"
    // var bar = getUrlParameterByName('bar'); // "" (present with empty value)
    // var baz = getUrlParameterByName('baz'); // "" (present with no value)
    // var qux = getUrlParameterByName('qux'); // null (absent)
    //
    getUrlParameterByName: function(url, name) {
	url = url.toLowerCase();
        name = name.replace(/[\[\]]/g, "\\$&");
	name = name.toLowerCase();
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        var value = decodeURIComponent(results[2].replace(/\+/g, " "));
        return value;
    },


    fetch: function(url, callback) {
	var timeout = false;
	var complete = false;
	var fetch_timer = setTimeout(function() {
	    timeout = true;
	    if (complete == true) {
		return;
	    } else {
		console.log("common.fetch: timeout retrieving " + url);
		callback("", "timeout");
	    }
	}, 15000);
	console.log('common.fetch: fetching ' + url);
	var request = new Request(url);
	fetch(request, { mode: 'cors'} ).then(function(resp) {
	    console.log('common.fetch: got resp = ' + resp + ', status = ' + resp.status + ', (' + resp.statusText + ')');
	    clearTimeout(fetch_timer);
	    complete = true;
	    if (timeout == true) {
		console.log("common.fetch: fetch returned after timeout! url = " + url);
		return;
	    }
	    if (resp.ok) {
		resp.text().then(function(str) {
		    callback(str, "");
		});
	    } else {
		console.log("common.fetch: got err = " + resp.blob());
		callback("", "unknown");
	    }
	}).catch(function(error) {
	    console.log("common.fetch: exeption = " + error);
	    complete = true;
	    callback("", error);
	});
    },

};
