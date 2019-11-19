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
    this.router.navigate(['/patient-list']);
  }

}
