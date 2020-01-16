import { TestBed, async, inject } from '@angular/core/testing';

import { PatientCheckActivationGuard } from './patient-check-activation.guard';

describe('PatientCheckActivationGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PatientCheckActivationGuard]
    });
  });

  it('should ...', inject([PatientCheckActivationGuard], (guard: PatientCheckActivationGuard) => {
    expect(guard).toBeTruthy();
  }));
});
