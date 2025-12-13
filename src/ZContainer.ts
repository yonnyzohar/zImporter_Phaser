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
    originalFontSize?: number;
    fixedBoxSize?: boolean;
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

    init(): void { }

    public setText(text: string): void {
        let textChild = this.getTextField();
        if (textChild) {
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

    public getTextField(): Phaser.GameObjects.Text | null {
        let textChild = this.getByName("label") as Phaser.GameObjects.Text;
        if (textChild) return textChild;

        for (let child of this.list) {
            if (child instanceof Phaser.GameObjects.Text) {
                return child;
            }
        }
        return null;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        this.name = data.instanceName || "";

        if (data.attrs?.fitToScreen !== undefined) {
            this.fitToScreen = data.attrs.fitToScreen;
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
        if (this._fitToScreen) // if fitToScreen is true, do not apply transform
        {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform) return;
        if (!this.resizeable) return;
        if (this.parentContainer) {
            let currentFrame = (this.parentContainer as any).currentFrame;
            if (currentFrame !== undefined && currentFrame > 0) {
                return; // do not apply transform if parent timeline is playing
            }
        }

        let parentContainer = this.parentContainer as ZContainer;
        if (parentContainer && parentContainer.currentTransform) {
            let parentPivotX = parentContainer.currentTransform.pivotX || 0;
            let parentPivotY = parentContainer.currentTransform.pivotY || 0;

            this.x = ((this.currentTransform.x - parentPivotX) || 0);
            this.y = ((this.currentTransform.y - parentPivotY) || 0);
        }
        else {
            this.x = this.currentTransform.x || 0;
            this.y = this.currentTransform.y || 0;
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
            let childTransform = (child as any).currentTransform;
            if (childTransform) {
                (child as any).x = childTransform.x - pivotX;
                (child as any).y = childTransform.y - pivotY;
            }
            else {
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
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
        this.setSize(this.scene.scale.width, this.scene.scale.height);
        this.setScale(1);
    }

    public applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parentContainer) {
            let xPer = this.currentTransform!.anchorPercentage!.x || 0;
            let yPer = this.currentTransform!.anchorPercentage!.y || 0;
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

    public isAnchored(): boolean {
        return !!this.currentTransform?.isAnchored;
    }

    public getAllOfType(type: string): ZContainer[] {
        // Ensure `getType` is defined for ZContainer instances
        (this as any).getType = (this as any).getType || (() => "default");
        const queue: ZContainer[] = [];
        const result: ZContainer[] = [];
        if (this.list && this.list.length > 0) {
            for (let child of this.list) {
                if ((child as any).getType) {
                    queue.push(child as ZContainer);
                }
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            let _t = (current as any).getType?.();
            if (_t === type) {
                result.push(current);
            }

            if (current.list && current.list.length > 0) {
                for (let child of current.list) {
                    if ((child as any).getType) {
                        queue.push(child as ZContainer);
                    }
                }
            }
        }

        return result as ZContainer[];
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
