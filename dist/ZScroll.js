import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export class ZScroll extends ZContainer {
    scrollBarHeight = 0;
    contentHeight = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    beed;
    scrollBar;
    scrollContent;
    msk = null;
    scrollArea = null;
    init() {
        super.init();
        this.beed = this.getByName("beed");
        this.scrollBar = this.getByName("scrollBar");
        this.scrollContent = this.getByName("scrollContent");
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn("ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children.");
            return;
        }
        this.calculateScrollBar();
    }
    calculateScrollBar() {
        this.removeEventListeners();
        if (!this.scrollBar)
            return;
        this.scrollBarHeight = this.scrollBar.height;
        this.contentHeight = this.scrollContent.height;
        if (this.contentHeight <= this.scrollBarHeight) {
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }
        else {
            this.scrollBar.setVisible(true);
            const w = this.scrollBar.x - this.scrollContent.x;
            // Mask
            if (!this.msk) {
                this.msk = this.scene.add.graphics();
                this.add(this.msk);
            }
            this.msk.clear();
            this.msk.fillStyle(0xffffff, 1);
            this.msk.fillRect(0, 0, w, this.scrollBarHeight);
            this.scrollContent.setMask(this.msk.createGeometryMask());
            // Scroll area
            if (!this.scrollArea) {
                this.scrollArea = this.scene.add.graphics();
                this.addAt(this.scrollArea, 0);
            }
            this.scrollArea.clear();
            this.scrollArea.fillStyle(0x000000, 0.001); // invisible hit area
            this.scrollArea.fillRect(0, 0, w, this.scrollBarHeight);
            this.scrollArea.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, this.scrollBarHeight), Phaser.Geom.Rectangle.Contains);
            this.scrollContent.y = 0;
            this.scrollBar.y = 0;
            this.addEventListeners();
        }
    }
    addEventListeners() {
        if (this.scrollArea) {
            this.scrollArea.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
        }
        this.scene.input.on("wheel", this.onWheel, this);
    }
    removeEventListeners() {
        if (this.scrollArea) {
            this.scrollArea.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.scrollArea.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
            this.scrollArea.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.scrollArea.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
        }
        this.scene.input.off("wheel", this.onWheel, this);
    }
    onPointerDown(pointer) {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = pointer.worldY;
        this.beedStartY = this.beed.y;
    }
    onWheel(pointer, dx, dy, dz, event) {
        let delta = -dy * 0.5;
        this.scrollBarHeight = this.scrollBar.height;
        this.beed.y -= delta;
        if (this.beed.y < 0)
            this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height)
            this.beed.y = this.scrollBarHeight - this.beed.height;
        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);
        event.stopPropagation();
    }
    onPointerMove(pointer) {
        if (this.isDragging) {
            const currentY = pointer.worldY;
            const deltaY = this.dragStartY - currentY;
            this.beed.y = this.beedStartY + deltaY;
            // Clamp
            if (this.beed.y < 0)
                this.beed.y = 0;
            if (this.beed.y > this.scrollBarHeight - this.beed.height)
                this.beed.y = this.scrollBarHeight - this.beed.height;
            // Update scrollContent.y
            const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
            this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);
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
//# sourceMappingURL=ZScroll.js.map