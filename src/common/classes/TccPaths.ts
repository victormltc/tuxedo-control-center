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
export class TccPaths {
    static readonly PID_FILE: string = '/var/run/tccd.pid';
    static readonly TCCD_EXEC_FILE: string = '/opt/tuxedo-control-center/resources/dist/tuxedo-control-center/data/service/tccd';
    static readonly SETTINGS_FILE: string = '/etc/tcc/settings';
    static readonly PROFILES_FILE: string = '/etc/tcc/profiles';
    static readonly AUTOSAVE_FILE: string = '/etc/tcc/autosave';
    static readonly FANTABLES_FILE: string = '/etc/tcc/fantables';
    static readonly KB_PROFILES_FILE: string = '/etc/tcc/keyboardprofiles';
    static readonly KB_COLORS_FILE: string = '/etc/tcc/keyboardcolors';
    static readonly TCCD_LOG_FILE: string = '/var/log/tccd/log';
    static readonly KB_DRIVER_DIR: string = '/sys/devices/platform/tuxedo_keyboard/';
}
