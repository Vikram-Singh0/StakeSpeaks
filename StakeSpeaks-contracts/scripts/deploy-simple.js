const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying StakeSpeaksSimple contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Mock token addresses for demo (using zero address for now)
  const KDA_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
  const PYUSD_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

  try {
    // Deploy StakeSpeaksSimple
    console.log("Deploying StakeSpeaksSimple...");
    const StakeSpeaksSimple = await ethers.getContractFactory("StakeSpeaksSimple");
    const stakeSpeaks = await StakeSpeaksSimple.deploy(KDA_TOKEN_ADDRESS, PYUSD_TOKEN_ADDRESS);
    await stakeSpeaks.waitForDeployment();
    console.log("✅ StakeSpeaksSimple deployed to:", await stakeSpeaks.getAddress());

    console.log("\n📊 Contract Address:");
    console.log("StakeSpeaksSimple:", await stakeSpeaks.getAddress());

    console.log("\n🎯 Next Steps:");
    console.log("1. Update token addresses in the contract");
    console.log("2. Test basic functionality");
    console.log("3. Create frontend demo");
    console.log("4. Prepare hackathon presentation");

    // Save deployment info
    const deploymentInfo = {
      network: "kadena-testnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        StakeSpeaksSimple: await stakeSpeaks.getAddress()
      },
      tokens: {
        KDA: KDA_TOKEN_ADDRESS,
        PYUSD: PYUSD_TOKEN_ADDRESS
      }
    };

    console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
    console.log("\n🎉 Deployment completed successfully!");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

