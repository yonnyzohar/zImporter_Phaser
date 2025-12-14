import { AttachClickListener, updateHitArea } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZState } from "./ZState";


export class ZToggle extends ZState {
    private callback?: (state: boolean) => void;
    public toggleCallback?: (state: boolean) => void;

    public init(): void {
        if (this.input) {
            this.input.cursor = "pointer";
        }
        AttachClickListener(this, () => {
            this.setViewState(this.currentState!.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState!.name === "onState");
            }
            if (this.toggleCallback) {
                this.toggleCallback(this.currentState!.name === "onState");
            }
        });
        this.setViewState("offState");
    }

    applyTransform() {
        super.applyTransform();
        updateHitArea(this);
    }

    setCallback(func: (t: boolean) => void) {
        this.toggleCallback = func;
    }

    removeCallback() {
        this.toggleCallback = undefined;
    }

    setIsClickable(val: boolean) {
        this.setInteractive(val ? {} : undefined);
        if (this.input) {
            this.input.cursor = val ? "pointer" : "default";
        }
    }

    isOn(): boolean {
        return this.currentState!.name === "onState";
    }

    toggle(state: boolean, sendCallback: boolean = true) {
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

    setLabelOnAllStates(label: string, str: string) {
        let containers = this.getAll(label);
        for (let container of containers) {
            (container as ZContainer).setText(str);
        }
    }

    public getType(): string {
        return "ZToggle";
    }
}