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
        this.setViewState("idle");
    }
    getCurrentState() {
        return this.currentState;
    }
    hasState(str) {
        return this.getChildByName(str) !== null;
    }
    /** Alias for setViewState — matches PIXI ZState API */
    setState(str) {
        if (typeof str === 'string') {
            this.setViewState(str);
        }
        return this;
    }
    setViewState(str) {
        let chosenChild = this.get(str);
        if (!chosenChild) {
            chosenChild = this.get("idle");
            if (!chosenChild && this.list.length > 0) {
                chosenChild = this.list[0];
            }
        }
        if (this.list) {
            for (let i = 0; i < this.list.length; i++) {
                let child = this.list[i];
                child.visible = false;
                if (child instanceof ZTimeline) {
                    child.stop();
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
                chosenChild.play();
            }
            return chosenChild;
        }
        return null;
    }
    getAllStateNames() {
        return this.list.map((child) => child.name);
    }
    getType() {
        return "ZState";
    }
}
//# sourceMappingURL=ZState.js.map