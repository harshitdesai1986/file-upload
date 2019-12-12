import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

import { FileUploadDataService } from '../file-upload-data.service';

@Component({
  selector: 'app-pacs-list',
  templateUrl: './pacs-list.component.html',
  styleUrls: ['./pacs-list.component.scss']
})
export class PacsListComponent implements OnInit {

  private selectedPatient = null;
  private studyList: any[] = [];
  private pacsList: any[] = [];
  private deviceSelected = false;

  constructor(private router:Router, private fileUploadDataService: FileUploadDataService) { }

  ngOnInit() {
    this.selectedPatient = this.fileUploadDataService.getSelectedPatient();
    if(this.selectedPatient && this.selectedPatient.patientData.studyList) {
      this.studyList = this.selectedPatient.patientData.studyList;
    }
    if(!this.selectedPatient.patientData || this.studyList.length === 0) {
      this.router.navigate(['/home']);
    } else {
      this.pacsList = [
        {
          name: 'San Ramon PACS',
          isSelected: false
        },
        {
          name: 'San Ramon EA',
          isSelected: false
        },
        {
          name: 'San Ramon CPACS',
          isSelected: false
        },
        {
          name: 'Chicago PACS',
          isSelected: false
        },
        {
          name: 'Chicago EA',
          isSelected: false
        },
        {
          name: 'Chicago CPACS',
          isSelected: false
        }
      ];
    }
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
   * Takes user back to Study List screen
   */
  private gotoStudyList() {
    this.studyList.forEach(function(study) {
      study.isSelected = false;
    });
    this.selectedPatient.patientData.selectAll = false;
    this.router.navigate(['/study-list']);
  }

  /**
   * Selects/Deselects the PACS device and deselect the other available devices
   * @param selectedPacs The pacs device selected on page
   */
  private selectDestination(selectedPacs) {
    this.pacsList.forEach(pacs => {
      if(pacs.name === selectedPacs.name) {
        pacs.isSelected = !pacs.isSelected;
        if(pacs.isSelected) {
          this.deviceSelected = true;
        } else {
          this.deviceSelected = false;
        }
      } else {
        pacs.isSelected = false;
      }
    });
  }

  /**
   * Uploads selected study files
   */
  private uploadSelectedStudies() {
    let transactionData = {
      uid: null,
      startdate: null,
      message: null
    };
    
    transactionData.uid = this.selectedPatient.resumable.files[0].file.transactionUid;
    transactionData.message = this.selectedPatient.resumable.files[0].file.uploadMessage;
    transactionData.startdate = new Date().getTime();

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
