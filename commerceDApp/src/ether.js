
//
// fcns related to ethereum, nonspecific to any particular contract
//
const common = require('./common');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");
var ENS = require('ethereum-ens');

const ether = module.exports = {

    etherscanioHost: '',
    infuraioHost: '',
    //tx status host for user to check status of transactions
    etherscanioTxStatusHost: '',
    etherscanioHost_kovan: 'api-kovan.etherscan.io',
    etherscanioTxStatusHost_kovan: 'kovan.etherscan.io',
    etherscanioHost_ropsten: 'api-ropsten.etherscan.io',
    etherscanioTxStatusHost_ropsten: 'ropsten.etherscan.io',
    etherscanioHost_main: 'api.etherscan.io',
    etherscanioTxStatusHost_main: 'etherscan.io',
    infuraioHost_kovan: 'kovan.infura.io',
    infuraioHost_ropsten: 'ropsten.infura.io',
    infuraioProjectID: 'd31bddc6dc8e47d29906cee739e4fe7f',
    kweiHex: '3E8',
    mweiHex: 'F4240',
    gweiHex: '3B9ACA00',
    szaboHex: 'E8D4A51000',
    finneyHex: '38D7EA4C68000',
    etherHex: 'DE0B6B3A7640000',
    getLogsTimestamp: 0,
    getLogsTimer: null,
    chainId: 0,
    //node = 'etherscan.io' | 'infura.io' | 'metamask'
    node: 'metamask',
    ens: null,


    //cb(err, network)
    getNetwork: function(cb) {
	let network = 'Unknown Network';
	common.web3.version.getNetwork((err, netId) => {
	    ether.chainId = netId;
	    switch (netId) {
	    case "1":
		network = 'Mainnet';
		console.log('This is mainnet')
		ether.etherscanioHost = ether.etherscanioHost_main;
		ether.etherscanioTxStatusHost = ether.etherscanioTxStatusHost_main;
		ether.infuraioHost = ether.infuraioHost_main;
		break
	    case "2":
		network = 'Morden test network';
		console.log('This is the deprecated Morden test network.')
		break
	    case "3":
		network = 'Ropsten test network';
		console.log('This is the ropsten test network.')
		ether.etherscanioHost = ether.etherscanioHost_ropsten;
		ether.etherscanioTxStatusHost = ether.etherscanioTxStatusHost_ropsten;
		ether.infuraioHost = ether.infuraioHost_ropsten;
		break
	    case "4":
		network = 'Rinkeby test network';
		console.log('This is the Rinkeby test network.')
		break
	    case "42":
		network = 'Kovan test network';
		console.log('This is the Kovan test network.')
		ether.etherscanioHost = ether.etherscanioHost_kovan;
		ether.etherscanioTxStatusHost = ether.etherscanioTxStatusHost_kovan;
		ether.infuraioHost = ether.infuraioHost_kovan;
		break
	    default:
		console.log('This is an unknown network.')
	    }
	    cb(null, network);
	});
    },

    //convert an amount in wei to a comfortable representation
    //for example: 1000000000000 => '1 gwei'
    convertWeiBNToComfort: function(weiBN) {
	let units =
	    (weiBN.lt(new BN(ether.gweiHex, 16)))   ? 'Wei'    :
	    (weiBN.lt(new BN(ether.szaboHex, 16)))  ? 'Gwei'   :
	    (weiBN.lt(new BN(ether.finneyHex, 16))) ? 'Szabo'  :
	    (weiBN.lt(new BN(ether.etherHex, 16)))  ? 'Finney' : 'ether';
	//console.log('convertWeiBNToComfort: weiBN = ' + weiBN.toString(10) + ', units = ' + units);
	return(common.web3.fromWei(weiBN, units).toString() + ' ' + (units == 'ether' ? 'Eth' : units));
    },


    //numberAndUnits eg. 5 => { index: 0, multiplyer: 1, number: 5, units: 'Wei' }
    //number will have 3 decimal places at most
    convertWeiBNToNumberAndUnits: function(weiBN) {
	const numberAndUnits = {};
	let multiplyer;
	//console.log('convertWeiToNumberAndUnits: weiBN = ' + weiBN.toString(10));
	if (weiBN.lt(new BN(ether.kweiHex, 16))) {
	    numberAndUnits.index = 0;
	    numberAndUnits.multiplyer = '1';
	    numberAndUnits.units = 'Wei';
	} else if (weiBN.lt(new BN(ether.mweiHex, 16))) {
	    numberAndUnits.index = 1;
	    numberAndUnits.multiplyer = '1000';
	    numberAndUnits.units = 'Kwei';
	} else if (weiBN.lt(new BN(ether.gweiHex, 16))) {
	    numberAndUnits.index = 2;
	    numberAndUnits.multiplyer = '1000000';
	    numberAndUnits.units = 'Mwei';
	} else if (weiBN.lt(new BN(ether.szaboHex, 16))) {
	    numberAndUnits.index = 3;
	    numberAndUnits.multiplyer = '1000000000';
	    numberAndUnits.units = 'Gwei';
	} else if (weiBN.lt(new BN(ether.finneyHex, 16))) {
	    numberAndUnits.index = 4;
	    numberAndUnits.multiplyer = '1000000000000';
	    numberAndUnits.units = 'Szabo';
	} else if (weiBN.lt(new BN(ether.etherHex, 16))) {
	    numberAndUnits.index = 5;
	    numberAndUnits.multiplyer = '1000000000000000';
	    numberAndUnits.units = 'Finney';
	} else {
	    numberAndUnits.index = 6;
	    numberAndUnits.multiplyer = '1000000000000000000';
	    numberAndUnits.units = 'Eth';
	}
	//console.log('convertWeiToNumberAndUnits: units = ' + numberAndUnits.units);
	//console.log('convertWeiToNumberAndUnits: multiplyer = ' + numberAndUnits.multiplyer);
	const multiplyerBN = new BN(numberAndUnits.multiplyer, 10);
	const whole = weiBN.div(multiplyerBN).toNumber();
	console.log('convertWeiToNumberAndUnits: whole = ' + whole);
	//3 digit fraction
	const frac = parseInt(weiBN.mod(multiplyerBN).toNumber().toString(10).slice(0,3)) / 1000;
	//console.log('convertWeiToNumberAndUnits: frac = ' + frac);
	//console.log('convertWeiToNumberAndUnits: number = ' + (whole + frac));
	numberAndUnits.number = whole + frac;
	return(numberAndUnits);
    },

    validateAddr: function (addr) {
	if (!addr.startsWith('0x'))
	    return(false);
	if (!addr.length == 42)
	    return(false);
	//see EIP44
	if (!/^(0x)?[0-9a-f]{40}$/i.test(addr)) {
            // check if it has the basic requirements of an address
            return false;
	} else if (/^(0x)?[0-9a-f]{40}$/.test(addr) || /^(0x)?[0-9A-F]{40}$/.test(addr)) {
            // If it's all small caps or all upper caps, return true
            return true;
	} else {
	    // Check each case
	    addr = addr.replace('0x','');
	    let addressHash = common.web3.sha3(addr.toLowerCase());
	    addressHash = addressHash.replace('0x','');
	    for (let i = 0; i < 40; i++ ) {
		// the nth letter should be uppercase if the nth digit of casemap is 1
		if ((parseInt(addressHash[i], 16) > 7 && addr[i].toUpperCase() !== addr[i]) || (parseInt(addressHash[i], 16) <= 7 && addr[i].toLowerCase() !== addr[i])) {
		    console.log('addr = ' + addr + ', addressHash = ' + addressHash);
		    console.log('at index ' + i + ': ' + addressHash[i] + ' is not correct');
		    return false;
		}
	    }
	    return true;
	}
    },


    //
    // compare function to sort addresses
    // call eg. acctList.sort(ether.addressCompare);
    //
    addressCompare: function(a, b) {
	if (a.startsWith('0x'))
	    a = a.substring(2);
	if (b.startsWith('0x'))
	    b = b.substring(2);
	const bigA = new BN(a, 16);
	const bigB = new BN(b, 16);
	return(bigA.ucmp(bigB));
    },


    //
    // units: 'szabo' | 'finney' | 'ether'
    // cb(err, balance)
    //
    getBalance: function(units, cb) {
	common.web3.eth.getBalance(common.web3.eth.accounts[0], function (err, balance) {
	    console.log('getBalance bal = ' + balance.toString() + ', type = ' + typeof(balance));
	    cb(null, common.web3.fromWei(balance, units).toString());
	});
    },


    //
    // cb(err, txid)
    // units: 'wei' | 'szabo' | 'finney' | 'ether'
    //
    send: function(to_addr, size, units, data, gasLimit, cb) {
	const tx = {};
	tx.from = common.web3.eth.accounts[0];
	tx.value = common.web3.toWei(size, units);
	tx.to = to_addr,
	tx.data = data;
	if (gasLimit > 0)
	    tx.gas = gasLimit;
	console.log('ether.send: calling sendTransaction; tx.value = ' + tx.value);
	common.web3.eth.sendTransaction(tx, cb)
    },


    //
    // cb(err, txid, contractInstace)
    // note that the contract.new callback fires twice. see:
    //  https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethcontract
    // use the txid from the first; get the contract address from the transaction receipt; ignore the second callback
    //
    deployContract: function(abi, bin, parmsHex, gasLimit, cb) {
	parmsHex = ethUtils.stripHexPrefix(parmsHex);
	var contract = common.web3.eth.contract(JSON.parse(abi));
	console.log('ether.deployContract: contract: ' + contract);
	console.log('ether.deployContract: bin: ' + bin);
	var tx = {};
	tx.from = common.web3.eth.accounts[0];
	tx.value = 0;
	tx.data = bin + parmsHex;
	common.web3.eth.estimateGas(tx, function(err, estimatedGas) {
	    console.log('ether.deployContract: estimated gas = ' + estimatedGas);
	    tx.gas = (!!gasLimit) ? gasLimit : Math.floor(estimatedGas * 1.1);
	    //note: the returned myContractReturned === myContract
	    var myContractReturned = contract.new(tx, function(err, myContract) {
		if (!!err) {
		    console.log('ether.deployContract: err = ' + err);
		    !!cb && cb(err, null, null);
		} else {
		    console.log('ether.deployContract: txid = ' + myContract.transactionHash);
		    !!cb && cb(null, myContract.transactionHash, myContract);
		}
		cb = null;
	    });
	});
    },


    // cb(err, result)
    // options: fromBlock, toBlock, address, topics[]
    //
    getLogs: function (options, cb) {
	serialGetLogs(1, options, cb);
    },

    // cb(err, result)
    // options: fromBlock, toBlock, address, topics[]
    //
    //
    // this is a hacky hack to get events logs mathcing a) one signature (in topic0), plus any one of 3
    // id's (in topics 1,2,3). because of the different ways of specifying 'or' conditions in eth_getlogs
    // we re-jigger the options according to which node we're using.
    //
    getLogs3: function(options, cb) {
	serialGetLogs(3, options, cb);
    },


    //cb(err, addr)
    ensLookup: function(addrIn, cb) {
	if (!ether.ens)
	    ether.ens = new ENS(common.web3.currentProvider);
	if (addrIn.startsWith('0x') || !addrIn.endsWith('.eth')) {
	    cb('Error: invalid Ethereum address.', null);
	    return;
	}
	ether.ens.resolver(addrIn).addr().then((addr) => {
	    cb(null, addr);
	}, (err) => {
	    cb(err, null);
	});
    },


    //extract hex data from the data part of an event log
    //offsetOfOffset is an offset into the hex, 0x-prefixed data string. at that offset is the bytes offset of the desired
    //item. the item is prefixed with a 32 byte length.
    extractHexData: function(data, offsetOfOffset) {
	const itemOffset = parseInt(data.slice(offsetOfOffset, offsetOfOffset+64), 16);
	const itemLen    = parseInt(data.slice(2+(2*itemOffset), 2+(2*itemOffset)+64), 16);
	const itemHex = '0x' + data.slice(2+(2*itemOffset)+64, 2+(2*itemOffset)+64+(itemLen*2));
	return(itemHex);
    },

};


//
// following is to serialize and pace calls to getLogs, getLogs3, to ensure that we don't overwhelm the provider node
// (and more importantly, to ensure that we don't get grey-listed)
//
var getLogsList = [];
function GetLogsInfo(flavor, options, cb) {
    this.flavor = flavor;
    this.options = options;
    this.cb = cb;
}

// cb(err, result)
// flavor = 3 => getLogs3, otherwise getLogs
function serialGetLogs(flavor, options, cb) {
    const getLogsInfo = new GetLogsInfo(flavor, options, cb);
    getLogsList.push(getLogsInfo);
    if (getLogsList.length == 1)
	getLogsNext();
}

function getLogsNext() {
    if (getLogsList.length > 0) {
	const now_ms = Date.now();
	const elapsed_ms = now_ms - ether.getLogsTimestamp;
	if (elapsed_ms < 2000) {
	    if (!!ether.getLogsTimer)
		clearTimeout(ether.getLogsTimer);
	    ether.getLogsTimer = setTimeout(getLogsNext, 200 + 2000 - elapsed_ms);
	} else {
	    const getLogsInfo = getLogsList[0];
	    if (getLogsInfo.flavor == 3) {
		getLogs3Guts(getLogsInfo.options, function(err, result) {
		    //even thought getLogs3Guts is complete, we don't delete the head entry from the getLogsList, until we
		    //are ready to process the next entry. this is to prevent any intervening calls to serialGetLogs3, which
		    //would have also called getLogs3Next
		    getLogsInfo.cb(err, result);
		    getLogsList.splice(0, 1);
		    if (getLogsList.length > 0)
			getLogsNext();
		});
	    } else {
		getLogsGuts(getLogsInfo.options, function(err, result) {
		    getLogsInfo.cb(err, result);
		    getLogsList.splice(0, 1);
		    if (getLogsList.length > 0)
			getLogsNext();
		});
	    }
	}
    }
}


// cb(err, result)
// options: fromBlock, toBlock, address, topics[]
//
function getLogsGuts(options, cb) {
    console.log('ether.getLogsGuts: ether.node = ' + ether.node);
    if (ether.node == 'metamask') {
        const filter = common.web3.eth.filter(options);
	filter.get(cb);
	filter.stopWatching();
	return;
    }
    let url;
    if (ether.node == 'etherscan.io') {
	url = 'https://' + ether.etherscanioHost   +
	    '/api?module=logs&action=getLogs'          +
	    '&fromBlock=' + options.fromBlock          +
	    '&toBlock=' + options.toBlock              +
	    '&address=' + options.address              +
	    '&topic0=' + options.topics[0];
	if (options.topics.length > 1) {
	    if (!!options.topics[1])
		url += '&topic1=' + options.topics[1];
	    if (options.topics.length > 2) {
		if (!!options.topics[2])
		    url += '&topic2=' + options.topics[2];
		if (options.topics.length > 3) {
		    if (!!options.topics[3])
			url += '&topic3=' + options.topics[3];
		}
	    }
	}
	options = null;
    } else {
	url = 'https://' + ether.infuraioHost + '/v3/' + ether.infuraioProjectID;
	options.fromBlock = 'earliest';
	const paramsStr = JSON.stringify(options);
	console.log('ether.getLogs: paramsStr = ' + paramsStr);
	const body = '{"jsonrpc":"2.0","method":"eth_getLogs","params":[' + paramsStr + '],"id":1}';
	options = { method: 'post', body: body, headers: { 'Content-Type': 'application/json' } };
	console.log('ether.getLogs: body = ' + body);
    }
    common.fetch(url, options, function(str, err) {
	if (!str || !!err) {
	    if (!err)
		err = 'getLogs: error retreiving events';
	    console.log('ether.getLogs: ' + err);
	    cb(err, '');
	    return;
	}
	console.log('ether.getLogs: err = ' + err + ', str = ' + str);
	//typical (etherscan.io)
	//  { "status"  : "1",
	//    "message" : "OK",
	//    "result"  : [...]
	//  }
	const eventsResp = JSON.parse(str);
	if (ether.node == 'etherscan.io' && eventsResp.status == 0 && eventsResp.message == 'No records found') {
	    //this is not an err... just no events
	    cb(err, '');
	    return;
	}
	if (ether.node == 'etherscan.io' && (eventsResp.status != 1 || eventsResp.message != 'OK')) {
	    const err = "error retreiving events: bad status (" + eventsResp.status + ", " + eventsResp.message + ")";
	    console.log('ether.getLogs: ' + err);
	    cb(err, '');
	    return;
	}
	cb(null, eventsResp.result);
    });
}


// cb(err, result)
// options: fromBlock, toBlock, address, topics[]
//
//
// this is a hacky hack to get events logs mathcing a) one signature (in topic0), plus any one of 3
// id's (in topics 1,2,3). because of the different ways of specifying 'or' conditions in eth_getlogs
// we re-jigger the options according to which node we're using.
//
function getLogs3Guts(options, cb) {
    console.log('getLogs3Guts: ether.node = ' + ether.node);
    if (ether.node == 'metamask')
	metamaskGetLogs3(options, cb);
    else if (ether.node == 'etherscan.io')
	etherscanGetLogs3(options, cb);
    else
	infuraGetLogs3(options, cb);
}

//cb(err, result)
// options:
// {
//   fromBlock, toBlock, address, topics[]
// }
//
function metamaskGetLogs3(options, cb) {
    const topic0 = options.topics[0];
    const topic1 = options.topics[1];
    const topic2 = options.topics[2];
    const topic3 = options.topics[3];
    options.topics = [];
    options.topics[0] = topic0;
    options.topics[1] = [];
    if (!!topic1)
	options.topics[1].push(topic1);
    if (!!topic2)
	options.topics[1].push(topic2);
    if (!!topic3)
	options.topics[1].push(topic3);
    const paramsStr = JSON.stringify(options);
    //console.log('metamaskGetLogs3: topic1 = ' + topic1);
    //console.log('metamaskGetLogs3: topic2 = ' + topic2);
    //console.log('metamaskGetLogs3: topic3 = ' + topic3);
    console.log('metamaskGetLogs3: options = ' + paramsStr);
    const filter = common.web3.eth.filter(options);
    filter.get(cb);
	filter.stopWatching();
    return;
}


//cb(err, result)
// options:
// {
//   fromBlock, toBlock, address, topics[]
// }
//
function infuraGetLogs3(options, cb) {
    let topic0 = options.topics[0];
    let topic1 = options.topics[1];
    let topic2 = options.topics[2];
    let topic3 = options.topics[3];
    options.topics = [];
    options.topics[0] = topic0;
    options.topics[1] = [];
    if (!!topic1)
	options.topics[1].push(topic1);
    if (!!topic2)
	options.topics[1].push(topic2);
    if (!!topic3)
	options.topics[1].push(topic3);
    console.log('infuraGetLogs3: ether.node = ' + ether.node);
    let url = 'https://' + ether.infuraioHost + '/v3/' + ether.infuraioProjectID;
    options.fromBlock = 'earliest';
    const paramsStr = JSON.stringify(options);
    console.log('infuraGetLogs3: paramsStr = ' + paramsStr);
    const body = '{"jsonrpc":"2.0","method":"eth_getLogs","params":[' + paramsStr + '],"id":1}';
    options = { method: 'post', body: body, headers: { 'Content-Type': 'application/json' } };
    console.log('infuraGetLogs3: body = ' + body);
    //
    common.fetch(url, options, function(str, err) {
	if (!str || !!err) {
	    const err = "error retreiving events: " + err;
	    console.log('infuraGetLogs3: ' + err);
	    cb(err, '');
	    return;
	}
	console.log('infuraGetLogs3: err = ' + err + ', str = ' + str);
	const eventsResp = JSON.parse(str);
	cb(null, eventsResp.result);
    });
}


//cb(err, result)
//options:
// {
//	fromBlock, toBlock, address, topics[], topic1_2_opr, topic2_3_opr
// }
//
// note: because of the brain-dead mechanism that etherscan.io uses to specify required topic combinations, it's entirely
// possible that they will return results that don't match topic0. there doesn't seem to be any reliable way to specify
// topic0 && (topic1 || topic2 || topic3)
function etherscanGetLogs3(options, cb) {
    console.log('etherscanGetLogs3');
    let url = 'https://' + ether.etherscanioHost   +
	'/api?module=logs&action=getLogs'          +
	'&fromBlock=' + options.fromBlock          +
	'&toBlock=' + options.toBlock              +
	'&address=' + options.address              +
	'&topic0=' + options.topics[0];
    if (options.topics.length > 1) {
	if (!!options.topics[1]) {
	    url += '&topic1=' + options.topics[1];
	    url += '&topic0_1_opr=and';
	}
	if (options.topics.length > 2) {
	    if (!!options.topics[2]) {
		url += '&topic2=' + options.topics[2];
		url += '&topic1_2_opr=or';
		url += '&topic0_2_opr=and';
	    }
	}
	if (options.topics.length > 3) {
	    if (!!options.topics[3]) {
		url += '&topic3=' + options.topics[3];
		url += '&topic1_3_opr=or';
		url += '&topic2_3_opr=or';
		url += '&topic0_3_opr=and';
	    }
	}
    }
    options = null;
    //
    common.fetch(url, options, function(str, err) {
	if (!str || !!err) {
	    const err = "error retreiving events: " + err;
	    console.log('etherscanGetLogs3: ' + err);
	    cb(err, '');
	    return;
	}
	console.log('etherscanGetLogs3: err = ' + err + ', str = ' + str);
	//typical (etherscan.io)
	//  { "status"  : "1",
	//    "message" : "OK",
	//    "result"  : [...]
	//  }
	const eventsResp = JSON.parse(str);
	if (eventsResp.status == 0 && eventsResp.message == 'No records found') {
	    //this is not an err... just no events
	    cb(err, '');
	    return;
	}
	if (eventsResp.status != 1 || eventsResp.message != 'OK') {
	    const err = "error retreiving events: bad status (" + eventsResp.status + ", " + eventsResp.message + ")";
	    console.log('etherscanGetLogs3: ' + err);
	    cb(err, '');
	    return;
	}
	cb(null, eventsResp.result);
    });
}
