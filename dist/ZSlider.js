import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth = 0;
    callback;
    handle;
    track;
    init() {
        super.init();
        this.handle = this.getByName('handle');
        this.track = this.getByName('track');
        if (!this.handle || !this.track) {
            console.error("ZSlider is missing handle or track");
            return;
        }
        this.sliderWidth = this.track.width;
        this.handle.setInteractive({ draggable: true, cursor: 'pointer' });
        this.handle.on(Phaser.Input.Events.DRAG_START, this.onDragStart, this);
        this.handle.on(Phaser.Input.Events.DRAG, this.onDrag, this);
        this.handle.on(Phaser.Input.Events.DRAG_END, this.onDragEnd, this);
        // Make the handle draggable within the track bounds
        this.scene.input.setDraggable(this.handle);
    }
    setHandlePosition(t) {
        this.handle.x = t * this.sliderWidth;
        if (this.callback)
            this.callback(t);
    }
    setCallback(callback) {
        this.callback = callback;
    }
    removeCallback() {
        this.callback = undefined;
    }
    onDragStart(pointer) {
        this.dragging = true;
    }
    onDrag(pointer, dragX, dragY) {
        // Local coordinates relative to the slider container
        const localX = Phaser.Math.Clamp(dragX - this.x, 0, this.sliderWidth);
        this.handle.x = localX;
        const t = this.handle.x / this.sliderWidth;
        if (this.callback)
            this.callback(t);
    }
    onDragEnd(pointer) {
        this.dragging = false;
    }
}
//# sourceMappingURL=ZSlider.js.map