pragma solidity ^0.5.0;


import './SafeMath.sol';
import './iERC20Token.sol';

// -------------------------------------------------------------------------------------------------------
//  interface to message transport
// -------------------------------------------------------------------------------------------------------
contract MessageTransport {
  function getFee(address _fromAddr, address _toAddr) public view returns(uint256 _fee);
  function sendMessage(address _fromAddr, address _toAddr, uint attachmentIdx, uint _ref, bytes memory _message) public payable returns (uint _messageId);
}

// -------------------------------------------------------------------------------------------------------
//  interface to MADEscrow
// -------------------------------------------------------------------------------------------------------
contract MadEscrow is iERC20Token {
  function createEscrow(uint256 _productID, uint256 _XactId, uint256 _price, address _vendorAddr, address _customerAddr) public returns (uint256 _escrowID);
  function verifyEscrow(uint256 _escrowID, address _vendorAddr, address _customerAddr) public view returns (uint256 _productID);
  function verifyEscrowVendor(uint256 _escrowID, address _vendorAddr) public view returns (uint256 _productID, address _customerAddr);
  function verifyEscrowCustomer(uint256 _escrowID, address _customerAddr) public view returns (uint256 _productID, address _vendorAddr);
  function verifyEscrowParty(uint256 _escrowId, address _firstAddr) public view returns (uint256 _productId, address _otherAddr);
  function verifyEscrowAny(uint256 _escrowId, address _firstAddr) public view returns (uint256 _productId, address _otherAddr);
  function recordReponse(uint256 _escrowId, address _initiatorAddr, uint256 _XactId, uint256 _ref) public returns (uint _responseTime);
  function modifyEscrowPrice(uint256 _escrowID, uint256 _XactId, uint256 _surcharge) public;
  function cancelEscrow(uint256 _escrowId, address _initiatorAddr, uint256 _XactId) public returns (uint _responseTime);
  function approveEscrow(uint256 _escrowID, uint256 _deliveryTime, uint256 _XactId) public returns (uint _responseTime);
  function releaseEscrow(uint256 _escrowID, uint256 _XactId) public;
  function burnEscrow(uint256 _escrowID, uint256 _XactId) public;
  function claimAbandonedEscrow(uint256 _escrowId, uint256 _XactId) public;
}


// -------------------------------------------------------------------------------------------------------
//  MadStores Contract
// -------------------------------------------------------------------------------------------------------
contract MadStores is SafeMath {

  // -----------------------------------------------------------------------------------------------------
  // events
  // -----------------------------------------------------------------------------------------------------
  event RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
  event RegisterProductEvent(uint256 indexed _productID, bytes name, bytes desc, bytes image);
  event PurchaseDepositEvent(address indexed _vendorAddr, address customerAddr, uint256 _escrowID, uint256 _productID, uint256 _surcharge, uint256 _msgId);
  event PurchaseCancelEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _msgId);
  event PurchaseApproveEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _deliveryTime, uint256 _msgId);
  event PurchaseDeclineEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _msgId);
  event DeliveryApproveEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _msgId);
  event DeliveryRejectEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _msgId);
  event ClaimAbandonedEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _escrowID, uint256 _productID, uint256 _msgId);


  // -----------------------------------------------------------------------------------------------------
  // Product structure
  // -----------------------------------------------------------------------------------------------------
  struct Product {
    uint256 price;
    uint256 quantity;
    uint256 category;
    uint256 categoryProductIdx;
    uint256 region;
    uint256 regionProductIdx;
    address vendorAddr;
  }

  // -----------------------------------------------------------------------------------------------------
  // Vendor Account structure
  // for keeping track of vendor reputation
  // -----------------------------------------------------------------------------------------------------
  struct VendorAccount {
    uint256 noResponses;
    uint256 deliveriesApproved;
    uint256 deliveriesRejected;
    uint256 region;
    uint256 ratingSum;
    uint256 responseTimeSum;
    uint256 lastActivity;
    bool activeFlag;
    bool isValid;
  }


  // -----------------------------------------------------------------------------------------------------
  // SearchParms struct is used to pass search parameters to isCertainProduct()
  // -----------------------------------------------------------------------------------------------------
  struct SearchParms {
    bool onlyAvailable;
    address vendorAddr;
    uint256 category;
    uint256 region;
    uint256 minPrice;
    uint256 maxPrice;
    uint256 minDeliveries;
    uint256 minRating;
    uint256 lastActivity;
  }


  // -----------------------------------------------------------------------------------------------------
  // data storage
  // -----------------------------------------------------------------------------------------------------
  bool public isLocked;
  address payable public owner;
  MadEscrow public madEscrow;
  MessageTransport public messageTransport;
  uint256 public productCount;
  //productID to product
  mapping (uint256 => Product) public products;
  //vendorProductIdx to productID
  mapping (address => uint256) public vendorProductCounts;
  mapping (address => mapping(uint256 => uint256)) public vendorProducts;
  //topLevelRegion ProductIdx to productID
  mapping (uint8 => uint256) public regionProductCounts;
  mapping (uint256 => mapping(uint256 => uint256)) public regionProducts;
  //topLevelCategory ProductIdx to productID
  mapping (uint8 => uint256) public categoryProductCounts;
  mapping (uint8 => mapping(uint256 => uint256)) public categoryProducts;
  mapping (address => VendorAccount) public vendorAccounts;


  // -----------------------------------------------------------------------------------------------------
  // modifiers
  // -----------------------------------------------------------------------------------------------------
  modifier ownerOnly {
    require(msg.sender == owner, "owner only");
    _;
  }
  modifier unlockedOnly {
    require(!isLocked, "unlocked only");
    _;
  }


  // -----------------------------------------------------------------------------------------------------
  //  constructor and tune
  // -----------------------------------------------------------------------------------------------------
  constructor(address _messageTransport, address _madEscrow) public {
    owner = msg.sender;
    messageTransport = MessageTransport(_messageTransport);
    madEscrow = MadEscrow(_madEscrow);
  }
  //for debug only...
  function setPartners(address _messageTransport, address _madEscrow) public unlockedOnly ownerOnly {
    messageTransport = MessageTransport(_messageTransport);
    madEscrow = MadEscrow(_madEscrow);
  }
  function lock() public ownerOnly {
    isLocked = true;
  }
  //default payable function. refuse.
  function () external payable {
    revert();
  }


  // -----------------------------------------------------------------------------------------------------
  // see if a product matches search criteria
  // category & region are semi hierarchical. the top 8 bits are interpreted as a number specifiying the
  // top-level-category or top-level-region. if specified, then these must match exactly. the lower 248
  // bits are a bitmask of sub-categories or sub-regions. if specified then we only look for some overlap
  // between the product bitmap and the search parameter.
  // -----------------------------------------------------------------------------------------------------
  function isCertainProduct(uint256 _productID, SearchParms memory _searchParms) internal view returns(bool) {
    Product storage _product = products[_productID];
    VendorAccount storage _vendorAccount = vendorAccounts[_product.vendorAddr];
    if (_searchParms.onlyAvailable) {
      uint256 _minVendorBond = safeMul(_product.price, 50) / 100;
      uint256 _vendorBalance = madEscrow.balanceOf(_product.vendorAddr);
      if (_product.quantity == 0 || _product.price == 0 || _vendorBalance < _minVendorBond)
	return(false);
    }
    if (_vendorAccount.deliveriesApproved < _searchParms.minDeliveries)
      return(false);
    if (_searchParms.minRating > 0) {
      uint256 rating = _vendorAccount.ratingSum / safeAdd(_vendorAccount.deliveriesApproved, _vendorAccount.deliveriesRejected);
      if (rating < _searchParms.minRating)
	return(false);
    }
    uint8 _tlc = uint8(_searchParms.category >> 248);
    uint256 _llcBits = _searchParms.category & ((2 ** 248) - 1);
    uint8 _tlr = uint8(_searchParms.region >> 248);
    uint256 _llrBits = _searchParms.region & ((2 ** 248) - 1);
    uint8 _productTlc = uint8(_product.category >> 248);
    uint256 _productLlcBits = _product.category & ((2 ** 248) - 1);
    uint8 _productTlr = uint8(_product.region >> 248);
    uint256 _productLlrBits = _product.region & ((2 ** 248) - 1);
    //note that productLlrBits == 0 => all sub-regions
    if ((_searchParms.vendorAddr     == address(0) ||  _product.vendorAddr                == _searchParms.vendorAddr  ) &&
	(_tlc                        == 0          ||  _productTlc                        == _tlc                     ) &&
	(_llcBits                    == 0          || (_productLlcBits & _llcBits)        != 0                        ) &&
	(_tlr                        == 0          ||  _productTlr                        == _tlr                     ) &&
	(_llrBits                    == 0          ||
	 _productLlrBits             == 0          || (_productLlrBits & _llrBits)        != 0                        ) &&
	(_searchParms.minPrice       == 0          ||  _product.price                     >= _searchParms.minPrice    ) &&
	(_searchParms.maxPrice       == 0          ||  _product.price                     <= _searchParms.maxPrice    ) &&
        (                                              _vendorAccount.lastActivity        >= _searchParms.lastActivity) ) {
      return(true);
    }
    return(false);
  }




  // _maxProducts >= 1
  // note that array will always have _maxResults entries. ignore productID = 0
  // this is a general purpose get-products fcn. it's main use will be when not looking up products by vendor address, category, or region.
  // if you're performing a search based on any of those parameters then it will be more efficient to call the most specific variant: getVendorProducts,
  // getCategoryProducts, or getRegionProducts. if searching based on 2 or more parameters then compare vendorProductCounts[_vendorAddr] to
  // categoryProductCounts[_tlc], to regionProductCounts[_tlr], and call the function that corresponds to the smallest number of products.
  //
  function getCertainProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _minPrice, uint256 _maxPrice, uint256 _minDeliveries, uint256 _minRating,
			      uint256 _lastActivity, uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    SearchParms memory _searchParms = SearchParms(_onlyAvailable, _vendorAddr, _category, _region, _minPrice, _maxPrice, _minDeliveries, _minRating, _lastActivity);
    uint _count = 0;
    _productIDs = new uint256[](_maxResults);
    //note: first productID is 1
    uint _productID = _productStartIdx;
    for ( ; _productID <= productCount; ++_productID) {
      if (_productID != 0 && isCertainProduct(_productID, _searchParms)) {
	_productIDs[_count] = _productID;
	if (++_count >= _maxResults)
	  break;
      }
    }
    _idx = _productID;
  }

  // _maxResults >= 1
  // _vendorAddr != 0
  // note that array will always have _maxResults entries. ignore productID = 0
  // if category is specified, then top-level-category (top 8 bits) must match product tlc exactly, whereas low-level-category bits must have
  // any overlap with product llc bits.
  //
  function getVendorProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _minPrice, uint256 _maxPrice, uint256 _minDeliveries, uint256 _minRating,
			     uint256 _lastActivity, uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    SearchParms memory _searchParms = SearchParms(_onlyAvailable, _vendorAddr, _category, _region, _minPrice, _maxPrice, _minDeliveries, _minRating, _lastActivity);
    require(_searchParms.vendorAddr != address(0), "address must be specified");
    uint _count = 0;
    _productIDs = new uint256[](_maxResults);
    uint256 _vendorProductCount = vendorProductCounts[_searchParms.vendorAddr];
    mapping(uint256 => uint256) storage _vendorProducts = vendorProducts[_searchParms.vendorAddr];
    //note first productID is at vendorProducts[1];
    for (_idx = _productStartIdx; _idx <= _vendorProductCount; ++_idx) {
      uint _productID = _vendorProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _searchParms)) {
	_productIDs[_count] = _productID;
	if (++_count >= _maxResults)
	  break;
      }
    }
  }

  // _maxResults >= 1
  // _category != 0
  // note that array will always have _maxResults entries. ignore productID = 0
  // top-level-category (top 8 bits) must match product tlc exactly, whereas low-level-category bits must have any overlap with product llc bits.
  //
  function getCategoryProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _minPrice, uint256 _maxPrice, uint256 _minDeliveries, uint256 _minRating,
			       uint256 _lastActivity, uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    SearchParms memory _searchParms = SearchParms(_onlyAvailable, _vendorAddr, _category, _region, _minPrice, _maxPrice, _minDeliveries, _minRating, _lastActivity);
    require(_searchParms.category != 0, "category must be specified");
    uint _count = 0;
    uint8 _tlc = uint8(_searchParms.category >> 248);
    _productIDs = new uint256[](_maxResults);
    uint256 _categoryProductCount = categoryProductCounts[_tlc];
    mapping(uint256 => uint256) storage _categoryProducts = categoryProducts[_tlc];
    //note first productID is at categoryProducts[1];
    for (_idx = _productStartIdx; _idx <= _categoryProductCount; ++_idx) {
      uint _productID = _categoryProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _searchParms)) {
	_productIDs[_count] = _productID;
	if (++_count >= _maxResults)
	  break;
      }
    }
  }


  // _maxResults >= 1
  // _region != 0
  // note that array will always have _maxResults entries. ignore productID = 0
  // top-level-category (top 8 bits) must match product tlc exactly, whereas low-level-category bits must have any overlap with product llc bits.
  //
  function getRegionProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _minPrice, uint256 _maxPrice, uint256 _minDeliveries, uint256 _minRating,
			     uint256 _lastActivity, uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    SearchParms memory _searchParms = SearchParms(_onlyAvailable, _vendorAddr, _category, _region, _minPrice, _maxPrice, _minDeliveries, _minRating, _lastActivity);
    require(_searchParms.region != 0, "region must be specified");
    uint _count = 0;
    uint8 _tlr = uint8(_searchParms.region >> 248);
    _productIDs = new uint256[](_maxResults);
    uint256 _regionProductCount = regionProductCounts[_tlr];
    mapping(uint256 => uint256) storage _regionProducts = regionProducts[_tlr];
    //note first productID is at regionProducts[1];
    for (_idx = _productStartIdx; _idx <= _regionProductCount; ++_idx) {
      uint _productID = _regionProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _searchParms)) {
	_productIDs[_count] = _productID;
	if (++_count >= _maxResults)
	  break;
      }
    }
  }


  // -----------------------------------------------------------------------------------------------------
  // register a VendorAccount
  // -----------------------------------------------------------------------------------------------------
  function registerVendor(uint256 _defaultRegion, bytes memory _name, bytes memory _desc, bytes memory _image) public {
    vendorAccounts[msg.sender].activeFlag = true;
    vendorAccounts[msg.sender].isValid = true;
    vendorAccounts[msg.sender].region = _defaultRegion;
    emit RegisterVendorEvent(msg.sender, _name, _desc, _image);
  }

  function modifyVendor(uint256 _defaultRegion, bool active) public {
    require(vendorAccounts[msg.sender].isValid == true, "invalid  vendor");
    vendorAccounts[msg.sender].activeFlag = active;
    vendorAccounts[msg.sender].region = _defaultRegion;
  }


  //if top level category/region changes we leave a hole in the oldTl[cr] map, and allocate a new entry in the newTl[cr] map
  function updateTlcTlr(uint256 _productID, uint8 _newTlc, uint8 _newTlr) internal returns(uint256 _categoryProductIdx, uint256 _regionProductIdx) {
    Product storage _product = products[_productID];
    uint8 _oldTlc = uint8(_product.category >> 248);
    if (_oldTlc == _newTlc) {
      _categoryProductIdx = _product.categoryProductIdx;
    } else {
      categoryProducts[_oldTlc][_product.categoryProductIdx] = 0;
      _categoryProductIdx = categoryProductCounts[_newTlc] = safeAdd(categoryProductCounts[_newTlc], 1);
    }
    uint8 _oldTlr = uint8(_product.region >> 248);
    if (_oldTlr == _newTlr) {
      _regionProductIdx = _product.regionProductIdx;
    } else {
      regionProducts[_oldTlr][_product.regionProductIdx] = 0;
      _regionProductIdx = regionProductCounts[_newTlr] = safeAdd(regionProductCounts[_newTlr], 1);
    }
  }


  // -----------------------------------------------------------------------------------------------------
  // register a Product
  // called by vendor
  // productID = 0 => register a new product, auto-assign product id
  // -----------------------------------------------------------------------------------------------------
  function registerProduct(uint256 _productID, uint256 _category, uint256 _region, uint256 _price, uint256 _quantity,
			   bytes memory _name, bytes memory _desc, bytes memory _image) public {
    uint256 _categoryProductIdx;
    uint256 _regionProductIdx;
    uint8 _newTlc = uint8(_category >> 248);
    uint8 _newTlr = uint8(_region >> 248);
    require(vendorAccounts[msg.sender].isValid == true, "invalid  vendor");
    if (_productID == 0) {
      _productID = productCount = safeAdd(productCount, 1);
      uint256 _vendorProductIdx = vendorProductCounts[msg.sender] = safeAdd(vendorProductCounts[msg.sender], 1);
      vendorProducts[msg.sender][_vendorProductIdx] = _productID;
      _categoryProductIdx = categoryProductCounts[_newTlc] = safeAdd(categoryProductCounts[_newTlc], 1);
      _regionProductIdx = regionProductCounts[_newTlr] = safeAdd(regionProductCounts[_newTlr], 1);
    } else {
      require(products[_productID].vendorAddr == msg.sender, "caller does not own this product");
      (_categoryProductIdx, _regionProductIdx) = updateTlcTlr(_productID, _newTlc, _newTlr);
    }
    Product storage _product = products[_productID];
    _adjustProduct(_product, _price, _quantity);
    _product.category = _category;
    _product.categoryProductIdx = _categoryProductIdx;
    _product.region = _region;
    _product.regionProductIdx = _regionProductIdx;
    _product.vendorAddr = msg.sender;
    categoryProducts[_newTlc][_categoryProductIdx] = _productID;
    regionProducts[_newTlr][_regionProductIdx] = _productID;
    emit RegisterProductEvent(_productID, _name, _desc, _image);
  }

  function adjustProduct(uint256 _productID, uint256 _price, uint256 _quantity) public {
    Product storage _product = products[_productID];
    require(_product.vendorAddr == msg.sender, "caller does not own this product");
    _adjustProduct(_product, _price, _quantity);
  }
  function adjustProductInc(uint256 _productID, uint256 _price, uint256 _quantity) public {
    Product storage _product = products[_productID];
    require(_product.vendorAddr == msg.sender, "caller does not own this product");
    _adjustProduct(_product, _price, safeAdd(_product.quantity, _quantity));
  }
  function adjustProductDec(uint256 _productID, uint256 _price, uint256 _quantity) public {
    Product storage _product = products[_productID];
    require(_product.vendorAddr == msg.sender, "caller does not own this product");
    _adjustProduct(_product, _price, safeSub(_product.quantity, _quantity));
  }
  function _adjustProduct(Product storage _product, uint256 _price, uint256 _quantity) internal {
    _product.price = _price;
    _product.quantity = _quantity;
  }

  function productInfo(uint256 _productID) public view returns(address _vendorAddr, uint256 _price, uint256 _quantity, bool _available) {
    Product storage _product = products[_productID];
    _price = _product.price;
    _quantity = _product.quantity;
    _vendorAddr = _product.vendorAddr;
    uint256 _minVendorBond = safeMul(_price, 50) / 100;
    uint256 _vendorBalance = madEscrow.balanceOf(_product.vendorAddr);
    _available = (_quantity != 0 && _price != 0 && _vendorBalance >= _minVendorBond);
  }


  // -----------------------------------------------------------------------------------------------------
  // send a response to an escrow function
  // -----------------------------------------------------------------------------------------------------
  function recordReponse(uint256 _escrowId, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    address _otherAddr;
    (, _otherAddr) = madEscrow.verifyEscrowAny(_escrowId, msg.sender);
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 64;
    require(msg.data.length > _noDataLength, "must include message");
    uint256 _msgFee = messageTransport.getFee(msg.sender, _otherAddr);
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _otherAddr, _attachmentIdx, _ref, _message);
    uint256 _responseTime = madEscrow.recordReponse(_escrowId, msg.sender, _msgId, _ref);
    if (_responseTime != 0) {
      vendorAccounts[msg.sender].noResponses = safeAdd(vendorAccounts[msg.sender].noResponses, 1);
      vendorAccounts[msg.sender].responseTimeSum = safeAdd(vendorAccounts[msg.sender].responseTimeSum, _responseTime);
    }
  }


  // -----------------------------------------------------------------------------------------------------
  // deposit funds to purchase a Product
  // this creates an escrow
  // called by customer
  // escrowID = 0 => create a new escrow, else use an existing escrow acct
  // an optional surchage (shipping & handling?) can be added to the nominal price of the product. this
  // function can also be called to add a surchage to an already existing escrow.
  // -----------------------------------------------------------------------------------------------------
  function purchaseDeposit(uint256 _escrowID, uint256 _productID, uint256 _surcharge, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    address _vendorAddr;
    if (_escrowID != 0) {
      //ignore passed productID
      (_productID, _vendorAddr) = madEscrow.verifyEscrowCustomer(_escrowID, msg.sender);
    } else {
      require(_productID != 0, "product ID cannot be zero");
    }
    Product storage _product = products[_productID];
    _vendorAddr = _product.vendorAddr;
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _vendorAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _vendorAddr, _attachmentIdx, _ref, _message);
    if (_escrowID == 0) {
      require(_product.quantity != 0, "product is not available");
      require(_product.price != 0, "product price is not valid");
      uint256 _modifiedPrice = safeAdd(_product.price, _surcharge);
      _escrowID = madEscrow.createEscrow(_productID, _msgId, _modifiedPrice, _vendorAddr, msg.sender);
      _product.quantity -= 1;
    } else {
      require(_surcharge != 0, "escrow already exists");
      madEscrow.modifyEscrowPrice(_escrowID, _msgId, _surcharge);
    }
    emit PurchaseDepositEvent(_vendorAddr, msg.sender, _escrowID, _productID, _surcharge, _msgId);
  }


  // -----------------------------------------------------------------------------------------------------
  // cancel purchase of a product
  // called by vendor to decline a sale
  // called by customer to cancel a purchase
  // -- only before purchase has been approved by vendor
  // -----------------------------------------------------------------------------------------------------
  function purchaseCancel(uint256 _escrowID, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    (uint256 _productID, address _otherAddr) = madEscrow.verifyEscrowParty(_escrowID, msg.sender);
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _otherAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _otherAddr, _attachmentIdx, _ref, _message);
    Product storage _product = products[_productID];
    _product.quantity += 1;
    uint256 _responseTime = madEscrow.cancelEscrow(_escrowID, msg.sender, _msgId);
    if (msg.sender == _product.vendorAddr) {
      if (_responseTime != 0) {
	vendorAccounts[msg.sender].noResponses = safeAdd(vendorAccounts[msg.sender].noResponses, 1);
	vendorAccounts[msg.sender].responseTimeSum = safeAdd(vendorAccounts[msg.sender].responseTimeSum, _responseTime);
      }
      emit PurchaseDeclineEvent(msg.sender, _otherAddr, _escrowID, _productID, _msgId);
    } else {
      emit PurchaseCancelEvent(_otherAddr, msg.sender, _escrowID, _productID, _msgId);
    }
  }


  // -----------------------------------------------------------------------------------------------------
  // approve of a purchase
  // called by vendor
  // -----------------------------------------------------------------------------------------------------
  function purchaseApprove(uint256 _escrowID, uint256 _deliveryTime, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    (uint256 _productID, address _customerAddr) = madEscrow.verifyEscrowVendor(_escrowID, msg.sender);
    require(vendorAccounts[msg.sender].isValid == true, "invalid  vendor");
    vendorAccounts[msg.sender].lastActivity = now;
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _customerAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _customerAddr, _attachmentIdx, _ref, _message);
    uint256 _responseTime = madEscrow.approveEscrow(_escrowID, _deliveryTime, _msgId);
    if (_responseTime != 0) {
      vendorAccounts[msg.sender].noResponses = safeAdd(vendorAccounts[msg.sender].noResponses, 1);
      vendorAccounts[msg.sender].responseTimeSum = safeAdd(vendorAccounts[msg.sender].responseTimeSum, _responseTime);
    }
    emit PurchaseApproveEvent(msg.sender, _customerAddr, _escrowID, _productID, _deliveryTime, _msgId);
  }


  // -----------------------------------------------------------------------------------------------------
  // acknowledge succesful delivery of a purchased item
  // called by customer
  // -----------------------------------------------------------------------------------------------------
  function deliveryApprove(uint256 _escrowID, uint8 _rating, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    (uint256 _productID, address _vendorAddr) = madEscrow.verifyEscrowCustomer(_escrowID, msg.sender);
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _vendorAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _vendorAddr, _attachmentIdx, _ref, _message);
    madEscrow.releaseEscrow(_escrowID, _msgId);
    vendorAccounts[_vendorAddr].deliveriesApproved = safeAdd(vendorAccounts[_vendorAddr].deliveriesApproved, 1);
    if (_rating > 10)
        _rating = 10;
    vendorAccounts[_vendorAddr].ratingSum = safeAdd(vendorAccounts[_vendorAddr].ratingSum, _rating);
    vendorAccounts[_vendorAddr].lastActivity = now;
    emit DeliveryApproveEvent(_vendorAddr, msg.sender, _escrowID, _productID, _msgId);
  }


  // -----------------------------------------------------------------------------------------------------
  // indicate failed delivery of a purchased item
  // called by customer
  // product might have been delivered, but defective. so we do not return the
  // product to stock; that is we do not increment product quantity
  // -----------------------------------------------------------------------------------------------------
  function deliveryReject(uint256 _escrowID, uint8 _rating, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    (uint256 _productID, address _vendorAddr) = madEscrow.verifyEscrowCustomer(_escrowID, msg.sender);
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _vendorAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _vendorAddr, _attachmentIdx, _ref, _message);
    madEscrow.burnEscrow(_escrowID, _msgId);
    vendorAccounts[_vendorAddr].deliveriesRejected = safeAdd(vendorAccounts[_vendorAddr].deliveriesRejected, 1);
    if (_rating > 10)
      _rating = 10;
    vendorAccounts[_vendorAddr].ratingSum = safeAdd(vendorAccounts[_vendorAddr].ratingSum, _rating);
    emit DeliveryRejectEvent(_vendorAddr, msg.sender, _escrowID, _productID, _msgId);
  }


  // -----------------------------------------------------------------------------------------------------
  // claim an esrcow that has been abandoned by the buyer
  // called by vendor
  // if customer neither burns nor releases the escrow, then after a certain amount of time the vendor
  // can claim all the funds.
  // -----------------------------------------------------------------------------------------------------
  function claimAbandonedEscrow(uint256 _escrowID, uint256 _attachmentIdx, uint256 _ref, bytes memory _message) public payable {
    (uint256 _productID, address _customerAddr) = madEscrow.verifyEscrowVendor(_escrowID, msg.sender);
    //ensure message fees
    uint256 _noDataLength = 4 + 32 + 32 + 32 + 64;
    uint256 _msgFee = (msg.data.length > _noDataLength) ? messageTransport.getFee(msg.sender, _customerAddr) : 0;
    require(msg.value == _msgFee, "incorrect funds for message fee");
    uint256 _msgId = messageTransport.sendMessage.value(_msgFee)(msg.sender, _customerAddr, _attachmentIdx, _ref, _message);
    madEscrow.claimAbandonedEscrow(_escrowID, _msgId);
    vendorAccounts[msg.sender].lastActivity = now;
    emit ClaimAbandonedEvent(msg.sender, _customerAddr, _escrowID, _productID, _msgId);
  }


  // -------------------------------------------------------------------------
  // for debug
  // only available before the contract is locked
  // -------------------------------------------------------------------------
  function killContract() public ownerOnly unlockedOnly {
    selfdestruct(owner);
  }
}
