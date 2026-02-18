import Phaser from "phaser";
import { NineSliceData, OrientationData } from "./SceneData";

export class ZNineSlice extends Phaser.GameObjects.NineSlice {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    private _nineSliceData: NineSliceData;

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
            texture,
            frame,
            nineSliceData.width,
            nineSliceData.height,
            nineSliceData.left,
            nineSliceData.right,
            nineSliceData.top,
            nineSliceData.bottom
        );

        this._nineSliceData = nineSliceData;
        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;

        // Origin (0,0) = top-left, matching Flash/Animate coordinate convention
        this.setOrigin(0, 0);
        this.applyTransform();

        scene.add.existing(this);
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    public applyTransform() {
        if (!this.currentTransform) return;

        // Size — use orientation-specific width/height with fallback to top-level data
        const w = this.currentTransform.width || this._nineSliceData?.width || 1;
        const h = this.currentTransform.height || this._nineSliceData?.height || 1;
        this.setSize(w, h);

        // Position — subtract parent container's pivot, mirroring ZContainer.applyTransform()
        const parentTransform = (this.parentContainer as any)?.currentTransform;
        const parentPivotX = parentTransform?.pivotX || 0;
        const parentPivotY = parentTransform?.pivotY || 0;
        this.setPosition(
            (this.currentTransform.x || 0) - parentPivotX,
            (this.currentTransform.y || 0) - parentPivotY
        );

        // Scale, rotation, alpha, visibility
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.visible = this.currentTransform.visible !== false;
    }
}

