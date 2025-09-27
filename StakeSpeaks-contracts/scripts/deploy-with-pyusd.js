const { ethers } = require("hardhat");
const ADDRESSES = require("../config/addresses");

async function main() {
  console.log("🚀 Deploying TalkStake with Real PYUSD Integration...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  try {
    console.log("\n📦 Deploying mock KDA token...");

    // Deploy mock KDA token (you'll replace this with real KDA later)
    const MockToken = await ethers.getContractFactory("MockToken");
    const kdaToken = await MockToken.deploy(
      "Kadena Token",
      "KDA",
      18,
      ethers.parseEther("1000000") // 1M KDA
    );
    await kdaToken.waitForDeployment();
    console.log("✅ Mock KDA Token deployed to:", await kdaToken.getAddress());

    // Use real PYUSD contract address
    const PYUSD_ADDRESS = ADDRESSES.PYUSD_SEPOLIA; // Use Sepolia for testing
    console.log("📋 Using PYUSD contract address:", PYUSD_ADDRESS);

    const KDA_TOKEN_ADDRESS = await kdaToken.getAddress();

    console.log("\n📦 Deploying platform contracts...");

    // Deploy all contracts
    const ReputationTracker = await ethers.getContractFactory("ReputationTracker");
    const reputationTracker = await ReputationTracker.deploy();
    await reputationTracker.waitForDeployment();

    const YieldManager = await ethers.getContractFactory("YieldManager");
    const yieldManager = await YieldManager.deploy();
    await yieldManager.waitForDeployment();

    const PYUSDPaymentHandler = await ethers.getContractFactory("PYUSDPaymentHandler");
    const pyusdPayment = await PYUSDPaymentHandler.deploy(PYUSD_ADDRESS);
    await pyusdPayment.waitForDeployment();

    const FilecoinStorage = await ethers.getContractFactory("FilecoinStorage");
    const filecoinStorage = await FilecoinStorage.deploy();
    await filecoinStorage.waitForDeployment();

    const SessionPool = await ethers.getContractFactory("SessionPool");
    const sessionPool = await SessionPool.deploy(KDA_TOKEN_ADDRESS, PYUSD_ADDRESS);
    await sessionPool.waitForDeployment();

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(KDA_TOKEN_ADDRESS, PYUSD_ADDRESS);
    await liquidityPool.waitForDeployment();

    const TalkStake = await ethers.getContractFactory("TalkStake");
    const talkStake = await TalkStake.deploy(
      KDA_TOKEN_ADDRESS,
      PYUSD_ADDRESS,
      await sessionPool.getAddress(),
      await yieldManager.getAddress(),
      await pyusdPayment.getAddress(),
      await reputationTracker.getAddress(),
      await filecoinStorage.getAddress(),
      await liquidityPool.getAddress()
    );
    await talkStake.waitForDeployment();

    // Create yield farming pool
    const createPoolTx = await yieldManager.createPool(
      "TalkStake Main Pool",
      KDA_TOKEN_ADDRESS,
      500 // 5% APY
    );
    await createPoolTx.wait();

    console.log("\n📊 Contract Addresses:");
    console.log("TalkStake (Main):", await talkStake.getAddress());
    console.log("SessionPool:", await sessionPool.getAddress());
    console.log("YieldManager:", await yieldManager.getAddress());
    console.log("PYUSDPaymentHandler:", await pyusdPayment.getAddress());
    console.log("ReputationTracker:", await reputationTracker.getAddress());
    console.log("FilecoinStorage:", await filecoinStorage.getAddress());
    console.log("LiquidityPool:", await liquidityPool.getAddress());
    console.log("Mock KDA Token:", await kdaToken.getAddress());
    console.log("Real PYUSD Token:", PYUSD_ADDRESS);

    console.log("\n🎯 PYUSD Integration Features:");
    console.log("✅ Real PYUSD contract integration");
    console.log("✅ Superchat payments with PYUSD");
    console.log("✅ 80% to speakers, 20% to listeners");
    console.log("✅ PayPal ecosystem compatibility");
    console.log("✅ Stablecoin stability for payments");

    // Save deployment info
    const deploymentInfo = {
      network: "sepolia-testnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        TalkStake: await talkStake.getAddress(),
        SessionPool: await sessionPool.getAddress(),
        YieldManager: await yieldManager.getAddress(),
        PYUSDPaymentHandler: await pyusdPayment.getAddress(),
        ReputationTracker: await reputationTracker.getAddress(),
        FilecoinStorage: await filecoinStorage.getAddress(),
        LiquidityPool: await liquidityPool.getAddress()
      },
      tokens: {
        KDA: KDA_TOKEN_ADDRESS,
        PYUSD: PYUSD_ADDRESS
      },
      pyusdIntegration: {
        contractAddress: PYUSD_ADDRESS,
        superchatDistribution: "80% to speakers, 20% to listeners",
        paypalCompatible: true,
        stablecoinBacked: true
      }
    };

    console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 TalkStake with PYUSD Integration deployed successfully!");
    console.log("\n🚀 Next Steps:");
    console.log("1. Get test PYUSD tokens from Paxos faucet");
    console.log("2. Test superchat functionality");
    console.log("3. Integrate with your frontend");
    console.log("4. Deploy to Kadena testnet");
    console.log("5. Submit for PYUSD track!");

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
