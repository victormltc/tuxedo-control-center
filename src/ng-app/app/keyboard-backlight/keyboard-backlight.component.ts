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

import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeHeapSnapshot } from 'process';
import { stringify } from 'querystring';
import { UtilsService } from '../utils.service';


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

@Component({
    selector: 'app-keyboard-backlight',
    templateUrl: './keyboard-backlight.component.html',
    styleUrls: ['./keyboard-backlight.component.scss']
})
export class KeyboardBacklightComponent implements OnInit {
    
    public selectedColor: Color = new Color('','');
    public availableColors: Array<Color>;
    public inputColor: string;
    
    public ctrlKeyboardColor: FormControl;


    //TODO
    /*
    - intégration des features backlight python
    - get values from profile data
    - comment afficher les cases de la bonne couleur ? peut-être avec une liste de couple {nom de la couleur / image de la couleur} comme dans l'ancienne gestion des langues
    - faire re-fonctionner l'icone
    - nettoyer le code
    */

    constructor(
        private utils: UtilsService
    ) { }

    ngOnInit() {
        this.availableColors=this.genDefaultColors();
        this.selectedColor=this.availableColors[4];
    }

    private genDefaultColors(): Array<Color> {
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

    public updateSelectedColor(){
        this.selectedColor=this.availableColors.find(color => this.inputColor === color.hex)
        //this.popUp(this.selectedColor.toString())
    }

    public async popUp(msg: string) {
        const dialogWindow = await this.utils.confirmDialog({
            title: "changement de couleur !",
            description: msg,
            buttonAbortLabel: "ok",
            buttonConfirmLabel: "dak"
        });
    }
}