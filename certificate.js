const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32')
const base58check = require('base58check');
const settings = require('./settings');

const network = bitcoin.networks.testnet;

const default_prvkeys = settings.privatekeys;
const default_redeem_multisig = settings.redeem_multisig;
const default_txid = settings.txid;
const default_output_index = settings.output_index;

const value = settings.value;
const fee = settings.fee;

exports.gen_address = function(arg_prvkeys){
    let prvkeys = arg_prvkeys || default_prvkeys;
    let pubkeys = prvkeys.map(x => bip32.fromBase58(x, network).publicKey.toString('hex'));

    let receive = bitcoin.payments.p2sh({
        network: network,
        redeem: bitcoin.payments.p2ms({
            network: network,
            m: pubkeys.length,
            pubkeys: pubkeys.map(hex => Buffer.from(hex, 'hex'))
        })
    })
    console.log("address: " + receive.address);
    console.log("redeem: " + receive.redeem.output.toString('hex'));
    console.log("witness: " + receive.witness);
    
    return receive;
};

exports.gen_tx = function(arg_prvkeys, arg_certificate){
    const txb = new bitcoin.TransactionBuilder(network);

    let txid = default_txid;
    let output_index = default_output_index;

    console.log(arg_prvkeys);
    let prvkeys = arg_prvkeys;
    let certificate_data = arg_certificate;

    let address = module.exports.gen_address(prvkeys);

    // OP_RETURN 
    let certificate_output = bitcoin.payments.embed({data: [Buffer.from(certificate_data, 'hex')]}).output;
    console.log(certificate_output);

    // add input tx
    txb.addInput(txid, output_index);
    
    // add output tx
    txb.addOutput(certificate_output, 0);
    txb.addOutput(address.address, value - fee);
    
    // sign
    for(let i = 0; i < prvkeys.length; i++){
        txb.sign(0, bip32.fromBase58(prvkeys[i], network), address.redeem.output);
    }
    
    // build tx
    const tx = txb.build();
    
    console.log("raw tx: " + tx.toHex());
    console.log("txid: " + tx.getId());

    return tx;
};

exports.verify = function(){
    //arg
    //target_txid
    //output index

    //return
    //message digest
}


exports.move_btc = function(){
    const txb = new bitcoin.TransactionBuilder(network);

    const target_address = "2N4RkeZboZDDjfLi6LaKmMUf31oTzLnuJos";   //2 of 2 multisig address
    // add input tx
    txb.addInput(default_txid, default_output_index);
    
    // add output tx
    txb.addOutput(target_address, value - fee);
    
    // sign
    txb.sign(0, bip32.fromBase58(default_prvkeys[0], network), Buffer.from(default_redeem_multisig, 'hex'));
    txb.sign(0, bip32.fromBase58(default_prvkeys[1], network), Buffer.from(default_redeem_multisig, 'hex'));
    
    // build tx
    const tx = txb.build();
    
    console.log("raw tx: " + tx.toHex());
    console.log("txid: " + tx.getId());
}