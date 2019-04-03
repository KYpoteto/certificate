const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const common = require('./common');
const settings = require('./settings');

const network = settings.network;

function gen_digest(file_buffer_array){
    return common.gen_digest(file_buffer_array);
}

function gen_address_qr(prvkey){
    if(prvkey == ""){
        common.error_process("秘密鍵を入力してください");
        return;
    }
    let address = gen_segwit_address(prvkey);
    document.getElementById('qr_address').src = "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chco=000000&chl=bitcoin:" + address;
    document.getElementById('qr_address').style.visibility = "visible";
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

function issue(prvkey, digest){
    if(prvkey == "" || digest == ""){
        common.error_process('秘密鍵、証明書を入力してください');
        return;
    }

    // generate address
    let address = gen_segwit_address(prvkey);
    document.getElementById('address').value = address;

    // get utxo
    let XHR_get_utxo = new XMLHttpRequest();
    XHR_get_utxo.open('POST', "./issue");
    XHR_get_utxo.send('dummy=&' + "phase=1&" + 'address=' + address);

    XHR_get_utxo.onreadystatechange = function(){
        if(XHR_get_utxo.readyState == 4 && XHR_get_utxo.status == 200){
            let result_get_utxo = JSON.parse(XHR_get_utxo.responseText);

            if(result_get_utxo.result == 'OK'){
                // generate tx
                let rawtx = gen_rawtx(prvkey, result_get_utxo.utxos, digest);

                // broadcast tx
                let XHR_broadcast = new XMLHttpRequest();
                XHR_broadcast.open('POST', "./issue")
                XHR_broadcast.send('dummy=&' + "phase=2&" + "rawtx=" + rawtx.toHex());

                XHR_broadcast.onreadystatechange = function(){
                    if(XHR_broadcast.readyState == 4 && XHR_broadcast.status == 200){
                        let result_broadcast = JSON.parse(XHR_broadcast.responseText);
                        if(result_broadcast.result == 'OK'){
                            document.getElementById('txid').innerText = rawtx.getId();
                        }
                        else{
                            common.error_process('証明書発行に失敗しました');
                        }
                    }
                }
                XHR_broadcast.onerror = function(){
                    common.error_process('証明書発行に失敗しました');
                }
                XHR_broadcast.onabort = function(){
                    common.error_process('証明書発行に失敗しました');
                }
                XHR_broadcast.ontimeout = function(){
                    common.error_process('証明書発行に失敗しました');
                }
            }
            else{
                common.error_process('証明書発行に失敗しました');
            }
        }
    }

    XHR_get_utxo.onerror = function(){
        common.error_process('証明書発行に失敗しました');
    }
    XHR_get_utxo.onabort = function(){
        common.error_process('証明書発行に失敗しました');
    }
    XHR_get_utxo.ontimeout = function(){
        common.error_process('証明書発行に失敗しました');
    }
    return;
}

window.gen_digest = gen_digest;
window.gen_address_qr = gen_address_qr;
window.issue = issue;