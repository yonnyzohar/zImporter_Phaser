import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    dragStartY: number;
    beedStartY: number;
    isDragging: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Phaser.GameObjects.Graphics | null;
    scrollArea: Phaser.GameObjects.Graphics | null;
    init(): void;
    private calculateScrollBar;
    addEventListeners(): void;
    removeEventListeners(): void;
    private onPointerDown;
    private onWheel;
    private onPointerMove;
    private onPointerUp;
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map