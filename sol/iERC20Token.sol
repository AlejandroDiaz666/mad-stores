pragma solidity ^0.5.0;

// Token standard API
// https://github.com/ethereum/EIPs/issues/20

contract iERC20Token {
  function balanceOf( address who ) public view returns (uint value);
  function allowance( address owner, address spender ) public view returns (uint remaining);

  function transfer( address to, uint value) public returns (bool ok);
  function transferFrom( address from, address to, uint value) public returns (bool ok);
  function approve( address spender, uint value ) public returns (bool ok);

  event Transfer( address indexed from, address indexed to, uint value);
  event Approval( address indexed owner, address indexed spender, uint value);

  //these are implimented via automatic getters
  //function name() public view returns (string _name);
  //function symbol() public view returns (string _symbol);
  //function totalSupply() public view returns (uint256 _totalSupply);

  //but not this, cuz we need to access this fcn in the dai contract
  function decimals() public view returns (uint8 _decimals);
}
