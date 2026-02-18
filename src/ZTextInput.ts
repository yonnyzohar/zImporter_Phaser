import Phaser from "phaser";
import { TextInputData, TextInputObj } from "./SceneData";
import { ZContainer } from "./ZContainer";

/**
 * ZTextInput — Phaser equivalent of the PIXI ZTextInput.
 *
 * Renders an HTML <input> element positioned over the Phaser canvas using
 * Phaser.GameObjects.DOMElement.  This mirrors the behaviour of the PIXI
 * text-input library which also uses a real DOM input.
 *
 * Styling is applied from the same TextInputObj config used by the PIXI
 * version so that the same scene JSON works for both engines.
 */
export class ZTextInput extends ZContainer {
    private domElement: Phaser.GameObjects.DOMElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private props: TextInputObj;
    private _text: string = "";

    constructor(scene: Phaser.Scene, data: TextInputData) {
        super(scene, data.x ?? 0, data.y ?? 0);
        this.props = data.props;
        this._text = data.text || "";
        this.createInput(scene, data);
    }

    private createInput(scene: Phaser.Scene, data: TextInputData): void {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this._text;

        // Apply styles from props.input
        const inp = this.props?.input;
        if (inp) {
            if (inp.fontFamily) input.style.fontFamily = inp.fontFamily;
            if (inp.fontSize) input.style.fontSize = inp.fontSize;
            if (inp.padding) input.style.padding = inp.padding;
            if (inp.width) input.style.width = inp.width;
            if (inp.color) input.style.color = typeof inp.color === "number"
                ? "#" + inp.color.toString(16).padStart(6, "0")
                : inp.color as string;
            if (inp.fontWeight) input.style.fontWeight = inp.fontWeight;
            if (inp.textAlign) input.style.textAlign = inp.textAlign;
            if (inp.textIndent) input.style.textIndent = inp.textIndent;
            if (inp.lineHeight) input.style.lineHeight = inp.lineHeight;
        }

        // Apply default box styles
        const box = this.props?.box?.default;
        if (box) {
            if (box.fill !== undefined) {
                input.style.backgroundColor = "#" + box.fill.toString(16).padStart(6, "0");
            }
            if (box.rounded !== undefined) {
                input.style.borderRadius = box.rounded + "px";
            }
            if (box.stroke) {
                const stroke = box.stroke;
                const strokeColor = stroke.color !== undefined ? "#" + stroke.color.toString(16).padStart(6, "0") : "#000000";
                const strokeWidth = stroke.width !== undefined ? stroke.width : 1;
                const strokeAlpha = stroke.alpha !== undefined ? stroke.alpha : 1;
                input.style.border = `${strokeWidth}px solid ${strokeColor}`;
                input.style.opacity = String(strokeAlpha);
            }
        }

        input.style.outline = "none";
        input.style.boxSizing = "border-box";

        // Listen for focus/blur to apply focused/disabled box styles
        input.addEventListener("focus", () => {
            const focused = this.props?.box?.focused;
            if (focused?.fill !== undefined) {
                input.style.backgroundColor = "#" + focused.fill.toString(16).padStart(6, "0");
            }
        });
        input.addEventListener("blur", () => {
            const def = this.props?.box?.default;
            if (def?.fill !== undefined) {
                input.style.backgroundColor = "#" + def.fill.toString(16).padStart(6, "0");
            }
        });
        input.addEventListener("input", () => {
            this._text = input.value;
        });

        try {
            this.domElement = scene.add.dom(0, 0, input);
            this.add(this.domElement);
            this.inputElement = input;
        } catch (e) {
            // DOM container not enabled in Phaser game config (dom.createContainer: true).
            // Fall back to a plain Text object so the scene still loads.
            console.warn(
                `ZTextInput: DOM support not available (add 'dom: { createContainer: true }' to your Phaser game config). ` +
                `Rendering "${data.name}" as a plain text label instead.`
            );
            const inp = this.props?.input;
            const colorStr = inp?.color
                ? (typeof inp.color === "number" ? "#" + inp.color.toString(16).padStart(6, "0") : inp.color as string)
                : "#ffffff";
            const fallback = scene.add.text(0, 0, this._text, {
                fontFamily: inp?.fontFamily ?? "Arial",
                fontSize: inp?.fontSize ?? "16px",
                color: colorStr,
            });
            fallback.setName(data.name);
            this.add(fallback);
        }
    }

    /** Get the current text value. */
    public getText(): string {
        return this.inputElement?.value ?? this._text;
    }

    /** Set the text value. */
    public setValue(text: string): void {
        this._text = text;
        if (this.inputElement) {
            this.inputElement.value = text;
        }
    }

    /** Focus the input field. */
    public focus(): void {
        this.inputElement?.focus();
    }

    /** Blur (unfocus) the input field. */
    public blur(): void {
        this.inputElement?.blur();
    }

    /** Disable the input. */
    public setDisabled(disabled: boolean): void {
        if (this.inputElement) {
            this.inputElement.disabled = disabled;
            const style = disabled ? this.props?.box?.disabled : this.props?.box?.default;
            if (style?.fill !== undefined) {
                this.inputElement.style.backgroundColor = "#" + style.fill.toString(16).padStart(6, "0");
            }
        }
    }

    public getType(): string {
        return "ZTextInput";
    }
}
