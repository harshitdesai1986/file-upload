import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from "@angular/router";

import { FileUploadDataService } from './file-upload-data.service';

@Injectable({
  providedIn: 'root'
})
export class PatientCheckActivationGuard implements CanActivate {

  private allData: any = null;
  private selectedPatient = null;

  constructor(private router: Router, private fileUploadDataService: FileUploadDataService) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    this.allData = this.fileUploadDataService.getPatientData();
    this.selectedPatient = this.fileUploadDataService.getSelectedPatient();

    if ((!this.allData.patientData && !this.selectedPatient.patientData) || (this.selectedPatient.patientData && this.selectedPatient.patientData.studyList.length === 0)) {
      this.router.navigate(['/home']);
    } else {
      return true;
    }
  }

}
