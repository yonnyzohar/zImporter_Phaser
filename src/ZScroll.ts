import { Graphics } from "pixi.js";
import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";

interface DragEvent extends FederatedPointerEvent {
    global: Point;
}


export class ZScroll extends ZContainer {

    scrollBarHeight: number = 0;
    contentHeight: number = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Graphics | null = null;
    scrollArea: Graphics | null = null;

    private onPointerDownBinded: any;
    private onPointerMoveBinded: any;
    private onPointerUpBinded: any;
    private onWheelBinded: any;

    init() {
        super.init();

        this.onPointerDownBinded = this.onPointerDown.bind(this);
        this.onPointerMoveBinded = this.onPointerMove.bind(this);
        this.onPointerUpBinded = this.onPointerUp.bind(this);
        this.onWheelBinded = this.onWheel.bind(this);

        this.beed = this.getChildByName("beed") as ZContainer;
        this.scrollBar = this.getChildByName("scrollBar") as ZContainer;
        this.scrollContent = this.getChildByName("scrollContent") as ZContainer;
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn("ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children.");
            return;
        }
        this.calculateScrollBar();

    }

    private calculateScrollBar(): void {
        this.removeEventListeners();
        if (!this.scrollBar) return;
        let scrollBarHeight = this.scrollBar.height;
        let contentHeight = this.scrollContent.height;
        if (contentHeight <= scrollBarHeight) {
            this.scrollBar.visible = false;
            this.scrollContent.y = 0;
            return;
        } else {
            this.scrollBar.visible = true;

            let w = this.scrollBar.x - this.scrollContent.x;
            if (this.msk === null) {
                this.msk = new Graphics();
                this.addChild(this.msk);
            }
            this.msk.clear();
            this.msk.beginFill(0x000000, 0.5);
            this.msk.drawRect(0, 0, w, scrollBarHeight);
            this.msk.endFill();
            this.scrollContent.mask = this.msk;


            if (this.scrollArea === null) {
                this.scrollArea = new Graphics();

                this.addChildAt(this.scrollArea, 0);
            }
            this.scrollArea.clear();
            this.scrollArea.beginFill(0x000000, 0.5);
            this.scrollArea.drawRect(0, 0, w, scrollBarHeight);
            this.scrollArea.endFill();
            this.scrollArea.interactive = true;

            this.scrollContent.y = 0;
            this.scrollBar.y = 0;

            this.addEventListeners();
        }
    }



    addEventListeners(): void {
        if (this.scrollArea) {
            this.scrollArea!.on('pointerdown', this.onPointerDownBinded);
            this.scrollArea!.on('ontouchstart', this.onPointerDownBinded);
            this.scrollArea!.on('pointermove', this.onPointerMoveBinded);
            this.scrollArea!.on('ontouchmove', this.onPointerMoveBinded);
            this.scrollArea!.on('pointerup', this.onPointerUpBinded);
            this.scrollArea!.on('ontouchend', this.onPointerUpBinded);
            this.scrollArea!.on('pointerupoutside', this.onPointerUpBinded);
            this.scrollArea!.on('ontouchendoutside', this.onPointerUpBinded);
        }

        document.body.addEventListener('wheel', this.onWheelBinded);
    }

    removeEventListeners(): void {
        if (this.scrollArea) {
            this.scrollArea!.off('pointerdown', this.onPointerDownBinded);
            this.scrollArea!.off('ontouchstart', this.onPointerDownBinded);
            this.scrollArea!.off('pointermove', this.onPointerMoveBinded);
            this.scrollArea!.off('ontouchmove', this.onPointerMoveBinded);
            this.scrollArea!.off('pointerup', this.onPointerUpBinded);
            this.scrollArea!.off('ontouchend', this.onPointerUpBinded);
            this.scrollArea!.off('pointerupoutside', this.onPointerUpBinded);
            this.scrollArea!.off('ontouchendoutside', this.onPointerUpBinded);
        }

        document.body.removeEventListener('wheel', this.onWheelBinded);
    }

    onPointerDown(event: DragEvent) {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.data.global.y;
        this.beedStartY = this.beed.y;

    }

    onWheel(event: WheelEvent) {
        let delta = -event.deltaY * 0.5;
        this.scrollBarHeight = this.scrollBar.height;
        this.beed.y -= delta;
        if (this.beed.y < 0) this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height) this.beed.y = this.scrollBarHeight - this.beed.height;
        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);
        event.stopPropagation();
    }


    onPointerMove(event: DragEvent) {
        if (this.isDragging) {
            const currentY = event.data.global.y;
            const deltaY = this.dragStartY - currentY; // Invert direction

            this.beed.y = this.beedStartY + deltaY;

            // Clamp
            if (this.beed.y < 0) this.beed.y = 0;
            if (this.beed.y > this.scrollBarHeight - this.beed.height) this.beed.y = this.scrollBarHeight - this.beed.height;

            // Update scrollContent.y
            const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
            this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);

            event.stopPropagation();
        }
    }
    onPointerUp() {
        this.isDragging = false;
    }

    applyTransform() {
        super.applyTransform();
        this.calculateScrollBar();
    }
}