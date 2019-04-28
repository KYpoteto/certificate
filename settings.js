const bitcoin = require('bitcoinjs-lib');
exports.API = {
    CHAIN_SO : 0,
    MY_NODE : 1
}

exports.network = bitcoin.networks.testnet;
exports.api = module.exports.API.CHAIN_SO;

