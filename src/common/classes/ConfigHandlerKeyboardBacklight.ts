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
import * as fs from 'fs';
import * as path from 'path';
import { generateProfileId, ITccProfileKeyboardBacklight } from '../models/TccProfileKeyboardBacklight';
import { defaultProfiles, defaultCustomProfile } from '../models/TccProfileKeyboardBacklight';

export class ConfigHandlerKeyboardBacklight {
    public colorsFileMod: number;
    public profileFileMod: number;
    public driverDirMod: number;

    private loadedCustomProfiles: ITccProfileKeyboardBacklight[];

    // tslint:disable-next-line: variable-name
    constructor(private _pathColors: string, private _pathProfiles: string, private _pathDriver: string) {
        this.colorsFileMod = 0o644;
        this.profileFileMod = 0o644;
        this.driverDirMod = 0o644;
    }

    get pathColors() { return this._pathColors; }
    set pathColors(filename: string) { this._pathColors = filename; }
    get pathProfiles() { return this._pathProfiles; }
    set pathProfiles(filename: string) { this._pathProfiles = filename; }
    get pathDriver() { return this._pathDriver; }
    set pathDriver(filename: string) { this._pathDriver = filename; }



    readProfiles(filePath: string = this.pathProfiles): ITccProfileKeyboardBacklight[] {
        let idUpdated = false;
        const profiles = this.readConfig<ITccProfileKeyboardBacklight[]>(filePath).map(profile => {
            if (profile.id === undefined) {
                profile.id = generateProfileId();
                console.log(`(readProfiles) Generated id (${profile.id}) for ${profile.name}`);
                idUpdated = true;
            }
            return profile;
        });
        if (idUpdated) {
            this.writeProfiles(profiles);
            console.log(`Saved updated profiles`);
        }
        return profiles;
    }

    writeProfiles(profiles: ITccProfileKeyboardBacklight[], filePath: string = this.pathProfiles) {
        this.writeConfig<ITccProfileKeyboardBacklight[]>(profiles, filePath, { mode: this.profileFileMod });
    }

    // TODO write a complete suite of functions to edit driver files
    // + connect profiles & colors update calls
    writeDriverParam(hex: string, filePath: string = this.pathDriver, param: string) {
        this.writeConfig<string>(hex, filePath + param, { mode: this.profileFileMod });
    }

    public readConfig<T>(filename: string): T {
        let config: T;
        try {
            const fileData = fs.readFileSync(filename);
            config = JSON.parse(fileData.toString());
        } catch (err) {
            throw err;
        }
        return config;
    }

    public writeConfig<T>(config: T, filePath: string, writeFileOptions): void {
        const fileData = JSON.stringify(config);
        try {
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { mode: 0o755, recursive: true });
            }
            fs.writeFileSync(filePath, fileData, writeFileOptions);
        } catch (err) {
            throw err;
        }
    }

    public copyConfig<T>(config: T): T {
        return JSON.parse(JSON.stringify(config));
    }

    // the commented-out code may be activated again if we want to integrate device-specific presets
    public getDefaultProfiles(/*device?: TUXEDODevice*/): ITccProfileKeyboardBacklight[] {
        /*
        let deviceDefaultProfiles = deviceProfiles.get(device);
        if (deviceDefaultProfiles === undefined) {
            deviceDefaultProfiles = defaultProfiles;
        }
        return this.copyConfig<ITccProfileKeyboardBacklight[]>(deviceDefaultProfiles);
        */
        return this.copyConfig<ITccProfileKeyboardBacklight[]>(defaultProfiles);
    }

    public getDefaultCustomProfile(): ITccProfileKeyboardBacklight {
        return this.copyConfig<ITccProfileKeyboardBacklight>(defaultCustomProfile);
    }

    public getDefaultCustomProfiles(): ITccProfileKeyboardBacklight[] {
        return [
            this.getDefaultCustomProfile()
        ];
    }

    public getCustomProfilesNoThrow(): ITccProfileKeyboardBacklight[] {
        try {
            return this.readProfiles();
        } catch (err) {
            return this.getDefaultCustomProfiles();
        }
    }

    public getAllProfilesNoThrow(): ITccProfileKeyboardBacklight[] {
        return this.getDefaultProfiles().concat(this.getCustomProfilesNoThrow());
    }

}
