
import { gsap } from "gsap";
import { ZContainer } from "./ZContainer";

type LabelState = "single" | "multi" | "none";

// Remove all click listeners (pointerdown, pointerup, etc.)
export const RemoveClickListener = (container: Phaser.GameObjects.Container): void => {
    container.removeAllListeners && container.removeAllListeners();
    container.off && container.off("pointerdown");
    container.off && container.off("pointerup");
    container.off && container.off("pointerout");
    container.off && container.off("pointerover");
};

// Attach click and long-press listeners, with drag threshold
export const AttachClickListener = (
    container: Phaser.GameObjects.Container,
    pressCallback?: () => void,
    longPressCallback?: () => void
): void => {
    // Calculate bounds based on children and set the hit area
    const bounds = container.getBounds();
    container.setInteractive(
        new Phaser.Geom.Rectangle(
            bounds.x - container.x,
            bounds.y - container.y,
            bounds.width,
            bounds.height
        ),
        Phaser.Geom.Rectangle.Contains
    );

    let longPressTimer: any = null;
    const LONG_PRESS_DURATION = 500;
    const MAX_DRAG_DISTANCE = 20;
    let longPressFired = false;
    let startPos: { x: number; y: number } | null = null;

    const getPointerPos = (pointer: Phaser.Input.Pointer) => {
        return { x: pointer.worldX, y: pointer.worldY };
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
        longPressFired = false;
        startPos = getPointerPos(pointer);
        longPressTimer = setTimeout(() => {
            longPressFired = true;
            longPressCallback && longPressCallback();
        }, LONG_PRESS_DURATION);
    };

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        let isDrag = false;
        const endPos = getPointerPos(pointer);
        if (startPos && endPos) {
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MAX_DRAG_DISTANCE) isDrag = true;
        }
        startPos = null;
        if (!longPressFired && !isDrag) {
            pressCallback && pressCallback();
        }
    };

    container.on("pointerdown", onPointerDown);
    container.on("pointerup", onPointerUp);
    container.on("pointerout", () => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    });

    // Change cursor to pointer on hover
    container.on("pointerover", () => {
        container.scene.input.setDefaultCursor && container.scene.input.setDefaultCursor("pointer");
    });
    container.on("pointerout", () => {
        container.scene.input.setDefaultCursor && container.scene.input.setDefaultCursor("default");
    });
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

    callback?: () => void;
    longPressCallback?: () => void;

    private labelState: LabelState = "none";

    public getType(): string {
        return "ZButton";
    }

    init(_labelStr: string = "") {
        super.init?.();

        // Enable input
        const bounds = this.getBounds();
        this.setInteractive(
            new Phaser.Geom.Rectangle(
                bounds.x - this.x,
                bounds.y - this.y,
                bounds.width,
                bounds.height
            ),
            Phaser.Geom.Rectangle.Contains
        );

        if (this.overState) {
            this.overLabelContainer = this.overState.getByName?.("labelContainer") as ZContainer;
            this.overLabelContainer2 = this.overState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getByName?.("labelContainer") as ZContainer;
            this.disabledLabelContainer2 = this.disabledState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.downState) {
            this.downLabelContainer = this.downState.getByName?.("labelContainer") as ZContainer;
            this.downLabelContainer2 = this.downState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.upState) {
            this.upLabelContainer = this.upState.getByName?.("labelContainer") as ZContainer;
            this.upLabelContainer2 = this.upState.getByName?.("labelContainer2") as ZContainer;
        }

        this.topLabelContainer = (this as any).labelContainer;
        this.topLabelContainer2 = (this as any).labelContainer2;

        // Detect single vs multi label
        if (this.topLabelContainer) {
            this.labelState = "single";
        } else if (
            this.overState &&
            this.disabledState &&
            this.downState &&
            this.upState &&
            this.overLabelContainer &&
            this.disabledLabelContainer &&
            this.downLabelContainer &&
            this.upLabelContainer
        ) {
            this.labelState = "multi";
        }

        this.enable();
    }

    setLabel(name: string): void {
        if (this.labelState === "single" && this.topLabelContainer) {
            this.topLabelContainer.setVisible(true);
            (this.topLabelContainer as any).setText?.(name);
        } else if (this.labelState === "multi") {
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

    setLabel2(name: string): void {
        if (this.labelState === "single" && this.topLabelContainer2) {
            this.topLabelContainer2.setVisible(true);
            (this.topLabelContainer2 as any).setText?.(name);
        } else if (this.labelState === "multi") {
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

    setFixedTextSize(fixed: boolean): void {
        // Not implemented: Phaser version would need to propagate to label containers if supported
    }

    makeSingleLine(): void {
        // Not implemented: Phaser version would need to propagate to label containers if supported
    }

    setCallback(func: () => void) {
        this.callback = func;
        AttachClickListener(this, () => this.onClicked(), this.longPressCallback);
    }

    removeCallback() {
        this.callback = undefined;
        RemoveClickListener(this);
    }

    setLongPressCallback(func: () => void) {
        this.longPressCallback = func;
        AttachClickListener(this, this.callback ? () => this.onClicked() : undefined, func);
    }

    removeLongPressCallback() {
        this.longPressCallback = undefined;
        AttachClickListener(this, this.callback ? () => this.onClicked() : undefined, undefined);
    }

    onClicked() {
        if (this.callback) this.callback();
    }

    enable() {
        this.removeAllListeners && this.removeAllListeners();
        this.enablePointerInteraction && this.enablePointerInteraction(true);

        // Set cursor to pointer
        if (this.scene && this.scene.input && this.scene.input.setDefaultCursor) {
            this.scene.input.setDefaultCursor("pointer");
        }

        this.hideAllStates();
        if (this.upState) {
            this.upState.setVisible(true);
            this.add(this.upState);
        }
        if (this.labelState === "single" && this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }

        // Hover/press listeners
        this.on("pointerout", this.onOut, this);
        this.on("pointerover", this.onOver, this);
        this.on("pointerdown", this.onDown, this);
        this.on("pointerup", this.onOut, this);

        AttachClickListener(this, this.callback ? () => this.onClicked() : undefined, this.longPressCallback);
    }

    disable() {
        this.removeAllListeners && this.removeAllListeners();
        this.disableInteractive && this.disableInteractive();
        if (this.scene && this.scene.input && this.scene.input.setDefaultCursor) {
            this.scene.input.setDefaultCursor("default");
        }
        this.hideAllStates();
        if (this.disabledState) {
            this.disabledState.setVisible(true);
            this.add(this.disabledState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 0.5;
        }
        if (this.topLabelContainer2) {
            this.add(this.topLabelContainer2);
            (this.topLabelContainer2 as any).alpha = 0.5;
        }
    }

    hideAllStates() {
        if (this.overState) this.overState.setVisible(false);
        if (this.downState) this.downState.setVisible(false);
        if (this.upState) this.upState.setVisible(false);
        if (this.disabledState) this.disabledState.setVisible(false);
    }

    onDown() {
        if (this.downState) {
            this.hideAllStates();
            this.downState.setVisible(true);
            this.add(this.downState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 0.5;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 0.5;
            }
        }
    }

    onOut() {
        if (this.upState) {
            this.hideAllStates();
            this.upState.setVisible(true);
            this.add(this.upState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }
    }

    onOver() {
        if (this.overState) {
            this.hideAllStates();
            this.overState.setVisible(true);
            this.add(this.overState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }
    }
}
