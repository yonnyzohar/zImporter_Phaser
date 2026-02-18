import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export class ZScroll extends ZContainer {
    scrollBarHeight = 0;
    contentHeight = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    isBeedDragging = false;
    scrollingEnabled = true;
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
    getType() {
        return "ZScroll";
    }
    calculateScrollBar() {
        // Clean up old mask & scroll area before rebuilding
        if (this.msk) {
            this.msk.destroy();
            this.msk = null;
        }
        if (this.scrollArea) {
            this.scrollArea.destroy();
            this.scrollArea = null;
        }
        if (!this.scrollBar || !this.scrollContent) {
            return;
        }
        this.scrollBarHeight = this.scrollBar.height;
        this.contentHeight = this.scrollContent.height;
        if (this.contentHeight <= this.scrollBarHeight) {
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }
        this.scrollBar.setVisible(true);
        const w = this.scrollBar.x - this.scrollContent.x;
        // Mask
        this.msk = this.scene.add.graphics();
        this.add(this.msk);
        this.msk.clear();
        this.msk.fillStyle(0xffffff, 1);
        this.msk.fillRect(0, 0, w, this.scrollBarHeight);
        this.scrollContent.setMask(this.msk.createGeometryMask());
        // Scroll area
        this.scrollArea = this.scene.add.graphics();
        this.addAt(this.scrollArea, 0);
        this.scrollArea.clear();
        this.scrollArea.fillStyle(0x000000, 0.001); // invisible hit area
        this.scrollArea.fillRect(0, 0, w, this.scrollBarHeight);
        this.scrollArea.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, this.scrollBarHeight), Phaser.Geom.Rectangle.Contains);
        this.scrollContent.y = 0;
        this.scrollBar.y = 0;
        this.addEventListeners();
        this.enableChildPassThrough();
    }
    enableChildPassThrough() {
        // Allow buttons/toggles inside scrollContent to propagate events to scrollArea
        let scrollContent = this.scrollContent;
        let scrollArea = this.scrollArea;
        let types = ["ZToggle", "ZButton"];
        for (let type of types) {
            let allButtons = scrollContent.getAllOfType ? scrollContent.getAllOfType(type) : [];
            for (let i = 0; i < allButtons.length; i++) {
                let child = allButtons[i];
                child.on && child.on("pointerdown", (event) => { scrollArea && scrollArea.emit("pointerdown", event); });
                child.on && child.on("pointerup", (event) => { scrollArea && scrollArea.emit("pointerup", event); });
                child.on && child.on("pointermove", (event) => { scrollArea && scrollArea.emit("pointermove", event); });
            }
        }
    }
    addEventListeners() {
        this.removeEventListeners();
        if (this.scrollArea) {
            this.scrollArea.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.scrollArea.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
        }
        // Enable dragging beed directly
        if (this.beed) {
            this.beed.setInteractive();
            this.beed.on(Phaser.Input.Events.POINTER_DOWN, this.onBeedDown, this);
            this.beed.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
            this.beed.on(Phaser.Input.Events.POINTER_UP, this.onBeedUp, this);
            this.beed.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onBeedUp, this);
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
        if (this.beed) {
            this.beed.off(Phaser.Input.Events.POINTER_DOWN, this.onBeedDown, this);
            this.beed.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
            this.beed.off(Phaser.Input.Events.POINTER_UP, this.onBeedUp, this);
            this.beed.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onBeedUp, this);
        }
        this.scene.input.off("wheel", this.onWheel, this);
    }
    removeListeners() {
        this.removeEventListeners();
    }
    onPointerDown(pointer) {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = pointer.worldY;
        this.beedStartY = this.beed.y;
    }
    onBeedDown(pointer) {
        this.isBeedDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = pointer.worldY;
        this.beedStartY = this.beed.y;
    }
    onPointerMove(pointer) {
        if (this.isDragging || this.isBeedDragging) {
            const currentY = pointer.worldY;
            let deltaY = this.isDragging
                ? this.dragStartY - currentY // scroll area inverts direction
                : currentY - this.dragStartY; // beed is direct drag
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
    onBeedUp() {
        this.isBeedDragging = false;
    }
    onWheel(pointer, dx, dy, dz, event) {
        if (!this.scrollingEnabled)
            return;
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
    applyTransform() {
        super.applyTransform();
        this.calculateScrollBar();
    }
}
//# sourceMappingURL=ZScroll.js.map