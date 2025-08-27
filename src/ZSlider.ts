import Phaser from "phaser";
import { ZContainer } from "./ZContainer";

export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth: number | undefined = 0;
    callback?: (t: number) => void;

    private handle!: ZContainer;
    private track!: ZContainer;

    init() {
        super.init();

        this.handle = this.getByName('handle') as ZContainer;
        this.track = this.getByName('track') as ZContainer;

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

    setHandlePosition(t: number) {
        this.handle.x = t * this.sliderWidth!;
        if (this.callback) this.callback(t);
    }

    setCallback(callback: (t: number) => void) {
        this.callback = callback;
    }

    removeCallback() {
        this.callback = undefined;
    }

    private onDragStart(pointer: Phaser.Input.Pointer) {
        this.dragging = true;
    }

    private onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
        // Local coordinates relative to the slider container
        const localX = Phaser.Math.Clamp(dragX - this.x, 0, this.sliderWidth!);

        this.handle.x = localX;

        const t = this.handle.x / this.sliderWidth!;
        if (this.callback) this.callback(t);
    }

    private onDragEnd(pointer: Phaser.Input.Pointer) {
        this.dragging = false;
    }
}
