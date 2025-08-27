import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";

interface DragEvent extends FederatedPointerEvent {
    global: Point;
}

export class ZSlider extends ZContainer {
    // Slider specific properties and methods can be added here

    dragging = false;
    sliderWidth:number | undefined = 0;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;

    init() {
        super.init();

        const handle: ZContainer = this.get('handle') as ZContainer;
        const track: ZContainer = this.get('track') as ZContainer;
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

    setHandlePosition(t: number) {
        let handle = (this as any).handle;
        handle.x = t * this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
    };

    setCallback(callback: (t: number) => void) {
        this.callback = callback;
    }

    removeCallback() {
        this.callback = undefined;
    }


    onDragStart(e: DragEvent) {
        this.dragging = true;
        let handle = (this as any).handle;
        handle.on("pointermove", this.onDragBinded);
        // Or better: app.stage.on("pointermove", onDrag);
        handle.on("pointerup", this.onDragEndBinded);
        handle.on("pointerupoutside", this.onDragEndBinded);
        handle.on("touchend", this.onDragEndBinded);
        handle.on("touchendoutside", this.onDragEndBinded);
        handle.on("touchmove", this.onDragBinded);
    };

    onDragEnd(e: DragEvent){
        this.dragging = false;
        let handle = (this as any).handle;
        handle.off("pointermove", this.onDragBinded);
        handle.off("pointerup", this.onDragEndBinded);
        handle.off("pointerupoutside", this.onDragEndBinded);
        handle.off("touchend", this.onDragEndBinded);
        handle.off("touchendoutside", this.onDragEndBinded);
        handle.off("touchmove", this.onDragBinded);
    };

    onDrag(e: DragEvent): void{
        const global = e.data?.global;
        if (!global) return;

        const local = this.toLocal(global);
        let handle = (this as any).handle;
        handle.x = local.x;

        if (handle.x < 0) handle.x = 0;
        if (handle.x > this.sliderWidth!) handle.x = this.sliderWidth;

        const t = handle.x / this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
        e.stopPropagation();
    };

    
}