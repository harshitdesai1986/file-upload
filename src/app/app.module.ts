import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { FormsModule } from '@angular/forms';

import { FileUploadHomeComponent } from './file-upload-home/file-upload-home.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { StudyListComponent } from './study-list/study-list.component';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadHomeComponent,
    PatientListComponent,
    StudyListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
