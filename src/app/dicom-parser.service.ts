import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import * as _ from 'lodash';

import { FileReaderPoolService } from './file-reader-pool.service';
import { FileUploadDataService } from './file-upload-data.service';

import * as dicomParser from '../../3rdparty/dicom-parser/dist/dicomParser.js';
import * as dicomCharSet from '../../3rdparty/dicom-character-set/dicom-character-set.js';

// 5GB Upload Limit
const UPLOAD_LIMIT: Number = 5368709120;
const DICOMDIR = 'DICOMDIR';
const dicomAttributesURL = '/assets/dicomAttributes.json';


@Injectable({
  providedIn: 'root'
})
export class DicomParserService {

  private subject = new Subject<any>();
  private validTransferSyntaxUid: any;
  private validSopClassUid: any;

  constructor(private fileReaderPoolService: FileReaderPoolService, private http: HttpClient, private fileUploadDataService: FileUploadDataService) { }

  /**
   * Makes a GET call to read dicom attributes JSON file and returns response
   * @returns dicomAttributes from JSON file
   */
  getDicomAttributes() {
    return this.http.get(dicomAttributesURL);
  }

  /**
   * Validates the total size of all the browsed files and returns false on exeeding the defined limit
   * @param files Total number of files to be uploaded
   * @returns True on exeeding set upload size limit else False
   */
  isUploadSizeGreaterThanTheLimit(files) {
    let totalUploadSize: Number = 0;
    files.forEach(file => {
      totalUploadSize += file.size;
    });

    if (totalUploadSize > UPLOAD_LIMIT) {
      return true;
    }
    return false;
  }

  /**
   * Extracts patient details from dicom file
   * @param dataSet Parsed data of Dicom/DCM file
   * @returns Patient metadata
   */
  private getPatientDetails(dataSet) {
    let charSet = dataSet.string('x00080005');
    let nameString = dataSet.string('x00100010');
    if (charSet) {
      let nameElement = dataSet.elements['x00100010'];
      nameString = dicomCharSet.convertBytes(charSet, dataSet.byteArray.subarray(nameElement.dataOffset, nameElement.dataOffset + nameElement.length), { vr: nameElement.vr });
    }
    return {
      name: nameString ? nameString.replace(/\^/g, ' ').trim() : null,
      fhirName: nameString ? nameString : null,
      id: dataSet.string('x00100020') ? dataSet.string('x00100020') : null,
      gender: dataSet.string('x00100040') ? dataSet.string('x00100040') : null,
      age: dataSet.string('x00101010') ? dataSet.string('x00101010') : null,
      dob: dataSet.string('x00100030') ? dataSet.string('x00100030') : null,
      classUid: dataSet.string('x00080016') ? dataSet.string('x00080016') : null,
      instanceUid: dataSet.string('x00080018') ? dataSet.string('x00080018') : null,
      collapsed: true,
      isSelected: false,
      selectAll: false
    };
  }

  /**
   * Extract study details from dicom file
   * @param dataSet Parsed data of Dicom/DCM file
   * @returns Study metadata
   */
  private getStudyDetails(dataSet) {
    return {
      id: dataSet.string('x00200010') ? dataSet.string('x00200010') : null,
      description: dataSet.string('x00081030') ? dataSet.string('x00081030') : null,
      studyDate: dataSet.string('x00080020') ? dataSet.string('x00080020') : null,
      studyTime: dataSet.string('x00080030') ? dataSet.string('x00080030') : null,
      modality: dataSet.string('x00080060') ? [dataSet.string('x00080060')] : null,
      accessionNumber: dataSet.string('x00080050') ? dataSet.string('x00080050') : null,
      studyInstanceUid: dataSet.string('x0020000d') ? dataSet.string('x0020000d') : null,
      seriesInstanceUid: dataSet.string('x0020000e') ? dataSet.string('x0020000e') : null,
      seriesIds: dataSet.string('x0020000e') ? [dataSet.string('x0020000e')] : null,
      isSelected: false
    };
  }

  /**
   * Extracts image details from dicom file
   * @param dataSet Parsed data of Dicom/DCM file
   * @returns Image metadata
   */
  private getImageDetails(dataSet) {
    return {
        sopInstanceUid: dataSet.string('x00080018') ? dataSet.string('x00080018') : ''
    };
  }

  /**
   * Sets valid SOP Class UID
   * @param sopClassUid SOP Class UID from Dicom Attributes list
   */
  private setValidSopClassUid = function (sopClassUid) {
    this.validSopClassUid = sopClassUid;
  }

  /**
   * Sets valid Transfer Syntax UID
   * @param transferSyntaxUid Transfer Syntax UID from Dicom Attributes list
   */
  private setValidTransferSyntaxUid = function (transferSyntaxUid) {
    this.validTransferSyntaxUid = transferSyntaxUid;
  }

  /**
   * Reads data set  from file byte array
   * @param metaHeaderDataSet Parsed data set of a dicom file
   * @param byteArray byte Array of a dicom file
   * @returns Transfer syntax uid
   */
  private readTransferSyntax(metaHeaderDataSet, byteArray) {
    if (metaHeaderDataSet.elements.x00020010 === undefined) {
        return false;
    }
    let transferSyntaxElement = metaHeaderDataSet.elements.x00020010;
    let transferSyntaxUid = dicomParser.readFixedString(byteArray, transferSyntaxElement.dataOffset, transferSyntaxElement.length);
    return transferSyntaxUid;
  }

  /**
   * Checks mandatory dicom tag
   * @param patient Patient data of the parsed dicom file
   * @param study Study data of the parsed dicom file
   * @returns false, if any of mandatory dicom tag is missing
   */
  private checkDicomMandatoryFields(patient, study) {
    var isValid = true;
    if (!patient.classUid || !_.has(this.validSopClassUid, patient.classUid)) {
        isValid = false;
    } if (!patient.instanceUid) {
        isValid = false;
    } if (!study.modality || !study.modality.length) {
        isValid = false;
    } if (!study.studyInstanceUid) {
        isValid = false;
    } if (!study.seriesInstanceUid) {
        isValid = false;
    } if (!study.transferSyntaxUid) {
        isValid = false;
    }
    return isValid;
  }

  /**
   * Iterates through each attribue and prepares an object
   * @param original Original object passed to the function
   * @param attrs List of attributes passed to the function
   * @returns Reformed Object
   */
  private copyObject(original, attrs) {
    var obj = {};
    attrs.forEach(function (attr) {
        obj[attr] = original[attr];
    });
    return obj;
  }

  /**
   * Returns the reformed patient data
   * @param patient A patient data
   */
  private copyPatient(patient) {
    return this.copyObject(patient, [
        'name',
        'fhirName',
        'id',
        'gender',
        'age',
        'dob',
        'classUid',
        'instanceUid',
        'collapsed',
        'isSelected',
        'selectAll'
    ]);
  }

  /**
   * Extracts patient details from dicom file
   */
  private getUniquePatientDetails = function (patient) {
    return (patient ? patient.name + patient.gender + patient.dob + '' : '').toLowerCase();
  }

  /**
   * Adds the patient details to patient list
   * @param patientList List of patients containing patients retrieved from Dicom files
   * @param patient Patient retrieved from current Dicom file
   */
  private getPatientFromPatientList(patientList, patient) {
    patient = this.copyPatient(patient);

    let mergeId = this.getUniquePatientDetails(patient);

    if (patient.dob) {
        patient.dob = this.fileUploadDataService.convertDateToUTC(patient.dob);
    }

    //patient.fhirName = getFhirName(patient.fhirName);

    if (!patientList[mergeId]) {
        patient.studyList = [];
        patientList[mergeId] = patient;
    }

    return patientList[mergeId];
  }

  /**
   * Returns the reformed study data
   * @param study A study data
   */
  private copyStudy(study) {
    return this.copyObject(study, [
        'id',
        'description',
        'studyDate',
        'studyTime',
        'modality',
        'accessionNumber',
        'studyInstanceUid',
        'seriesInstanceUid',
        'seriesIds',
        'isSelected'
    ]);
  }

  /**
   * Adds the study details to stydy list
   * @param studyList List of studies containing studies retrieved from Dicom files
   * @param study Study retrieved from current Dicom file
   */
  private getStudyFromStudyList(studyList, study) {
    study = this.copyStudy(study);

    if (study.studyDate) {
        study.studyDate = this.fileUploadDataService.convertDateToUTC(study.studyDate);
    }

    let foundStudy = studyList.filter(function (s) {
        return s.studyInstanceUid === study.studyInstanceUid;
    })[0];

    if (!foundStudy) {
        study.fileList = [];
        study.totalFilesFromDICOMDIR = 0;
        studyList.push(study);
        return study;
    }

    if (study.modality && study.modality.length) {
      foundStudy.modality = (foundStudy.modality || [])
        .concat(study.modality).filter(function (v, i, a) { return i === a.indexOf(v); });
    }

    if (study.seriesIds && study.seriesIds.length) {
      foundStudy.seriesIds = (foundStudy.seriesIds || [])
        .concat(study.seriesIds).filter(function (v, i, a) { return i === a.indexOf(v); });
    }

    return foundStudy;
  }

  /**
   * Adds the file to file list
   * @param fileList List of file belongs to the same study
   * @param file A dicom file
   */
  private addFileToFileList(fileList, file) {
    let foundFile = fileList.filter(function (f) {
        return f.sopInstanceUid === file.sopInstanceUid;
    })[0];

    if (!foundFile) {
        fileList.push(file);
    }
  }

  /**
   * Merge the parsed file data into the final response
   *
   * @param response Response of the parsing process to receive the parsed data
   * @param patient Patient data of the parsed dicom file
   * @param study Study data of the parsed dicom file
   * @param file Dicom File
   *
   * @returns The final patient list
   */
  private mergePatient(response, patient, study, file) {
    let patientList = response && response.patientList || {};

    patient = this.getPatientFromPatientList(patientList, patient);
    study = this.getStudyFromStudyList(patient.studyList, study);
    this.addFileToFileList(study.fileList, file);

    return patientList;
  }

  /**
   * Extracts DICOMDIR files
   * @param files Total number of files to be uploaded
   * @returns An array of extracted DICOMDIR files
   */
  private extractDICOMDIRFiles(files) {
    let dicomdirFiles = [];

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      if (file.name === DICOMDIR) {
        dicomdirFiles.push(file);
        files.splice(i--, 1);
      }
    }

    return dicomdirFiles;
  }

  /**
   * Parses the DICOMDIR file to retrieve patient(s), study(s) and image(s) details
   * @param dicomdirFile A dicomdir file
   */
  private loadAndParseDICOMDIRFile(dicomdirFile) {
    this.fileReaderPoolService.readFile(dicomdirFile).subscribe(response => {
      console.log(response);
      this.subject.next(response);
      //TODO: Write code for DICOMDIR parsing
    });
    return this.subject.asObservable();
  }

  /**
   * Parses the dicom file to retrieve patient(s), study(s) and image(s) details
   * @param file A dicom file
   * @param finalResponse A final response containing patient(s) and study(s) details
   */
  private loadAndParseDICOMFile(file, finalResponse, subject) {
    this.fileReaderPoolService.readFile(file)
      .subscribe(fileByteArray => {
        let patient: any = {};
        let study: any = {};
        let image: any = {};
        let dataSet: any = {};

        try {
          dataSet = dicomParser.parseDicom(fileByteArray, { untilTag: 'x00200011' });
          patient = this.getPatientDetails(dataSet);
          study = this.getStudyDetails(dataSet);
          image = this.getImageDetails(dataSet);

          file.studyInstanceUid = study.studyInstanceUid;
          file.seriesInstanceUid = study.seriesInstanceUid;
          file.sopInstanceUid = image.sopInstanceUid;

          //Read and validate transfer syntax uid
          let currTransferSyntaxUid = this.readTransferSyntax(dataSet, fileByteArray);
          study.transferSyntaxUid = _.has(this.validTransferSyntaxUid, currTransferSyntaxUid) ? currTransferSyntaxUid : null;

          if (this.checkDicomMandatoryFields(patient, study)) {
            this.mergePatient(finalResponse, patient, study, file);
          } else {
            finalResponse.notSupportedFiles.push({ file: file, reason: 'error-parsing-dicom-file' });
          }
        } catch (error) {
          finalResponse.notSupportedFiles.push({ file: file, reason: 'error-parsing-dicom-file' });
        }
        finalResponse.parsedFileCount++;
        if(finalResponse.parsedFileCount === finalResponse.totalCount) {
          subject.next(finalResponse);
          subject.complete();
        }
        
      });
      
    return subject.asObservable();
  }

  /**
   * Parses all the browsed files and returns list of patients and studies belongs to individual patient
   * @param files All browsed files
   * @param dicomAttributes All dicom attributes retrieved from a local JSON file
   */
  getPatientList(files, dicomAttributes) : Observable<any>{
    let subject = new Subject<any>();
    let dicomdirFiles = this.extractDICOMDIRFiles(files);
    let self = this;
    let finalResponse = {
      totalCount: files.length,
      parsedFileCount: 0,
      notSupportedFiles: [],
      patientList: {}
    };

    this.setValidSopClassUid(dicomAttributes.sopClassUid);
    this.setValidTransferSyntaxUid(dicomAttributes.transferSyntaxUid);

    forkJoin(files.map(function (file) {
      return self.loadAndParseDICOMFile(file, finalResponse, subject);
    })).subscribe(() => {
      if(finalResponse.notSupportedFiles.length === finalResponse.totalCount) {
        subject.error('All the file(s) are unsupported!');
      }
      subject.next(finalResponse);
    });

    return subject.asObservable();
     
  }

}
