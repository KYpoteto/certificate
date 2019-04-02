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

function error_process(message){
    alert(message);
}

function issue(prvkey){
    // generate address
    let address = gen_segwit_address(prvkey);
    document.getElementById('address').value = address;

    // get utxo
    let XHR_get_utxo = new XMLHttpRequest();
    XHR_get_utxo.open('POST', "./issue");
    XHR_get_utxo.send('dummy=&' + "phase=1&" + 'address=' + address);

    XHR_get_utxo.onreadystatechange = function(){
        if(XHR_get_utxo.readyState == 4 && XHR_get_utxo.status == 200){
            console.log(XHR_get_utxo.responseText);
            let utxos = JSON.parse(XHR_get_utxo.responseText);

            // generate tx
            let rawtx = gen_rawtx(document.getElementById('privatekey1').value, utxos, document.getElementById('digest').value);
            console.log(rawtx);

            // broadcast tx
            let XHR_broadcast = new XMLHttpRequest();
            XHR_broadcast.open('POST', "./issue")
            XHR_broadcast.send('dummy=&' + "phase=2&" + "rawtx=" + rawtx.toHex());

            XHR_broadcast.onreadystatechange = function(){
                if(XHR_broadcast.readyState == 4 && XHR_broadcast.status == 200){
                    console.log(XHR_broadcast.responseText);
                    if(XHR_broadcast.responseText == 'OK'){
                        document.getElementById('txid').innerText = rawtx.getId();
                    }
                    else{
                        error_process('証明書発行に失敗しました');
                    }
                }
            }
            XHR_broadcast.onerror = function(){
                error_process('証明書発行に失敗しました');
            }
            XHR_broadcast.onabort = function(){
                error_process('証明書発行に失敗しました');
            }
            XHR_broadcast.ontimeout = function(){
                error_process('証明書発行に失敗しました');
            }
        }
    }

    XHR_get_utxo.onerror = function(){
        error_process('証明書発行に失敗しました');
    }
    XHR_get_utxo.onabort = function(){
        error_process('証明書発行に失敗しました');
    }
    XHR_get_utxo.ontimeout = function(){
        error_process('証明書発行に失敗しました');
    }
    return;
}

window.gen_digest = gen_digest;
window.gen_address_qr = gen_address_qr;
window.issue = issue;