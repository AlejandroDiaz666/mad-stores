/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
var common = require('./common');
var ether = require('./ether');
var mtEther = require('./mtEther');
var meEther = require('./meEther');
var meUtil = require('./meUtil');
var BN = require("bn.js");


var shop = module.exports = {

    handleShopPage: function() {
	common.setMenuButtonState('shopButton',          'Enabled');
	common.setMenuButtonState('dashboardButton',     'Enabled');
	common.setMenuButtonState('createStoreButton',   'Selected');
	common.replaceElemClassFromTo('shopPageDiv',        'visibleT', 'hidden',   null);
	common.replaceElemClassFromTo('createStorePageDiv', 'hidden',   'visibleT', null);
	handleSearchProducts();
    },

    setButtonHandlers: function() {
    },

};


/* ------------------------------------------------------------------------------------------------------------------
   shop functions
   ------------------------------------------------------------------------------------------------------------------ */
function handleSearchProducts() {
    common.setMenuButtonState('shopButton',          'Selected');
    common.setMenuButtonState('dashboardButton',     'Enabled');
    common.setMenuButtonState('createStoreButton',   'Enabled');
    common.replaceElemClassFromTo('shopPageDiv',        'hidden',   'visibleT', null);
    common.replaceElemClassFromTo('createStorePageDiv', 'visibleT', 'hidden',   null);

    //
    // after user enters earch parameters....
    var regionBN = null;
    var categoryBN = null;
    var vendorAddr = null

    const shopTilesDiv = document.getElementById('shopTilesDiv');
    while (shopTilesDiv.hasChildNodes()) {
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild);
	console.log('shopTilesDiv.lastChild = ' + shopTilesDiv.lastChild.toString());
	shopTilesDiv.removeChild(shopTilesDiv.lastChild);
    }

    console.log('handleSearchProducts: getting product logs');
    meUtil.getProductLogs(vendorAddr, regionBN, categoryBN, function(err, results) {
	if (!err) {
	    for (var i = 0; i < results.length; ++i) {
		const tileDiv = document.createElement('div');
		tileDiv.id = 'tile' + i + 'Div';
		tileDiv.className = 'tileDiv';
		const tileImgElem = document.createElement('img');
		tileImgElem.id = 'tile' + i + 'Img';
		tileImgElem.className = 'tileImg';
		tileDiv.appendChild(tileImgElem);
		const tileNameBgDiv = document.createElement('div');
		tileNameBgDiv.id = 'tile' + i + 'NameBgDiv';
		tileNameBgDiv.className = 'tileNameBg';
		tileDiv.appendChild(tileNameBgDiv);
		const tileNameSpan = document.createElement('span');
		tileNameSpan.id = 'tile' + i + 'Name';
		tileNameSpan.className = 'tileName';
		tileDiv.appendChild(tileNameSpan);
		const tileTextBgDiv = document.createElement('div');
		tileTextBgDiv.id = 'tile' + i + 'TextBgDiv';
		tileTextBgDiv.className = 'tileTextBg';
		tileDiv.appendChild(tileTextBgDiv);
		const tileTextSpan = document.createElement('span');
		tileTextSpan.id = 'tile' + i + 'Text';
		tileTextSpan.className = 'tileText';
		tileDiv.appendChild(tileTextSpan);
		shopTilesDiv.appendChild(tileDiv);
		meEther.parseRegisterProductEvent(results[i], function(err, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
		    console.log('got prodoct = 0x' + productIdBN.toString(16) + ', name = ' + name + ', desc = ' + desc);
		    tileImgElem.src = image;
		    tileNameSpan.textContent = name.substring(0, 22);
		    tileTextSpan.textContent = desc.substring(0, 70);
		    //const product = new Product(vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image);
		    //tileDiv.addEventListener('click', () => editProduct(product))
		});
	    }
	}
    });
}
