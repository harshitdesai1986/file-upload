import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FileUploadHomeComponent } from './file-upload-home/file-upload-home.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { StudyListComponent } from './study-list/study-list.component';
import { PacsListComponent } from './pacs-list/pacs-list.component';
import { PatientCheckActivationGuard } from './patient-check-activation.guard';

const routes: Routes = [
  { path: 'home', component: FileUploadHomeComponent },
  { path: 'patient-list', component: PatientListComponent, canActivate: [PatientCheckActivationGuard] },
  { path: 'study-list', component: StudyListComponent, canActivate: [PatientCheckActivationGuard] },
  { path: 'pacs-list', component: PacsListComponent, canActivate: [PatientCheckActivationGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
