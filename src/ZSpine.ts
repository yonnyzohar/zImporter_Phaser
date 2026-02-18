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
export class ZSpine {
    private phaserScene: Phaser.Scene;
    private spineData: SpineData;
    private assetBasePath: string;

    constructor(scene: Phaser.Scene, spineData: SpineData, assetBasePath: string) {
        this.phaserScene = scene;
        this.spineData = spineData;
        this.assetBasePath = assetBasePath;
    }

    /**
     * Asynchronously loads and creates a Spine game object.
     * Calls `callback` with the created object, or `undefined` if Spine is
     * not available.
     */
    async load(callback: SpineCallback): Promise<void> {
        const scene = this.phaserScene;
        const data = this.spineData;
        const base = this.assetBasePath;

        // Check if the SpinePlugin is available on this scene
        const spinePlugin = (scene as any).spine;
        if (!spinePlugin) {
            console.warn(
                `ZSpine: Spine plugin not found on scene. ` +
                `Register a Spine plugin (e.g. the official phaser3-spine plugin) ` +
                `in your Phaser game config to enable Spine animations.\n` +
                `Spine asset "${data.name}" will not be displayed.`
            );
            callback(undefined);
            return;
        }

        const spineKey = data.name + "_spine_" + Math.random().toString(36).slice(2);

        try {
            // Load the atlas + JSON via Phaser loader
            const jsonUrl = base + data.spineJson;

            if (data.spineAtlas && data.spineAtlas !== "") {
                const atlasUrl = base + data.spineAtlas;

                // Wait for load completion
                await new Promise<void>((resolve, reject) => {
                    (scene.load as any).spine(spineKey, jsonUrl, atlasUrl, false);
                    scene.load.once("filecomplete", () => resolve());
                    scene.load.once("loaderror", (file: any) => reject(new Error(`Failed to load spine: ${file.key}`)));
                    scene.load.start();
                });

                // Create spine game object
                const spineObj = (spinePlugin as any).add(0, 0, spineKey, undefined, true);
                if (!spineObj) {
                    callback(undefined);
                    return;
                }

                if (data.skin) {
                    try { spineObj.setSkin(data.skin); } catch (e) { /* ignore */ }
                }

                if (data.playOnStart?.value && data.playOnStart?.animation) {
                    try {
                        spineObj.play(data.playOnStart.animation, true, true);
                    } catch (e) { /* ignore */ }
                }

                callback(spineObj as unknown as Phaser.GameObjects.GameObject);

            } else if (data.pngFiles && data.pngFiles.length) {
                // No atlas — load individual PNG textures then build a fake atlas
                // This path is best-effort; the spine plugin typically requires an atlas file.
                console.warn("ZSpine: Loading Spine without atlas (individual PNGs) is not reliably supported in Phaser. Consider exporting with an atlas.");

                // Preload all PNGs first
                await new Promise<void>((resolve) => {
                    let loaded = 0;
                    for (const png of data.pngFiles) {
                        const texKey = data.name + "_" + this.getBaseName(png);
                        if (!scene.textures.exists(texKey)) {
                            scene.load.image(texKey, base + png);
                        } else {
                            loaded++;
                        }
                    }
                    if (loaded >= data.pngFiles.length) {
                        resolve();
                        return;
                    }
                    scene.load.on("filecomplete", () => {
                        loaded++;
                        if (loaded >= data.pngFiles.length) resolve();
                    });
                    scene.load.start();
                });

                // Attempt to load just the JSON — may partially work if the plugin
                // can resolve attachments from already-loaded textures
                await new Promise<void>((resolve) => {
                    (scene.load as any).spineJson(spineKey, base + data.spineJson);
                    scene.load.once("filecomplete", () => resolve());
                    scene.load.start();
                });

                try {
                    const spineObj = spinePlugin.add(0, 0, spineKey, undefined, true);
                    if (data.skin) { try { spineObj.setSkin(data.skin); } catch (e) { /* */ } }
                    if (data.playOnStart?.value && data.playOnStart?.animation) {
                        try { spineObj.play(data.playOnStart.animation, true, true); } catch (e) { /* */ }
                    }
                    callback(spineObj as unknown as Phaser.GameObjects.GameObject);
                } catch (e) {
                    console.error("ZSpine: Failed to create spine object:", e);
                    callback(undefined);
                }
            } else {
                console.warn("ZSpine: No atlas or pngFiles provided for spine", data.name);
                callback(undefined);
            }
        } catch (err) {
            console.error("ZSpine: Error loading spine asset:", err);
            callback(undefined);
        }
    }

    private getBaseName(path: string): string {
        const lastSlash = path.lastIndexOf("/");
        const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        const lastDot = fileName.lastIndexOf(".");
        return lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
    }
}
