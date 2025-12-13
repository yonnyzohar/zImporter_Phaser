import Phaser from "phaser";
import { ZContainer } from "./ZContainer";


export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth: number | undefined = 0;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;

    handle!: ZContainer;
    track!: ZContainer;

    init() {
        super.init();

        this.handle = this.getByName('handle') as ZContainer;
        this.track = this.getByName('track') as ZContainer;
        if (!this.handle || !this.track) {
            console.error("ZSlider is missing handle or track");
            return;
        }

        this.sliderWidth = this.track.width;
        this.onDragStartBinded = this.onDragStart.bind(this);
        this.onDragEndBinded = this.onDragEnd.bind(this);
        this.onDragBinded = this.onDrag.bind(this);

        this.handle.setInteractive({ cursor: 'pointer' });
        this.handle.on('pointerdown', this.onDragStartBinded);
        this.handle.on('touchstart', this.onDragStartBinded);
    }

    public getType(): string {
        return "ZSlider";
    }

    setHandlePosition(t: number) {
        this.handle.x = t * this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
    }

    setCallback(callback: (t: number) => void) {
        this.callback = callback;
    }

    removeCallback() {
        this.callback = undefined;
    }

    onDragStart(e: any) {
        this.dragging = true;
        this.handle.on('pointerup', this.onDragEndBinded);
        this.handle.on('pointerupoutside', this.onDragEndBinded);
        this.handle.on('touchend', this.onDragEndBinded);
        this.handle.on('touchendoutside', this.onDragEndBinded);
        window.addEventListener('pointerup', this.onDragEndBinded);
        window.addEventListener('touchend', this.onDragEndBinded);
        window.addEventListener('pointermove', this.onDragBinded);
        window.addEventListener('touchmove', this.onDragBinded);
    }

    onDragEnd(e: any) {
        this.dragging = false;
        this.handle.off('pointerup', this.onDragEndBinded);
        this.handle.off('pointerupoutside', this.onDragEndBinded);
        this.handle.off('touchend', this.onDragEndBinded);
        this.handle.off('touchendoutside', this.onDragEndBinded);
        window.removeEventListener('pointerup', this.onDragEndBinded);
        window.removeEventListener('touchend', this.onDragEndBinded);
        window.removeEventListener('pointermove', this.onDragBinded);
        window.removeEventListener('touchmove', this.onDragBinded);
    }

    onDrag(e: any): void {
        let clientX: number | undefined;
        if (e && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else if (e && typeof e.clientX === 'number') {
            clientX = e.clientX;
        }
        if (clientX === undefined) return;

        // Convert global X to local X in handle's parent
        const parent = this.handle.parentContainer || this;
        const bounds = parent.getBounds();
        const localX = Phaser.Math.Clamp(clientX - bounds.x, 0, this.sliderWidth!);
        this.handle.x = localX;
        const t = this.handle.x / this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
        if (e.stopPropagation) e.stopPropagation();
    }
}
