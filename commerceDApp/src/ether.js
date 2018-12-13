
//
// fcns related to ethereum, nonspecific to any particular contract
//
const common = require('./common');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");

const ether = module.exports = {

    SZABO_PER_ETH:     1000000,
    GWEI_PER_ETH:      1000000000,
    WEI_PER_GWEI:      1000000000,
    WEI_PER_SZABO:     1000000000000,
    WEI_PER_FINNEY:    1000000000000000,
    WEI_PER_ETH:       1000000000000000000,
    etherscanioHost: '',
    //tx status host for user to check status of transactions
    etherscanioTxStatusHost: '',
    etherscanioHost_kovan: 'api-kovan.etherscan.io',
    etherscanioTxStatusHost_kovan: 'kovan.etherscan.io',
    etherscanioHost_ropsten: 'api-ropsten.etherscan.io',
    etherscanioTxStatusHost_ropsten: 'ropsten.etherscan.io',
    etherscanioHost_main: 'api.etherscan.io',
    etherscanioTxStatusHost_main: 'etherscan.io',
    infuraioHost: 'kovan.infura.io',
    infuraioProjectID: 'd31bddc6dc8e47d29906cee739e4fe7f',
    //node = 'etherscan.io' | 'infura.io'
    node: 'etherscan.io',

    //cb(err, network)
    getNetwork: function(web3, cb) {
	let network = 'Unknown Network';
	web3.version.getNetwork((err, netId) => {
	    switch (netId) {
	    case "1":
		network = 'Mainnet';
		console.log('This is mainnet')
		ether.etherscanioHost = ether.etherscanioHost_main;
		ether.etherscanioTxStatusHost = ether.etherscanioTxStatusHost_main;
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
		break
	    default:
		console.log('This is an unknown network.')
	    }
	    cb(null, network);
	});
    },

    //convert an amount in wei to a comfortable representation
    //for example: 1000000000000 => '1 gwei'
    convertWeiToComfort: function(web3, wei) {
	const units =
	    (wei < ether.WEI_PER_GWEI)   ? 'Wei'   :
	    (wei < ether.WEI_PER_SZABO)  ? 'Gwei'   :
	    (wei < ether.WEI_PER_FINNEY) ? 'Szabo'  :
	    (wei < ether.WEI_PER_ETH)    ? 'Finney' : 'Eth';
	return(web3.fromWei(wei, units).toString() + ' ' + units);
    },


    //numberAndUnits eg. 5 => { index: 0, multiplyer: 1, number: 5, units: 'Wei' }
    convertWeiBNToNumberAndUnits: function(weiBN) {
	const numberAndUnits = {};
	let multiplyer;
	//console.log('convertWeiToNumberAndUnits: weiBN = ' + weiBN.toString(10));
	if (weiBN.lt(new BN('3E8', 16))) {
	    numberAndUnits.index = 0;
	    numberAndUnits.multiplyer = '1';
	    numberAndUnits.units = 'Wei';
	} else if (weiBN.lt(new BN('F4240', 16))) {
	    numberAndUnits.index = 1;
	    numberAndUnits.multiplyer = '1000';
	    numberAndUnits.units = 'Kwei';
	} else if (weiBN.lt(new BN('3B9ACA00', 16))) {
	    numberAndUnits.index = 2;
	    numberAndUnits.multiplyer = '1000000';
	    numberAndUnits.units = 'Mwei';
	} else if (weiBN.lt(new BN('E8D4A51000', 16))) {
	    numberAndUnits.index = 3;
	    numberAndUnits.multiplyer = '1000000000';
	    numberAndUnits.units = 'Gwei';
	} else if (weiBN.lt(new BN('38D7EA4C68000', 16))) {
	    numberAndUnits.index = 4;
	    numberAndUnits.multiplyer = '1000000000000';
	    numberAndUnits.units = 'Szabo';
	} else if (weiBN.lt(new BN('DE0B6B3A7640000', 16))) {
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
	numberAndUnits.number = weiBN.div(multiplyerBN).toNumber();
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
    // units: 'szabo' | 'finney' | 'ether'
    // cb(err, balance)
    //
    getBalance: function(web3, units, cb) {
	web3.eth.getBalance(web3.eth.accounts[0], function (err, balance) {
	    console.log('ether.getBalance: bal = ' + balance.toString() + ', type = ' + typeof(balance));
	    cb(null, web3.fromWei(balance, units).toString());
	});
    },


    //
    // units: 'szabo' | 'finney' | 'ether'
    //
    send: function(web3, to_addr, size, units, data, gasLimit, callback) {
	const tx = {};
	tx.from = web3.eth.accounts[0];
	tx.value = web3.toWei(size, units);
	tx.to = to_addr,
	tx.data = data;
	if (gasLimit > 0)
	    tx.gas = gasLimit;
	console.log('ether.send: calling sendTransaction');
	web3.eth.sendTransaction(tx, callback)
    },


    //cb(err, result)
    //options: {
    //	fromBlock, toBlock, address, topics[]
    //
    getLogs: function(options, cb) {
	console.log('ether.getLogs: ether.node = ' + ether.node);
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
	    //console.log('ether.getLogs: err = ' + err + ', str = ' + str);
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
