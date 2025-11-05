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
    originalFontSize;
    fixedBoxSize;
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
    setText(text) {
        let textChild = this.getTextField();
        if (textChild) {
            textChild.setText(text);
            if (this.fixedBoxSize && this.originalTextWidth) {
                while (textChild.width > this.originalTextWidth) {
                    let style = textChild.style;
                    textChild.setFontSize(style.fontSize - 1);
                }
            }
            if (textChild.style.align === "center") {
                textChild.setOrigin(0.5, 0.5);
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
        if (data.attrs?.fitToScreen !== undefined) {
            this.fitToScreen = data.attrs.fitToScreen;
        }
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
        if (this._fitToScreen || !this.currentTransform || !this.resizeable)
            return;
        this.x = this.currentTransform.x || 0;
        this.y = this.currentTransform.y || 0;
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);
        this.setOrigin((this.currentTransform.pivotX || 0) / this.width, (this.currentTransform.pivotY || 0) / this.height);
        this.applyAnchor();
    }
    setOrigin(originX, originY) {
        this.list.forEach(child => {
            child.x -= originX;
            child.y -= originY;
        });
        return this;
    }
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    executeFitToScreen() {
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
        this.setSize(this.scene.scale.width, this.scene.scale.height);
        this.setScale(1);
    }
    applyAnchor() {
        if (this.currentTransform?.isAnchored && this.parentContainer) {
            let x = (this.currentTransform.anchorPercentage?.x || 0) * this.scene.scale.width;
            let y = (this.currentTransform.anchorPercentage?.y || 0) * this.scene.scale.height;
            this.setPosition(x, y);
        }
    }
    isAnchored() {
        return !!this.currentTransform?.isAnchored;
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
    /**
     * Enable pointer interaction on a Container by assigning a Rectangle hit area
     * based on its current bounds. Containers don't have a default hit area in Phaser.
     */
    enablePointerInteraction(useHandCursor = true) {
        const bounds = this.getBounds();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        // Set the local input size and a Rectangle hit area in local space
        this.setSize(width, height);
        const rect = new Phaser.Geom.Rectangle(0, 0, width, height);
        this.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
        if (useHandCursor && this.input) {
            // Phaser will switch cursor when hovering this object
            (this.input).cursor = 'pointer';
        }
    }
}
//# sourceMappingURL=ZContainer.js.map