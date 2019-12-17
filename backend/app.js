let express = require('express');
let resumable = require('./resumable-node.js')(__dirname + "/uploads");
let fs = require("fs"); 
let app = express();
let multipart = require('connect-multiparty');
let crypto = require('crypto');
let cors = require('cors');
const uuidv1 = require('uuid/v1');
const pool = require('./postgres').pool;
let bodyParser = require('body-parser');

const BASE_UPLOAD_URL = './uploads/assembled/';

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

app.use(multipart());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: '*',
  methods: 'GET,OPTIONS,POST',
  allowedHeaders: 'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept',
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

// GET API to generate UUID
app.get('/uuid', (req, res) => {
  res.send({uid: uuidv1()});
});

// retrieve file id. invoke with /fileid?filename=my-file.jpg
app.get('/fileid', (req, res) => {
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
app.post('/upload', (req, res) => {
    resumable.post(req, (status, filename, original_filename, identifier) => {
        console.log('POST', status, original_filename, identifier);
        let dirName = req.body['uploadTransactionUid'];
        let dirPath = BASE_UPLOAD_URL + dirName;
        if (!fs.existsSync(dirPath)){
          fs.mkdirSync(dirPath);
        }
        if (status === 'done') {
          let stream = fs.createWriteStream(dirPath + '/' + filename);
    
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
app.get('/upload', (req, res) => {
    resumable.get(req, (status, filename, original_filename, identifier) => {
        console.log('GET', status);
        res.send((status == 'found' ? 200 : 404), status);
    });
});

app.get('/download/:identifier', (req, res) => {
	resumable.write(req.params.identifier, res);
});

app.get('/resumable.js', (req, res) => {
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("../3rdparty/resumablejs/resumable.js").pipe(res);
});

// POST API to insert upload transaction in DB
app.post('/insertTransaction', (req, res) => {
  const { uid, message, startdate } = req.body;
  
  pool.query('INSERT INTO transactions (updatedby, uid, message, startdate, status) VALUES ($1, $2, $3, $4, $5)', ["GUEST", uid, message, startdate, "Pending"], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(results);
  })
});

// GET API to retrieve all the upload transactions
app.get('/getTransactions', (req, res) => {
  pool.query('SELECT * FROM transactions ORDER BY startdate DESC', (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

// Removes the folder along with all the files inside it
var removeDir = (dirName) => {
  let path = BASE_UPLOAD_URL + dirName;
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      let curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        removeDir(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// POST API to update trsanction status to Failed in DB
app.post('/updateTransaction', (req, res) => {
  const { uid } = req.body;
  
  pool.query('UPDATE  transactions SET updatedby = $1, enddate = $2, updatedon = $2, status = $3, error = $4 WHERE uid = $5', ["GUEST", new Date().getTime(), "Failed", "Error occured at upstream!", uid], (error, results) => {
    if (error) {
      throw error;
    }
    // Removes the folder along with all the files inside it on upstream upload failure
    removeDir(uid);

    res.status(201).send(results);
  })
});

app.listen(3000);
