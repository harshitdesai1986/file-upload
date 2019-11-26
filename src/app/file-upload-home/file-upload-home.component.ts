import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import {Router} from "@angular/router";

import { ToastrService } from 'ngx-toastr';
import * as Resumable from '../../../3rdparty/resumablejs/resumable.js';

import { DicomParserService } from '../dicom-parser.service';

import { FileUploadDataService } from '../file-upload-data.service';

// Upload URL
const URL = 'http://localhost:3000/upload';

@Component({
  selector: 'app-file-upload-home',
  templateUrl: './file-upload-home.component.html',
  styleUrls: ['./file-upload-home.component.scss']
})
export class FileUploadHomeComponent implements OnInit {

  @ViewChild('browseButton', { static: false }) browseButton: ElementRef;

  private addedFiles: any[] = [];
  private uploadMessage: string = "";
  private resumable: Resumable;
  private readingInProgress = false;
  private uploadProgress: number = 0;
  private transactionId;
  private uploadTransactions;
  private existingResumableObject = null;

  constructor(private router:Router, private toastr: ToastrService, private dicomParserService: DicomParserService, private fileUploadDataService: FileUploadDataService) { }

  ngAfterViewInit() {
    this.resumable.assignBrowse(this.browseButton.nativeElement, true);
  }

  ngOnInit() {
    this.resumable = new Resumable({
      target: URL,
      chunkSize:10*1024*1024,
      simultaneousUploads:4,
      testChunks:false,
      throttleProgressCallbacks:1
    });

    let self = this;

    this.fileUploadDataService.getUUID().subscribe(data => {
      self.transactionId = data;
    });
    
    console.log("Already attached files ", this.resumable.files);
    console.log("Patient Data >> ", this.fileUploadDataService.getPatientData());
    let patientData = this.fileUploadDataService.getPatientData();
    this.populateTransactionTable(patientData.resumable);
    if(patientData && patientData.resumable){
      patientData.resumable.on('progress', function() {
        self.uploadProgress = Math.round(patientData.resumable.progress(true) * 100);
      });
    }
    
    // On Files browsed using ResumableJS
    this.resumable.on('filesAdded', function(files){
      self.addedFiles = files;
    });
  }

  /**
   * Populates transaction table 
   * @param resumableObject resumable object to display upload progress or upload status
   */
  populateTransactionTable(resumableObject) {
    this.fileUploadDataService.getAllTransactions().subscribe(response => {
      console.log("response  ", response);
      this.uploadTransactions = response;
      this.existingResumableObject = resumableObject;
    });
  }

  /**
   * Extracts file object from Resumable File object for each file
   * @param files Resumable File Objects
   * @returns List of file objects
   */
  getFileObjects(files) {
    let fileList: Array<any> = [];
    files.forEach(file => {
      fileList.push(file.file);
    });
    return fileList;
  }

  /**
   * Starts parsing browsed files to retrieve Patient(s), Study(s) and Image(s)
   */
  private startParsing() {
    if(this.uploadMessage != "") {
      let fileObjects = this.getFileObjects(this.addedFiles);
      let verifyTotalUploadSize = this.dicomParserService.isUploadSizeGreaterThanTheLimit(fileObjects);
      if(verifyTotalUploadSize) {
        this.toastr.error('Selected File(s) size is greater than the limit!');
      }
      else {
        this.readingInProgress = true;
        this.dicomParserService.getDicomAttributes().subscribe(dicomAttributes => {
          this.dicomParserService.getPatientList(fileObjects, dicomAttributes).subscribe(patientList => {
            this.readingInProgress = false;
            this.fileUploadDataService.setPatientData(patientList, this.resumable);
            this.resumable.files.forEach(resumableFile => {
              resumableFile.file.transactionUid = this.transactionId.uid;
              resumableFile.file.uploadMessage = this.uploadMessage;
            });
            this.router.navigate(['/patient-list']);
          },
          err => {
            this.readingInProgress = false;
            this.toastr.error(err);
          });
        });
      }
    } else {
      this.toastr.error('Enter a message to continue!');
    }
  }
}
