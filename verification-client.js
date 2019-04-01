const bitcoin = require('bitcoinjs-lib');

function gen_digest(file_buffer_array){
    return document.getElementById('digest').textContent = bitcoin.crypto.sha256(Buffer.from(file_buffer_array)).toString('hex');
}
window.gen_digest = gen_digest;