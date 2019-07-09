
//
// fcns related to ethereum and low level interaction w/ Categories contract
//
const common = require('./common');
const ether = require('./ether');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");
const keccak = require('keccakjs');

const catEther = module.exports = {

    //kovan
    CAT_CONTRACT_ADDR: null,
    CAT_CONTRACT_ABI:  '[{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"turmsToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"noSubCategories","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_topLevelCategory","type":"uint8"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"}],"name":"proposeCategory","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"madEscrow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"noTopLevelCategories","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"}],"name":"editCategory","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_turmsToken","type":"address"},{"name":"_madEscrow","type":"address"}],"name":"setPartners","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_turmsToken","type":"address"},{"name":"_madEscrow","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_category","type":"uint256"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"}],"name":"ProposeCategoryEvent","type":"event"}]',
    mainnet_contract_addr: '',
    ropsten_contract_addr: '0xdeb2a80d23c7a4bbabc7c47927ad3cc82dfeaf39',
    kovan_contract_addr: '',
    firstBlock: 0,
    proposeCategoryEventTopic0: null,
    proposeCategoryABI: null,


    // returns(err)
    // network = [ 'Mainnet' | 'Morden test network' | 'Ropsten test network' | 'Rinkeby test network' | 'Kovan test network' ]
    setNetwork: function(network) {
	let err = null;
	if (network.indexOf('Mainnet') >= 0) {
	    catEther.firstBlock = 0;
	    catEther.CAT_CONTRACT_ADDR = null;
	} else if (network.indexOf('Ropsten') >= 0) {
	    catEther.firstBlock = 5953038;
	    catEther.CAT_CONTRACT_ADDR = catEther.ropsten_contract_addr;
	}
	if (!catEther.CAT_CONTRACT_ADDR)
	    err = network + ' is not a supported network';
	console.log('setNetwork: cat contract addr = ' + catEther.CAT_CONTRACT_ADDR);
	return(err);
    },

    // cb(err, txid)
    // function proposeCategory(uint8 _topLevelCategory, bytes memory _name, bytes memory _desc) public
    //
    proposeCategory: function(topLevelCategory, nameBytes, descBytes, cb) {
	console.log('proposeCategory: topLevelCategory = ' + topLevelCategory + ', nameBytes = ' + nameBytes);
	const proposeCategoryFcn = catEther.abiEncodeProposeCategory();
	const abiParms = catEther.abiEncodeProposeCategoryParms(topLevelCategory, nameBytes, descBytes);
        const sendData = "0x" + proposeCategoryFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(catEther.CAT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeProposeCategory: function() {
	if (!catEther.proposeCategoryABI)
	    catEther.proposeCategoryABI = ethabi.methodID('proposeCategory', [ 'uint8', 'bytes', 'bytes' ]).toString('hex');
	return(catEther.proposeCategoryABI);
    },

    abiEncodeProposeCategoryParms: function(topLevelCategory, nameBytes, descBytes) {
	encoded = ethabi.rawEncode([ 'uint8', 'bytes', 'bytes' ],
				   [ topLevelCategory, nameBytes, descBytes ] ).toString('hex');
	return(encoded);
    },


    // cb(err, txid)
    // function proposeCategory(uint8 _topLevelCategory, bytes memory _name, bytes memory _desc, bytes memory _image) public
    //
    editCategory: function(category, nameBytes, descBytes, cb) {
	const editCategoryFcn = catEther.abiEncodeEditCategory();
	const abiParms = catEther.abiEncodeEditCategoryParms(category, nameBytes, descBytes);
        const sendData = "0x" + editCategoryFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(catEther.CAT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeEditCategory: function() {
	if (!catEther.editCategoryABI)
	    catEther.editCategoryABI = ethabi.methodID('editCategory', [ 'uint8', 'bytes', 'bytes' ]).toString('hex');
	return(catEther.editCategoryABI);
    },

    abiEncodeEditCategoryParms: function(topLevelCategory, nameBytes, descBytes) {
	encoded = ethabi.rawEncode([ 'uint8', 'bytes', 'bytes' ],
				   [ topLevelCategory, nameBytes, descBytes ] ).toString('hex');
	return(encoded);
    },

    //
    //   event ProposeCategoryEvent(uint256 indexed _category, bytes name, bytes desc, bytes image);
    //
    getProposeCategoryEventTopic0: function() {
	if (!catEther.proposeCategoryEventTopic0) {
	    const keccak256 = new keccak(256);
	    keccak256.update("ProposeCategoryEvent(uint256,bytes,bytes)");
	    catEther.proposeCategoryEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('proposeCategoryEventTopic0 = ' + catEther.proposeCategoryEventTopic0);
	return(catEther.proposeCategoryEventTopic0);
    },


    //cb(null, categoryBN, name, desc, image)
    //pass in in a single result object
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseProposeCategoryEvent: function(result, cb) {
	//RegisterProductEvent(address indexed _vendorAddr, uint256 indexed _region, uint256 indexed _category,
	//                     uint256 _productID, bytes name, bytes desc, bytes image);
	//typical
	//                   { "address"    :  "0x6d6e8314bc319b3315bc51b7941e43adedf25b26",
	//                     "topics"     : [
	//                                     "0x0000000000000000000000000000000000000000000000000000000000000003", -- category
	//                                    ],
	//                     "data":         "0x0000000000000000000000000000000000000000000000000000000000000060   -- offset to name
	//                                        00000000000000000000000000000000000000000000000000000000000000a0   -- offset to desc
	//                                        0000000000000000000000000000000000000000000000000000000000000120   -- offset to image
	//                                        000000000000000000000000000000000000000000000000000000000000000c   -- length of name
	//                                        546573742053746f726520300000000000000000000000000000000000000000   -- name
	//                                        0000000000000000000000000000000000000000000000000000000000000046   -- length of desc
	//                                        5468697320697320546573742053746f726520302e20446f6e277420666f7267   -- desc
	//                                        657420746f2073686f77206d657373616765206665657320616e642072657075...",....
	//                     "blockNumber" : "0x45c792",
	//                     "timeStamp"   : "0x5c095dd6",
	//                     "gasPrice"    : "0x3b9aca00",
	//                     "gasUsed"     : "0x59e4d",
	//                     "logIndex"    :  "0x11",
	//                     "transactionHash"  : "0xcd6d86016f0cc1cc488ca8ab56ece99cc80b8e76d6e59665c227f9a9500bd8af",
	//                     "transactionIndex" : "0x1a"
	//                    }
	//
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const categoryBN = common.numberToBN(result.topics[1]);
	const nameHex = ether.extractHexData(result.data, 2+0);
	const descHex = ether.extractHexData(result.data, 2+64);
	const imageHex = ether.extractHexData(result.data, 2+128);
	const name = common.Utf8HexToStr(nameHex);
	console.log('parseRegisterProductEvent: nameHex = ' + nameHex + ', name = ' + name);
	const desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	const image = common.hexToImage(imageHex);
	cb(null, categoryBN, name, desc, image);
    },

};
