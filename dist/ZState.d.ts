import { ZContainer } from "./ZContainer";
/**
 * Represents a stateful container that manages its child containers as states.
 * Extends the `ZContainer` class and provides methods to initialize, query, and switch between states.
 *
 * Each state is represented by a child container, and only the current state is visible at any time.
 * If the desired state is not found, it falls back to the "idle" state or the first child.
 *
 * Methods:
 * - `init()`: Initializes the state container by setting the current state to "idle".
 * - `getCurrentState()`: Returns the currently active state container or `null` if none is set.
 * - `hasState(str: string)`: Checks if a child state with the given name exists.
 * - `setState(str: string)`: Sets the current state to the child with the given name, hiding all others.
 *    If the state is a `ZTimeline`, it will be played or stopped accordingly.
 */
export declare class ZState extends ZContainer {
    protected currentState: ZContainer | null;
    init(): void;
    getCurrentState(): ZContainer | null;
    hasState(str: string): boolean;
    getAllStateNames(): (string | null)[];
    setState(str: string): ZContainer | null;
}
//# sourceMappingURL=ZState.d.ts.map