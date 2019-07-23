//
// fcns related to regions
//
const common = require('./common');
const BN = require("bn.js");

const regions = module.exports = {
    //top level regions, followed by sub-regions
    bigList: [
	{ tlr: 'None',
	  llrBits: [
		   ] },
	{ tlr: 'Africa',
	  llrBits: [ 'Algeria',
		     'Angola',
		     'Benin',
		     'Botswana',
		     'Burkina Faso',
		     'Burundi',
		     'Cabo Verde',
		     'Cameroon',
		     'Central African Republic (CAR)',
		     'Chad',
		     'Comoros',
		     'Democratic Republic of the Congo',
		     'Republic of the Congo',
		     'Cote d\'Ivoire',
		     'Djibouti',
		     'Egypt',
		     'Equatorial Guinea',
		     'Eritrea',
		     'Eswatini',
		     'Ethiopia',
		     'Gabon',
		     'Gambia',
		     'Ghana',
		     'Guinea',
		     'Guinea-Bissau',
		     'Kenya',
		     'Lesotho',
		     'Liberia',
		     'Libya',
		     'Madagascar',
		     'Malawi',
		     'Mali',
		     'Mauritania',
		     'Mauritius',
		     'Morocco',
		     'Mozambique',
		     'Namibia',
		     'Niger',
		     'Nigeria',
		     'Rwanda',
		     'Sao Tome and Principe',
		     'Senegal',
		     'Seychelles',
		     'Sierra Leone',
		     'Somalia',
		     'South Africa',
		     'South Sudan',
		     'Sudan',
		     'Tanzania',
		     'Togo',
		     'Tunisia',
		     'Uganda',
		     'Zambia',
		     'Zimbabwe'
		   ] },
	{ tlr: 'Asia',
	  llrBits: [ 'Afghanistan',
		     'Armenia',
		     'Azerbaijan',
		     'Bahrain',
		     'Bangladesh',
		     'Bhutan',
		     'Brunei',
		     'Cambodia',
		     'China',
		     'Cyprus',
		     'Georgia',
		     'India',
		     'Indonesia',
		     'Iran',
		     'Iraq',
		     'Israel',
		     'Japan',
		     'Jordan',
		     'Kazakhstan',
		     'Kuwait',
		     'Kyrgyzstan',
		     'Laos',
		     'Lebanon',
		     'Malaysia',
		     'Maldives',
		     'Mongolia',
		     'Myanmar',
		     'Nepal',
		     'North Korea',
		     'Oman',
		     'Pakistan',
		     'Palestine',
		     'Philippines',
		     'Qatar',
		     'Russia',
		     'Saudi Arabia',
		     'Singapore',
		     'South Korea',
		     'Sri Lanka',
		     'Syria',
		     'Taiwan',
		     'Tajikistan',
		     'Thailand',
		     'Timor-Leste',
		     'Turkey',
		     'Turkmenistan',
		     'United Arab Emirates (UAE)',
		     'Uzbekistan',
		     'Vietnam',
		     'Yemen'
		   ] },
	{ tlr: 'Australia-Oceania',
	  llrBits: [ 'American Samoa (USA)',
		     'Australia',
		     'Hawaii',
		     'Guam (USA)',
		     'Melanesia',
		     'Micronesia',
		     'New Zealand',
		     'Northern Mariana Islands (USA)',
		     'Phillipines'
		   ] },
	{ tlr: 'Caribbean',
	  llrBits: [ 'Anguilla (UK)',
		     'Antigua and Barbuda',
		     'Aruba',
		     'Bahamas',
		     'Barbados',
		     'British Virgin Islands (UK)',
		     'Cayman Islands',
		     'Cuba',
		     'Dominica',
		     'Dominican Republic',
		     'Grenada',
		     'Haiti',
		     'Jamaica',
		     'Martinique (France)',
		     'Navassa Island (USA)',
		     'Saba (Netherlands)',
		     'Saint Barthelemy (France)',
		     'Saint Kitts and Nevis',
		     'Saint Lucia',
		     'Saint Martin (France)',
		     'Saint Vincent and the Grenadines',
		     'Sint Eustatius (Netherlands)',
		     'Sint Maarten (Netherlands)',
		     'Trinidad and Tobago',
		     'US Virgin Islands (USA)',
		   ] },
	{ tlr: 'Central America',
	  llrBits: [ 'Belize',
		     'Clipperton Island (France)',
		     'El Salvador',
		     'Costa Rica',
		     'Guatemala',
		     'Honduras',
		     'Nicaragua',
		     'Panama'
		   ] },
	{ tlr: 'Europe',
	  llrBits: [ 'Albania',
		     'Andorra',
		     'Armenia',
		     'Austria',
		     'Azerbaijan',
		     'Belarus',
		     'Belgium',
		     'Bosnia and Herzegovina',
		     'Bulgaria',
		     'Croatia',
		     'Cyprus',
		     'Czech Republic',
		     'Denmark',
		     'Estonia',
		     'Finland',
		     'France',
		     'Georgia',
		     'Germany',
		     'Greece',
		     'Hungary',
		     'Iceland',
		     'Ireland',
		     'Italy',
		     'Kazakhstan',
		     'Kosovo',
		     'Latvia',
		     'Liechtenstein',
		     'Lithuania',
		     'Luxembourg',
		     'Macedonia (FYROM)',
		     'Malta',
		     'Moldova',
		     'Monaco',
		     'Montenegro',
		     'Netherlands',
		     'Norway',
		     'Poland',
		     'Portugal',
		     'Romania',
		     'Russia',
		     'San Marino',
		     'Serbia',
		     'Slovakia',
		     'Slovenia',
		     'Spain',
		     'Sweden',
		     'Switzerland',
		     'Turkey',
		     'Ukraine',
		     'United Kingdom (UK)',
		     'Vatican City'
		   ] },
	{ tlr: 'North America',
	  llrBits: [ 'Bermuda (UK)',
		     'Canada',
		     'Greenland (Denmark)',
		     'Guadeloupe (France)',
		     'Mexico',
		     'Montserrat (UK)',
		     'Puerto Rico (USA)',
		     'Saint Pierre and Miquelon (France)',
		     'Turks and Caicos Islands (UK)',
		     'Continental United States of America',
		   ] },
	{ tlr: 'South America',
	  llrBits: [ 'Argentina',
		     'Bolivia',
		     'Bonaire (Netherlands)',
		     'Brazil',
		     'Chile',
		     'Colombia',
		     'Curacao (Netherlands)',
		     'Ecuador',
		     'Guyana',
		     'Paraguay',
		     'Peru',
		     'Suriname',
		     'Uruguay',
		     'Venezuela',
		     'Falkland Islands (UK)',
		     'French Guiana (France)',
		     'South Georgia and the South Sandwich Islands (UK)',
		   ] },
    ],


    addTlrOptionsElems: function(selectRegionBN, parentElem) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	for (let i = 0; i < regions.bigList.length; ++i) {
	    var option = document.createElement("option");
	    option.value = i.toString(10);
	    option.text = regions.bigList[i].tlr;
	    parentElem.appendChild(option);
	}
	parentElem.value = selectRegionBN.ushrn(248).toNumber();
	console.log('addTlrOptionsElems: parentElem.value = ' + parentElem.value);
    },

    //option0 has a value of zero. if option0Text is non-null then option0 is displayed with the specified text
    //at any rate, option0 is always disabled -- it cannot be selected
    addLlrBitsOptionsElems: function(tlrIdx, selectRegionBN, parentElem, option0Text) {
	while (parentElem.hasChildNodes())
	    parentElem.removeChild(parentElem.lastChild);
	if (!!option0Text) {
	    const option0 = document.createElement("option");
	    option0.value = '0';
	    option0.text = option0Text;
	    option0.disabled = true;
	    parentElem.appendChild(option0);
	}
	console.log('addLlrBitsOptionsElems: tlrIdx = ' + tlrIdx);
	llrList = regions.bigList[tlrIdx].llrBits;
	//console.log('addLlrBitsOptionsElems: tlrIdx = ' + tlrIdx + ', llrList.length = ' + llrList.length);
	for (let i = 0; i < llrList.length; ++i) {
	    var option = document.createElement("option");
	    //console.log('addLlrBitsOptionsElems: add option ' + (1 << i).toString(10) + ' = ' + llrList[i]);
	    option.text = llrList[i];
	    //console.log('addLlrBitsOptionsElems: i = ' + i);
	    const optionValueBN = new BN('1', 16).iushln(i);
	    //console.log('addLlrBitsOptionsElems: optionValueBN = 0x' + optionValueBN.toString(16));
	    option.value = '0x' + optionValueBN.toString(16);
	    if (!selectRegionBN.uand(optionValueBN).isZero())
		option.selected = true;
	    parentElem.appendChild(option);
	}
    },


}
