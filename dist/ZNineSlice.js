import Phaser from "phaser";
export class ZNineSlice extends Phaser.GameObjects.NineSlice {
    portrait;
    landscape;
    currentTransform;
    constructor(scene, x, y, texture, frame, nineSliceData, orientation) {
        super(scene, x, y, texture, // ✅ this is the texture key, not width
        frame, // optional frame
        nineSliceData.width, // initial width
        nineSliceData.height, // initial height
        nineSliceData.left, nineSliceData.right, nineSliceData.top, nineSliceData.bottom);
        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        scene.add.existing(this);
    }
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    applyTransform() {
        this.setSize(this.currentTransform.width, this.currentTransform.height);
    }
}
//# sourceMappingURL=ZNineSlice.js.map