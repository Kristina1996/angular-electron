import {Component, OnInit, OnChanges, SimpleChanges, Input, OnDestroy, ChangeDetectorRef, Output, EventEmitter} from '@angular/core';
import { Subject, Subscription } from 'rxjs';

import { ReportModel } from '../../../core/models/report.model';

import { MainService } from '../../../core/services/main.service';
import { AdapterService } from '../../../core/services/adapter.service';
import { FormServiceService } from '../../../core/services/form-service.service';
import {TogglIntegrationService} from '../../../core/services/toggl-integration.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  providers: [ AdapterService, FormServiceService ]
})
export class ReportComponent implements OnInit, OnChanges, OnDestroy {

  @Input() filePath: string;
  @Output() uploadReport = new EventEmitter<{ filePath: string }>();

  report: ReportModel;
  subscription: Subscription;
  commonTotalHours = 0;
  specialTotalHours = 0;
  totalHours = 0;
  isShowTogglIcon = false;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(private mainService: MainService,
              private togglIntegrationService: TogglIntegrationService,
              private adapterService: AdapterService,
              private cdr: ChangeDetectorRef) {
    this.subscription = this.mainService.data.subscribe(val => {
      if (val === 1) { this.getReportContent(); }
    });
  }

  ngOnInit(): void {
    this.togglIntegrationService.updateTogglReport
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => {
        // Пришел отчет с toggl.com
        if (value === 1) {
          this.getReportContent();
        } else if (value === 2) {
          this.isShowTogglIcon = true;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filePath = changes.filePath.currentValue;
    this.getReportContent();
  }

  onCommonTotalHoursChange(hours) {
    this.commonTotalHours = hours;
    this.totalHours = this.commonTotalHours + this.specialTotalHours;
  }

  onSpecialTotalHoursChange(hours) {
    this.specialTotalHours = hours;
    this.totalHours = this.commonTotalHours + this.specialTotalHours;
  }

  getReportContent() {
    this.mainService.getFileContent(this.filePath).then(result => {
      (result) ? this.report = this.adapterService.getModel(result) : this.report = new ReportModel();
      this.cdr.detectChanges();
    }, error => {
      if (error.message.includes('no such file or directory')) {
        alert('Отчёт был удалён с компьютера');
      } else {
        alert('Отчёт содержит некорректную структуру. Попробуйте открыть другой отчёт.\n\n' + error);
      }
    });
  }

  onUploadReport(): void {
    this.uploadReport.emit({ filePath: this.filePath });
  }

  syncToggl() {
    const selectedFile = localStorage.getItem('selectedFile');
    const userInfo = JSON.parse(localStorage.getItem('toggl'));
    if (userInfo && selectedFile) {
      this.togglIntegrationService.getWeekReport(selectedFile);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
