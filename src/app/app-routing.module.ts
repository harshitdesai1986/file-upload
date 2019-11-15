import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FileUploadHomeComponent } from './file-upload-home/file-upload-home.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { StudyListComponent } from './study-list/study-list.component';

const routes: Routes = [
  { path: 'home', component: FileUploadHomeComponent },
  { path: 'patient-list', component: PatientListComponent },
  { path: 'study-list', component: StudyListComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
