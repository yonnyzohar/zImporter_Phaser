import { ZContainer } from "./ZContainer";
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number | undefined;
    callback?: (t: number) => void;
    private handle;
    private track;
    init(): void;
    setHandlePosition(t: number): void;
    setCallback(callback: (t: number) => void): void;
    removeCallback(): void;
    private onDragStart;
    private onDrag;
    private onDragEnd;
}
//# sourceMappingURL=ZSlider.d.ts.map