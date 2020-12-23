import { Injectable } from '@angular/core';

import { ReportModel } from '../../core/models/report.model';
import { ProjectModel } from '../../core/models/report.model';
import { EmployeeModel } from '../../core/models/report.model';
import { TaskModel } from '../../core/models/report.model';
import { ProjectXml } from '../../core/models/report.model';
import { UserXml } from '../../core/models/report.model';
import { IntegrationResultModel } from '../../core/models/report.model';

import { SpecialItemModel } from '../../core/models/specialItem.model';
import { SpecialTaskModel } from '../../core/models/specialItem.model';

@Injectable({
  providedIn: 'root'
})
export class AdapterService {

  constructor() { }

  getIntegrationResultModel(result): IntegrationResultModel|boolean {
    if (result) {
      const integrationResult = new IntegrationResultModel();
      if (result.UploadManagerReportResult) {
        integrationResult.uploadManagerReportResult = {
          message: result.UploadManagerReportResult.Message,
          resultCode: result.UploadManagerReportResult.ResultCode,
          errors: []
        };
        if (integrationResult.uploadManagerReportResult.resultCode === 'Success') {
          integrationResult.successUpload = true;
          if (localStorage.getItem('reportWasRemoved') === 'true') { integrationResult.wasRemoved = true; }
        } else {
          integrationResult.successUpload = false;
          const timeSheetsListing = result.UploadManagerReportResult.TimeSheetsListing;

          if (timeSheetsListing) {
            timeSheetsListing.ErrorsForLine.ArrayOfString.forEach(error => {
              error.string.forEach(string => {
                integrationResult.uploadManagerReportResult.errors.push(string);
              });
            });
          } else {
            integrationResult.uploadManagerReportResult.errors.push('Unknown error.');
          }
        }
        return integrationResult;
      } else if (result.response) {
        integrationResult.serverError = result.body;
      } else if (result.message) {
        integrationResult.serverError = result.message;
      }
      return integrationResult;
    } else {
      return false;
    }
  }

  getProjectsXmlModel(projects): ProjectXml[] {
    const projectsXml: ProjectXml[] = [];
    projects.forEach(project => {
      projectsXml.push(new ProjectXml(project.Id, project.Title));
    });
    return projectsXml;
  }

  getUsersXmlModel(users): UserXml[] {
    const usersXml: UserXml[] = [];
    users.forEach(user => {
      usersXml.push(new UserXml(user.Id, user.FirstName, user.LastName));
    });
    return usersXml;
  }

  getModel(obj): ReportModel {
    const report: ReportModel = new ReportModel();

    const commonRows = this.getRows(obj, 0);
    const specialRows = this.getRows(obj, 1);

    if (commonRows[0].includes('Отчёт по проекту') || commonRows[0].includes('Отчет по проекту') ) { commonRows.shift(); }
    if (specialRows[0].includes('Специальные задачи')) { specialRows.shift(); }

    commonRows.forEach(row => {
      if (row.includes('prnm_')) {
        const project: ProjectModel = new ProjectModel();
        project.name = row[1];
        report.common.push(project);
      } else if (row.includes('empl_')) {
        const employee: EmployeeModel = new EmployeeModel();
        employee.name = row[1];
        report.getLastProject().employee.push(employee);
      } else {
        const task: TaskModel = new TaskModel();
        task.name = row[0];
        task.hours = row[1];
        if (row[2]) { task.date = row[2]; } else { task.date = ''; }
        report.getLastProject().getLastEmployee().tasks.push(task);
      }

    });

    specialRows.forEach(row => {
      if (row.includes('empl_')) {
        const specialItem: SpecialItemModel = new SpecialItemModel();
        specialItem.employeeName = row[1];
        specialItem.rate = row[2];
        report.specialTasks.push(specialItem);
      } else {
        const specialTask: SpecialTaskModel = new SpecialTaskModel();
        specialTask.name = row[0];
        specialTask.hours = row[1];
        if (row[2]) { specialTask.comment = row[2]; }
        report.getLastSpecialItem().specialTasks.push(specialTask);
      }

    });

    return report;
  }

  private getRows(data: any, page: number) {
    // FIXME - hotfix для issue #54 https://github.com/Kristina1996/surv-shell/issues/54
    const wsKey = (data.Workbook['Worksheet']) ? 'Worksheet' : 'ss:Worksheet';
    const cells = data.Workbook[wsKey][page].Table[0].Row
        .map(item => item.Cell)
        .filter(item => Array.isArray(item));
    const dataItems = cells.map(cell => cell.filter(item => item.Data).map(item => item.Data));
    const rows = dataItems.map(item => item.map(attr => attr[0]._))
                          .filter(row => row.length > 0 && row[0] !== 'comment_');
    return rows;
  }
}
