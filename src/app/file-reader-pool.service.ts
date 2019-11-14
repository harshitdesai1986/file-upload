import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileReaderPoolService { 

  // queue of files to be read
  private queue = [];

  // Pool limit
  private limit = 15;

  // Count of running reading process
  private runningCount = 0;

  constructor() { }

  private getByteArrayOfFile(item) {
    var file = item.file;
    var subject = item.subject;
    let fileReader: FileReader = new FileReader();
    let fileByteArray;
    fileReader.onload = function(event) {
      let arrayBuffer: any = fileReader.result;
      fileByteArray = new Uint8Array(arrayBuffer);
      subject.next(fileByteArray);
    }

    fileReader.onerror = fileReader.onabort = function() {
      subject.error('File reading error!');
    }

    fileReader.readAsArrayBuffer(file.file);
    return subject.asObservable();
  }

  private runNext() {
    if (this.runningCount < this.limit && this.queue.length > 0) {
        this.runningCount++;
        this.getByteArrayOfFile(this.queue.shift())   .complete(function () {
            this.runningCount > 0 && this.runningCount--;
            this.runNext();
        });
    }
  }

  readFile(file) : Observable<any>  {
    let subject = new Subject<any>();

    this.queue.push({
        file: file,
        subject: subject
    });

    this.runNext();

    return subject;
  }

  private cleanQueue = function () {
      this.queue = [];
      this.runningCount = 0;
      console.log('cleaning the queue', this.runningCount, this.limit, this.queue.length);
  }

}
