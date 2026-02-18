import Phaser from "phaser";
import { TextInputData } from "./SceneData";
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
export declare class ZTextInput extends ZContainer {
    private domElement;
    private inputElement;
    private props;
    private _text;
    constructor(scene: Phaser.Scene, data: TextInputData);
    private createInput;
    /** Get the current text value. */
    getText(): string;
    /** Set the text value. */
    setValue(text: string): void;
    /** Focus the input field. */
    focus(): void;
    /** Blur (unfocus) the input field. */
    blur(): void;
    /** Disable the input. */
    setDisabled(disabled: boolean): void;
    getType(): string;
}
//# sourceMappingURL=ZTextInput.d.ts.map