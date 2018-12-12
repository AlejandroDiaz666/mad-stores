//
// fcns related to categories
//
const common = require('./common');
const BN = require("bn.js");

const categories = module.exports = {
    //top level categories, followed by sub-categories
    bigList: [
	{ tlc: 'None',
	  llcBits: [ 'None'
		   ] },
	{ tlc: 'Vehicles',
	  llcBits: [ 'Aircraft',
		     'Aircraft Parts',
		     'Autos',
		     'Auto Parts',
		     'Boats',
		     'Boat Parts',
		     'Golf Carts',
		     'Golf Cart Parts',
		     'Motorcycles',
		     'Motorcycle Parts',
		     'Snowmobile',
		     'Snowmobile Parts',
		   ] },
	{ tlc: 'Electronics',
	  llcBits: [ ] },
	{ tlc: 'Collectibles',
	  llcBits: [ ] },
	{ tlc: 'Security & Protection',
	  llcBits: [ ] },
	{ tlc: 'Home & Garden',
	  llcBits: [ ] },
	{ tlc: 'Pets & Animals',
	  llcBits: [ ] },
	{ tlc: 'Pharmaceuticals',
	  llcBits: [ ] },
	{ tlc: 'Sporting Goods',
	  llcBits: [ ] },
	{ tlc: 'Toys & Hobbies',
	  llcBits: [ ] },
	{ tlc: 'Business & Industrial',
	  llcBits: [ ] },
	{ tlc: 'Professional Services',
	  llcBits: [ ] },
	{ tlc: 'Fashion & Apparel',
	  llcBits: [ 'Apparel Stock',
		     'Boy\'s Clothing',
		     'Children\’s Clothing',
		     'Coats',
		     'Costumes',
		     'Dresses',
		     'Ethnic Clothing',
		     'Garment Accessories',
		     'Girl\‘s Clothing',
		     'Hoodies & Sweatshirts',
		     'Hosiery',
		     'Infant & Toddlers Clothing',
		     'Jackets',
		     'Jeans',
		     'Ladie\‘s Blouses',
		     'Mannequins',
		     'Maternity Clothing',
		     'Men\‘s Clothing',
		     'Men\‘s Shirts',
		     'Organic Cotton Clothing',
		     'Other Apparel',
		     'Pants & Trousers',
		     'Plus Size Clothing',
		     'Sewing Supplies',
		     'Shorts',
		     'Skirts',
		     'Sleepwear',
		     'Sportswear',
		     'Stage & Dance Wear',
		     'Suits & Tuxedo',
		     'Sweaters',
		     'Tank Tops',
		     'T-Shirts',
		     'Tops',
		     'Underwear',
		     'Uniforms',
		     'Used Clothes',
		     'Vests & Waistcoats',
		     'Wedding Apparel',
		     'Women\'s Clothing',
		     'Workwear',
		   ] },
	{ tlc: 'Personal Care Products',
	  llcBits: [ ] },
	{ tlc: 'Gift Cards',
	  llcBits: [ ] },
	{ tlc: 'Software',
	  llcBits: [ ] },
	{ tlc: 'Entertainment',
	  llcBits: [ ] },
	{ tlc: 'Real Estate',
	  llcBits: [ ] },
	{ tlc: 'Food & Beverage',
	  llcBits: [ 'Alcoholic Beverages',
		     'Baby Food',
		     'Baked Goods',
		     'Bean Products',
		     'Canned Food',
		     'Coffee',
		     'Confectionery',
		     'Dairy',
		     'Drinking Water',
		     'Egg & Egg Products',
		     'Food Ingredients',
		     'Fruit Products',
		     'Grain Products',
		     'Honey Products',
		     'Instant Food',
		     'Meat & Poultry',
		     'Other Food & Beverage',
		     'Seafood',
		     'Seasonings & Condiments',
		     'Slimming Food',
		     'Snack Food',
		     'Soft Drinks',
		     'Tea',
		     'Vegetable Products',
		   ] },
    ],


    addTlcOptionsElems: function(selectCategoryBN, parentElem) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	for (let i = 0; i < categories.bigList.length; ++i) {
	    var option = document.createElement("option");
	    option.value = i.toString(10);
	    option.text = categories.bigList[i].tlc;
	    parentElem.appendChild(option);
	}
	parentElem.value = selectCategoryBN.ushrn(248).toNumber();
	console.log('addTlcOptionsElems: parentElem.value = ' + parentElem.value);
    },

    addLlcBitsOptionsElems: function(tlcIdx, selectCategoryBN, parentElem) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	console.log('addLlcBitsOptionsElems: tlcIdx = ' + tlcIdx);
	llcList = categories.bigList[tlcIdx].llcBits;
	//console.log('addLlcBitsOptionsElems: tlcIdx = ' + tlcIdx + ', llcList.length = ' + llcList.length);
	for (let i = 0; i < llcList.length; ++i) {
	    var option = document.createElement("option");
	    //console.log('addLlcBitsOptionsElems: add option ' + (1 << i).toString(10) + ' = ' + llcList[i]);
	    const optionValueBN = new BN('1', 16).iushln(i);
	    option.value = optionValueBN.toString(10);
	    option.text = llcList[i];
	    if (!selectCategoryBN.uand(optionValueBN).isZero())
		option.selected = true;
	    parentElem.appendChild(option);
	}
    },


}
