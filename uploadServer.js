#!/usr/bin/env node

var http = require('http');
var multiparty = require('multiparty');
var sys = require('sys');
var fs = require('fs');
var path = require('path');

var localIP = '192.168.115.40:9999';

var server = http.createServer(function(req, res) {
    console.log(JSON.stringify(req.url));
    switch (req.url) {
    case '/':
        display_form(req, res);
        break;
    case '/upload':
        upload_file(req, res);
        break;
    default:
        if (/^\/files\/.+/.test(req.url)) {
            console.log('file access');
            var fileName = path.basename(req.url);
            var filePath = path.join('./files/', fileName);
            var fileExt = path.extname(fileName);
            var fileMime = 'image/jpeg';
            if (fileExt == 'png') {
                fileMime = 'image/png';
            }
            try {
                fs.accessSync(filePath);
            }
            catch(err) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write('cannot find '+req.url);
                res.end();
                break;
            }

            fs.readFile(filePath, "binary", function(err, file){
                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.write('error loading '+req.url+': '+err);
                    res.end();
                    return;
                }

                res.writeHead(200, {'Content-Type': fileMime});
                res.write(file, 'binary');
                res.end();
            });
        }
    }
});
server.listen(9999);

function display_form(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(
        '<form action="/upload" method="post" enctype="multipart/form-data">'+
            '<input type="file" name="upload-file">'+
            '<input type="submit" value="Upload">'+
            '</form>'
    );
    res.end();
}

function upload_file(req, res) {
    var requestHost = req.host ? req.host : localIP;
    var form = new multiparty.Form();
    var fileName = undefined;

    form.parse(req, function(err, fields, files){
        if (err) {
            console.log ("Error > " + JSON.stringify(err));
            return;
        }

        if (fields) {
            console.log('received options > ' + JSON.stringify(fields));
        }

        if (files) {
            Object.keys(files).forEach(function(name){
                var file = files[name][0];

                fileName = path.basename(file.path);
                console.log('received file > '+fileName);
                var uploadFilePath = './files/'+fileName;
                fs.renameSync(file.path, uploadFilePath);
            });
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({
            ret: true,
            data: 'http://'+ requestHost +'/files/'+fileName
        }));
        res.end();
    });
}
function show_404(req, res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('You r doing it rong!');
    res.end();
}