export class Notification
{
    constructor(text, style={}, duration=3000){
        this.text           = text;
        this.style          = style;
        this.duration       = duration;
        this.notification   = Toastify({
            text: this.text,
            duration: this.duration,
            close: true,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: this.style,
            onClick: function(){} 
        });
    }
    show(){
        this.notification.showToast();
    }
}