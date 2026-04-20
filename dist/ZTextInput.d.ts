import Phaser from "phaser";
import { TextInputData } from "./SceneData";
import { ZContainer } from "./ZContainer";
/**
 * ZTextInput — Phaser equivalent of the PIXI ZTextInput.
 *
 * Appends a real HTML <input> to document.body and tracks the container's
 * world transform each frame (via the scene's prerender event) to position
 * the element correctly over the Phaser canvas — mirroring exactly how the
 * PIXI text-input library works.
 */
export declare class ZTextInput extends ZContainer {
    private inputElement;
    private props;
    private _text;
    private _scene;
    private _preRenderHandler;
    _baseX: number;
    _baseY: number;
    constructor(scene: Phaser.Scene, data: TextInputData);
    private _createInput;
    private _applyBoxStyle;
    /**
     * Uses Phaser's getWorldTransformMatrix() — which is correct once setOrigin()
     * places ZTextInput at (_baseX - parentPivotX, _baseY - parentPivotY) in Phaser
     * space — so scroll offsets applied to parent containers are picked up automatically.
     * Also applies a CSS clip-path from the nearest ZScroll ancestor mask rect.
     */
    private _updateDOMPosition;
    /** Walk up the parent chain to find the nearest ZScroll ancestor's clip rect (world space). */
    private _findAncestorClip;
    destroy(fromScene?: boolean): void;
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