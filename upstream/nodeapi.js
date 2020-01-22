const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const dicom = require('dicom-parser');
const pool = require('./node-pgsql').pool;
let { Worker, workerData } = require('worker_threads');

//const source = '//10.30.125.148//assembled'; // Shared directory location
const source = path.join(__dirname, '..', 'backend', 'uploads', 'assembled');

let cors = require('cors');
const corsOptions = {
    origin: '*',
    methods: 'GET,OPTIONS,POST',
    allowedHeaders: 'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept,Access-Control-Request-Headers,content-type',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200  // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))


app.listen(3010, function () {

    console.log('Node App is ruuning on 3010 Port');

});


// Check for shared directory is present or not 
var verifyDirPresence = (uid) => {
    let dirPresent = false;
    console.log("Location   ", path.join(source, uid));
    if (fs.existsSync(path.join(source, uid))) {
        dirPresent = true;
    }
    return dirPresent;
};

// POST API for getting first request from UI

app.post('/initUpload', function (req, res) {
    var uid = req.body.uid;
    console.log(" Transaction Id from body  " + uid);

    pool.query('SELECT * FROM transactions where uid=$1', [uid], function (error) { // Check uid in body request present in DB or not
        if (error) {
            res.status(500).send('Error occured at upstream');
        }
        console.log("dir " + verifyDirPresence(uid));
        dirPresent = verifyDirPresence(uid); // Check for shared directory existent
        transactionPresent = true;
        if (dirPresent && transactionPresent) {
            console.log(" All Valid Files ");
            res.json({ success: true }); // Send response for valid request or call from UI

            const worker = new Worker('./upload.js', {
                workerData: {
                    source: source,
                    uid: uid
                }
            });

        } else {
            res.status(500).send('Error occured at upstream');
        }
    });
});