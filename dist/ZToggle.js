import { AttachClickListener, updateHitArea } from "./ZButton";
import { ZState } from "./ZState";
export class ZToggle extends ZState {
    callback;
    toggleCallback;
    init() {
        if (this.input) {
            this.input.cursor = "pointer";
        }
        AttachClickListener(this, () => {
            this.setViewState(this.currentState.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState.name === "onState");
            }
            if (this.toggleCallback) {
                this.toggleCallback(this.currentState.name === "onState");
            }
        });
        this.setViewState("offState");
    }
    applyTransform() {
        super.applyTransform();
        updateHitArea(this);
    }
    setCallback(func) {
        this.toggleCallback = func;
    }
    removeCallback() {
        this.toggleCallback = undefined;
    }
    setIsClickable(val) {
        this.setInteractive(val ? {} : undefined);
        if (this.input) {
            this.input.cursor = val ? "pointer" : "default";
        }
    }
    isOn() {
        return this.currentState.name === "onState";
    }
    toggle(state, sendCallback = true) {
        this.setViewState(state ? "onState" : "offState");
        if (this.toggleCallback && sendCallback) {
            this.toggleCallback(state);
        }
    }
    enable() {
        this.setInteractive();
        if (this.input) {
            this.input.cursor = "pointer";
        }
    }
    disable() {
        this.setInteractive(undefined);
        if (this.input) {
            this.input.cursor = "default";
        }
    }
    setLabelOnAllStates(label, str) {
        let containers = this.getAllByName(label);
        for (let container of containers) {
            container.setText(str);
        }
    }
    getType() {
        return "ZToggle";
    }
}
//# sourceMappingURL=ZToggle.js.map