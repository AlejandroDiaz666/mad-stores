
//
// high level fcns related to interaction w/ ME contract
//
const common = require('./common');
const ether = require('./ether');
const catEther = require('./catEther');
const BN = require("bn.js");

var catUtil = module.exports = {

    // tlc: 'Vehicles', llcBits: [ 'Aircraft', ... ],
    // tlc: 'fruits',   llcBits: [ 'Apples', ... ]
    bigList: [
	{ tlc: 'None', llcBits:  [ ] },
    ],


    setButtonHandlers: function() {
	/*
	const selectedProductCloseImg = document.getElementById('selectedProductCloseImg');
	selectedProductCloseImg.addEventListener('click', function() {
	    console.log('selectedProductCloseImg: got click');
	    common.replaceElemClassFromTo('selectedProductPageDiv', 'visibleB', 'hidden', null);
	    if (!!meUtil.productDetailCloseFcn) {
		meUtil.productDetailCloseFcn();
		meUtil.productDetailCloseFcn = null;
	    }
	});
	*/
    },


    //
    // selectCategoryBN is current selection
    //
    addTlcOptionsElems: function(selectCategoryBN, parentElem) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	for (let i = 0; i < catUtil.bigList.length; ++i) {
	    //only add category if text is not blank
	    if (!!catUtil.bigList[i].tlc) {
		var option = document.createElement("option");
		option.value = i.toString(10);
		option.text = catUtil.bigList[i].tlc;
		parentElem.appendChild(option);
	    }
	}
	parentElem.value = selectCategoryBN.ushrn(248).toNumber();
	console.log('addTlcOptionsElems: parentElem.value = ' + parentElem.value);
    },


    // selectCategoryBN is current selection
    // option0 has a value of zero. if option0Text is non-null then option0 is displayed with the specified text
    // at any rate, option0 is always disabled -- it cannot be selected
    //
    addLlcBitsOptionsElems: function(tlcIdx, selectCategoryBN, parentElem, option0Text) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	if (!!option0Text) {
	    const option0 = document.createElement("option");
	    option0.value = '0';
	    option0.text = option0Text;
	    option0.disabled = true;
	    parentElem.appendChild(option0);
	}
	console.log('addLlcBitsOptionsElems: tlcIdx = ' + tlcIdx);
	if (!!catUtil.bigList[tlcIdx]) {
	    llcList = catUtil.bigList[tlcIdx].llcBits;
	    //console.log('addLlcBitsOptionsElems: tlcIdx = ' + tlcIdx + ', llcList.length = ' + llcList.length);
	    for (let i = 1; i < llcList.length; ++i) {
		//only add option if it is not blank
		if (!!llcList[i]) {
		    var option = document.createElement("option");
		    //console.log('addLlcBitsOptionsElems: add option ' + (1 << i).toString(10) + ' = ' + llcList[i]);
		    option.text = llcList[i];
		    //console.log('addLlcBitsOptionsElems: i = ' + i);
		    const optionValueBN = new BN('1', 16).iushln(i);
		    //console.log('addLlcBitsOptionsElems: optionValueBN = 0x' + optionValueBN.toString(16));
		    option.value = '0x' + optionValueBN.toString(16);
		    if (!selectCategoryBN.uand(optionValueBN).isZero())
			option.selected = true;
		    parentElem.appendChild(option);
		}
	    }
	}
    },


    //
    // read all categories and subcategories from the categories contract
    // call to re-initialize the bigList
    //
    getCategories: function(cb) {
	catUtil.bigList = [ { tlc: 'None', llcBits:  [ ] } ];
	getCategoriesNext(catEther.firstBlock, cb);
    },

};


// cb(err, results)
function getCategoriesNext(fromBlock, cb) {
    const options = {
	fromBlock: fromBlock,
	toBlock: 'latest',
	address: catEther.CAT_CONTRACT_ADDR,
	topics: [ catEther.getProposeCategoryEventTopic0() ]
    }
    ether.getLogs(options, function(err, results) {
	if (!!err || !results || results.length == 0) {
	    if (!!err)
		console.log('getCategoriesNext: ether.getLogs err = ' + err);
	    //either an error, or maybe just no events
	    if (!!cb)
		cb();
	    return;
	}
	if (!results || !results.length) {
	    console.log('no additional categories');
	    if (!!cb)
		cb();
	    return;
	}
	parseCategoryResults(fromBlock, results, function(lastBlock) {
	    if (lastBlock != fromBlock) {
		getCategoriesNext(lastBlock, cb);
	    } else {
		console.log('parsed to block ' + lastBlock);
		if (!!cb)
		    cb();
	    }
	});
    });
}

function parseCategoryResults(fromBlock, results, cb) {
    console.log('parseCategoryResults: fromBlock = ' + fromBlock );
    let blockNumber = fromBlock;
    console.log('from block ' + fromBlock + ' parsing ' + results.length + ' results');
    for (idx = 0; idx < results.length; ++idx) {
	const result = results[idx];
	const thisBlock = parseInt(result.blockNumber);
	if (thisBlock > blockNumber)
	    blockNumber = thisBlock;
	catEther.parseProposeCategoryEvent(result, function(err, categoryBN, name, desc, image) {
	    let llc = 0;
	    const tlc = categoryBN.ushrn(248).toNumber();
	    for (let bit = 0; bit < 248; ++bit) {
		if (categoryBN.testn(bit)) {
		    llc = bit + 1;
		    break;
		}
	    }
	    console.log('category ' + categoryBN.toString(16) + ' (' + tlc + ') - ' + llc + ' : ' + name);
	    if (!!llc) {
		if (!!catUtil.bigList[tlc])
		    catUtil.bigList[tlc].llcBits[llc] = name;
		else
		    console.log('attempt to add subcategory, ' + llc + ' (' + name + '), to non-existent TLC ' + tlc);
	    } else if (!!tlc) {
		let llcBits = [ 'none' ];
		if (!!catUtil.bigList[tlc]) {
	    	    console.log('updating existing TLC ' + tlc + ' from "' + catUtil.bigList[tlc].tlc + '" to "' + name + '"');
		    llcBits = catUtil.bigList[tlc].llcBits;
		}
		catUtil.bigList[tlc] = { tlc: name, llcBits: llcBits };
	    } else {
		console.log('error parsing ProposeCategoryEvent');
	    }
	});
    }
    cb(blockNumber);
}
