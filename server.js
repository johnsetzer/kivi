var express = require('express');
var path = require('path');
var consolidate = require('consolidate');
var path = require('path');
var fs = require('fs');
var app = express();
app.engine('handlebars', consolidate.handlebars);
app.set('views', __dirname);
app.use(express.bodyParser());

var PORT = 3001;

var kiviSrcFull = fs.readFileSync('kivi.js', 'utf-8');
var kiviSrcMin = fs.readFileSync('kivi.min.js', 'utf-8');

app.get('/example.html', function(req, res){

  var kiviSrc = req.query.src === 'full' ? kiviSrcFull : kiviSrcMin;

  var templateData = {
    kivi: kiviSrc
  , port: PORT
  }

  app.render('example.html.handlebars', templateData, function(err, html){
    if (err) {
      console.log(err);
      res.send(500, { error: err });
    } else {
      res.set('Content-Type', 'text/html');
      res.set('Cache-Control', 'no-cache');
      res.send(html);
    }
  });
});

// Just returns 200 for the example
app.post('/postUrl', function(req, res){
  console.log(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end();
});

function serveDir(dir){
  app.get(dir + ':file', function(req, res){
    var file = req.params.file;
    var filePath = path.normalize(__dirname + dir + file);
    console.log('Sending file: '+ filePath);
    res.sendfile(filePath);
  });  
}

serveDir('/');
serveDir('/dependencies/jasmine/');
serveDir('/dependencies/js/');
serveDir('/tests/');

app.listen(PORT);

console.log('URL:');
console.log('http://localhost:' + PORT + '/example.html');