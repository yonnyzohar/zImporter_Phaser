import { gsap } from "gsap";
import { ZContainer } from "./ZContainer";

type LabelState = "single" | "multi" | "none";

export const RemoveClickListener = (container: Phaser.GameObjects.Container): void => {
    container.removeListener('pointerdown');
};

export const AttachClickListener = (container: Phaser.GameObjects.Container, callback: () => void): void => {
    // Ensure a valid hit area on Containers
    (container as any).enablePointerInteraction?.(true);
    container.on('pointerdown', callback);
};

export class ZButton extends ZContainer {
    topLabelContainer2?: ZContainer;
    topLabelContainer?: ZContainer;

    overState?: ZContainer;
    overLabelContainer?: ZContainer;
    overLabelContainer2?: ZContainer;

    downState?: ZContainer;
    downLabelContainer?: ZContainer;
    downLabelContainer2?: ZContainer;

    upState?: ZContainer;
    upLabelContainer?: ZContainer;
    upLabelContainer2?: ZContainer;

    disabledState?: ZContainer;
    disabledLabelContainer?: ZContainer;
    disabledLabelContainer2?: ZContainer;

    // methods
    callback?: () => void;
    longPressCallback?: () => void;

    longPressTimer: any = null;
    LONG_PRESS_DURATION = 500;
    longPressFired = false;
    private labelState: LabelState = "none";

    init(_labelStr: string = "") {
        super.init?.();

        // enable input (Containers need an explicit hit area)
        this.enablePointerInteraction(true);

        if (this.overState) {
            this.overLabelContainer = this.overState.getByName("labelContainer") as ZContainer;
            this.overLabelContainer2 = this.overState.getByName("labelContainer2") as ZContainer;
        }

        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getByName("labelContainer") as ZContainer;
            this.disabledLabelContainer2 = this.disabledState.getByName("labelContainer2") as ZContainer;
        }

        if (this.downState) {
            this.downLabelContainer = this.downState.getByName("labelContainer") as ZContainer;
            this.downLabelContainer2 = this.downState.getByName("labelContainer2") as ZContainer;
        }

        if (this.upState) {
            this.upLabelContainer = this.upState.getByName("labelContainer") as ZContainer;
            this.upLabelContainer2 = this.upState.getByName("labelContainer2") as ZContainer;
        }

        this.topLabelContainer = (this as any).labelContainer;
        this.topLabelContainer2 = (this as any).labelContainer2;

        // decide label type
        if (this.topLabelContainer) {
            this.labelState = "single";
            if (this.topLabelContainer2) this.topLabelContainer2.setVisible(false);
            this.topLabelContainer.setVisible(false);
        } else {
            if (this.overState && this.disabledState && this.downState && this.upState) {
                if (
                    this.overLabelContainer &&
                    this.disabledLabelContainer &&
                    this.downLabelContainer &&
                    this.upLabelContainer
                ) {
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

    private onPointerDown() {
        this.longPressFired = false;
        this.longPressTimer = setTimeout(() => {
            this.longPressFired = true;
            this.longPressCallback?.();
        }, this.LONG_PRESS_DURATION);

        this.onDown();
    }

    private onPointerUp() {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;

        if (!this.longPressFired) {
            this.onClicked();
        }
    }

    setLabel(name: string) {
        if (this.labelState === "single" && this.topLabelContainer) {
            this.topLabelContainer.setVisible(true);
            (this.topLabelContainer as any).setText?.(name);
        }
        if (this.labelState === "multi") {
            [this.overLabelContainer, this.disabledLabelContainer, this.downLabelContainer, this.upLabelContainer].forEach(
                (label) => {
                    if (label) {
                        label.setVisible(true);
                        (label as any).setText?.(name);
                    }
                }
            );
        }
    }

    setLabel2(name: string) {
        if (this.labelState === "single" && this.topLabelContainer2) {
            this.topLabelContainer2.setVisible(true);
            (this.topLabelContainer2 as any).setText?.(name);
        }
        if (this.labelState === "multi") {
            [this.overLabelContainer2, this.disabledLabelContainer2, this.downLabelContainer2, this.upLabelContainer2].forEach(
                (label) => {
                    if (label) {
                        label.setVisible(true);
                        (label as any).setText?.(name);
                    }
                }
            );
        }
    }

    setCallback(func: () => void) {
        this.callback = func;
    }

    removeCallback() {
        this.callback = undefined;
    }

    setLongPressCallback(func: () => void) {
        this.longPressCallback = func;
    }

    removeLongPressCallback() {
        this.longPressCallback = undefined;
    }

    private onClicked() {
        this.callback?.();
    }

    enable() {
        this.removeAllListeners();
        this.enablePointerInteraction(true);

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

    private onDown() {
        if (this.overState) this.overState.setVisible(false);
        if (this.disabledState) this.disabledState.setVisible(false);
        if (this.upState) this.upState.setVisible(false);

        if (this.downState) {
            this.downState.setVisible(true);
            this.add(this.downState);
        }
    }

    private onOut() {
        if (this.overState) this.overState.setVisible(false);

        if (this.upState) {
            this.upState.setVisible(true);
            this.add(this.upState);
        }
    }

    private onOver() {
        if (this.overState) {
            this.overState.setVisible(true);
            this.add(this.overState);
        }
    }
}
