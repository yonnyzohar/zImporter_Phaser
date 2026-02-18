import Phaser from "phaser";
import { SpineData } from "./SceneData";
type SpineCallback = (spineObj: Phaser.GameObjects.GameObject | undefined) => void;
/**
 * ZSpine — Phaser equivalent of the PIXI ZSpine loader.
 *
 * Phaser does not include native Spine support in the core package.
 * This class will use the `SpinePlugin` (phaser3-rex-plugins / phaser-spine
 * official plugin) if it is registered on the scene, otherwise it logs a
 * warning and calls back with `undefined`.
 *
 * The same JSON data format (spineJson + spineAtlas, or spineJson + pngFiles)
 * is supported as in the PIXI version.
 *
 * Usage in ZScene is automatic — just include a `"spine"` node in your
 * placements JSON and it will be picked up.
 *
 * To enable Spine:
 *   1. Install the appropriate Spine plugin for Phaser 3.
 *   2. Register it in your Phaser game config under `plugins`.
 *   3. Ensure spine JSON + atlas files are accessible at the paths specified
 *      in the placement JSON.
 */
export declare class ZSpine {
    private phaserScene;
    private spineData;
    private assetBasePath;
    constructor(scene: Phaser.Scene, spineData: SpineData, assetBasePath: string);
    /**
     * Asynchronously loads and creates a Spine game object.
     * Calls `callback` with the created object, or `undefined` if Spine is
     * not available.
     */
    load(callback: SpineCallback): Promise<void>;
    private getBaseName;
}
export {};
//# sourceMappingURL=ZSpine.d.ts.map