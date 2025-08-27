import { ZContainer } from "./ZContainer";
/**
 * Stateful container for Phaser.
 * Only one child is visible at a time; all others are hidden.
 * Supports ZTimeline children (play/stop automatically on state switch).
 */
export declare class ZState extends ZContainer {
    protected currentState: ZContainer | null;
    init(): void;
    getCurrentState(): ZContainer | null;
    hasState(str: string): boolean;
    getAllStateNames(): string[];
    setViewState(str: string): ZContainer | null;
}
//# sourceMappingURL=ZState.d.ts.map