import {App} from './modules/app.js';
import { ConfigParser } from './modules/parser.js';

window.app          = new App();
window.config       = {};
window.parser       = null;

function bypassProp(event){
    event.preventDefault(); event.stopPropagation();
}

function updateParser(){
    window.app.ui.spinner.show();
    let parser    = new ConfigParser(app.ace.editor.session.getValue());
    window.config = parser.config;
    if (parser.buffer){
        console.warn("syntax error: " + parser.buffer);
        window.app.ui.alertError("Syntax Error: " + parser.buffer);
    }
    $("#tree-viewer").empty().simpleJson({ jsonObject: window.config });    
    //$(".simpleJson-collapsibleMarker").click();
    window.app.ui.spinner.hide();
}

function loadFile(event)
{
    bypassProp(event);
    window.app.ui.spinner.show();
    event.dataTransfer = event.originalEvent.dataTransfer;
    var reader = new FileReader();
    reader.onload = function(event){
        window.app.file = event.target.result;
        window.app.loadCurrentFile();
    };
    reader.readAsText(event.dataTransfer.files[0]);
    window.app.ui.spinner.hide();
};

app.ace.editor.on('change', updateParser);

$("html")
    .on("dragover", bypassProp)
    .on("drop", loadFile);

window.app.ui.spinner.show();
setTimeout(()=>{
    try{
        updateParser();
        window.app.ui.alertOk("Config file loaded");
    }catch(e){
        console.warn(e);
        window.app.ui.alertError("Error parsing config file");
    }
    window.app.ui.spinner.hide();
}, 1000);


$("#validate").on("click", ()=>{
    window.app.ui.spinner.show();
    try{
        updateParser();
    }catch(e){
        console.warn(e);
        let errorIndex = window.app.parser.buffer;
        if (errorIndex.length > 100){
            errorIndex = errorIndex.substring(0, 100) + "...";
        }
        window.app.ui.alertError("Error parsing config file near" + errorIndex);
    }
    window.app.ui.spinner.hide();
});

$("#export").on("click", ()=>{
    let configText = window.app.ace.editor.getValue();
    let blob = new Blob([configText], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "untitled.cfg");
});

$("#import").on("click", ()=>{
    $("#import-hidden").click();
});

$("#import-hidden").on("change", (e) => {  
    let reader    = new FileReader();
    reader.onload = function(event){
        window.app.file = event.target.result;
        window.app.loadCurrentFile();
        window.app.ui.alertOk("Config file imported");
    }
    reader.readAsText(e.target.files[0]);
})

function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        displayContents(contents);
    };
    reader.readAsText(file);
}
