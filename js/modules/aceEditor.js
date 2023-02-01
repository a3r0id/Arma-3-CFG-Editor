export class AceInstance
{
    constructor(){
        this.editor = ace.edit("ace-editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/javascript");
        this.editor.setAutoScrollEditorIntoView(true);
    }
}
