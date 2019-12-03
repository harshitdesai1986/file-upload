var express = require('express');
var resumable = require('./resumable-node.js')(__dirname + "/uploads");
var fs = require("fs"); 
var app = express();
var multipart = require('connect-multiparty');
var crypto = require('crypto');
var cors = require('cors');
const uuidv1 = require('uuid/v1');
const pool = require('./postgres').pool;
var bodyParser = require('body-parser');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

app.use(multipart());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: 'http://10.30.124.98:4200',
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
        let dirName = req.body['uploadTransactionUid'];
        let dirPath = './uploads/assembled/' + dirName;
        if (!fs.existsSync(dirPath)){
          fs.mkdirSync(dirPath);
        }
        if (status === 'done') {
          var stream = fs.createWriteStream(dirPath + '/' + filename);
    
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

app.post('/insertTransaction', function(req, res){
  const { uid, message, startdate } = req.body;
  
  pool.query('INSERT INTO transactions (updatedby, uid, message, startdate, status) VALUES ($1, $2, $3, $4, $5)', ["GUEST", uid, message, startdate, "Pending"], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(results);
  })
});

app.get('/getTransactions', function(req, res){
  pool.query('SELECT * FROM transactions ORDER BY startdate DESC', (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.post('/updateTransaction', function(req, res) {
  const { uid } = req.body;
  
  pool.query('UPDATE  transactions SET updatedby = $1, enddate = $2, updatedon = $2, status = $3, error = $4 WHERE uid = $5', ["GUEST", new Date().getTime(), "Failed", "Error occured at upstream!", uid], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(results);
  })
});

app.listen(3000);
