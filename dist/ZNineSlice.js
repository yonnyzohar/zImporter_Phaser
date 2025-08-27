import * as PIXI from "pixi.js";
export class ZNineSlice extends PIXI.NineSlicePlane {
    portrait;
    landscape;
    currentTransform;
    constructor(texture, nineSliceData, orientation) {
        super(texture, nineSliceData.left, nineSliceData.right, nineSliceData.top, nineSliceData.bottom);
        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    applyTransform() {
        this.width = this.currentTransform.width;
        this.height = this.currentTransform.height;
    }
}
//# sourceMappingURL=ZNineSlice.js.map