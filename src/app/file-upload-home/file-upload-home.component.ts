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
  private parsingProgress: number = 0;
  private transactionId: any = {};
  private resumableData: any[] = [];
  private uploadTransactions: any = {};

  constructor(private router:Router, private toastr: ToastrService, private dicomParserService: DicomParserService, private fileUploadDataService: FileUploadDataService) { }

  ngAfterViewInit() {
    this.resumable.assignBrowse(this.browseButton.nativeElement, true);
  }

  ngOnInit() {
    this.resumable = new Resumable({
      target: URL,
      chunkSize:3*1024*1024,
      simultaneousUploads:10,
      testChunks:false,
      throttleProgressCallbacks:1
    });

    let self = this;

    // Gets UUID from an API
    this.fileUploadDataService.getUUID().subscribe(data => {
      self.transactionId = data;
    });
    
    // Populates transaction table
    this.populateTransactionTable();
    
    // On Files browsed using ResumableJS
    this.resumable.on('filesAdded', function(files){
      self.addedFiles = files;
    });

    // Displays file(s) parsing progress
    this.dicomParserService.broadcastDCMProgressEvent().subscribe(data => {
      this.parsingProgress = Math.round((data.parsedFileCount / data.totalCount) * 100);
    });
  }

  /**
   * Makes an API call to initiate upstream upload process and updates transaction status in DB if any error
   * @param resumableObject resumable object to display upload progress or upload status
   */
  private initUpstreamUpload(resumableObject) {
    let self = this;
    resumableObject.on('complete', function() {
      let transactionData = {
        uid: resumableObject.transactionUid
      };
      self.fileUploadDataService.postInitUpload(transactionData).subscribe(response => {
        console.log("Upstream upload initiated!!");
      }, err => {
        console.log("Error occured at upstream!!");
        self.fileUploadDataService.updateTransactionStatus(transactionData).subscribe(response => {
          console.log("Status updated for the transaction ", transactionData.uid);
          self.populateTransactionTable();
        });
      });
    });
  }

  /**
   * Populates transaction table 
   * @param resumableObject resumable object to display upload progress or upload status
   */
  private populateTransactionTable() {
    let self = this;
    this.resumableData = this.fileUploadDataService.getResumableObjects();
    this.fileUploadDataService.getAllTransactions().subscribe(response => {
      this.uploadTransactions.data = response;
      if(this.resumableData){
        this.resumableData.forEach(resumableObject => {
          this.uploadTransactions.data.forEach(transaction => {
            if(transaction.uid === resumableObject.transactionUid) {
              resumableObject.on('progress', function() {
                transaction['uploadProgress'] = Math.round(resumableObject.progress(true) * 100);
                if(transaction['uploadProgress'] === 100 && !resumableObject.isUploading()) {
                  self.initUpstreamUpload(resumableObject);
                  self.fileUploadDataService.removeResumableObject(resumableObject);
                }
              });
            }
          });
        });
      }
    });
  }

  /**
   * Makes a DB call to get latest updates of transactions
   */
  private refreshTransactionTable() {
    this.populateTransactionTable();
  }

  /**
   * Extracts file object from Resumable File object for each file
   * @param files Resumable File Objects
   * @returns List of file objects
   */
  private getFileObjects(files) {
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
        this.dicomParserService.getDicomAttributes().subscribe(dicomAttributes => {
          this.dicomParserService.getPatientList(fileObjects, dicomAttributes).subscribe(patientList => {
            this.resumable.transactionUid = this.transactionId.uid;
            this.fileUploadDataService.setPatientData(patientList, this.resumable);
            this.resumable.files.forEach(resumableFile => {
              resumableFile.file.transactionUid = this.transactionId.uid;
              resumableFile.file.uploadMessage = this.uploadMessage;
            });
            this.router.navigate(['/patient-list']);
          },
          err => {
            this.toastr.error(err);
          });
        });
      }
    } else {
      this.toastr.error('Enter a message to continue!');
    }
  }
}
