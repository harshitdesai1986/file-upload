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

  getFilesToBeUploaded(study) {
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
    let self = this;
    console.log("Selected Patient", this.selectedPatient.patientData);
    this.studyList.forEach(study => {
      this.getFilesToBeUploaded(study);
    });
    console.log("All Resumable Files  ", this.selectedPatient.resumable.files);
    console.log("Files to be uploaded  ", this.filesToBoUploaded);
    this.selectedPatient.resumable.files.forEach(file => {
      let currentFile = file;
      this.filesToBoUploaded.forEach(file => {
        if(file.uniqueIdentifier !== currentFile.file.uniqueIdentifier) {
          this.selectedPatient.resumable.removeFile(currentFile);
        }
      });
    });
    console.log("Final set of files to be uploaded  ", this.selectedPatient.resumable.files);
    //this.selectedPatient.resumable.upload();
    //this.router.navigate(['/home']);
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
