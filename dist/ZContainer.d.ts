import Phaser from "phaser";
import { InstanceData } from "./SceneData";
import { OrientationData } from "./SceneData";
export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}
export declare class ZContainer extends Phaser.GameObjects.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    _fitToScreen: boolean;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    private graphics?;
    constructor(scene: Phaser.Scene, x?: number, y?: number, children?: Phaser.GameObjects.GameObject[]);
    getChildByName(name: string): Phaser.GameObjects.GameObject | null;
    get(childName: string): ZContainer | null;
    getAllByName(childName: string): ZContainer[];
    init(): void;
    getType(): string;
    setFixedBoxSize(value: boolean): void;
    getAllOfType(type: string): ZContainer[];
    setText(text: string): void;
    setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void;
    getProps(): any;
    getTextField(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | any | null;
    set customX(value: number);
    get customX(): number;
    set customY(value: number);
    get customY(): number;
    set customRotation(value: number);
    get customRotation(): number;
    set customScaleX(value: number);
    get customScaleX(): number;
    set customScaleY(value: number);
    get customScaleY(): number;
    set pivotX(value: number);
    get pivotX(): number;
    set pivotY(value: number);
    get pivotY(): number;
    set customWidth(value: number);
    get customWidth(): number;
    set customHeight(value: number);
    get customHeight(): number;
    setInstanceData(data: InstanceData, orientation: string): void;
    set fitToScreen(value: boolean);
    get fitToScreen(): boolean;
    applyTransform(): void;
    setOrigin(): void;
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    executeFitToScreen(): void;
    applyAnchor(): void;
    isAnchored(): boolean;
    loadParticle(emitterConfig: any, textureKey: string): void;
    playParticleAnim(): void;
    stopParticleAnim(): void;
    /**
     * Enable pointer interaction on a Container by assigning a Rectangle hit area
     * based on its current bounds. Containers don't have a default hit area in Phaser.
     */
    enablePointerInteraction(useHandCursor?: boolean): void;
}
//# sourceMappingURL=ZContainer.d.ts.map