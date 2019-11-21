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
    console.log("ALready attached files ", this.resumable.files);
    console.log("Patient Data >> ", self.fileUploadDataService.getPatientData());
    this.resumable.on('filesAdded', function(files){
      self.addedFiles = files;
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

  /* startUpload() {
    this.resumable.upload();
  } */

  private startParsing() {
    console.log("attached files ", this.resumable.files);
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
            this.fileUploadDataService.setPatientData(patientList);
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
