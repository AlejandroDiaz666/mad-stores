//
// fcns related to Diffie-Hellman encryption
//
const common = require('./common');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const crypto = require("crypto");
const BN = require("bn.js");
const keccak = require('keccakjs');

const dhcrypt = module.exports = {

    dh: null,
    epk: null,
    //this Prime is from the 2048-bit MODP group from RFC 3526
    PRIME_2048: 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A0\
8798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE38\
6BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C6\
2F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5\
C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF',
    SIGNATURE_MSG: "We create a unique encryption key for each sender/receiver pair of Ethereum addresses. \
By signing this message you will create a secret code to unlock your half of each pairwise-key.\n\n\
Your secret code is never shared, transmitted, or even saved on your own computer. That is the reason \
you need to sign this message each time you load Turms Anonymous Message Transport.",


    //
    // cb(err, encryptedPrivateKey)
    //
    initDH: function(encryptedPrivateKey, cb) {
	//The DH algorithm begins with a large prime, P, and a generator, G. These don't have to be secret, and they may be
	//transmitted over an insecure channel. The generator is a small integer and typically has the value 2 or 5.
	//we use a known safe prime and generator.
	const primeBN = new BN(dhcrypt.PRIME_2048, 16);
	const dh = crypto.createDiffieHellman(primeBN.toString(16), 'hex', '02', 'hex');
	//console.log('dhcrypt.initDH: prime: ' + dh.getPrime('hex'));
	//console.log('dhcrypt.initDH: generator: ' + dh.getGenerator('hex'));
	signatureFromAcct(function(err, signature) {
	    if (!!err) {
		cb(err, null);
	    } else {
		//console.log('dhcrypt.initDH: signature: ' + signature);
		//the signature is 65 bytes; strip off last byte for 256 encrption key
		const keyEncryptionKey = signature.substring(0, 128);
		//console.log('dhcrypt.initDH: keyEncryptionKey: ' + keyEncryptionKey);
		if (!!encryptedPrivateKey) {
		    //we already have an encrypted private key... need to decrypt it
		    let privateKey = dhcrypt.decrypt(keyEncryptionKey, encryptedPrivateKey, true);
		    //console.log('dhcrypt.initDH: privateKey: ' + privateKey);
		    if (privateKey.startsWith('0x'))
			privateKey = privateKey.substring(2);
		    //console.log('dhcrypt.initDH: private (' + privateKey.length + '): ' + privateKey.toString('hex'));
		    dh.setPrivateKey(privateKey, 'hex');
		    dh.generateKeys('hex');
		} else {
		    //generate a new private key, and encrypt it
		    dh.generateKeys('hex');
		    const privateKey = dh.getPrivateKey();
		    //console.log('dhcrypt.initDH: private (' + privateKey.length + '): ' + privateKey.toString('hex'));
		    encryptedPrivateKey = dhcrypt.encrypt(keyEncryptionKey, privateKey);
		    //console.log('dhcrypt.initDH: encryptedPrivateKey (' + encryptedPrivateKey.length + '): ' + encryptedPrivateKey);
		}
		//const publicKey = dh.getPublicKey('hex');
		//console.log('dhcrypt.initDH: public: (' + publicKey.length + '): ' + publicKey);
		dhcrypt.dh = dh;
		dhcrypt.epk = encryptedPrivateKey;
		cb(null);
	    }
	});
    },

    encryptedPrivateKey: function() {
	return(dhcrypt.epk);
    },

    publicKey: function() {
	let publicKey = dhcrypt.dh.getPublicKey('hex');
	//console.log('dhcrypt:publicKey: ' + publicKey);
	if (!publicKey.startsWith('0x'))
	    publicKey = '0x' + publicKey;
	return(publicKey);
    },

    //compute pairwise transient key
    ptk: function(otherPublicKey, toAddr, fromAddr, sentMsgCtr) {
	if (!dhcrypt.dh)
	    console.log('dhcrypt.ptk: dhcrypt.dh is null!');
	const otherPublicKeyBytes = common.hexToBytes(otherPublicKey);
    	const pmk = dhcrypt.dh.computeSecret(otherPublicKeyBytes, 'hex');
	//console.log('dhcrypt:ptk: myPublicKey = ' + dhcrypt.dh.getPublicKey('hex'));
	//console.log('dhcrypt:ptk: otherPublicKey = ' + otherPublicKey);
	//console.log('dhcrypt:ptk: pmk = ' + pmk.toString('hex'));
	//console.log('dhcrypt:ptk: sentMsgCtr = ' + sentMsgCtr);
	const sentMsgCtrBN = common.numberToBN(sentMsgCtr);
	const sentMsgCtrHex = common.BNToHex256(sentMsgCtrBN);
	//console.log('dhcrypt:ptk: toAddr = ' + toAddr);
	//console.log('dhcrypt:ptk: fromAddr = ' + fromAddr);
	//console.log('dhcrypt:ptk: sentMsgCtrHex = ' + sentMsgCtrHex);
	const hash = crypto.createHash('sha256');
	hash.update(pmk.toString('hex'), 'utf8');
	hash.update(toAddr.toUpperCase(), 'utf8');
	hash.update(fromAddr.toUpperCase(), 'utf8');
	hash.update(sentMsgCtrHex.toUpperCase(), 'utf8');
	const ptk = hash.digest('hex');
	//console.log('dhcrypt:ptk: ptk = ' + ptk.toString('hex'));
	return(ptk);
    },


    encrypt: function(ptk, message) {
	const cipher = crypto.createCipher('aes256', ptk);
	let encrypted;
	if (typeof(message) === 'string')
	    encrypted = cipher.update(message, 'utf8', 'hex');
	else
	    encrypted = cipher.update(message, null, 'hex');
	encrypted += cipher.final('hex');
	//console.log('encyrpt: message = ' + message);
	//console.log('encyrpt: encrypted = ' + encrypted);
	return(encrypted);
    },


    decrypt: function(ptk, encrypted, toHex) {
	if (encrypted.startsWith('0x'))
	    encrypted = encrypted.substring(2);
	let message = 'Unable to decrypt message';
	try {
	    //console.log('decyrpt: encrypted = ' + encrypted);
	    const decipher = crypto.createDecipher('aes256', ptk);
	    if (!!toHex) {
		message = decipher.update(encrypted, 'hex', 'hex');
		message += decipher.final('hex');
	    } else {
		message = decipher.update(encrypted, 'hex', 'utf8');
		message += decipher.final('utf8');
	    }
	    //console.log('decyrpt: message = ' + message);
	} catch (err) {
	    message = err + '\n' + encrypted;
	    console.log('decyrpt: encrypted = ' + encrypted);
	    console.log('decyrpt: err = ' + err);
	}
	return(message);
    },

};


//
// generate a secret
// we auto-generate the secret by signing an arbitrary message with the user's private key. the important point
// is that the word is generated deterministically (so that we can re-generate it whenever we want). the secret
// should never be shared or even stored anywhere at all.
//
// cb(err, signature)
//
function signatureFromAcct(cb) {
    const hexMsg = ethUtils.bufferToHex(dhcrypt.SIGNATURE_MSG);
    //console.log('hexMsg: ' + hexMsg.toString());
    common.web3.personal.sign(hexMsg, common.web3.eth.accounts[0], function(err, signature) {
	if (!!err) {
	    console.log('dhcrypt.signatureFromAcct: error signing arbitrary message. err = ' + err);
	    alert('Unable to generate secret: ' + err);
	    cb(err, null);
	} else {
	    //signature is 65 bytes (520 bits)
	    //console.log('dhcrypt.signatureFromAcct: signature (' + signature.length + '): ' + signature);
	    if (signature.startsWith('0x'))
		signature = signature.substring(2);
	    cb(null, signature);
	}
    });
}
