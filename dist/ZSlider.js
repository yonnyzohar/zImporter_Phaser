import { ZContainer } from "./ZContainer";
export class ZSlider extends ZContainer {
    // Slider specific properties and methods can be added here
    dragging = false;
    sliderWidth = 0;
    callback;
    onDragStartBinded;
    onDragEndBinded;
    onDragBinded;
    init() {
        super.init();
        const handle = this.get('handle');
        const track = this.get('track');
        if (!handle || !track) {
            console.error("ZSlider is missing handle or track");
            return;
        }
        this.sliderWidth = track.width;
        this.onDragStartBinded = this.onDragStart.bind(this);
        this.onDragEndBinded = this.onDragEnd.bind(this);
        this.onDragBinded = this.onDrag.bind(this);
        handle
            .on('pointerdown', this.onDragStartBinded).on('touchstart', this.onDragStartBinded)
            .cursor = 'pointer';
    }
    setHandlePosition(t) {
        let handle = this.handle;
        handle.x = t * this.sliderWidth;
        if (this.callback) {
            this.callback(t);
        }
    }
    ;
    setCallback(callback) {
        this.callback = callback;
    }
    removeCallback() {
        this.callback = undefined;
    }
    onDragStart(e) {
        this.dragging = true;
        let handle = this.handle;
        handle.on("pointermove", this.onDragBinded);
        // Or better: app.stage.on("pointermove", onDrag);
        handle.on("pointerup", this.onDragEndBinded);
        handle.on("pointerupoutside", this.onDragEndBinded);
        handle.on("touchend", this.onDragEndBinded);
        handle.on("touchendoutside", this.onDragEndBinded);
        handle.on("touchmove", this.onDragBinded);
    }
    ;
    onDragEnd(e) {
        this.dragging = false;
        let handle = this.handle;
        handle.off("pointermove", this.onDragBinded);
        handle.off("pointerup", this.onDragEndBinded);
        handle.off("pointerupoutside", this.onDragEndBinded);
        handle.off("touchend", this.onDragEndBinded);
        handle.off("touchendoutside", this.onDragEndBinded);
        handle.off("touchmove", this.onDragBinded);
    }
    ;
    onDrag(e) {
        const global = e.data?.global;
        if (!global)
            return;
        const local = this.toLocal(global);
        let handle = this.handle;
        handle.x = local.x;
        if (handle.x < 0)
            handle.x = 0;
        if (handle.x > this.sliderWidth)
            handle.x = this.sliderWidth;
        const t = handle.x / this.sliderWidth;
        if (this.callback) {
            this.callback(t);
        }
        e.stopPropagation();
    }
    ;
}
//# sourceMappingURL=ZSlider.js.map