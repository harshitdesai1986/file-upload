import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { DatePipe } from '@angular/common';

import { FileUploadDataService } from '../file-upload-data.service';

@Component({
  selector: 'app-study-list',
  templateUrl: './study-list.component.html',
  styleUrls: ['./study-list.component.scss'],
  providers: [DatePipe]
})
export class StudyListComponent implements OnInit {

  public selectedPatient = null;
  public studyList: any[] = [];
  public NOT_APPLICABLE = 'N/A';
  public noOfStudiesSelected: number = 0;

  constructor(private router: Router, private datePipe: DatePipe, public fileUploadDataService: FileUploadDataService) { }

  ngOnInit() {
    this.selectedPatient = this.fileUploadDataService.getSelectedPatient();

    if (Number(this.selectedPatient.patientData.dob) !== NaN) {
      this.selectedPatient.patientData.dob = this.datePipe.transform(this.selectedPatient.patientData.dob, 'dd MMM yyyy');
    } else {
      this.selectedPatient.patientData.dob = null;
    }
    this.populateStudyList(this.selectedPatient.patientData.studyList);
    console.log(this.selectedPatient.patientData);

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
  public gotoPatientList() {
    this.studyList.forEach(function (study) {
      study.isSelected = false;
    });
    this.selectedPatient.patientData.selectAll = false;
    this.router.navigate(['/patient-list']);
  }

  /**
   * Toggles the study to be selected/deselected
   * @param study The study to be selected/deselected
   */
  public toggleOne(study) {
    study.isSelected = !study.isSelected;
    if (study.isSelected) {
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
  public toggleAll() {
    let self = this;
    this.selectedPatient.patientData.selectAll = !this.selectedPatient.patientData.selectAll;
    this.noOfStudiesSelected = this.selectedPatient.patientData.selectAll ? this.selectedPatient.patientData.studyList.length : 0;
    this.studyList.forEach(function (study) {
      study.isSelected = self.selectedPatient.patientData.selectAll ? true : false;
    });
  }

  /**
   * Makes the uploadable data ready and redirects to destination selection screen
   */
  public goToDeviceSelection() {
    this.router.navigate(['/pacs-list']);
  }

  /**
   * Cancels the file upload operation
   */
  public cancelUpload() {
    this.fileUploadDataService.clearPatientData();
    this.fileUploadDataService.clearSelectedPatient();
    this.router.navigate(['/home']);
  }

}
