import Phaser from "phaser";
export class ZContainer extends Phaser.GameObjects.Container {
    portrait;
    landscape;
    currentTransform;
    resizeable = true;
    name = "";
    _fitToScreen = false;
    emitter;
    particleSystems = [];
    originalTextWidth;
    originalTextHeight;
    originalFontSize;
    fixedBoxSize;
    _props;
    graphics;
    constructor(scene, x = 0, y = 0, children) {
        super(scene, x, y, children);
        scene.add.existing(this);
    } /**/
    getChildByName(name) {
        return this.list.find(c => c.name === name) || null;
    }
    get(childName) {
        const queue = [];
        this.list.forEach(child => {
            if (child instanceof ZContainer)
                queue.push(child);
        });
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName) {
                return current;
            }
            current.list.forEach(child => {
                if (child instanceof ZContainer)
                    queue.push(child);
            });
        }
        return null;
    }
    /**
     * Searches direct children for a Spine animation object and returns the first match.
     * @returns The first `SpineGameObject` found, or `undefined` if none exists.
     */
    getSpine() {
        for (const child of this.list) {
            if (child.skeleton && child.animationState) {
                return child;
            }
        }
        return undefined;
    }
    getAllByName(childName) {
        const result = [];
        const queue = [];
        this.list.forEach(child => {
            if (child instanceof ZContainer)
                queue.push(child);
        });
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName)
                result.push(current);
            current.list.forEach(child => {
                if (child instanceof ZContainer)
                    queue.push(child);
            });
        }
        return result;
    }
    init() {
        // Text field original size setup
        const tf = this.getTextField();
        if (tf) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }
    getType() {
        return "ZContainer";
    }
    getProps() {
        return this._props;
    }
    setText(text) {
        let textChild = this.getTextField();
        if (textChild) {
            // Reset to original font size before resizing, so repeated calls
            // always start from full size (mirrors the PIXI version behaviour)
            if (this.originalFontSize !== undefined) {
                textChild.setFontSize(this.originalFontSize);
            }
            textChild.setText(text);
            this.resizeText(textChild);
            if (textChild.style.align === "center") {
                textChild.setOrigin(0.5, 0.5);
            }
        }
    }
    setTextStyle(data) {
        let tf = this.getTextField();
        if (tf) {
            tf.setStyle(data);
            this.resizeText(tf);
        }
    }
    resizeText(textChild) {
        if (this.fixedBoxSize) {
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while ((maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)) {
                    const currentSize = parseFloat(textChild.style.fontSize) || 12;
                    if (currentSize <= 1)
                        break;
                    textChild.setFontSize(currentSize - 1);
                }
            }
        }
    }
    getTextField() {
        let textChild = this.getByName("label");
        if (textChild)
            return textChild;
        for (let child of this.list) {
            if (child instanceof Phaser.GameObjects.Text) {
                return child;
            }
        }
        return null;
    }
    setInstanceData(data, orientation) {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        this.name = data.instanceName || "";
        this._props = data;
        if (data.attrs?.fitToScreen !== undefined) {
            this.fitToScreen = data.attrs.fitToScreen;
        }
        // Text field original size setup
        const tf = this.getTextField();
        if (tf) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }
    setFixedBoxSize(value) {
        this.fixedBoxSize = value;
    }
    set fitToScreen(value) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        }
        else {
            this.applyTransform();
        }
    }
    get fitToScreen() {
        return this._fitToScreen;
    }
    applyTransform() {
        if (this._fitToScreen) // if fitToScreen is true, do not apply transform
         {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform)
            return;
        if (!this.resizeable)
            return;
        if (this.parentContainer) {
            let currentFrame = this.parentContainer.currentFrame;
            if (currentFrame !== undefined && currentFrame > 0) {
                return; // do not apply transform if parent timeline is playing
            }
        }
        let parentContainer = this.parentContainer;
        if (parentContainer && parentContainer.currentTransform) {
            let parentPivotX = parentContainer.currentTransform.pivotX || 0;
            let parentPivotY = parentContainer.currentTransform.pivotY || 0;
            // Use super directly — we must NOT write back into currentTransform here
            super.setX((this.currentTransform.x - parentPivotX) || 0);
            super.setY((this.currentTransform.y - parentPivotY) || 0);
        }
        else {
            super.setX(this.currentTransform.x || 0);
            super.setY(this.currentTransform.y || 0);
        }
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);
        // Handle pivot - Phaser Containers don't have pivot, so we adjust children positions
        // This mimics PIXI's pivot behavior
        this.setOrigin();
        this.applyAnchor();
        /*
        if (!this.graphics) {
            this.graphics = this.scene.add.graphics();
            this.graphics.setDepth(9999);
        }

        this.graphics.clear();
        this.graphics.lineStyle(2, 0xffffff * Math.random(), 1);
        // Get container bounds in world coordinates
        const bounds = this.getBounds();

        // Draw the rectangle around it
        this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.graphics.strokeCircle(this.x, this.y, 5);
        */
    }
    setOrigin() {
        const pivotX = (this.currentTransform.pivotX) || 0;
        const pivotY = (this.currentTransform.pivotY) || 0;
        this.list.forEach(child => {
            // Skip children that manage their own position via fitToScreen
            if (child._fitToScreen)
                return;
            let childTransform = child.currentTransform;
            if (childTransform) {
                // Use _setDisplayX/Y to bypass the logical-save override on ZContainer children
                if (child._setDisplayX) {
                    child._setDisplayX(childTransform.x - pivotX);
                    child._setDisplayY(childTransform.y - pivotY);
                }
                else {
                    child.x = childTransform.x - pivotX;
                    child.y = childTransform.y - pivotY;
                }
            }
            else {
                if (!(child instanceof ZContainer)) {
                    child.setX(-pivotX);
                    child.setY(-pivotY);
                }
            }
        });
    }
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    executeFitToScreen() {
        if (this.list.length === 0)
            return;
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        // Helper: convert a world-space point to parent-local coords
        const parentMat = this.parentContainer
            ? this.parentContainer.getWorldTransformMatrix()
            : null;
        const toLocal = (wx, wy) => parentMat ? parentMat.applyInverse(wx, wy) : { x: wx, y: wy };
        // Screen corners in parent-local space
        const topLeft = toLocal(0, 0);
        const btmRight = toLocal(screenWidth, screenHeight);
        const mid = toLocal(screenWidth / 2, screenHeight / 2);
        // Local dimensions of the screen (accounts for parent scale/rotation)
        const localScreenW = btmRight.x - topLeft.x;
        const localScreenH = btmRight.y - topLeft.y;
        const firstChild = this.list[0];
        const isNineSlice = firstChild instanceof Phaser.GameObjects.NineSlice;
        if (isNineSlice) {
            this.x = topLeft.x;
            this.y = topLeft.y;
            this.setScale(1, 1);
            firstChild.width = localScreenW;
            firstChild.height = localScreenH;
            return;
        }
        // Compute content bounds directly from children's local properties,
        // avoiding getBounds() which requires up-to-date world transforms.
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const child of this.list) {
            const c = child;
            const dw = c.displayWidth ?? c.width ?? 0;
            const dh = c.displayHeight ?? c.height ?? 0;
            if (dw === 0 && dh === 0)
                continue;
            const ox = (c.originX ?? 0) * dw;
            const oy = (c.originY ?? 0) * dh;
            const cx = (c.x ?? 0) - ox;
            const cy = (c.y ?? 0) - oy;
            minX = Math.min(minX, cx);
            minY = Math.min(minY, cy);
            maxX = Math.max(maxX, cx + dw);
            maxY = Math.max(maxY, cy + dh);
        }
        if (!isFinite(minX) || !isFinite(minY))
            return;
        const localContentW = maxX - minX;
        const localContentH = maxY - minY;
        if (localContentW === 0 || localContentH === 0)
            return;
        // Scale to cover the screen (use max to cover, min to fit)
        const scaleX = localScreenW / localContentW;
        const scaleY = localScreenH / localContentH;
        const scale = Math.max(scaleX, scaleY);
        this.setScale(scale, scale);
        // Center the content around the screen midpoint in parent-local space.
        // The content's local top-left is at (minX, minY); after scale it offset
        // from the container origin by (minX*scale, minY*scale).
        // We want content center to land on mid:
        //   this.x + (minX + localContentW/2) * scale = mid.x
        this.x = mid.x - (minX + localContentW / 2) * scale;
        this.y = mid.y - (minY + localContentH / 2) * scale;
    }
    /**/
    /**
     * Internal helper — sets the raw Phaser display position without touching
     * `currentTransform`. Used by `setOrigin` and `applyTransform` to avoid
     * corrupting the logical (editor) x/y stored in the transform.
     */
    _setDisplayX(value) {
        super.setX(value);
    }
    _setDisplayY(value) {
        super.setY(value);
    }
    /**
     * Sets the logical x position, saves it to `currentTransform.x` (mirroring
     * the PIXI pattern), and applies the parent-pivot correction so the display
     * position is consistent.
     */
    setX(value) {
        if (this.currentTransform && value !== undefined) {
            this.currentTransform.x = value;
        }
        // Compute the display position the same way applyTransform would
        const parentPivotX = this.parentContainer?.currentTransform?.pivotX || 0;
        super.setX(((value ?? 0) - parentPivotX) || 0);
        return this;
    }
    setY(value) {
        if (this.currentTransform && value !== undefined) {
            this.currentTransform.y = value;
        }
        const parentPivotY = this.parentContainer?.currentTransform?.pivotY || 0;
        super.setY(((value ?? 0) - parentPivotY) || 0);
        return this;
    }
    setWidth(value) {
        super.setSize(value, this.height);
        if (this.currentTransform) {
            // this.currentTransform.width = value;
        }
        return this;
    }
    setHeight(value) {
        super.setSize(this.width, value);
        if (this.currentTransform) {
            // this.currentTransform.height = value;
        }
        return this;
    }
    setScaleX(x) {
        super.setScale(x, this.scaleY);
        if (this.currentTransform) {
            // this.currentTransform.scaleX = x!;
        }
        return this;
    }
    setScaleY(y) {
        super.setScale(this.scaleX, y);
        if (this.currentTransform) {
            // this.currentTransform.scaleY = y!;
        }
        return this;
    }
    applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parentContainer) {
            let xPer = this.currentTransform.anchorPercentage?.x ?? 0;
            let yPer = this.currentTransform.anchorPercentage?.y ?? 0;
            let x = xPer * this.scene.scale.width;
            let y = yPer * this.scene.scale.height;
            // x, y are already in world/screen space — convert directly to parent-local space
            const mat = this.parentContainer.getWorldTransformMatrix();
            const inv = new Phaser.GameObjects.Components.TransformMatrix();
            inv.copyFrom(mat);
            inv.invert();
            const localPoint = inv.transformPoint(x, y);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }
    isAnchored() {
        return !!this.currentTransform?.isAnchored;
    }
    setAlpha(value) {
        this.alpha = value;
        if (this.portrait)
            this.portrait.alpha = value;
        if (this.landscape)
            this.landscape.alpha = value;
        return this;
    }
    getAlpha() {
        return this.alpha;
    }
    setVisible(value) {
        this.visible = value;
        if (this.portrait)
            this.portrait.visible = value;
        if (this.landscape)
            this.landscape.visible = value;
        return this;
    }
    getVisible() {
        return this.visible;
    }
    getTextStyle() {
        const tf = this.getTextField();
        if (!tf)
            return null;
        return tf.style;
    }
    /**
     * Creates a shallow structural clone of this `ZContainer`, copying position,
     * scale, rotation, alpha, visibility, and name. Direct children are cloned
     * by type: `Phaser.GameObjects.Text`, `Phaser.GameObjects.Image`,
     * `Phaser.GameObjects.NineSlice`, and any object that exposes its own `clone()` method.
     */
    clone() {
        const newContainer = new ZContainer(this.scene, this.x, this.y);
        newContainer.name = this.name;
        newContainer.setScale(this.scaleX, this.scaleY);
        newContainer.rotation = this.rotation;
        newContainer.alpha = this.alpha;
        newContainer.setVisible(this.visible);
        for (const child of this.list) {
            if (child instanceof Phaser.GameObjects.Text) {
                const c = this.scene.add.text(child.x, child.y, child.text, child.style);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.setOrigin(child.originX, child.originY);
                newContainer.add(c);
            }
            else if (child instanceof Phaser.GameObjects.NineSlice) {
                const c = this.scene.add.nineslice(child.x, child.y, child.texture.key, child.frame.name, child.width, child.height, child.leftWidth, child.rightWidth, child.topHeight, child.bottomHeight);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.add(c);
            }
            else if (child instanceof Phaser.GameObjects.Image) {
                const c = this.scene.add.image(child.x, child.y, child.texture.key, child.frame.name);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.setOrigin(child.originX, child.originY);
                newContainer.add(c);
            }
            else if (child.clone) {
                newContainer.add(child.clone());
            }
        }
        return newContainer;
    }
    getAllOfType(type) {
        // Ensure `getType` is defined for ZContainer instances
        this.getType = this.getType || (() => "default");
        const queue = [];
        const result = [];
        if (this.list && this.list.length > 0) {
            for (let child of this.list) {
                if (child.getType) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            let _t = current.getType?.();
            if (_t === type) {
                result.push(current);
            }
            if (current.list && current.list.length > 0) {
                for (let child of current.list) {
                    if (child.getType) {
                        queue.push(child);
                    }
                }
            }
        }
        return result;
    }
    addParticleSystem(particles) {
        this.particleSystems.push(particles);
        if (!this.emitter) {
            this.emitter = particles; // Keep reference to first emitter for backwards compatibility
        }
    }
    loadParticle(emitterConfig, textureKey) {
        try {
            const particles = this.scene.add.particles(0, 0, textureKey, emitterConfig);
            this.add(particles);
            this.addParticleSystem(particles);
            this.playParticleAnim();
        }
        catch (error) {
            console.error("Error creating ParticleEmitter:", error);
        }
    }
    playParticleAnim() {
        this.particleSystems.forEach(particles => {
            if (particles) {
                particles.start();
            }
        });
    }
    stopParticleAnim() {
        this.particleSystems.forEach(particles => {
            if (particles) {
                particles.stop();
            }
        });
    }
}
//# sourceMappingURL=ZContainer.js.map