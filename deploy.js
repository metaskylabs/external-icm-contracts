require("dotenv").config();
const ethers = require("ethers");
const WrappedNativeContractArtifacts = require("./artifacts-zk/contracts/WrappedNativeToken.sol/WrappedNativeToken.json");
const NativeHomeArtifacts = require("./artifacts/NativeTokenHomeUpgradeable.json");
const TokenRemoteArtifacts = require("./artifacts/ERC20PlatformTokenRemoteUpgradeable.json");
const FeeTokenArtifacts = require("./artifacts-zk/contracts/ICCTFeeToken.sol/ICCTFeeToken.json");
const BeaconArtifacts = require("./artifacts-zk/contracts/Beacon.sol/BeaconContract.json");
const BeaconProxyArtifacts = require("./artifacts-zk/contracts/Beacon.sol/BeaconProxyContract.json");
const tsdk = require("@thirdweb-dev/sdk");

// 0xFe7528b04DE8B10a9E50FA92CDD0d87d31c0b1e6
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Remote/Fuji Network
const RemoteRPC = 'https://rpc.ankr.com/avalanche_fuji'
const RemoteBlockchainId = "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5";
const RemoteRegistryContract = "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228"
// https://build.avax.network/docs/cross-chain/teleporter/addresses

// L1 53123 Network
const HomeRPC = 'https://subnets.avax.network/metasky/testnet/rpc'
const HomeBockchainId = "0x0bfa563ab787435925e49f9db5840e158dda584f63df5d0f433e36f795885c1b";
const RegistryContract = "0xE329B5Ff445E4976821FdCa99D6897EC43891A6c"

// L1 Contracts
const HomeStakeTokenContract = "0x89D454645F044a6826db38eE7a0A57335d2dB2Fe";
const WrappedQBE = "0x5dFce5375a1f41b2708659e98306B52f554C3041"
const HomeContractBeacon = "0x48920f7d82FcC8168Ca2408d9679ad0E6461FfB2"
const HomeContractImpl = "0xEB0886b3CFb880AE07Eda34b1FDaC32AE835cBAF"
const HomeContract = "0xd28046f5F00beD1d0472584153eDaF79a19A1b09" // Does not represent a Token but helper to transfer Home Tokens

// Fuji Contracts
const RemoteStakeTokenContract = "0x74B147b736ec271Ceb953E70e0377fE5796cbb5f";
const RemoteTokenBeacon = "0x77b6156b6ceEa7720d511D897196EC147A7dEE31"
const RemoteContractImpl = "0xc1519ef08F80192cBE8a5f1F5701180449a3E490"
const RemoteTokenContract = "0xD9b25c5D653857767d7594C0bc29Ab70D045e517"

async function deployHomeFeeContract() {
    const provider = ethers.providers.getDefaultProvider(HomeRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(FeeTokenArtifacts.abi, FeeTokenArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy("BridgeToken", "BridgeToken");
    console.log(deployedContract.address)
}

async function deployRemoteFeeContract() {
    const provider = ethers.providers.getDefaultProvider(RemoteRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(FeeTokenArtifacts.abi, FeeTokenArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy("BridgeToken", "BridgeToken");
    console.log(deployedContract.address)
}


async function deployWrappedNativeToken() {
    const provider = ethers.providers.getDefaultProvider(HomeRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(WrappedNativeContractArtifacts.abi, WrappedNativeContractArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy("QBE");
    console.log(deployedContract.address)
}

async function deployHomeContractImpl() {
    const provider = ethers.providers.getDefaultProvider(HomeRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(NativeHomeArtifacts.abi, NativeHomeArtifacts.bytecode, wallet);
    // teleporterRegistryAddress, teleporterManager, minTeleporterVersion, wrappedTokenAddress
    const deployedContract = await contract.deploy(
        1 // Disallow initialising the impl contract
    );
    // const deployedContract = await contract.deploy(RegistryContract, wallet.address, 1, WrappedQBE);
    console.log(deployedContract.address)
}

async function deployRemoteContractImpl() {
    const provider = ethers.providers.getDefaultProvider(RemoteRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(TokenRemoteArtifacts.abi, TokenRemoteArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy(
        1
    );
    console.log(deployedContract.address)
}

async function deployHomeContractBeacon() {
    const provider = ethers.providers.getDefaultProvider(HomeRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(BeaconArtifacts.abi, BeaconArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy(HomeContractImpl);
    console.log(deployedContract.address)
} 

async function deployRemoteContractBeacon() {
    const provider = ethers.providers.getDefaultProvider(RemoteRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.ContractFactory(BeaconArtifacts.abi, BeaconArtifacts.bytecode, wallet);
    const deployedContract = await contract.deploy(RemoteContractImpl);
    console.log(deployedContract.address)
}

async function deployHomeContractProxy() {
    const provider = ethers.providers.getDefaultProvider(HomeRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
    const nativeHomeinterface = new ethers.utils.Interface(NativeHomeArtifacts.abi);
    const data = nativeHomeinterface.encodeFunctionData("initialize", 
      [RegistryContract, wallet.address, 1, WrappedQBE]
    );  
    const txn = await sdk.deployer.deployContractWithAbi(BeaconProxyArtifacts.abi, BeaconProxyArtifacts.bytecode, [HomeContractBeacon, data])
    console.log(txn)
}

async function deployRemoteContractProxy() {
    const provider = ethers.providers.getDefaultProvider(RemoteRPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, RemoteRPC);
    const tokenRemoteInterface = new ethers.utils.Interface(TokenRemoteArtifacts.abi);
    const data = tokenRemoteInterface.encodeFunctionData("initialize", 
      [
        {
            teleporterRegistryAddress: RemoteRegistryContract,
            teleporterManager: wallet.address,
            minTeleporterVersion: 1,
            tokenHomeBlockchainID: HomeBockchainId,
            tokenHomeAddress: HomeContract,
            tokenHomeDecimals: 18
        }, 
        'WQBE', 
        'WQBE', 
        18,
      ]
    );  
    const txn = await sdk.deployer.deployContractWithAbi(BeaconProxyArtifacts.abi, BeaconProxyArtifacts.bytecode, [RemoteTokenBeacon, data])
    console.log(txn)
}

// Call RemoteTokenContract.registerWithHome to register this contract on HomeContract
async function registerWithHome() {
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, RemoteRPC);
    // Approve RemoteTokenContract to access RemoteStakeTokenContract token from callers pool
    const contract = await sdk.getContractFromAbi(RemoteTokenContract, TokenRemoteArtifacts.abi);
    // {
    //     address feeTokenAddress;
    //     uint256 amount;
    // }
    const tx = await contract.call("registerWithHome", [
        {
            feeTokenAddress: RemoteStakeTokenContract,
            amount: 1
        }
    ]);
    console.log(tx)
}

async function checkRemoteRegistered() {
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
    const contract = await sdk.getContractFromAbi(HomeContract, NativeHomeArtifacts.abi);
    const result = await contract.call("getRemoteTokenTransferrerSettings", [RemoteBlockchainId, RemoteTokenContract])
    console.log({result})
}

async function sendNativeTokens() {
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
    const contract = await sdk.getContractFromAbi(HomeContract, NativeHomeArtifacts.abi);
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
    const tx = await contract.call("send", [
        {
            destinationBlockchainID: RemoteBlockchainId,
            destinationTokenTransferrerAddress: RemoteTokenContract,
            recipient: await sdk.wallet.getAddress(),
            primaryFeeTokenAddress: HomeStakeTokenContract,
            primaryFee: 1,
            secondaryFee: 0, // Should be 0 
            requiredGasLimit: 250000,
            multiHopFallback: "0x0000000000000000000000000000000000000000" // Should be 0
        }
    ], {value: ethers.utils.parseEther("0.01")})
    console.log(tx)
    // Metasky L1: 0xab82cb773629c58c639be277b9614f47988722d215bc2f88647af6314c40557e
}

async function sendRemoteTokens() {
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, RemoteRPC);
    const contract = await sdk.getContractFromAbi(RemoteTokenContract, TokenRemoteArtifacts.abi);
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
    // Give RemoteStakeTokenContract allowance to RemoteTokenContract
    // Give wrapped token allowance to RemoteTokenContract 
    const tx = await contract.call("send", [
        {
            destinationBlockchainID: HomeBockchainId,
            destinationTokenTransferrerAddress: HomeContract,
            recipient: await sdk.wallet.getAddress(),
            primaryFeeTokenAddress: RemoteStakeTokenContract,
            primaryFee: 1,
            secondaryFee: 0, // Should be 0 
            requiredGasLimit: 250000,
            multiHopFallback: "0x0000000000000000000000000000000000000000" // Should be 0
        },
        ethers.utils.parseEther("0.005")
    ])
    console.log(tx)
    // C Chain: 0x2359ae21fa02a10578d6cc93354e337b6e7e3472de14e7bedfe27399bff2772e
}

async function nativeBalanceOf() {
    const sdk = tsdk.ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, HomeRPC);
    console.log(await sdk.wallet.balance())
}

// deployHomeFeeContract() // 0x89D454645F044a6826db38eE7a0A57335d2dB2Fe

// deployRemoteFeeContract() // 0x74B147b736ec271Ceb953E70e0377fE5796cbb5f

// deployWrappedNativeToken() // 0x5dFce5375a1f41b2708659e98306B52f554C3041

// deployHomeContractImpl() // 0xEB0886b3CFb880AE07Eda34b1FDaC32AE835cBAF

// deployRemoteContractImpl() // 0xc1519ef08F80192cBE8a5f1F5701180449a3E490

// deployHomeContractBeacon() // 0x48920f7d82FcC8168Ca2408d9679ad0E6461FfB2

// deployRemoteContractBeacon() // 0x77b6156b6ceEa7720d511D897196EC147A7dEE31

// deployHomeContractProxy() // 0xd28046f5F00beD1d0472584153eDaF79a19A1b09

// deployRemoteContractProxy() // 0xD9b25c5D653857767d7594C0bc29Ab70D045e517

// Whitelist deployHomeContractProxy and deployRemoteContractProxy in avacloud

// registerWithHome() // Hash: 0x1502a4aad281a334c4cec2f99fde6d20b22282f60e368980e7b7b829899d731e

// checkRemoteRegistered()

// sendNativeTokens() // 0x0d0d0960964c282582089ebe4551e766082e9f06c4b3fb676fa80785561b6851

// sendRemoteTokens() // 0x3ad056d17509bdec39cef17a72e0264e7922b1c235db8a61a91c7a4f120eef9c
