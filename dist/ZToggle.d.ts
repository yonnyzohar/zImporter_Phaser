import { ZState } from "./ZState";
export declare class ZToggle extends ZState {
    private callback?;
    toggleCallback?: (state: boolean) => void;
    init(): void;
    setCallback(func: (t: boolean) => void): void;
    removeCallback(): void;
    setIsClickable(val: boolean): void;
    isOn(): boolean;
    toggle(state: boolean, sendCallback?: boolean): void;
    enable(): void;
    disable(): void;
    setLabelOnAllStates(label: string, str: string): void;
    getType(): string;
}
//# sourceMappingURL=ZToggle.d.ts.map