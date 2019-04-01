const bitcoin = require('bitcoinjs-lib');

exports.gen_message_digest = function(arg_completion){
    console.log("gen_message_digest");
    let completion = arg_completion || "";
    
    return bitcoin.crypto.sha256(Buffer.from(completion)).toString('hex');
}