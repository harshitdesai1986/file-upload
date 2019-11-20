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

  constructor(private router:Router, private datePipe: DatePipe, private fileUploadDataService: FileUploadDataService) { }

  ngOnInit() {
    this.selectedPatient = this.fileUploadDataService.getSelectedPatient();
    if(!this.selectedPatient) {
      this.router.navigate(['/home']);
    } else {
      this.populateStudyList(this.selectedPatient.studyList);
      console.log(this.selectedPatient);
    }
  }

  private populateStudyList(studyList) {
    this.studyList = studyList;
  }

  private gotoPatientList() {
    this.studyList.forEach(function(study) {
      study.isSelected = false;
    });
    this.selectedPatient.selectAll = false;
    this.router.navigate(['/patient-list']);
  }

  private toggleOne(study) {
    study.isSelected = !study.isSelected;
    if(study.isSelected) {
      this.noOfStudiesSelected++;
    } else {
      this.noOfStudiesSelected--;
    }
    this.selectedPatient.selectAll = this.noOfStudiesSelected === this.selectedPatient.studyList.length ? true : false;
    console.log(study.id, study.isSelected, this.noOfStudiesSelected);
  }

  private toggleAll() {
    let self = this;
    this.selectedPatient.selectAll = !this.selectedPatient.selectAll;
    this.noOfStudiesSelected = this.selectedPatient.selectAll ? this.selectedPatient.studyList.length : 0;
    this.studyList.forEach(function(study) {
      study.isSelected = self.selectedPatient.selectAll ? true : false;
    });
  }

}
