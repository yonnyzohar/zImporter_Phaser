import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZNineSlice } from "./ZNineSlice";
import { SceneData, TemplateData, AnimTrackData } from "./SceneData";
export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen";
export declare class ZScene {
    static assetTypes: Map<AssetType, any>;
    private assetBasePath;
    private _sceneStage;
    private data;
    private scene?;
    private resizeMap;
    private static Map;
    private sceneId;
    private orientation;
    private sceneName;
    private phaserScene;
    private usesAtlas;
    constructor(_sceneId: string, phaserScene: Phaser.Scene);
    /**
     * Destroys the scene and its assets, freeing resources.
     */
    destroy(): Promise<void>;
    /**
     * Loads a bitmap font from XML and creates a bitmap text object.
     * @param xmlUrl - The URL to the XML font data.
     * @param textToDisplay - The text to display.
     * @param fontName - The name of the font.
     * @param fontSize - The size of the font.
     * @param callback - Callback to invoke when the font is loaded.
     * @returns A promise that resolves when the font is loaded.
     */
    createBitmapTextFromXML(xmlUrl: string, textToDisplay: string, fontName: string, fontSize: number, callback: Function): Promise<null>;
    /**
     * Loads a texture from a given URL.
     * @param textureUrl - The URL of the texture.
     * @returns A promise that resolves to the loaded Phaser.Texture.
     */
    loadTexture(textureUrl: string): Promise<void>;
    /**
     * Applies visual filters (such as drop shadow) to a Phaser container or text.
     * @param obj - The object containing filter data.
     * @param tf - The Phaser GameObject to apply filters to.
     */
    applyFilters(obj: any, tf: Phaser.GameObjects.GameObject): void;
    get sceneStage(): Phaser.GameObjects.Container;
    setOrientation(): void;
    static getSceneById(sceneId: string): ZScene | undefined;
    loadStage(): void;
    /**
     * Return the inner design resolution adjusted for current orientation.
     */
    getInnerDimensions(): {
        width: number;
        height: number;
    };
    addToResizeMap(mc: ZContainer | ZNineSlice): void;
    removeFromResizeMap(mc: ZContainer): void;
    resize(width: number, height: number): void;
    load(assetBasePath: string, _loadCompleteFnctn: Function): Promise<void>;
    /**
     * Loads the scene's assets and fonts, then initializes the scene.
     * @param assetBasePath - The base path for assets.
     * @param placemenisObj - The placements object describing the scene.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     */
    loadAssets(assetBasePath: string, placementsObj: SceneData, _loadCompleteFnctn: Function): Promise<void>;
    initScene(_placementsObj: SceneData): void;
    static getAssetType(value: string): any;
    static isAssetType(value: string): value is AssetType;
    spawn(tempName: string): ZContainer | undefined;
    getChildrenFrames(_templateName: string): Record<string, AnimTrackData[]>;
    createAsset(mc: ZContainer, baseNode: TemplateData): Promise<void>;
    /**
     * Build a list of unique images to load when not using an atlas.
     * Mirrors the PIXI variant's behavior.
     */
    private createImagesObject;
}
//# sourceMappingURL=ZScene.d.ts.map