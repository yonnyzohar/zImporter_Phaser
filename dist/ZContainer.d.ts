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
    particleSystems: Phaser.GameObjects.Particles.ParticleEmitter[];
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
    getProps(): any;
    setText(text: string): void;
    setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void;
    private resizeText;
    getTextField(): Phaser.GameObjects.Text | null;
    setInstanceData(data: InstanceData, orientation: string): void;
    setFixedBoxSize(value: boolean): void;
    set fitToScreen(value: boolean);
    get fitToScreen(): boolean;
    applyTransform(): void;
    setOrigin(): void;
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    executeFitToScreen(): void;
    setX(value?: number | undefined): this;
    setY(value?: number | undefined): this;
    setWidth(value: number): this;
    setHeight(value: number): this;
    setScaleX(x?: number): this;
    setScaleY(y?: number): this;
    applyAnchor(): void;
    isAnchored(): boolean;
    getAllOfType(type: string): ZContainer[];
    addParticleSystem(particles: Phaser.GameObjects.Particles.ParticleEmitter): void;
    loadParticle(emitterConfig: any, textureKey: string): void;
    playParticleAnim(): void;
    stopParticleAnim(): void;
}
//# sourceMappingURL=ZContainer.d.ts.map