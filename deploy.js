require("dotenv").config();
const ethers = require("ethers");
const WrappedNativeContractArtifacts = require("./artifacts-zk/contracts/WrappedNativeToken.sol/WrappedNativeToken.json");
const NativeHomeArtifacts = require("./artifacts/NativeTokenHomeUpgradeable.json");
const TokenRemoteArtifacts = require("./artifacts/ERC20PlatformTokenRemoteUpgradeable.json");
const FeeTokenArtifacts = require("./artifacts-zk/contracts/ICCTFeeToken.sol/ICCTFeeToken.json");
const BeaconArtifacts = require("./artifacts-zk/contracts/Beacon.sol/BeaconContract.json");
const BeaconProxyArtifacts = require("./artifacts-zk/contracts/Beacon.sol/BeaconProxyContract.json");
const PlatformTokenContract = require("./artifacts-zk/contracts/PlatformToken.sol/PlatformToken.json");
const CreateXArtifacts = require("./artifacts/CreateX.json");
const SafeArtifacts = require("./artifacts/SafeL2.json");
const tsdk = require("@thirdweb-dev/sdk");

// 0xFe7528b04DE8B10a9E50FA92CDD0d87d31c0b1e6
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

const ChainConfig = {
  53123: {
    RPC: "https://subnets.avax.network/metasky/testnet/rpc",
    BlockchainId:
      "0x0bfa563ab787435925e49f9db5840e158dda584f63df5d0f433e36f795885c1b",
    RegistryContract: "0xE329B5Ff445E4976821FdCa99D6897EC43891A6c",
  },
  43113: {
    RPC: "https://ava-testnet.public.blastapi.io/ext/bc/C/rpc",
    BlockchainId:
      "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    RegistryContract: "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228",
  },
};

const HomeChainId = "53123";
const RemoteChainId = "43113";

// Remote/Fuji Network
const RemoteRPC = ChainConfig[RemoteChainId].RPC;
const RemoteBlockchainId = ChainConfig[RemoteChainId].BlockchainId;
const RemoteRegistryContract = ChainConfig[RemoteChainId].RegistryContract;
// https://build.avax.network/docs/cross-chain/teleporter/addresses

// L1 53123 Network
const HomeRPC = ChainConfig[HomeChainId].RPC;
const HomeBockchainId = ChainConfig[HomeChainId].BlockchainId;
const HomeRegistryContract = ChainConfig[HomeChainId].RegistryContract;

// L1 Contracts
const HomeFeeToken = "0xF5Ed91E064c151c4534808CB9218Da544b06fe15";
const WrappedQBE = "0xB5Cc1e026a694812aA42AC22eD8B508153085762";
const HomeContractBeacon = "0x7C549eE23A7Da730B410bA53746e3Ba1f95A155f";
const HomeContractImpl = "0x998CFd587b320E13dF307EB59dDcEFe1Cfff062D";
const HomeContract = "0xF62a20D72e02527b3E9576CE333611E1871a5B6E"; // Does not represent a Token but helper to transfer Home Tokens

// Fuji Contracts
const RemoteFeeToken = "0xF5Ed91E064c151c4534808CB9218Da544b06fe15";
const RemoteTokenBeacon = "0xFcf76a1D0660ae4553c98766358Ab050741f4840";
const RemoteContractImpl = "0x568Bcd144d975B9399bDa7B6579508702305770f";
const RemoteTokenContract = "0x8c04198D1520891EFbFf45711976128fbd2000ca";

/**
 * https://github.com/pcaversaccio/createx
 */
// const CreateXContract = "0x8203b6d742b948B8382d375FF2De49F9997658C1"; // L1 and Fuji
const CreateXContract = "0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed"; // All chains except L1

function getInitCode(bytecode, paramsTypes, params) {
  return (
    bytecode + ethers.utils.defaultAbiCoder.encode(paramsTypes, params).slice(2)
  );
}
// deplotCreate2Initcode(getInitCode(AirdropArtifacts.bytecode, ["uint256"], [56]))

async function consoleAsync(p) {
  console.log(await p)
} 

async function deployCreateX(rpc) {
  const provider = ethers.providers.getDefaultProvider(rpc);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.ContractFactory(
    CreateXArtifacts.abi,
    CreateXArtifacts.bytecode,
    wallet
  );
  const deployedContract = await contract.deploy();
  return deployedContract.address;
}

async function deployCreateX3ContractAndInit(
  chainRPC,
  salt,
  initcode,
  data,
  values
) {
  /**
   * salt: SaleGenerator.generateSalt
   *
   * data:
   * const airdropInterface = new ethers.utils.Interface(AirdropArtifacts.abi);
   * const data = airdropInterface.encodeFunctionData("initialize",
   *  [56]
   * );
   *
   * values:
   * {
   *  uint256 constructorAmount;
   *  uint256 initCallAmount;
   * }
   *
   * Eg:
   * deployCreateXContract("0x8203b6d742b948B8382d375FF2De49F9997658C1", "0xFe7528b04DE8B10a9E50FA92CDD0d87d31c0b1e600c5a752fb9c1b921575002e", AirdropArtifacts.bytecode, data, {constructorAmount: 0, initCallAmount: 0})
   */
  const sdk = await tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, chainRPC);
  const contract = await sdk.getContractFromAbi(CreateXContract, [
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "salt",
          type: "bytes32",
        },
        {
          internalType: "bytes",
          name: "initCode",
          type: "bytes",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "constructorAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "initCallAmount",
              type: "uint256",
            },
          ],
          internalType: "struct CreateX.Values",
          name: "values",
          type: "tuple",
        },
      ],
      name: "deployCreate3AndInit",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ]);
  const result = await contract.call("deployCreate3AndInit", [
    salt,
    initcode,
    data,
    values,
  ]);
  return result;
}

async function deployCreateX3Contract(chainRPC, salt, initcode) {
  const sdk = await tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, chainRPC);
  const contract = await sdk.getContractFromAbi(CreateXContract, [
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "salt",
          type: "bytes32",
        },
        {
          internalType: "bytes",
          name: "initCode",
          type: "bytes",
        },
      ],
      name: "deployCreate3",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ]);
  const result = await contract.call("deployCreate3", [salt, initcode]);
  return result;
}

async function deployContract(rpc, abi, bytecode, args) {
  const provider = ethers.providers.getDefaultProvider(rpc);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployedContract = await contract.deploy(...args);
  return deployedContract.address;
}

async function deployContractUsingBeaconProxy(
  rpc,
  abi,
  bytecode,
  args,
  initializer,
  intializerArgs
) {
  const implContract = await deployContract(rpc, abi, bytecode, args);
  console.log("implContract", implContract);

  const beacon = await deployContract(
    rpc,
    BeaconArtifacts.abi,
    BeaconArtifacts.bytecode,
    [implContract, WALLET_ADDRESS]
  );
  console.log("beacon", beacon)

  const interface = new ethers.utils.Interface(abi);
  const data = interface.encodeFunctionData(initializer, intializerArgs);

  const contract = await deployContract(rpc, BeaconProxyArtifacts.abi, BeaconProxyArtifacts.bytecode, [beacon, data]);
  console.log("contract", contract)
  return contract;
}

async function deployContractUsingBeaconProxyAndCreateX(
  rpc,
  salt,
  abi,
  bytecode,
  argTypes,
  args,
  initializer,
  intializerArgs
) {
  const implContract = await deployContract(rpc, abi, bytecode, args);
  console.log("implContract", implContract);

  const beacon = await deployContract(
    rpc,
    BeaconArtifacts.abi,
    BeaconArtifacts.bytecode,
    [implContract, WALLET_ADDRESS],
  );
  console.log("beacon", beacon)

  const interface = new ethers.utils.Interface(abi);
  const data = interface.encodeFunctionData(initializer, intializerArgs);

  const result = await deployCreateX3Contract(
    rpc,
    salt,
    getInitCode(
      BeaconProxyArtifacts.bytecode,
      ["address", "bytes"],
      [beacon, data]
    )
  );
  return result;
}

/**
 * Deploy Fee Contracts
 */

// deployContract(HomeRPC, FeeTokenArtifacts.abi, FeeTokenArtifacts.bytecode, [
//   "BridgeFee",
//   "BridgeFee",
// ]);

/** or */

// consoleAsync(deployCreateX3Contract(
//   HomeRPC,
//   "0xfe7528b04de8b10a9e50fa92cdd0d87d31c0b1e600be7f0627ac5dbedeaf2408",
//   getInitCode(
//     FeeTokenArtifacts.bytecode,
//     ["string", "string"],
//     ["BridgeFee", "BridgeFee"]
//   )
// )); // 0xc084e0e55b5c7479dca8078edf39c0deba0a50e5e7679bd02146d62cfe79413e => 0xF5Ed91E064c151c4534808CB9218Da544b06fe15




// deployContract(RemoteRPC, FeeTokenArtifacts.abi, FeeTokenArtifacts.bytecode, [
//   "BridgeFee",
//   "BridgeFee",
// ]);

/** or */

// consoleAsync(deployCreateX3Contract(
//   RemoteRPC,
//   "0xfe7528b04de8b10a9e50fa92cdd0d87d31c0b1e600be7f0627ac5dbedeaf2408",
//   getInitCode(
//     FeeTokenArtifacts.bytecode,
//     ["string", "string"],
//     ["BridgeFee", "BridgeFee"]
//   )
// )); // 0x8010c579654915955c1b8e238efa6be4d26c645964064a670b2267c3c4d5c5f6 => 0xF5Ed91E064c151c4534808CB9218Da544b06fe15

/**
 * Deploy WrappedNativeToken
 */

// deployContract(
//   HomeRPC,
//   WrappedNativeContractArtifacts.abi,
//   WrappedNativeContractArtifacts.bytecode,
//   ["QBE"]
// ); // 0xB5Cc1e026a694812aA42AC22eD8B508153085762

/**
 * Deploy Home Contract using Beacon
 * 
 * implContract 0x998CFd587b320E13dF307EB59dDcEFe1Cfff062D
 * beacon 0x7C549eE23A7Da730B410bA53746e3Ba1f95A155f
 * contract 0xF62a20D72e02527b3E9576CE333611E1871a5B6E
 */

// consoleAsync(deployContractUsingBeaconProxy(
//   HomeRPC,
//   NativeHomeArtifacts.abi,
//   NativeHomeArtifacts.bytecode,
//   [1],
//   "initialize",
//   [HomeRegistryContract, WALLET_ADDRESS, 1, WrappedQBE]
// ));


/**
 * Deploy Remote Token Contract
 * 
 * implContract 0x568Bcd144d975B9399bDa7B6579508702305770f
 * beacon 0xFcf76a1D0660ae4553c98766358Ab050741f4840
 * contract 0xea628eda54222d45379ba6cd217c5659b85d7d98029f3471ea0e9fbe7aada5d0 => 0x8c04198D1520891EFbFf45711976128fbd2000ca
 */

// deployContractUsingBeaconProxy(
//   RemoteRPC,
//   TokenRemoteArtifacts.abi,
//   TokenRemoteArtifacts.bytecode,
//   [1],
//   "initialize",
//   [
//     {
//       teleporterRegistryAddress: RemoteRegistryContract,
//       teleporterManager: WALLET_ADDRESS,
//       minTeleporterVersion: 1,
//       tokenHomeBlockchainID: HomeBockchainId,
//       tokenHomeAddress: HomeContract,
//       tokenHomeDecimals: 18,
//     },
//     "QBE",
//     "QBE",
//     18,
//   ]
// );

/** OR */

// consoleAsync(deployContractUsingBeaconProxyAndCreateX(
//   RemoteRPC,
//   "0xfe7528b04de8b10a9e50fa92cdd0d87d31c0b1e600d523967086ed2bf79f1398",
//   TokenRemoteArtifacts.abi,
//   TokenRemoteArtifacts.bytecode.object,
//   ["uint8"],
//   [0],
//   "initialize",
//   [
//     {
//       teleporterRegistryAddress: RemoteRegistryContract,
//       teleporterManager: WALLET_ADDRESS,
//       minTeleporterVersion: 1,
//       tokenHomeBlockchainID: HomeBockchainId,
//       tokenHomeAddress: HomeContract,
//       tokenHomeDecimals: 18,
//     },
//     "QBE",
//     "QBE",
//     18,
//     WALLET_ADDRESS
//   ]
// ));

/**
 *
 * Deploy token on other EVM Chain
 */

consoleAsync(deployContractUsingBeaconProxyAndCreateX(
  "https://eth-sepolia.g.alchemy.com/v2/demo",
  "0xfe7528b04de8b10a9e50fa92cdd0d87d31c0b1e600d523967086ed2bf79f1398",
  PlatformTokenContract.abi,
  PlatformTokenContract.bytecode,
  [],
  [],
  "initialize",
  ["QBE", "QBE", WALLET_ADDRESS]
));


/**
 * Registering ICCT and Testing
 */

// Call RemoteTokenContract.registerWithHome to register this contract on HomeContract
async function registerWithHome() {
  const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, RemoteRPC);
  // Approve RemoteTokenContract to access RemoteFeeToken token from callers pool
  const contract = await sdk.getContractFromAbi(
    RemoteTokenContract,
    TokenRemoteArtifacts.abi
  );
  // {
  //     address feeTokenAddress;
  //     uint256 amount;
  // }
  const tx = await contract.call("registerWithHome", [
    {
      feeTokenAddress: RemoteFeeToken,
      amount: 1,
    },
  ]);
  console.log(tx);
}

// registerWithHome()

async function checkRemoteRegistered() {
  const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
  const contract = await sdk.getContractFromAbi(
    HomeContract,
    NativeHomeArtifacts.abi
  );
  const result = await contract.call("getRemoteTokenTransferrerSettings", [
    RemoteBlockchainId,
    RemoteTokenContract,
  ]);
  console.log({ result });
}

// checkRemoteRegistered()

async function sendNativeTokens() {
  const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
  const contract = await sdk.getContractFromAbi(
    HomeContract,
    NativeHomeArtifacts.abi
  );
  // {
  //     bytes32 destinationBlockchainID;
  //     address destinationTokenTransferrerAddress;
  //     address recipient;
  //     address primaryFeeTokenAddress;
  //     uint256 primaryFee;
  //     uint256 secondaryFee;
  //     uint256 requiredGasLimit;
  //     address multiHopFallback;
  // }
  const tx = await contract.call(
    "send",
    [
      {
        destinationBlockchainID: RemoteBlockchainId,
        destinationTokenTransferrerAddress: RemoteTokenContract,
        recipient: await sdk.wallet.getAddress(),
        primaryFeeTokenAddress: HomeFeeToken,
        primaryFee: 1,
        secondaryFee: 0, // Should be 0
        requiredGasLimit: 250000, //250000,
        multiHopFallback: "0x0000000000000000000000000000000000000000", // Should be 0
      },
    ],
    { value: ethers.utils.parseEther("0.01") }
  );
  console.log(tx);
}

// sendNativeTokens()

async function sendRemoteTokens() {
  const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, RemoteRPC);
  const contract = await sdk.getContractFromAbi(
    RemoteTokenContract,
    TokenRemoteArtifacts.abi
  );
  // {
  //     bytes32 destinationBlockchainID;
  //     address destinationTokenTransferrerAddress;
  //     address recipient;
  //     address primaryFeeTokenAddress;
  //     uint256 primaryFee;
  //     uint256 secondaryFee;
  //     uint256 requiredGasLimit;
  //     address multiHopFallback;
  // }
  // Give RemoteFeeToken allowance to RemoteTokenContract
  // Give wrapped token allowance to RemoteTokenContract
  const tx = await contract.call("send", [
    {
      destinationBlockchainID: HomeBockchainId,
      destinationTokenTransferrerAddress: HomeContract,
      recipient: await sdk.wallet.getAddress(),
      primaryFeeTokenAddress: RemoteFeeToken,
      primaryFee: 1,
      secondaryFee: 0, // Should be 0
      requiredGasLimit: 250000,
      multiHopFallback: "0x0000000000000000000000000000000000000000", // Should be 0
    },
    ethers.utils.parseEther("0.005"),
  ]);
  console.log(tx);
  // C Chain: 0x2359ae21fa02a10578d6cc93354e337b6e7e3472de14e7bedfe27399bff2772e
}

async function nativeBalanceOf() {
  const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
  console.log(await sdk.wallet.balance());
}
