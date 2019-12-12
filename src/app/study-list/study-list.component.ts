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
  private selectedPatientName: string = "";
  private selectedPatientId: string = "";
  private selectedPatientDob: string = "";
  private selectedPatientAge: string = "";
  private selectedPatientGender: string = "";
  private selectedPatientSelectAll: string = "";

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
      this.selectedPatientName = this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.name ? this.selectedPatient.patientData.name : this.NOT_APPLICABLE;

      this.selectedPatientId = this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.id ? this.selectedPatient.patientData.id : this.NOT_APPLICABLE;

      this.selectedPatientGender = this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.gender ? this.selectedPatient.patientData.gender : this.NOT_APPLICABLE;

      this.selectedPatientAge = this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.age ? this.selectedPatient.patientData.age : this.NOT_APPLICABLE;

      this.selectedPatientSelectAll = this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.selectAll ? this.selectedPatient.patientData.selectAll : false;

      if(this.selectedPatient && this.selectedPatient.patientData && this.selectedPatient.patientData.dob && Number(this.selectedPatient.patientData.dob) !== NaN) {
        this.selectedPatientDob = this.datePipe.transform(this.selectedPatient.patientData.dob, 'dd MMM yyyy');
      } else {
        this.selectedPatientDob = this.NOT_APPLICABLE;
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
   * Makes the uploadable data ready and redirects to destination selection screen
   */
  private goToDeviceSelection() {
    this.router.navigate(['/pacs-list']);
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
