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
                this.stopAllSpineAnims(chosenChild);
            }
        }
        if (this.list) {
            for (let i = 0; i < this.list.length; i++) {
                let child = this.list[i];
                child.visible = false;
                if (child instanceof ZContainer) {
                    this.stopAllTimelines(child);
                    this.stopAllSpineAnims(child);
                }
            }
        }
        if (chosenChild) {
            chosenChild.visible = true;
            this.currentState = chosenChild;
            if (chosenChild.parentContainer) {
                chosenChild.parentContainer.bringToTop(chosenChild);
            }
            if (chosenChild instanceof ZContainer) {
                this.playSpines(chosenChild);
                this.playAllTimelines(chosenChild);
            }
            return chosenChild;
        }
        return null;
    }
    playAllTimelines(container) {
        if (container instanceof ZTimeline) {
            let t = container;
            if (t.playOnStart) {
                t.gotoAndPlay(0);
            }
        }
        else {
            for (let i = 0; i < container.list.length; i++) {
                let child = container.list[i];
                if (child instanceof ZContainer) {
                    this.playAllTimelines(child);
                }
            }
        }
    }
    stopAllTimelines(container) {
        if (container instanceof ZTimeline) {
            let t = container;
            t.stop();
        }
        else {
            for (let i = 0; i < container.list.length; i++) {
                let child = container.list[i];
                if (child instanceof ZContainer) {
                    this.stopAllTimelines(child);
                }
            }
        }
    }
    playSpines(container) {
        let spine = container.getSpine();
        if (spine && spine.state) {
            let spineData = container.getChildSpineData();
            if (spineData.playOnStart && spineData.playOnStart.value) {
                setTimeout(() => {
                    spine.animationState.setAnimation(0, spineData.playOnStart.animation, spineData.playOnStart.loop);
                }, 0);
            }
        }
        else {
            for (let i = 0; i < container.list.length; i++) {
                let child = container.list[i];
                if (child instanceof ZContainer) {
                    this.playSpines(child);
                }
            }
        }
    }
    stopAllSpineAnims(container) {
        let spine = container.getSpine();
        if (spine && spine.state) {
            spine.animationState.setEmptyAnimation(0, 0); // Sets empty (no animation) instantly
            spine.animationState.clearTracks(); // Clears any animations after
            spine.animationState.clearListeners(); // Optional: clears listeners
            spine.skeleton.setToSetupPose(); // ✅ Reset bones/slots to initial frame
            spine.update(0);
        }
        else {
            for (let i = 0; i < container.list.length; i++) {
                let child = container.list[i];
                if (child instanceof ZContainer) {
                    this.stopAllSpineAnims(child);
                }
            }
        }
    }
    getAllStateNames() {
        return this.list.map((child) => child.name);
    }
    getType() {
        return "ZState";
    }
}
//# sourceMappingURL=ZState.js.map