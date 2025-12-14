import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";

/**
 * Stateful container for Phaser.
 * Only one child is visible at a time; all others are hidden.
 * Supports ZTimeline children (play/stop automatically on state switch).
 */

export class ZState extends ZContainer {
    public currentState: ZContainer | null = null;

    // Called once all children are added to the container
    public init(): void {
        this.setViewState("idle");
    }

    public getCurrentState(): ZContainer | null {
        return this.currentState;
    }

    public hasState(str: string): boolean {
        return this.getChildByName(str) !== null;
    }

    public setViewState(str: string): ZContainer | null {
        let chosenChild = this.get(str) as ZContainer;
        if (!chosenChild) {
            chosenChild = this.get("idle") as ZContainer;
            if (!chosenChild && this.list.length > 0) {
                chosenChild = this.list[0] as ZContainer;
            }
        }
        if (this.list) {
            for (let i = 0; i < this.list.length; i++) {
                let child = this.list[i];
                (child as Phaser.GameObjects.Container).visible = false;
                if (child instanceof ZTimeline) {
                    (child as ZTimeline).stop();
                }
            }
        }
        if (chosenChild) {
            chosenChild.visible = true;
            this.currentState = chosenChild;
            if (chosenChild.parentContainer) {
                chosenChild.parentContainer.bringToTop(chosenChild);
            }
            if (chosenChild instanceof ZTimeline) {
                (chosenChild as ZTimeline).play();
            }
            return chosenChild;
        }
        return null;
    }

    public getAllStateNames(): (string | null)[] {
        return this.list.map((child) => child.name);
    }

    public getType(): string {
        return "ZState";
    }
}
