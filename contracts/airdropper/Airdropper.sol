pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Airdropper is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable treeb;

    constructor(address _token) {
        treeb = IERC20(_token);
    }

    function transferToUsers(address[] memory _receivers, uint _amount)
        external
        onlyOwner
    {
        for (uint i = 0; i < _receivers.length; i++) {
            treeb.safeTransfer(_receivers[i], _amount);
        }
    }

    function withdrawResidualToken() external onlyOwner {
        uint residualTreeb = treeb.balanceOf(address(this));
        treeb.safeTransfer(owner(), residualTreeb);
    }
}
