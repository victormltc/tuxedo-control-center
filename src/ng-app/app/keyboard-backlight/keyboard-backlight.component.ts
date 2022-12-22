/*!
 * Copyright (c) 2019-2020 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
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
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UtilsService } from '../utils.service';
import { noUndefined } from '@angular/compiler/src/util';


class Color{
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

class LightProfile {
    id: string;
    selected: string;
    name: string;
    backlightMode: string;
    colorMode: string;
    uniqueColor : string; //for single-color mode
    colorLeft: string;
    colorCenter: string;
    colorRight: string;
    colorExtra: string;
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
        return (this.selected === "true" ? "-[x]- " : "-[ ]-")+"id = "+this.id+" , "+this.name+" , "+this.uniqueColor+" ; "
    }
}

@Component({
    selector: 'app-keyboard-backlight',
    templateUrl: './keyboard-backlight.component.html',
    styleUrls: ['./keyboard-backlight.component.scss']
})
export class KeyboardBacklightComponent implements OnInit {
    
    public inputColor: string; // color.hex
    public selectedColor: Color;
    public availableColors: Array<Color>;
    public inputProfile: string; // profile.id
    public selectedProfile: LightProfile;
    public profiles: Array<LightProfile>;

    // Back-end : driver settings & conf files
    public readonly fileMod: number = 0o644;
    //TODO : removed unused
    public readonly confPaths = {
        DEVICE_PATH : '/sys/devices/platform/tuxedo_keyboard/',
        MODULE_PATH : '/sys/module/tuxedo_keyboard',
        CUSTOM_COLORS_PATH : '~/.config/tuxedo-control-center/keyboard_backlight_custom_colors.conf',
        PROFILES_PATH : '~/.config/tuxedo-control-center/keyboard_backlight_profiles.conf'
    };
    public readonly regions = {
        left: 'left', 
        center:'center', 
        right: 'right', 
        extra: 'extra'
    };
    public readonly params = {
        state: 'state',
        mode: 'mode',
        color_left: 'color_left',
        color_center: 'color_center',
        color_right: 'color_right',
        color_extra: 'color_extra',
        brightness: 'brightness'
    };
    
    
    //TODO
    /*

    - SINGLE profile back-end connection : don't care yet about the others
        not working yet : check whole python code
    - single color change
    - brightness change (see ui's fork)
    - set back restrictive permissions on leave ? 
        - what is 'leave' ? ngOnInit() is performed at each sidebar press
    - other features from backlight python
    - nettoyer le code
    */

    constructor(
        private utils: UtilsService
    ) { }

    ngOnInit() {
        this.availableColors = new Array<Color>();
        this.profiles = new Array<LightProfile>();
        this.allowDeviceSettingsChange();

        // demo
        this.addProfile(new LightProfile("jacky","false","tuning","bip","bip","00FF00","bip","bip","bip","bip"));
        this.addProfile(new LightProfile("michel","true","zouba","bip","bip","00FFFF","bip","bip","bip","bip"));
        this.addProfile(new LightProfile("serge","true","de la compta","bip","bip","FFA500","bip","bip","bip","bip"));

        this.updateProfiles(); // includes selectedProfile initialisation
        this.inputProfile = this.selectedProfile.id;

        // plus tard : à aller chercher dans les fichiers de conf
        this.availableColors = this.genDefaultColors();
        this.selectedColor = this.availableColors[4];
        this.inputColor = this.selectedColor.hex;
        
    }

    public getColorByHex(hex: string){
        return this.availableColors.find(color => color.hex === hex);
    }

    public getColorByLabel(label: string){
        return this.availableColors.find(color => color.label === label);
    }

    public updateSelectedColor(){
        this.selectedColor = this.availableColors.find(color => color.hex === this.inputColor);
        
        // susceptible to change with multi-colors support
        this.selectedProfile.uniqueColor = this.selectedColor.hex;
        this.setDeviceParam(this.params.color_left, this.selectedProfile.uniqueColor);
    }


    public genDefaultColors(): Array<Color> {
        let rawSet: Array<string> = [
            'aqua', '00FFFF',
            'blue', '0000FF',
            'crimson', 'DC143C',
            'fuchsia', 'FF00FF',
            'gray', '808080',
            'green', '008000',
            'lime', '00FF00',
            'maroon', '800000',
            'navy', '000080',
            'olive', '808000',
            'orange', 'FFA500',
            'pink', 'FFC0CB',
            'purple', '800080',
            'red', 'FF0000',
            'silver', 'C0C0C0',
            'teal', '008080',
            'turquoise', '40E0D0',
            'white', 'FFFFFF',
            'yellow', 'FFFF00'
        ];
        let colors = new Array<Color>() //il fallait initialiser cet objet avec un constructeur
        let label: string = ""
        let hex: string = ""

        rawSet.forEach(function(value: string, index: number){
            if (index % 2 === 0){
                label = value
            }else{
                hex = value
                colors.push(new Color(label,hex))
            }
        });
        return colors
    }

    public genProfile(){
        const randomId = this.generateProfileId();
        //const randomId: string = (this.profiles.length).toString();
        const randomColor: string = this.availableColors[(Math.random()*this.availableColors.length).toFixed(0)].hex;
        const newProfile = new LightProfile(
            randomId,
            'false',
            'gen_'+this.profiles.length,
            'color',
            'single color',
            randomColor,
            randomColor,
            randomColor,
            randomColor,
            randomColor
        )
        this.addProfile(newProfile);
    }

    public addProfile(newProfile: LightProfile){
        this.profiles.push(newProfile);
        //this.popUp('added a profile !',this.profiles[this.profiles.length-1].toString())
        this.updateProfiles;
    }

    public removeProfile(unwantedProfile: LightProfile){
        const index: number  = this.profiles.findIndex(prof => prof.id === unwantedProfile.id);
        if(index >= 0){
            const removed: LightProfile[] = this.profiles.splice(index,1);
            this.popUp('removed a profile !',removed[0].toString())
            this.updateProfiles;
        }else{
            this.popUp("something bad happened","removeProfile(..) : index ="+index);
        }

        this.updateProfiles()
    }

    public updateSelectedProfile(){
        // we want to make modifications on selectedProfile only :
        // on updates, its value will replace its old version in the 'profiles' array

        let formerSelected: LightProfile = this.selectedProfile
        let newSelected: LightProfile = this.profiles.find(prof => prof.id === this.inputProfile);
        const formerSelectedIndex: number = this.profiles.findIndex(prof => prof.id === formerSelected.id)
        const newSelectedIndex: number = this.profiles.findIndex(prof => prof.id === newSelected.id)
        formerSelected.selected = "false";
        newSelected.selected = "true";
        this.profiles[formerSelectedIndex] = formerSelected
        this.profiles[newSelectedIndex] = newSelected
        

        //this.selectedProfile = newSelected;
        this.updateProfiles();
    }

    public updateProfiles(){
        // sync with back-end
        if (this.profiles.length > 0){
            //this.writeProfiles(this.profiles)
        }
        //this.profiles = this.readProfiles();

        // setting (only one) selectedProfile
        let selectedProfileIndex: number = -1;
        this.profiles.forEach(function(value: LightProfile, index: number) {
            if(value.selected === "true" && selectedProfileIndex === -1){
                selectedProfileIndex = index;
            }else{
                value.selected = "false";
            }
        })
        if(selectedProfileIndex === -1){
            this.profiles[0].selected = "true";
            this.selectedProfile = this.profiles[0]
        }else{
            this.selectedProfile = this.profiles[selectedProfileIndex]
        }
    }

    //for testing purposes
    public async popUp(title: string, msg: string) {
        const dialogWindow = await this.utils.confirmDialog({
            title: title,
            description: msg,
            buttonAbortLabel: "ok",
            buttonConfirmLabel: "dak"
        });
    }


    ///////////////////   BACK-END : tuxedo-keyboard driver & conf files settings   //////////////////////////////////////////////////////////

    // python source : https://github.com/webketje/tuxedo-backlight-control
    //  + fork (brightness control) : https://github.com/encarsia/tuxedo-backlight-control
    // let the user pick a file by hand : https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle

    private allowDeviceSettingsChange(){
        let oneliner = '';
        const fileNameList: string[] = [
            this.params.brightness,
            this.params.color_center,
            this.params.color_extra,
            this.params.color_left,
            this.params.color_right,
            this.params.mode,
            this.params.state
        ]
        oneliner += 'cd /sys/devices/platform/tuxedo_keyboard/ && '
        fileNameList.forEach(fileName => {
            oneliner += 'chmod a+w ' + fileName + ' && '
        });
        oneliner = oneliner.slice(0, -4); // remove the tailing " && "

        return this.utils.execCmd(`pkexec /bin/sh -c "` + oneliner + `"`).then(() => {
            //this.popUp('permissions','success : '+oneliner);
            
            // this.successtext_cryptsetup = $localize `:@@cryptfinishprocess:Crypt password changed successfully`;
            // this.errortext_cryptsetup = '';
        }).catch(() => {
            //this.popUp('permissions','failure : '+oneliner);

            // this.successtext_cryptsetup = '';
            // this.errortext_cryptsetup = $localize `:@@errornewpassword:Error: Could not change crypt password (wrong old crypt password?)`;
        });
    }

    public setDeviceParam(par: string, value: string){
        // write driver param value to this.confPaths.DEVICE_PATH, i.e. '/sys/devices/platform/tuxedo_keyboard/'
        // those parameters are simple strings : 'e95420', '75', '1'
        if(Object.values(this.params).includes(par)){
            this.writeConfig(value, this.confPaths.DEVICE_PATH + par, { mode: this.fileMod })
        }
        else return 'error'
    }

    public getDeviceParam(par: string): string{
        // read driver param value directly from this.confPaths.DEVICE_PATH, i.e. '/sys/devices/platform/tuxedo_keyboard/'
        if(Object.values(this.params).includes(par)){
            if(fs.existsSync(this.confPaths.DEVICE_PATH + par)){
                return this.readConfig<string>(this.confPaths.DEVICE_PATH + par)
            }
            else return 'error'
        }
        else return 'error'
    }

    public readConfig<T>(filename: string): T {
        let config: T;
        try {
            const fileData = fs.readFileSync(filename);
            config = JSON.parse(fileData.toString());


            //test
            this.popUp('read success',filename +' = '+ fileData.toString());
        } catch (err) {
            //test
            this.popUp('read error',filename +' = '+ err.toString());

            throw err;
        }
        return config;
    }

    public writeConfig<T>(config: T, filePath: string, WriteFileOptions): void {
        const fileData = JSON.stringify(config);
        try {
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { mode: 0o755, recursive: true });
            }
            fs.writeFileSync(filePath, fileData, WriteFileOptions);

            //test
            this.popUp('write success',filePath +' = '+ fileData);
        } catch (err) {
            //test
            this.popUp('write error',filePath +' = '+ fileData +' : '+ err.toString());

            throw err;

            
        }
    }
        

    public readProfiles(filePath: string = this.confPaths.PROFILES_PATH): LightProfile[] {
        let idUpdated = false;
        const profiles = this.readConfig<LightProfile[]>(filePath).map(profile => {
            if (profile.id === undefined) {
                profile.id = this.generateProfileId();
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

    public writeProfiles(profiles: LightProfile[], filePath: string = this.confPaths.PROFILES_PATH) {
        this.writeConfig<LightProfile[]>(profiles, filePath, { mode: this.fileMod });
    }

    
    public generateProfileId(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    
    
}