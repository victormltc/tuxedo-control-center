/*!
 * Copyright (c) 2019-2021 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
 *
 * This file is part of TUXEDO Control Center.
 *
 * TUXEDO Control Center is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TUXEDO Control Center is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TUXEDO Control Center.  If not, see <https://www.gnu.org/licenses/>.
 */
import * as fs from 'fs';

import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ProgramManagementService } from '../program-management.service';
import { UtilsService } from '../utils.service';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

@Component({
  selector: 'app-support-commown',
  templateUrl: './support-commown.component.html',
  styleUrls: ['./support-commown.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
  ]
})
export class SupportCommownComponent implements OnInit {

    public exportResults: string = '.';
    public logsExported: boolean = false;

    constructor(
        private electron: ElectronService,
        private program: ProgramManagementService,
        private utils: UtilsService
    ) { }

    ngOnInit() {
        
    }

    public focusControl(control): void {
        setImmediate(() => { control.focus(); });
    }

    public openExternalUrl(url: string): void {
        this.electron.shell.openExternal(url);
    }

    public openSystemMonitor(): void {
        this.utils.execCmd('gnome-system-monitor -r');
    }

    public genLogs(): void {
        this.exportResults += 'previous length = ' + this.exportResults.length + '<br/>';
        this.logsExported = true;
    }

    public getLogsExported(): boolean {
        return this.logsExported;
    }

    public showMessage(){
        this.electron.remote.dialog.showMessageBox(
            this.electron.remote.getCurrentWindow(),
            {
              title: 'Bonjour',
              //message: $localize `:@@msgboxMessageServiceUnavailable:Communication with tccd service is unavailable, please restart service and try again.`,
              message: 'tout va bien',
              type: 'error',
              buttons: ['ok']
            }
          );
    }

    public writeFile(path: string, data: string): boolean {
        try {
            fs.writeFileSync(path, data);
            return true;
        } catch (err) {
            return false;
        }
    }

    

}
