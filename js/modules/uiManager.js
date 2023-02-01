import { Notification } from "./notification.js";

class Spinner
{
    constructor(){
        this.spinner = $(".spinner");
    }
    show(){
        this.spinner.show();
    }
    hide(){
        this.spinner.hide();
    }
}

export class UIManager {
  constructor() {
    this.spinner = new Spinner();
    this.alertOk = (text) => {
        return new Notification(text, {
            background: "linear-gradient(to right, #00b09b, #96c93d)"
        }).show();
    };
    this.alertError = (text) => {
        return new Notification(text, {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)"
        }).show();
    };
  }
}
