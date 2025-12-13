import Phaser from "phaser";
import { InstanceData } from "./SceneData";
import { OrientationData } from "./SceneData";
import { ZScene } from "./ZScene";
import { ZTimeline } from "./ZTimeline";

export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}

export class ZContainer extends Phaser.GameObjects.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean = true;
    name: string = "";
    _fitToScreen: boolean = false;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    private graphics?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x = 0, y = 0, children?: Phaser.GameObjects.GameObject[]) {
        super(scene, x, y, children);
        scene.add.existing(this);
    }/**/

    getChildByName(name: string): Phaser.GameObjects.GameObject | null {
        return this.list.find(c => c.name === name) || null;
    }

    public get(childName: string): ZContainer | null {
        const queue: ZContainer[] = [];

        this.list.forEach(child => {
            if (child instanceof ZContainer) queue.push(child);
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) {
                return current;
            }
            current.list.forEach(child => {
                if (child instanceof ZContainer) queue.push(child);
            });
        }

        return null;
    }

    getAllByName(childName: string): ZContainer[] {
        const result: ZContainer[] = [];
        const queue: ZContainer[] = [];

        this.list.forEach(child => {
            if (child instanceof ZContainer) queue.push(child);
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) result.push(current);
            current.list.forEach(child => {
                if (child instanceof ZContainer) queue.push(child);
            });
        }

        return result;
    }


    // Called once all children of the container are loaded
    public init(): void {
        let tf = this.getTextField();
        if (tf) {
            // Only handle Phaser.Text, not BitmapText
            if ((tf as any).setFontSize === undefined) return;
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

    public getType(): string {
        return "ZContainer";
    }

    public setFixedBoxSize(value: boolean): void {
        this.fixedBoxSize = value;
    }

    public getAllOfType(type: string): ZContainer[] {
        const queue: ZContainer[] = [];
        const result: ZContainer[] = [];
        this.list.forEach(child => {
            if ((child as any).getType) queue.push(child as ZContainer);
        });
        while (queue.length > 0) {
            const current = queue.shift()!;
            let _t = current.getType();
            if (_t === type) result.push(current);
            current.list.forEach(child => {
                if ((child as any).getType) queue.push(child as ZContainer);
            });
        }
        return result;
    }

    public setText(text: string): void {
        let textChild = this.getTextField();
        if (textChild) {
            if ((textChild as any).setFontSize === undefined) return;
            textChild.setText(text);
            if (this.fixedBoxSize && this.originalTextWidth) {
                while (textChild.width > this.originalTextWidth) {
                    let style = textChild.style;
                    textChild.setFontSize((style.fontSize as number) - 1);
                }
            }
            if (textChild.style.align === "center") {
                textChild.setOrigin(0.5, 0.5);
            }
        }
    }

    public setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void {
        let tf = this.getTextField();
        if (tf && (tf as any).setFontSize !== undefined) {
            tf.setStyle({ ...tf.style, ...data });
            // Optionally resize text if needed
        }
    }

    public getProps(): any {
        return this._props;
    }



    public getTextField(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | any | null {
        // Try to find a text field by name 'label'
        let textChild = this.getByName("label") as Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | any;
        if (textChild) return textChild;
        // Fallback: find first Text, BitmapText, or custom TextInput
        for (let child of this.list) {
            if (child instanceof Phaser.GameObjects.Text || child instanceof Phaser.GameObjects.BitmapText) {
                return child;
            }
            // If you have a custom TextInput, add instanceof check here
        }
        return null;
    }
    // Property setters/getters to keep currentTransform in sync (Pixi parity)
    public set customX(value: number) {
        this.x = value;
        if (this.currentTransform) this.currentTransform.x = value;
    }
    public get customX(): number {
        return this.x;
    }
    public set customY(value: number) {
        this.y = value;
        if (this.currentTransform) this.currentTransform.y = value;
    }
    public get customY(): number {
        return this.y;
    }
    public set customRotation(value: number) {
        this.rotation = value;
        if (this.currentTransform) this.currentTransform.rotation = value;
    }
    public get customRotation(): number {
        return this.rotation;
    }
    public set customScaleX(value: number) {
        this.setScale(value, this.scaleY);
        if (this.currentTransform) this.currentTransform.scaleX = value;
    }
    public get customScaleX(): number {
        return this.scaleX;
    }
    public set customScaleY(value: number) {
        this.setScale(this.scaleX, value);
        if (this.currentTransform) this.currentTransform.scaleY = value;
    }
    public get customScaleY(): number {
        return this.scaleY;
    }
    public set pivotX(value: number) {
        // Phaser containers don't have pivot, but we can store it in currentTransform
        if (this.currentTransform) this.currentTransform.pivotX = value;
    }
    public get pivotX(): number {
        return this.currentTransform?.pivotX || 0;
    }
    public set pivotY(value: number) {
        if (this.currentTransform) this.currentTransform.pivotY = value;
    }
    public get pivotY(): number {
        return this.currentTransform?.pivotY || 0;
    }
    public set customWidth(value: number) {
        // Phaser containers don't have width setter, but we can store it in currentTransform
        if (this.currentTransform) this.currentTransform.scaleX = value / (this.width || 1);
        this.setScale(this.currentTransform?.scaleX || 1, this.currentTransform?.scaleY || 1);
    }
    public get customWidth(): number {
        return this.width;
    }
    public set customHeight(value: number) {
        if (this.currentTransform) this.currentTransform.scaleY = value / (this.height || 1);
        this.setScale(this.currentTransform?.scaleX || 1, this.currentTransform?.scaleY || 1);
    }
    public get customHeight(): number {
        return this.height;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
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
        let tf = this.getTextField();
        if (tf && (tf as any).setFontSize !== undefined) {
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

    set fitToScreen(value: boolean) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        } else {
            this.applyTransform();
        }
    }

    get fitToScreen(): boolean {
        return this._fitToScreen;
    }

    applyTransform() {
        if (this._fitToScreen) {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform) return;
        if (!this.resizeable) return;
        if (this.parentContainer) {
            let currentFrame = (this.parentContainer as any).currentFrame;
            if (currentFrame !== undefined && currentFrame > 0) {
                return;
            }
        }
        this.x = this.currentTransform.x || 0;
        this.y = this.currentTransform.y || 0;
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);
        this.setOrigin();
        this.applyAnchor();
    }

    setOrigin() {
        const pivotX = (this.currentTransform.pivotX) || 0;
        const pivotY = (this.currentTransform.pivotY) || 0;
        this.list.forEach(child => {
            let childTransform = (child as any).currentTransform;
            if (childTransform) {
                (child as any).x = childTransform.x - pivotX;
                (child as any).y = childTransform.y - pivotY;
            } else {
                (child as any).x = -pivotX;
                (child as any).y = -pivotY;
            }
        });
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    executeFitToScreen() {
        // Center and stretch to fit screen, similar to Pixi logic
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
        this.setSize(this.scene.scale.width, this.scene.scale.height);
        this.setScale(1);
    }

    public applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parentContainer) {
            let xPer = this.currentTransform.anchorPercentage?.x || 0;
            let yPer = this.currentTransform.anchorPercentage?.y || 0;
            let x = xPer * window.innerWidth;
            let y = yPer * window.innerHeight;
            // Convert global to local
            const globalPoint = new Phaser.Math.Vector2(x, y);
            const mat = this.parentContainer.getWorldTransformMatrix();
            const inv = new Phaser.GameObjects.Components.TransformMatrix();
            inv.copyFrom(mat);
            inv.invert();
            const localPoint = inv.transformPoint(globalPoint.x, globalPoint.y);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }

    public isAnchored(): boolean {
        return this.currentTransform && this.currentTransform.isAnchored || false;
    }

    public loadParticle(emitterConfig: any, textureKey: string): void {
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
    public enablePointerInteraction(useHandCursor: boolean = true): void {
        const bounds = this.getBounds();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        // Set the local input size and a Rectangle hit area in local space
        this.setSize(width, height);
        const rect = new Phaser.Geom.Rectangle(0, 0, width, height);
        this.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
        if (useHandCursor && (this as any).input) {
            // Phaser will switch cursor when hovering this object
            ((this as any).input).cursor = 'pointer';
        }
    }
}
