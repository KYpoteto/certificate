const bitcoin = require('bitcoinjs-lib');
const https = require('https');
const request = require('sync-request');
const setting = require('./settings');

const network = setting.network;

exports.get_utxo = function(arg_address){
    let address = arg_address || 'tb1qt0arta2hdeh34hfjksza3u3fvxwksrl9mt5ny5';

    let ret_utxo;

    if(setting.api == setting.API.CAHIN_SO){
        // chain.so
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const url = 'https://chain.so/api/v2/get_tx_unspent/' + target_network + '/' + address;
        let responce = request('GET', url);

        if(responce.statusCode == 200){
            let body = JSON.parse(responce.body);
            console.log(body.data.txs);
            ret_utxo = new Array();
            for(let i = 0; i < body.data.txs.length; i++){
                ret_utxo[i] = {
                    txid: body.data.txs[i].txid,
                    output_idx: body.data.txs[i].output_no,
                    value_satoshi: Number(body.data.txs[i].value.replace('.', ''))
                };
            }
        }
        else{
            ret_utxo = null;
            console.log('error: ' + responce.statusCode);
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
        const url = 'https://api.blockcypher.com/v1/btc/' + target_network + '/addrs/' + address;
        let responce = request('GET', url, {flags: {'unspentOnly': 'true'}});

        if(responce.statusCode == 200){
            let body = JSON.parse(responce.body);
            console.log(body.txrefs);
            ret_utxo = new Array();
            let i = 0;
            for(let utxo of body.txrefs){
                if(utxo.spent != undefined && utxo.spent != true){
                    ret_utxo[i++] = {
                        txid: utxo.tx_hash,
                        output_idx: utxo.tx_output_n,
                        value_satoshi: utxo.value
                    }
                }
            }
        }
        else{
            ret_utxo = null;
            console.log('error: ' + responce.statusCode);
            //{"error": "Address tb1qt0arta2hdeh34hfjksza3u3fvxwksrl9mt5ny5 is invalid: Address tb1qt0arta2hdeh34hfjksza3u3fvxwksrl9mt5ny5 is of unknown size."}
        }
    }
    return ret_utxo;
}

exports.broadcast = function(arg_rawtx){
    let rawtx = arg_rawtx || '020000000001010ef1e369a436498b2c5a90ce90022992b364cd788f5000009270e494cbfff7d80100000000ffffffff020000000000000000226a20e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8554c1d0000000000001600145bfa35f5576e6f1add32b405d8f229619d680fe502483045022100a60bef85dfaf154eb2551958909080b96c7c703606a2fe8acd1fddc3801736ec0220240dccd6b099a041558378665748382fe5680f4b811c3a035b0ff0e31b886559012103a0480a92b4028c2d8d6e2c89c463bcd0ba0db64a1099ba9d970a7cfd24bf2bab00000000';

    let body;
    let ret;
    if(setting.api == setting.API.CAHIN_SO){
        // chain.so
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const uri = 'https://chain.so/api/v2/send_tx/' + target_network;
        let responce = request('POST', uri, {json: {tx_hex: rawtx}});
        if(responce.statusCode == 200){
            body = JSON.parse(responce.getBody('utf-8'));
            console.log(body);
            ret = true;
        }
        else{
            console.log('error: '+ responce.statusCode);
            ret = false;
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
        const uri = 'https://api.blockcypher.com/v1/btc/' + target_network + '/txs/push'
        let responce = request('POST', uri, {json: {tx: rawtx}})
        if(responce.statusCode == 200){
            body = JSON.parse(responce.getBody('utf-8'));
            ret = true;
        }
        else{
            console.log('error: '+ responce.statusCode);
            ret = false;
        }
    }

    console.log(body);
    return ret;
}