pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Airdropper is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable treeb;

    address public ownerAddress;

    event Airdrop(address _receiver, uint _amount);

    constructor(address _token) {
        treeb = IERC20(_token);
        ownerAddress = owner();
    }

    function transferToUsers(address[] memory  _receivers, uint _amount) external onlyOwner {
        for(uint i=0; i < _receivers.length; i++) {
            treeb.safeTransfer(_receivers[i], _amount);
            emit Airdrop(_receivers[i], _amount);
        }
    }

    function withdrawResidualToken() external onlyOwner {
        uint residualTreeb = treeb.balanceOf(address(this));
        treeb.safeTransfer(ownerAddress, residualTreeb);
    }

}
