import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import * as path from 'path';
import { MainService } from '../core/services/main.service';
import {DataStorageService} from '../core/services/data-storage.service';
import { takeUntil } from 'rxjs/operators';
import { UploadReportService } from '../core/services/upload-report.service';
import { Subject } from 'rxjs';
import { AdapterService } from '../core/services/adapter.service';
import { IntegrationResultModel } from '../core/models/report.model';
import { IModalConfig } from '../shared/components/base-modal/modal-config';

const electron = require('electron');

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [ MainService ]
})
export class MainComponent implements OnInit, OnDestroy {

  public showFilesMenuComponent: Boolean = false;
  public showReportComponent: Boolean = false;
  public showModalNewReport: Boolean = false;
  public showSettingsModal: Boolean = false;

  public folderPath;
  public files;
  public selectedFile;
  public selectedFileName;

  public integrationResult: IntegrationResultModel | boolean;
  public isShowErrorReportModal = false;
  public filePath = '';
  public password = '';
  public showPasswordModal = false;
  public pswConfig: IModalConfig = {
    title: 'Enter the password',
    save: {
      visible: true,
      title: 'Отправить'
    },
    cancel: {
      visible: true,
      title: 'Отмена'
    }
  }
  private sendPassword$ = new Subject<string>();
  private unsubscribe$: Subject<void> = new Subject();

  constructor(private mainService: MainService,
              private cdr: ChangeDetectorRef,
              private uploadReportService: UploadReportService,
              private adapterService: AdapterService,
              private dataStorageService: DataStorageService) { }

  ngOnInit() {
    this.getDataFromLocalStorage();

    this.sendPassword$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((password) => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (!userInfo) {
        return;
      }

      userInfo.password = password;

      // FIXME - subscribe inside subscribe...
      this.uploadReportService.upload(this.filePath, userInfo)
        .subscribe(result => {
          this.integrationResult = this.adapterService.getIntegrationResultModel(result);
          this.toogleErrorReportModal(true);
        }, error => {
          this.integrationResult = this.adapterService.getIntegrationResultModel(error);
          this.toogleErrorReportModal(true);
        });
    });
  }

  toogleErrorReportModal(show: boolean): void {
    this.isShowErrorReportModal = show;
    this.cdr.detectChanges();
  }

  savePsw(): void {
    this.sendPassword$.next(this.password);

    this.closePswModal();
  }

  closePswModal(): void {
    this.showPasswordModal = false;
    this.password = '';
  }

  getDataFromLocalStorage() {
    const folderPath = localStorage.getItem('folderPath');
    const files = localStorage.getItem('files');
    const selectedFile = localStorage.getItem('selectedFile');

    if (folderPath) {
      this.folderPath = folderPath;
    }
    if (files) {
      this.showFilesMenuComponent = true;
      this.files = JSON.parse(files);
    }
    if (selectedFile) {
      this.selectedFile = path.join(this.folderPath, selectedFile);
      this.showReportComponent = true;
    }
    this.checkUserInfo();
  }

  checkUserInfo() {
    if (localStorage.getItem('userInfo')) {
      this.updateDataFromBack();
    }
  }

  onClickUploadReport(event: { filePath: string }): void {
    this.filePath = event.filePath;
    this.showPasswordModal = true;
  }

  updateDataFromBack() {
    if (localStorage.getItem('users') && localStorage.getItem('projects')) {
      this.dataStorageService.updateDataFromLocalStorage()
    }
  }

  openDialog() {
    electron.remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
      this.folderPath = result.filePaths[0];
      this.showReportComponent = false;
      localStorage.setItem('files', '');
      localStorage.setItem('selectedFile', '');

      if (this.folderPath) {
        localStorage.setItem('folderPath', result.filePaths[0]);
        this.getFilesFromFolder();
      } else { this.showFilesMenuComponent = false; }
    }).catch(err => {
      console.log(err);
    });
  }

  getFilesFromFolder() {
    this.mainService.getFilesFromFolder(this.folderPath).then((result: string[]) => {
      this.files = [];
      result.forEach(file => {
        this.files.push(file);
      });
      if (this.files.length === 0) {
         this.showFilesMenuComponent = true;
         this.showReportComponent = false;
        localStorage.setItem('files', JSON.stringify(this.files));
      } else {
         this.showFilesMenuComponent = true;
         localStorage.setItem('files', JSON.stringify(this.files));
      }
    });
  }

  /**
   *Метод для получения имени выбранного файла от компонента FilesMenuComponent
  **/
  onSendFileName(selectedFile: string) {
    localStorage.setItem('selectedFile', selectedFile);
    this.selectedFile = path.join(this.folderPath, selectedFile);
    this.showReportComponent = true;
  }

  onShowModalNewReport(click: Boolean) {
    if (click) { this.showModalNewReport = true; }
  }

  openSettingsModal() {
    this.showSettingsModal = true;
  }

  /**
   *Метод для закрытия модального окна Create New Report
  **/
  onCloseModal(show: Boolean) {
    if (show === false) { this.showModalNewReport = false; }
    this.files = JSON.parse(localStorage.getItem('files'));
    this.selectedFile = path.join(this.folderPath, localStorage.getItem('selectedFile'));
    this.selectedFileName = localStorage.getItem('selectedFile');
    this.showReportComponent = true;
  }

  onCloseSettingsModal(show: Boolean) {
    this.showSettingsModal = show;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
