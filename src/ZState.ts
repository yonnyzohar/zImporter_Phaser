import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";

/**
 * Stateful container for Phaser.
 * Only one child is visible at a time; all others are hidden.
 * Supports ZTimeline children (play/stop automatically on state switch).
 */
export class ZState extends ZContainer {
    protected currentState: ZContainer | null = null;

    // Called once all children are added to the container
    public init(): void {
        this.setState("idle");
    }

    public getCurrentState(): ZContainer | null {
        return this.currentState;
    }

    public hasState(str: string): boolean {
        return this.getChildByName(str) !== null;
    }

    public getAllStateNames(): string[] {
        return this.list.map((child) => child.name);
    }

    public setViewState(str: string): ZContainer | null {
        let chosenChild: ZContainer | null = this.getChildByName(str) as ZContainer;

        if (!chosenChild) {
            chosenChild = this.getChildByName("idle") as ZContainer;
            if (!chosenChild) {
                chosenChild = this.list[0] as ZContainer;
            }
        }

        // Hide all children and stop timelines
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i] as Phaser.GameObjects.Container;
            child.visible = false;
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }

        // Show chosen child and play timeline if applicable
        if (chosenChild) {
            chosenChild.visible = true;
            if (chosenChild instanceof ZTimeline) {
                chosenChild.play();
            }
        }

        this.currentState = chosenChild;

        // Bring chosen child to top of container
        if (chosenChild && chosenChild.parentContainer) {
            chosenChild.parentContainer.bringToTop(chosenChild);
        }

        return chosenChild;
    }
}
