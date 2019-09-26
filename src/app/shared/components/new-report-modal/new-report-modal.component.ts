import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

import { MainService } from '../../../core/services/main.service';
import {ParseToXmlService} from '../../../core/services/parse-to-xml.service';
import {FormServiceService} from '../../../core/services/form-service.service';
import {EmployeeModel, ProjectModel, ReportModel, TaskModel} from '../../../core/models/report.model';
import {FileModel} from './file.model';
import {SpecialItemModel, SpecialTaskModel} from '../../../core/models/specialItem.model';

@Component({
  selector: 'app-new-report-modal',
  templateUrl: './new-report-modal.component.html',
  styleUrls: ['./new-report-modal.component.scss'],
  providers: [MainService]
})
export class NewReportModalComponent implements OnInit {

  @Input() folderPath: string;
  @Output() closeModal = new EventEmitter<boolean>();

  public filesList: FileModel[] = [];
  public yearsList = [];

  public selectedYear = moment().year();
  public currentWeek = moment().week();

  public fileName;

  constructor(private mainService: MainService,
              private parseToXmlService: ParseToXmlService,
              private formService: FormServiceService) { }

  ngOnInit() {
    this.getYearsList();
    this.getWeeksList(this.selectedYear);
  }

  getYearsList() {
    const currentYear = moment().year();
    const nextYear = currentYear + 1;
    for (let i = 2006; i <= nextYear; i++) {
      this.yearsList.push(i);
    }
  }

  getWeeksList(year) {
    const selectedDate = moment().set('year', year);
    const weeks = moment(selectedDate).weeksInYear();
    let firstDay = moment(selectedDate).startOf('year');

    for (let i = 0; i < weeks; i++) {
      const file = new FileModel();
      file.numberOfWeek = i + 1;
      file.startWeek = moment(firstDay).startOf('week').format('DD.MM.YYYY');
      file.endWeek = moment(firstDay).endOf('week').format('DD.MM.YYYY')
      file.nameListItem = file.numberOfWeek + ': ' + file.startWeek + ' - ' + file.endWeek;
      file.fileName = file.numberOfWeek + '_' + file.startWeek + '-' + file.endWeek + '.xls';

      if (this.currentWeek === file.numberOfWeek) {
        this.fileName = file.fileName;
      }
      this.filesList.push(file);
      firstDay = firstDay.add(1, 'week');
    }
  }

  changeYear() {
    this.filesList = [];
    this.getWeeksList(this.selectedYear);
  }

  chooseFile(fileName) {
    this.fileName = fileName;
  }

  clickClose() {
    this.closeModal.emit(false);
  }

  createReport() {
    const emptyReport = this.createEmptyReportObject();
    const emptyReportXml = this.parseToXmlService.parseToXml(emptyReport);
    this.mainService.saveFile(this.folderPath + '\\' + this.fileName, emptyReportXml).then(result => {
      alert('Файл ' + result + ' был успешно создан');
      const files = JSON.parse(localStorage.getItem('files'));
      files.push(this.fileName);
      localStorage.setItem('files', JSON.stringify(files));
      localStorage.setItem('selectedFile', this.fileName);
      this.clickClose();
    });
  }

  createEmptyReportObject() {
    const obj = {
      commonForm: [],
      specialForm: [{
        employeeName: '',
        rate: 0,
        specialTasks: [{
          hours: 0,
          name: ''
        }]
      }]
    };
    obj.commonForm.push(new ProjectModel());
    obj.commonForm[0].employee.push(new EmployeeModel());
    obj.commonForm[0].employee[0].tasks.push(new TaskModel());
    return obj;
  }

}
