/*!
 * Copyright (c) 2019-2022 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
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
import { Injectable, OnDestroy } from '@angular/core';

import { TccPaths } from '../../common/classes/TccPaths';
import { ITccProfileKeyboardBacklight, generateProfileId } from '../../common/models/TccProfileKeyboardBacklight';
import { ConfigHandlerKeyboardBacklight,  } from '../../common/classes/ConfigHandlerKeyboardBacklight';
import { environment } from '../environments/environment';
import { ElectronService } from 'ngx-electron';
import { Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { UtilsService } from './utils.service';
import { TccDBusClientService } from './tcc-dbus-client.service';

@Injectable({
    providedIn: 'root'
})
export class ConfigServiceKeyboardBacklight implements OnDestroy {

    private config: ConfigHandlerKeyboardBacklight;

    private defaultProfiles: ITccProfileKeyboardBacklight[];
    private defaultValuesProfile: ITccProfileKeyboardBacklight;
    private customProfiles: ITccProfileKeyboardBacklight[];

    private currentProfileEdit: ITccProfileKeyboardBacklight;
    private currentProfileEditIndex: number;

    public observeEditingProfile: Observable<ITccProfileKeyboardBacklight>;
    private editingProfileSubject: Subject<ITccProfileKeyboardBacklight>;
    public editingProfile: BehaviorSubject<ITccProfileKeyboardBacklight>;

    private subscriptions: Subscription = new Subscription();

    // Exporting of relevant functions from ConfigHandlerKeyboardBacklight
    // public copyConfig = ConfigHandlerKeyboardBacklight.prototype.copyConfig;
    // public writeSettings = ConfigHandlerKeyboardBacklight.prototype.writeSettings;

    constructor(
        private electron: ElectronService,
        private utils: UtilsService,
        private dbus: TccDBusClientService) {

        this.editingProfileSubject = new Subject<ITccProfileKeyboardBacklight>();
        this.observeEditingProfile = this.editingProfileSubject.asObservable();
        this.editingProfile = new BehaviorSubject<ITccProfileKeyboardBacklight>(undefined);

        this.config = new ConfigHandlerKeyboardBacklight(
            TccPaths.KB_COLORS_FILE,
            TccPaths.KB_PROFILES_FILE,
            TccPaths.KB_DRIVER_DIR,
        );

        this.defaultProfiles = this.dbus.defaultProfilesKeyboardBacklight.value;
        this.updateConfigData();
        this.subscriptions.add(this.dbus.customProfilesKeyboardBacklight.subscribe(nextCustomProfiles => {
            this.customProfiles = nextCustomProfiles;
        }));
        /*
        // Descriptions are not relevant for keyboard profiles
        this.subscriptions.add(this.dbus.defaultProfilesKeyboardBacklight.subscribe(nextDefaultProfiles => {
            this.defaultProfiles = nextDefaultProfiles;
            for (const profile of this.defaultProfiles) {
                this.utils.fillDefaultProfileTexts(profile);
            }
        }));
        */
        this.defaultValuesProfile = this.dbus.defaultValuesProfileKeyboardBacklight.value;
        this.subscriptions.add(this.dbus.defaultValuesProfileKeyboardBacklight.subscribe(nextDefaultValuesProfile => {
            this.defaultValuesProfile = nextDefaultValuesProfile;
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public updateConfigData(): void {
        // this.customProfiles = this.config.getCustomProfilesNoThrow();
        this.customProfiles = this.dbus.customProfilesKeyboardBacklight.value;
        /*for (const profile of this.customProfiles) {
            this.utils.fillDefaultValuesProfile(profile);
        }*/
    }

    get cpuSettingsDisabledMessage(): string {
        return $localize `:@@messageCPUSettingsOff:CPU settings deactivated in Tools→Global\u00A0Settings`;
    }

    get fanControlDisabledMessage(): string {
        return $localize `:@@messageFanControlOff:Fan control deactivated in Tools→Global\u00A0Settings`;
    }

    public getCustomProfiles(): ITccProfileKeyboardBacklight[] {
        return this.customProfiles;
    }

    public getDefaultProfiles(): ITccProfileKeyboardBacklight[] {
        return this.defaultProfiles;
    }

    public getDefaultValuesProfile(): ITccProfileKeyboardBacklight {
        return this.defaultValuesProfile;
    }

    public getAllProfiles(): ITccProfileKeyboardBacklight[] {
        return this.defaultProfiles.concat(this.getCustomProfiles());
    }

    public setActiveProfile(profileId: string, stateId: string): void {
        // Copy existing current settings and set id of new profile
        /*
        const newSettings: ITccSettings = this.config.copyConfig<ITccSettings>(this.getSettings());

        newSettings.stateMap[stateId] = profileId;
        const tmpSettingsPath = '/tmp/tmptccsettings';
        this.config.writeSettings(newSettings, tmpSettingsPath);
        */
        let tccdExec: string;

        if (environment.production) {
            tccdExec = TccPaths.TCCD_EXEC_FILE;
        } else {
            tccdExec = this.electron.process.cwd() + '/dist/tuxedo-control-center/data/service/tccd';
        }

        const result = this.electron.ipcRenderer.sendSync(
            'exec-cmd-sync', 'pkexec ' + tccdExec //+ ' --new_settings ' + tmpSettingsPath
        );
        
        this.updateConfigData();
    }

    /**
     * Copy profile with specified ID
     *
     * @param sourceProfileId Profile ID to copy, if undefined use default values profile
     * @param newProfileName Name for the copied profile
     * @returns The new profile ID or undefined on error
     */
    public async copyProfile(sourceProfileId: string, newProfileName: string) {
        let profileToCopy: ITccProfileKeyboardBacklight;

        if (sourceProfileId === undefined) {
            profileToCopy = this.dbus.defaultValuesProfileKeyboardBacklight.value;
        } else {
            profileToCopy = this.getProfileById(sourceProfileId);
        }

        if (profileToCopy === undefined) {
            return undefined;
        }

        const newProfile: ITccProfileKeyboardBacklight = this.config.copyConfig<ITccProfileKeyboardBacklight>(profileToCopy);
        newProfile.name = newProfileName;
        newProfile.id = generateProfileId();
        const newProfileList = this.getCustomProfiles().concat(newProfile);
        const success = await this.pkexecWriteCustomProfilesAsync(newProfileList);
        if (success) {
            this.updateConfigData();
            await this.dbus.triggerUpdate();
            return newProfile.id;
        } else {
            return undefined;
        }
    }

    public async deleteCustomProfile(profileIdToDelete: string) {
        const newProfileList: ITccProfileKeyboardBacklight[] = this.getCustomProfiles().filter(profile => profile.id !== profileIdToDelete);
        if (newProfileList.length === this.getCustomProfiles().length) {
            return false;
        }
        const success = await this.pkexecWriteCustomProfilesAsync(newProfileList);
        if (success) {
            this.updateConfigData();
            await this.dbus.triggerUpdate();
        }
        return success;
    }

    public pkexecWriteCustomProfiles(customProfiles: ITccProfileKeyboardBacklight[]) {
        const tmpProfilesPath = '/tmp/tmptccprofiles';
        this.config.writeProfiles(customProfiles, tmpProfilesPath);
        let tccdExec: string;
        if (environment.production) {
            tccdExec = TccPaths.TCCD_EXEC_FILE;
        } else {
            tccdExec = this.electron.process.cwd() + '/dist/tuxedo-control-center/data/service/tccd';
        }
        const result = this.electron.ipcRenderer.sendSync(
            'exec-cmd-sync', 'pkexec ' + tccdExec + ' --new_profiles ' + tmpProfilesPath
        );
        return result.error === undefined;
    }

    public writeCurrentEditingProfile(): boolean {
        if (this.editProfileChanges()) {
            const changedCustomProfiles: ITccProfileKeyboardBacklight[] = this.config.copyConfig<ITccProfileKeyboardBacklight[]>(this.customProfiles);
            changedCustomProfiles[this.currentProfileEditIndex] = this.getCurrentEditingProfile();

            const result = this.pkexecWriteCustomProfiles(changedCustomProfiles);
            if (result) { this.updateConfigData(); }

            return result;
        } else {
            return false;
        }
    }

    private async pkexecWriteCustomProfilesAsync(customProfiles: ITccProfileKeyboardBacklight[]) {
        const tmpProfilesPath = '/tmp/tmptccprofiles';
        this.config.writeProfiles(customProfiles, tmpProfilesPath);
        let tccdExec: string;
        if (environment.production) {
            tccdExec = TccPaths.TCCD_EXEC_FILE;
        } else {
            tccdExec = this.electron.process.cwd() + '/dist/tuxedo-control-center/data/service/tccd';
        }
        try {
            await this.utils.execFile('pkexec ' + tccdExec + ' --new_profiles ' + tmpProfilesPath);
            return true;
        } catch (err) {
            return false;
        }
    }

    public async writeProfile(currentProfileId: string, profile: ITccProfileKeyboardBacklight, states?: string[]): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const profileIndex = this.customProfiles.findIndex(p => p.id === currentProfileId);
            profile.id = currentProfileId;

            // Copy custom profiles and if provided profile is one of them, overwrite with
            // provided profile
            const customProfilesCopy = this.config.copyConfig<ITccProfileKeyboardBacklight[]>(this.customProfiles);
            const willOverwriteProfile =
                // Is custom profile
                profileIndex !== -1;

            if (willOverwriteProfile) {
                customProfilesCopy[profileIndex] = profile;
            }

            // Copy config and if states are provided, assign the chosen profile to these states
            /*
            const newSettings: ITccSettings = this.config.copyConfig<ITccSettings>(this.getSettings());
            if (states !== undefined) {
                for (const stateId of states) {
                    newSettings.stateMap[stateId] = profile.id;
                }
            }
            */
            this.pkexecWriteConfigProfilesAsync(customProfilesCopy).then(success => {
                if (success) {
                    this.updateConfigData();
                }
                resolve(success);
            });

        });
    }

    /*
    writeDriverParam(hex: string, filePath: string = this.pathDriver, param: string) {
        this.writeConfig<string>(hex, filePath + param, { mode: this.profileFileMod });
    }
    */
    public async writeDriverParam(hex: string, param: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            
            /*
            const profileIndex = this.customProfiles.findIndex(p => p.id === currentProfileId);
            profile.id = currentProfileId;

            // Copy custom profiles and if provided profile is one of them, overwrite with
            // provided profile
            const customProfilesCopy = this.config.copyConfig<ITccProfileKeyboardBacklight[]>(this.customProfiles);
            const willOverwriteProfile =
                // Is custom profile
                profileIndex !== -1;

            if (willOverwriteProfile) {
                customProfilesCopy[profileIndex] = profile;
            }

            // Copy config and if states are provided, assign the chosen profile to these states
            /*
            const newSettings: ITccSettings = this.config.copyConfig<ITccSettings>(this.getSettings());
            if (states !== undefined) {
                for (const stateId of states) {
                    newSettings.stateMap[stateId] = profile.id;
                }
            }
            */
            this.pkexecWriteConfigColorsAsync(hex, param).then(success => {
                if (success) {
                    this.updateConfigData();
                }
                resolve(success);
            });

        });
    }

    /*
    public async saveSettings(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const customProfilesCopy = this.config.copyConfig<ITccProfileKeyboardBacklight[]>(this.customProfiles);
            const newSettings: ITccSettings = this.config.copyConfig<ITccSettings>(this.getSettings());

            this.pkexecWriteConfigAsync(newSettings, customProfilesCopy).then(success => {
                if (success) {
                    this.updateConfigData();
                }
                resolve(success);
            });
        });
    }
    */
    
    private async pkexecWriteConfigColorsAsync(hex: string, param: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const tmpColorsPath = '/tmp/tmptcckeyboardcolors';
            this.config.writeDriverParam(hex, this.config.pathDriver, param);
            //this.config.writeSettings(settings, tmpSettingsPath);
            let tccdExec: string;
            if (environment.production) {
                tccdExec = TccPaths.TCCD_EXEC_FILE;
            } else {
                tccdExec = this.electron.process.cwd() + '/dist/tuxedo-control-center/data/service/tccd';
            }
            this.utils.execFile(
                'pkexec ' + tccdExec + ' --new_colors ' + tmpColorsPath //+ ' --new_settings ' + tmpSettingsPath
            ).then(data => {
                this.utils.execCmd('echo "OK :'+ data.toString() +'" > /home/oem/Bureau/pkexec_log')
                resolve(true);
            }).catch(error => {
                this.utils.execCmd('echo "NOT OK : '+ error.toString() +'" > /home/oem/Bureau/pkexec_log')
                resolve(false);
            });
        });
    }

    private async pkexecWriteConfigProfilesAsync(/*settings: ITccSettings,*/ customProfiles: ITccProfileKeyboardBacklight[]): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const tmpProfilesPath = '/tmp/tmptcckeyboardprofiles';
            const tmpSettingsPath = '/tmp/tmptccsettings';
            this.config.writeProfiles(customProfiles, tmpProfilesPath);
            //this.config.writeSettings(settings, tmpSettingsPath);
            let tccdExec: string;
            if (environment.production) {
                tccdExec = TccPaths.TCCD_EXEC_FILE;
            } else {
                tccdExec = this.electron.process.cwd() + '/dist/tuxedo-control-center/data/service/tccd';
            }
            this.utils.execFile(
                'pkexec ' + tccdExec + ' --new_profiles ' + tmpProfilesPath //+ ' --new_settings ' + tmpSettingsPath
            ).then(data => {
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    /**
     * Retrieves the currently chosen profile for edit
     *
     * @returns undefined if no profile is set, the profile otherwise
     */
    public getCurrentEditingProfile(): ITccProfileKeyboardBacklight {
        return this.currentProfileEdit;
    }

    public getProfileByName(searchedProfileName: string): ITccProfileKeyboardBacklight {
        const foundProfile: ITccProfileKeyboardBacklight = this.getAllProfiles().find(profile => profile.name === searchedProfileName);
        if (foundProfile !== undefined) {
            return this.config.copyConfig<ITccProfileKeyboardBacklight>(foundProfile);
        } else {
            return undefined;
        }
    }

    public getProfileById(searchedProfileId: string): ITccProfileKeyboardBacklight {
        const foundProfile: ITccProfileKeyboardBacklight = this.getAllProfiles().find(profile => profile.id === searchedProfileId);
        if (foundProfile !== undefined) {
            return this.config.copyConfig<ITccProfileKeyboardBacklight>(foundProfile);
        } else {
            return undefined;
        }
    }

    public getCustomProfileByName(searchedProfileName: string): ITccProfileKeyboardBacklight {
        const foundProfile: ITccProfileKeyboardBacklight = this.getCustomProfiles().find(profile => profile.name === searchedProfileName);
        if (foundProfile !== undefined) {
            return this.config.copyConfig<ITccProfileKeyboardBacklight>(foundProfile);
        } else {
            return undefined;
        }
    }

    public getCustomProfileById(searchedProfileId: string): ITccProfileKeyboardBacklight {
        const foundProfile: ITccProfileKeyboardBacklight = this.getCustomProfiles().find(profile => profile.id === searchedProfileId);
        if (foundProfile !== undefined) {
            return this.config.copyConfig<ITccProfileKeyboardBacklight>(foundProfile);
        } else {
            return undefined;
        }
    }

    /**
     * Checks if the current edit profile has changes compared to the currently saved
     *
     * @returns true if there are changes, false if there are no changes or no profile
     *          is chosen for edit
     */
    public editProfileChanges(): boolean {
        if (this.currentProfileEdit === undefined) { return false; }
        const currentSavedProfile: ITccProfileKeyboardBacklight = this.customProfiles[this.currentProfileEditIndex];
        // Compare the two profiles
        return JSON.stringify(this.currentProfileEdit) !== JSON.stringify(currentSavedProfile);
    }

    /**
     * Set the current profile to edit. Effectively makes a new copy of the chosen profile
     * for edit and compare with current profile values. Overwrites any current changes.
     *
     * @param customProfileId Profile ID used to look up the profile
     * @returns false if the ID doesn't exist among the custom profiles, true if successfully set
     */
    public setCurrentEditingProfile(customProfileId: string): boolean {
        if (customProfileId === undefined) {
            this.currentProfileEditIndex = -1;
            this.currentProfileEdit = undefined;
            this.editingProfileSubject.next(undefined);
            this.editingProfile.next(undefined);
        }
        const index = this.currentProfileEditIndex = this.customProfiles.findIndex(e => e.id === customProfileId);
        if (index === -1) {
            return false;
        } else {
            this.currentProfileEditIndex = index;
            this.currentProfileEdit = this.config.copyConfig<ITccProfileKeyboardBacklight>(this.customProfiles[index]);
            this.editingProfileSubject.next(this.currentProfileEdit);
            this.editingProfile.next(this.currentProfileEdit);
            return true;
        }
    }

}
