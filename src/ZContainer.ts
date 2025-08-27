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
        if (this._fitToScreen || !this.currentTransform || !this.resizeable) return;

        this.x = this.currentTransform.x || 0;
        this.y = this.currentTransform.y || 0;
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);
        this.setOrigin(
            (this.currentTransform.pivotX || 0) / this.width,
            (this.currentTransform.pivotY || 0) / this.height
        );
        this.applyAnchor();
    }

    setOrigin(originX: number, originY: number): this {
        this.list.forEach(child => {
            (child as any).x -= originX;
            (child as any).y -= originY;
        });
        return this;
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
        if (this.currentTransform?.isAnchored && this.parentContainer) {
            let x = (this.currentTransform.anchorPercentage?.x || 0) * this.scene.scale.width;
            let y = (this.currentTransform.anchorPercentage?.y || 0) * this.scene.scale.height;
            this.setPosition(x, y);
        }
    }

    public isAnchored(): boolean {
        return !!this.currentTransform?.isAnchored;
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
}
