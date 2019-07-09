pragma solidity ^0.5.0;

import './iERC20Token.sol';


// -------------------------------------------------------------------------------------------------------
//  Categories Contract
// -------------------------------------------------------------------------------------------------------
contract Categories {

  // -------------------------------------------------------------------------------------------------------
  // defines
  // -------------------------------------------------------------------------------------------------------
  uint constant WDAIBALMIN = 10000 ether;
  uint constant TURMSBALMIN = 1000000 ether;


  // -----------------------------------------------------------------------------------------------------
  // events
  // -----------------------------------------------------------------------------------------------------
  event ProposeCategoryEvent(uint256 indexed _category, bytes name, bytes desc);


  // -----------------------------------------------------------------------------------------------------
  // data storage
  // -----------------------------------------------------------------------------------------------------
  bool public isLocked;
  address payable public owner;
  iERC20Token public madEscrow;
  iERC20Token public turmsToken;
  uint8 public noTopLevelCategories;
  mapping (uint8 => uint256) public noSubCategories;


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
  constructor(address _turmsToken, address _madEscrow) public {
    owner = msg.sender;
    turmsToken = iERC20Token(_turmsToken);
    madEscrow = iERC20Token(_madEscrow);
  }
  //for debug only...
  function setPartners(address _turmsToken, address _madEscrow) public unlockedOnly ownerOnly {
    turmsToken = iERC20Token(_turmsToken);
    madEscrow = iERC20Token(_madEscrow);
  }
  function lock() public ownerOnly {
    isLocked = true;
  }
  //default payable function. refuse.
  function () external payable {
    revert();
  }


  // -----------------------------------------------------------------------------------------------------
  // propose
  // topLevelCategory == 0 => this is a top level category
  // topLevelCategory != 0 => add this sub-category to the specified top level category
  // -----------------------------------------------------------------------------------------------------
  function proposeCategory(uint8 _topLevelCategory, bytes memory _name, bytes memory _desc) public {
    uint256 _wdaiBal = madEscrow.balanceOf(msg.sender);
    uint256 _turmsBal = turmsToken.balanceOf(msg.sender);
    require(_wdaiBal >= WDAIBALMIN && _turmsBal > TURMSBALMIN, "invalid proposer");
    uint256 _category;
    if (_topLevelCategory == 0) {
      if (++noTopLevelCategories == 0)
	revert("max top level categories");
      _category = uint256(noTopLevelCategories) << 248;
    } else {
      require(_topLevelCategory <= noTopLevelCategories, "invalid tlc");
      uint256 _subCategoryBit = noSubCategories[_topLevelCategory]++;
      if (_subCategoryBit > 247)
	revert("max sub categories");
      _category = (1 << _subCategoryBit) | uint256(_topLevelCategory) << 248;
    }
    emit ProposeCategoryEvent(_category, _name, _desc);
  }


  // -----------------------------------------------------------------------------------------------------
  // propose
  // topLevelCategory == 0 => this is a top level category
  // topLevelCategory != 0 => add this sub-category to the specified top level category
  // -----------------------------------------------------------------------------------------------------
  function editCategory(uint256 _category, bytes memory _name, bytes memory _desc) public {
    uint256 _wdaiBal = madEscrow.balanceOf(msg.sender);
    uint256 _turmsBal = turmsToken.balanceOf(msg.sender);
    require(_wdaiBal >= 2*WDAIBALMIN && _turmsBal > 2*TURMSBALMIN, "invalid proposer");
    emit ProposeCategoryEvent(_category, _name, _desc);
  }


  // -------------------------------------------------------------------------
  // for debug
  // only available before the contract is locked
  // -------------------------------------------------------------------------
  function killContract() public ownerOnly unlockedOnly {
    selfdestruct(owner);
  }
}
