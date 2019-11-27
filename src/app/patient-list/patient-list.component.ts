import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import { DatePipe } from '@angular/common';

import * as _ from 'lodash';

import { FileUploadDataService } from '../file-upload-data.service';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  providers: [DatePipe]
})
export class PatientListComponent implements OnInit {

  private allData: any = null;
  private patientList: any = [];
  private NOT_APPLICABLE = 'N/A';

  constructor(private router:Router, private datePipe: DatePipe, private fileUploadDataService: FileUploadDataService) { }

  ngOnInit() {
    this.allData = this.fileUploadDataService.getPatientData();
    if(!this.allData.patientData) {
      this.router.navigate(['/home']);
    } else {
      this.populatePatientList(this.allData.patientData.patientList);
      console.log(this.allData);
    }
    
  }

  /**
   * Calculates patient age from DOB
   * @param patient Object of patient data
   */
  private calculatePatientAge(patient) {
    if (patient.dob && Number(patient.dob) !== NaN) {
      patient.dob = this.datePipe.transform(patient.dob, 'dd MMM yyyy')
      let birthDate = this.fileUploadDataService.convertDateToUTC(patient.dob);
      try {
        patient.age = this.fileUploadDataService.calculatePatientAge(this.datePipe.transform(birthDate, 'yyyy-MM-dd', 'UTC'));
      } catch {
        patient.age = 'N/A';
      }
    }
    else {
      patient.dob = null;
    }
  }

  /**
   * Splits studies from patient object to determine study with and without file(s)
   * @param patient Object of patient data
   */
  private splitStudyList(patient) {
    let studyList: any[] = patient.studyList;
    let withFiles: any[] = [];
    let withNoFiles: any[] = [];

    studyList.forEach(function (study) {
        if (study.fileList.length > 0) {
            withFiles.push(study);
        } else {
            withNoFiles.push(study);
        }
    });

    patient.studyList = withFiles;
    // studies with no files will be in the end of the list
    patient.allStudies = withFiles.concat(withNoFiles);
  }

  /**
   * Formats input data to corresponding unit
   * @returns File size in respective unit
   */
  private formatBytes = function (input) {
    input = +input;
    if (input) {
      let k = 1024,
          dm = 2,
          sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
          i = Math.floor(Math.log(input) / Math.log(k));
      return (input / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
    }

    return '0 Bytes';
  }

  /**
   * Calculates total study size
   */
  private updateStudySize() {
    let fileListSizes;
    let self = this;
    _.each(this.patientList, function (currPatient) {
        _.each(currPatient.allStudies, function (currStudy) {
            fileListSizes = _.sum(_.map(currStudy.fileList, function (currFile) {
                return currFile.size;
            }));
            currStudy.size = self.formatBytes(fileListSizes);
        });
    });
  }
  
  /**
   * Populates patient data after data manipulation
   * @param patientObject Object of Patient Data
   */
  private populatePatientList(patientObject) {
    if (patientObject) {
      for (let p in patientObject) {
          if (patientObject.hasOwnProperty(p)) {
              this.calculatePatientAge(patientObject[p]);
              this.splitStudyList(patientObject[p]);
              this.patientList.push(patientObject[p]);
          }
      }
      this.updateStudySize();
    }
  }

  /**
   * Selects patient details, sets patient details to service method and redirects user to study list screen
   * @param patient Selected patient details
   */
  private selectPatient(patient) {
    this.fileUploadDataService.setSelectedPatient(patient);
    this.router.navigate(['/study-list']);
  }

  /**
   * Cancels the file upload operation
   */
  private cancelUpload() {
    this.fileUploadDataService.clearPatientData();
    this.fileUploadDataService.clearSelectedPatient();
    this.router.navigate(['/home']);
  }

}
