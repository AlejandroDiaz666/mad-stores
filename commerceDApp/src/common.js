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
	//console.log('hexToBytes: ' + hexStr);
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
	//console.log('bytesToHex: ' + hex);
	return(hex);
    },


    strToUtf8Bytes: function(str) {
	//javascript encodes strings as UCS2... convert to a buffer of UTF8
	var utf8Buf = Buffer.from(str, 'utf8');
	return(utf8Buf);
    },

    Utf8BytesToStr: function(utf8Bytes) {
	//javascript encodes strings as UCS2, so convert from UTF8
	var utf8Buf = Buffer.from(utf8Bytes);
	return(utf8Buf.toString('utf8'));
    },

    strToUtf8Hex: function(str) {
	//javascript encodes strings as UCS2, so for convert to a buffer of UTF8
	var utf8Buf = Buffer.from(str, 'utf8');
	return(common.bytesToHex(utf8Buf));
    },

    Utf8HexToStr: function(utf8Hex) {
	//javascript encodes strings as UCS2. use Buffer.toString to convert from utf8
	var utf8Buf = Buffer.from(common.hexToBytes(utf8Hex));
	return(utf8Buf.toString('utf8'));
    },


    hexToBase64: function(hexStr) {
	//first ensure passed parm is a string
	var hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	var base64String = Buffer.from(hex, 'hex').toString('base64');
	return(base64String);
    },


    // html image data used for img tag (<img src='image-data'>) is eg.
    //  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...'
    // that is, ~20 bytes of text, followed by a comma, followed by base64 data. while we could store the whole thing as utf8,
    // that would be wasteful. so we we create our own custom format. the first byte is the length of the text (utf data), up
    // to and including the comma. followed by the utf8 encoded text, followed by the image data as a byte-stream.
    imageToBytes: function(image) {
	//console.log('imageToBytes: image = ' + image);
	var utf8Len = image.indexOf(',') + 1;
	var utf8Str = image.substring(0, utf8Len);
	//console.log('imageToBytes: utf8Str = ' + utf8Str);
	var utf8Bytes = new Uint8Array(Buffer.from(utf8Str, 'utf8'));
	var base64Str = image.substring(utf8Len);
	var imageBuf = Buffer.from(base64Str, 'base64')
	//every 4 base64 chars is 24 bits
	var bytes = new Uint8Array(1 + utf8Len + (base64Str.length / 4) * 3);
	bytes.set([ utf8Len ]);
	bytes.set(utf8Bytes, 1);
	bytes.set(imageBuf, 1 + utf8Bytes.length);
	//console.log('imageToBytes: bytes = ' + bytes);
	//console.log('imageToBytes: bytes.length = ' + bytes.length);
	return(bytes);
    },

    bytesToImage: function(bytes) {
	var utf8Bytes = bytes.slice(1, bytes[0] + 1);
	var utf8Str = Buffer.from(utf8Bytes).toString('utf8');
	//console.log('bytesToImage: utf8Str = ' + utf8Str);
	var imageBytes = bytes.slice(bytes[0] + 1);
	var base64Str = Buffer.from(imageBytes).toString('base64');
	var image = utf8Str + base64Str;
	//console.log('bytesToImage: image = ' + image);
	return(image);
    },

    hexToImage: function(utf8Hex) {
	var utf8Buf = Buffer.from(common.hexToBytes(utf8Hex));
	return(common.bytesToImage(utf8Buf));
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


    /* ------------------------------------------------------------------------------------------------------------------
       common display-related functions
       ------------------------------------------------------------------------------------------------------------------ */
    /*
    addTileToCenterTableDiv: function() {
	console.log('common.addTileToCenterTableDiv');
	var img = document.createElement("img").classname = 'tileImg';
	img.src="images/logo.png";
	img.alt = 'tile image here';
	var div = document.createElement("div");
	var centerTableDiv = document.getElementById('centerTableDiv');
	centerTableDiv.appendChild(img);
    },
    */

    //
    // as a convenience, in case an error has already occurred (for example if the user rejects the transaction), you can
    // call this fcn with the error message and no txid.
    //
    waitForTXID: function(err, txid, desc, statusDiv, continuationMode, callback) {
	//
	common.setMenuButtonState('shopButton',          'Disabled');
	common.setMenuButtonState('dashboardButton',     'Disabled');
	common.setMenuButtonState('createStoreButton',   'Disabled');
	common.setMenuButtonState('createStoreRegStoreButton',    'Disabled');
	common.setMenuButtonState('createStoreAddProductButton',  'Disabled');
	common.setMenuButtonState('createStoreEditProductButton', 'Disabled');
	//status div starts out hidden
	console.log('show status div');
	statusDiv.style.display = "block";
	var leftDiv = document.createElement("div");
	leftDiv.className = 'visibleIB';
	statusDiv.appendChild(leftDiv);
	var rightDiv = document.createElement("div");
	rightDiv.className = 'visibleIB';
	statusDiv.appendChild(rightDiv);
	var statusCtr = 0;
	var statusText = document.createTextNode('No status yet...');
	leftDiv.appendChild(statusText);
	if (!!err || !txid) {
	    if (!err)
		err = 'No transaction hash was generated.';
	    statusText.textContent = 'Error in ' + desc + ' transaction: ' + err;
	    var reloadLink = document.createElement('a');
	    reloadLink.addEventListener('click', function() {
		handleUnlockedMetaMask(continuationMode);
	    });
	    reloadLink.href = 'javascript:null;';
	    reloadLink.innerHTML = "<h2>Continue</h2>";
	    reloadLink.disabled = false;
	    rightDiv.appendChild(reloadLink);
	    callback(err);
	    return;
	}
	//
	var viewTxLink = document.createElement('a');
	viewTxLink.href = 'https://' + ether.etherscanioTxStatusHost + '/tx/' + txid;
	viewTxLink.innerHTML = "<h2>View transaction</h2>";
	viewTxLink.target = '_blank';
	viewTxLink.disabled = false;
	leftDiv.appendChild(viewTxLink);
	//
	//cleared in handleUnlockedMetaMask, after the user clicks 'continue'
	common.waitingForTxid = true;
	var timer = setInterval(function() {
	    statusText.textContent = 'Waiting for ' + desc + ' transaction: ' + ++statusCtr + ' seconds...';
	    if ((statusCtr & 0xf) == 0) {
		common.web3.eth.getTransactionReceipt(txid, function(err, receipt) {
		    console.log('common.waitForTXID: err = ' + err);
		    console.log('common.waitForTXID: receipt = ' + receipt);
		    if (!!err || !!receipt) {
			if (!err && !!receipt && receipt.status == 0)
			    err = "Transaction Failed with REVERT opcode";
			statusText.textContent = (!!err) ? 'Error in ' + desc + ' transaction: ' + err : desc + ' transaction succeeded!';
			console.log('transaction is in block ' + (!!receipt ? receipt.blockNumber : 'err'));
			//statusText.textContent = desc + ' transaction succeeded!';
			clearInterval(timer);
			//
			var reloadLink = document.createElement('a');
			reloadLink.addEventListener('click', function() {
			    beginTheBeguine(continuationMode);
			});
			reloadLink.href = 'javascript:null;';
			reloadLink.innerHTML = "<h2>Continue</h2>";
			reloadLink.disabled = false;
			rightDiv.appendChild(reloadLink);
			callback(err);
			return;
		    }
		});
	    }
	}, 1000);
    },

    clearStatusDiv: function(statusDiv) {
	while (statusDiv.hasChildNodes()) {
	    statusDiv.removeChild(statusDiv.lastChild);
	}
	statusDiv.style.display = "none";
    },


    //state = 'Disabled' | 'Enabled' | 'Selected'
    setMenuButtonState: function(buttonID, state) {
	var button = document.getElementById(buttonID);
	button.disabled = (state == 'Enabled') ? false : true;
	var newClassName = 'menuBarButton' + state;
	if (button.className.indexOf('menuBarButtonDisabled') >= 0)
	    button.className = (button.className).replace('menuBarButtonDisabled', newClassName);
	else if (button.className.indexOf('menuBarButtonEnabled') >= 0)
	    button.className = (button.className).replace('menuBarButtonEnabled', newClassName);
	else if (button.className.indexOf('menuBarButtonSelected') >= 0)
	    button.className = (button.className).replace('menuBarButtonSelected', newClassName);
	else
	    button.className = (button.className).replace('menuBarButton', newClassName);
    },


    replaceElemClassFromTo: function(elemId, from, to, disabled) {
	var elem = document.getElementById(elemId);
	if (!elem)
	    console.log('could not find elem: ' + elemId);
	elem.className = (elem.className).replace(from, to);
	elem.disabled = disabled;
	return(elem);
    },

};
