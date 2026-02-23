import { TextureAtlas, TextureAtlasPage, TextureAtlasRegion, TextureFilter, TextureWrap, } from "@esotericsoftware/spine-core";
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
    phaserScene;
    spineData;
    assetBasePath;
    constructor(scene, spineData, assetBasePath) {
        this.phaserScene = scene;
        this.spineData = spineData;
        this.assetBasePath = assetBasePath.endsWith("/") ? assetBasePath : assetBasePath + "/";
    }
    async load(callback) {
        const scene = this.phaserScene;
        const data = this.spineData;
        const base = this.assetBasePath;
        const spinePlugin = scene.spine;
        if (!spinePlugin) {
            console.warn(`ZSpine: SpinePlugin not registered on scene.\n` +
                `Add to Phaser config: plugins: { scene: [{ key:"SpinePlugin", plugin: SpinePlugin, mapping:"spine" }] }\n` +
                `Spine asset "${data.name}" will not be displayed.`);
            callback(undefined);
            return;
        }
        const uid = Math.random().toString(36).slice(2);
        const jsonKey = `${data.name}_json_${uid}`;
        const atlasKey = `${data.name}_atlas_${uid}`;
        try {
            if (data.spineAtlas && data.spineAtlas !== "") {
                // Standard path: queue both files then wait for the loader to complete
                scene.load.spineJson(jsonKey, base + data.spineJson);
                scene.load.spineAtlas(atlasKey, base + data.spineAtlas);
                await this.waitForLoader();
            }
            else if (data.pngFiles && data.pngFiles.length > 0) {
                // No-atlas path: load PNGs + JSON, build atlas manually, inject into plugin cache.
                // Also fetch the raw skeleton to find any regions not listed in pngFiles and
                // add transparent fallbacks for them — same behaviour as the PIXI version.
                const [rawSkeleton] = await Promise.all([
                    fetch(base + data.spineJson).then(r => r.json()),
                    this.loadImages(data.pngFiles, base),
                ]);
                await this.loadJsonFile(jsonKey, base + data.spineJson);
                this.buildAndInjectAtlas(atlasKey, data.pngFiles, rawSkeleton, spinePlugin);
            }
            else {
                console.warn(`ZSpine: No atlas or pngFiles for "${data.name}"`);
                callback(undefined);
                return;
            }
            const spineObj = scene.add.spine(0, 0, jsonKey, atlasKey);
            if (!spineObj) {
                console.error(`ZSpine: scene.add.spine returned null for "${data.name}"`);
                callback(undefined);
                return;
            }
            if (data.skin) {
                try {
                    spineObj.skeleton.setSkinByName(data.skin);
                    spineObj.skeleton.setToSetupPose();
                }
                catch (_) { /* skin may not exist */ }
            }
            if (data.playOnStart?.value && data.playOnStart?.animation) {
                try {
                    spineObj.animationState.setAnimation(0, data.playOnStart.animation, true);
                }
                catch (_) { /* animation may not exist */ }
            }
            callback(spineObj);
        }
        catch (err) {
            console.error(`ZSpine: Error loading "${data.name}":`, err);
            callback(undefined);
        }
    }
    /**
     * Builds a TextureAtlas from already-loaded Phaser textures and injects it into
     * the SpinePlugin's atlasCache.
     *
     * Mirrors the PIXI version: iterates every skin attachment in the raw skeleton and
     * adds a 1×1 transparent fallback region for any name not covered by pngFiles, so
     * missing assets produce a console warning instead of a hard crash.
     */
    buildAndInjectAtlas(atlasKey, pngFiles, rawSkeleton, spinePlugin) {
        const internal = spinePlugin;
        const isWebGL = internal.isWebGL;
        const gl = internal.gl;
        // Pass empty string — we override pages/regions immediately after
        const atlas = new TextureAtlas("");
        atlas.pages = [];
        atlas.regions = [];
        for (const png of pngFiles) {
            const texKey = this.texKey(png);
            const phaserTex = this.phaserScene.textures.get(texKey);
            const srcImage = phaserTex?.getSourceImage?.();
            if (!srcImage) {
                console.warn(`ZSpine: No loaded image for "${png}" (key: ${texKey})`);
                continue;
            }
            const w = srcImage.naturalWidth || srcImage.width || 1;
            const h = srcImage.naturalHeight || srcImage.height || 1;
            const fileName = this.fileName(png); // "Spark.png"
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
            region.x = 0;
            region.y = 0;
            region.width = w;
            region.height = h;
            region.originalWidth = w;
            region.originalHeight = h;
            region.offsetX = 0;
            region.offsetY = 0;
            region.degrees = 0;
            region.index = -1;
            region.u = 0;
            region.v = 0;
            region.u2 = 1;
            region.v2 = 1;
            // Wire the texture — page.setTexture() sets filters/wraps and assigns
            // texture to every region in page.regions (region.texture is what the renderer uses)
            if (isWebGL && gl) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { GLTexture } = require("@esotericsoftware/spine-webgl");
                page.setTexture(new GLTexture(gl, srcImage, false));
            }
            else {
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
                    alias.x = region.x;
                    alias.y = region.y;
                    alias.width = region.width;
                    alias.height = region.height;
                    alias.originalWidth = region.originalWidth;
                    alias.originalHeight = region.originalHeight;
                    alias.offsetX = region.offsetX;
                    alias.offsetY = region.offsetY;
                    alias.degrees = region.degrees;
                    alias.index = region.index;
                    alias.u = region.u;
                    alias.v = region.v;
                    alias.u2 = region.u2;
                    alias.v2 = region.v2;
                    atlas.regions.push(alias);
                }
            }
        }
        // --- Mirror PIXI: add transparent fallback for any region referenced by the
        // skeleton but not supplied in pngFiles (warn instead of crash). ---
        const knownRegions = new Set(atlas.regions.map((r) => r.name));
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = 1;
        fallbackCanvas.height = 1;
        const fallbackImg = new Image(1, 1);
        fallbackImg.src = fallbackCanvas.toDataURL();
        const fallbackPage = new TextureAtlasPage("__fallback__.png");
        fallbackPage.width = 1;
        fallbackPage.height = 1;
        fallbackPage.minFilter = TextureFilter.Linear;
        fallbackPage.magFilter = TextureFilter.Linear;
        fallbackPage.uWrap = TextureWrap.ClampToEdge;
        fallbackPage.vWrap = TextureWrap.ClampToEdge;
        if (isWebGL && gl) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { GLTexture } = require("@esotericsoftware/spine-webgl");
            fallbackPage.setTexture(new GLTexture(gl, fallbackImg, false));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { CanvasTexture } = require("@esotericsoftware/spine-canvas");
            fallbackPage.setTexture(new CanvasTexture(fallbackImg));
        }
        let fallbackPageAdded = false;
        const skins = rawSkeleton?.skins ?? [];
        for (const skin of skins) {
            if (!skin.attachments)
                continue;
            for (const slotAttachments of Object.values(skin.attachments)) {
                for (const [attName, att] of Object.entries(slotAttachments)) {
                    const regionName = att?.path ?? attName;
                    if (!knownRegions.has(regionName)) {
                        console.warn(`ZSpine "${this.spineData.name}": region "${regionName}" not in pngFiles — using transparent fallback`);
                        const fallback = new TextureAtlasRegion(fallbackPage, regionName);
                        fallback.x = 0;
                        fallback.y = 0;
                        fallback.width = 1;
                        fallback.height = 1;
                        fallback.originalWidth = 1;
                        fallback.originalHeight = 1;
                        fallback.offsetX = 0;
                        fallback.offsetY = 0;
                        fallback.degrees = 0;
                        fallback.index = -1;
                        fallback.u = 0;
                        fallback.v = 0;
                        fallback.u2 = 1;
                        fallback.v2 = 1;
                        atlas.regions.push(fallback);
                        knownRegions.add(regionName);
                        fallbackPageAdded = true;
                    }
                }
            }
        }
        if (fallbackPageAdded)
            atlas.pages.push(fallbackPage);
        const atlasCache = internal.atlasCache;
        if (atlasCache) {
            atlasCache.add(atlasKey, atlas);
        }
        else {
            console.error("ZSpine: SpinePlugin.atlasCache not accessible");
        }
    }
    /** Load all PNG files into Phaser's texture cache. */
    loadImages(pngFiles, base) {
        let queued = 0;
        for (const png of pngFiles) {
            const key = this.texKey(png);
            if (!this.phaserScene.textures.exists(key)) {
                this.phaserScene.load.image(key, base + png);
                queued++;
            }
        }
        if (queued === 0)
            return Promise.resolve();
        return this.waitForLoader();
    }
    /** Load a JSON file into Phaser's json cache. */
    loadJsonFile(key, url) {
        this.phaserScene.load.json(key, url);
        return this.waitForLoader();
    }
    /** Wait for all currently queued loader files to finish. */
    waitForLoader() {
        return new Promise((resolve, reject) => {
            if (!this.phaserScene.load.isLoading()) {
                this.phaserScene.load.once("complete", () => resolve());
                this.phaserScene.load.once("loaderror", (file) => reject(new Error(`ZSpine: Load error for ${file?.key}`)));
                this.phaserScene.load.start();
            }
            else {
                this.phaserScene.load.once("complete", () => resolve());
                this.phaserScene.load.once("loaderror", (file) => reject(new Error(`ZSpine: Load error for ${file?.key}`)));
            }
        });
    }
    texKey(png) {
        return `${this.spineData.name}_tex_${png.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }
    fileName(png) {
        return png.includes("/") ? png.substring(png.lastIndexOf("/") + 1) : png;
    }
    baseName(png) {
        const file = this.fileName(png);
        return file.includes(".") ? file.substring(0, file.lastIndexOf(".")) : file;
    }
}
//# sourceMappingURL=ZSpine.js.map