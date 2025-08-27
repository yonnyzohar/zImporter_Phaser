import { AttachClickListener } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZState } from "./ZState";

export class ZToggle extends ZState {

    private callback?: (state: boolean) => void;
    public init(): void {
        AttachClickListener(this, () => {
            this.setViewState(this.currentState!.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState!.name === "onState");
            }
        });

        this.setViewState("offState");
    }

    setCallback(func: (t: boolean) => void) {
        this.callback = func;
    }

    removeCallback() {
        this.callback = undefined;
    }

}