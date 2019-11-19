import { TestBed } from '@angular/core/testing';

import { FileUploadDataService } from './file-upload-data.service';

describe('FileUploadDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FileUploadDataService = TestBed.get(FileUploadDataService);
    expect(service).toBeTruthy();
  });
});
