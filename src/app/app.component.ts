import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import * as Resumable from '../../3rdparty/resumablejs/resumable.js';

import { DicomParserService } from './dicom-parser.service';

// Upload URL
const URL = 'http://localhost:3000/upload';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

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

  constructor(private toastr: ToastrService, private dicomParserService: DicomParserService) { }

  ngAfterViewInit() {
    this.resumable.assignBrowse(this.browseButton.nativeElement, true);
  }

  ngOnInit() {
    let self = this;
    this.resumable.on('filesAdded', function(files){
      let verifyUploadFileSize = self.dicomParserService.isUploadSizeGreaterThanTheLimit(files);
      if(verifyUploadFileSize) {
        self.toastr.error('Selected File(s) size is greater than the limit!');
      }

      self.dicomParserService.getDicomAttributes().subscribe(dicomAttributes => {
        self.dicomParserService.getPatientList(files, dicomAttributes).subscribe(patientList => {
          console.log("Reached", patientList);
        });
      });
      
      console.debug('filesAdded', event);
    });

  }

  startUpload() {
    this.resumable.upload();
  }
  
}
