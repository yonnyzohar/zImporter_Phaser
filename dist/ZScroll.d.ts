import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    dragStartY: number;
    beedStartY: number;
    isDragging: boolean;
    isBeedDragging: boolean;
    scrollingEnabled: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Phaser.GameObjects.Graphics | null;
    scrollArea: Phaser.GameObjects.Graphics | null;
    init(): void;
    getType(): string;
    private calculateScrollBar;
    private enableChildPassThrough;
    addEventListeners(): void;
    removeEventListeners(): void;
    removeListeners(): void;
    private onPointerDown;
    private onBeedDown;
    private onPointerMove;
    private onPointerUp;
    private onBeedUp;
    private onWheel;
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map