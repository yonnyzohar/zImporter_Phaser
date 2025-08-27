import * as PIXI from 'pixi.js';

export class ZBitmapTextField extends PIXI.BitmapText {


    setName(_name: string, placement: string = ""): void {
        this.name = _name;

        if (placement == "middle") {
            this.pivot.x = this.width * 0.5;
            this.pivot.y = this.height * 0.5;
        }
    }

    setText(str: string): void {

        ////console.log("setText " + str);
        this.text = str;
        
    }

    killMe(): void {
        this.parent?.removeChild(this);
    }
}

