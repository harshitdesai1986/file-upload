const fs = require('fs');
const dicom = require('dicom-parser');
const pool = require('./node-pgsql').pool;
const request = require('request');

const { workerData } = require('worker_threads');

const orthancPath = 'http://localhost:8042/instances/';

// Removes the folder along with all the files inside it
var removeDir = (source, dirName) => {
    let path = source + "/" + dirName;
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            let curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {  // recurse
                removeDir(curPath);
            } else {  // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

// Update database and delete files from directory
var updateDBTransactionAndRemoveFiles = (source, uid, status) => {
    console.log(" Inside DB update method ", status);
    if (status === 'SUCCESS') {
        pool.query('UPDATE transactions SET updatedby = $1, enddate = $2, updatedon = $2, status = $3 WHERE uid = $4', ['GUEST', new Date().getTime(), "Success", uid], (error, result) => {
            if (error) throw error;
            console.log("DB Transaction updated with success status");
        });
    } else {
        pool.query('UPDATE transactions SET updatedby = $1, enddate = $2, updatedon = $2, status = $3, error = $4 WHERE uid = $5', ['GUEST', new Date().getTime(), "Failed", "Error occuered at upstream!", uid], (error, result) => {
            if (error) throw error;
            console.log("DB Transaction updated with failure status");
        });
    }
    removeDir(source, uid); // Remove all dicom files from directory 
};


// Upload dicom files into ORTHANC SERVER
var pushToOrthanc = (files, uid, source) => {
    let successCount = 0;
    let path = source + '/' + uid + '/';
    files.forEach(file => {
        let options = {
            uri: orthancPath, // Endpoint for orthanc server
            method: 'POST', // HTTP method POST
            body: fs.createReadStream(path + file)
                //body: (path + file)
        };

        //console.log(" Options  ", JSON.stringify(options));
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) { // Response from ORTHANC server
                successCount++;
                console.log("Uploaded successfully ", file);
                if (successCount === files.length) {
                    console.log(" All Uploaded of " + path);
                    updateDBTransactionAndRemoveFiles(source, uid, 'SUCCESS'); // Update DB for successfully upload files in ORTHANC server
                }
            } else {

                console.log(" On Upload failure ", error);
                updateDBTransactionAndRemoveFiles(source, uid, 'FAILED');

                //console.log(" Response  " + JSON.stringify(response));


            }
        });

    });
}

var initUpload = (source, uid) => {
    console.log('Inside initUpload on worker thread');
    let dirPath = source + "/" + uid; // Create complete directory path till uid
    let files = fs.readdirSync(dirPath); // Get all files from directory
    let validFiles = [];
    files.forEach(file => {
        let filename = dirPath + "/" + file; // Create complete path till each individual dicom file in directory 
        try {
            let dicomFileAsBuffer = fs.readFileSync(filename); // Get dicomFileAsBuffer to parse each dicom file in directory
            console.log(" File read " + file);
            let dataSet = dicom.parseDicom(dicomFileAsBuffer, { untilTag: 'x00200011' }); // Parse dicom file and get dataSet of dicom file
            //console.log("DataSet Information :" + dataSet);
            let studyInstanceUid = dataSet.string('x0020000d'); // Get studyInstanceUid of dicom file
            console.log("Study Information :" + studyInstanceUid);
            if (studyInstanceUid) {
                validFiles.push(file); // Push all valid dicom files into validFiles array
            }
            //console.log(" Total valid files " + validFiles);
        } catch (ex) {
            console.log('Error parsing byte stream', ex);
        }
    });

    if (files.length === validFiles.length) { // Check for both total parse dicom files and direcorty dicom files are equal or not 
        console.log("Valid Count matched");
        pushToOrthanc(validFiles, uid, source); // Send all valid dicom files into orthanc server
    } else {
        console.log("Valid Count didn't match");
        updateDBTransactionAndRemoveFiles(source, uid, 'FAILED');
    }
}

console.log("Worker Data >>> ", workerData.source, workerData.uid);

initUpload(workerData.source, workerData.uid);