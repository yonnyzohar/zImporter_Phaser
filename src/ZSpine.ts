import Phaser from "phaser";
import { SpineData } from "./SceneData";
import { SpinePlugin } from "@esotericsoftware/spine-phaser";
import {
    TextureAtlas,
    TextureAtlasPage,
    TextureAtlasRegion,
    TextureFilter,
    TextureWrap,
} from "@esotericsoftware/spine-core";

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
export class ZSpine {
    private phaserScene: Phaser.Scene;
    private spineData: SpineData;
    private assetBasePath: string;

    constructor(scene: Phaser.Scene, spineData: SpineData, assetBasePath: string) {
        this.phaserScene = scene;
        this.spineData = spineData;
        this.assetBasePath = assetBasePath.endsWith("/") ? assetBasePath : assetBasePath + "/";
    }

    async load(callback: SpineCallback): Promise<void> {
        const scene = this.phaserScene;
        const data = this.spineData;
        const base = this.assetBasePath;

        const spinePlugin = (scene as any).spine as SpinePlugin | undefined;
        if (!spinePlugin) {
            console.warn(
                `ZSpine: SpinePlugin not registered on scene.\n` +
                `Add to Phaser config: plugins: { scene: [{ key:"SpinePlugin", plugin: SpinePlugin, mapping:"spine" }] }\n` +
                `Spine asset "${data.name}" will not be displayed.`
            );
            callback(undefined);
            return;
        }

        const uid = Math.random().toString(36).slice(2);
        const jsonKey = `${data.name}_json_${uid}`;
        const atlasKey = `${data.name}_atlas_${uid}`;

        try {
            if (data.spineAtlas && data.spineAtlas !== "") {
                // Standard path: use the plugin's own loader extensions
                await this.loadPluginFile(() =>
                    (scene.load as any).spineJson(jsonKey, base + data.spineJson)
                );
                await this.loadPluginFile(() =>
                    (scene.load as any).spineAtlas(atlasKey, base + data.spineAtlas)
                );
            } else if (data.pngFiles && data.pngFiles.length > 0) {
                // No-atlas path: load PNGs + JSON, build atlas manually, inject into plugin cache
                await this.loadImages(data.pngFiles, base);
                await this.loadJsonFile(jsonKey, base + data.spineJson);
                this.buildAndInjectAtlas(atlasKey, data.pngFiles, spinePlugin);
            } else {
                console.warn(`ZSpine: No atlas or pngFiles for "${data.name}"`);
                callback(undefined);
                return;
            }

            const spineObj = (scene.add as any).spine(0, 0, jsonKey, atlasKey);
            if (!spineObj) {
                console.error(`ZSpine: scene.add.spine returned null for "${data.name}"`);
                callback(undefined);
                return;
            }

            if (data.skin) {
                try {
                    spineObj.skeleton.setSkinByName(data.skin);
                    spineObj.skeleton.setToSetupPose();
                } catch (_) { /* skin may not exist */ }
            }

            if (data.playOnStart?.value && data.playOnStart?.animation) {
                try {
                    spineObj.animationState.setAnimation(0, data.playOnStart.animation, true);
                } catch (_) { /* animation may not exist */ }
            }

            callback(spineObj as unknown as Phaser.GameObjects.GameObject);
        } catch (err) {
            console.error(`ZSpine: Error loading "${data.name}":`, err);
            callback(undefined);
        }
    }

    /**
     * Builds a TextureAtlas directly from already-loaded Phaser textures,
     * wires GLTexture (WebGL) or CanvasTexture wrappers, and injects into
     * the SpinePlugin's atlasCache. getAtlas() checks atlasCache first —
     * it returns the pre-built atlas directly without parsing any text file.
     */
    private buildAndInjectAtlas(atlasKey: string, pngFiles: string[], spinePlugin: SpinePlugin): void {
        const isWebGL: boolean = (spinePlugin as any).isWebGL;
        const gl: WebGLRenderingContext | null = (spinePlugin as any).gl;

        // Pass empty string — we override pages/regions immediately after
        const atlas = new TextureAtlas("");
        atlas.pages = [];
        atlas.regions = [];

        for (const png of pngFiles) {
            const texKey = this.texKey(png);
            const phaserTex = this.phaserScene.textures.get(texKey);
            const srcImage = phaserTex?.getSourceImage?.() as HTMLImageElement | null;
            if (!srcImage) {
                console.warn(`ZSpine: No loaded image for "${png}" (key: ${texKey})`);
                continue;
            }

            const w = (srcImage as any).naturalWidth || (srcImage as any).width || 1;
            const h = (srcImage as any).naturalHeight || (srcImage as any).height || 1;
            const fileName = this.fileName(png);   // "Spark.png"
            const regionName = this.baseName(png); // "Spark"

            // One page per PNG
            const page = new TextureAtlasPage(fileName);
            page.width = w;
            page.height = h;
            page.minFilter = TextureFilter.Linear;
            page.magFilter = TextureFilter.Linear;
            page.uWrap = TextureWrap.ClampToEdge;
            page.vWrap = TextureWrap.ClampToEdge;

            // Region: one per page, full image (constructor auto-pushes to page.regions)
            const region = new TextureAtlasRegion(page, regionName);
            region.x = 0; region.y = 0;
            region.width = w; region.height = h;
            region.originalWidth = w; region.originalHeight = h;
            region.offsetX = 0; region.offsetY = 0;
            region.degrees = 0; region.index = -1;
            region.u = 0; region.v = 0; region.u2 = 1; region.v2 = 1;

            // Wire the texture — page.setTexture() sets filters/wraps and assigns
            // texture to every region in page.regions (region.texture is what the renderer uses)
            if (isWebGL && gl) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { GLTexture } = require("@esotericsoftware/spine-webgl");
                page.setTexture(new GLTexture(gl, srcImage, false));
            } else {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { CanvasTexture } = require("@esotericsoftware/spine-canvas");
                page.setTexture(new CanvasTexture(srcImage));
            }

            atlas.pages.push(page);
            atlas.regions.push(region);

            // Alias "Frame0" → "Frame" so attachments referencing the base name resolve
            const seqMatch = regionName.match(/^(.*?)(\d+)$/);
            if (seqMatch && parseInt(seqMatch[2], 10) === 0) {
                const baseName = seqMatch[1];
                if (!atlas.regions.find((r) => r.name === baseName)) {
                    const alias = new TextureAtlasRegion(page, baseName);
                    alias.x = region.x; alias.y = region.y;
                    alias.width = region.width; alias.height = region.height;
                    alias.originalWidth = region.originalWidth; alias.originalHeight = region.originalHeight;
                    alias.offsetX = region.offsetX; alias.offsetY = region.offsetY;
                    alias.degrees = region.degrees; alias.index = region.index;
                    alias.u = region.u; alias.v = region.v; alias.u2 = region.u2; alias.v2 = region.v2;
                    atlas.regions.push(alias);
                }
            }
        }

        const atlasCache: any = (spinePlugin as any).atlasCache;
        if (atlasCache) {
            atlasCache.add(atlasKey, atlas);
        } else {
            console.error("ZSpine: SpinePlugin.atlasCache not accessible");
        }
    }

    /** Load all PNG files into Phaser's texture cache. */
    private loadImages(pngFiles: string[], base: string): Promise<void> {
        return new Promise<void>((resolve) => {
            const pending: string[] = [];
            for (const png of pngFiles) {
                const key = this.texKey(png);
                if (!this.phaserScene.textures.exists(key)) {
                    this.phaserScene.load.image(key, base + png);
                    pending.push(key);
                }
            }
            if (pending.length === 0) { resolve(); return; }

            let done = 0;
            const onDone = (loadedKey: string) => {
                if (!pending.includes(loadedKey)) return;
                done++;
                if (done >= pending.length) {
                    this.phaserScene.load.off("filecomplete", onDone);
                    resolve();
                }
            };
            this.phaserScene.load.on("filecomplete", onDone);
            this.phaserScene.load.start();
        });
    }

    /** Load a JSON file into Phaser's json cache. */
    private loadJsonFile(key: string, url: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.phaserScene.load.json(key, url);
            this.phaserScene.load.once(`filecomplete-json-${key}`, () => resolve());
            this.phaserScene.load.once("loaderror", (file: any) =>
                reject(new Error(`ZSpine: Load error for ${file?.key ?? url}`))
            );
            this.phaserScene.load.start();
        });
    }

    /** Wrapper for a single plugin file loader call (spineJson / spineAtlas). */
    private loadPluginFile(register: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            register();
            this.phaserScene.load.once("filecomplete", () => resolve());
            this.phaserScene.load.once("loaderror", (file: any) =>
                reject(new Error(`ZSpine: Load error for ${file?.key}`))
            );
            this.phaserScene.load.start();
        });
    }

    private texKey(png: string): string {
        return `${this.spineData.name}_tex_${png.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    private fileName(png: string): string {
        return png.includes("/") ? png.substring(png.lastIndexOf("/") + 1) : png;
    }

    private baseName(png: string): string {
        const file = this.fileName(png);
        return file.includes(".") ? file.substring(0, file.lastIndexOf(".")) : file;
    }
}
