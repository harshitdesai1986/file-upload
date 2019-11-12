import { Injectable } from '@angular/core';
import { Observable, Subject, forkJoin } from 'rxjs';

import { FileReaderPoolService } from './file-reader-pool.service';

import * as dicomParser from '../../3rdparty/dicom-parser/dist/dicomParser.js';
import * as dicomCharSet from '../../3rdparty/dicom-character-set/dicom-character-set.js';

// 5GB Upload Limit
const UPLOAD_LIMIT: Number = 5368709120;
const DICOMDIR = 'DICOMDIR';


@Injectable({
  providedIn: 'root'
})
export class DicomParserService {

  private subject = new Subject<any>();

  constructor(private fileReaderPoolService: FileReaderPoolService) { }

  /**
   * Validates the total size of all the browsed files and returns false on exeeding the defined limit
   * @param files Total number of files to be uploaded
   * @returns True on exeeding set upload size limit else False
   */
  isUploadSizeGreaterThanTheLimit(files) {
    let totalUploadSize: Number = 0;
    files.forEach(file => {
      totalUploadSize += file.file.size;
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
   * Extracts DICOMDIR files
   * @param files Total number of files to be uploaded
   * @returns An array of extracted DICOMDIR files
   */
  private extractDICOMDIRFiles(files) {
  let dicomdirFiles = [];

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (file.file.name === DICOMDIR) {
      dicomdirFiles.push(file);
      files.splice(i--, 1);
    }
  }

  return dicomdirFiles;
}

  private loadAndParseDICOMDIRFile(dicomdirFile) {
  this.fileReaderPoolService.readFile(dicomdirFile).subscribe(response => {
    console.log(response);
    this.subject.next(response);
    //TODO: Write code for DICOMDIR parsing
  });
  return this.subject.asObservable();
}

  private loadAndParseDICOMFile(file, finalResponse) {
  this.fileReaderPoolService.readFile(file).subscribe(response => {
    let patient: any = {};
    let study: any = {};
    let image: any = {};
    let dataSet: any = {};
    console.log(response);
    try {
      dataSet = dicomParser.parseDicom(response, { untilTag: 'x00200011' });
      patient = this.getPatientDetails(dataSet);
      study = this.getStudyDetails(dataSet);
      image = this.getImageDetails(dataSet);

      file.studyInstanceUid = study.studyInstanceUid;
      file.seriesInstanceUid = study.seriesInstanceUid;
      file.sopInstanceUid = image.sopInstanceUid;

      //Read and validate transfer syntax uid
      //var currTransferSyntaxUid = readTransferSyntax(dataSet, byteArray);
      //study.transferSyntaxUid = _.has(validTransferSyntaxUid, currTransferSyntaxUid) ? currTransferSyntaxUid : null;
    } catch (error) {

    }




    //this.subject.next(response);
    //TODO: Write code for DICOMDIR parsing
  });
}

getPatientList(files) : Observable < any > {

  let dicomdirFiles = this.extractDICOMDIRFiles(files);
  let self = this;
  let finalResponse = {
    totalCount: files.length,
    notSupportedFiles: [],
    patientList: {}
  };

  forkJoin(dicomdirFiles.map(function (dicomdirFile) {
    return self.loadAndParseDICOMDIRFile(dicomdirFile);
  })).subscribe(result => {
    //this.subject.next(result);
    forkJoin(files.map(function (file) {
      return self.loadAndParseDICOMFile(files, finalResponse);
    })).subscribe(result => {

    });
  });

  return this.subject.asObservable();
}

}
