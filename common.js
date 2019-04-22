const bitcoin = require('bitcoinjs-lib');
const rp = require('request-promise');
const rpc_settings = require('./rpc_settings');

exports.error_process = function(message){
    alert(message);
}

exports.gen_digest = function(file_buffer_array){
    return document.getElementById('digest').textContent = bitcoin.crypto.sha256(Buffer.from(file_buffer_array)).toString('hex');
}

exports.btc_cli_command = async function(method, ...params){
    // console.log(params);
    // console.log(...params);
    let ret = await dispatch(rpc_settings.rpcip, rpc_settings.rpcport, rpc_settings.username, rpc_settings.rpcpassword, method, ...params).catch((err) => console.log(err));
    if(ret.result != null){
        console.log('result');
        console.log(ret.result);
    }
    if(ret.error != null){
        console.log('error');
        console.log(ret.error);
    }
    return ret;
}

const dispatch = async (host, rpcport, user, pass, method, ...params) => {
    // console.log(params);
    // console.log(...params);
    return {result, error} = JSON.parse(
        await rp(`http://${host}:${rpcport}`, {
            method: 'POST',
            body: JSON.stringify({method, params}),
            auth: {user, pass}
        }).catch(e => {
            if(e.statusCode){
                return JSON.stringify({error: JSON.parse(e.error).error})
            }
            else{
                return JSON.stringify({error: e.error})
            }
        })
    )
}