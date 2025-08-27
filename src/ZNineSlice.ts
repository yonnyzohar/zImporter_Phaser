import * as PIXI from "pixi.js";
import { NineSliceData, OrientationData } from "./SceneData";

export class ZNineSlice extends PIXI.NineSlicePlane {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;

    constructor(texture: PIXI.Texture, nineSliceData: NineSliceData, orientation: string) {
        super(texture, nineSliceData.left, nineSliceData.right, nineSliceData.top, nineSliceData.bottom);
        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    private applyTransform() {
        this.width = this.currentTransform.width;
        this.height = this.currentTransform.height;
    }
}