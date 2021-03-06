pragma solidity ^0.5.0;


// ---------------------------------------------------------------------------------------------------------
// Mad Escrow provides a framework for Mutually Assured Destruction escrows between two anonymous parties,
// customer and vendor, without any trusted mediator. It's called Mutually Assured Destruction because in
// case of a dispute the ultimate recourse is for the customer to burn the escrow, thereby causing the
// vendor to lose all his funds -- although this comes at the steep price of the customer forfeiting all
// of his deposited funds also.
//
// before participating in any escrow both parties must wrap the payment token, which is nominally Dai, into
// escrow-able tokens, nominally W-Dai.
//
// Escrows are opened for an opaque "product," and are always opened by the customer, for a specified
// price. when the escrow is opened, a sum of W-Dai, equal to 1.5 times the price is taken from the customer;
// whereas a sum equal to 0.5 times the price is taken from the vendor. These sums are held in an escrow
// account, identified by a unique escrowId, until the escrow is (a) canceled, in which case all the funds
// are returned to their respective parties, or (b) closed, in which case the customer gets back 0.5 times
// the price of the product, and the vendor gets 1.5 times the price, minus a small commision, or (c) burned,
// in which case all the funds are lost.
//
// the function comments indicate the intended caller for each function. it is the responiblity of the
// calling contract to verify the identity of the msg.sender (via the provided verifyEscrowVendor or
// verifyEscrowCustomer functions.
// ---------------------------------------------------------------------------------------------------------


import './SafeMath.sol';
import './iERC20Token.sol';

// ---------------------------------------------------------------------------------------------------------
// fees go to this token contract
// the fees are paid in Dai, (as opposed to W-Dai)
// ---------------------------------------------------------------------------------------------------------
contract FeesTokenContract {
  function payDai(uint256 _daiAmount) external payable;
}


// ---------------------------------------------------------------------------------------------------------
//  MadEscrow Contract
// ---------------------------------------------------------------------------------------------------------
contract MadEscrow is iERC20Token, SafeMath {

  //ERC20 events
  event PaymentEvent(address indexed from, uint amount);
  event TransferEvent(address indexed from, address indexed to, uint amount);
  event ApprovalEvent(address indexed from, address indexed to, uint amount);

  // -------------------------------------------------------------------------------------------------------
  // defines
  // -------------------------------------------------------------------------------------------------------
  uint constant ESCROW_FEE_PCTX10 = 15;
  uint constant STEP_CREATE = (1 << 0);
  uint constant STEP_MODIFY = (1 << 1);
  uint constant STEP_CANCEL = (1 << 2);
  uint constant STEP_DECLINE = (1 << 3);
  uint constant STEP_APPROVE = (1 << 4);
  uint constant STEP_RELEASE = (1 << 5);
  uint constant STEP_BURN = (1 << 6);
  uint constant STEP_CLAIM = (1 << 7);


  // -------------------------------------------------------------------------------------------------------
  // Escrow Account structure
  // an escrow account between two parties
  // -------------------------------------------------------------------------------------------------------
  struct Escrow {
    bool closed;                        // escrow is no more
    uint8 state;
    address partnerAddr;                // contract that created this escrow
    address vendorAddr;
    address customerAddr;
    uint256 productId;                  // productId is an opaque cookie
    uint256 vendorBalance;              // amount that vendor has put into escrow
    uint256 customerBalance;            // amount that customer has put into escrow
    uint256 promptDate;
    uint256 deliveryDate;
  }
  struct EscrowXact {
    uint256 createXactId;
    uint256 modifyXactId;
    uint256 cancelXactId;
    uint256 declineXactId;
    uint256 approveXactId;
    uint256 releaseXactId;
    uint256 burnXactId;
    uint256 claimXactId;
  }


  // -------------------------------------------------------------------------------------------------------
  // data storage
  // -------------------------------------------------------------------------------------------------------
  bool public isLocked;
  //ERC20
  uint8   public daiDecimals;
  string  public symbol;
  string  public name;
  uint    public totalSupply;
  mapping (address => mapping (address => uint)) approvals;
  //
  address payable public owner;
  uint256 public escrowCount;
  uint256 public retainedFees;
  iERC20Token daiTokenContract;
  FeesTokenContract feesTokenContract;
  mapping (address => bool) public trusted;
  mapping (uint256 => Escrow) public escrows;
  mapping (uint256 => EscrowXact) public escrowXacts;
  mapping (address => uint256) public balances;
  mapping (address => uint256) public escrowsCounts;
  mapping (address => mapping (uint256 => uint256)) public escrowIds;


  // -------------------------------------------------------------------------------------------------------
  // modifiers
  // -------------------------------------------------------------------------------------------------------
  modifier ownerOnly {
    require(msg.sender == owner, "owner only");
    _;
  }
  modifier unlockedOnly {
    require(!isLocked, "unlocked only");
    _;
  }
  modifier trustedOnly {
    require(trusted[msg.sender] == true, "trusted only");
    _;
  }
  //this is to protect from short-address attack. use this to verify size of args, especially when an address arg preceeds
  //a value arg. see: https://www.reddit.com/r/ethereum/comments/63s917/worrysome_bug_exploit_with_erc20_token/dfwmhc3/
  modifier onlyPayloadSize(uint256 size) {
    assert(msg.data.length >= size + 4);
    _;
  }


  // -------------------------------------------------------------------------------------------------------
  //  constructor and tune
  // -------------------------------------------------------------------------------------------------------
  constructor(address _feesTokenAddr, address _daiTokenAddr, string memory _name, string memory _symbol) public {
    owner = msg.sender;
    feesTokenContract = FeesTokenContract(_feesTokenAddr);
    daiTokenContract = iERC20Token(_daiTokenAddr);
    daiDecimals = daiTokenContract.decimals();
    name = _name;
    symbol = _symbol;
  }
  function setPartners(address _feesTokenAddr, address _daiTokenAddr) public ownerOnly {
    feesTokenContract = FeesTokenContract(_feesTokenAddr);
    daiTokenContract = iERC20Token(_daiTokenAddr);
    daiDecimals = daiTokenContract.decimals();
  }
  function setTrust(address _trustedAddr, bool _trust) public ownerOnly {
    trusted[_trustedAddr] = _trust;
  }
  function lock() public ownerOnly {
    isLocked = true;
  }

  //default payable function. we don't accept eth
  function () external payable {
    revert();
  }


  //
  // ERC-20
  //
  function transfer(address _to, uint _value) public onlyPayloadSize(2*32) returns (bool success) {
    //prevent wrap
    if (balances[msg.sender] >= _value && balances[_to] + _value >= balances[_to]) {
      balances[msg.sender] = safeSub(balances[msg.sender], _value);
      balances[_to] = safeAdd(balances[_to], _value);
      emit TransferEvent(msg.sender, _to, _value);
      return true;
    } else {
      return false;
    }
  }

  function transferFrom(address _from, address _to, uint _value) onlyPayloadSize(3*32) public returns (bool success) {
    //prevent wrap:
    if (balances[_from] >= _value && approvals[_from][msg.sender] >= _value && balances[_to] + _value >= balances[_to]) {
      balances[_from] = safeSub(balances[_from], _value);
      balances[_to] = safeAdd(balances[_to], _value);
      approvals[_from][msg.sender] = safeSub(approvals[_from][msg.sender], _value);
      emit TransferEvent(_from, _to, _value);
      return true;
    } else {
      return false;
    }
  }

  function balanceOf(address _owner) public view returns (uint balance) {
    balance = balances[_owner];
  }

  function approve(address _spender, uint _value) public onlyPayloadSize(2*32) returns (bool success) {
    approvals[msg.sender][_spender] = _value;
    emit ApprovalEvent(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) public view returns (uint remaining) {
    return approvals[_owner][_spender];
  }
  function decimals() public view returns (uint8 _decimals) {
    return(daiDecimals);
  }
  //
  // END ERC20
  //


  // -------------------------------------------------------------------------------------------------------
  // deposit funds
  // called by vendor to deposit funds that will be used as a bond
  // transfer must already be approved
  // -------------------------------------------------------------------------------------------------------
  function wrapDai(uint256 _daiAmount) public {
    require(daiTokenContract.transferFrom(msg.sender, address(this), _daiAmount), "failed to transfer dai");
    balances[msg.sender] = safeAdd(balances[msg.sender], _daiAmount);
    totalSupply = safeAdd(totalSupply, _daiAmount);
  }
  // -------------------------------------------------------------------------
  // withdraw funds at any time
  // do not send to a contract!
  // -------------------------------------------------------------------------
  function unwrapDai(uint256 _wdaiAmount) public {
    require(_wdaiAmount <= balances[msg.sender], "insufficient w-dai");
    balances[msg.sender] = safeSub(balances[msg.sender], _wdaiAmount);
    totalSupply = safeSub(totalSupply, _wdaiAmount);
    require(daiTokenContract.transfer(msg.sender, _wdaiAmount), "failed to transfer dai");
  }


  // -------------------------------------------------------------------------------------------------------
  // create an escrow
  // called by customer to initiate an escrow
  // -------------------------------------------------------------------------------------------------------
  function createEscrow(uint256 _productId, uint256 _XactId, uint256 _price, address _vendorAddr, address _customerAddr) public trustedOnly returns (uint256 _escrowId) {
    _escrowId = escrowCount = safeAdd(escrowCount, 1);
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require(_productId != 0 && _price != 0, "product ID and price cannot be zero");
    _escrow.productId = _productId;
    _escrow.vendorAddr = _vendorAddr;
    _escrow.customerAddr = _customerAddr;
    _escrow.partnerAddr = msg.sender;
    _escrow.state |= (uint8)(STEP_CREATE);
    _escrowXact.createXactId = _XactId;
    uint256 _vendorEscrowCount = escrowsCounts[_vendorAddr];
    escrowIds[_vendorAddr][_vendorEscrowCount] = _escrowId;
    uint256 _customerEscrowCount = escrowsCounts[_customerAddr];
    escrowIds[_customerAddr][_customerEscrowCount] = _escrowId;
    escrowsCounts[_vendorAddr] = safeAdd(_vendorEscrowCount, 1);
    escrowsCounts[_customerAddr] = safeAdd(_customerEscrowCount, 1);
    uint256 _minVendorBond = safeMul(_price, 50) / 100;
    uint256 _minCustomerBond = safeAdd(_price, _minVendorBond);
    //interleave in case vendorAddr == customerAddr
    require(balances[_vendorAddr] >= _minVendorBond, "insufficient vendor funds");
    balances[_vendorAddr] = safeSub(balances[_vendorAddr], _minVendorBond);
    require(balances[_customerAddr] >= _minCustomerBond, "insufficient customer funds");
    balances[_customerAddr] = safeSub(balances[_customerAddr], _minCustomerBond);
    _escrow.vendorBalance = safeAdd(_escrow.vendorBalance, _minVendorBond);
    _escrow.customerBalance = safeAdd(_escrow.customerBalance, _minCustomerBond);
    _escrow.promptDate = now;
    //default is zero
    //_escrowXact.approveXact = 0;
  }


  function verifyEscrow(uint256 _escrowId, address _vendorAddr, address _customerAddr) public view returns (uint256 _productId) {
    Escrow storage _escrow = escrows[_escrowId];
    require(_escrow.closed       == false &&
	    _escrow.vendorAddr   == _vendorAddr &&
	    _escrow.customerAddr == _customerAddr, "escrow closed or invalid address");
    _productId = _escrow.productId;
  }

  function verifyEscrowVendor(uint256 _escrowId, address _vendorAddr) public view returns (uint256 _productId, address _customerAddr) {
    Escrow storage _escrow = escrows[_escrowId];
    require(_escrow.closed       == false &&
	    _escrow.vendorAddr  == _vendorAddr, "escrow closed or invalid address");
    _productId = _escrow.productId;
    _customerAddr = _escrow.customerAddr;

  }

  function verifyEscrowCustomer(uint256 _escrowId, address _customerAddr) public view returns (uint256 _productId, address _vendorAddr) {
    Escrow storage _escrow = escrows[_escrowId];
    require(_escrow.closed       == false &&
	    _escrow.customerAddr == _customerAddr, "escrow closed or invalid address");
    _productId = _escrow.productId;
    _vendorAddr = _escrow.vendorAddr;
  }

  function verifyEscrowParty(uint256 _escrowId, address _firstAddr) public view returns (uint256 _productId, address _otherAddr) {
    Escrow storage _escrow = escrows[_escrowId];
    require(_escrow.closed == false, "escrow closed");
    return(verifyEscrowAny(_escrowId, _firstAddr));
  }

  // verify any party to an escrow, even if the escrow is closed
  function verifyEscrowAny(uint256 _escrowId, address _firstAddr) public view returns (uint256 _productId, address _otherAddr) {
    Escrow storage _escrow = escrows[_escrowId];
    _productId = _escrow.productId;
    if (_escrow.vendorAddr  == _firstAddr)
      _otherAddr = _escrow.customerAddr;
    else if (_escrow.customerAddr == _firstAddr)
      _otherAddr = _escrow.vendorAddr;
    else
      revert("invalid address");
  }


  // -------------------------------------------------------------------------------------------------------
  // record response
  // just update the latest transaction id for the specified escrow
  // -------------------------------------------------------------------------------------------------------
  function recordReponse(uint256 _escrowId, address _initiatorAddr, uint256 _XactId, uint256 _ref) public trustedOnly returns (uint _responseTime) {
    require(_XactId != 0, "invalid transaction id");
    require(_ref != 0, "invalid ref");
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    if (_escrowXact.claimXactId == _ref)
      _escrowXact.claimXactId = _XactId;
    else if (_escrowXact.burnXactId == _ref)
      _escrowXact.burnXactId = _XactId;
    else if (_escrowXact.releaseXactId == _ref)
      _escrowXact.releaseXactId = _XactId;
    else if (_escrowXact.approveXactId == _ref)
      _escrowXact.approveXactId = _XactId;
    else if (_escrowXact.declineXactId == _ref)
      _escrowXact.declineXactId = _XactId;
    else if (_escrowXact.cancelXactId == _ref)
      _escrowXact.cancelXactId = _XactId;
    else if (_escrowXact.modifyXactId == _ref)
      _escrowXact.modifyXactId = _XactId;
    else {
      require(_escrowXact.createXactId == _ref, "unknown ref");
      _escrowXact.createXactId = _XactId;
    }
    Escrow storage _escrow = escrows[_escrowId];
    if ((_escrow.state & STEP_APPROVE) == 0) {
      if (_initiatorAddr == _escrow.customerAddr)
	  _escrow.promptDate = now;
      else if (_escrow.promptDate != 0) {
	_responseTime = safeSub(now, _escrow.promptDate);
	_escrow.promptDate = 0;
      }
    }
  }


  // -------------------------------------------------------------------------------------------------------
  // modify the price for a product
  // called by customer to add additional funds to an escrow
  // -------------------------------------------------------------------------------------------------------
  function modifyEscrowPrice(uint256 _escrowId, uint256 _XactId, uint256 _surcharge) public trustedOnly {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require(_escrow.closed   == false, "escrow is closed");
    require((_escrow.state & STEP_APPROVE) == 0, "cannot modify price after approval");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    _escrow.state |= (uint8)(STEP_MODIFY);
    _escrowXact.modifyXactId = _XactId;
    uint256 _minVendorBond = safeMul(_surcharge, 50) / 100;
    uint256 _minCustomerBond = safeAdd(_surcharge, _minVendorBond);
    address _vendorAddr = _escrow.vendorAddr;
    address _customerAddr = _escrow.customerAddr;
    require(balances[_vendorAddr] >= _minVendorBond, "insufficient vendor funds");
    balances[_vendorAddr] = safeSub(balances[_vendorAddr], _minVendorBond);
    require(balances[_customerAddr] >= _minCustomerBond, "insufficient customer funds");
    balances[_customerAddr] = safeSub(balances[_customerAddr], _minCustomerBond);
    _escrow.vendorBalance = safeAdd(_escrow.vendorBalance, _minVendorBond);
    _escrow.customerBalance = safeAdd(_escrow.customerBalance, _minCustomerBond);
    _escrow.promptDate = now;
  }


  // -------------------------------------------------------------------------------------------------------
  // cancel an escrow
  // called by customer or vendor, but only before purchase has been approved by vendor
  // -------------------------------------------------------------------------------------------------------
  function cancelEscrow(uint256 _escrowId, address _initiatorAddr, uint256 _XactId) public trustedOnly returns (uint _responseTime) {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require(_escrow.closed   == false, "escrow is closed");
    require((_escrow.state & STEP_APPROVE) == 0, "cannot cancel after approval");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    address _vendorAddr = _escrow.vendorAddr;
    address _customerAddr = _escrow.customerAddr;
    if (_initiatorAddr == _vendorAddr) {
      _escrow.state |= (uint8)(STEP_DECLINE);
      _escrowXact.declineXactId = _XactId;
      if (_escrow.promptDate != 0)
	_responseTime = safeSub(now, _escrow.promptDate);
    } else {
      _escrow.state |= (uint8)(STEP_CANCEL);
      _escrowXact.cancelXactId = _XactId;
    }
    balances[_vendorAddr] = safeAdd(balances[_vendorAddr], _escrow.vendorBalance);
    balances[_customerAddr] = safeAdd(balances[_customerAddr], _escrow.customerBalance);
    _escrow.vendorBalance = 0;
    _escrow.customerBalance = 0;
    _escrow.closed = true;
  }


  // -------------------------------------------------------------------------------------------------------
  // approve of a purchase
  // the price is finalized -- funds are now locked into the escrow until they are released or burned.
  // called by vendor
  // -------------------------------------------------------------------------------------------------------
  function approveEscrow(uint256 _escrowId, uint256 _deliveryTime, uint256 _XactId) public trustedOnly returns (uint _responseTime) {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require(_escrow.closed == false, "escrow is closed");
    require((_escrow.state & STEP_APPROVE) == 0, "escrow is already approved");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    _escrow.deliveryDate = safeAdd(now, _deliveryTime);
    _escrow.state |= (uint8)(STEP_APPROVE);
    _escrowXact.approveXactId = _XactId;
    if (_escrow.promptDate != 0)
      _responseTime = safeSub(now, _escrow.promptDate);
  }


  // -------------------------------------------------------------------------
  // release escrow funds
  // called by customer, eg to acknowledge succesful delivery of a purchased item
  // -------------------------------------------------------------------------
  function releaseEscrow(uint256 _escrowId, uint256 _XactId) public trustedOnly {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require((_escrow.state & STEP_APPROVE) != 0, "only after approval");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    _escrow.state |= (uint8)(STEP_RELEASE);
    _escrowXact.releaseXactId = _XactId;
    address _vendorAddr = _escrow.vendorAddr;
    address _customerAddr = _escrow.customerAddr;
    uint256 _price = safeSub(_escrow.customerBalance, _escrow.vendorBalance);
    uint256 _escrowFee = safeMul(_price, ESCROW_FEE_PCTX10) / 1000;
    retainedFees = safeAdd(retainedFees, _escrowFee);
    uint256 _vendorNet = safeSub(_escrow.customerBalance, _escrowFee);
    balances[_vendorAddr] = safeAdd(balances[_vendorAddr], _vendorNet);
    balances[_customerAddr] = safeAdd(balances[_customerAddr], _escrow.vendorBalance);
    _escrow.vendorBalance = _escrow.customerBalance = 0;
    _escrow.closed = true;
  }


  // -------------------------------------------------------------------------
  // burn the escrow -- this is an extreme measure
  // called by customer, eg to register his conviction that the vendor is a
  // crook, and to stick it to him, even at the cost of his own funds.
  // -------------------------------------------------------------------------
  function burnEscrow(uint256 _escrowId, uint256 _XactId) public trustedOnly {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require((_escrow.state & STEP_APPROVE) != 0, "only after approval");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    retainedFees = safeAdd(retainedFees, _escrow.customerBalance + _escrow.vendorBalance);
    _escrow.state |= (uint8)(STEP_BURN);
    _escrowXact.burnXactId = _XactId;
    _escrow.customerBalance = 0;
    _escrow.vendorBalance = 0;
    _escrow.closed = true;
  }


  // -------------------------------------------------------------------------
  // claim escrow funds that have been abandoned by buyer
  // called by vendor, 30 days after product delivery date
  // -------------------------------------------------------------------------
  function claimAbandonedEscrow(uint256 _escrowId, uint256 _XactId) public trustedOnly {
    Escrow storage _escrow = escrows[_escrowId];
    EscrowXact storage _escrowXact = escrowXacts[_escrowId];
    require(_escrow.closed == false, "already closed");
    require((_escrow.state & STEP_APPROVE) != 0, "only after approval");
    require(_escrow.partnerAddr == msg.sender, "only partner contract can modify escrow");
    require(now > _escrow.deliveryDate + 30 days, "only 30 days after promised delivery date");
    _escrow.state |= (uint8)(STEP_CLAIM);
    _escrowXact.claimXactId = _XactId;
    address _vendorAddr = _escrow.vendorAddr;
    uint256 _total = safeAdd(_escrow.customerBalance, _escrow.vendorBalance);
    uint256 _escrowFee = safeMul(_total, ESCROW_FEE_PCTX10) / 1000;
    retainedFees = safeAdd(retainedFees, _escrowFee);
    uint256 _vendorNet = safeSub(_total, _escrowFee);
    balances[_vendorAddr] = safeAdd(balances[_vendorAddr], _vendorNet);
    _escrow.vendorBalance = _escrow.customerBalance = 0;
    _escrow.closed = true;
  }


  // -------------------------------------------------------------------------
  // withdraw escrow fees to the token address
  // -------------------------------------------------------------------------
  function withdrawEscrowFees() public {
    uint _amount = retainedFees;
    retainedFees = 0;
    require(daiTokenContract.approve(address(feesTokenContract), _amount), "failed to transfer dai");
    feesTokenContract.payDai(_amount);
  }


  // -------------------------------------------------------------------------
  // for debug
  // only available before the contract is locked
  // -------------------------------------------------------------------------
  function killContract() public ownerOnly unlockedOnly {
    selfdestruct(owner);
  }
}
