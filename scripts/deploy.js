const hre = require("hardhat");

async function main() {

    const Treeb = await hre.ethers.getContractFactory("Token");
    const treeb = await Treeb.deploy("100000000000000000000000");
    await treeb.deployed();

    const Airdropper = await hre.ethers.getContractFactory("Airdropper");
    const airdropper = await Airdropper.deploy(treeb.address)
    await airdropper.deployed();

    console.log("Treeb address:", treeb.address);
    console.log("Airdropper deployed to:", airdropper.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
