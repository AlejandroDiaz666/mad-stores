
//
// fcns related to ethereum and low level interaction w/ MadEscrow (ME) and MadStores (MS) contracts
//
const common = require('./common');
const ether = require('./ether');
const ethUtils = require('ethereumjs-util');
const ethtx = require('ethereumjs-tx');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");
const keccak = require('keccakjs');

const meEther = module.exports = {

    //ropsten
    //MadStores
    MS_CONTRACT_ADDR: null,
    MS_CONTRACT_ABI:  '[{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_minPrice","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_minDeliveries","type":"uint256"},{"name":"_minRating","type":"uint256"},{"name":"_lastActivity","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getCertainProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"recordReponse","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_defaultRegion","type":"uint256"},{"name":"active","type":"bool"}],"name":"modifyVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"}],"name":"adjustProductInc","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"categoryProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"claimAbandonedEscrow","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_minPrice","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_minDeliveries","type":"uint256"},{"name":"_minRating","type":"uint256"},{"name":"_lastActivity","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getRegionProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_minPrice","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_minDeliveries","type":"uint256"},{"name":"_minRating","type":"uint256"},{"name":"_lastActivity","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getCategoryProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_defaultRegion","type":"uint256"},{"name":"_name","type":"bytes"},{"name":"_desc","type":"bytes"},{"name":"_image","type":"bytes"}],"name":"registerVendor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"},{"name":"","type":"uint256"}],"name":"categoryProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_vendorAddr","type":"address"},{"name":"_category","type":"uint256"},{"name":"_region","type":"uint256"},{"name":"_minPrice","type":"uint256"},{"name":"_maxPrice","type":"uint256"},{"name":"_minDeliveries","type":"uint256"},{"name":"_minRating","type":"uint256"},{"name":"_lastActivity","type":"uint256"},{"name":"_productStartIdx","type":"uint256"},{"name":"_maxResults","type":"uint256"},{"name":"_onlyAvailable","type":"bool"}],"name":"getVendorProducts","outputs":[{"name":"_idx","type":"uint256"},{"name":"_productIDs","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_productID","type":"uint256"},{"name":"_surcharge","type":"uint256"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"}],"name":"adjustProductDec","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"vendorProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"products","outputs":[{"name":"price","type":"uint256"},{"name":"quantity","type":"uint256"},{"name":"category","type":"uint256"},{"name":"categoryProductIdx","type":"uint256"},{"name":"region","type":"uint256"},{"name":"regionProductIdx","type":"uint256"},{"name":"vendorAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseCancel","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"messageTransport","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"madEscrow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"vendorAccounts","outputs":[{"name":"noResponses","type":"uint256"},{"name":"deliveriesApproved","type":"uint256"},{"name":"deliveriesRejected","type":"uint256"},{"name":"region","type":"uint256"},{"name":"ratingSum","type":"uint256"},{"name":"responseTimeSum","type":"uint256"},{"name":"lastActivity","type":"uint256"},{"name":"activeFlag","type":"bool"},{"name":"isValid","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_rating","type":"uint8"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_rating","type":"uint8"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"deliveryReject","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_productID","type":"uint256"}],"name":"productInfo","outputs":[{"name":"_vendorAddr","type":"address"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"},{"name":"_available","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"regionProductCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"productCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowID","type":"uint256"},{"name":"_deliveryTime","type":"uint256"},{"name":"_attachmentIdx","type":"uint256"},{"name":"_ref","type":"uint256"},{"name":"_message","type":"bytes"}],"name":"purchaseApprove","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_messageTransport","type":"address"},{"name":"_madEscrow","type":"address"}],"name":"setPartners","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_productID","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_quantity","type":"uint256"}],"name":"adjustProduct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"name":"regionProducts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_messageTransport","type":"address"},{"name":"_madEscrow","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterVendorEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_productID","type":"uint256"},{"indexed":false,"name":"name","type":"bytes"},{"indexed":false,"name":"desc","type":"bytes"},{"indexed":false,"name":"image","type":"bytes"}],"name":"RegisterProductEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":false,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_surcharge","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"PurchaseDepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"PurchaseCancelEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_deliveryTime","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"PurchaseApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"PurchaseDeclineEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"DeliveryApproveEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"DeliveryRejectEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_vendorAddr","type":"address"},{"indexed":true,"name":"customerAddr","type":"address"},{"indexed":false,"name":"_escrowID","type":"uint256"},{"indexed":false,"name":"_productID","type":"uint256"},{"indexed":false,"name":"_msgId","type":"uint256"}],"name":"ClaimAbandonedEvent","type":"event"}]',
    //MadEscrow
    ME_CONTRACT_ADDR: null,
    ME_CONTRACT_ABI: '[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"escrows","outputs":[{"name":"closed","type":"bool"},{"name":"state","type":"uint8"},{"name":"partnerAddr","type":"address"},{"name":"vendorAddr","type":"address"},{"name":"customerAddr","type":"address"},{"name":"productId","type":"uint256"},{"name":"vendorBalance","type":"uint256"},{"name":"customerBalance","type":"uint256"},{"name":"promptDate","type":"uint256"},{"name":"deliveryDate","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"killContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"escrowsCounts","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"escrowXacts","outputs":[{"name":"createXactId","type":"uint256"},{"name":"modifyXactId","type":"uint256"},{"name":"cancelXactId","type":"uint256"},{"name":"declineXactId","type":"uint256"},{"name":"approveXactId","type":"uint256"},{"name":"releaseXactId","type":"uint256"},{"name":"burnXactId","type":"uint256"},{"name":"claimXactId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"retainedFees","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"_decimals","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_XactId","type":"uint256"}],"name":"claimAbandonedEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_initiatorAddr","type":"address"},{"name":"_XactId","type":"uint256"}],"name":"cancelEscrow","outputs":[{"name":"_responseTime","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"escrowCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_XactId","type":"uint256"},{"name":"_surcharge","type":"uint256"}],"name":"modifyEscrowPrice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_wdaiAmount","type":"uint256"}],"name":"unwrapDai","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"trusted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_XactId","type":"uint256"}],"name":"releaseEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_daiAmount","type":"uint256"}],"name":"wrapDai","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"withdrawEscrowFees","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"daiDecimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_productId","type":"uint256"},{"name":"_XactId","type":"uint256"},{"name":"_price","type":"uint256"},{"name":"_vendorAddr","type":"address"},{"name":"_customerAddr","type":"address"}],"name":"createEscrow","outputs":[{"name":"_escrowId","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isLocked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"escrowIds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_XactId","type":"uint256"}],"name":"burnEscrow","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_firstAddr","type":"address"}],"name":"verifyEscrowParty","outputs":[{"name":"_productId","type":"uint256"},{"name":"_otherAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_trustedAddr","type":"address"},{"name":"_trust","type":"bool"}],"name":"setTrust","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_vendorAddr","type":"address"}],"name":"verifyEscrowVendor","outputs":[{"name":"_productId","type":"uint256"},{"name":"_customerAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_vendorAddr","type":"address"},{"name":"_customerAddr","type":"address"}],"name":"verifyEscrow","outputs":[{"name":"_productId","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_initiatorAddr","type":"address"},{"name":"_XactId","type":"uint256"},{"name":"_ref","type":"uint256"}],"name":"recordReponse","outputs":[{"name":"_responseTime","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_customerAddr","type":"address"}],"name":"verifyEscrowCustomer","outputs":[{"name":"_productId","type":"uint256"},{"name":"_vendorAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_feesTokenAddr","type":"address"},{"name":"_daiTokenAddr","type":"address"}],"name":"setPartners","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_deliveryTime","type":"uint256"},{"name":"_XactId","type":"uint256"}],"name":"approveEscrow","outputs":[{"name":"_responseTime","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_escrowId","type":"uint256"},{"name":"_firstAddr","type":"address"}],"name":"verifyEscrowAny","outputs":[{"name":"_productId","type":"uint256"},{"name":"_otherAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_feesTokenAddr","type":"address"},{"name":"_daiTokenAddr","type":"address"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PaymentEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"TransferEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"ApprovalEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]',
    //Dai
    DAI_CONTRACT_ADDR: '0x83c892b3054b83ca01432ee03e56ce1f234adb71',
    ERC20_ABI: '[{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"_decimals","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"value","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]',
    firstBlock: 0,
    ropsten_firstBlock: 5744404,
    mainnet_me_contract_addr: '',
    mainnet_ms_contract_addr: '',
    ropsten_me_contract_addr: '0x10b8b5518011a0944b194e13cc73b1141cdf68b9',
    ropsten_ms_contract_addr: '0xded3345be06bd75cb4064c10d8f9b4862533edad',
    registerVendorEventTopic0: null,
    registerProductEventTopic0: null,
    registerVendorABI: null,
    registerProductABI: null,
    withdrawABI: null,
    recordReponseABI: null,
    purchaseDepositABI: null,
    purchaseApproveABI: null,
    purchaseDeclineABI: null,
    purchaseCancelABI: null,
    deliveryApproveABI: null,
    deliveryRejectABI: null,
    MSContractInstance: null,
    MEContractInstance: null,
    daiContractInstance: null,
    approveABI: null,


    // returns(err)
    // network = [ 'Mainnet' | 'Morden test network' | 'Ropsten test network' | 'Rinkeby test network' | 'Kovan test network' ]
    setNetwork: function(network) {
	let err = null;
	if (network.indexOf('Mainnet') >= 0) {
	    meEther.ME_CONTRACT_ADDR = meEther.mainnet_me_contract_addr;
	    meEther.MS_CONTRACT_ADDR = meEther.mainnet_ms_contract_addr;
	} else if (network.indexOf('Ropsten') >= 0) {
	    meEther.ME_CONTRACT_ADDR = meEther.ropsten_me_contract_addr;
	    meEther.MS_CONTRACT_ADDR = meEther.ropsten_ms_contract_addr;
	    meEther.firstBlock = meEther.ropsten_firstBlock;
	}
	if (!meEther.firstBlock)
	    err = network + ' is not a supported network';
	console.log('setNetwork: first block = ' + meEther.firstBlock);
	return(err);
    },


    // ---------------------------------------------------------------------------------------------------------
    // registerVendor
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, txid)
    registerVendor: function(regionBN, nameBytes, descBytes, imageBytes, cb) {
	const abiRegisterVendorFcn = meEther.abiEncodeRegisterVendor();
	const abiParms = meEther.abiEncodeRegisterVendorParms(regionBN, nameBytes, descBytes, imageBytes);
        const sendData = "0x" + abiRegisterVendorFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(meEther.MS_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterVendor: function() {
	//function registerVendor(uint256 _defaultRegion, bytes _name, bytes _desc, bytes _image) public
	if (!meEther.registerVendorABI)
	    meEther.registerVendorABI = ethabi.methodID('registerVendor', [ 'uint256', 'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerVendorABI);
    },

    abiEncodeRegisterVendorParms: function(regionBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ regionBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },

    getRegisterVendorEventTopic0: function() {
	if (!meEther.registerVendorEventTopic0) {
	    const keccak256 = new keccak(256);
	    //RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
	    keccak256.update("RegisterVendorEvent(address,bytes,bytes,bytes)");
	    meEther.registerVendorEventTopic0 = '0x' + keccak256.digest('hex');
	}
	console.log('registerVendorEventTopic0 = ' + meEther.registerVendorEventTopic0);
	return(meEther.registerVendorEventTopic0);
    },

    //cb(err, { activeFlag: bool, region: uint256 } )
    vendorAccountQuery: function(addr, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.vendorAccounts(addr, (err, resultObj) => {
	    const vendorAccountInfo = {};
	    if (!err) {
		//result = { true, 0 }
		const keys = [ 'noResponses', 'deliveriesApproved', 'deliveriesRejected', 'region', 'ratingSum', 'responseTimeSum', 'lastActivity', 'activeFlag' ];
		const resultArray = Array.from(resultObj);
		for (let i = 0; i < resultArray.length; ++i)
		    vendorAccountInfo[keys[i]] = resultArray[i];
		console.log('vendorAccountQuery: vendorAccountInfo = ' + JSON.stringify(vendorAccountInfo));
	    }
	    cb(err, vendorAccountInfo);
	});
    },


    // ---------------------------------------------------------------------------------------------------------
    // registerProduct & friends
    // ---------------------------------------------------------------------------------------------------------
    // cb(err, txid)
    // this fcn is also used to edit a product.
    // productID = 0 => register new product, else edit existing product
    registerProduct: function(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes, cb) {
	if (!productIdBN)
	    productIdBN = new BN('0', 16);
	const abiRegisterProductFcn = meEther.abiEncodeRegisterProduct();
	const abiParms = meEther.abiEncodeRegisterProductParms(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes);
        const sendData = "0x" + abiRegisterProductFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(meEther.MS_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },

    abiEncodeRegisterProduct: function() {
	//function registerProduct(uint256 _productID, uint256 _category, uint256 _price, uint256 _quantity, bytes _name, bytes _desc, bytes _image)
	if (!meEther.registerProductABI)
	    meEther.registerProductABI = ethabi.methodID('registerProduct', [ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
									     'bytes', 'bytes', 'bytes' ]).toString('hex');
	return(meEther.registerProductABI);
    },

    abiEncodeRegisterProductParms: function(productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes) {
	encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes', 'bytes' ],
				   [ productIdBN, categoryBN, regionBN, priceBN, quantityBN, nameBytes, descBytes, imageBytes ] ).toString('hex');
	return(encoded);
    },

    getRegisterProductEventTopic0: function() {
	if (!meEther.registerProductEventTopic0) {
	    const keccak256 = new keccak(256);
	    //RegisterProductEvent(uint256 indexed _productID, bytes name, bytes desc, bytes image);
	    keccak256.update("RegisterProductEvent(uint256,bytes,bytes,bytes)");
	    meEther.registerProductEventTopic0 = '0x' + keccak256.digest('hex');
	    //console.log('registerProductEventTopic0 = ' + meEther.registerProductEventTopic0);
	}
	return(meEther.registerProductEventTopic0);
    },

    //cb(err, productIdBN, { price: uint256, quantity: uint256, category: uint256, region: uint256, vendorAddr: address } )
    productInfoQuery: function(productIdBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.products(common.BNToHex256(productIdBN), (err, resultObj) => {
	    console.log('productInfoQuery: productID = ' + common.BNToHex256(productIdBN) + ', err = ' + err + ', result = ' + resultObj.toString());
	    const productInfo = {};
	    if (!err) {
		//result = { true, 0 }
		const keys = [ 'price', 'quantity', 'category', 'categoryProductIdx', 'region', 'regionProductIdx', 'vendorAddr' ];
		const resultArray = Array.from(resultObj);
		//console.log('productInfoQuery: resultArray = ' + resultArray);
		for (let i = 0; i < resultArray.length; ++i) {
		    productInfo[keys[i]] = resultArray[i];
		    //console.log('productInfoQuery: productPriceInfo[' + keys[i] + '] = ' + productPriceInfo[keys[i]]);
		}
	    }
	    cb(err, productIdBN, productInfo);
	});
    },


    // ---------------------------------------------------------------------------------------------------------
    // getCertainProducts & friends
    // getCertainProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _minPrice, uint256 _maxPrice, uint256 _minDeliveries, uint256 _minRating,
    //                    uint256 _lastActivity, uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public returns(uint256 _idx, uint256[] memory _productIDs);
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, lastSearchIdx, productIDs[])
    getCertainProducts: function(vendorAddr, categoryBN, regionBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, lastActivityBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getCertainProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN),
						      common.BNToHex256(minPriceBN), common.BNToHex256(maxPriceBN),
						      common.BNToHex256(minDeliveriesBN), common.BNToHex256(minRatingBN), common.BNToHex256(lastActivityBN),
						      common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							  console.log('getCertainProducts: err = ' + err + ', result = ' + result);
							  const products = result.toString().split(",");
							  //first entry is idx of last product
							  const lastSearchIdx = products.shift();
							  cb(err, lastSearchIdx, products);
						      });
    },

    //cb(err, lastSearchIdx, productIDs[])
    getVendorProducts: function (vendorAddr, categoryBN, regionBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, lastActivityBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getVendorProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN),
						     common.BNToHex256(minPriceBN), common.BNToHex256(maxPriceBN),
						     common.BNToHex256(minDeliveriesBN), common.BNToHex256(minRatingBN), common.BNToHex256(lastActivityBN),
						     common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							 console.log('getVendorProducts: err = ' + err + ', result = ' + result);
							 const products = result.toString().split(",");
							 //first entry is idx of last product
							 const lastSearchIdx = products.shift();
							 cb(err, lastSearchIdx, products);
						     });

    },

    //cb(err, lastSearchIdx, productIDs[])
    getCategoryProducts: function (vendorAddr, categoryBN, regionBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, lastActivityBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	console.log('getCategoryProducts: categoryBN = 0x' + categoryBN.toString(16));
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getCategoryProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN),
						       common.BNToHex256(minPriceBN), common.BNToHex256(maxPriceBN),
						       common.BNToHex256(minDeliveriesBN), common.BNToHex256(minRatingBN), common.BNToHex256(lastActivityBN),
						       common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							   console.log('getCategoryProducts: err = ' + err + ', result = ' + result);
							   const products = result.toString().split(",");
							   //first entry is idx of last product
							   const lastSearchIdx = products.shift();
							   cb(err, lastSearchIdx, products);
						       });
    },

    //cb(err, lastSearchIdx, productIDs[])
    getRegionProducts: function (vendorAddr, categoryBN, regionBN, minPriceBN, maxPriceBN, minDeliveriesBN, minRatingBN, lastActivityBN, onlyAvailable, productStartIdxBN, maxResults, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.getRegionProducts(vendorAddr, common.BNToHex256(categoryBN), common.BNToHex256(regionBN),
						     common.BNToHex256(minPriceBN), common.BNToHex256(maxPriceBN),
						     common.BNToHex256(minDeliveriesBN), common.BNToHex256(minRatingBN), common.BNToHex256(lastActivityBN),
						     common.BNToHex256(productStartIdxBN), common.numberToHex256(maxResults), onlyAvailable, (err, result) => {
							 console.log('getRegionProducts: err = ' + err + ', result = ' + result);
							 const products = result.toString().split(",");
							 //first entry is idx of last product
							 const lastSearchIdx = products.shift();
							 cb(err, lastSearchIdx, products);
						     });
    },

    //cb(err, countBN);
    regionProductCount: function(regionTlcBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.regionProductCounts(common.BNToHex256(regionTlcBN), (err, resultObj) => {
	    if (!!err)
		cb(err, null);
	    else {
		const countBN = common.numberToBN(resultObj);
		console.log('regionProductCount: err = ' + err + ', count[' + common.BNToHex256(regionTlcBN) + '], result = ' + countBN.toString(10));
		cb(err, countBN);
	    }
	});
    },

    //cb(err, countBN);
    categoryProductCount: function(categoryTlcBN, cb) {
	if (!meEther.MSContractInstance)
	    initMSContractInstance();
	meEther.MSContractInstance.categoryProductCounts(common.BNToHex256(categoryTlcBN), (err, resultObj) => {
	    if (!!err)
		cb(err, null);
	    else {
		const countBN = common.numberToBN(resultObj);
		console.log('categoryProductCount: err = ' + err + ', count[' + common.BNToHex256(categoryTlcBN) + '], result = ' + countBN.toString(10));
		cb(err, countBN);
	    }
	});
    },


    // ---------------------------------------------------------------------------------------------------------
    // wrapDai
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, balanceBN)
    //this retuens the amount of actual dai owned by this address
    getDaiBalance: function(acctAddr, cb) {
	if (!meEther.daiContractInstance)
	    initDaiContractInstance();
	meEther.daiContractInstance.balanceOf(acctAddr, (err, resultObj) => {
	    console.log('getDaiBalance: acctAddr = ' + acctAddr + ', err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null);
		return;
	    }
	    const balanceBN = common.numberToBN(resultObj);
	    cb(err, balanceBN);
	});
    },

    //approveCb(err, txid)
    //wrapping dai is a 2-part process: first wrapDaiApprove, then wrapDaiTransfer
    wrapDaiApprove: function(daiAmountBN, approveCb) {
	const abiApproveFcn = meEther.abiEncodeApprove();
	const abiParms = meEther.abiEncodeApproveParms(meEther.ME_CONTRACT_ADDR, daiAmountBN);
        const sendData = "0x" + abiApproveFcn + abiParms;
	//console.log('sendData.length = ' + sendData.length);
	//console.log('sendData = ' + sendData);
	ether.send(meEther.DAI_CONTRACT_ADDR, 0, 'wei', sendData, 0, approveCb);
    },

    //transferCb(err, txid)
    wrapDaiTransfer: function(daiAmountBN, transferCb) {
	const abiWrapDaiFcn = meEther.abiEncodeWrapDai();
	const abiParms = meEther.abiEncodeWrapDaiParms(daiAmountBN);
        const sendData = "0x" + abiWrapDaiFcn + abiParms;
	ether.send(meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, transferCb);
    },

    abiEncodeApprove: function() {
	//function approve(address spender, uint value) public returns (bool ok);
	if (!meEther.approveABI)
	    meEther.approveABI = ethabi.methodID('approve', [ 'address', 'uint256' ]).toString('hex');
	return(meEther.approveABI);
    },

    abiEncodeApproveParms: function(spender, amountBN) {
	encoded = ethabi.rawEncode([ 'address', 'uint256' ],
				   [ spender, amountBN ] ).toString('hex');
	return(encoded);
    },

    abiEncodeWrapDai: function() {
	//function wrapDai(uint256 _daiAmount)
	if (!meEther.wrapDaiABI)
	    meEther.wrapDaiABI = ethabi.methodID('wrapDai', [ 'uint256' ]).toString('hex');
	return(meEther.wrapDaiABI);
    },

    abiEncodeWrapDaiParms: function(amountBN) {
	encoded = ethabi.rawEncode([ 'uint256' ], [ amountBN ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // unwrapDai
    // ---------------------------------------------------------------------------------------------------------
    //cb(err, balanceBN)
    //this retuens the amount of dai in the madescrow contract, aka wrapped-dai
    getWDaiBalance: function(acctAddr, cb) {
	if (!meEther.MEContractInstance)
	    initMEContractInstance();
	meEther.MEContractInstance.balances(acctAddr, (err, resultObj) => {
	    console.log('getWDaiBalance: acctAddr = ' +acctAddr + ', err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null);
		return;
	    }
	    const balanceBN = common.numberToBN(resultObj);
	    cb(err, balanceBN);
	});
    },

    //transferCb(err, txid)
    unwrapDai: function(wdaiAmountBN, transferCb) {
	const abiUnwrapDaiFcn = meEther.abiEncodeUnwrapDai();
	const abiParms = meEther.abiEncodeUnwrapDaiParms(wdaiAmountBN);
        const sendData = "0x" + abiUnwrapDaiFcn + abiParms;
	ether.send(meEther.ME_CONTRACT_ADDR, 0, 'wei', sendData, 0, transferCb);
    },

    abiEncodeUnwrapDai: function() {
	//function unwrapDai(uint256 _wdaiAmount)
	if (!meEther.unwrapDaiABI)
	    meEther.unwrapDaiABI = ethabi.methodID('unwrapDai', [ 'uint256' ]).toString('hex');
	return(meEther.unwrapDaiABI);
    },

    abiEncodeUnwrapDaiParms: function(amountBN) {
	encoded = ethabi.rawEncode([ 'uint256' ], [ amountBN ] ).toString('hex');
	return(encoded);
    },



    // ---------------------------------------------------------------------------------------------------------
    // recordReponse & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //   function recordReponse(uint256 _escrowId, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    //
    recordReponse: function(escrowIdBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	console.log('recordResponse: escrowIdBN = 0x' + escrowIdBN.toString(16));
	console.log('recordResponse: msgFee = ' + msgFee);
	console.log('recordResponse: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('recordResponse: refBN = 0x' + refBN.toString(16));
	console.log('recordResponse: messageHex = ' + messageHex);
	const abiRecordReponseFcn = meEther.abiEncodeRecordReponse();
	const abiParms = meEther.abiEncodeRecordReponseParms(escrowIdBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiRecordReponseFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodeRecordReponse: function() {
	console.log('abiEncodeRecordReponse');
	if (!meEther.recordReponseABI)
	    meEther.recordReponseABI = ethabi.methodID('recordReponse', [ 'uint256', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.recordReponseABI);
    },

    abiEncodeRecordReponseParms: function(escrowIdBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // purchaseDeposit & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //   function purchaseDeposit(uint256 _escrowID, uint256 _productID, uint256 _surcharge, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    // pass escrowID of zero for a new purchase, else nz to add funds (specified by surchage) to an existing escrow
    //
    //
    purchaseDeposit: function(escrowIdBN, productIdBN, surchargeBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	console.log('purchaseDeposit: escrowIdBN = 0x' + escrowIdBN.toString(16));
	console.log('purchaseDeposit: productIdBN = 0x' + productIdBN.toString(16));
	console.log('purchaseDeposit: surchargeBN = 0x' + surchargeBN.toString(16));
	console.log('purchaseDeposit: msgFee = ' + msgFee);
	console.log('purchaseDeposit: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('purchaseDeposit: refBN = 0x' + refBN.toString(16));
	console.log('purchaseDeposit: messageHex = ' + messageHex);
	const abiPurchaseDepositFcn = meEther.abiEncodePurchaseDeposit();
	const abiParms = meEther.abiEncodePurchaseDepositParms(escrowIdBN, productIdBN, surchargeBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiPurchaseDepositFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodePurchaseDeposit: function() {
	console.log('abiEncodePurchaseDeposit');
	if (!meEther.purchaseDepositABI)
	    meEther.purchaseDepositABI = ethabi.methodID('purchaseDeposit', [ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.purchaseDepositABI);
    },

    abiEncodePurchaseDepositParms: function(escrowIdBN, productIdBN, surchargeBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, productIdBN, surchargeBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // purchaseApprove & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //     function purchaseApprove(uint256 _escrowID, uint256 _deliveryTime, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    //
    purchaseApprove: function(escrowIdBN, deliveryTimeBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	console.log('purchaseApprove: escrowIdBN = 0x' + escrowIdBN.toString(16));
	console.log('purchaseApprove: msgFee = ' + msgFee);
	console.log('purchaseApprove: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('purchaseApprove: messageHex = ' + messageHex);
	const abiPurchaseApproveFcn = meEther.abiEncodePurchaseApprove();
	const abiParms = meEther.abiEncodePurchaseApproveParms(escrowIdBN, deliveryTimeBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiPurchaseApproveFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodePurchaseApprove: function() {
	if (!meEther.purchaseApproveABI)
	    meEther.purchaseApproveABI = ethabi.methodID('purchaseApprove', [ 'uint256', 'uint256', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.purchaseApproveABI);
    },

    abiEncodePurchaseApproveParms: function(escrowIdBN, deliveryTimeBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, deliveryTimeBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // purchaseCancel & friends
    // this is used by either buyer or vendor to cancel/decline a purchase
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //     function purchaseCancel(uint256 _escrowID, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    //
    purchaseCancel: function(escrowIdBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	console.log('purchaseCancel: escrowIdBN = 0x' + escrowIdBN.toString(16));
	console.log('purchaseCancel: msgFee = ' + msgFee);
	console.log('purchaseCancel: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('purchaseCancel: messageHex = ' + messageHex);
	const abiPurchaseCancelFcn = meEther.abiEncodePurchaseCancel();
	const abiParms = meEther.abiEncodePurchaseCancelParms(escrowIdBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiPurchaseCancelFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodePurchaseCancel: function() {
	if (!meEther.purchaseCancelABI)
	    meEther.purchaseCancelABI = ethabi.methodID('purchaseCancel', [ 'uint256', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.purchaseCancelABI);
    },

    abiEncodePurchaseCancelParms: function(escrowIdBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // deliveryApprove & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //    function deliveryApprove(uint256 _escrowID, uint8 _rating, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    //
    deliveryApprove: function(escrowIdBN, ratingBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	const abiDeliveryApproveFcn = meEther.abiEncodeDeliveryApprove();
	const abiParms = meEther.abiEncodeDeliveryApproveParms(escrowIdBN, ratingBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiDeliveryApproveFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodeDeliveryApprove: function() {
	if (!meEther.deliveryApproveABI)
	    meEther.deliveryApproveABI = ethabi.methodID('deliveryApprove', [ 'uint256', 'uint8', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.deliveryApproveABI);
    },

    abiEncodeDeliveryApproveParms: function(escrowIdBN, ratingBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint8', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, ratingBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // deliveryReject & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //    function deliveryReject(uint256 _escrowID, uint8 _rating, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable;
    //
    //
    deliveryReject: function(escrowIdBN, ratingBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	const abiDeliveryRejectFcn = meEther.abiEncodeDeliveryReject();
	const abiParms = meEther.abiEncodeDeliveryRejectParms(escrowIdBN, ratingBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiDeliveryRejectFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodeDeliveryReject: function() {
	if (!meEther.deliveryRejectABI)
	    meEther.deliveryRejectABI = ethabi.methodID('deliveryReject', [ 'uint256', 'uint8', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.deliveryRejectABI);
    },

    abiEncodeDeliveryRejectParms: function(escrowIdBN, ratingBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint8', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, ratingBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // claimAbandonedEscrow & friends
    // ---------------------------------------------------------------------------------------------------------
    //
    // cb(err, txid)
    //
    //    function claimAbandonedEscrow(uint256 _escrowID, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    //
    //
    claimAbandoned: function(escrowIdBN, msgFee, attachmentIdxBN, refBN, messageHex, cb) {
	console.log('claimAbandoned: escrowIdBN = 0x' + escrowIdBN.toString(16));
	console.log('claimAbandoned: msgFee = ' + msgFee);
	console.log('claimAbandoned: attachmentIdxBN = 0x' + attachmentIdxBN.toString(16));
	console.log('claimAbandoned: messageHex = ' + messageHex);
	const abiClaimAbandonedFcn = meEther.abiEncodeClaimAbandoned();
	const abiParms = meEther.abiEncodeClaimAbandonedParms(escrowIdBN, attachmentIdxBN, refBN, messageHex);
        const sendData = "0x" + abiClaimAbandonedFcn + abiParms;
	ether.send(meEther.MS_CONTRACT_ADDR, msgFee, 'wei', sendData, 0, cb);
    },

    abiEncodeClaimAbandoned: function() {
	if (!meEther.claimAbandonedABI)
	    meEther.claimAbandonedABI = ethabi.methodID('claimAbandonedEscrow', [ 'uint256', 'uint256', 'uint256', 'bytes' ]).toString('hex');
	return(meEther.claimAbandonedABI);
    },

    abiEncodeClaimAbandonedParms: function(escrowIdBN, attachmentIdxBN, refBN, messageHex) {
	const bytes = common.hexToBytes(messageHex);
	const encoded = ethabi.rawEncode([ 'uint256', 'uint256', 'uint256', 'bytes' ],
					 [ escrowIdBN, attachmentIdxBN, refBN, bytes ] ).toString('hex');
	return(encoded);
    },


    // ---------------------------------------------------------------------------------------------------------
    // escrowsQuery & friends
    // ---------------------------------------------------------------------------------------------------------
    // cb(err, escrowCountBN)
    escrowCountQuery: function(acctAddr, cb) {
	if (!meEther.MEContractInstance)
	    initMEContractInstance();
	meEther.MEContractInstance.escrowsCounts(acctAddr, (err, resultObj) => {
	    console.log('escrowsCountQuery: acctAddr = ' + acctAddr + ', err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null);
		return;
	    }
	    const escrowCountBN = common.numberToBN(resultObj);
	    cb(err, escrowCountBN);
	});
    },

    //
    // these are the steps of an escow (they follow the order of escrowXacts
    //
    STEP_CREATE:   0,
    STEP_MODIFY:   1,
    STEP_CANCEL:   2,
    STEP_DECLINE:  3,
    STEP_APPROVE:  4,
    STEP_RELEASE:  5,
    STEP_BURN:     6,
    STEP_CLAIM:    7,
    xactKeys: [ 'createXactIdBN',
		'modifyXactIdBN',
		'cancelXactIdBN',
		'declineXactIdBN',
		'approveXactIdBN',
		'releaseXactIdBN',
		'burnXactIdBN',
		'claimXactIdBN' ],


    // cb(err, escrowInfo);
    escrowQuery: function(acctAddr, idx, cb) {
	if (!meEther.MEContractInstance)
	    initMEContractInstance();
	meEther.MEContractInstance.escrowIds(acctAddr, idx, (err, resultObj) => {
	    console.log('escrowQuery: acctAddr = ' + acctAddr + ', idx = ' + idx + ' => err = ' + err + ', result = ' + resultObj.toString());
	    if (!!err) {
		cb(err, null, null);
		return;
	    }
	    const escrowIdBN = common.numberToBN(resultObj);
	    const escrowInfo = {};
	    meEther.MEContractInstance.escrows('0x' + escrowIdBN.toString(16), (err, resultObj) => {
		console.log('escrowQuery: escrowId = 0x' + escrowIdBN.toString(16) + ' => err = ' + err + ', result = ' + resultObj.toString());
		const resultArray = Array.from(resultObj);
		const escrowKeys = [ 'isClosed', 'state', 'partnerAddr', 'vendorAddr', 'customerAddr', 'productId', 'vendorBalance', 'customerBalance', 'openDate', 'deliveryDate' ];
		for (let i = 0; i < resultArray.length; ++i)
		    escrowInfo[escrowKeys[i]] = (resultArray[i] == 'false') ? false :
		                                (resultArray[i] == 'true' ) ? true  : resultArray[i];
		meEther.MEContractInstance.escrowXacts('0x' + escrowIdBN.toString(16), (err, resultObj) => {
		    console.log('escrowQuery: escrowId = 0x' + escrowIdBN.toString(16) + ' => err = ' + err + ', result = ' + resultObj.toString());
		    const resultArray = Array.from(resultObj);
		    for (let i = 0; i < resultArray.length; ++i)
			escrowInfo[meEther.xactKeys[i]] = common.numberToBN(resultArray[i]);
		    console.log('escrowQuery: acctAddr = ' + acctAddr + ', idx = ' + idx + ', escrowInfo = ' + JSON.stringify(escrowInfo));
		    cb(err, escrowIdBN, escrowInfo);
		});
	    });
	});
    },


    //cb(err, txid)
    withdraw: function(cb) {
	const abiWithdrawFcn = meEther.abiEncodeWithdraw();
        const sendData = "0x" + abiWithdrawFcn;
	console.log('meEther.withdraw: sendData = ' + sendData);
	ether.send(meEther.EMT_CONTRACT_ADDR, 0, 'wei', sendData, 0, cb);
    },


    //cb(null, vendorAddr, name, desc, image)
    //pass in in a single result object
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseRegisterVendorEvent: function(result, cb) {
	//RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
	//typical
	//                  { "address" : "0x800bf6d2bb0156fd21a84ae20e1b9479dea0dca9",
	//                    "topics"  : [
	//                                  "0xa4b1fcc6b4f905c800aeac882ea4cbff09ab73cb784c8e0caad226fbeab35b63",
	//                                  "0x00000000000000000000000053c619594a6f15cd59f32f76257787d5438cd016", -- vendorAddr
	//                                ],
	//                    "data"    : "0x0000000000000000000000000000000000000000000000000000000000000060     -- offset to name
	//                                   00000000000000000000000000000000000000000000000000000000000000a0     -- offset to desc
	//                                   0000000000000000000000000000000000000000000000000000000000000100     -- offset to image
	//                                   0000000000000000000000000000000000000000000000000000000000000016     -- length of name
	//                                   546573742053746f72652030202d2d2065646974656400000000000000000000     -- name...
	//                                   0000000000000000000000000000000000000000000000000000000000000035     -- length of desc
	//                                   49742773207374696c6c207468652066697273742073746f72652c206f6e6c79     -- desc...
	//                                   206564697465640a486f77647920706172746e65720000000000000000000000     -- desc...
	//                                   000000000000000000000000000000000000000000000000000000000000104e     -- length of image
	//                                   ......                                                               -- image
	//                    "blockNumber" : "0x3d7f1d",
	//                    "timeStamp"   : "0x5b9a2cf4",
	//                    "gasPrice"    : "0x77359400",
	//                    "gasUsed"     : "0x1afcf",
	//                    "logIndex"    : "0x1a",
	//                    "transactionHash"  : "0x266d1d418629668f5f23acc6b30c1283e9ea8d124e6f1aeac6e8e33f150e6747",
	//                    "transactionIndex" : "0x15"
	//                  }
	//console.log('parseMessageEvent: result = ' + result);
	//console.log('parseMessageEvent: string = ' + JSON.stringify(result));
	//first 2 chars are '0x'; we want rightmost 20 out of 32 bytes
	const vendorAddr = result.topics[1].substring(2+(12*2));
	const nameHex = ether.extractHexData(result.data, 2+0);
	const descHex = ether.extractHexData(result.data, 2+64);
	const imageHex = ether.extractHexData(result.data, 2+128);
	const name = common.Utf8HexToStr(nameHex);
	const desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	const image = common.hexToImage(imageHex);
	cb(null, vendorAddr, name, desc, image)
    },



    //cb(null, vendorAddr, regionBN, categoryBN, productIdBN, name, desc, image)
    //pass in in a single result object
    //note: numbers in result may be in hex or dec. hex if preceeded by 0x. topics and data are always hex.
    parseRegisterProductEvent: function(result, cb) {
	//RegisterProductEvent(address indexed _vendorAddr, uint256 indexed _region, uint256 indexed _category,
	//                     uint256 _productID, bytes name, bytes desc, bytes image);
	//typical
	//                   { "address"    :  "0x6d6e8314bc319b3315bc51b7941e43adedf25b26",
	//                     "topics"     : [
	//                                     "0xe5cf209e623f9e36231ee0a288bb82ce7372e79dd57c5356f0a64e3a5a575db6",
	//                                     "0x0000000000000000000000000000000000000000000000000000000000000003", -- productId
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
	const productIdBN = common.numberToBN(result.topics[1]);
	const nameHex = ether.extractHexData(result.data, 2+0);
	const descHex = ether.extractHexData(result.data, 2+64);
	const imageHex = ether.extractHexData(result.data, 2+128);
	const name = common.Utf8HexToStr(nameHex);
	console.log('parseRegisterProductEvent: nameHex = ' + nameHex + ', name = ' + name);
	const desc = common.Utf8HexToStr(descHex);
        //image data is utf8 "data:image/png;base64," + base64ImageData;
	const image = common.hexToImage(imageHex);
	cb(null, productIdBN, name, desc, image);
    },


    //produces a price string, eg. nominal USD, with 2 decimals from price, which is demoninated in
    //cononical dai (ie, 18 decimals)
    daiBNToUsdStr: function(daiBN, places) {
	if (places == undefined)
	    places = 2;
	// dai is 18 decimals
	const tenE16 = new BN('2386F26FC10000', 16);
	const daiBNx16 = daiBN.div(tenE16);
	const cents = daiBNx16.toNumber();
	const usd = (1.0 * cents) / 100;
	console.log('daiBNToUsdStr: daiBN = ' + daiBN.toString(10) + ' => ' + usd.toString(10));
	return(usd.toFixed(places));
    },

    //produces a Dai BN (ie, 18 decimals) from nominal dai, AKA USD
    usdStrToDaiBN: function(usdStr) {
	const cents = parseFloat(usdStr) * 100;
	//dai is 18 decimals
	const tenE16 = new BN('2386F26FC10000', 16);
	const daiBNx16 = new BN(cents);
	const daiBN = daiBNx16.mul(tenE16);
	console.log('usdStrToDaiBN: cents = ' + cents + ', daiBN = ' + daiBN.toString(10));
	return(daiBN);
    },

};

function initMSContractInstance() {
    const ABIArray = JSON.parse(meEther.MS_CONTRACT_ABI);
    const MScontract = common.web3.eth.contract(ABIArray);
    console.log('meEther.initMSContractInstance: contract: ' + MScontract);
    console.log('meEther.initMSContractInstance: contract addr: ' + meEther.MS_CONTRACT_ADDR);
    meEther.MSContractInstance = MScontract.at(meEther.MS_CONTRACT_ADDR);
}

function initMEContractInstance() {
    const ABIArray = JSON.parse(meEther.ME_CONTRACT_ABI);
    const MEcontract = common.web3.eth.contract(ABIArray);
    console.log('meEther.initMEContractInstance: contract: ' + MEcontract);
    console.log('meEther.initMEContractInstance: contract addr: ' + meEther.ME_CONTRACT_ADDR);
    meEther.MEContractInstance = MEcontract.at(meEther.ME_CONTRACT_ADDR);
}

function initDaiContractInstance() {
    const ABIArray = JSON.parse(meEther.ERC20_ABI);
    const daiContract = common.web3.eth.contract(ABIArray);
    //this will change....
    console.log('meEther.initDaiInstance: contract addr: ' + meEther.DAI_CONTRACT_ADDR);
    meEther.daiContractInstance = daiContract.at(meEther.DAI_CONTRACT_ADDR);
}
