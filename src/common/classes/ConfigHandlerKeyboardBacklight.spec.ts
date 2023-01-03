/*!
 * Copyright (c) 2019 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
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
import 'jasmine';
const mock = require('mock-fs');
import * as fs from 'fs';
import * as path from 'path';

import { ConfigHandler } from './ConfigHandler';
import { ITccSettings, defaultSettings} from '../models/TccSettings';
import { ITccProfile } from '../models/TccProfile';
import { defaultProfiles } from '../models/profiles/LegacyProfiles';
import { TccPaths } from './TccPaths';

describe('ConfigHandler file IO', () => {

    // TODO
/*
    const config = new ConfigHandler(
        '/etc/test1/test2/settings.conf',
        '/etc/test1/test2/profiles.conf',
        '/etc/test1/test2/autosave.conf',
        '/etc/test1/test2/fantables.conf');

    // Mock file structure in memory
    beforeEach(() => {
        mock({
            '/etc': {}
        });
    });

    afterEach(() => {
        mock.restore();
    });

    it('should start without configs or folder', () => {
        expect(fs.existsSync(path.dirname(TccPaths.SETTINGS_FILE))).toBe(false);
        expect(fs.existsSync(TccPaths.SETTINGS_FILE)).toBe(false);
        expect(fs.existsSync(TccPaths.PROFILES_FILE)).toBe(false);
    });

    it('should write to a settings file with mode 644', () => {
        const settings: ITccSettings = JSON.parse(JSON.stringify(defaultSettings));
        expect(() => { config.writeSettings(settings, '/etc/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test.conf')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test.conf').mode & 0o777).toBe(0o644);
    });

    it('should create folders with mode 755 if they do not exist', () => {
        const settings: ITccSettings = JSON.parse(JSON.stringify(defaultSettings));
        expect(() => { config.writeSettings(settings, '/etc/test/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test').mode & 0o777).toBe(0o755);
        expect(() => { config.writeSettings(settings, '/etc/test1/test2/test3/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test1/test2/test3')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test1/test2/test3').mode & 0o777).toBe(0o755);
    });

    it('should read settings from a written file', () => {
        const settings: ITccSettings = JSON.parse(JSON.stringify(defaultSettings));
        settings.stateMap.ac_power = 'profile1';
        expect(() => { config.writeSettings(settings); }).not.toThrow();

        let readSettings: ITccSettings;
        expect(() => { readSettings = config.readSettings(); }).not.toThrow();
        expect(readSettings.stateMap.ac_power).toEqual('profile1');
    });

    it ('should write to a profiles file with mode 644', () => {
        const profiles: ITccProfile[] = new Array();
        expect(() => { config.writeProfiles(profiles, '/etc/test.conf'); }).not.toThrow();
        expect(fs.existsSync('/etc/test.conf')).toBe(true);
        // tslint:disable-next-line: no-bitwise
        expect(fs.statSync('/etc/test.conf').mode & 0o777).toBe(0o644);
    });

    it('should write and read multiple profiles', () => {
        const profiles: ITccProfile[] = new Array();
        const profile1: ITccProfile = JSON.parse(JSON.stringify(defaultProfiles[0]));
        profile1.name = 'some profile';
        profile1.display.brightness = 12;

        const profile2: ITccProfile = JSON.parse(JSON.stringify(defaultProfiles[0]));
        profile2.name = 'some other profile';
        profile2.display.brightness = 100;

        profiles.push(profile1);
        profiles.push(profile2);
        expect(() => { config.writeProfiles(profiles); }).not.toThrow();
        expect(fs.existsSync(config.pathProfiles)).toBe(true);

        let readProfiles: ITccProfile[];
        expect(() => { readProfiles = config.readProfiles(); }).not.toThrow();
        expect(readProfiles.length).toEqual(2);
        for (const profile of readProfiles) {
            expect(['some profile', 'some other profile'].includes(profile.name)).toBe(true);
            if (profile.name === 'some profile') {
                expect(profile.display.brightness).toBe(12);
            }
            if (profile.name === 'some other profile') {
                expect(profile.display.brightness).toBe(100);
            }
        }
    });

    it('should not crash when values are missing', () => {
        mock({'/etc/test1/test2/settings.conf': '{}'});
        let settings: ITccSettings;
        expect(() => { settings = config.readSettings('/etc/test1/test2/settings.conf'); }).not.toThrow();
        expect(settings.stateMap).toBeUndefined();
    });
*/
});
