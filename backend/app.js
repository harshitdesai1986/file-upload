var express = require('express');
var resumable = require('./resumable-node.js')(__dirname + "/uploads");
var fs = require("fs"); 
var app = express();
var multipart = require('connect-multiparty');
var crypto = require('crypto');
var cors = require('cors');
const uuidv1 = require('uuid/v1');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

app.use(multipart());

const corsOptions = {
  origin: 'http://localhost:4200',
  methods: 'GET,OPTIONS,POST',
  allowedHeaders: 'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept',
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.get('/uuid', function(req, res) {
  res.send({uid: uuidv1()});
});

// retrieve file id. invoke with /fileid?filename=my-file.jpg
app.get('/fileid', function(req, res){
  if(!req.query.filename){
    return res.status(500).end('query parameter missing');
  }
  // create md5 hash from filename
  res.end(
    crypto.createHash('md5')
    .update(req.query.filename)
    .digest('hex')
  );
});

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){
    resumable.post(req, function(status, filename, original_filename, identifier){
        console.log('POST', status, original_filename, identifier);
        if (status === 'done') {
          var stream = fs.createWriteStream('./uploads/assembled/' + filename);
    
          //stich the chunks
          resumable.write(identifier, stream);
          stream.on('data', function(data){});
          stream.on('end', function(){});
          stream.on('finish', function() {
            console.log("File Assembled");
            //delete chunks
            resumable.clean(identifier);
          });
        }
        res.send(status);
    });
});

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send((status == 'found' ? 200 : 404), status);
    });
});

app.get('/download/:identifier', function(req, res){
	resumable.write(req.params.identifier, res);
});
app.get('/resumable.js', function (req, res) {
  var fs = require('fs');
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("../3rdparty/resumablejs/resumable.js").pipe(res);
});

app.listen(3000);
