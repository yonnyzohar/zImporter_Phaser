import { ZContainer } from "./ZContainer";
export const RemoveClickListener = (container) => {
    container.removeListener('pointerdown');
};
export const AttachClickListener = (container, callback) => {
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', callback);
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
    // methods
    callback;
    longPressCallback;
    longPressTimer = null;
    LONG_PRESS_DURATION = 500;
    longPressFired = false;
    labelState = "none";
    init(_labelStr = "") {
        super.init?.();
        // enable input
        this.setInteractive({ useHandCursor: true });
        if (this.overState) {
            this.overLabelContainer = this.overState.getByName("labelContainer");
            this.overLabelContainer2 = this.overState.getByName("labelContainer2");
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getByName("labelContainer");
            this.disabledLabelContainer2 = this.disabledState.getByName("labelContainer2");
        }
        if (this.downState) {
            this.downLabelContainer = this.downState.getByName("labelContainer");
            this.downLabelContainer2 = this.downState.getByName("labelContainer2");
        }
        if (this.upState) {
            this.upLabelContainer = this.upState.getByName("labelContainer");
            this.upLabelContainer2 = this.upState.getByName("labelContainer2");
        }
        this.topLabelContainer = this.labelContainer;
        this.topLabelContainer2 = this.labelContainer2;
        // decide label type
        if (this.topLabelContainer) {
            this.labelState = "single";
            if (this.topLabelContainer2)
                this.topLabelContainer2.setVisible(false);
            this.topLabelContainer.setVisible(false);
        }
        else {
            if (this.overState && this.disabledState && this.downState && this.upState) {
                if (this.overLabelContainer &&
                    this.disabledLabelContainer &&
                    this.downLabelContainer &&
                    this.upLabelContainer) {
                    this.labelState = "multi";
                }
            }
        }
        this.enable();
        this.onOut();
        // bind input events
        this.on("pointerdown", this.onPointerDown, this);
        this.on("pointerup", this.onPointerUp, this);
        this.on("pointerout", this.onOut, this);
        this.on("pointerover", this.onOver, this);
    }
    onPointerDown() {
        this.longPressFired = false;
        this.longPressTimer = setTimeout(() => {
            this.longPressFired = true;
            this.longPressCallback?.();
        }, this.LONG_PRESS_DURATION);
        this.onDown();
    }
    onPointerUp() {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        if (!this.longPressFired) {
            this.onClicked();
        }
    }
    setLabel(name) {
        if (this.labelState === "single" && this.topLabelContainer) {
            this.topLabelContainer.setVisible(true);
            this.topLabelContainer.setText?.(name);
        }
        if (this.labelState === "multi") {
            [this.overLabelContainer, this.disabledLabelContainer, this.downLabelContainer, this.upLabelContainer].forEach((label) => {
                if (label) {
                    label.setVisible(true);
                    label.setText?.(name);
                }
            });
        }
    }
    setLabel2(name) {
        if (this.labelState === "single" && this.topLabelContainer2) {
            this.topLabelContainer2.setVisible(true);
            this.topLabelContainer2.setText?.(name);
        }
        if (this.labelState === "multi") {
            [this.overLabelContainer2, this.disabledLabelContainer2, this.downLabelContainer2, this.upLabelContainer2].forEach((label) => {
                if (label) {
                    label.setVisible(true);
                    label.setText?.(name);
                }
            });
        }
    }
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
        this.callback?.();
    }
    enable() {
        this.removeAllListeners();
        this.setInteractive({ useHandCursor: true });
        if (this.upState) {
            this.upState.setVisible(true);
            this.add(this.upState);
        }
        if (this.overState) {
            this.overState.setVisible(false);
        }
        if (this.downState) {
            this.downState.setVisible(false);
        }
        if (this.disabledState) {
            this.disabledState.setVisible(false);
        }
    }
    disable() {
        this.removeAllListeners();
        this.disableInteractive();
        if (this.disabledState) {
            this.disabledState.setVisible(true);
            this.add(this.disabledState);
        }
    }
    onDown() {
        if (this.overState)
            this.overState.setVisible(false);
        if (this.disabledState)
            this.disabledState.setVisible(false);
        if (this.upState)
            this.upState.setVisible(false);
        if (this.downState) {
            this.downState.setVisible(true);
            this.add(this.downState);
        }
    }
    onOut() {
        if (this.overState)
            this.overState.setVisible(false);
        if (this.upState) {
            this.upState.setVisible(true);
            this.add(this.upState);
        }
    }
    onOver() {
        if (this.overState) {
            this.overState.setVisible(true);
            this.add(this.overState);
        }
    }
}
//# sourceMappingURL=ZButton.js.map