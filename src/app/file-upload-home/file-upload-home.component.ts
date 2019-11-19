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

  public resumable: Resumable = new Resumable({
    target: URL,
    chunkSize:10*1024*1024,
    simultaneousUploads:4,
    testChunks:false,
    throttleProgressCallbacks:1
  });

  totalFiles: Number = 0;

  addedFiles = [];

  constructor(private router:Router, private toastr: ToastrService, private dicomParserService: DicomParserService, private fileUploadDataService: FileUploadDataService) { }

  ngAfterViewInit() {
    this.resumable.assignBrowse(this.browseButton.nativeElement, true);
  }

  ngOnInit() {
    let self = this;
    this.resumable.on('filesAdded', function(files){
      let fileObjects = self.getFileObjects(files);
      let verifyTotalUploadSize = self.dicomParserService.isUploadSizeGreaterThanTheLimit(fileObjects);
      if(verifyTotalUploadSize) {
        self.toastr.error('Selected File(s) size is greater than the limit!');
      }
      else {
        self.dicomParserService.getDicomAttributes().subscribe(dicomAttributes => {
          self.dicomParserService.getPatientList(fileObjects, dicomAttributes).subscribe(patientList => {
            self.fileUploadDataService.setPatientData(patientList);
            self.router.navigate(['/patient-list']);
          },
          err => {
            self.toastr.error(err);
          });
        });
      }
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
}
