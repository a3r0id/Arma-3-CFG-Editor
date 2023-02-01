import {AceInstance} from './aceEditor.js';
import {UIManager} from './uiManager.js';

class LocalDB{
    constructor(){
        this.db = localStorage;
    }
    set(key, value){
        return this.db.setItem(key, JSON.stringify(value));
    }
    get(key){
        return this.db.getItem(key);
    }
}

export class App
{
    constructor(){
        this.ace  = new AceInstance();   // ace editor instance
        this.file = null;                // file handle
        this.db   = new LocalDB();       // local database
        this.ui   = new UIManager();     // ui manager
        this.loadLastFile();
    }
    loadCurrentFile(){
        this.ace.editor.session.setValue(this.file);
        this.db.set('lastFileLoaded', {text: this.file, time: Date.now()});
    }
    loadLastFile(){
        let lastFile = this.db.get('lastFileLoaded');
        if(lastFile){
            lastFile = JSON.parse(lastFile);
            this.file = lastFile.text;
            this.loadCurrentFile();
        }
    }
}