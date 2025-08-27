import { EmitterConfigV3 } from "@pixi/particle-emitter";
import * as PIXI from "pixi.js";
export declare enum AnchorConsts {
    NONE = "none",
    TOP_LEFT = "topLeft",
    TOP_RIGHT = "topRight",
    BOTTOM_LEFT = "btmLeft",
    BOTTOM_RIGHT = "btmRight",
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "btm",
    CENTER = "center"
}
export interface InputBoxStyle {
    fill: number;
    rounded?: number;
    stroke?: BoxStroke;
}
export interface InputParams {
    fontFamily: string;
    fontSize: string;
    padding: string;
    width: string;
    color: string | number;
    fontWeight?: string;
    textAlign: string;
    textIndent?: string;
    lineHeight?: string;
}
export interface TextInputObj {
    input: InputParams;
    box: {
        default: InputBoxStyle;
        focused: InputBoxStyle;
        disabled: InputBoxStyle;
    };
}
export interface BoxStroke {
    color?: number;
    width?: number;
    alpha?: number;
}
export type SpriteType = "img" | "9slice";
export interface ResolutionData {
    x: number;
    y: number;
}
export interface OrientationData {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    alpha: number;
    pivotX: number;
    pivotY: number;
    visible: boolean;
    isAnchored: boolean;
    anchorType?: AnchorConsts;
    anchorPercentage?: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface BaseAssetData {
    type: string;
    name: string;
    filters: any;
}
export interface InstanceAttributes {
    fitToScreen?: boolean;
}
export interface InstanceData extends BaseAssetData {
    template: boolean;
    instanceName: string;
    guide: boolean;
    portrait: OrientationData;
    landscape: OrientationData;
    attrs?: InstanceAttributes;
}
export interface SpineData extends BaseAssetData {
    name: string;
    spineJson: string;
    spineAtlas: string;
    pngFiles: string[];
    animations: string[];
    skin?: string;
}
export interface ParticleData extends BaseAssetData {
    jsonPath: string;
    pngPaths: string[];
    name: string;
    emitterConfig: EmitterConfigV3;
}
export interface SpriteData extends BaseAssetData {
    name: string;
    type: SpriteType;
    width: number;
    height: number;
    filePath: string;
    x: number;
    y: number;
}
export interface NineSliceData extends SpriteData {
    top: number;
    bottom: number;
    left: number;
    origWidth: number;
    origHeight: number;
    right: number;
    portrait: OrientationData;
    landscape: OrientationData;
}
export interface TextInputData extends BaseAssetData {
    x: number;
    y: number;
    text: string;
    props: TextInputObj;
}
export interface TextData extends BaseAssetData {
    x: number;
    y: number;
    rotation: number;
    width: number;
    height: number;
    alpha: number;
    size: number | string;
    color: PIXI.TextStyleFill;
    align: string;
    text: string;
    fontName: string | string[];
    z: number;
    stroke?: string | number;
    strokeThickness?: number;
    wordWrap?: boolean;
    wordWrapWidth?: number;
    breakWords?: boolean;
    leading?: number;
    letterSpacing?: number;
    padding?: number | number[];
    textAnchorX: number;
    textAnchorY: number;
    fontWeight: string;
}
export interface TemplateData {
    type: string;
    name: string;
    children: BaseAssetData[];
}
export interface AnimTrackData {
    chilName?: string;
    parentTemplate?: string;
    x?: number;
    y?: number;
    alpha?: number;
    keyFrame?: boolean;
    currentFrame?: number;
    endFrame?: number;
    pivotX?: number;
    pivotY?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    easing?: string;
}
export interface SceneData {
    fps: number;
    resolution: ResolutionData;
    cuePoints: Record<string, Record<number, string>>;
    animTracks?: Record<string, AnimTrackData[]>;
    stage: TemplateData | undefined;
    templates: Record<string, TemplateData>;
    fonts: string[];
}
//# sourceMappingURL=SceneData.d.ts.map