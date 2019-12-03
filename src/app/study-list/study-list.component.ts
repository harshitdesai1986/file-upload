import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import { DatePipe } from '@angular/common';

import { FileUploadDataService } from '../file-upload-data.service';

@Component({
  selector: 'app-study-list',
  templateUrl: './study-list.component.html',
  styleUrls: ['./study-list.component.scss'],
  providers: [DatePipe]
})
export class StudyListComponent implements OnInit {

  private selectedPatient = null;
  private studyList: any[] = [];
  private NOT_APPLICABLE = 'N/A';
  private noOfStudiesSelected: number = 0;
  private filesToBoUploaded: any[] = [];

  constructor(private router:Router, private datePipe: DatePipe, private fileUploadDataService: FileUploadDataService) { }

  ngOnInit() {
    this.selectedPatient = this.fileUploadDataService.getSelectedPatient();
    if(!this.selectedPatient.patientData) {
      this.router.navigate(['/home']);
    } else {
      if(Number(this.selectedPatient.patientData.dob) !== NaN) {
        this.selectedPatient.patientData.dob = this.datePipe.transform(this.selectedPatient.patientData.dob, 'dd MMM yyyy');
      } else {
        this.selectedPatient.patientData.dob = null;
      }
      this.populateStudyList(this.selectedPatient.patientData.studyList);
      console.log(this.selectedPatient.patientData);
    }
  }

  /**
   * Populates list of studies on UI
   * @param studyList Study list of selected patient 
   */
  private populateStudyList(studyList) {
    this.studyList = studyList;
  }

  /**
   * Takes user back to Patient List screen
   */
  private gotoPatientList() {
    this.studyList.forEach(function(study) {
      study.isSelected = false;
    });
    this.selectedPatient.patientData.selectAll = false;
    this.router.navigate(['/patient-list']);
  }

  /**
   * Toggles the study to be selected/deselected
   * @param study The study to be selected/deselected
   */
  private toggleOne(study) {
    study.isSelected = !study.isSelected;
    if(study.isSelected) {
      this.noOfStudiesSelected++;
    } else {
      this.noOfStudiesSelected--;
    }
    this.selectedPatient.patientData.selectAll = this.noOfStudiesSelected === this.selectedPatient.patientData.studyList.length ? true : false;
    console.log(study.id, study.isSelected, this.noOfStudiesSelected);
  }

  /**
   * Toggles all the studies to be selected/deselected
   */
  private toggleAll() {
    let self = this;
    this.selectedPatient.patientData.selectAll = !this.selectedPatient.patientData.selectAll;
    this.noOfStudiesSelected = this.selectedPatient.patientData.selectAll ? this.selectedPatient.patientData.studyList.length : 0;
    this.studyList.forEach(function(study) {
      study.isSelected = self.selectedPatient.patientData.selectAll ? true : false;
    });
  }

  /**
   * Extracts files from study for uploading
   * @param study A study containing dicom files
   */
  private getFilesToBeUploaded(study) {
    if(study.isSelected) {
      study.fileList.forEach(file => {
        this.filesToBoUploaded.push(file);
      });
    }
  }

  /**
   * Uploads selected study files
   */
  private uploadSelectedStudies() {
    let resumableFilesToBeUploaded: any[] = [];
    let transactionData = {
      uid: null,
      startdate: null,
      message: null
    };
    this.studyList.forEach(study => {
      this.getFilesToBeUploaded(study);
    });
    
    this.filesToBoUploaded.forEach(file => {
      let fileToBeUploaded = file;
      this.selectedPatient.resumable.files.forEach(resumableFile => {
        if(fileToBeUploaded.uniqueIdentifier === resumableFile.file.uniqueIdentifier) {
          resumableFilesToBeUploaded.push(resumableFile);
        }
      });
    });

    // Assigns only files to be uploaded to resumable onject
    this.selectedPatient.resumable.files = resumableFilesToBeUploaded;

    console.log("Final set of files to be uploaded  ", this.selectedPatient.resumable.files);

    transactionData.uid = this.selectedPatient.resumable.files[0].file.transactionUid;
    transactionData.message = this.selectedPatient.resumable.files[0].file.uploadMessage;
    transactionData.startdate = new Date().getTime();

    console.log("transactionData   ", transactionData);

    this.fileUploadDataService.insertUploadTransaction(transactionData).subscribe(response => {
      if(response) {
        this.fileUploadDataService.addResumableObject(this.selectedPatient.resumable);
        this.selectedPatient.resumable.defaults.transactionUid = transactionData.uid;
        this.selectedPatient.resumable.upload();
        this.router.navigate(['/home']);
      }
    });
    
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
