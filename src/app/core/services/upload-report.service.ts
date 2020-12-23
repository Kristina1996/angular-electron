import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { MainService } from './main.service';
import { TimeTrackerWebService } from './time-tracker-web.service';

interface UserInfo {
  username: string;
  password: string;
  host: string;
  domain: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadReportService {

  constructor(
    private mainService: MainService,
    private timeTrackerWebService: TimeTrackerWebService,
  ) { }

  upload(filePath: string, userInfo: UserInfo): Observable<any> {
    return this.getXmlFileContent(filePath).pipe(
      switchMap(content => {
        if (!content) {
          return throwError('Report file is empty');
        }

        return this.timeTrackerWebService.uploadReport(userInfo, content)
      })
    )
  }

  private getXmlFileContent(filePath): Observable<string> {
    return from(this.mainService.getXmlFileContent(filePath))
      .pipe(map(data => (data || '') as string));
  }
}
