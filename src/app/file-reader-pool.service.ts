import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileReaderPoolService { 

  constructor() { }

  readFile(file) : Observable<any>  {
    let fileReader: FileReader = new FileReader();
    let subject = new Subject<any>();
    let fileByteArray;
    fileReader.onload = function(event) {
      let arrayBuffer: any = fileReader.result;
      fileByteArray = new Uint8Array(arrayBuffer);
      return subject.next(fileByteArray);
    }

    fileReader.onerror = fileReader.onabort = function() {
      return subject.error('File reading error!');
    }

    fileReader.readAsArrayBuffer(file.file);
    return subject;
  }


}
