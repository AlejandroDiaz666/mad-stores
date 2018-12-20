pragma solidity ^0.5.0;


// ---------------------------------------------------------------------------------------------------------
// Mad Escrow provides a framework for Mutually Assured Destruction escrows between two anonymous parties,
// customer and vendor, without any trusted mediator. It's called Mutually Assured Destruction because in
// case of a dispute the ultimate recourse is for the customer to burn the escrow, thereby causing the
// vendor to lose all his funds -- although this comes at the steep price of the customer forfeiting all
// of his deposited funds also.
// before participating in any escrow both parties must wrap the payment token, which is nominally Dai, into
// escrow-able tokens, nominally W-Dai.
// Escrows are opened for an opaque "product," and are always opened by the customer, for a specified
// price. when the escrow is opened, a sum of W-Dai, equal to 1.5 times the price is taken from the customer;
// whereas a sum equal to 0.5 times the price is taken from the vendor. These sums are held in an escrow
// account, identified by a unique escrowID, until the escrow is (a) canceled, in which case all the funds
// are returned to their respective parties, or (b) closed, in which case the customer gets back 0.5 times
// the price of the product, and the vendor gets 1.5 times the price, minus a small commision, or (c) burned,
// in which case all the funds are lost.
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

  // -------------------------------------------------------------------------------------------------------
  // Escrow Account structure
  // an escrow account between two parties
  // -------------------------------------------------------------------------------------------------------
  struct EscrowAccount {
    bool closed;                        // escrow is no more
    bool approved;                      // purchase has been approved by vendor
    address vendorAddr;
    address customerAddr;
    uint256 productID;                  // productID is an opaque cookie
    uint256 vendorBalance;              // amount that vendor has put into escrow
    uint256 customerBalance;            // amount that customer has put into escrow
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
  mapping (uint256 => EscrowAccount) public escrowAccounts;
  mapping (address => uint256) public balances;


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
  //for debug only...
  function setPartners(address _feesTokenAddr, address _daiTokenAddr) public unlockedOnly ownerOnly {
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
      balances[msg.sender] -= _value;
      balances[_to] += _value;
      emit TransferEvent(msg.sender, _to, _value);
      return true;
    } else {
      return false;
    }
  }

  function transferFrom(address _from, address _to, uint _value) onlyPayloadSize(3*32) public returns (bool success) {
    //prevent wrap:
    if (balances[_from] >= _value && approvals[_from][msg.sender] >= _value && balances[_to] + _value >= balances[_to]) {
      balances[_from] -= _value;
      balances[_to] += _value;
      approvals[_from][msg.sender] -= _value;
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
    balances[msg.sender] = safeAdd(balances[msg.sender],_daiAmount);
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
  function createEscrow(uint256 _productID, uint256 _price, address _vendorAddr, address _customerAddr) public trustedOnly returns (uint256 _escrowID) {
    _escrowID = escrowCount = safeAdd(escrowCount, 1);
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_productID != 0 && _price != 0, "product ID and price cannot be zero");
    _escrowAccount.productID = _productID;
    _escrowAccount.vendorAddr = _vendorAddr;
    _escrowAccount.customerAddr = _customerAddr;
    uint256 _minVendorBond = safeMul(_price, 50) / 100;
    uint256 _minCustomerBond = safeAdd(_price, _minVendorBond);
    require(balances[_vendorAddr] >= _minVendorBond, "insufficient vendor funds");
    require(balances[_customerAddr] >= _minCustomerBond, "insufficient customer funds");
    balances[_vendorAddr] -= _minVendorBond;
    balances[_customerAddr] -= _minCustomerBond;
    _escrowAccount.vendorBalance = safeAdd(_escrowAccount.vendorBalance, _minVendorBond);
    _escrowAccount.customerBalance = safeAdd(_escrowAccount.customerBalance, _minCustomerBond);
    _escrowAccount.approved = false;
  }


  function verifyEscrow(uint256 _escrowID, address _vendorAddr, address _customerAddr) public view returns (uint256 _productID) {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed       == false &&
	    _escrowAccount.vendorAddr   == _vendorAddr &&
	    _escrowAccount.customerAddr == _customerAddr);
    _productID = _escrowAccount.productID;
  }

  function verifyEscrowVendor(uint256 _escrowID, address _vendorAddr) public view returns (uint256 _productID, address _customerAddr) {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed       == false &&
	    _escrowAccount.vendorAddr  == _vendorAddr);
    _productID = _escrowAccount.productID;
    _customerAddr = _escrowAccount.customerAddr;

  }

  function verifyEscrowCustomer(uint256 _escrowID, address _customerAddr) public view returns (uint256 _productID, address _vendorAddr) {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed       == false &&
	    _escrowAccount.customerAddr == _customerAddr);
    _productID = _escrowAccount.productID;
    _vendorAddr = _escrowAccount.vendorAddr;
  }


  // -------------------------------------------------------------------------------------------------------
  // modify the price for a product
  // called by customer to add additional funds to an escrow
  // -------------------------------------------------------------------------------------------------------
  function modifyEscrowPrice(uint256 _escrowID, uint256 _surcharge) public trustedOnly {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed   == false, "escrow is closed");
    require(_escrowAccount.approved == false, "cannot modify price after approval");
    uint256 _minVendorBond = safeMul(_surcharge, 50) / 100;
    uint256 _minCustomerBond = safeAdd(_surcharge, _minVendorBond);
    address _vendorAddr = _escrowAccount.vendorAddr;
    address _customerAddr = _escrowAccount.customerAddr;
    require(balances[_vendorAddr] >= _minVendorBond, "insufficient vendor funds");
    require(balances[_customerAddr] >= _minCustomerBond, "insufficient customer funds");
    balances[_vendorAddr] -= _minVendorBond;
    balances[_customerAddr] -= _minCustomerBond;
    _escrowAccount.vendorBalance = safeAdd(_escrowAccount.vendorBalance,_minVendorBond);
    _escrowAccount.customerBalance = safeAdd(_escrowAccount.customerBalance,_minCustomerBond);
  }


  // -------------------------------------------------------------------------------------------------------
  // cancel an escrow
  // called by customer or vendor, but only before purchase has been approved by vendor
  // -------------------------------------------------------------------------------------------------------
  function cancelEscrow(uint256 _escrowID) public trustedOnly {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed   == false, "escrow is closed");
    require(_escrowAccount.approved == false, "cannot cancel after approval");
    address _vendorAddr = _escrowAccount.vendorAddr;
    address _customerAddr = _escrowAccount.customerAddr;
    balances[_vendorAddr] = safeAdd(balances[_vendorAddr],_escrowAccount.vendorBalance);
    balances[_customerAddr] = safeAdd(balances[_customerAddr],_escrowAccount.customerBalance);
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.customerBalance = 0;
    _escrowAccount.closed = true;
  }


  // -------------------------------------------------------------------------------------------------------
  // approve of a purchase
  // the price is finalized -- funds are now locked into the escrow until they are released or burned.
  // called by vendor
  // -------------------------------------------------------------------------------------------------------
  function approveEscrow(uint256 _escrowID) public trustedOnly {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.closed == false, "escrow is closed");
    _escrowAccount.approved = true;
  }


  // -------------------------------------------------------------------------
  // release escrow funds
  // called by customer, eg to acknowledge succesful delivery of a purchased item
  // -------------------------------------------------------------------------
  function releaseEscrow(uint256 _escrowID) public trustedOnly {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.approved == true, "cannot until after approval");
    address _vendorAddr = _escrowAccount.vendorAddr;
    address _customerAddr = _escrowAccount.customerAddr;
    uint256 _price = safeSub(_escrowAccount.customerBalance, _escrowAccount.vendorBalance);
    uint256 _escrowFee = safeMul(_price, ESCROW_FEE_PCTX10) / 1000;
    retainedFees = safeAdd(retainedFees, _escrowFee);
    uint256 _vendorNet = safeSub(_escrowAccount.customerBalance, _escrowFee);
    balances[_vendorAddr] = safeAdd(balances[_vendorAddr], _vendorNet);
    balances[_customerAddr] = safeAdd(balances[_customerAddr], _escrowAccount.vendorBalance);
    _escrowAccount.vendorBalance = _escrowAccount.customerBalance = 0;
    _escrowAccount.closed = true;
  }


  // -------------------------------------------------------------------------
  // burn the escrow -- this is an extreme measure
  // called by customer, eg to register his conviction that the vendor is a
  // crook, and to stick it to him, even at the cost of his own funds.
  // -------------------------------------------------------------------------
  function burnEscrow(uint256 _escrowID) public payable trustedOnly {
    EscrowAccount storage _escrowAccount = escrowAccounts[_escrowID];
    require(_escrowAccount.approved == true, "cannot until after approval");
    retainedFees = safeAdd(retainedFees, _escrowAccount.customerBalance + _escrowAccount.vendorBalance);
    _escrowAccount.customerBalance = 0;
    _escrowAccount.vendorBalance = 0;
    _escrowAccount.closed = true;
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
