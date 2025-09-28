const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Complete TalkStake Platform...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  try {
    console.log("\n📦 Deploying mock tokens...");

    // Deploy mock KDA token
    console.log("Deploying Mock KDA Token...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const kdaToken = await MockToken.deploy(
      "Kadena Token",
      "KDA",
      18,
      ethers.parseEther("1000000") // 1M KDA
    );
    await kdaToken.waitForDeployment();
    console.log("✅ Mock KDA Token deployed to:", await kdaToken.getAddress());

    // Deploy mock PYUSD token
    console.log("Deploying Mock PYUSD Token...");
    const pyusdToken = await MockToken.deploy(
      "PayPal USD",
      "PYUSD",
      6,
      ethers.parseUnits("1000000", 6) // 1M PYUSD
    );
    await pyusdToken.waitForDeployment();
    console.log("✅ Mock PYUSD Token deployed to:", await pyusdToken.getAddress());

    const KDA_TOKEN_ADDRESS = await kdaToken.getAddress();
    const PYUSD_TOKEN_ADDRESS = await pyusdToken.getAddress();

    console.log("\n📦 Deploying platform contracts...");

    // 1. Deploy ReputationTracker
    console.log("Deploying ReputationTracker...");
    const ReputationTracker = await ethers.getContractFactory("ReputationTracker");
    const reputationTracker = await ReputationTracker.deploy();
    await reputationTracker.waitForDeployment();
    console.log("✅ ReputationTracker deployed to:", await reputationTracker.getAddress());

    // 2. Deploy YieldManager
    console.log("Deploying YieldManager...");
    const YieldManager = await ethers.getContractFactory("YieldManager");
    const yieldManager = await YieldManager.deploy();
    await yieldManager.waitForDeployment();
    console.log("✅ YieldManager deployed to:", await yieldManager.getAddress());

    // 3. Deploy PYUSDPaymentHandler
    console.log("Deploying PYUSDPaymentHandler...");
    const PYUSDPaymentHandler = await ethers.getContractFactory("PYUSDPaymentHandler");
    const pyusdPayment = await PYUSDPaymentHandler.deploy(PYUSD_TOKEN_ADDRESS);
    await pyusdPayment.waitForDeployment();
    console.log("✅ PYUSDPaymentHandler deployed to:", await pyusdPayment.getAddress());

    // 4. Deploy FilecoinStorage
    console.log("Deploying FilecoinStorage...");
    const FilecoinStorage = await ethers.getContractFactory("FilecoinStorage");
    const filecoinStorage = await FilecoinStorage.deploy();
    await filecoinStorage.waitForDeployment();
    console.log("✅ FilecoinStorage deployed to:", await filecoinStorage.getAddress());

    // 5. Deploy SessionPool
    console.log("Deploying SessionPool...");
    const SessionPool = await ethers.getContractFactory("SessionPool");
    const sessionPool = await SessionPool.deploy(KDA_TOKEN_ADDRESS, PYUSD_TOKEN_ADDRESS);
    await sessionPool.waitForDeployment();
    console.log("✅ SessionPool deployed to:", await sessionPool.getAddress());

    // 6. Deploy LiquidityPool
    console.log("Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(KDA_TOKEN_ADDRESS, PYUSD_TOKEN_ADDRESS);
    await liquidityPool.waitForDeployment();
    console.log("✅ LiquidityPool deployed to:", await liquidityPool.getAddress());

    // 7. Deploy main TalkStake integration contract
    console.log("Deploying TalkStake (Main Integration Contract)...");
    const TalkStake = await ethers.getContractFactory("TalkStake");
    const talkStake = await TalkStake.deploy(
      KDA_TOKEN_ADDRESS,
      PYUSD_TOKEN_ADDRESS,
      await sessionPool.getAddress(),
      await yieldManager.getAddress(),
      await pyusdPayment.getAddress(),
      await reputationTracker.getAddress(),
      await filecoinStorage.getAddress(),
      await liquidityPool.getAddress()
    );
    await talkStake.waitForDeployment();
    console.log("✅ TalkStake deployed to:", await talkStake.getAddress());

    // 8. Create a yield farming pool
    console.log("Creating yield farming pool...");
    const createPoolTx = await yieldManager.createPool(
      "TalkStake Main Pool",
      KDA_TOKEN_ADDRESS,
      500 // 5% APY
    );
    await createPoolTx.wait();
    console.log("✅ Yield farming pool created");

    console.log("\n📊 Contract Addresses:");
    console.log("TalkStake (Main):", await talkStake.getAddress());
    console.log("SessionPool:", await sessionPool.getAddress());
    console.log("YieldManager:", await yieldManager.getAddress());
    console.log("PYUSDPaymentHandler:", await pyusdPayment.getAddress());
    console.log("ReputationTracker:", await reputationTracker.getAddress());
    console.log("FilecoinStorage:", await filecoinStorage.getAddress());
    console.log("LiquidityPool:", await liquidityPool.getAddress());

    console.log("\n🎯 Platform Features:");
    console.log("✅ KDA Staking Pools");
    console.log("✅ PYUSD Superchat Payments");
    console.log("✅ Compound Yield Distribution");
    console.log("✅ Dynamic Reputation System");
    console.log("✅ Filecoin Session Storage");
    console.log("✅ Multi-Sponsor Integration");

    // Save deployment info
    const deploymentInfo = {
      network: "kadena-testnet",
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
        PYUSD: PYUSD_TOKEN_ADDRESS
      },
      mockTokens: {
        KDA: await kdaToken.getAddress(),
        PYUSD: await pyusdToken.getAddress()
      },
      features: {
        stakingPools: true,
        superchatPayments: true,
        yieldFarming: true,
        reputationSystem: true,
        filecoinStorage: true,
        multiSponsorIntegration: true
      }
    };

    console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 Complete TalkStake Platform deployed successfully!");
    console.log("\n🚀 Next Steps:");
    console.log("1. Update token addresses with real KDA and PYUSD contracts");
    console.log("2. Test all platform features");
    console.log("3. Create frontend integration");
    console.log("4. Prepare hackathon demo");
    console.log("5. Submit for PYUSD, Kadena, and Filecoin tracks!");

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
