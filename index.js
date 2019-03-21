const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const qs = require('querystring');
const certificate = require('./certificate');

const issue_template = fs.readFileSync(__dirname + '/issue.html', 'utf-8');
const verify_tmplate = fs.readFileSync(__dirname + '/verify.html', 'utf-8');

const server = http.createServer(
    function (req, res){
        switch(req.url){
            case '/issue':
                var data = ejs.render(issue_template);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
                if(req.method === 'POST'){
                    req.on("readable", function(){
                        req.data += req.read();
                    })
                    req.on("end", function(){
                        let input_data = qs.parse(req.data);
                        //console.log(input_data);
                        // console.log("certificate: " + input_data.certificate);
                        // console.log("privatekey1: " + input_data.privatekey1);
                        // console.log("privatekey2: " + input_data.privatekey2);
                        if(input_data.gen_address != undefined){
                            console.log("gen address");
                            console.log(certificate.gen_address(Array(input_data.privatekey1, input_data.privatekey2)));
                        }
                        if(input_data.issue_certificate != undefined){
                            console.log("issue certificate");
                            console.log(certificate.gen_tx(Array(input_data.privatekey1, input_data.privatekey2), input_data.certificate));
                        }
                    })
                }
                break;
            case '/verify':
                var data = ejs.render(verify_tmplate);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
                break;
            default:
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('not found');
                res.end();
                break;
        }
    }
).listen(3000);
console.log('Server running at http://localhost:3000/');