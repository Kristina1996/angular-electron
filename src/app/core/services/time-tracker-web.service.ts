import { Injectable } from '@angular/core';
import { ElectronService } from './electron/electron.service';
import {forkJoin, Observable, of} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import * as moment from 'moment';
import {HolderStorageService} from './holder-storage-service';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerWebService {

  soap;

  constructor(private electronService: ElectronService,
              private holderStorageService: HolderStorageService) {
    this.soap = this.electronService.soap;
  }

  getProjectsAndUsers(userInfo) {
    return this.createClient(userInfo).pipe(
      mergeMap(client => {
        return forkJoin([this.getProjects(client), this.getUsers(client)]);
      })
    );
  }

  getProjects(client) {
    return new Observable(observer => {
      client.GetProjects(null, (error, response) => {
        if (error) {
          observer.error(error);
          console.error(error);
        } else {
          observer.next(response.GetProjectsResult.ProjectDto);
          observer.complete();
        }
      });
    });
  }

  getUsers(client) {
    return new Observable(observer => {
      client.GetUsers(null, (error, response) => {
        if (error) {
          observer.error(error);
          console.error(error);
        } else {
          observer.next(response.GetUsersResult.UserDto);
          observer.complete();
        }
      });
    });
  }

  uploadReport(userInfo, report) {
    return this.createClient(userInfo).pipe(
      mergeMap(client => {
        return this.uploadManagerReport(client, report).pipe(
          mergeMap(response => {
            return (response.UploadManagerReportResult.ResultCode === 'DataError' && response.UploadManagerReportResult.Message.startsWith('Дублируется'))
              ? this.deleteReport(client).pipe(
                mergeMap(deleteResponse => this.uploadManagerReport(client, report))
              )
              : of(response);
          }));
      })
    );
  }

  uploadManagerReport(client, report): Observable<any> {
    const date = this.getReportingDate();
    const body = this.getRequestBodyUploadReport(date, report);
    return new Observable(observer => {
      client.UploadManagerReport(body, (error, response, rawResponse, soapHeader, rawRequest) => {
        if (error) {
          observer.error(error);
          console.error(error);
        } else {
          if (response.UploadManagerReportResult.ResultCode === 'Success') {
            this.changeFileStatus(true);
          }
          console.log(response);
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  deleteReport(client) {
    const date = this.getReportingDate();
    const body = this.getRequestBodyDeleteReport(date);
    return new Observable(observer => {
      client.DeleteManagerReport(body, (error, response) => {
        if (error) {
          observer.error(error);
          console.error(error);
        } else {
          this.changeFileStatus(false);
          observer.next(response);
          observer.complete();
          localStorage.setItem('reportWasRemoved', 'true');
        }
      });
    });
  }

  changeFileStatus(isSaved: boolean) {
    const files = JSON.parse(localStorage.getItem('files'));
    const selectedFile = localStorage.getItem('selectedFile');
    let uploadedReports = JSON.parse(localStorage.getItem('uploadedReports'));

    const updatedFiles = files.map(file => {
      if (file.name === selectedFile) {
        file.isSaved = isSaved;
      }
      return file;
    });

    localStorage.setItem('files', JSON.stringify(updatedFiles));
    if (uploadedReports) {
      if (!uploadedReports.includes(selectedFile)) {
        uploadedReports.push(localStorage.getItem('selectedFile'));
      }
    } else {
      uploadedReports = [localStorage.getItem('selectedFile')];
    }
    localStorage.setItem('uploadedReports', JSON.stringify(uploadedReports));
    this.holderStorageService.updateLocalStorage.next([]);
  }

  getReportingDate() {
    const fileName = localStorage.getItem('selectedFile');
    const dateFromTitle = fileName.substr(3, 10);
    return moment(dateFromTitle, 'DD.MM.YYYY').format('YYYY-MM-DD');
  }

  private createClient(userInfo): Observable<any> {
    return new Observable( observer => {
      const security = new this.soap.NTLMSecurity(userInfo);
      this.soap.createClient('http://' + userInfo.host + '/timetracker/TimeTrackerWebService.asmx?WSDL', {wsdl_options: {...userInfo}},  (err, client) => {
        if (err) {
          observer.error(err);
          console.error(err);
        } else {
          client.setSecurity(security);
          observer.next(client);
        }
      });
    });
  }

  private getRequestBodyUploadReport = (reportingDate, report) => ({
    reportingDate: reportingDate,
    reportXmlstring: report
  })

  private getRequestBodyDeleteReport = (reportingDate) => ({
    reportingDate: reportingDate
  })
}
