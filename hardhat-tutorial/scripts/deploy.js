const { ethers } = require("hardhat")
const {
    WHITELIST_CONTRACT_ADDRESS,
    METADATA_URL,
} = require("../constants/index")

async function main() {
    const cryptoDevContract = await ethers.getContractFactory("CryptoDevs")
    const deployedCryptoDevContract = await cryptoDevContract.deploy(
        METADATA_URL,
        WHITELIST_CONTRACT_ADDRESS
    )
    await deployedCryptoDevContract.deployed()

    console.log("Contract address:", deployedCryptoDevContract.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
