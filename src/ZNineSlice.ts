import Phaser from "phaser";
import { NineSliceData, OrientationData } from "./SceneData";

export class ZNineSlice extends Phaser.GameObjects.NineSlice {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string | Phaser.Textures.Texture,
        frame: string | number | undefined,
        nineSliceData: NineSliceData,
        orientation: "portrait" | "landscape"
    ) {
        super(
            scene,
            x,
            y,
            texture,                 // ✅ this is the texture key, not width
            frame,                   // optional frame
            nineSliceData.width,     // initial width
            nineSliceData.height,    // initial height
            nineSliceData.left,
            nineSliceData.right,
            nineSliceData.top,
            nineSliceData.bottom
        );

        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;

        this.applyTransform();

        scene.add.existing(this);
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    private applyTransform() {
        this.setSize(this.currentTransform.width, this.currentTransform.height);
    }
}
