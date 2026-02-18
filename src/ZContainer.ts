import Phaser from "phaser";
import { InstanceData } from "./SceneData";
import { OrientationData } from "./SceneData";
import { ZScene } from "./ZScene";
import { ZTimeline } from "./ZTimeline";
import { updateHitArea } from "./ZButton";

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

    init(): void { }

    public getType(): string {
        return "ZContainer";
    }

    public getProps(): any {
        return this._props;
    }

    public setText(text: string): void {
        let textChild = this.getTextField();
        if (textChild) {
            textChild.setText(text);

            if (this.fixedBoxSize) {
                let maxWidth = this.originalTextWidth;
                let maxHeight = this.originalTextHeight;
                if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                    while (
                        (maxWidth !== undefined && textChild.width > maxWidth) ||
                        (maxHeight !== undefined && textChild.height > maxHeight)
                    ) {
                        const currentSize = parseFloat(textChild.style.fontSize as string) || 12;
                        textChild.setFontSize(currentSize - 1);
                    }
                }
            }

            if (textChild.style.align === "center") {
                textChild.setOrigin(0.5, 0.5);
            }
        }
    }

    public setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void {
        let tf = this.getTextField();
        if (tf) {
            tf.setStyle(data);
            this.resizeText(tf);
        }
    }

    private resizeText(textChild: Phaser.GameObjects.Text): void {
        if (this.fixedBoxSize) {
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while (
                    (maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)
                ) {
                    const currentSize = parseFloat(textChild.style.fontSize as string) || 12;
                    if (currentSize <= 1) break;
                    textChild.setFontSize(currentSize - 1);
                }
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
                    ? parseFloat(tf.style.fontSize as string)
                    : undefined;
        }
    }

    public setFixedBoxSize(value: boolean): void {
        this.fixedBoxSize = value;
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

        // In PIXI, container.pivot shifts the container's own registration point — it does NOT
        // move children. We emulate this by absorbing (scale × ownPivot) into the container's
        // Phaser x/y. Children keep their raw data.x / data.y values untouched.
        const scaleX = this.currentTransform.scaleX || 1;
        const scaleY = this.currentTransform.scaleY || 1;
        const ownPivotX = this.currentTransform.pivotX || 0;
        const ownPivotY = this.currentTransform.pivotY || 0;

        this.x = (this.currentTransform.x || 0) - scaleX * ownPivotX;
        this.y = (this.currentTransform.y || 0) - scaleY * ownPivotY;

        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(scaleX, scaleY);

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
            if ((child as any)._fitToScreen) return;

            let childTransform = (child as any).currentTransform;
            if (childTransform) {
                (child as any).setX(childTransform.x - pivotX);
                (child as any).setY(childTransform.y - pivotY);
            }
            else {
                (child as any).setX(-pivotX);
                (child as any).setY(-pivotY);
            }

        });
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    executeFitToScreen() {
        if (this.list.length === 0) return;

        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        // Reset scale so measurements are at natural size
        this.setScale(1, 1);

        // Helper: convert a world-space point to parent-local coords
        const parentMat = this.parentContainer
            ? this.parentContainer.getWorldTransformMatrix()
            : null;
        const toLocal = (wx: number, wy: number): { x: number; y: number } =>
            parentMat ? parentMat.applyInverse(wx, wy) : { x: wx, y: wy };

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

        const firstChild = this.list[0] as any;
        const isNineSlice = firstChild instanceof Phaser.GameObjects.NineSlice;

        if (isNineSlice) {
            firstChild.width = localScreenW;
            firstChild.height = localScreenH;
            return;
        }

        // Get natural content bounds in world space at scale=1
        const naturalBounds = this.getBounds();
        if (naturalBounds.width === 0 || naturalBounds.height === 0) return;

        // Natural content size in parent-local units
        const pScaleX = parentMat ? this._getParentWorldScaleX() : 1;
        const pScaleY = parentMat ? this._getParentWorldScaleY() : 1;
        const localContentW = naturalBounds.width / pScaleX;
        const localContentH = naturalBounds.height / pScaleY;

        let scale: number;
        if (screenWidth > screenHeight) {
            // Landscape: scale to fill width
            scale = localScreenW / localContentW;
        } else {
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

    private _getParentWorldScaleX(): number {
        if (!this.parentContainer) return 1;
        const mat = this.parentContainer.getWorldTransformMatrix();
        return Math.sqrt(mat.a * mat.a + mat.b * mat.b);
    }

    private _getParentWorldScaleY(): number {
        if (!this.parentContainer) return 1;
        const mat = this.parentContainer.getWorldTransformMatrix();
        return Math.sqrt(mat.c * mat.c + mat.d * mat.d);
    }
    /**/
    public setX(value?: number | undefined): this {

        super.setX(value);
        if (this.currentTransform) {
            //this.currentTransform.x = value!;
        }
        return this;
    }

    public setY(value?: number | undefined): this {

        super.setY(value);
        if (this.currentTransform) {
            //this.currentTransform.y = value!;
        }
        return this;
    }

    public setWidth(value: number): this {
        super.setSize(value, this.height);
        if (this.currentTransform) {
            //this.currentTransform.width = value;
        }
        return this;
    }

    public setHeight(value: number): this {
        super.setSize(this.width, value);
        if (this.currentTransform) {
            //this.currentTransform.height = value;
        }
        return this;
    }

    public setScaleX(x?: number): this {
        super.setScale(x, this.scaleY);
        if (this.currentTransform) {
            //this.currentTransform.scaleX = x!;
        }
        return this;

    }

    public setScaleY(y?: number): this {
        super.setScale(this.scaleX, y);
        if (this.currentTransform) {
            //this.currentTransform.scaleY = y!;
        }
        return this;
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
    }*/
}
