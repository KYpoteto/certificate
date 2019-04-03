const common = require('./common');

function gen_digest(file_buffer_array){
    return common.gen_digest(file_buffer_array);
}

function verify(){
    document.getElementById('result').textContent = "";
    return check_form();
}

function check_form(){
    if(document.getElementById('txid').value == "" ||
        document.getElementById('address').value == "" ||
        document.getElementById('digest').value == ""){
            common.error_process('トランザクションID、アドレス、証明書を入力してください')
            return false;
        }
    return true;
}

window.gen_digest = gen_digest;
window.verify = verify;