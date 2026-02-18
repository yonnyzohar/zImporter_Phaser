import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export declare class ZScroll extends ZContainer {
    /** Height of the scroll track — ZScroll LOCAL space (not world space) */
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
    init(): void;
    getType(): string;
    private calculateScrollBar;
    addEventListeners(): void;
    removeEventListeners(): void;
    removeListeners(): void;
    private onScenePointerDown;
    private onPointerMove;
    private onPointerUp;
    private onWheel;
    /** Clamp beed to [0, scrollBarHeight - beedH] and sync scrollContent. All local space. */
    private clampAndSync;
    /** Convert world-space coords to ZScroll's local coordinate space. */
    private worldToLocal;
    /** Accumulated world Y-scale of this container (includes all parent scales). */
    private getWorldScaleY;
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map