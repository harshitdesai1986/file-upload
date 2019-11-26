import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileUploadDataService {
  private uplodableObject = {
    patientData : null,
    resumable: null
  };
  private selectedPatientObject = {
    patientData: null,
    resumable: null
  };

  constructor() { }

  /**
   * Sets patient data
   * @param patientData All data gathered from dicom file parsing
   */
  setPatientData(patientData, resumableObject) {
    this.uplodableObject.patientData = patientData;
    this.uplodableObject.resumable = resumableObject;
  }

  /**
   * Gets patient data
   * @returns Patient data
   */
  getPatientData() {
    return this.uplodableObject;
  }

  /**
   * Clears patient data
   */
  clearPatientData() {
    this.uplodableObject = {
      patientData : null,
      resumable: null
    };
  }

  /**
   * Sets selected patient details
   * @param patient Selected patient object
   */
  setSelectedPatient(patient) {
    this.selectedPatientObject.patientData = patient;
    this.selectedPatientObject.resumable = this.uplodableObject.resumable;
  }

  /**
   * Gets selected patient details
   * @returns Selected patient details
   */
  getSelectedPatient() {
    return this.selectedPatientObject;
  }

  /**
   * Clears selected patiant details
   */
  clearSelectedPatient() {
    this.selectedPatientObject = {
      patientData: null,
      resumable: null
    };
  }

  /**
   * Converts date into UTC date and returns it in milliseconds
   * @param date date string in "yyyy.MM.dd" or "yyyymmdd" format
   * @returns {Number|number}
   */
   convertDateToUTC(date) {
    if (date instanceof Date) {
        date = date.toJSON().slice(0, 10).replace(/-/g, '');
    }
    let formattedDate = date && (String(date).indexOf('.') > -1) ? date.replace(/\./g, '') : date;
    //formattedDate yyyymmdd;
    if (formattedDate.length === 8) {
        let year = formattedDate.slice(0, 4),
            // UTC allows months from 0-11, thus month - 1
            month = Number(formattedDate.slice(4, 6)) - 1,
            day = formattedDate.slice(6, 8);
        return Date.UTC(year, month, day);
    } else {
        return formattedDate;
    }
  }

  /**
   * Calculates patient's Age from patient's Date of Birth
   * @param patientDob Patient's DOB
   * @returns patient age in comparison with current date
   */
  calculatePatientAge = function (patientDob) {
    let currentDate = new Date();
    let utcCurrentDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()));
    let DOB = new Date(patientDob);

    let month = DOB.getMonth();
    let years = utcCurrentDate.getFullYear() - DOB.getFullYear();

    DOB.setFullYear(DOB.getFullYear() + years);

    if (DOB.getMonth() !== month) {
        DOB.setDate(0);
    }

    return DOB > utcCurrentDate ? --years : years;
  }


}
