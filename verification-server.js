const bitcoin = require('bitcoinjs-lib');
const rp = require('request-promise');
const setting = require('./settings');

const network = setting.network;

exports.get_tx_outputs_sync = async function(txid){
    console.log('fn get_tx_output');

    let ret_tx_outputs = null;
    let ret_address = null;

    if(setting.api == setting.API.CHAIN_SO){
        // chain.so
        //console.log('chain.so');
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const url = 'https://chain.so/api/v2/get_tx/' + target_network + '/' + txid;
        let request_op = {
            url: url,
            method: 'GET',
            json: true
        }
        let responce = await rp(request_op);
        console.log(responce);

        if(responce.status == 'success'){
            console.log(responce.data.inputs[0]);
            let i = 0;
            ret_tx_outputs = new Array();
            for(let output of responce.data.outputs){
                if(output.type == 'nulldata'){
                    ret_tx_outputs[i++] = {
                        script: output.script
                    }
                }
            }
            ret_address = responce.data.inputs[0].address;
        }
        else{
            throw new Error("error: " + responce.status);
        }
    }
    else{
        throw new Error('not applicable API server.');
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

exports.verify_key = function(address, input_address){

    if(address == input_address){
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

exports.verify = async function(txid, digest, address){

    if(txid == '' || digest == '' || address == ''){
        console.log('invalid arg');
        console.log('txid: ' + txid);
        console.log('digest: ' + digest);
        console.log('address: '+ address);
        return {result:false, message: 'トランザクションID、アドレス、証明書を入力してください'};
    }
    
    // get tx
    let tx;
    try{
        tx = await module.exports.get_tx_outputs_sync(txid);
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

    // check address
    if(module.exports.verify_key(tx.address, address)){
        console.log('address OK');
    }
    else{
        console.log('address NG');
        return {result:false, message:"アドレスが発行者のものと一致しません"};
    }

    // check invalidation
    /*if(module.exports.verify_invalidation(txid, invalidation_list)){
        console.log('txid OK');
    }
    else{
        console.log('txid NG');
    }*/

    return {result:true, message:"正しく検証できました"};
}