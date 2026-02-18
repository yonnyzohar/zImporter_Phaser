import Phaser from "phaser";
import { SpineData } from "./SceneData";
type SpineCallback = (spineObj: Phaser.GameObjects.GameObject | undefined) => void;
/**
 * ZSpine — loads a Spine 4.x skeleton using the @esotericsoftware/spine-phaser plugin.
 *
 * Supports both:
 *  - Standard path: spineJson + spineAtlas file via plugin loader
 *  - No-atlas path: spineJson + individual pngFiles
 *    PNGs are loaded as Phaser textures, then a TextureAtlas is built manually
 *    (mirroring the PIXI version) and injected into the plugin's atlasCache.
 *
 * Register SpinePlugin in your Phaser game config:
 *   plugins: { scene: [{ key: "SpinePlugin", plugin: SpinePlugin, mapping: "spine" }] }
 */
export declare class ZSpine {
    private phaserScene;
    private spineData;
    private assetBasePath;
    constructor(scene: Phaser.Scene, spineData: SpineData, assetBasePath: string);
    load(callback: SpineCallback): Promise<void>;
    /**
     * Builds a TextureAtlas from already-loaded Phaser textures and injects it into
     * the SpinePlugin's atlasCache.
     *
     * Mirrors the PIXI version: iterates every skin attachment in the raw skeleton and
     * adds a 1×1 transparent fallback region for any name not covered by pngFiles, so
     * missing assets produce a console warning instead of a hard crash.
     */
    private buildAndInjectAtlas;
    /** Load all PNG files into Phaser's texture cache. */
    private loadImages;
    /** Load a JSON file into Phaser's json cache. */
    private loadJsonFile;
    /** Wait for all currently queued loader files to finish. */
    private waitForLoader;
    private texKey;
    private fileName;
    private baseName;
}
export {};
//# sourceMappingURL=ZSpine.d.ts.map