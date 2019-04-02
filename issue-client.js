const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');

const default_prvkey = 'tprv8eNvJamRDCCHSsg8C5uC7sS9dLAW9N2GQgqDhLXs55JgnF4ZwN3CdryEUkr7YsSyVxMDnniAKtpkeRb7mwtgcdHafvUmqwvU5KwujwLT3sY';

const network = bitcoin.networks.testnet;

function gen_digest(file_buffer_array){
    return document.getElementById('digest').textContent = bitcoin.crypto.sha256(Buffer.from(file_buffer_array)).toString('hex');
}

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

function gen_address_qr(prvkey){
    let address = gen_segwit_address(prvkey);
    document.getElementById('qr_address').src = "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chco=000000&chl=bitcoin:" + address;
    document.getElementById('qr_address').style.visibility = "visible";
    return;
}

function get_utxo(prvkey){
    let address = gen_segwit_address(prvkey);
    document.getElementById('address').value = address;
    document.issue_info.submit();
    return;
}

function gen_segwit_address(prvkey){
    let pubkey = bip32.fromBase58(prvkey, network).publicKey;

    let receive = bitcoin.payments.p2wpkh({pubkey: pubkey, network: network});

    return receive.address;
}

function gen_rawtx(prvkey, utxos, digest){
    let fee = 50;

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
    for(let i = 0; i < utxos.length; i++){
        txb.sign(i, prvkey_obj, null, null, utxos[i].value_satoshi);
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
    let fee = 50;

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

function issue(prvkey){
    // generate address
    let address = gen_segwit_address(prvkey);
    document.getElementById('address').value = address;

    // get utxo
    let XHR = new XMLHttpRequest();
    XHR.open('POST', "./test");
    XHR.send('dummy=&' + "phase=1&" + 'address=' + address);

    XHR.onreadystatechange = function(){
        if(XHR.readyState == 4 && XHR.status == 200){
            console.log(XHR.responseText);
            let utxos = JSON.parse(XHR.responseText);

            // generate tx
            let rawtx = gen_rawtx(document.getElementById('privatekey1').value, utxos, document.getElementById('digest').value);
            console.log(rawtx);

            // broadcast tx
            let XHR2 = new XMLHttpRequest();
            XHR2.open('POST', "./test")
            XHR2.send('dummy=&' + "phase=2&" + "rawtx=" + rawtx.toHex());

            XHR2.onreadystatechange = function(){
                if(XHR2.readyState == 4 && XHR2.status == 200){
                    console.log(XHR2.responseText);
                    if(XHR2.responseText == 'OK'){
                        document.getElementById('txid').innerText = rawtx.getId();
                    }
                    else{
                        
                    }
                }
                else{
                    //TODO
                }
            }
        }
        else{
            //TODO
        }
    }
    return;
}

window.gen_digest = gen_digest;
window.gen_address_qr = gen_address_qr;
window.issue = issue;