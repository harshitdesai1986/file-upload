import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const backendURL = 'http://localhost:3000';
const upstreamURL = 'http://10.30.10.34:3001';
const getUuidURL = backendURL + '/uuid';
const insertTransactionURL = backendURL + '/insertTransaction';
const getTransactionsURL = backendURL + '/getTransactions';
const updateTransactionsURL = backendURL + '/updateTransaction';
const initUpstreamUploadURL = upstreamURL + '/initUpload';


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
  private resumableArray : any[] = [];

  constructor(private http: HttpClient) { }

  /**
   * Returns unique UUID from backend
   */
  getUUID() {
    return this.http.get(getUuidURL);
  }

  /**
   * Makes an upstream call to initiate upstream upload 
   * @param data transaction UID
   */
  postInitUpload(data) {
    return this.http.post(initUpstreamUploadURL, data);
  }

  /**
   * Updates the status of the transaction to failed if an error at upstream init call
   * @param data trnsaction UID
   */
  updateTransactionStatus(data) {
    return this.http.post(updateTransactionsURL, data);
  }

  /**
   * Inserts record in DB before initiating upload
   * @param data transaction data to be inserted in DB
   */
  insertUploadTransaction(data) {
    return this.http.post(insertTransactionURL, data);
  }

  /**
   * Gets all the upload transactions from DB
   */
  getAllTransactions() {
    return this.http.get(getTransactionsURL);
  }

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
   * Adds resumable object to an array
   * @param resumable A resumable object
   */
  addResumableObject(resumable) {
    this.resumableArray.push(resumable);
  }

  /**
   * Removes resumable object from an array
   * @param resumable A resumable object
   */
  removeResumableObject(resumable) {
    let iEnd = this.resumableArray.length;
    for (let i = 0; i < iEnd; i++) {
      if((resumable && this.resumableArray[i]) && (resumable.transactionUid === this.resumableArray[i].transactionUid)) {
        this.resumableArray.splice(i,1);
      }
    }
  }

  /**
   * Returns resumable array
   * @returns Resumable array 
   */
  getResumableObjects() {
    return this.resumableArray;
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

  /**
   * Returns Gender in full form
   * @param gender Gender in M/F/O/null
   * @returns Gender in full form
   */
  getGenderInFullForm(gender) {
    let fullFormGender: string = '';
    switch (gender) {
      case 'M':
        fullFormGender = 'Male';
        break;
      case 'F':
        fullFormGender = 'Female';
        break;
      case null:
        fullFormGender = null;
        break;
      default:
        fullFormGender = 'Other';
        break;
    }
    return fullFormGender; 
  }

}
