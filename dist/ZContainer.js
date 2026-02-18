import Phaser from "phaser";
export class ZContainer extends Phaser.GameObjects.Container {
    portrait;
    landscape;
    currentTransform;
    resizeable = true;
    name = "";
    _fitToScreen = false;
    emitter;
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
    init() { }
    getType() {
        return "ZContainer";
    }
    getProps() {
        return this._props;
    }
    setText(text) {
        let textChild = this.getTextField();
        if (textChild) {
            textChild.setText(text);
            if (this.fixedBoxSize) {
                let maxWidth = this.originalTextWidth;
                let maxHeight = this.originalTextHeight;
                if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                    while ((maxWidth !== undefined && textChild.width > maxWidth) ||
                        (maxHeight !== undefined && textChild.height > maxHeight)) {
                        const currentSize = parseFloat(textChild.style.fontSize) || 12;
                        textChild.setFontSize(currentSize - 1);
                    }
                }
            }
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
            this.setX((this.currentTransform.x - parentPivotX) || 0);
            this.setY((this.currentTransform.y - parentPivotY) || 0);
        }
        else {
            this.setX(this.currentTransform.x || 0);
            this.setY(this.currentTransform.y || 0);
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
                child.setX(childTransform.x - pivotX);
                child.setY(childTransform.y - pivotY);
            }
            else {
                child.setX(-pivotX);
                child.setY(-pivotY);
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
        // Reset scale so measurements are at natural size
        this.setScale(1, 1);
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
        // Position container at top-left of screen
        this.x = topLeft.x;
        this.y = topLeft.y;
        const firstChild = this.list[0];
        const isNineSlice = firstChild instanceof Phaser.GameObjects.NineSlice;
        if (isNineSlice) {
            firstChild.width = localScreenW;
            firstChild.height = localScreenH;
            return;
        }
        // Get natural content bounds in world space at scale=1
        const naturalBounds = this.getBounds();
        if (naturalBounds.width === 0 || naturalBounds.height === 0)
            return;
        // Natural content size in parent-local units
        const pScaleX = parentMat ? this._getParentWorldScaleX() : 1;
        const pScaleY = parentMat ? this._getParentWorldScaleY() : 1;
        const localContentW = naturalBounds.width / pScaleX;
        const localContentH = naturalBounds.height / pScaleY;
        let scale;
        if (screenWidth > screenHeight) {
            // Landscape: scale to fill width
            scale = localScreenW / localContentW;
        }
        else {
            // Portrait: scale to fill height
            scale = localScreenH / localContentH;
        }
        this.setScale(scale, scale);
        // Center around screen midpoint
        const displayedW = localContentW * scale;
        const displayedH = localContentH * scale;
        this.x = mid.x - displayedW / 2;
        this.y = mid.y - displayedH / 2;
    }
    _getParentWorldScaleX() {
        if (!this.parentContainer)
            return 1;
        const mat = this.parentContainer.getWorldTransformMatrix();
        return Math.sqrt(mat.a * mat.a + mat.b * mat.b);
    }
    _getParentWorldScaleY() {
        if (!this.parentContainer)
            return 1;
        const mat = this.parentContainer.getWorldTransformMatrix();
        return Math.sqrt(mat.c * mat.c + mat.d * mat.d);
    }
    /**/
    setX(value) {
        super.setX(value);
        if (this.currentTransform) {
            //this.currentTransform.x = value!;
        }
        return this;
    }
    setY(value) {
        super.setY(value);
        if (this.currentTransform) {
            //this.currentTransform.y = value!;
        }
        return this;
    }
    setWidth(value) {
        super.setSize(value, this.height);
        if (this.currentTransform) {
            //this.currentTransform.width = value;
        }
        return this;
    }
    setHeight(value) {
        super.setSize(this.width, value);
        if (this.currentTransform) {
            //this.currentTransform.height = value;
        }
        return this;
    }
    setScaleX(x) {
        super.setScale(x, this.scaleY);
        if (this.currentTransform) {
            //this.currentTransform.scaleX = x!;
        }
        return this;
    }
    setScaleY(y) {
        super.setScale(this.scaleX, y);
        if (this.currentTransform) {
            //this.currentTransform.scaleY = y!;
        }
        return this;
    }
    applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parentContainer) {
            let xPer = this.currentTransform.anchorPercentage.x || 0;
            let yPer = this.currentTransform.anchorPercentage.y || 0;
            let x = xPer * window.innerWidth;
            let y = yPer * window.innerHeight;
            const globalPoint = this.getWorldTransformMatrix().transformPoint(x, y);
            const mat = this.parentContainer.getWorldTransformMatrix();
            const inv = new Phaser.GameObjects.Components.TransformMatrix();
            inv.copyFrom(mat);
            inv.invert();
            const localPoint = inv.transformPoint(globalPoint.x, globalPoint.y);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }
    isAnchored() {
        return !!this.currentTransform?.isAnchored;
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
    loadParticle(emitterConfig, textureKey) {
        /*
        try {
            const manager = this.scene.add.particles(textureKey);
            this.emitter = manager.createEmitter(emitterConfig);
            this.add(manager); // attach emitter manager to container
            this.playParticleAnim();
        } catch (error) {
            console.error("Error creating ParticleEmitter:", error);
        }
        */
    }
    playParticleAnim() {
        // if (this.emitter) this.emitter.on = true;
    }
    stopParticleAnim() {
        // if (this.emitter) this.emitter.on = false;
    }
}
//# sourceMappingURL=ZContainer.js.map