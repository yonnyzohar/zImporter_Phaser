import * as PIXI from "pixi.js";
import { NineSliceData, OrientationData } from "./SceneData";
export declare class ZNineSlice extends PIXI.NineSlicePlane {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    constructor(texture: PIXI.Texture, nineSliceData: NineSliceData, orientation: string);
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    private applyTransform;
}
//# sourceMappingURL=ZNineSlice.d.ts.map