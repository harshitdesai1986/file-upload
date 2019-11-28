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

  private parseProgressSubject = new Subject<any>();
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
    attrs.forEach(attr => {
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
   * Returns Directory Record Sequence
   * @param dataSet parsed data from dicomdir file
   * @returns Directory record sequence
   */
  private getDirectoryRecordsSequence(dataSet) {
    let element = _.find(dataSet.elements, function (element) {
        return element.tag === 'x00041220';
    });

    return element && element.items || [];
  }

  /**
   * Returns Directory Record Type
   * @param dataSet parsed data from dicomdir file
   * @returns Directory record type
   */
  private getDirectoryRecordType(dataSet) {
    let element = _.find(dataSet.elements, function (element) {
        return element.tag === 'x00041430';
    });

    if (element) {
        return dataSet.string('x00041430');
    }

    return '';
  }

  /**
   * Parses the DICOMDIR files and return the parsed data
   * @param byteArray byte array with the DICOMDIR file content
   * @returns Object having the list of patients, studies, series and images parsed
   */
  private parseDICOMDIRByteArray(byteArray) {
    let patient: any = {};
    let study: any = {};
    let series: any = {};
    let dataSet: any = {};
    let dicomdir: any = {
        patients: []
    };

    try {
        dataSet = dicomParser.parseDicom(byteArray);
    } catch (error) {
        console.error('Error parsing DICOMDIR file: ' + error);
    }

    dicomdir.fileSetId = dataSet.string('x00041130');
    dicomdir.implementationVersionName = dataSet.string('x00020013');

    let items = this.getDirectoryRecordsSequence(dataSet);

    items.forEach(item => {
        let type = this.getDirectoryRecordType(item.dataSet);

        if (type === 'PATIENT') {
            patient = this.getPatientDetails(item.dataSet);
            patient.studies = [];
            study = null;
            dicomdir.patients.push(patient);
        } else if (type === 'STUDY') {
            study = this.getStudyDetails(item.dataSet);
            study.seriesList = [];
            series = null;
            patient.studies.push(study);
        } else if (type === 'SERIES') {
            series = {
                modality: item.dataSet.string('x00080060'),
                number: item.dataSet.string('x00200011'),
                instanceUID: item.dataSet.string('x0020000e'),
                images: []
            };
            study.seriesList.push(series);
        } else if (type === 'IMAGE') {
            let image = {
                path: item.dataSet.string('x00041500'),
                number: item.dataSet.string('x00200013'),
                SOPClassUID: item.dataSet.string('x00041510'),
                sopInstanceUid: item.dataSet.string('x00041511')
            };
            series.images.push(image);
        }
    });

    return dicomdir;
  }

  /**
   * Broadcasts a dcmProgressEvent having the total count of files to be processed and the parsed file count
   * @param response Object having the response data to be broadcasted as an event
   */
  broadcastDCMProgressEvent(): Observable<any> {
    return this.parseProgressSubject.asObservable();
  }

  /**
   * Updates the progress of total number of parsed files
   * @param response parsed file(s) progress response
   */
  private updateDCMProgress(response: any) {
    let responseData = {
      totalCount: response.totalCount,
      parsedFileCount: response.parsedFileCount
    };
    this.parseProgressSubject.next(responseData);
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
   * @returns Final response having patient(s), study(s), file(s) as an observable
   */
  private loadAndParseDICOMDIRFile(dicomdirFile, files, finalResponse, subject) {
    this.fileReaderPoolService.readFile(dicomdirFile).subscribe(fileByteArray => {
      let filesList = files.slice(0);
      let filesToMerge = [];
      let dataSet: any = {};
      let self = this;

      try {
        dataSet = this.parseDICOMDIRByteArray(fileByteArray);
        dataSet.patients.forEach(patient => {
          let responsePatient = this.getPatientFromPatientList(finalResponse.patientList, patient);

          patient.studies.forEach(study => {
            let responseStudy = this.getStudyFromStudyList(responsePatient.studyList, study);

            study.seriesList.forEach(series => {
              responseStudy.totalFilesFromDICOMDIR += series.images.length;

              series.images.forEach(image => {
                let file = null;
                for (let i = 0; i < files.length && !file; i++) {
                  if (files[i].webkitRelativePath.endsWith(image.path.replace(/\\/g, '/'))) {
                    // if found file reference, remove it from the files list
                    file = files[i];
                    file.studyInstanceUid = study.studyInstanceUid;
                    file.seriesInstanceUid = study.seriesInstanceUid;
                    file.sopInstanceUid = image.sopInstanceUid;

                    study.seriesIds = study.seriesIds || [];
                    study.seriesIds.push(series.instanceUID);

                    study.modality = study.modality || [];
                    study.modality.push(series.modality);

                    files.splice(i, 1);
                    filesToMerge.push({ patient: patient, study: study, file: file });
                  }
                }
              });
            });
          });
        });
      } catch (err) {
        // if error, do not merge any DICOMDIR data
        filesToMerge = [];

        // restore the original files list to be parsed
        filesList.unshift(files.length);
        filesList.unshift(0);
        Array.prototype.splice.apply(files, filesList);

        finalResponse.notSupportedFiles.push({ file: dicomdirFile, reason: 'error-parsing-dicomdir-file' });
      }

      // merge all files found in the DICOMDIR data
      filesToMerge.forEach(function (file) {
        self.mergePatient(finalResponse, file.patient, file.study, file.file);
      });
      finalResponse.parsedFileCount += filesToMerge.length;

      this.updateDCMProgress(finalResponse);
      
      subject.next(finalResponse);
      subject.complete();
    });
    return subject.asObservable();
  }

  /**
   * Parses the dicom file to retrieve patient(s), study(s) and image(s) details
   * @param file A dicom file
   * @param finalResponse A final response containing patient(s) and study(s) details
   * @returns Final response having patient(s), study(s), file(s) as an observable
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
        this.updateDCMProgress(finalResponse);
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

    if(dicomdirFiles.length > 0) {
      forkJoin(dicomdirFiles.map(function (dicomdirFile) {
        return self.loadAndParseDICOMDIRFile(dicomdirFile, files, finalResponse, subject);
      })).subscribe(() => {
        forkJoin(files.map(function (file) {
          return self.loadAndParseDICOMFile(file, finalResponse, subject);
        })).subscribe(() => {
          if(finalResponse.notSupportedFiles.length === finalResponse.totalCount) {
            subject.error('All the file(s) are unsupported!');
          }
          subject.next(finalResponse);
        });
      });
    } else {
      forkJoin(files.map(function (file) {
        return self.loadAndParseDICOMFile(file, finalResponse, subject);
      })).subscribe(() => {
        if(finalResponse.notSupportedFiles.length === finalResponse.totalCount) {
          subject.error('All the file(s) are unsupported!');
        }
        subject.next(finalResponse);
      });
    }
    
    return subject.asObservable();
     
  }

}
