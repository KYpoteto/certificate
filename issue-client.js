const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');

const default_prvkey = 'tprv8eNvJamRDCCHSsg8C5uC7sS9dLAW9N2GQgqDhLXs55JgnF4ZwN3CdryEUkr7YsSyVxMDnniAKtpkeRb7mwtgcdHafvUmqwvU5KwujwLT3sY';

const network = bitcoin.networks.testnet;

exports.gen_address_p2sh_p2wpkh = function(arg_prvkey){
    let prvkey = arg_prvkey || default_prvkey;
    let pubkey = bip32.fromBase58(prvkey, network).publicKey;

    let receive = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({pubkey: pubkey, network: network}),
        network: network
    });
    console.log(receive.input);
    console.log("address: " + receive.address);
    console.log("redeem: " + receive.redeem.output.toString('hex'));
    console.log("witness: " + receive.witness);

    return receive;
}

exports.gen_segwit_address = function(arg_prvkey){
    let prvkey = arg_prvkey || default_prvkey;
    let pubkey = bip32.fromBase58(prvkey, network).publicKey;

    let receive = bitcoin.payments.p2wpkh({pubkey: pubkey, network: network});
    console.log(receive.input);
    console.log("address: " + receive.address);
    console.log("witness: " + receive.witness);

    return receive.address;
}

exports.issue = function(arg_prvkey, arg_utxos, arg_digest){
    let prvkey = arg_prvkey || default_prvkey;
    let utxos = arg_utxos || [{ txid: 'd2f0cd061c1ee1352b7d42b58f3d78916836c1d75210fe901fb9a97155e8a7de',
       output_idx: 1,
       value_satoshi: 7000 }];
    let fee = 500;
    let digest = arg_digest || "374011cc26f0682acd5745f0efc9095d5b7c017bc515dc3c7278168bbe62a131";

    let prvkey_obj = bip32.fromBase58(prvkey, network);
    let target = bitcoin.payments.p2wpkh({pubkey: prvkey_obj.publicKey, network: network});

    let txb = new bitcoin.TransactionBuilder(network);

    // OP_RETURN 
    let certificate_output = bitcoin.payments.embed({data: [Buffer.from(digest, 'hex')]}).output;
    console.log(certificate_output);

    // add input
    let sum_value = 0;
    for(let utxo of utxos){
        txb.addInput(utxo.txid, utxo.output_idx, null , target.output);
        sum_value += utxo.value_satoshi;
    }

    // add output
    txb.addOutput(certificate_output, 0);
    txb.addOutput(target.address, sum_value - fee);

    // sign
    for(let utxo of utxos){
        txb.sign(0, prvkey_obj, null, null, utxo.value_satoshi);
    }

    // build
    const tx = txb.build();

    console.log("raw tx: " + tx.toHex());
    console.log("txid: " + tx.getId());

    return tx;
}

exports.move_btc = function(){
    let txid = "56b774e94944c368c4fba0671fd555dc63fe35fead8f1ace4b774477d81a22dd";
    let output_idx = 1;
    let value = 8500;
    let fee = 500;

    let prvkey_obj = bip32.fromBase58(default_prvkey, network);
    let target = bitcoin.payments.p2wpkh({pubkey: prvkey_obj.publicKey, network: network});

    let txb = new bitcoin.TransactionBuilder(network);

    // add input
    txb.addInput(txid, output_idx, null , target.output);

    // add output
    txb.addOutput(target.address, value - fee);

    // sign
    txb.sign(0, prvkey_obj, null, null, value);

    // build
    const tx = txb.build();

    console.log("raw tx: " + tx.toHex());
    console.log("txid: " + tx.getId());
}