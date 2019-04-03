const bitcoin = require('bitcoinjs-lib');

exports.error_process = function(message){
    alert(message);
}

exports.gen_digest = function(file_buffer_array){
    return document.getElementById('digest').textContent = bitcoin.crypto.sha256(Buffer.from(file_buffer_array)).toString('hex');
}
