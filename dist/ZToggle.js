import { AttachClickListener } from "./ZButton";
import { ZState } from "./ZState";
export class ZToggle extends ZState {
    callback;
    init() {
        this.cursor = "pointer";
        AttachClickListener(this, () => {
            this.setState(this.currentState.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState.name === "onState");
            }
        });
        this.setState("offState");
    }
    setCallback(func) {
        this.callback = func;
    }
    removeCallback() {
        this.callback = undefined;
    }
}
//# sourceMappingURL=ZToggle.js.map