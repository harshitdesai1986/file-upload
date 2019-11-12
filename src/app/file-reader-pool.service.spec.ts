import { TestBed } from '@angular/core/testing';

import { FileReaderPoolService } from './file-reader-pool.service';

describe('FileReaderPoolService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FileReaderPoolService = TestBed.get(FileReaderPoolService);
    expect(service).toBeTruthy();
  });
});
