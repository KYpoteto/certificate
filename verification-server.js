const bitcoin = require('bitcoinjs-lib');
const https = require('https');
const request = require('sync-request');
const setting = require('./settings');

const network = setting.network;

exports.get_tx_outputs_sync = function(arg_txid){

    let txid = arg_txid || '518271f9ace04f54192ecca9665ac4489f9b373982c56b363047d0bea6f3fc55';
    let ret_tx_outputs = null;
    let ret_address = null;

    if(setting.api == setting.API.CAHIN_SO){
        // chain.so
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const url = 'https://chain.so/api/v2/get_tx/' + target_network + '/' + txid;
        let responce = request('GET', url);

        if(responce.statusCode == 200){
            let body = JSON.parse(responce.body);
            console.log(body.data.inputs[0]);
            let i = 0;
            ret_tx_outputs = new Array();
            for(let output of body.data.outputs){
                if(output.type == 'nulldata'){
                    ret_tx_outputs[i++] = {
                        script: output.script
                    }
                }
            }
            ret_address = body.data.inputs[0].address;
        }
        else{
            throw new Error("error: " + responce.statusCode);
        }
    }
    else if(setting.api == setting.API.BLOCK_CYPHER){
        // block cypher
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "main";
        }
        else{
            target_network = "test3";
        }
        const url = 'https://api.blockcypher.com/v1/btc/' + target_network + '/txs/' + txid;
        let responce = request('GET', url);

        if(responce.statusCode == 200){
            let body = JSON.parse(responce.body);
            console.log(body);
            let i = 0;
            ret_tx_outputs = new Array();
            for(let output of body.outputs){
                if(output.script_type == 'null-data'){
                    ret_tx_outputs[i++] = {
                        script: output.script
                    }
                }
            }
            for(let w of body.inputs[0].witness){
                console.log(w);
            }
            ret_address = body.inputs[0].addresses[0];
        }
        else{
            throw new Error("error: " + responce.statusCode);
        }
    }
    return {address: ret_address, outputs: ret_tx_outputs};
}

exports.verify_digest = function(tx_outputs, digest){

    console.log(tx_outputs);
    for(let output of tx_outputs){
        console.log(output);
        if(output.script.indexOf('OP_RETURN ') == 0){
            if(output.script.replace('OP_RETURN ', '') == digest){
                return true;
            }
            else{
                console.log('digest is not valid');
            }
        }
        else if(output.script.indexOf('6a38') == 0){
            if(output.script.slice(4) == digest){
                return true;
            }
            else{
                console.log('digest is not valid');
            }
        }
        else{
            console.log('this tx is not nulldata');
        }
    }
    return false;
}

exports.verify_key = function(address, pubkey){

    //chain.so
    if(address == pubkey){
        return true;
    }
    else{
        return false;
    }
}

exports.verify_invalidation = function(arg_txid, arg_invalidation_list){
    let txid = arg_txid || '56b774e94944c368c4fba0671fd555dc63fe35fead8f1ace4b774477d81a22dd';
    let invalidation_list = arg_invalidation_list || ['a', 'b', '56b774e94944c368c4fba0671fd555dc63fe35fead8f1ace4b774477d81a22dd'];

    if(invalidation_list.indexOf(txid) >= 0){
        return false;
    }
    else{
        return true;
    }
}

exports.verify = function(txid, digest, pubkey){

    if(txid == '' || digest == '' || pubkey == ''){
        console.log('invalid arg');
        console.log('txid: ' + txid);
        console.log('digest: ' + digest);
        console.log('pubkey: '+ pubkey);
        return {result:false, message: 'トランザクションID、アドレス、証明書を入力してください'};
    }
    
    // get tx
    let tx;
    try{
        tx = module.exports.get_tx_outputs_sync(txid);
    }
    catch(e){
        console.log('get tx info failed');
        return {result: false, message: '証明書の情報を取得できませんでした'};
    }

    // check digest
    if(module.exports.verify_digest(tx.outputs, digest)){
        console.log('digest OK');
    }
    else{
        console.log('digest NG');
        return {result: false, message: '証明書が正しくありません'};
    }

    // check pubkey
    if(module.exports.verify_key(tx.address, pubkey)){
        console.log('pubkey OK');
    }
    else{
        console.log('pubkey NG');
        return {result:false, message:"アドレスが発行者のものと一致しません。"};
    }

    // check invalidation
    /*if(module.exports.verify_invalidation(txid, invalidation_list)){
        console.log('txid OK');
    }
    else{
        console.log('txid NG');
    }*/

    return {result:true, message:"正しく検証できました。"};
}