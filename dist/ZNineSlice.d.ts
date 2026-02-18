import Phaser from "phaser";
import { NineSliceData, OrientationData } from "./SceneData";
export declare class ZNineSlice extends Phaser.GameObjects.NineSlice {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    private _nineSliceData;
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame: string | number | undefined, nineSliceData: NineSliceData, orientation: "portrait" | "landscape");
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    applyTransform(): void;
}
//# sourceMappingURL=ZNineSlice.d.ts.map