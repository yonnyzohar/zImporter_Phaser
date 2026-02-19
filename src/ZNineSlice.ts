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
            // Clamp slice values so they never exceed half the target dimension.
            // Phaser enforces width >= leftWidth + rightWidth and height >= topHeight + bottomHeight,
            // so un-clamped values (e.g. left=40 on a 5px-wide scrollbar) produce a minimum of 80px.
            Math.min(nineSliceData.left, Math.floor(nineSliceData.width / 2)),
            Math.min(nineSliceData.right, Math.floor(nineSliceData.width / 2)),
            Math.min(nineSliceData.top, Math.floor(nineSliceData.height / 2)),
            Math.min(nineSliceData.bottom, Math.floor(nineSliceData.height / 2))
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

        // Clamp slice values to half the target dimension before calling setSize.
        // Phaser enforces width >= leftWidth + rightWidth, so without clamping a
        // narrow element (e.g. a 5px scrollbar track with left=40, right=40) would
        // be forced to 80px wide.
        // TS types mark these readonly but they are plain properties at runtime.
        (this as any).leftWidth = Math.min(this._nineSliceData.left, Math.floor(w / 2));
        (this as any).rightWidth = Math.min(this._nineSliceData.right, Math.floor(w / 2));
        (this as any).topHeight = Math.min(this._nineSliceData.top, Math.floor(h / 2));
        (this as any).bottomHeight = Math.min(this._nineSliceData.bottom, Math.floor(h / 2));

        this.setSize(w, h);

        // Position — mirror ZContainer.applyTransform(): subtract parent container's
        // pivotX/Y (if it has one) so that when the parent's setOrigin() and this
        // applyTransform() both run during resize, they agree on the same position.
        const scaleX = this.currentTransform.scaleX || 1;
        const scaleY = this.currentTransform.scaleY || 1;
        const ownPivotX = this.currentTransform.pivotX || 0;
        const ownPivotY = this.currentTransform.pivotY || 0;
        const parentContainer = this.parentContainer as any;
        const parentPivotX = (parentContainer?.currentTransform?.pivotX) || 0;
        const parentPivotY = (parentContainer?.currentTransform?.pivotY) || 0;
        this.setPosition(
            (this.currentTransform.x || 0) - scaleX * ownPivotX - parentPivotX,
            (this.currentTransform.y || 0) - scaleY * ownPivotY - parentPivotY
        );

        // Scale, rotation, alpha, visibility
        this.setScale(scaleX, scaleY);
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.visible = this.currentTransform.visible !== false;
    }
}

