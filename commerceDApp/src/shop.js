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
    meUtil.getProductLogs(regionBN, categoryBN, vendorAddr, function(err, results) {
	if (!err) {
	    for (var i = 0; i < results.length; ++i) {
		var tileImg = document.getElementById('tile' + i + 'Img');
		var tileName = document.getElementById('tile' + i + 'Name');
		var tileText = document.getElementById('tile' + i + 'Text');
		meEther.parseRegisterProductEvent(results[i], function(err, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image) {
		    tileImg.src = image;
		    tileName.textContent = name.substring(0, 22);
		    tileText.textContent = desc.substring(0, 70);
		});
	    }
	}
    });
}
