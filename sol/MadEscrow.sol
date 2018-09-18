pragma solidity ^0.4.24;

// ---------------------------------------------------------------------------
//  interface to message transport
// ---------------------------------------------------------------------------
contract MessageTransport {
  function getFee(address _toAddr) public view returns(uint256 _fee);
  function sendMessage(address _toAddr, uint mimeType, bytes message) public payable returns (uint _recvMessageCount) { }
}


// ---------------------------------------------------------------------------
//  MadEscrow Contract
// ---------------------------------------------------------------------------
contract MadEscrow_V1 {

  // -------------------------------------------------------------------------
  // events
  // -------------------------------------------------------------------------
  event StatEvent(string message);
  event RegisterVendorEvent(address indexed _vendorAddr, bool list, bytes desc, bytes image);
  event RegisterProductEvent(address indexed _vendorAddr, uint256 _productID, bytes desc, bytes image);
  event PurchaseDepositEvent(address indexed _vendorAddr, address customerAddr, uint256 _productID, uint256 _surcharge, uint256 _msgNo);
  event PurchaseCancelEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _productID, uint256 _msgNo);
  event PurchaseApproveEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _productID, uint256 _msgNo);
  event PurchaseRejectEvent(address indexed _vendorAddr, address customerAddr, uint256 _productID, uint256 _msgNo);
  event DeliveryApproveEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _productID, uint256 _msgNo);
  event DeliveryRejectEvent(address indexed _vendorAddr, address indexed customerAddr, uint256 _productID, uint256 _msgNo);

  // -------------------------------------------------------------------------
  // defines
  // -------------------------------------------------------------------------
  uint constant ESCROW_FEE_PCTX10 = 15;


  // -------------------------------------------------------------------------
  // Product structure
  // -------------------------------------------------------------------------
  struct Product {
    uint256 id;
    uint256 price;
    uint256 quantity;
  }

  // -------------------------------------------------------------------------
  // Escrow Account structure
  // an escrow account between two parties
  // -------------------------------------------------------------------------
  struct EscrowAccount {
    bool approved;                      // purchase has been approved by vendor
    uint256 productID;                  // escrow is for purchase of this product
    uint256 vendorBalance;              // amount that vendor has put into escrow
    uint256 customerBalance;            // amount that customer has put into escrow
  }

  // -------------------------------------------------------------------------
  // Vendor Account structure
  // -------------------------------------------------------------------------
  struct VendorAccount {
    bool list;                          // please list me in some directory
    bool active;                        // if inactive, then no new orders are accepted
    uint8 bondPct;                      // bond is (1 + bondPct/100) X productPrice
    uint256 serviceRegion;              // bitmask of geographical regions
    mapping (uint256 => Product) products;
    mapping (address => EscrowAccount) escrowAccounts;
  }


  // -------------------------------------------------------------------------
  // data storage
  // -------------------------------------------------------------------------
  bool public isLocked;
  address public owner;
  address public communityAddr;
  MessageTransport messageTransport;
  uint256 public communityBalance;
  uint public contractSendGas = 100000;
  mapping (address => uint256) public balances;
  mapping (address => VendorAccount) public vendorAccounts;


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
  //  EMS constructor and tune
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
  // register a VendorAccount
  // -------------------------------------------------------------------------
  function registerVendor(uint256 _serviceRegion, uint8 _bondPct, bool _list, bytes _desc, bytes _image) public {
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    _vendorAccount.list = _list;
    _vendorAccount.active = true;
    _vendorAccount.bondPct = _bondPct;
    emit RegisterVendorEvent(msg.sender, _list, _desc, _image);
    emit StatEvent("ok: vendor registered");
  }

  function unregisterVendor() public {
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    _vendorAccount.list = false;
    _vendorAccount.active = false;
    emit StatEvent("ok: vendor unregistered");
  }


  // -------------------------------------------------------------------------
  // register a Product
  // called by vendor
  // cannot use productID of zero -- that is used to indicate an active escrow
  // -------------------------------------------------------------------------
  function registerProduct(uint256 _productID, uint256 _price, uint256 _quantity, bytes _desc, bytes _image) public {
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    require(_vendorAccount.active == true, "vendor account is not active");
    require(_productID != 0);
    Product storage _product = _vendorAccount.products[_productID];
    _product.price = _price;
    _product.quantity = _quantity;
    emit RegisterProductEvent(msg.sender, _productID, _desc, _image);
    emit StatEvent("ok: product added");
  }

  function productInfo(uint256 _productID) public view returns(uint256 _price, uint256 _quantity) {
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    require(_vendorAccount.active == true, "vendor account is not active");
    Product storage _product = _vendorAccount.products[_productID];
    _price = _product.price;
    _quantity = _product.quantity;
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
  // an optional surchage (shipping & handling?) can be added to the nominal
  // price of the product. this function can also be called to add a surchage
  // to an already existing escrow.
  // you cannot deposit funds if the vendor is inactive.
  // -------------------------------------------------------------------------
  function purchaseDeposit(address _vendorAddr, uint256 _productID, uint256 _surcharge, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[_vendorAddr];
    require(_vendorAccount.active == true, "vendor account is not active");
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[msg.sender];
    //you can use this function to open a new escrow, or to add funds to an existing escrow
    require((_escrowAccount.customerBalance == 0 ||
	     _escrowAccount.productID == _productID), "escrow already active with this vendor");
    Product storage _product = _vendorAccount.products[_productID];
    require(_product.quantity != 0, "product is not available");
    require(_product.price != 0, "product price is not valid");
    //for an existing escrow, the additional funds is completely specified by the surchage.
    //but for a new escrow, the surchage is added to the price
    uint256 _effectivePrice = _surcharge;
    if (_escrowAccount.customerBalance == 0)
      _effectivePrice += _product.price;
    else
      _product.quantity -= 1;
    uint256 _minVendorBond = (_effectivePrice * _vendorAccount.bondPct) / 100;
    uint256 _minCustomerBond = _effectivePrice + _minCustomerBond;
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //first deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    require(balances[msg.sender] >= _minCustomerBond, "insufficient deposit funds");
    require(balances[_vendorAddr] >= _minVendorBond, "vendor has not deposited enough bond funds");
    balances[_vendorAddr] -= _minVendorBond;
    balances[msg.sender] -= _minCustomerBond;
    _escrowAccount.vendorBalance += _minVendorBond;
    _escrowAccount.customerBalance += _minCustomerBond;
    _escrowAccount.approved = false;
    _escrowAccount.productID = _productID;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, 0, _message);
    emit PurchaseDepositEvent(_vendorAddr, msg.sender, _productID, _surcharge, _msgNo);
    emit StatEvent("ok: purchase funds deposited");
  }


  // -------------------------------------------------------------------------
  // cancel purchase of a product
  // called by customer -- only before purchase has been approved by vendor
  // -------------------------------------------------------------------------
  function purchaseCancel(address _vendorAddr, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[msg.sender];
    require(_escrowAccount.customerBalance != 0, "no active escrow with this vendor");
    require(_escrowAccount.approved != true, "purchase already approved; funds are locked");
    Product storage _product = _vendorAccount.products[_escrowAccount.productID];
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, 0, _message);
    emit PurchaseCancelEvent(_vendorAddr, msg.sender, _escrowAccount.productID, _msgNo);
    _product.quantity += 1;
    balances[_vendorAddr] += _escrowAccount.vendorBalance;
    balances[msg.sender] += _escrowAccount.customerBalance;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.customerBalance = 0;
    _escrowAccount.productID = 0;
    emit StatEvent("ok: purchase canceled -- funds returned");
  }


  // -------------------------------------------------------------------------
  // approve of a purchase
  // called by vendor
  // can only be called by an active vendor
  // -------------------------------------------------------------------------
  function purchaseApprove(address _customerAddr, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    require(_vendorAccount.active == true, "vendor account is not active");
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[_customerAddr];
    require(_escrowAccount.vendorBalance != 0, "no active escrow with this customer");
    require(_escrowAccount.approved != true, "purchase already approved");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_customerAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_customerAddr, 0, _message);
    emit PurchaseApproveEvent(msg.sender, _customerAddr, _escrowAccount.productID, _msgNo);
    _escrowAccount.approved = true;
    emit StatEvent("ok: purchase approved -- funds locked");
  }


  // -------------------------------------------------------------------------
  // reject a purchase
  // called by vendor
  // can be called by an inactive vendor
  // -------------------------------------------------------------------------
  function purchaseReject(address _customerAddr, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[_customerAddr];
    require(_escrowAccount.vendorBalance != 0, "no active escrow with this customer");
    require(_escrowAccount.approved != true, "purchase already approved; funds are locked");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_customerAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_customerAddr, 0, _message);
    emit PurchaseRejectEvent(msg.sender, _customerAddr, _escrowAccount.productID, _msgNo);
    Product storage _product = _vendorAccount.products[_escrowAccount.productID];
    _product.quantity += 1;
    balances[msg.sender] += _escrowAccount.vendorBalance;
    balances[_customerAddr] += _escrowAccount.customerBalance;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.customerBalance = 0;
    _escrowAccount.productID = 0;
    emit StatEvent("ok: purchase rejected -- funds returned");
  }


  // -------------------------------------------------------------------------
  // acknowledge succesful delivery of a purchased item
  // called by customer
  // -------------------------------------------------------------------------
  function deliveryApprove(address _vendorAddr, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[msg.sender];
    require(_escrowAccount.approved == true, "purchase has not been approved yet");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, 0, _message);
    emit DeliveryApproveEvent(_vendorAddr, msg.sender, _escrowAccount.productID, _msgNo);
    uint256 _price = (_escrowAccount.customerBalance - _escrowAccount.vendorBalance);
    uint256 _escrowFee = (_price * ESCROW_FEE_PCTX10) / 1000;
    communityBalance += _escrowFee;
    balances[_vendorAddr] += (_escrowAccount.customerBalance - _escrowFee);
    balances[msg.sender] += _escrowAccount.vendorBalance;
    _escrowAccount.customerBalance = 0;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.productID = 0;
    _escrowAccount.approved = false;
    emit StatEvent("ok: delivery approved -- funds destributed");
  }


  // -------------------------------------------------------------------------
  // indicate failed delivery of a purchased item
  // called by customer
  // product might have been delivered, but defective. so we do not return the
  // product to stock; that is we do not increment product quantity
  // -------------------------------------------------------------------------
  function deliveryReject(address _vendorAddr, bytes _message) public payable {
    //TODO: ensure that msg.sender has an EMS account
    VendorAccount storage _vendorAccount = vendorAccounts[msg.sender];
    EscrowAccount storage _escrowAccount = _vendorAccount.escrowAccounts[msg.sender];
    require(_escrowAccount.approved == true, "purchase has not been approved yet");
    //add msg funds to pre-existing customer balance
    balances[msg.sender] += msg.value;
    //deduct any message fees
    uint256 _fee = messageTransport.getFee(_vendorAddr);
    require(balances[msg.sender] >= _fee, "insufficient funds for message fee");
    balances[msg.sender] -= _fee;
    uint256 _msgNo = messageTransport.sendMessage.value(_fee)(_vendorAddr, 0, _message);
    emit DeliveryRejectEvent(_vendorAddr, msg.sender, _escrowAccount.productID, _msgNo);
    communityBalance += (_escrowAccount.customerBalance + _escrowAccount.vendorBalance);
    _escrowAccount.customerBalance = 0;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.productID = 0;
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
    if (!communityAddr.call.gas(contractSendGas).value(_amount)())
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
