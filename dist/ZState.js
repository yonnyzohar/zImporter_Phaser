import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
/**
 * Stateful container for Phaser.
 * Only one child is visible at a time; all others are hidden.
 * Supports ZTimeline children (play/stop automatically on state switch).
 */
export class ZState extends ZContainer {
    currentState = null;
    // Called once all children are added to the container
    init() {
        this.setState("idle");
    }
    getCurrentState() {
        return this.currentState;
    }
    hasState(str) {
        return this.getChildByName(str) !== null;
    }
    getAllStateNames() {
        return this.list.map((child) => child.name);
    }
    setViewState(str) {
        let chosenChild = this.getChildByName(str);
        if (!chosenChild) {
            chosenChild = this.getChildByName("idle");
            if (!chosenChild) {
                chosenChild = this.list[0];
            }
        }
        // Hide all children and stop timelines
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i];
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
//# sourceMappingURL=ZState.js.map