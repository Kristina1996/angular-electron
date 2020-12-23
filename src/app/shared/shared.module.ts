import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import {FilterPipe} from '../core/filter.pipe';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { ReportComponent } from './components/report/report.component';
import { FilesMenuComponent } from './components/files-menu/files-menu.component';
import { CommonPartComponent } from './components/report/common-part/common-part.component';
import { SpecialPartComponent } from './components/report/special-part/special-part.component';
import { NewReportModalComponent } from './components/new-report-modal/new-report-modal.component';
import { FormInputComponent } from './components/report/form-input/form-input.component';
import { IconButtonComponent } from './components/icon-button/icon-button.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { BaseModalComponent } from './components/base-modal/base-modal.component';
import { InputAutocompleteComponent } from './components/report/input-autocomplete/input-autocomplete.component';
import { ContextMenuComponent } from './components/files-menu/context-menu/context-menu.component';
import { ErrorReportModalComponent } from './components/modals/error-report-modal/error-report-modal.component';

@NgModule({
  declarations: [ FilterPipe, PageNotFoundComponent, WebviewDirective, ReportComponent, FilesMenuComponent, CommonPartComponent, SpecialPartComponent, NewReportModalComponent, FormInputComponent, IconButtonComponent, SettingsModalComponent, BaseModalComponent, FilterPipe, InputAutocompleteComponent, ContextMenuComponent, ErrorReportModalComponent],
  imports: [CommonModule, TranslateModule, BrowserModule, FormsModule, ReactiveFormsModule],
  exports: [ ErrorReportModalComponent, TranslateModule, WebviewDirective, ReportComponent, FilesMenuComponent, NewReportModalComponent, IconButtonComponent, SettingsModalComponent, BaseModalComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class SharedModule {}
