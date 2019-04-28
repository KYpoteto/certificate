const bitcoin = require('bitcoinjs-lib');
const rp = require('request-promise');
const setting = require('./settings');
const common = require('./common');

const network = setting.network;

exports.get_utxo = async function(address){
    let ret_utxo = new Array();
    
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
        //let responce = request('GET', url);
        let request_op = {
            url: url,
            method: 'GET',
            json: true
        }
        let responce = await rp(url, {
            method: 'GET'
        }).catch(e =>{
            console.log('get utxo fail: ' + e);
            return null;
        })
        console.log(responce);
        responce = JSON.parse(responce);
        
        if(responce.status == "success"){
            console.log(responce.data.txs);
            for(let i = 0; i < responce.data.txs.length; i++){
                ret_utxo[i] = {
                    txid: responce.data.txs[i].txid,
                    output_idx: responce.data.txs[i].output_no,
                    value_satoshi: Number(responce.data.txs[i].value.replace('.', ''))
                };
            }
        }
        else{
            ret_utxo = null;
            console.log('get_tx_unspent returned status: ' + responce.status);
        }
    }
    else if(setting.api == setting.API.MY_NODE){
        // bitcoind
        console.log('bitcoin node');
        let responce = await common.btc_cli_command('scantxoutset', 'start', ["addr(" + address + ")"] );
        console.log('responce');
        console.log(responce);
        
        if(responce.error == null){
            for(let i = 0; i < responce.result.unspents.length; i++){
                let utxo = responce.result.unspents[i];
                console.log(utxo);
                ret_utxo[i] = {
                    txid: utxo.txid,
                    output_idx: utxo.vout,
                    value_satoshi: Number(utxo.amount.toFixed(8).replace('.', ''))
                };
                console.log(ret_utxo[i]);
            }
        }
        else{
            ret_utxo = null;
            console.log(responce.error);
        }
    }
    else{ 
        ret_utxo = null;
        console.log('not applicable API server.');
    }
    return ret_utxo;
}

exports.broadcast = async function(rawtx){

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
        //let responce = request('POST', uri, {json: {tx_hex: rawtx}});
        let request_op = {
            url: uri,
            method: 'POST',
            headers: {"content-type": "application/json"},
            json: {tx_hex: rawtx}
        }
        let responce = await rp(request_op).catch(e => {
            console.log('broadcast tx fail: ' + e);
            return false;
        })
        console.log(responce);
        if(responce.status == 'success'){
            console.log(responce);
            ret = true;
        }
        else{
            console.log('error: '+ responce.status);
            ret = false;
        }
    }
    else if(setting.api == setting.API.MY_NODE){
        // bitcoind
        console.log('bitcoin node');
        let responce = await common.btc_cli_command('sendrawtransaction', rawtx);
        console.log('responce');
        console.log(responce);
        
        if(responce.error == null){
            ret = true;
        }
        else{
            ret = false;
        }
    }
    else{ 
        ret = false;
        console.log('not applicable API server.');
    }

    console.log(body);
    return ret;
}