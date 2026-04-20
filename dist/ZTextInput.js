import { ZContainer } from "./ZContainer";
/**
 * ZTextInput — Phaser equivalent of the PIXI ZTextInput.
 *
 * Appends a real HTML <input> to document.body and tracks the container's
 * world transform each frame (via the scene's prerender event) to position
 * the element correctly over the Phaser canvas — mirroring exactly how the
 * PIXI text-input library works.
 */
export class ZTextInput extends ZContainer {
    inputElement = null;
    props;
    _text = "";
    _scene;
    _preRenderHandler = null;
    // Local position from JSON — used by ZContainer.setOrigin() to apply parent pivot.
    _baseX;
    _baseY;
    constructor(scene, data) {
        super(scene, data.x ?? 0, data.y ?? 0);
        this._baseX = data.x ?? 0;
        this._baseY = data.y ?? 0;
        this._scene = scene;
        this.props = data.props;
        this._text = data.text || "";
        this._createInput(scene, data);
    }
    _createInput(scene, data) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this._text;
        // Fixed layout styles — the DOM element is positioned absolutely and
        // moved each frame via a CSS matrix transform (same as PIXI version).
        input.style.position = "fixed";
        input.style.top = "0px";
        input.style.left = "0px";
        input.style.transformOrigin = "0 0";
        input.style.background = "none";
        input.style.border = "none";
        input.style.outline = "none";
        input.style.boxSizing = "border-box";
        // Apply text / font styles from props.input
        const inp = this.props?.input;
        if (inp) {
            if (inp.fontFamily)
                input.style.fontFamily = inp.fontFamily;
            if (inp.fontSize)
                input.style.fontSize = inp.fontSize;
            if (inp.padding)
                input.style.padding = inp.padding;
            if (inp.width)
                input.style.width = inp.width;
            if (inp.color)
                input.style.color = typeof inp.color === "number"
                    ? "#" + inp.color.toString(16).padStart(6, "0")
                    : inp.color;
            if (inp.fontWeight)
                input.style.fontWeight = inp.fontWeight;
            if (inp.textAlign)
                input.style.textAlign = inp.textAlign;
            if (inp.textIndent)
                input.style.textIndent = inp.textIndent;
            if (inp.lineHeight)
                input.style.lineHeight = inp.lineHeight;
        }
        // Apply box styles from props.box.default
        this._applyBoxStyle(input, this.props?.box?.default);
        // Focus / blur swap box styles
        input.addEventListener("focus", () => {
            this._applyBoxStyle(input, this.props?.box?.focused);
        });
        input.addEventListener("blur", () => {
            this._applyBoxStyle(input, this.props?.box?.default);
        });
        input.addEventListener("input", () => {
            this._text = input.value;
        });
        document.body.appendChild(input);
        this.inputElement = input;
        // Update the DOM position every frame before Phaser renders
        this._preRenderHandler = () => this._updateDOMPosition();
        scene.sys.events.on("prerender", this._preRenderHandler);
    }
    _applyBoxStyle(input, box) {
        if (!box)
            return;
        if (box.fill !== undefined) {
            input.style.backgroundColor = "#" + box.fill.toString(16).padStart(6, "0");
        }
        if (box.rounded !== undefined) {
            input.style.borderRadius = box.rounded + "px";
        }
        if (box.stroke) {
            const stroke = box.stroke;
            const strokeColor = stroke.color !== undefined
                ? "#" + stroke.color.toString(16).padStart(6, "0")
                : "#000000";
            const strokeWidth = stroke.width !== undefined ? stroke.width : 1;
            input.style.border = `${strokeWidth}px solid ${strokeColor}`;
        }
        else {
            input.style.border = "none";
        }
    }
    /**
     * Uses Phaser's getWorldTransformMatrix() — which is correct once setOrigin()
     * places ZTextInput at (_baseX - parentPivotX, _baseY - parentPivotY) in Phaser
     * space — so scroll offsets applied to parent containers are picked up automatically.
     * Also applies a CSS clip-path from the nearest ZScroll ancestor mask rect.
     */
    _updateDOMPosition() {
        if (!this.inputElement)
            return;
        const canvas = this._scene.sys.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const renderer = this._scene.sys.game.renderer;
        const cssScaleX = canvasRect.width / renderer.width;
        const cssScaleY = canvasRect.height / renderer.height;
        // Phaser's world transform — correct because setOrigin() now adjusts our x/y.
        const wm = this.getWorldTransformMatrix();
        const a = wm.a * cssScaleX;
        const b = wm.b * cssScaleY;
        const c = wm.c * cssScaleX;
        const d = wm.d * cssScaleY;
        const tx = wm.tx * cssScaleX + canvasRect.left;
        const ty = wm.ty * cssScaleY + canvasRect.top;
        this.inputElement.style.transform = `matrix(${a},${b},${c},${d},${tx},${ty})`;
        this.inputElement.style.opacity = String(this.alpha);
        this.inputElement.style.display = this.visible ? "block" : "none";
        // ── CSS clip-path to honour ZScroll geometry masks ──────────────────
        const clip = this._findAncestorClip();
        if (clip) {
            const cl = clip.tl.x * cssScaleX + canvasRect.left;
            const ct = clip.tl.y * cssScaleY + canvasRect.top;
            const cr = clip.br.x * cssScaleX + canvasRect.left;
            const cb = clip.br.y * cssScaleY + canvasRect.top;
            const ew = this.inputElement.offsetWidth || 1;
            const eh = this.inputElement.offsetHeight || 1;
            const sa = Math.abs(a) || 1;
            const sd = Math.abs(d) || 1;
            // Convert viewport clip rect → element-local CSS px for clip-path: inset()
            const insetTop = Math.max(0, Math.min(eh, (ct - ty) / sd));
            const insetBottom = Math.max(0, Math.min(eh, eh - (cb - ty) / sd));
            const insetLeft = Math.max(0, Math.min(ew, (cl - tx) / sa));
            const insetRight = Math.max(0, Math.min(ew, ew - (cr - tx) / sa));
            this.inputElement.style.clipPath =
                `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`;
        }
        else {
            this.inputElement.style.clipPath = "";
        }
    }
    /** Walk up the parent chain to find the nearest ZScroll ancestor's clip rect (world space). */
    _findAncestorClip() {
        let node = this.parentContainer;
        while (node) {
            if (node._clipWorld)
                return node._clipWorld;
            node = node.parentContainer;
        }
        return null;
    }
    destroy(fromScene) {
        if (this._preRenderHandler) {
            this._scene.sys.events.off("prerender", this._preRenderHandler);
            this._preRenderHandler = null;
        }
        if (this.inputElement && this.inputElement.parentNode) {
            this.inputElement.parentNode.removeChild(this.inputElement);
            this.inputElement = null;
        }
        super.destroy(fromScene);
    }
    /** Get the current text value. */
    getText() {
        return this.inputElement?.value ?? this._text;
    }
    /** Set the text value. */
    setValue(text) {
        this._text = text;
        if (this.inputElement) {
            this.inputElement.value = text;
        }
    }
    /** Focus the input field. */
    focus() {
        this.inputElement?.focus();
    }
    /** Blur (unfocus) the input field. */
    blur() {
        this.inputElement?.blur();
    }
    /** Disable the input. */
    setDisabled(disabled) {
        if (this.inputElement) {
            this.inputElement.disabled = disabled;
            const style = disabled ? this.props?.box?.disabled : this.props?.box?.default;
            this._applyBoxStyle(this.inputElement, style);
        }
    }
    getType() {
        return "ZTextInput";
    }
}
//# sourceMappingURL=ZTextInput.js.map