import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { HolderStorageService } from '../../../core/services/holder-storage-service';
import { MainService } from '../../../core/services/main.service';
import * as path from 'path';

@Component({
  selector: 'app-files-menu',
  templateUrl: './files-menu.component.html',
  styleUrls: ['./files-menu.component.scss']
})
export class FilesMenuComponent implements OnInit, OnChanges {

  @Input() files;
  @Input() selectedFile;
  @Output() sendFileName = new EventEmitter<string>();
  @Output() openModal = new EventEmitter<boolean>();
  @Output() uploadReport = new EventEmitter<{ filePath: string }>();

  uploadedReports = [];
  isShowContextMenu = false;
  contextMenuPosition;
  contextMenuFile;

  constructor(private holderStorageService: HolderStorageService,
              private mainService: MainService,
              private cdr: ChangeDetectorRef) {
  }

  /**
   * Отслеживание события click левой кнопкой мыши, чтобы скрыть context menu
   */
  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.clearContext();
  }

  ngOnInit() {
    const file = localStorage.getItem('selectedFile');
    if (file) {
      this.selectedFile = file;
    }
    this.holderStorageService.updateLocalStorage.subscribe(value => {
      const updatedReports = JSON.parse(localStorage.getItem('uploadedReports'));
      if (updatedReports) {
        this.uploadedReports = updatedReports;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.files = changes.files.currentValue;
    this.files.sort((a, b) => {
      return Number(b.substr(0, 2)) - Number(a.substr(0, 2));
    });
    const file = localStorage.getItem('selectedFile');
    if (file) {
      this.selectedFile = file;
    }
  }

  /**
   * Передача компоненту-родителю Main имя выбранного файла
   **/
  onChooseFile(fileName) {
    this.selectedFile = fileName;
    this.sendFileName.emit(fileName);
  }

  openModalNewReport() {
    this.openModal.emit(true);
  }

  showContextMenu(event, file) {
    this.contextMenuFile = file;
    this.isShowContextMenu = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
  }

  onClickUploadReport(): void {
    const fileContext = this.contextMenuFile;
    const filePath = path.join(localStorage.getItem('folderPath'), fileContext)

    this.uploadReport.emit({ filePath });
  }

  onClickMarkAsUploaded() {
    const fileContext = this.contextMenuFile;
    const uploadedReports = JSON.parse(localStorage.getItem('uploadedReports'));
    if (uploadedReports) {
      uploadedReports.push(fileContext);
      this.uploadedReports = uploadedReports;
    } else {
      this.uploadedReports = [fileContext];
    }
    localStorage.setItem('uploadedReports', JSON.stringify(this.uploadedReports));
  }

  onClickDeleteReport(event) {
    const fileContext = this.contextMenuFile;
    const filePath = path.join(localStorage.getItem('folderPath'), fileContext);
    this.mainService.deleteFile(filePath).then(result => {
      const files = JSON.parse(localStorage.getItem('files'));
      this.files = files.filter(file => file !== fileContext);
      localStorage.setItem('files', JSON.stringify(this.files));
    });
  }

  clearContext() {
    this.isShowContextMenu = false;
    this.contextMenuFile = undefined;
    this.contextMenuPosition = undefined;
  }
}
