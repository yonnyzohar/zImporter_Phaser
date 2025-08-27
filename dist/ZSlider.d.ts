import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";
interface DragEvent extends FederatedPointerEvent {
    global: Point;
}
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number | undefined;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;
    init(): void;
    setHandlePosition(t: number): void;
    setCallback(callback: (t: number) => void): void;
    removeCallback(): void;
    onDragStart(e: DragEvent): void;
    onDragEnd(e: DragEvent): void;
    onDrag(e: DragEvent): void;
}
export {};
//# sourceMappingURL=ZSlider.d.ts.map