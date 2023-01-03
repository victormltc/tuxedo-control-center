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
import { ITccProfileKeyboardBacklight, TccProfileKeyboardBacklight } from '../../../common/models/TccProfileKeyboardBacklight';
import { Color, colorModes, regions, params, defaultColors } from '../../../common/models/TccProfileKeyboardBacklight';
import { ConfigServiceKeyboardBacklight } from '../config-keyboard-backlight.service';
import { UtilsService } from '../utils.service';
import { Subscription } from 'rxjs';
import { DBusService } from '../dbus.service';
import { TccDBusClientService } from '../tcc-dbus-client.service';
import { FormControl } from '@angular/forms';
import { LabeledStatement } from 'typescript';
import { ChartLegendLabelOptions } from 'chart.js';
import { TccPaths } from 'src/common/classes/TccPaths';




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
    public selectedProfile: TccProfileKeyboardBacklight;
    public profiles: Array<TccProfileKeyboardBacklight>;

    

    
    
    //TODO
    /*
    ----
    // écriture des paramètres
    ----
    qu'est-ce que le service TCC ?
    - interface de bas niveau permettant l'écriture des fichiers de config et la modification des paramètres système
    - dotée d'un fichier "policy" spécifiant la sollicitation des permissions admin pour d'écrire les fichiers

    points problématiques :
    - quelle est la nature de ce logiciel, d'où vient-il ? 
        - une simple implémentation de D-Bus ? (système de communicatin sécurisée entre applications)
        -> TCCD = "Tuxedo Control Center D-bus" ?
            - pourquoi ne pas utiliser D-Bus par défaut ? pourquoi apporter une nouvelle version pré-compilée ?
            (pas de code source, juste un binary de ~70MB : dist/.../service/tccd)
        - tcc - tiny C compiler - existe dans apt mais n'est pas installé sur ma machine
        - pas de référence sur internet liées à autre chose que le projet de Tuxedo
    - utilisé via pkexec <exec path> --<option : saved objects type> <tmp path = data to be saved>
        - quel est le comportement interne de ce logiciel : comment faire pour l'utiliser afin d'écrire dans les fichiers de conf du driver ?
    - si l'on décide de passer par un autre moyen d'écrire les fichiers de conf, cela implique-t-il des risques de sécurité ?

    ----
    // sauvegarde des couleurs custom
    ----
    voir s'il est facile/pratique de créer le fichiers de couleurs en tant que tel, avec les implications back-end
    -> sinon : faire passer les custom colors par un faux profil ? ou bien créer un attribut customColors pour tous les profils, 
    dont la valeur est constamment mise à jour pour tous les profils en même temps, permet de ne pas se taper tout le back-end, 
    et on les récupère en faisant un check sur l'id et on parse par exemple le nom qui sera en réalité un tableau d'objets Color

    ----
    // TODO list
    ----
    - pkexec /.../tccd --new_XXX : comment créer / vérifier l'effet de ces options ?
    - Ctrl F 'TODO'
    - SINGLE profile back-end connection : don't care yet about the others
        not working yet : check whole python code
    - single color change
    - brightness change (see ui fork)
    - TccDBusController.ts : add getters for current keyboard state ?
    - other features from backlight python
       -> config-keyboard-backlight.service.ts : ajouter un set de méthodes complet
    - tests unitaires (*.spec.ts)
    - nettoyer le code
        component
        tccprofile
        config
        confighandler
        utils.service.ts
        tcc-dbus-client.service.ts
        tccDBusService.ts
    - bonus esthétiques
    - détection de compatibilité -> affichage dynamique des options
    - raccourcis clavier? 
    */

    constructor(
        private utils: UtilsService,
        private config: ConfigServiceKeyboardBacklight
    ) { }

    ngOnInit() {


        this.availableColors = new Array<Color>();
        /*
        this.profiles = new Array<LightProfile>();
        //this.allowDeviceSettingsChange();

        // demo
        this.addProfile(new LightProfile("jacky","false","tuning","bip","bip","00FF00","bip","bip","bip","bip"));
        this.addProfile(new LightProfile("michel","true","zouba","bip","bip","00FFFF","bip","bip","bip","bip"));
        this.addProfile(new LightProfile("serge","true","de la compta","bip","bip","FFA500","bip","bip","bip","bip"));

        this.updateProfiles(); // includes selectedProfile initialisation
        this.inputProfile = this.selectedProfile.id;
        */
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
        this.config
        //this.setDeviceParam(this.selectedProfile.params.color_left, this.selectedProfile.uniqueColor);
        
    }


    

    public genDefaultColors(): Array<Color> {
        
        let colors = new Array<Color>()
        const labels: string[] = Object.keys(defaultColors)
        const hexCodes: string[] = Object.values(defaultColors)
        
        for(let i = 0; i < labels.length; i++){
            colors.push(new Color(labels[i], hexCodes[i]))
        }
        return colors
    }

    // les fonctions writeFile

    public async buttonSetupPerm() {
        
        try {
            this.allowDeviceSettingsChange();
        } catch (err) {
            this.popUp('setup perm',err + ' \n---\n ' + err.toString())
            throw err;
        }
    }

    public async buttonWriteFileAsync(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile('/sys/devices/platform/tuxedo_keyboard/color_left', 'ffffff', (err) => {
                if (err) {
                    this.popUp('writeFileAsync',err + ' \n---\n ' + err.toString())
                    reject(err)
                } else {
                    resolve();
                }
            });
        });
    }

    public buttonWriteFileSync(){
        try {
            fs.writeFileSync('/sys/devices/platform/tuxedo_keyboard/color_left', 'ffffff');
        } catch (err) {
            this.popUp('writeFileSync',err + ' \n---\n ' + err.toString())
            throw err;
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

/*
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

    


    ///////////////////   BACK-END : tuxedo-keyboard driver & conf files settings   //////////////////////////////////////////////////////////

    // python source : https://github.com/webketje/tuxedo-backlight-control
    //  + fork (brightness control) : https://github.com/encarsia/tuxedo-backlight-control
    // let the user pick a file by hand : https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle


    

    public setDeviceParam(par: string, value: string){
        // write driver param value to this.confPaths.DEVICE_PATH, i.e. '/sys/devices/platform/tuxedo_keyboard/'
        // those parameters are simple strings : 'e95420', '75', '1'
        if(Object.values(this.params).includes(par)){
            this.config.writeConfig(value, this.confPaths.DEVICE_PATH + par, { mode: this.fileMod })
        }
        else return 'error'
    }

    public getDeviceParam(par: string): string{
        // read driver param value directly from this.confPaths.DEVICE_PATH, i.e. '/sys/devices/platform/tuxedo_keyboard/'
        if(Object.values(this.params).includes(par)){
            if(fs.existsSync(this.confPaths.DEVICE_PATH + par)){
                return this.config.readConfig<string>(this.confPaths.DEVICE_PATH + par)
            }
            else return 'error'
        }
        else return 'error'
    }
*/
    /* FILE WRITING TRACE ////////////////////////////////////////////////////////////////

    global-settings.component.html
        <mat-checkbox #inputCPUSettings
            color="primary"
            [(ngModel)]="cpuSettingsEnabled"
            (change)="onCPUSettingsEnabledChanged($event)">
        </mat-checkbox>

    global-settings.component.ts :
    -> onCPUSettingsEnabledChanged(event: any)
        this.config.saveSettings().then(success => {
            if (!success) {
                this.config.getSettings().cpuSettingsEnabled = !event.checked;
            }  
            this.cpuSettingsEnabled = this.config.getSettings().cpuSettingsEnabled
            this.utils.pageDisabled = false;
        });
    
    private config: ConfigService
    -> saveSettings() --> pkexecWriteConfigAsync()
    
    -> configHandler !!
    
    */////////////////////////////////////////////////////////////////



    
    private async allowDeviceSettingsChange(){
        const userName = (await this.utils.execCmd('whoami')).toString()
        let cmdCd = 'cd '+ TccPaths.KB_DRIVER_DIR;
        let cmdChmod = ' sudo chmod a+w ';
        let cmdChown = ' sudo chown ' + userName + ' ';
        let cmdChgrp = ' sudo chgrp ' + userName + ' ';
        const fileNameList: string[] = [
            params.brightness,
            params.color_center,
            params.color_extra,
            params.color_left,
            params.color_right,
            params.mode,
            params.state
        ]

        fileNameList.forEach(fileName => {
            cmdChmod += fileName + ' ';
            cmdChown += fileName + ' ';
            cmdChgrp += fileName + ' ';
        });
        cmdChmod +=  cmdCd + ' && ' + cmdChmod;
        cmdChown +=  cmdCd + ' && ' + cmdChown;
        cmdChgrp +=  cmdCd + ' && ' + cmdChgrp;

        //oneliner += cmdChgrp + cmdChmod + cmdChown
        //oneliner = oneliner.slice(0, -4); // remove the tailing " && "

        
        try {
            //this.utils.execCmd(`pkexec /bin/sh -c --user root "` + oneliner + `"`);
            this.utils.execCmd(cmdChmod);
            this.popUp('chmod : ok ?',cmdChmod)
        } catch (err) {
            this.popUp('chmod : failure',cmdChmod + ' \n---\n ' + err.toString())
            throw err;
        }
        try {
            //this.utils.execCmd(`pkexec /bin/sh -c --user root "` + oneliner + `"`);
            this.utils.execCmd(cmdChown);
            this.popUp('chown : ok ?',cmdChown)
        } catch (err) {
            this.popUp('chown : failure',cmdChown + ' \n---\n ' + err.toString())
            throw err;
        }
        try {
            //this.utils.execCmd(`pkexec /bin/sh -c --user root "` + oneliner + `"`);
            this.utils.execCmd(cmdChgrp);
            this.popUp('chgrp : ok ?',cmdChgrp)
        } catch (err) {
            this.popUp('chgrp : failure',cmdChgrp + ' \n---\n ' + err.toString())
            throw err;
        }
    }
    

    

    /*

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

    
    public writeConfig<T>(config: T, filePath: string, writeFileOptions: any): void {
        const fileData = JSON.stringify(config);
        try {
            if (!fs.existsSync(path.dirname(filePath))) {
                // this should never happen, as tuxedo-keyboard is included in tuxedo-control-center
                fs.mkdirSync(path.dirname(filePath), { mode: 0o644, recursive: true });
            }
            fs.writeFileSync(filePath, fileData, writeFileOptions);

            
            const bashCommand = 'rm -f '+ filePath +' && cat '+ fileData +' > '+ filePath // rm : operation not allowed
            this.utils.execCmd(`pkexec /bin/sh -c "` + bashCommand + `"`).then(() => {
                this.popUp('write','success : '+bashCommand);
                
                // this.successtext_cryptsetup = $localize `:@@cryptfinishprocess:Crypt password changed successfully`;
                // this.errortext_cryptsetup = '';
            }).catch(() => {
                this.popUp('write','failure : '+bashCommand);
    
                // this.successtext_cryptsetup = '';
                // this.errortext_cryptsetup = $localize `:@@errornewpassword:Error: Could not change crypt password (wrong old crypt password?)`;
            });
            

            //test
            //this.popUp('write success',filePath +' = '+ fileData);
        } catch (err) {
            //test
            this.popUp('write error',filePath +' <-- '+ fileData +' : '+ err.toString());

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
    
    private userConfigDirExists(dir: string): boolean {
        try {
            return fs.existsSync(dir);
        } catch (err) {
            return false;
        }
    }
    
    private createUserConfigDir(dir: string): boolean {
        try {
            fs.mkdirSync(dir);
            return true;
        } catch (err) {
            return false;
        }
    }
    */
}