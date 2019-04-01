const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const qs = require('querystring');
const verification = require('./verification-server');
const verification_client = require('./verification-client');
const issue = require('./issue-server');
const issue_client = require('./issue-client');

const issue_template = fs.readFileSync(__dirname + '/issue.ejs', 'utf-8');
const verify_tmplate = fs.readFileSync(__dirname + '/verify.ejs', 'utf-8');
const test_template = fs.readFileSync(__dirname + '/test.ejs', 'utf-8');

const server = http.createServer(
    function (req, res){
        let url = req.url;
        let url_array = url.split('.');
        let ext = url_array[url_array.length - 1];
        let path = '.' + url;
        console.log(ext);
        if(ext == 'js'){
            fs.readFile(path, function(err, data){
                res.writeHead(200, {"Content-Type": "text/javascript"});
                res.end(data, 'utf-8');
            })
        }
         else{
            console.log('not js');
            switch(req.url){
                case '/issue':
                    if(req.method === 'POST'){
                        req.on("readable", function(){
                            req.data += req.read() || '';
                        })
                        req.on("end", function(){
                            let input_data = qs.parse(req.data);
                            if(input_data.gen_address != undefined){
                                console.log("gen address");
                                let address = issue_client.gen_segwit_address(input_data.privatekey1);
                                //console.log("address: " + address.address);
                                var data = ejs.render(issue_template, {
                                    visibility: "visible",
                                    address: address,
                                    txid: ""});
                                res.writeHead(200, {'Content-Type': 'text/html'});
                                res.write(data);
                                res.end();
                            }
                            else if(input_data.issue_certificate != undefined){
                                console.log("issue certificate");
                                // client generates address
                                let address = issue_client.gen_segwit_address(input_data.privatekey1);
                                // server gets utxt
                                let utxo = issue.get_utxo(address);
                                console.log(utxo);
                                // client generates tx
                                let rawtx = issue_client.issue(input_data.privatekey1, utxo, verification_client.gen_message_digest(input_data.certificate));
                                // server broadcast
                                let result = issue.broadcast(rawtx.toHex());
                                let txid;
                                if(result == true){
                                    txid = rawtx.getId();
                                }
                                else{
                                    txid = 'issue failed';
                                }
                                //console.log("txid: " + tx.getId());
                                var data = ejs.render(issue_template, {
                                    visibility: "visible",
                                    address: address.address,
                                    txid: txid});
                                res.writeHead(200, {'Content-Type': 'text/html'});
                                res.write(data);
                                res.end();
                            }
                        })
                    }
                    else{
                        var data = ejs.render(issue_template, {
                            visibility: "hidden",
                            address: "",
                            txid: ""});
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write(data);
                        res.end();
                    }
                    break;
                case '/verify':
                    if(req.method === 'POST'){
                        req.on("readable", function(){
                            req.data += req.read() || '';
                        })
                        req.on("end", function(){
                            let input_data = qs.parse(req.data);
                            console.log(input_data);
                            //certificate.verify();
                            let result = verification.verify(input_data.txid, input_data.certificate, input_data.publickey);

                            var data = ejs.render(verify_tmplate, {
                                txid: input_data.txid,
                                pubkey: input_data.publickey,
                                certificate: input_data.certificate,
                                result: result});
                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.write(data);
                            res.end();
                        })
                    }
                    else{
                        var data = ejs.render(verify_tmplate, {
                            txid: "",
                            pubkey: "",
                            certificate: "",
                            result: ""});
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write(data);
                        res.end();
                    }
                    break;
                case '/test':
                    console.log('switch test')
                    if(req.method === 'POST'){
                        req.on("readable", function(){
                            req.data += req.read() || '';
                        })
                        req.on("end", function(){
                            var data = ejs.render(test_template);
                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.write(data);
                            res.end();
                        })
                    }
                    else{
                        var data = ejs.render(test_template);
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write(data);
                        res.end();
                    }
                    break;
                default:
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.write('not found');
                    res.end();
                    break;
            }
        }
    }
).listen(3000);
console.log('Server running at http://localhost:3000/');