const hre = require("hardhat");

async function main() {

    const Airdropper = await hre.ethers.getContractFactory("Airdropper");
    const airdropper = await Airdropper.deploy("0xc60d7067dfbc6f2caf30523a064f416a5af52963")
    await airdropper.deployed();

    console.log("Airdropper deployed to:", airdropper.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
