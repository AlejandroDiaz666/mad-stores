/*
 * common functions -- no local dependancies here!
 */
const BN = require("bn.js");
const Buffer = require('buffer/').Buffer;
const web3Utils = require('web3-utils');

const common = module.exports = {

    web3: null,
    waitingForTxid: false,
    wdaiBalanceBN: null,
    noteOkHandler: null,

    //
    // cb(err, web3, netId)
    // if requireAcct, then not only must mm be installed, but also an acct must be unlocked
    //
    checkForMetaMask: async function(requireAcct, cb) {
	if (window.ethereum) {
	    // Modern dapp browsers...
            common.web3 = new Web3(ethereum);
	    //console.log('checkForMetaMask: found new metamask');
            try {
		// Request account access if needed
		await ethereum.enable();
		common.web3.version.getNetwork((err, netId) => {
		    if (!!err)
			cb(err, null, null)
		    else if (!!requireAcct && !web3.eth.accounts[0])
			cb('To use this utility, a MetaMask account must be unlocked', null, null);
		    else
			cb(null, common.web3, netId);
		});
	    } catch (error) {
		// User denied account access...
	        console.log('checkForMetaMask: err = ' + error.toString());
		common.web3 = null;
		cb('You must enable the MetaMask plugin to use this utility', null, null);
	    }
	} else if (typeof window.web3 !== 'undefined') {
	    // Legacy dapp browsers...
	    common.web3 = new Web3(web3.currentProvider);
	    console.log('found old metamask. provider: ' + web3.currentProvider.toString());
	    web3.version.getNetwork((err, netId) => {
		if (!!err)
		    cb(err, null, null)
		else if (!!requireAcct && !web3.eth.accounts[0])
		    cb('To use this utility, a MetaMask account must be unlocked', null, null);
		else
		    cb(null, common.web3, netId);
	    });
	} else {
	    common.web3 = null;
	    cb('You must enable the MetaMask plugin to use this utility', null, null);
	}
    },


    //number can be a number or a string, with or without '0x'
    numberToBN: function(number) {
	return(web3Utils.toBN(number));
    },

    stripNonNumber: function(number, decimalOK) {
	//first ensure passed parm is a string
	let numberStr = number.toString();
	if (numberStr.startsWith('0x')) {
	    numberStr = numberStr.substring(2);
	    numberStr = '0x' + numberStr.replace(/[^0-9a-fA-F]/g, '');
	} else {
	    if (!!decimalOK)
		numberStr = numberStr.replace(/[^0-9\.]/g, '');
	    else
		numberStr = numberStr.replace(/[^0-9]/g, '');
	}
	return(numberStr);
    },


    // value may contain a decimal point
    // returns returns null for invalid value
    decimalAndUnitsToBN: function(value, units) {
	let unitsBN = common.numberToBN(units);
	const dotIdx = value.indexOf('.');
	if (dotIdx >= 0) {
	    let endPart = '';
	    begPart = value.substring(0, dotIdx);
	    endPart = value.substring(dotIdx + 1);
	    const divisorBN = (new BN(10)).pow(new BN(endPart.length));
	    if (divisorBN.gt(unitsBN))
		return(null);
	    console.log('DecimalAndUnitToBN: divisor = ' + divisorBN.toString(10) + ', unitsBN = ' + unitsBN.toString(10));
	    value = begPart + endPart;
	    unitsBN = unitsBN.div(divisorBN);
	    console.log('DecimalAndUnitToBN: now unitsBN = ' + unitsBN.toString(10));
	}
	const valueBN = common.numberToBN(value);
	return(valueBN.mul(unitsBN));
    },


    //number can be a BN, number or a string, with or without '0x'
    //Hex256 string will be '0x' followed by 64 hex digits
    numberToHex256: function(number) {
	if (typeof(number) === 'number')
	    return('0x' + common.leftPadTo(number.toString(16), 64, '0'));
	const bn = common.numberToBN(number);
	return(common.BNToHex256(bn));
    },


    //Hex256 string will be '0x' followed by 64 hex digits
    BNToHex256: function(xBN) {
	return('0x' + common.leftPadTo(xBN.toString(16), 64, '0'));
    },


    hexToAscii: function(hexStr) {
	//console.log('hexToAscii');
	//first ensure passed parm is a string
	let hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	let str = '';
	for (let i = 0; i < hex.length; i += 2)
	    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
    },


    hexToBytes: function(hexStr) {
	//console.log('hexToBytes: ' + hexStr);
	//first ensure passed parm is a string
	let hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0, j = 0; i < hex.length; i += 2)
	    bytes[j++] = parseInt(hex.substr(i, 2), 16);
	return bytes;
    },

    bytesToHex: function(byteArray) {
	const hex = Array.from(byteArray, function(byte) {
	    return('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('')
	//console.log('bytesToHex: ' + hex);
	return(hex);
    },


    strToUtf8Bytes: function(str) {
	//javascript encodes strings as UCS2... convert to a buffer of UTF8
	const utf8Buf = Buffer.from(str, 'utf8');
	return(utf8Buf);
    },

    Utf8BytesToStr: function(utf8Bytes) {
	//javascript encodes strings as UCS2, so convert from UTF8
	const utf8Buf = Buffer.from(utf8Bytes);
	return(utf8Buf.toString('utf8'));
    },

    strToUtf8Hex: function(str) {
	//javascript encodes strings as UCS2, so for convert to a buffer of UTF8
	const utf8Buf = Buffer.from(str, 'utf8');
	return(common.bytesToHex(utf8Buf));
    },

    Utf8HexToStr: function(utf8Hex) {
	//javascript encodes strings as UCS2. use Buffer.toString to convert from utf8
	const utf8Buf = Buffer.from(common.hexToBytes(utf8Hex));
	return(utf8Buf.toString('utf8'));
    },


    hexToBase64: function(hexStr) {
	//first ensure passed parm is a string
	let hex = hexStr.toString();
	if (hex.startsWith('0x'))
	    hex = hex.substring(2);
	const base64String = Buffer.from(hex, 'hex').toString('base64');
	return(base64String);
    },


    // html image data used for img tag (<img src='image-data'>) is eg.
    //  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACx1BMV...'
    // that is, ~20 bytes of text, followed by a comma, followed by base64 data. while we could store the whole thing as utf8,
    // that would be wasteful. so we we create our own custom format. the first byte is the length of the text (utf data), up
    // to and including the comma. followed by the utf8 encoded text, followed by the image data as a byte-stream.
    imageToBytes: function(image) {
	//console.log('imageToBytes: image = ' + image);
	const utf8Len = image.indexOf(',') + 1;
	const utf8Str = image.substring(0, utf8Len);
	//console.log('imageToBytes: utf8Str = ' + utf8Str);
	const utf8Bytes = new Uint8Array(Buffer.from(utf8Str, 'utf8'));
	const base64Str = image.substring(utf8Len);
	const imageBuf = Buffer.from(base64Str, 'base64')
	//every 4 base64 chars is 24 bits
	const bytes = new Uint8Array(1 + utf8Len + (base64Str.length / 4) * 3);
	bytes.set([ utf8Len ]);
	bytes.set(utf8Bytes, 1);
	bytes.set(imageBuf, 1 + utf8Bytes.length);
	//console.log('imageToBytes: bytes = ' + bytes);
	//console.log('imageToBytes: bytes.length = ' + bytes.length);
	return(bytes);
    },

    bytesToImage: function(bytes) {
	const utf8Bytes = bytes.slice(1, bytes[0] + 1);
	const utf8Str = Buffer.from(utf8Bytes).toString('utf8');
	//console.log('bytesToImage: utf8Str = ' + utf8Str);
	const imageBytes = bytes.slice(bytes[0] + 1);
	const base64Str = Buffer.from(imageBytes).toString('base64');
	const image = utf8Str + base64Str;
	//console.log('bytesToImage: image = ' + image);
	return(image);
    },

    hexToImage: function(utf8Hex) {
	const utf8Buf = Buffer.from(common.hexToBytes(utf8Hex));
	return(common.bytesToImage(utf8Buf));
    },

    secsBNToComfortTime: function(secsBN) {
	if (secsBN.ltn(120))
	    return(secsBN.toString(10) + ' seconds');
	if (secsBN.ltn(2 * 3600))
	    return(secsBN.divn(60).toString(10) + ' minutes');
	if (secsBN.ltn(72 * 3600))
	    return(secsBN.divn(3600).toString(10) + ' hours');
	return(secsBN.divn(24*3600).toString(10) + ' days');
    },

    leftPadTo: function(str, desiredLen, ch) {
	const padChar = (typeof ch !== 'undefined') ? ch : ' ';
	const pad = new Array(1 + desiredLen).join(padChar);
	const padded = (pad + str.toString()).slice(-desiredLen);
	return padded;
    },

    rightPadTo: function(str, desiredLen, ch) {
	const padChar = (typeof ch !== 'undefined') ? ch : ' ';
	const pad = new Array(1 + desiredLen).join(padChar);
	const padded = (str.toString() + pad).slice(0, desiredLen);
	//console.log('padded = X' + padded + 'X');
	return padded;
    },

    setIndexedFlag: function(prefix, index, flag) {
	//javascript bit operations are 32 bit
	const wordIdx = Math.floor(index / 31);
	const bitIdx = index % 31;
	const wordIdxStr = '0x' + wordIdx.toString(16)
	let wordStr = localStorage[prefix + '-' + wordIdxStr];
	let word = (!!wordStr) ? parseInt(wordStr) : 0;
	if (!!flag)
	    word |= (1 << bitIdx);
	else
	    word &= ~(1 << bitIdx);
	wordStr = '0x' + word.toString(16);
	localStorage[prefix + '-' + wordIdxStr] = '0x' + word.toString(16);
	//console.log('setIndexedFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = ' + wordStr);
    },

    chkIndexedFlag: function(prefix, index) {
	const wordIdx = Math.floor(index / 31);
	const bitIdx = index % 31;
	const wordIdxStr = '0x' + wordIdx.toString(16)
	const wordStr = localStorage[prefix + '-' + wordIdxStr];
	console.log('chkIndexedFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = ' + wordStr);
	const word = (!!wordStr) ? parseInt(wordStr) : 0;
	const flag = (word & (1 << bitIdx)) ? true : false;
	return(flag);
    },


    //find the index of the first flag that is z or nz, starting with begIndex, goin forward or backwards
    //to endIndex. returns -1 if no flag found.
    findIndexedFlag: function(prefix, begIndex, endIndex, nz) {
	console.log('findIndexedFlag: begIndex = ' + begIndex + ', endIndex = ' + endIndex + ', nz = ' + nz);
	const allOnes = 0x7fffffff;
	const increment = (endIndex > begIndex) ? 1 : -1;
	let wordIdx = Math.floor(begIndex / 31);
	let bitIdx = begIndex % 31;
	do {
	    const wordIdxStr = '0x' + wordIdx.toString(16)
	    const wordStr = localStorage[prefix + '-' + wordIdxStr];
	    const word = (!!wordStr) ? parseInt(wordStr) : 0;
	    console.log('findFlag: localStorage[' + prefix + '-' + wordIdxStr + '] = 0x' + word.toString(16));
	    if ((!!nz && word != 0) || (!nz && (word & allOnes) != allOnes)) {
		do {
		    if ((!!nz && (word & (1 << bitIdx)) != 0) ||
			( !nz && (word & (1 << bitIdx)) == 0) ) {
			const foundIdx = wordIdx * 31 + bitIdx;
			console.log('findFlag: foundIdx = ' + foundIdx);
			return((increment > 0 && foundIdx <= endIndex) ||
			       (increment < 0 && foundIdx >= endIndex) ? foundIdx : -1);
		    }
		    bitIdx += increment;
		} while ((increment > 0 && bitIdx < 31) || (increment < 0 && bitIdx >= 0));
		//first time through it's possible to fall out, if the nz bit was
		//lt the start bitIdx
	    }
	    bitIdx = (increment > 0) ? 0 : 30;
	    wordIdx += increment;
	} while ((increment > 0 &&  wordIdx      * 31 < endIndex) ||
		 (increment < 0 && (wordIdx + 1) * 31 > endIndex));
	return(-1);
    },


    // index,value can be numbers or BNs
    setIndexedBN: function(prefix, index, value) {
	const idxBN = common.numberToBN(index);
	const valBN = common.numberToBN(value);
	const valStr = '0x' + valBN.toString(16);
	const idxStr = prefix + '-' + '0x' + idxBN.toString(16);
	localStorage[idxStr] = valStr;
	console.log('setIndexedHex256: localStorage[' + idxStr + '] = ' + valStr);
    },

    // index,value can be numbers or BNs
    getIndexedBN: function(prefix, index) {
	const idxBN = common.numberToBN(index);
	const idxStr = prefix + '-' + '0x' + idxBN.toString(16);
	const valStr = localStorage[idxStr];
	const value = !!valStr ? valStr : '0';
	return(common.numberToBN(value));
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
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        const results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        const value = decodeURIComponent(results[2].replace(/\+/g, " "));
        return value;
    },


    fetch: function(url, extraOptions, callback) {
	let timeout = false;
	let complete = false;
	const fetch_timer = setTimeout(function() {
	    timeout = true;
	    if (complete == true) {
		return;
	    } else {
		console.log("common.fetch: timeout retrieving " + url);
		callback("", "timeout");
	    }
	}, 15000);
	console.log('common.fetch: fetching ' + url);
	const request = new Request(url);
	const options = { mode: 'cors'};
	Object.assign(options, extraOptions);
	fetch(request, options).then(function(resp) {
	    //console.log('common.fetch: got resp = ' + resp + ', status = ' + resp.status + ', (' + resp.statusText + ')');
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
    //
    // as a convenience, in case an error has already occurred (for example if the user rejects the transaction), you can
    // call this fcn with the error message and no txid.
    //
    // cb(err, receipt)
    // continueFcn(err, receipt)
    // note: the callback is called after the transaction is mined;
    //       the continueFcn is called after the user clicks continue
    // a div with id = statusDiv must exist. in addition classes "statusDivHide" and "statusDivShow" must exist.
    // we do not clear the status div.. so you need to do that in either the callback or the continueFcn
    //
    waitForTXID: function(err, txid, desc, continueFcn, txStatusHost, cb) {
	console.log('waitForTXID');
	const statusDiv = common.replaceElemClassFromTo('statusDiv', 'statusDivHide', 'statusDivShow', true);
	const statusCtrDiv = document.createElement("div");
	statusCtrDiv.id = 'statusCtrDiv';
	statusCtrDiv.className = 'visibleB';
	statusDiv.appendChild(statusCtrDiv);
	const viewLinkDiv = document.createElement("div");
	viewLinkDiv.id = 'statusViewLinkDiv';
	viewLinkDiv.className = 'visibleB';
	statusDiv.appendChild(viewLinkDiv);
	const continueDiv = document.createElement("div");
	continueDiv.id = 'statusContinueDiv';
	continueDiv.className = 'visibleB';
	statusDiv.appendChild(continueDiv);
	let statusCtr = 0;
	const statusText = document.createTextNode('No status yet...');
	statusCtrDiv.appendChild(document.createElement("p")).appendChild(statusText);
	if (!!err || !txid) {
	    if (!err)
		err = 'No transaction hash was generated.';
	    statusText.textContent = 'Error in ' + desc + ' transaction: ' + err;
	    if (!!continueFcn) {
		const reloadLink = document.createElement('a');
		reloadLink.addEventListener('click', () => continueFcn(err, null));
		reloadLink.href = 'javascript:null;';
		reloadLink.innerHTML = "<h2>Continue</h2>";
		reloadLink.disabled = false;
		continueDiv.appendChild(reloadLink);
	    }
	    if (!!cb)
		cb(err, null);
	    return;
	}
	//
	const viewTxLink = document.createElement('a');
	viewTxLink.id = 'statusViewLink';
	viewTxLink.href = 'https://' + txStatusHost + '/tx/' + txid;
	viewTxLink.innerHTML = "<h2>View transaction</h2>";
	viewTxLink.target = '_blank';
	viewTxLink.disabled = false;
	viewLinkDiv.appendChild(viewTxLink);
	//
	const noteDiv = document.createElement("div");
	noteDiv.className = 'visibleB';
	noteDiv.id = 'statusNoteDiv';
	const noteText = document.createTextNode('Note: You cannot continue until this transaction completes... ' +
						 'If you speed up the transaction via MetaMask, then you will need to reload the page (after the transaction completes).');
	noteDiv.appendChild(document.createElement("p")).appendChild(noteText);
	statusDiv.appendChild(noteDiv);
	//
	//cleared in handleUnlockedMetaMask, after the user clicks 'continue'
	common.waitingForTxid = true;
	const timer = setInterval(function() {
	    statusText.textContent = 'Waiting for ' + desc + ' transaction: ' + ++statusCtr + ' seconds...';
	    if ((statusCtr & 0xf) == 0) {
		common.web3.eth.getTransactionReceipt(txid, function(err, receipt) {
		    console.log('common.waitForTXID: err = ' + err + ', receipt = ' + receipt + ', waitingForTxid = ' + common.waitingForTxid);
		    if (!!err || !!receipt) {
			if (!continueFcn)
			    common.waitingForTxid = false;
			if (!err && !!receipt && receipt.status == 0)
			    err = "Transaction Failed with REVERT opcode";
			statusText.textContent = (!!err) ? 'Error in ' + desc + ' transaction: ' + err : desc + ' transaction succeeded!';
			console.log('transaction is in block ' + (!!receipt ? receipt.blockNumber : 'err'));
			noteText.textContent = 'Note: it may take several minutes for changes to be reflected...';
			noteDiv.className = 'visibleB';
			clearInterval(timer);
			//
			if (!!continueFcn) {
			    const reloadLink = document.createElement('a');
			    reloadLink.addEventListener('click',  () => continueFcn(err, receipt));
			    reloadLink.href = 'javascript:null;';
			    reloadLink.innerHTML = "<h2>Continue</h2>";
			    reloadLink.disabled = false;
			    continueDiv.appendChild(reloadLink);
			}
			if (!!cb)
			    cb(err, receipt);
			return;
		    }
		});
	    }
	}, 1000);
    },


    clearDivChildren: function(div) {
	while (div.hasChildNodes())
            div.removeChild(div.lastChild);
	return(div);
    },


    // a div with id = statusDiv must exist. in addition classes "statusDivHide" and "statusDivShow" must exist.
    clearStatusDiv: function() {
	const statusDiv = common.replaceElemClassFromTo('statusDiv', 'statusDivShow', 'statusDivHide', true);
	common.clearDivChildren(statusDiv);
    },


    //display (or clear) "waiting for metamask" dialog
    // a div with id = metaMaskDiv must exist. in addition classes "metaMaskDivHide" and "metaMaskDivShow" must exist.
    showWaitingForMetaMask: function(show, pulse) {
	const metaMaskModal = document.getElementById('metaMaskDiv');
	if (!!show) {
	    common.replaceElemClassFromTo('metaMaskDiv', 'metaMaskDivHide', 'metaMaskDivShow', true);
	    if (!!pulse)
		common.replaceElemClassFromTo('metaMaskDiv', 'metaMaskNoPulse', 'metaMaskPulse', null);
	    else
		common.replaceElemClassFromTo('metaMaskDiv', 'metaMaskPulse', 'metaMaskNoPulse', null);
	} else {
	    common.replaceElemClassFromTo('metaMaskDiv', 'metaMaskDivShow', 'metaMaskDivHide', null);
	    common.replaceElemClassFromTo('metaMaskDiv', 'metaMaskPulse', 'metaMaskNoPulse', null);
	}
    },


    // start or stop the wait/loading icon
    // an elem with id waitIcon must exist
    setLoadingIcon: function(start) {
	const waitIcon = document.getElementById('waitIcon');
	waitIcon.style.display = (!!start) ? 'block' : 'none';
    },

    makeTextarea: function(id, className, disabled) {
	const textarea = document.createElement("textarea")
	if (!!id)
	    textarea.id = id;
	if (!!className)
	    textarea.className = className;
	textarea.rows = 1;
	textarea.readonly = 'readonly';
	if (!!disabled)
	    textarea.disabled = 'disabled';
	textarea.value = '';
	return(textarea);
    },

    makeButton: function(id, value, className, fcn) {
	const button = document.createElement("button")
	if (!!id)
	    button.id = id;
	if (!!value)
	    button.textContent = value;
	if (!!className)
	    button.className = className;
	if (!!fcn)
	    button.addEventListener('click', fcn);
	else
	    button.disabled = true;
    },


    //state = 'Disabled' | 'Enabled' | 'Selected'
    setButtonState: function(baseName, buttonID, state) {
	const button = document.getElementById(buttonID);
	button.disabled = (state == 'Enabled') ? false : true;
	const newClassName = baseName + state;
	if (button.className.indexOf(baseName + 'Disabled') >= 0)
	    button.className = (button.className).replace(baseName + 'Disabled', newClassName);
	else if (button.className.indexOf(baseName + 'Enabled') >= 0)
	    button.className = (button.className).replace(baseName + 'Enabled', newClassName);
	else if (button.className.indexOf(baseName + 'Selected') >= 0)
	    button.className = (button.className).replace(baseName + 'Selected', newClassName);
	else
	    button.className = (button.className).replace(baseName, newClassName);
    },


    //state = 'Disabled' | 'Enabled' | 'Selected'
    setMenuButtonState: function(buttonID, state) {
	common.setButtonState('menuBarButton', buttonID, state);
    },


    replaceClassFromTo: function(elem, from, to, disabled) {
	elem.className = (elem.className).replace(from, to);
	elem.disabled = disabled;
	return(elem);
    },


    replaceElemClassFromTo: function(elemId, from, to, disabled) {
	const elem = document.getElementById(elemId);
	if (!elem)
	    console.log('replaceElemClassFromTo: could not find elem: ' + elemId);
	return(common.replaceClassFromTo(elem, from, to, disabled));
    },


    setElemClassToOneOf: function(elemId, a, b, desired) {
	const elem = document.getElementById(elemId);
	if (!elem)
	    console.log('setElemClassToOneOf: could not find elem: ' + elemId);
	if (elem.className.indexOf(a) >= 0)
	    elem.className = (elem.className).replace(a, desired);
	else if (elem.className.indexOf(b) >= 0)
	    elem.className = (elem.className).replace(b, desired);
	return(elem);
    },

    /** Function that count occurrences of a substring in a string;
     * @param {String} str                  The string
     * @param {String} subStr               The sub string to search for
     * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
     *
     * @author Vitim.us https://gist.github.com/victornpb/7736865
     * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
     * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
     */
    occurrences: function(str, subStr, allowOverlapping) {
	str += "";
	subStr += "";
	if (subStr.length <= 0)
	    return (str.length + 1);
	let n = 0;
	let pos = 0;
	let step = allowOverlapping ? 1 : subStr.length;
	while (true) {
            pos = str.indexOf(subStr, pos);
            if (pos >= 0) {
		++n;
		pos += step;
            } else break;
	}
	return n;
    },


    isOverflown: function(elem) {
	return elem.scrollHeight > elem.clientHeight || elem.scrollWidth > elem.clientWidth;
    },


    // returns true if content was abbreviated
    abbreviateElemContent: function(elem, str) {
	elem.textContent = str;
	if (common.isOverflown(elem)) {
	    let limit = str.length - 5;
	    while (common.isOverflown(elem) && limit >= 0)
		elem.textContent = str.substring(0, limit--) + '...';
	    return true;
	}
	return false;
    },

    //
    // abbreviateAddrForEns
    // helper for handleUnlockedMetaMask
    //
    abbreviateAddrForEns: function(addr, ensName, nominalEnsLength) {
	let addrNumericStr = addr;
	if (!!ensName && ensName.length >= nominalEnsLength) {
	    console.log('abbreviateAddrForEns: ensName = ' + ensName);
	    // normal length of addr is '0x' + 40 chars. field can fit '(0x' + 40 + ') ' + nominalEnsLength ens
	    // or replace addr chars with XXXX...XXXX
	    const noAddrChars = Math.max( 40 - (((ensName.length - nominalEnsLength) + 3 + 1) & 0xfffe), 6);
	    const cut = 40 - noAddrChars;
	    console.log('abbreviateAddrForEns: ensName.length = ' + ensName.length + ', cut = ' + cut);
	    const remain2 = (40 - cut) / 2;
	    console.log('abbreviateAddrForEns: remain2 = ' + remain2);
	    addrNumericStr = addr.substring(0, 2 + remain2) + '...' + addr.substring(2 + 40 - remain2);
	}
	return(ensName + ' (' + addrNumericStr + ')');
    },

};
