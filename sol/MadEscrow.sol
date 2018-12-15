pragma solidity ^0.5.0;


// ---------------------------------------------------------------------------
//  interface to message transport
// ---------------------------------------------------------------------------
contract MessageTransport {
  function getFee(address _fromAddr, address _toAddr) public view returns(uint256 _fee);
  function sendMessage(address _fromAddr, address _toAddr, uint mimeType, bytes memory message) public payable returns (uint _recvMessageCount);
}


// ---------------------------------------------------------------------------
//  MadEscrow Contract
// ---------------------------------------------------------------------------
contract GMES {

  // -------------------------------------------------------------------------
  // events
  // -------------------------------------------------------------------------
  event StatEvent(string message);
  event RegisterVendorEvent(address indexed _vendorAddr, bytes name, bytes desc, bytes image);
  event RegisterProductEvent(uint256 indexed _productID, bytes name, bytes desc, bytes image);
  event PurchaseDepositEvent(address indexed _vendorAddr, address customerAddr,
			     uint256 _escrowID, uint256 _productID, uint256 _surcharge, uint256 _msgNo);
  event PurchaseCancelEvent(address indexed _vendorAddr, address indexed customerAddr,
			    uint256 _escrowID, uint256 _productID, uint256 _msgNo);
  event PurchaseApproveEvent(address indexed _vendorAddr, address indexed customerAddr,
			     uint256 _escrowID, uint256 _productID, uint256 _msgNo);
  event PurchaseRejectEvent(address indexed _vendorAddr, address customerAddr,
			    uint256 _escrowID, uint256 _productID, uint256 _msgNo);
  event DeliveryApproveEvent(address indexed _vendorAddr, address indexed customerAddr,
			     uint256 _escrowID, uint256 _productID, uint256 _msgNo);
  event DeliveryRejectEvent(address indexed _vendorAddr, address indexed customerAddr,
			    uint256 _escrowID, uint256 _productID, uint256 _msgNo);

  // -------------------------------------------------------------------------
  // defines
  // -------------------------------------------------------------------------
  uint constant ESCROW_FEE_PCTX10 = 15;


  // -------------------------------------------------------------------------
  // Product structure
  // -------------------------------------------------------------------------
  struct Product {
    uint256 price;
    uint256 quantity;
    uint256 category;
    uint256 categoryProductIdx;
    uint256 region;
    uint256 regionProductIdx;
    address vendorAddr;

  }

  // -------------------------------------------------------------------------
  // Vendor Account structure
  // for keeping track of vendor reputation
  // -------------------------------------------------------------------------
  struct VendorAccount {
    uint256 deliveriesApproved;
    uint256 deliveriesRejected;
    uint256 region;
    bool activeFlag;
  }

  // -------------------------------------------------------------------------
  // Escrow Account structure
  // an escrow account between two parties
  // -------------------------------------------------------------------------
  struct EscrowAccount {
    bool approved;                      // purchase has been approved by vendor
    address customerAddr;
    uint256 productID;                  // escrow is for purchase of this product
    uint256 vendorBalance;              // amount that vendor has put into escrow
    uint256 customerBalance;            // amount that customer has put into escrow
  }


  // -------------------------------------------------------------------------
  // data storage
  // -------------------------------------------------------------------------
  bool public isLocked;
  address payable public owner;
  address public communityAddr;
  MessageTransport messageTransport;
  uint256 public escrowCount;
  uint256 public productCount;
  uint256 public communityBalance;
  uint256 public contractSendGas = 100000;
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
  mapping (uint256 => EscrowAccount) public escrowAccounts;
  mapping (address => uint256) public balances;


  // -------------------------------------------------------------------------
  // modifiers
  // -------------------------------------------------------------------------
  modifier ownerOnly {
    require(msg.sender == owner, "owner only");
    _;
  }
  modifier unlockedOnly {
    require(!isLocked, "unlocked only");
    _;
  }


  // -------------------------------------------------------------------------
  //  constructor and tune
  // -------------------------------------------------------------------------
  constructor(address _messageTransport) public {
    owner = msg.sender;
    messageTransport = MessageTransport(_messageTransport);
  }
  function tune(uint256 _contractSendGas) public ownerOnly {
    contractSendGas = _contractSendGas;
  }
  function setMessageTransport(address _messageTransport) public ownerOnly {
    messageTransport = MessageTransport(_messageTransport);
  }

  function lock() public ownerOnly {
    isLocked = true;
  }



  // -------------------------------------------------------------------------
  // see if a product matches search criteria
  // category & region are semi hierarchical. the top 8 bits are interpreted as a number specifiying the
  // top-level-category or top-level-region. if specified, then these must match exactly. the lower 248
  // bits are a bitmask of sub-categories or sub-regions. if specified then we only look for some overlap
  // between the product bitmap and the search parameter.
  // -------------------------------------------------------------------------
  function isCertainProduct(uint256 _productID, address _vendorAddr, uint256 _category,
			    uint256 _region, uint256 _maxPrice, bool _onlyAvailable) internal view returns(bool) {
    uint8 _tlc = uint8(_category >> 248);
    uint256 _llcBits = _category & ((2 ** 248) - 1);
    uint8 _tlr = uint8(_region >> 248);
    uint256 _llrBits = _region & ((2 ** 248) - 1);
    Product storage _product = products[_productID];
    uint8 _productTlc = uint8(_product.category >> 248);
    uint256 _productLlcBits = _product.category & ((2 ** 248) - 1);
    uint8 _productTlr = uint8(_product.region >> 248);
    uint256 _productLlrBits = _product.region & ((2 ** 248) - 1);
    if ((_vendorAddr == address(0) ||  _product.vendorAddr                == _vendorAddr) &&
	(_tlc        == 0          ||  _productTlc                        == _tlc       ) &&
	(_llcBits    == 0          || (_productLlcBits & _llcBits)        != 0          ) &&
	(_tlr        == 0          ||  _productTlr                        == _tlr       ) &&
	(_llrBits    == 0          || (_productLlrBits & _llrBits)        != 0          ) &&
	(_maxPrice   == 0          ||  _product.price                     <= _maxPrice  ) ) {
      uint256 _minVendorBond = (_product.price * 50) / 100;
      if (!_onlyAvailable || (_product.quantity != 0 && _product.price != 0 && balances[_product.vendorAddr] >= _minVendorBond))
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
  function getCertainProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _maxPrice,
			      uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    uint _count = 0;
    _productIDs = new uint256[](_maxResults);
    //note: first productID is 1
    uint _productID = _productStartIdx;
    for ( ; _productID <= productCount; ++_productID) {
      if (_productID != 0 && isCertainProduct(_productID, _vendorAddr, _category, _region, _maxPrice, _onlyAvailable)) {
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
  function getVendorProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _maxPrice,
			     uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    require(_vendorAddr != address(0), "address must be specified");
    uint _count = 0;
    _productIDs = new uint256[](_maxResults);
    uint256 _vendorProductCount = vendorProductCounts[_vendorAddr];
    mapping(uint256 => uint256) storage _vendorProducts = vendorProducts[_vendorAddr];
    //note first productID is at vendorProducts[1];
    for (_idx = _productStartIdx; _idx <= _vendorProductCount; ++_idx) {
      uint _productID = _vendorProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _vendorAddr, _category, _region, _maxPrice, _onlyAvailable)) {
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
  function getCategoryProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _maxPrice,
			       uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    require(_category != 0, "category must be specified");
    uint _count = 0;
    uint8 _tlc = uint8(_category >> 248);
    _productIDs = new uint256[](_maxResults);
    uint256 _categoryProductCount = categoryProductCounts[_tlc];
    mapping(uint256 => uint256) storage _categoryProducts = categoryProducts[_tlc];
    //note first productID is at categoryProducts[1];
    for (_idx = _productStartIdx; _idx <= _categoryProductCount; ++_idx) {
      uint _productID = _categoryProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _vendorAddr, _category, _region, _maxPrice, _onlyAvailable)) {
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
  function getRegionProducts(address _vendorAddr, uint256 _category, uint256 _region, uint256 _maxPrice,
			     uint256 _productStartIdx, uint256 _maxResults, bool _onlyAvailable) public view returns(uint256 _idx, uint256[] memory _productIDs) {
    require(_region != 0, "region must be specified");
    uint _count = 0;
    uint8 _tlr = uint8(_region >> 248);
    _productIDs = new uint256[](_maxResults);
    uint256 _regionProductCount = regionProductCounts[_tlr];
    mapping(uint256 => uint256) storage _regionProducts = regionProducts[_tlr];
    //note first productID is at regionProducts[1];
    for (_idx = _productStartIdx; _idx <= _regionProductCount; ++_idx) {
      uint _productID = _regionProducts[_idx];
      if (_productID != 0 && isCertainProduct(_productID, _vendorAddr, _category, _region, _maxPrice, _onlyAvailable)) {
	_productIDs[_count] = _productID;
	if (++_count >= _maxResults)
	  break;
      }
    }
  }


  // -------------------------------------------------------------------------
  // register a VendorAccount
  // -------------------------------------------------------------------------
  function registerVendor(uint256 _defaultRegion, bytes memory _name, bytes memory _desc, bytes memory _image) public {
    vendorAccounts[msg.sender].activeFlag = true;
    vendorAccounts[msg.sender].region = _defaultRegion;
    emit RegisterVendorEvent(msg.sender, _name, _desc, _image);
    emit StatEvent("ok: vendor registered");
  }


  //if top level category/region changes we leave a hole in the oldTl[cr] map, and allocate a new entry in the newTl[cr] map
  function updateTlcTlr(uint256 _productID, uint8 _newTlc, uint8 _newTlr) internal returns(uint256 _categoryProductIdx, uint256 _regionProductIdx) {
    Product storage _product = products[_productID];
    uint8 _oldTlc = uint8(_product.category >> 248);
    if (_oldTlc == _newTlc) {
      _categoryProductIdx = _product.categoryProductIdx;
    } else {
      categoryProducts[_oldTlc][_product.categoryProductIdx] = 0;
      _categoryProductIdx = ++categoryProductCounts[_newTlc];
    }
    uint8 _oldTlr = uint8(_product.region >> 248);
    if (_oldTlr == _newTlr) {
      _regionProductIdx = _product.regionProductIdx;
    } else {
      regionProducts[_oldTlr][_product.regionProductIdx] = 0;
      _regionProductIdx = ++regionProductCounts[_newTlr];
    }
  }


  // -------------------------------------------------------------------------
  // register a Product
  // called by vendor
  // productID = 0 => register a new product, auto-assign product id
  // -------------------------------------------------------------------------
  function registerProduct(uint256 _productID, uint256 _category, uint256 _region, uint256 _price, uint256 _quantity,
			   bytes memory _name, bytes memory _desc, bytes memory _image) public {
    uint256 _categoryProductIdx;
    uint256 _regionProductIdx;
    uint8 _newTlc = uint8(_category >> 248);
    uint8 _newTlr = uint8(_region >> 248);
    if (_productID == 0) {
      _productID = ++productCount;
      uint256 _vendorProductIdx = ++vendorProductCounts[msg.sender];
      vendorProducts[msg.sender][_vendorProductIdx] = _productID;
      _categoryProductIdx = ++categoryProductCounts[_newTlc];
      _regionProductIdx = ++regionProductCounts[_newTlr];
    } else {
      require(products[_productID].vendorAddr == msg.sender, "caller does not own this product");
      (_categoryProductIdx, _regionProductIdx) = updateTlcTlr(_productID, _newTlc, _newTlr);
    }
    Product storage _product = products[_productID];
    _product.price = _price;
    _product.quantity = _quantity;
    _product.category = _category;
    _product.categoryProductIdx = _categoryProductIdx;
    _product.region = _region;
    _product.regionProductIdx = _regionProductIdx;
    _product.vendorAddr = msg.sender;
    categoryProducts[_newTlc][_categoryProductIdx] = _productID;
    regionProducts[_newTlr][_regionProductIdx] = _productID;
    emit RegisterProductEvent(_productID, _name, _desc, _image);
  }


  function productInfo(uint256 _productID) public view returns(address _vendorAddr, uint256 _price, uint256 _quantity, bool _available) {
    Product storage _product = products[_productID];
    _price = _product.price;
    _quantity = _product.quantity;
    _vendorAddr = _product.vendorAddr;
    uint256 _minVendorBond = (_price * 50) / 100;
    _available = (_quantity != 0 && _price != 0 && balances[_vendorAddr] >= _minVendorBond);
  }


  // -------------------------------------------------------------------------
  // deposit bond funds
  // called by vendor
  // can also be called by customer to deposit funds for later use
  // -------------------------------------------------------------------------
  function depositFunds() public payable {
    balances[msg.sender] += msg.value;
    emit StatEvent("ok: funds deposited");
  }


  // -------------------------------------------------------------------------
  // deposit funds to purchase a Product
  // called by customer
  // escrowID = 0 => create a new escrow, else use an existing escrow acct
  // an optional surchage (shipping & handling?) can be added to the nominal
  // price of the product. this function can also be called to add a surchage
  // to an already existing escrow.
  // -------------------------------------------------------------------------
  function purchaseDeposit(uint256 _escrowID, uint256 _productID, uint256 _surcharge, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    if (_escrowID == 0)
      _escrowID = ++escrowCount;
    else
      require(escrowAccounts[_escrowID].customerAddr == msg.sender, "caller is not a party to this escrow");
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    //for new escrow set productID, ensure nz. for old escrow check passed productID
    if (_escrowAccount.productID == 0) {
      require(_productID != 0, "product ID cannot be zero");
      _escrowAccount.productID = _productID;
    } else {
      require(_productID == escrowAccounts[_escrowID].productID, "product ID is not valid");
      //_productID = _escrowAccount.productID;
    }
    Product storage _product = products[_productID];
    require(_product.quantity != 0, "product is not available");
    require(_product.price != 0, "product price is not valid");
    address _vendorAddr = _product.vendorAddr;
    _escrowAccount.customerAddr = msg.sender;
    //for an existing escrow, the funds added to the escrow in this transaction is completely specified by the surcharge.
    //but for a new escrow, the surcharge is added to the base price of the product.
    uint256 _effectivePrice = _surcharge;
    if (_escrowAccount.customerBalance == 0)
      _effectivePrice += _product.price;
    else
      _product.quantity -= 1;
    uint256 _minVendorBond = (_effectivePrice * 50) / 100;
    uint256 _minCustomerBond = _effectivePrice + _minVendorBond;
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //first deduct any message fees
    uint256 _fee = messageTransport.getFee(msg.sender, _vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    require(balances[msg.sender] >= _minCustomerBond, "insufficient deposit funds");
    require(balances[_vendorAddr] >= _minVendorBond, "vendor has not deposited enough bond funds");
    balances[_vendorAddr] -= _minVendorBond;
    balances[msg.sender] -= _minCustomerBond;
    _escrowAccount.vendorBalance += _minVendorBond;
    _escrowAccount.customerBalance += _minCustomerBond;
    _escrowAccount.approved = false;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(msg.sender, _vendorAddr, 0, _message);
    emit PurchaseDepositEvent(_vendorAddr, msg.sender, _escrowID, _productID, _surcharge, _msgNo);
    emit StatEvent("ok: purchase funds deposited");
  }


  // -------------------------------------------------------------------------
  // cancel purchase of a product
  // called by customer -- only before purchase has been approved by vendor
  // -------------------------------------------------------------------------
  function purchaseCancel(uint256 _escrowID, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.customerAddr == msg.sender, "caller is not a party to this escrow");
    uint256 _productID = _escrowAccount.productID;
    Product storage _product = products[_productID];
    address _vendorAddr = _product.vendorAddr;
    require(_escrowAccount.customerBalance != 0, "escrow is not active");
    require(_escrowAccount.approved != true, "purchase already approved; funds are locked");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(msg.sender, _vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(msg.sender, _vendorAddr, 0, _message);
    emit PurchaseCancelEvent(_vendorAddr, msg.sender, _escrowID, _productID, _msgNo);
    _product.quantity += 1;
    balances[_vendorAddr] += _escrowAccount.vendorBalance;
    balances[msg.sender] += _escrowAccount.customerBalance;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.customerBalance = 0;
    emit StatEvent("ok: purchase canceled -- funds returned");
  }


  // -------------------------------------------------------------------------
  // approve of a purchase
  // called by vendor
  // -------------------------------------------------------------------------
  function purchaseApprove(uint256 _escrowID, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    uint256 _productID = _escrowAccount.productID;
    Product storage _product = products[_productID];
    address _vendorAddr = _product.vendorAddr;
    require(_vendorAddr == msg.sender, "caller is not a party to this escrow");
    address _customerAddr = _escrowAccount.customerAddr;
    require(_escrowAccount.vendorBalance != 0, "escrow is not active");
    require(_escrowAccount.approved != true, "purchase already approved");
    //add msg funds to pre-existing vendor balance
    balances[_vendorAddr] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr, _customerAddr);
    require(balances[_vendorAddr] >= _fee, "insufficient funds for message fee");
    balances[_vendorAddr] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, _customerAddr, 0, _message);
    emit PurchaseApproveEvent(_vendorAddr, _customerAddr, _escrowID, _productID, _msgNo);
    _escrowAccount.approved = true;
    emit StatEvent("ok: purchase approved -- funds locked");
  }


  // -------------------------------------------------------------------------
  // reject a purchase
  // called by vendor
  // -------------------------------------------------------------------------
  function purchaseReject(uint256 _escrowID, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    uint256 _productID = _escrowAccount.productID;
    Product storage _product = products[_productID];
    address _vendorAddr = _product.vendorAddr;
    require(_vendorAddr == msg.sender, "caller is not a party to this escrow");
    address _customerAddr = _escrowAccount.customerAddr;
    require(_escrowAccount.vendorBalance != 0, "escrow is not active");
    require(_escrowAccount.approved != true, "purchase already approved");
    //add msg funds to pre-existing vendor balance
    balances[_vendorAddr] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr, _customerAddr);
    require(balances[_vendorAddr] >= _fee, "insufficient funds for message fee");
    balances[_vendorAddr] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, _customerAddr, 0, _message);
    emit PurchaseRejectEvent(_vendorAddr, _customerAddr, _escrowID, _productID, _msgNo);
    _product.quantity += 1;
    balances[_vendorAddr] += _escrowAccount.vendorBalance;
    balances[_customerAddr] += _escrowAccount.customerBalance;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.customerBalance = 0;
    emit StatEvent("ok: purchase rejected -- funds returned");
  }


  // -------------------------------------------------------------------------
  // acknowledge succesful delivery of a purchased item
  // called by customer
  // -------------------------------------------------------------------------
  function deliveryApprove(uint256 _escrowID, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.customerAddr == msg.sender, "caller is not a party to this escrow");
    uint256 _productID = _escrowAccount.productID;
    Product storage _product = products[_productID];
    address _vendorAddr = _product.vendorAddr;
    require(_escrowAccount.approved == true, "purchase has not been approved yet");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(msg.sender, _vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(msg.sender, _vendorAddr, 0, _message);
    ++vendorAccounts[_vendorAddr].deliveriesRejected;
    emit DeliveryApproveEvent(_vendorAddr, msg.sender, _escrowID, _escrowAccount.productID, _msgNo);
    uint256 _price = (_escrowAccount.customerBalance - _escrowAccount.vendorBalance);
    uint256 _escrowFee = (_price * ESCROW_FEE_PCTX10) / 1000;
    communityBalance += _escrowFee;
    balances[_vendorAddr] += (_escrowAccount.customerBalance - _escrowFee);
    balances[msg.sender] += _escrowAccount.vendorBalance;
    _escrowAccount.customerBalance = 0;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.approved = false;
    emit StatEvent("ok: delivery approved -- funds destributed");
  }


  // -------------------------------------------------------------------------
  // indicate failed delivery of a purchased item
  // called by customer
  // product might have been delivered, but defective. so we do not return the
  // product to stock; that is we do not increment product quantity
  // -------------------------------------------------------------------------
  function deliveryReject(uint256 _escrowID, bytes memory _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.customerAddr == msg.sender, "caller is not a party to this escrow");
    uint256 _productID = _escrowAccount.productID;
    Product storage _product = products[_productID];
    address _vendorAddr = _product.vendorAddr;
    require(_escrowAccount.approved == true, "purchase has not been approved yet");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(msg.sender, _vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(msg.sender, _vendorAddr, 0, _message);
    ++vendorAccounts[_vendorAddr].deliveriesRejected;
    emit DeliveryRejectEvent(_vendorAddr, msg.sender, _escrowID, _escrowAccount.productID, _msgNo);
    communityBalance += (_escrowAccount.customerBalance + _escrowAccount.vendorBalance);
    _escrowAccount.customerBalance = 0;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.approved = false;
    emit StatEvent("ok: delivery rejected -- funds burned");
  }


  // -------------------------------------------------------------------------
  // any party that has funds can withdraw at any time
  // called by vendor or customer
  // -------------------------------------------------------------------------
  function withdraw() public {
    uint _amount = balances[msg.sender];
    balances[msg.sender] = 0;
    msg.sender.transfer(_amount);
  }


  // -------------------------------------------------------------------------
  // withdraw escrow fees to the community address
  // -------------------------------------------------------------------------
  function withdrawEscrowFees() public {
    uint _amount = communityBalance;
    communityBalance = 0;
    (bool success, ) = communityAddr.call.gas(contractSendGas).value(_amount)("");
    if (!success)
      revert();
  }


  // -------------------------------------------------------------------------
  // for debug
  // only available before the contract is locked
  // -------------------------------------------------------------------------
  function killContract() public ownerOnly unlockedOnly {
    selfdestruct(owner);
  }
}
