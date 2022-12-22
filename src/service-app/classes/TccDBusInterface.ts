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
import * as dbus from 'dbus-next';
import { ChargingWorker } from './ChargingWorker';

function dbusVariant<T>(signature: string, value: T): dbus.Variant<T> {
    const v = new dbus.Variant<T>();
    v.signature = signature;
    v.value = value;
    return v;
}

function exportOwnProperties(obj: object, keys: string[]) {
    const o = {};
    for (const key of keys) {
        if (obj[key].export !== undefined) {
            o[key] = obj[key].export();
        } else {
            o[key] = obj[key];
        }
    }
    return o;
}

/**
 * Structure for timestamped data
 */
export class TimeData<T> {
    public timestamp: dbus.Variant<number>;
    constructor(private timestampNumber: number, public data: dbus.Variant<T>) {
        this.timestamp = dbusVariant('x', timestampNumber);
    }
    set(timestamp: number, data: T) { this.timestamp.value = timestamp; this.data.value = data; }
    export() {
        return exportOwnProperties(this, ['timestamp', 'data']);
    }
}

/**
 * Structure for fan data
 */
export class FanData {
    public speed = new TimeData<number>(0, dbusVariant('i', 0));
    public temp = new TimeData<number>(0, dbusVariant('i', 0));
    export() {
        return exportOwnProperties(this, ['speed', 'temp']);
    }
}

/**
 * Structure for DBus interface data, passed to interface
 */
export class TccDBusData {
    public tuxedoWmiAvailable: boolean;
    public tccdVersion: string;
    public fans: FanData[];
    public webcamSwitchAvailable: boolean;
    public webcamSwitchStatus: boolean;
    public forceYUV420OutputSwitchAvailable: boolean;
    public modeReapplyPending: boolean;
    public tempProfileName: string;
    public tempProfileId: string;
    public activeProfileJSON: string;
    public profilesJSON: string;
    public customProfilesJSON: string;
    public defaultProfilesJSON: string;
    public defaultValuesProfileJSON: string;
    public odmProfilesAvailable: string[];
    public odmPowerLimitsJSON: string;
    public fansMinSpeed: number;
    public fansOffAvailable: boolean;
    constructor(numberFans: number) { this.fans = new Array<FanData>(numberFans).fill(undefined).map(fan => new FanData()); }
    // export() { return this.fans.map(fan => fan.export()); }
}

export class TccDBusOptions {
    public triggerStateCheck?: () => Promise<void>;
    public chargingWorker?: ChargingWorker;
}

export class TccDBusInterface extends dbus.interface.Interface {
    private interfaceOptions: TccDBusOptions;

    constructor(private data: TccDBusData, options: TccDBusOptions = {}) {
        super('com.tuxedocomputers.tccd');

        this.interfaceOptions = options;
        if (this.interfaceOptions.triggerStateCheck === undefined) {
            this.interfaceOptions.triggerStateCheck = async () => {};
        }
    }

    TuxedoWmiAvailable() { return this.data.tuxedoWmiAvailable; }
    TccdVersion() { return this.data.tccdVersion; }
    GetFanDataCPU() { return this.data.fans[0].export(); }
    GetFanDataGPU1() { return this.data.fans[1].export(); }
    GetFanDataGPU2() { return this.data.fans[2].export(); }
    WebcamSWAvailable() { return this.data.webcamSwitchAvailable; }
    GetWebcamSWStatus() { return this.data.webcamSwitchStatus; }
    GetForceYUV420OutputSwitchAvailable() { return this.data.forceYUV420OutputSwitchAvailable; }
    ConsumeModeReapplyPending() {
        // Unlikely, but possible race condition.
        // However no harmful impact, it will just cause the screen to flicker twice instead of once.
        if (this.data.modeReapplyPending) {
            this.data.modeReapplyPending = false;
            return true;
        }
        return false;
    }
    GetActiveProfileJSON() { return this.data.activeProfileJSON; }
    SetTempProfile(profileName: string) {
        this.data.tempProfileName = profileName;
        return true;
    }
    SetTempProfileById(id: string) {
        this.data.tempProfileId = id;
        this.interfaceOptions.triggerStateCheck();
        return true;
    }
    GetProfilesJSON() { return this.data.profilesJSON; }
    GetCustomProfilesJSON() { return this.data.customProfilesJSON; }
    GetDefaultProfilesJSON() { return this.data.defaultProfilesJSON; }
    GetDefaultValuesProfileJSON() { return this.data.defaultValuesProfileJSON; }
    ODMProfilesAvailable() { return this.data.odmProfilesAvailable; }
    ODMPowerLimitsJSON() { return this.data.odmPowerLimitsJSON; }
    ModeReapplyPendingChanged() {
        return this.data.modeReapplyPending;
    }
    GetFansMinSpeed() { return this.data.fansMinSpeed; }
    GetFansOffAvailable() { return this.data.fansOffAvailable; }
    async GetChargingProfilesAvailable() {
        return JSON.stringify(await this.interfaceOptions.chargingWorker.getChargingProfilesAvailable());
    }
    async GetCurrentChargingProfile() {
        return await this.interfaceOptions.chargingWorker.getCurrentChargingProfile();
    }
    async SetChargingProfile(profileDescriptor: string) {
        return await this.interfaceOptions.chargingWorker.applyChargingProfile(profileDescriptor);
    }
    async GetChargingPrioritiesAvailable() {
        return JSON.stringify(await this.interfaceOptions.chargingWorker.getChargingPrioritiesAvailable());
    }
    async GetCurrentChargingPriority() {
        return await this.interfaceOptions.chargingWorker.getCurrentChargingPriority();
    }
    async SetChargingPriority(priorityDescriptor: string) {
        return await this.interfaceOptions.chargingWorker.applyChargingPriority(priorityDescriptor);
    }
}

TccDBusInterface.configureMembers({
    properties: {
    },
    methods: {
        TuxedoWmiAvailable: { outSignature: 'b' },
        TccdVersion: { outSignature: 's' },
        GetFanDataCPU: { outSignature: 'a{sa{sv}}' },
        GetFanDataGPU1: { outSignature: 'a{sa{sv}}' },
        GetFanDataGPU2: { outSignature: 'a{sa{sv}}' },
        WebcamSWAvailable: { outSignature: 'b' },
        GetWebcamSWStatus: { outSignature: 'b' },
        GetForceYUV420OutputSwitchAvailable: { outSignature: 'b' },
        ConsumeModeReapplyPending: { outSignature: 'b' },
        GetActiveProfileJSON: { outSignature: 's' },
        SetTempProfile: { inSignature: 's',  outSignature: 'b' },
        SetTempProfileById: { inSignature: 's',  outSignature: 'b' },
        GetProfilesJSON: { outSignature: 's' },
        GetCustomProfilesJSON: { outSignature: 's' },
        GetDefaultProfilesJSON: { outSignature: 's' },
        GetDefaultValuesProfileJSON: { outSignature: 's' },
        ODMProfilesAvailable: { outSignature: 'as' },
        ODMPowerLimitsJSON: { outSignature: 's' },
        GetFansMinSpeed: { outSignature: 'i' },
        GetFansOffAvailable: { outSignature: 'b' },
        GetChargingProfilesAvailable: { outSignature: 's' },
        GetCurrentChargingProfile: { outSignature: 's' },
        SetChargingProfile: { inSignature: 's', outSignature: 'b' },
        GetChargingPrioritiesAvailable: { outSignature: 's' },
        GetCurrentChargingPriority: { outSignature: 's' },
        SetChargingPriority: { inSignature: 's', outSignature: 'b' },
    },
    signals: {
        ModeReapplyPendingChanged: { signature: 'b' }
    }
});
