import { ZContainer } from "./ZContainer";
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number | undefined;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;
    handle: ZContainer;
    track: ZContainer;
    init(): void;
    getType(): string;
    setHandlePosition(t: number): void;
    setCallback(callback: (t: number) => void): void;
    removeCallback(): void;
    onDragStart(e: any): void;
    onDragEnd(e: any): void;
    onDrag(e: any): void;
}
//# sourceMappingURL=ZSlider.d.ts.map