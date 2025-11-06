import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { ZState } from "./ZState";
import { ZButton } from "./ZButton";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZNineSlice } from "./ZNineSlice";
export class ZScene {
    static assetTypes = new Map([
        ["btn", ZButton],
        ["asset", ZContainer],
        ["state", ZState],
        ["toggle", ZToggle],
        ["slider", ZSlider],
        ["scrollBar", ZScroll],
        ["fullScreen", ZContainer]
    ]);
    assetBasePath = "";
    _sceneStage;
    data;
    scene;
    resizeMap = new Map();
    static Map = new Map();
    sceneId;
    orientation = "portrait";
    sceneName = null;
    phaserScene;
    usesAtlas = true;
    constructor(_sceneId, phaserScene) {
        this.sceneId = _sceneId;
        this.phaserScene = phaserScene;
        this.setOrientation();
        ZScene.Map.set(_sceneId, this);
    }
    get sceneStage() {
        return this._sceneStage;
    }
    setOrientation() {
        this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    }
    static getSceneById(sceneId) {
        return ZScene.Map.get(sceneId);
    }
    // Add all children to the main stage
    loadStage() {
        this.resize(window.innerWidth, window.innerHeight);
        const stageAssets = this.data.stage;
        const children = stageAssets?.children;
        console.log('Loading stage with', children?.length || 0, 'children');
        if (children) {
            for (const child of children) {
                const tempName = child.name;
                console.log('Spawning template:', tempName);
                const mc = this.spawn(tempName);
                if (mc) {
                    // Set instance data BEFORE adding to stage (like PIXI version)
                    mc.setInstanceData(child, this.orientation);
                    this.addToResizeMap(mc);
                    this._sceneStage.add(mc);
                    this._sceneStage[mc.name] = mc;
                    const bounds = mc.getBounds();
                    console.log('Added to stage:', mc.name, 'visible:', mc.visible, 'alpha:', mc.alpha, 'bounds:', bounds.width, 'x', bounds.height, 'at', mc.x, mc.y);
                }
                else {
                    console.warn('Failed to spawn template:', tempName);
                }
            }
        }
        this.phaserScene.add.existing(this._sceneStage);
        console.log('Scene stage added. Total children:', this._sceneStage.list.length);
        console.log('Scene stage position:', this._sceneStage.x, this._sceneStage.y);
        console.log('Scene stage scale:', this._sceneStage.scaleX, this._sceneStage.scaleY);
        console.log('Scene stage visible:', this._sceneStage.visible, 'alpha:', this._sceneStage.alpha);
        console.log('Scene stage bounds:', this._sceneStage.getBounds());
        // Log first child details for debugging
        if (this._sceneStage.list.length > 0) {
            const firstChild = this._sceneStage.list[0];
            console.log('First child:', firstChild.name, 'type:', firstChild.constructor.name, 'children:', firstChild.list?.length || 0);
            if (firstChild.list && firstChild.list.length > 0) {
                const firstGrandchild = firstChild.list[0];
                console.log('First grandchild:', firstGrandchild.name || 'unnamed', 'type:', firstGrandchild.constructor.name, 'visible:', firstGrandchild.visible, 'alpha:', firstGrandchild.alpha);
            }
        }
        window.game = this._sceneStage;
        this.resize(window.innerWidth, window.innerHeight);
    }
    /**
     * Return the inner design resolution adjusted for current orientation.
     */
    getInnerDimensions() {
        if (!this.data?.resolution) {
            return { width: 0, height: 0 };
        }
        let baseWidth = this.data.resolution.x;
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            [baseWidth, baseHeight] = [baseHeight, baseWidth];
        }
        return { width: baseWidth, height: baseHeight };
    }
    addToResizeMap(mc) {
        this.resizeMap.set(mc, true);
    }
    removeFromResizeMap(mc) {
        this.resizeMap.delete(mc);
    }
    resize(width, height) {
        if (!this.data?.resolution)
            return;
        this.setOrientation();
        let baseWidth = this.data.resolution.x;
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            [baseWidth, baseHeight] = [baseHeight, baseWidth];
        }
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        this._sceneStage.setScale(scale);
        this._sceneStage.setPosition((width - baseWidth * scale) / 2, (height - baseHeight * scale) / 2);
        for (const [mc] of this.resizeMap) {
            mc.resize(width, height, this.orientation);
        }
    }
    /**
     * Loads the scene's assets and fonts, then initializes the scene.
     * @param assetBasePath - The base path for assets.
     * @param placemenisObj - The placements object describing the scene.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     */
    async loadAssets(assetBasePath, placementsObj, _loadCompleteFnctn) {
        const isAtlas = placementsObj.atlas ?? true; // default to true for backward compatibility
        this.usesAtlas = !!isAtlas;
        if (isAtlas) {
            const atlasKey = 'sceneAtlas';
            const atlasJsonUrl = assetBasePath + "ta.json?rnd=" + Math.random();
            const atlasImageUrl = assetBasePath + "ta.png?rnd=" + Math.random();
            // Add error handling for failed loads
            this.phaserScene.load.once('filecomplete-image-' + atlasKey, () => {
                console.log('Atlas image loaded:', atlasKey);
            });
            this.phaserScene.load.once('filecomplete-json-' + atlasKey, () => {
                console.log('Atlas JSON loaded:', atlasKey);
            });
            this.phaserScene.load.once('loaderror', (file) => {
                console.error('Load error:', file.key, file.url, file.error);
            });
            this.phaserScene.load.atlas(atlasKey, atlasImageUrl, atlasJsonUrl);
            this.phaserScene.load.once('complete', () => {
                const texture = this.phaserScene.textures.get(atlasKey);
                if (!texture) {
                    console.error('Atlas texture not found after load complete:', atlasKey);
                    return;
                }
                // Verify texture has frames
                const frameCount = Object.keys(texture.frames).length;
                console.log('Atlas loaded:', atlasKey, 'frames:', frameCount);
                if (frameCount === 0) {
                    console.warn('Atlas has no frames! Check JSON format.');
                }
                this.scene = texture;
                this.sceneName = atlasKey;
                this.initScene(placementsObj);
                _loadCompleteFnctn();
            });
            this.phaserScene.load.start();
            return;
        }
        // Non-atlas mode: load individual images derived from templates
        const images = this.createImagesObject(assetBasePath, placementsObj);
        images.forEach(img => {
            // Avoid duplicate keys
            if (!this.phaserScene.textures.exists(img.alias)) {
                this.phaserScene.load.image(img.alias, img.src);
            }
        });
        // Optional: load bitmap fonts if provided (expects .png and .xml or .fnt next to each other)
        if (placementsObj.fonts && placementsObj.fonts.length > 0) {
            try {
                for (const fontName of placementsObj.fonts) {
                    const pngUrl = assetBasePath + fontName + '.png';
                    const xmlUrl = assetBasePath + fontName + '.fnt';
                    // Phaser will ignore if keys duplicate
                    this.phaserScene.load.bitmapFont(fontName, pngUrl, xmlUrl);
                }
            }
            catch { }
        }
        this.phaserScene.load.once('complete', () => {
            this.sceneName = 'images';
            this.initScene(placementsObj);
            _loadCompleteFnctn();
        });
        this.phaserScene.load.start();
    }
    async load(assetBasePath, _loadCompleteFnctn) {
        this._sceneStage = new Phaser.GameObjects.Container(this.phaserScene); // Will be added to scene later
        this.assetBasePath = assetBasePath;
        const placementsUrl = assetBasePath + "placements.json?rnd=" + Math.random();
        try {
            const response = await fetch(placementsUrl);
            const placementsObj = await response.json();
            this.loadAssets(assetBasePath, placementsObj, _loadCompleteFnctn);
        }
        catch (err) {
            console.error("Failed to load placements:", err);
        }
    }
    initScene(_placementsObj) {
        this.data = _placementsObj;
    }
    static getAssetType(value) {
        return this.assetTypes.get(value);
    }
    static isAssetType(value) {
        return this.assetTypes.has(value);
    }
    spawn(tempName) {
        const templates = this.data.templates;
        const baseNode = templates[tempName];
        if (!baseNode) {
            console.warn('Template not found:', tempName);
            return;
        }
        let mc;
        const frames = this.getChildrenFrames(tempName);
        if (Object.keys(frames).length > 0) {
            mc = new ZTimeline(this.phaserScene);
            this.createAsset(mc, baseNode);
            mc.setFrames(frames);
            if (this.data.cuePoints?.[tempName]) {
                mc.setCuePoints(this.data.cuePoints[tempName]);
            }
            mc.gotoAndStop(0);
        }
        else {
            const AssetClass = ZScene.getAssetType(baseNode.type) || ZContainer;
            mc = new AssetClass(this.phaserScene);
            this.createAsset(mc, baseNode);
            mc.init();
        }
        return mc;
    }
    getChildrenFrames(_templateName) {
        const frames = {};
        const templates = this.data.templates;
        const animTracks = this.data.animTracks;
        const baseNode = templates[_templateName];
        if (baseNode?.children) {
            for (const childNode of baseNode.children) {
                const child = childNode;
                const combinedName = child.instanceName + "_" + _templateName;
                if (animTracks[combinedName])
                    frames[child.instanceName] = animTracks[combinedName];
            }
        }
        return frames;
    }
    async createAsset(mc, baseNode) {
        for (const childNode of baseNode.children) {
            const type = childNode.type;
            let asset;
            // Text (BitmapText preferred if font is available)
            if (type === "textField" || type === "bmpTextField") {
                const textNode = childNode;
                const hasBitmap = this.phaserScene.cache.bitmapFont.exists(textNode.fontName);
                if (hasBitmap) {
                    const tf = this.phaserScene.add.bitmapText(textNode.x, textNode.y, textNode.fontName, textNode.text || "", textNode.size || undefined);
                    if (typeof textNode.letterSpacing === 'number' && tf.setLetterSpacing) {
                        tf.setLetterSpacing(textNode.letterSpacing);
                    }
                    tf.setName(textNode.name);
                    mc.add(tf);
                    mc[textNode.name] = tf;
                }
                else {
                    const style = {
                        fontFamily: textNode.fontName,
                        fontSize: textNode.size,
                        color: textNode.color,
                        align: textNode.align
                    };
                    if (typeof textNode.letterSpacing === 'number') {
                        style.letterSpacing = textNode.letterSpacing;
                    }
                    if (typeof textNode.fontWeight === 'string') {
                        style.fontStyle = textNode.fontWeight; // Phaser uses fontStyle e.g. 'bold'
                    }
                    if (textNode.wordWrap && typeof textNode.wordWrapWidth === 'number') {
                        style.wordWrap = { width: textNode.wordWrapWidth, useAdvancedWrap: true };
                    }
                    const tf = this.phaserScene.add.text(textNode.x, textNode.y, (textNode.text ?? "") + "", style);
                    if (typeof textNode.stroke === 'string' && typeof textNode.strokeThickness === 'number') {
                        tf.setStroke(textNode.stroke, textNode.strokeThickness);
                    }
                    if (typeof textNode.padding === 'number') {
                        tf.setPadding(textNode.padding);
                    }
                    if (typeof textNode.leading === 'number' && tf.setLineSpacing) {
                        tf.setLineSpacing(textNode.leading);
                    }
                    if (typeof textNode.textAnchorX === 'number' && typeof textNode.textAnchorY === 'number') {
                        tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);
                    }
                    // Pivot in PIXI is pixel-based; Phaser origin is normalized. Skipping exact pivot emulation.
                    tf.setName(textNode.name);
                    mc[textNode.name] = tf;
                    mc.add(tf);
                }
            }
            // Sprite
            if (type === "img") {
                const spriteNode = childNode;
                const frameKey = spriteNode.name.replace(/(_IMG|_9S)$/, "");
                if (this.usesAtlas) {
                    const texture = this.scene;
                    if (!texture) {
                        console.error('Cannot create sprite - atlas texture not loaded');
                        continue;
                    }
                    const hasFrame = texture.has(frameKey);
                    if (!hasFrame) {
                        console.warn('Frame not found in atlas:', frameKey, 'Available frames:', Object.keys(texture.frames).slice(0, 10).join(', '));
                    }
                    else {
                        console.log('Creating sprite:', frameKey, 'at', spriteNode.x, spriteNode.y, 'size:', spriteNode.width, spriteNode.height);
                    }
                    asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, this.sceneName, frameKey);
                    if (!asset) {
                        console.error('Failed to create sprite for:', frameKey);
                        continue;
                    }
                }
                else {
                    asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, frameKey);
                }
                asset.setDisplaySize(spriteNode.width, spriteNode.height);
                // Handle pivot like PIXI version - set origin based on pivot
                const pivotX = spriteNode.pivotX || 0;
                const pivotY = spriteNode.pivotY || 0;
                if (spriteNode.width && spriteNode.height && (pivotX !== 0 || pivotY !== 0)) {
                    asset.setOrigin(pivotX / spriteNode.width, pivotY / spriteNode.height);
                }
                console.log('Sprite created:', asset.name || frameKey, 'visible:', asset.visible, 'alpha:', asset.alpha, 'size:', asset.width, asset.height);
                mc.add(asset);
                mc[spriteNode.name] = asset;
            }
            // 9-Slice
            if (type === "9slice") {
                const nineSliceData = childNode;
                const frameKey = nineSliceData.name.replace("_9S", "");
                const textureKeyOrObj = this.usesAtlas ? this.sceneName : frameKey;
                const frame = this.usesAtlas ? frameKey : undefined;
                const nineSlice = new ZNineSlice(this.phaserScene, 0, 0, textureKeyOrObj, frame, nineSliceData, this.orientation);
                mc.add(nineSlice);
                mc[nineSliceData.name] = nineSlice;
                this.addToResizeMap(nineSlice);
            }
            // Spine
            /*
            if (type === "spine") {
              const spineData = childNode as SpineData;
              const zSpine = new ZSpine(spineData, this.assetBasePath);
              await zSpine.load(this.phaserScene, (spine: any) => {
                mc.add(spine);
              });
            }*/
            // Child templates
            const childTemplate = this.data.templates[childNode.name];
            if (childTemplate?.children) {
                this.createAsset(asset || mc, childTemplate);
            }
            asset?.init?.();
        }
    }
    /**
     * Build a list of unique images to load when not using an atlas.
     * Mirrors the PIXI variant's behavior.
     */
    createImagesObject(assetBasePath, obj) {
        const images = [];
        const record = {};
        const templates = obj.templates;
        for (const templateName in templates) {
            const children = templates[templateName].children;
            for (const child of children) {
                if (child.type === 'img' || child.type === '9slice') {
                    const sprite = child;
                    if (!record[sprite.name]) {
                        record[sprite.name] = true;
                        let texName = sprite.name.endsWith('_9S') ? sprite.name.slice(0, -3) : sprite.name;
                        texName = texName.endsWith('_IMG') ? texName.slice(0, -4) : texName;
                        // SceneData SpriteData uses filePath for non-atlas images
                        images.push({ alias: texName, src: assetBasePath + sprite.filePath });
                    }
                }
            }
        }
        return images;
    }
}
//# sourceMappingURL=ZScene.js.map