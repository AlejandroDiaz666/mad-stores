//
// fcns related to categories
//
const common = require('./common');
const BN = require("bn.js");

const categories = module.exports = {
    //top level categories, followed by sub-categories
    bigList: [
	{ tlc: 'None',
	  llcBits: [
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
	  llcBits: [ 'Audio & Video',
		     'Computer Hardware',
		     'Phones and Accessories',
		   ] },
	{ tlc: 'Collectibles',
	  llcBits: [ 'Antiques',
		     'Art',
		     'Fine Watches',
		     'Coins, Metals & Paper Money',
		     'Collectible Comics',
		     'Entertainment Memorabilia',
		     'Pottery & Glass',
		     'Sports Memorabilia',
		     'Stamps'
		   ] },
	{ tlc: 'Security & Protection',
	  llcBits: [ 'Cameras',
		     'Locks',
		     'Safes',
		     'Self Defense',
		   ] },
	{ tlc: 'Home & Garden',
	  llcBits: ['Furniture',
		    'Home Repair Equipment',
		   ] },
	{ tlc: 'Pets & Animals',
	  llcBits: [ 'Pet Food',
		     'Pet Accessories',
		   ] },
	{ tlc: 'Pharmaceuticals',
	  llcBits: [ 'Ointments',
		     'Chemicals',
		     'Recreational',
		     'Weight Loss',
		     'Muscle Building',
		     'Homeopathic',
		     'Sex Products',
		   ] },
	{ tlc: 'Sporting Goods',
	  llcBits: [ 'Artificial Grass',
		     'Baseball',
		     'Cycling',
		     'Fitness & Body Building',
		     'Football',
		     'Gambling',
		     'Golf',
		     'Hockey',
		     'Indoor Sports',
		     'Other Sports Products',
		     'Outdoor Sports',
		     'Soccer',
		     'Sports Flooring',
		     'Sports Gloves',
		     'Sports Safety',
		     'Sports Souvenirs',
		     'Team Sports',
		     'Tennis',
		     'Water Sports',
		     'Winter Sports',
		     'Camping & Hiking',
		     'Scooters',
		     'Gym Equipment',
		     'Swimming & Diving',
	  ] },
	{ tlc: 'Toys & Hobbies',
	  llcBits: [ 'Action Figures',
		     'Baby Toys',
		     'Balloons',
		     'Candy Toys',
		     'Classic Toys',
		     'Dolls',
		     'Educational Toys',
		     'Electronic Toys',
		     'Glass Marbles',
		     'Inflatable Toys',
		     'Light-Up Toys',
		     'Noise Makers',
		     'Other Toys & Hobbies',
		     'Outdoor Play Structures',
		     'Outdoor Toys',
		     'Plastic Toys',
		     'Pretend Play & Preschool',
		     'Solar Toys',
		     'Toy Accessories',
		     'Toy Animals',
		     'Toy Guns',
		     'Toy Parts',
		     'Toy Robots',
		     'Toy Vehicles',
		     'Wind Up Toys',
		     'Wooden Toys',
	  ] },
	{ tlc: 'Business & Industrial',
	  llcBits: [ 'Chemical Handling',
		     'Machinery',
		   ] },
	{ tlc: 'Professional Services',
	  llcBits: [ 'Accounting',
		     'Architect',
		     'Engineering',
		     'Legal',
		     'Marketing',
		     'Therapy',
		   ] },
	{ tlc: 'Fashion & Apparel',
	  llcBits: [ 'Apparel Stock',
		     'Boy\'s Clothing',
		     'Children\'s Clothing',
		     'Coats',
		     'Costumes',
		     'Dresses',
		     'Ethnic Clothing',
		     'Garment Accessories',
		     'Girl\'s Clothing',
		     'Hoodies & Sweatshirts',
		     'Hosiery',
		     'Infant & Toddlers Clothing',
		     'Jackets',
		     'Jeans',
		     'Ladie\'s Blouses',
		     'Mannequins',
		     'Maternity Clothing',
		     'Men\'s Clothing',
		     'Men\'s Shirts',
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
		     'Wigs',
		     'Women\'s Clothing',
		     'Workwear',
		   ] },
	{ tlc: 'Personal Care Products',
	  llcBits: [ 'Makeup',
		     'Perfume',
		   ] },
	{ tlc: 'Gift Cards',
	  llcBits: [ ] },
	{ tlc: 'Software',
	  llcBits: [ 'Custom Software',
		     'Hosting Services',
		     'Licensed Software',
		   ] },
	{ tlc: 'Entertainment',
	  llcBits: [ 'Games',
		     'Music',
		     'Videos',
		     'Event Tickets',
		   ] },
	{ tlc: 'Real Estate',
	  llcBits: [ 'Property for Sale',
		   ] },
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

    //option0 has a value of zero. if option0Text is non-null then option0 is displayed with the specified text
    //at any rate, option0 is always disabled -- it cannot be selected
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
	llcList = categories.bigList[tlcIdx].llcBits;
	//console.log('addLlcBitsOptionsElems: tlcIdx = ' + tlcIdx + ', llcList.length = ' + llcList.length);
	for (let i = 0; i < llcList.length; ++i) {
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
    },


}
