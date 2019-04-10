const bitcoin = require('bitcoinjs-lib');
const request = require('sync-request');
const setting = require('./settings');

const network = setting.network;

exports.get_utxo = function(arg_address){
    let address = arg_address || 'tb1qt0arta2hdeh34hfjksza3u3fvxwksrl9mt5ny5';

    let ret_utxo;
    
    if(setting.api == setting.API.CHAIN_SO){
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

exports.broadcast = function(rawtx){

    let body;
    let ret = false;
    if(setting.api == setting.API.CHAIN_SO){
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