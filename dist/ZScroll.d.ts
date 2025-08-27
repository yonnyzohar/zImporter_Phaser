import { Graphics } from "pixi.js";
import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";
interface DragEvent extends FederatedPointerEvent {
    global: Point;
}
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    dragStartY: number;
    beedStartY: number;
    isDragging: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Graphics | null;
    scrollArea: Graphics | null;
    private onPointerDownBinded;
    private onPointerMoveBinded;
    private onPointerUpBinded;
    private onWheelBinded;
    init(): void;
    private calculateScrollBar;
    addEventListeners(): void;
    removeEventListeners(): void;
    onPointerDown(event: DragEvent): void;
    onWheel(event: WheelEvent): void;
    onPointerMove(event: DragEvent): void;
    onPointerUp(): void;
    applyTransform(): void;
}
export {};
//# sourceMappingURL=ZScroll.d.ts.map