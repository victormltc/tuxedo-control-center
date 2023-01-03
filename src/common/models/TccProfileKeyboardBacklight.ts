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
 * MERCHANTABILITY or FITNESS FOR A PARTICUgenerateLAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TUXEDO Control Center.  If not, see <https://www.gnu.org/licenses/>.
 */

import { TccProfile, ITccProfile } from './TccProfile';

export enum regions {
    left = 'left', 
    center ='center', 
    right = 'right', 
    extra = 'extra'
}

export enum params {
    state =  'state',
    mode =  'mode',
    color_left =  'color_left',
    color_center =  'color_center',
    color_right =  'color_right',
    color_extra =  'color_extra',
    brightness =  'brightness'
};

/**
 * returns "true" if arg is :string === "true", or :boolean === true, or :number === 1 ;
 * else : returns "false"
 */
export function selectedValue (arg: string | boolean | number): string {
    if(arg === 'true' || arg === true || arg === 1){
        return 'true'
    }else{
        return 'false'
    }
}

export enum backlightModes {
    color = 'color',
    breathe = 'breathe',
    cycle = 'cycle',
    dance = 'dance',
    flash = 'flash',
    random = 'random',
    tempo = 'tempo',
    wave = 'wave'
}

export enum colorModes {
    single = 'single',
    multiple = 'multiple'
}

export enum defaultColors {
    aqua = '00FFFF',
    blue = '0000FF',
    crimson = 'DC143C',
    fuchsia = 'FF00FF',
    gray = '808080',
    green = '008000',
    lime = '00FF00',
    maroon = '800000',
    navy = '000080',
    olive = '808000',
    orange = 'FFA500',
    pink = 'FFC0CB',
    purple = '800080',
    red = 'FF0000',
    silver = 'C0C0C0',
    teal = '008080',
    turquoise = '40E0D0',
    white = 'FFFFFF',
    yellow = 'FFFF00'
}

export class Color{
    label: string;
    hex: string;
    constructor(label: string , hex: string){
        this.label = label;
        this.hex = hex;
    }
    public toString(): string {
        return this.label+" ,"+this.hex+" ;"
    }
}

export interface ITccProfileKeyboardBacklight {
    id: string;
    selected: string;
    name: string;
    backlightMode: string;
    colorMode: string;
    uniqueColor : string; //for single-color backlightMode
    colorLeft: string;
    colorCenter: string;
    colorRight: string;
    colorExtra: string;
}

export class TccProfileKeyboardBacklight/* extends TccProfile */implements ITccProfileKeyboardBacklight {
    id: string;
    selected: string;
    name: string;
    backlightMode: string;
    colorMode: string;
    uniqueColor : string; //for single-color backlightMode
    colorLeft: string;
    colorCenter: string;
    colorRight: string;
    colorExtra: string;

    // unused variables, present for compliance purposes
    /*
    description: string;
    display: ITccProfileDisplay;
    cpu: ITccProfileCpu;
    webcam: ITccProfileWebCam;
    fan: ITccProfileFanControl;
    odmProfile: ITccODMProfile;
    odmPowerLimits: ITccODMPowerLimits;
    */
    constructor(
        id: string,
        selected: string,
        name: string,
        backlightMode: string,
        colorMode: string,
        uniqueColor: string,
        colorLeft: string,
        colorCenter: string,
        colorRight: string,
        colorExtra: string,) {

            //super(JSON.parse(JSON.stringify(blankOGProfile)))

            this.id = id;
            this.selected = selected;
            this.name = name;
            this.backlightMode = backlightMode;
            this.colorMode = colorMode;
            this.uniqueColor = uniqueColor;
            this.colorLeft = colorLeft;
            this.colorCenter = colorCenter;
            this.colorRight = colorRight;
            this.colorExtra = colorExtra;
    }
    public toString(): string {
        return (this.selected === "true" ? "-[x]- " : "-[ ]-")+" id= "+this.id+", "+this.name+", "+this.uniqueColor+" ; "
    }
}

export function generateProfileId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const profileImageMap = new Map<string, string>();

/* image mapping may be adapted when basics are done with

profileImageMap.set(LegacyDefaultProfileIDs.Default, 'icon_profile_performance.svg');
profileImageMap.set(LegacyDefaultProfileIDs.CoolAndBreezy, 'icon_profile_breezy.svg');
profileImageMap.set(LegacyDefaultProfileIDs.PowersaveExtreme, 'icon_profile_energysaver.svg');
profileImageMap.set('custom', 'icon_profile_custom.svg');

profileImageMap.set(DefaultProfileIDs.MaxEnergySave, 'icon_profile_energysaver.svg');
profileImageMap.set(DefaultProfileIDs.Quiet, 'icon_profile_quiet4.svg');
profileImageMap.set(DefaultProfileIDs.Office, 'icon_profile_default.svg');
profileImageMap.set(DefaultProfileIDs.HighPerformance, 'icon_profile_performance.svg');
*/

export const defaultProfiles: ITccProfileKeyboardBacklight[] = [
    {
        id: '_defaultprofile_',
        selected: selectedValue(true),
        name: 'Default Lava',
        backlightMode: backlightModes.color,
        colorMode: colorModes.single,
        uniqueColor: defaultColors.red,
        colorLeft: defaultColors.red,
        colorCenter: defaultColors.red,
        colorRight: defaultColors.red,
        colorExtra: defaultColors.red
    },
    {
        id: '_defaultprofile_',
        selected: selectedValue(false),
        name: 'Default Aqua',
        backlightMode: backlightModes.color,
        colorMode: colorModes.single,
        uniqueColor: defaultColors.aqua,
        colorLeft: defaultColors.aqua,
        colorCenter: defaultColors.aqua,
        colorRight: defaultColors.aqua,
        colorExtra: defaultColors.aqua
    }
];

export const defaultCustomProfile: ITccProfileKeyboardBacklight = {
    id: '_defaultcustom_',
    selected: selectedValue(false),
    name: 'My Custom Profile',
    backlightMode: backlightModes.color,
    colorMode: colorModes.single,
    uniqueColor: defaultColors.white,
    colorLeft: defaultColors.white,
    colorCenter: defaultColors.white,
    colorRight: defaultColors.white,
    colorExtra: defaultColors.white
};



// unused interfaces & values from the TccProfile parent class,
// for inheritance compliance purposes
/*
const blankOGProfile: ITccProfile = {
    id: '__default_custom_profile__',
    name: 'TUXEDO Defaults',
    description: 'Edit profile to change behaviour',
    display: {
        brightness: 100,
        useBrightness: false
    },
    cpu: {
        onlineCores: undefined,
        useMaxPerfGov: false,
        scalingMinFrequency: undefined,
        scalingMaxFrequency: undefined,
        governor: 'powersave', // unused: see CpuWorker.ts->applyCpuProfile(...)
        energyPerformancePreference: 'balance_performance',
        noTurbo: false
    },
    webcam: {
        status: true,
        useStatus: true
    },
    fan: {
        useControl: true,
        fanProfile: 'Balanced',
        minimumFanspeed: 0,
        offsetFanspeed: 0
    },
    odmProfile: { name: undefined },
    odmPowerLimits: { tdpValues: [] }
};

interface ITccProfileDisplay {
    brightness: number;
    useBrightness: boolean;
}

interface ITccProfileCpu {
    onlineCores: number;
    useMaxPerfGov: boolean;
    scalingMinFrequency: number;
    scalingMaxFrequency: number;
    governor: string; // unused: see CpuWorker.ts->applyCpuProfile(...)
    energyPerformancePreference: string;
    noTurbo: boolean;
}

interface ITccProfileWebCam {
    status: boolean;
    useStatus: boolean;
}

interface ITccProfileFanControl {
    useControl: boolean;
    fanProfile: string;
    minimumFanspeed: number;
    offsetFanspeed: number;
}

interface ITccODMProfile {
    name: string
}

interface ITccODMPowerLimits {
    tdpValues: number[]
}
*/