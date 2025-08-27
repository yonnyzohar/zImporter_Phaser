import { ZContainer } from "./ZContainer";
/**
 * Represents a customizable button component extending ZContainer.
 * Handles different visual states (up, over, down, disabled) and user interactions.
 * Supports label display and animated feedback on click.
 */
export const RemoveClickListener = (container) => {
    container.removeAllListeners('click');
    container.removeAllListeners('tap');
};
export const AttachClickListener = (container, callback) => {
    container.interactive = true;
    container.interactiveChildren = true;
    container.on('click', callback);
    container.on('tap', callback);
};
export class ZButton extends ZContainer {
    topLabelContainer2;
    topLabelContainer;
    overState;
    overLabelContainer;
    overLabelContainer2;
    downState;
    downLabelContainer;
    downLabelContainer2;
    upState;
    upLabelContainer;
    upLabelContainer2;
    disabledState;
    disabledLabelContainer;
    disabledLabelContainer2;
    //methods
    onPointerDownBinded;
    onPointerUpBinded;
    onOutBinded;
    onOverBinded;
    onDownBinded;
    callback;
    longPressCallback;
    longPressTimer = null;
    LONG_PRESS_DURATION = 500; // in ms
    longPressFired = false;
    labelState = "none";
    init(_labelStr = "") {
        super.init();
        ////console.log("Button!");
        this.interactive = true;
        this.interactiveChildren = true;
        this.onPointerDownBinded = this.onPointerDown.bind(this);
        this.onPointerUpBinded = this.onPointerUp.bind(this);
        this.onOutBinded = this.onOut.bind(this);
        this.onOverBinded = this.onOver.bind(this);
        this.onDownBinded = this.onDown.bind(this);
        if (this.overState) {
            this.overLabelContainer = this.overState?.getChildByName("labelContainer");
            this.overLabelContainer2 = this.overState?.getChildByName("labelContainer2");
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState?.getChildByName("labelContainer");
            this.disabledLabelContainer2 = this.disabledState?.getChildByName("labelContainer2");
        }
        if (this.downState) {
            this.downLabelContainer = this.downState?.getChildByName("labelContainer");
            this.downLabelContainer2 = this.downState?.getChildByName("labelContainer2");
        }
        if (this.upState) {
            this.upLabelContainer = this.upState?.getChildByName("labelContainer");
            this.upLabelContainer2 = this.upState?.getChildByName("labelContainer2");
        }
        this.topLabelContainer = this.labelContainer;
        this.topLabelContainer2 = this.labelContainer2;
        //is this a button with a single label for all states or a label per state?
        if (this.topLabelContainer) {
            if (this.topLabelContainer2) {
                this.topLabelContainer2.visible = false;
            }
            this.topLabelContainer.visible = false;
            this.labelState = "single";
        }
        else {
            if (this.overState && this.disabledState && this.downState && this.upState) {
                if (this.overLabelContainer && this.disabledLabelContainer && this.downLabelContainer && this.upLabelContainer) {
                    this.labelState = "multi";
                }
            }
        }
        this.enable();
        this.onOut();
        this.on('mousedown', this.onPointerDownBinded);
        this.on('touchstart', this.onPointerDownBinded);
        this.on('mouseup', this.onPointerUpBinded);
        this.on('touchend', this.onPointerUpBinded);
        this.on('touchendoutside', this.onPointerUpBinded);
        this.on('mouseupoutside', this.onPointerUpBinded);
    }
    onPointerDown() {
        this.longPressFired = false;
        this.longPressTimer = setTimeout(() => {
            this.longPressFired = true;
            if (this.longPressCallback) {
                this.longPressCallback();
            }
        }, this.LONG_PRESS_DURATION);
    }
    ;
    onPointerUp() {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        if (!this.longPressFired) {
            this.onClicked();
        }
    }
    ;
    setLabel(name) {
        if (this.labelState === "single") {
            if (this.topLabelContainer) {
                this.topLabelContainer.visible = true;
                this.topLabelContainer.setText(name);
            }
        }
        if (this.labelState === "multi") {
            if (this.overLabelContainer) {
                this.overLabelContainer.visible = true;
                this.overLabelContainer.setText(name);
            }
            if (this.disabledLabelContainer) {
                this.disabledLabelContainer.visible = true;
                this.disabledLabelContainer.setText(name);
            }
            if (this.downLabelContainer) {
                this.downLabelContainer.visible = true;
                this.downLabelContainer.setText(name);
            }
            if (this.upLabelContainer) {
                this.upLabelContainer.visible = true;
                this.upLabelContainer.setText(name);
            }
        }
    }
    setLabel2(name) {
        if (this.labelState === "single") {
            if (this.topLabelContainer2) {
                this.topLabelContainer2.visible = true;
                this.topLabelContainer2.setText(name);
            }
        }
        if (this.labelState === "multi") {
            if (this.overLabelContainer2) {
                this.overLabelContainer2.visible = true;
                this.overLabelContainer2.setText(name);
            }
            if (this.disabledLabelContainer2) {
                this.disabledLabelContainer2.visible = true;
                this.disabledLabelContainer2.setText(name);
            }
            if (this.downLabelContainer2) {
                this.downLabelContainer2.visible = true;
                this.downLabelContainer2.setText(name);
            }
            if (this.upLabelContainer2) {
                this.upLabelContainer2.visible = true;
                this.upLabelContainer2.setText(name);
            }
        }
    }
    ;
    setCallback(func) {
        this.callback = func;
    }
    removeCallback() {
        this.callback = undefined;
    }
    setLongPressCallback(func) {
        this.longPressCallback = func;
    }
    removeLongPressCallback() {
        this.longPressCallback = undefined;
    }
    onClicked() {
        if (this.callback) {
            this.callback();
        }
    }
    enable() {
        this.cursor = "pointer";
        [this.upState, this.overState, this.downState].forEach((state) => {
            if (state) {
                state.cursor = "pointer";
            }
        });
        this.removeAllListeners();
        if (this.overState && this.upState) {
            this.overState.visible = false;
            this.on('mouseout', this.onOutBinded);
            this.on('mouseover', this.onOverBinded);
            this.on('touchendoutside', this.onOutBinded);
            this.on('touchend', this.onOutBinded);
            this.on('touchendoutside', this.onOutBinded);
        }
        if (this.downState && this.upState) {
            this.on('mousedown', this.onDownBinded);
            this.on('touchstart', this.onDownBinded);
            this.on('mouseup', this.onOutBinded);
            this.on('touchendoutside', this.onOutBinded);
            this.on('touchend', this.onOutBinded);
            this.on('touchendoutside', this.onOutBinded);
            this.downState.visible = false;
        }
        if (this.disabledState) {
            this.disabledState.visible = false;
        }
        if (this.upState) {
            this.upState.visible = true;
            this.addChild(this.upState);
            if (this.labelState === "single" && this.topLabelContainer) {
                this.addChild(this.topLabelContainer);
                this.topLabelContainer.visible = true;
                this.topLabelContainer.alpha = 1;
                if (this.topLabelContainer2) {
                    this.addChild(this.topLabelContainer2);
                    this.topLabelContainer2.visible = true;
                    this.topLabelContainer2.alpha = 1;
                }
            }
        }
    }
    disable() {
        this.cursor = "default";
        [this.upState, this.overState, this.downState].forEach((state) => {
            if (state) {
                state.cursor = "default";
            }
        });
        this.removeAllListeners();
        if (this.disabledState) {
            this.disabledState.visible = true;
            this.addChild(this.disabledState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 0.5;
        }
        if (this.topLabelContainer2) {
            this.addChild(this.topLabelContainer2);
            this.topLabelContainer2.alpha = 0.5;
        }
    }
    onDown() {
        if (this.overState) {
            this.overState.visible = false;
        }
        if (this.disabledState) {
            this.disabledState.visible = false;
        }
        if (this.upState && this.downState) {
            this.upState.visible = false;
        }
        if (this.downState && this.upState) {
            this.downState.visible = true;
            this.addChild(this.downState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 0.5;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 0.5;
            }
        }
    }
    onOut() {
        if (this.overState) {
            this.overState.visible = false;
        }
        if (this.upState) {
            this.upState.visible = true;
            this.addChild(this.upState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 1;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 1;
            }
        }
        ////console.log("onOut");
    }
    onOver() {
        if (this.overState) {
            this.overState.visible = true;
            this.addChild(this.overState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 1;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 1;
            }
        }
    }
}
//# sourceMappingURL=ZButton.js.map