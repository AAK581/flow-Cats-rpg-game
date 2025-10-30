const ethers = require("ethers");

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Use for testing, restrict later
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log("setKittens API: Checking GAME_PRIVATE_KEY", { hasKey: !!process.env.GAME_PRIVATE_KEY });
    if (!process.env.GAME_PRIVATE_KEY) {
      console.error("setKittens API: GAME_PRIVATE_KEY missing");
      return res.status(500).json({ error: "Missing GAME_PRIVATE_KEY" });
    }

    let wallet;
    try {
      wallet = new ethers.Wallet(process.env.GAME_PRIVATE_KEY);
      console.log("setKittens API: Wallet address:", wallet.address);
    } catch (error) {
      console.error("setKittens API: Invalid GAME_PRIVATE_KEY", error.message);
      return res.status(500).json({ error: "Invalid GAME_PRIVATE_KEY format" });
    }

    if (req.method !== "POST") {
      console.error("setKittens API: Method not allowed", req.method);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { kittens, userAddress, chainId } = req.body;
    if (!Number.isInteger(kittens) || kittens > 60 || kittens < 0 || !ethers.isAddress(userAddress) || !chainId) {
      console.error("setKittens API: Invalid input", { kittens, userAddress, chainId });
      return res.status(400).json({ error: "Invalid input: kittens (0-60), valid address, and chainId required" });
    }

    const networkConfigs = {
      545: { rpc: "https://testnet.evm.nodes.onflow.org/", contractAddress: "0xa9C4cd6C657f5110C6966c78962D47c24D27BD57" }
    };

    const config = networkConfigs[chainId];
    if (!config) {
      return res.status(400).json({ error: "Unsupported chainId" });
    }

    const provider = new ethers.JsonRpcProvider(config.rpc);
    const signer = wallet.connect(provider);
    const balance = await provider.getBalance(wallet.address);
    console.log("setKittens API: Balance:", ethers.formatEther(balance), "MON");

    let shouldDrip = false;

    if (process.env.REDIS_URL) {
      try {
        const { createClient } = await import('redis');
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();

        const dripKey = `drip:${userAddress.toLowerCase()}`;
        const lastDrip = await redis.get(dripKey);

        if (!lastDrip || Date.now() - parseInt(lastDrip) > 24 * 60 * 60 * 1000) {
          shouldDrip = true;
          await redis.set(dripKey, Date.now().toString());
        }

        await redis.disconnect();
      } catch (err) {
        console.warn("Redis failed, skipping drip limit:", err.message);
        shouldDrip = true;
      }
    } else {
      shouldDrip = true;
    }

    const userBalance = await provider.getBalance(userAddress);
    console.log(`User ${userAddress} balance: ${ethers.formatEther(userBalance)} FLOW`);

    if (shouldDrip && userBalance < ethers.parseEther("0.01")) {
      console.log("Dripping 0.01 FLOW to user");
      const dripTx = await signer.sendTransaction({
        to: userAddress,
        value: ethers.parseEther("0.01"),
        gasLimit: 21000,
      });
      await dripTx.wait();
      console.log("Drip successful:", dripTx.hash);
    }

    const contract = new ethers.Contract(
      config.contractAddress,
      [
    {
      "type": "constructor",
      "inputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "receive",
      "stateMutability": "payable"   
    },
    {
      "type": "function",
      "name": "KITTENS_REQUIRED",    
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "REWARD",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "changeReward",
      "inputs": [
        {
          "name": "newReward",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "dailyRewards",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "fundContract",
      "inputs": [],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "gameAddress",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getKittens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getTotalKittens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "lastClaimDay",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "rewardUser",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setGameAddress",
      "inputs": [
        {
          "name": "_gameAddress",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setKittens",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_value",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "totalKittens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "userKittens",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "DonationReceived",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "KittensUpdated",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newValue",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "UserRewarded",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    }
  ], signer
    );

console.log("setKittens API: Sending tx", { kittens, userAddress, chainId });
    const tx = await contract.setKittens(userAddress, kittens, { gasLimit: 300000 });
    console.log("setKittens API: Transaction sent, hash:", tx.hash);
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Transaction timeout")), 30000))
    ]);
    console.log("setKittens API: Success", { txHash: tx.hash });
    return res.status(200).json({ txHash: tx.hash });
  } catch (error) {
    console.error("setKittens API Error:", error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
};