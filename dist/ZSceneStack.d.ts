import { ZContainer } from "./ZContainer";
import { ZScene } from "./ZScene";
/**
 * Manages a stack of `ZScene` instances, providing static methods to manipulate the stack.
 *
 * This class allows pushing, popping, peeking, and clearing scenes from the stack.
 * It also provides utility methods to spawn entities from the topmost scene and resize all scenes in the stack.
 *
 * @remarks
 * - The stack is implemented as a static array, so all operations affect the global stack.
 * - The stack size and top index are tracked separately for efficient access.
 *
 * @public
 */
export declare class ZSceneStack {
    private static stack;
    private static stackSize;
    private static top;
    static push(resource: ZScene): void;
    static pop(): ZScene | null;
    static peek(): ZScene | null;
    static getStackSize(): number;
    static clear(): void;
    static spawn(templateName: string): ZContainer | undefined;
    static resize(width: number, height: number): void;
}
//# sourceMappingURL=ZSceneStack.d.ts.map