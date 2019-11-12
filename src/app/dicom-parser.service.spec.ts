import { TestBed } from '@angular/core/testing';

import { DicomParserService } from './dicom-parser.service';

describe('DicomParserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DicomParserService = TestBed.get(DicomParserService);
    expect(service).toBeTruthy();
  });
});
