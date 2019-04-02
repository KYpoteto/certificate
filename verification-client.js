const bitcoin = require('bitcoinjs-lib');

function gen_digest(file_buffer_array){
    return document.getElementById('digest').textContent = bitcoin.crypto.sha256(Buffer.from(file_buffer_array)).toString('hex');
}

function verify(){
    document.getElementById('result').textContent = "";
    return check_form();
}

function check_form(){
    if(document.getElementById('txid').value == "" ||
        document.getElementById('address').value == "" ||
        document.getElementById('digest').value == ""){
            error_process('トランザクションID、アドレス、証明書を入力してください')
            return false;
        }
    return true;
}

function error_process(message){
    alert(message);
}

window.gen_digest = gen_digest;
window.verify = verify;