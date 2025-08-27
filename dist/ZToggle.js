import { AttachClickListener } from "./ZButton";
import { ZState } from "./ZState";
export class ZToggle extends ZState {
    callback;
    init() {
        AttachClickListener(this, () => {
            this.setViewState(this.currentState.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState.name === "onState");
            }
        });
        this.setViewState("offState");
    }
    setCallback(func) {
        this.callback = func;
    }
    removeCallback() {
        this.callback = undefined;
    }
}
//# sourceMappingURL=ZToggle.js.map