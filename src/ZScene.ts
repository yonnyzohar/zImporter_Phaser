import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { ZState } from "./ZState";
import { ZButton } from "./ZButton";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZNineSlice } from "./ZNineSlice";
import { SceneData, TemplateData, InstanceData, AnimTrackData, SpriteData, SpineData, NineSliceData, ParticleData, TextData, TextInputData, BaseAssetData, BitmapFontLocked } from "./SceneData";
import { ZTextInput } from "./ZTextInput";
import { ZSpine } from "./ZSpine";

export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen" | "animation";

export class ZScene {

  static assetTypes: Map<AssetType, any> = new Map<AssetType, any>([
    ["btn", ZButton],
    ["asset", ZContainer],
    ["state", ZState],
    ["toggle", ZToggle],
    ["slider", ZSlider],
    ["scrollBar", ZScroll],
    ["fullScreen", ZContainer],
    ["animation", ZTimeline]
  ] as [AssetType, any][]);

  private assetBasePath: string = "";
  private _sceneStage!: ZContainer;
  private data: SceneData;
  private scene?: Phaser.Textures.Texture;
  private resizeMap: Map<ZContainer | ZNineSlice, boolean> = new Map();
  private static Map: Map<string, ZScene> = new Map();
  private sceneId: string;
  private orientation: "landscape" | "portrait" = "portrait";
  private sceneName: string | null = null;
  private phaserScene!: Phaser.Scene;
  private usesAtlas: boolean = true;

  constructor(_sceneId: string, phaserScene: Phaser.Scene) {
    this.sceneId = _sceneId;
    this.phaserScene = phaserScene;
    this.setOrientation();
    ZScene.Map.set(_sceneId, this);

  }

  /**
   * Destroys the scene and its assets, freeing resources.
   */
  async destroy(): Promise<void> {
    // Remove all children from the stage
    if (this._sceneStage) {
      this._sceneStage.removeAll(true);
      if (this._sceneStage.scene) {
        this._sceneStage.scene.children.remove(this._sceneStage);
      }
    }
    // Remove textures if loaded
    if (this.sceneName && this.phaserScene.textures.exists(this.sceneName)) {
      this.phaserScene.textures.remove(this.sceneName);
    }
    // Optionally clear bitmap fonts
    // (Phaser does not provide a direct API to remove bitmap fonts, but you can clear cache if needed)
  }

  /**
   * Loads a bitmap font from XML and creates a bitmap text object.
   * @param xmlUrl - The URL to the XML font data.
   * @param textToDisplay - The text to display.
   * @param fontName - The name of the font.
   * @param fontSize - The size of the font.
   * @param callback - Callback to invoke when the font is loaded.
   * @returns A promise that resolves when the font is loaded.
   */
  async createBitmapTextFromXML(
    xmlUrl: string,
    textToDisplay: string,
    fontName: string,
    fontSize: number,
    callback: Function
  ) {
    // Load the XML font data
    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML font data: ${response.statusText}`);
    }
    const xmlData = await response.text();
    // Parse XML to get the page file
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");
    const pageElement = xmlDoc.querySelector("page");
    if (!pageElement) {
      throw new Error("Page element not found in XML");
    }
    const fileAttribute = pageElement.getAttribute("file");
    if (!fileAttribute) {
      throw new Error("Page file attribute not found in XML");
    }
    const textureUrl: string = this.assetBasePath + fileAttribute;
    await this.loadTexture(textureUrl);
    // Phaser will have loaded the bitmap font if it was queued in loadAssets
    if (this.phaserScene.cache.bitmapFont.exists(fontName)) {
      callback();
    }
    return null;
  }

  /**
   * Loads a texture from a given URL.
   * @param textureUrl - The URL of the texture.
   * @returns A promise that resolves to the loaded Phaser.Texture.
   */
  loadTexture(textureUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Phaser loads textures via the loader, so we add and start loading
      const key = 'dynamic_' + Math.random().toString(36).substr(2, 9);
      this.phaserScene.load.image(key, textureUrl);
      this.phaserScene.load.once('filecomplete-image-' + key, () => {
        resolve();
      });
      this.phaserScene.load.once('loaderror', (file: any) => {
        if (file.key === key) reject(new Error('Failed to load texture.'));
      });
      this.phaserScene.load.start();
    });
  }

  /**
   * Applies visual filters (such as drop shadow) to a Phaser container or text.
   * @param obj - The object containing filter data.
   * @param tf - The Phaser GameObject to apply filters to.
   */
  applyFilters(obj: any, tf: Phaser.GameObjects.GameObject) {
    // Phaser does not support filters natively like Pixi, but you can use pipelines or shaders.
    // This is a stub for future custom pipeline integration.
    if (obj.filters && Array.isArray(obj.filters)) {
      // Example: log filters for debugging
      for (const filter of obj.filters) {
        //console.log('Filter requested:', filter.type, filter);
      }
    }
  }

  public get sceneStage() {
    return this._sceneStage;
  }

  public setOrientation(): void {
    // Use the Phaser scene's scale dimensions (actual game canvas) if available,
    // falling back to window dimensions. Also consider the design resolution as a
    // tiebreaker when width === height.
    let w: number;
    let h: number;
    if (this.phaserScene?.scale) {
      w = this.phaserScene.scale.width;
      h = this.phaserScene.scale.height;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    // If dimensions are equal or not yet available, fall back to design resolution
    if (w === h || w === 0 || h === 0) {
      if (this.data?.resolution) {
        this.orientation = this.data.resolution.x >= this.data.resolution.y ? "landscape" : "portrait";
        return;
      }
    }
    this.orientation = w > h ? "landscape" : "portrait";
  }

  public static getSceneById(sceneId: string): ZScene | undefined {
    return ZScene.Map.get(sceneId);
  }

  // Add all children to the main stage
  // phaserScene param is accepted for API compatibility with PIXI version (ignored — scene reference is stored in constructor)
  loadStage(phaserScene?: Phaser.Scene, loadChildren: boolean = true): void {
    // Always spawn objects with "portrait" orientation first.
    // This ensures all setInstanceData calls inside createAsset() see
    // parentContainer.currentTransform === undefined (the else-branch in
    // applyTransform), so no pivot is subtracted during construction.
    // The subsequent resize() call then correctly transitions to the actual
    // orientation — mirroring the portrait→landscape path that always works.
    this.orientation = "portrait";

    const stageAssets = this.data.stage;
    const children = stageAssets?.children;

    if (children && loadChildren) {
      for (const child of children) {
        const tempName = child.name;
        const mc = this.spawn(tempName);
        if (mc) {
          // Set instance data BEFORE adding to stage (like PIXI version)
          mc.setInstanceData(child as InstanceData, this.orientation);
          this.addToResizeMap(mc);
          this._sceneStage.add(mc);
          (this._sceneStage as any)[mc.name] = mc;
        } else {
          console.warn('Failed to spawn template:', tempName);
        }
      }
    }

    this.phaserScene.add.existing(this._sceneStage);
    // Resize to actual window orientation now that the full hierarchy is built.
    const w = this.phaserScene.scale.width || window.innerWidth;
    const h = this.phaserScene.scale.height || window.innerHeight;
    this.resize(w, h);
    this.resize(w, h);
    setTimeout(() => {
      const w2 = this.phaserScene.scale.width || window.innerWidth;
      const h2 = this.phaserScene.scale.height || window.innerHeight;
      this.resize(w2, h2);
    }, 200);
  }

  /**
   * Return the inner design resolution adjusted for current orientation.
   */
  public getInnerDimensions(): { width: number; height: number } {
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

  public addToResizeMap(mc: ZContainer | ZNineSlice) {
    this.resizeMap.set(mc, true);
  }

  public removeFromResizeMap(mc: ZContainer) {
    this.resizeMap.delete(mc);
  }

  public resize(width: number, height: number) {
    if (!this.data?.resolution) return;

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

    // Pass 1: update currentTransform for all containers (so parent transforms are
    // current before children read them in applyTransform).
    for (const [mc] of this.resizeMap) {
      (mc as any).currentTransform = this.orientation === "portrait"
        ? (mc as any).portrait
        : (mc as any).landscape;
    }
    // Pass 2: apply transforms now that all parents have the correct currentTransform.
    for (const [mc] of this.resizeMap) {
      mc.resize(width, height, this.orientation);
    }
  }

  public get sceneWidth(): number {
    let baseWidth = this.data.resolution.x;
    if (this.orientation === "portrait") {
      baseWidth = this.data.resolution.y;
    }
    return baseWidth;
  }

  public get sceneHeight(): number {
    let baseHeight = this.data.resolution.y;
    if (this.orientation === "portrait") {
      baseHeight = this.data.resolution.x;
    }
    return baseHeight;
  }

  async load(assetBasePath: string, _loadCompleteFnctn: Function) {
    this._sceneStage = new ZContainer(this.phaserScene); // Will be added to scene later
    this.assetBasePath = assetBasePath;
    const placementsUrl = assetBasePath + "placements.json?rnd=" + Math.random();
    try {
      const response = await fetch(placementsUrl);
      const placementsObj = await response.json();
      this.loadAssets(assetBasePath, placementsObj, _loadCompleteFnctn);
    } catch (err) {
      console.error("Failed to load placements:", err);
    }
  }


  /**
   * Loads the scene's assets and fonts, then initializes the scene.
   * @param assetBasePath - The base path for assets.
   * @param placemenisObj - The placements object describing the scene.
   * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
   */
  async loadAssets(
    assetBasePath: string,
    placementsObj: SceneData,
    _loadCompleteFnctn: Function
  ) {
    const isAtlas = (placementsObj as any).atlas ?? true; // default to true for backward compatibility
    this.usesAtlas = !!isAtlas;

    if (isAtlas) {
      const atlasKey = 'sceneAtlas';
      const atlasJsonUrl = assetBasePath + "ta.json?rnd=" + Math.random();
      const atlasImageUrl = assetBasePath + "ta.png?rnd=" + Math.random();

      // Add error handling for failed loads
      this.phaserScene.load.once('filecomplete-image-' + atlasKey, () => {
        //console.log('Atlas image loaded:', atlasKey);
      });

      this.phaserScene.load.once('filecomplete-json-' + atlasKey, () => {
        //console.log('Atlas JSON loaded:', atlasKey);
      });

      this.phaserScene.load.once('loaderror', (file: any) => {
        //console.error('Load error:', file.key, file.url, file.error);
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

    // Load bitmap fonts if provided (expects .png and .fnt next to each other)
    if ((placementsObj as any).fonts && (placementsObj as any).fonts.length > 0) {
      let fontsLoaded = 0;
      const fonts = (placementsObj as any).fonts as string[];
      for (const fontName of fonts) {
        const pngUrl = assetBasePath + fontName + '.png';
        const xmlUrl = assetBasePath + fontName + '.fnt';
        // Phaser will ignore if keys duplicate, but we want to ensure font is loaded before continuing
        this.phaserScene.load.bitmapFont(fontName, pngUrl, xmlUrl);
      }
      this.phaserScene.load.once('complete', () => {
        this.sceneName = 'images';
        this.initScene(placementsObj);
        _loadCompleteFnctn();
      });
      this.phaserScene.load.start();
      return;
    }

    this.phaserScene.load.once('complete', () => {
      this.sceneName = 'images';
      this.initScene(placementsObj);
      _loadCompleteFnctn();
    });
    this.phaserScene.load.start();
  }

  initScene(_placementsObj: SceneData) {
    this.data = _placementsObj;
  }

  static getAssetType(value: string): any {
    return this.assetTypes.get(value as AssetType);
  }

  static isAssetType(value: string): value is AssetType {
    return this.assetTypes.has(value as AssetType);
  }

  spawn(tempName: string): ZContainer | undefined {
    const templates = this.data.templates;
    const baseNode = templates[tempName];
    if (!baseNode) {
      console.warn('Template not found:', tempName);
      return;
    }

    let mc: ZContainer;
    const frames = this.getChildrenFrames(tempName);

    if (Object.keys(frames).length > 0) {
      mc = new ZTimeline(this.phaserScene);
      this.createAsset(mc, baseNode);
      (mc as ZTimeline).setFrames(frames);
      if (this.data.cuePoints?.[tempName]) {
        (mc as ZTimeline).setCuePoints(this.data.cuePoints[tempName]);
      }
      (mc as ZTimeline).gotoAndStop(0);
    } else {
      const AssetClass = ZScene.getAssetType(baseNode.type) || ZContainer;
      mc = new AssetClass(this.phaserScene);
      this.createAsset(mc, baseNode);
      mc.init();
    }

    return mc;
  }

  getChildrenFrames(_templateName: string): Record<string, AnimTrackData[]> {
    const frames: Record<string, AnimTrackData[]> = {};
    const templates = this.data.templates;
    const animTracks = this.data.animTracks!;
    const baseNode = templates[_templateName];
    if (baseNode?.children) {
      for (const childNode of baseNode.children) {
        const child = childNode as InstanceData;
        const combinedName = child.instanceName + "_" + _templateName;
        if (animTracks[combinedName]) frames[child.instanceName] = animTracks[combinedName];
      }
    }
    return frames;
  }

  async createAsset(mc: ZContainer, baseNode: TemplateData) {
    for (const childNode of baseNode.children) {
      const type = childNode.type;
      let asset: any;

      // inputField
      if (type === "inputField") {
        const inputData = childNode as TextInputData;
        const textInput = new ZTextInput(this.phaserScene, inputData);
        textInput.setName(inputData.name);
        (mc as any)[inputData.name] = textInput;
        mc.add(textInput);
        this.applyFilters(childNode, textInput);
        continue;
      }

      // bitmapFontLocked
      if (type === "bitmapFontLocked") {
        const textNode = childNode as BitmapFontLocked;
        if (textNode.fontName && this.phaserScene.cache.bitmapFont.exists(textNode.fontName)) {
          const tf = this.phaserScene.add.bitmapText(
            textNode.x ?? 0,
            textNode.y ?? 0,
            textNode.fontName,
            textNode.text || "",
          );
          if (textNode.textAnchorX !== undefined && textNode.textAnchorY !== undefined) {
            tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);
          }
          tf.setName(textNode.name);
          (mc as any)[textNode.name] = tf;
          mc.add(tf);
          this.applyFilters(childNode, tf);
        }
        continue;
      }

      // textField / bitmapText
      if (type === "textField" || type === "bmpTextField" || type === "bitmapText") {
        const textNode = childNode as TextData;

        const fontKey = textNode.uniqueFontName || textNode.fontName;
        const hasBitmap = fontKey && this.phaserScene.cache.bitmapFont.exists(fontKey as string);
        if (hasBitmap) {
          const tf = this.phaserScene.add.bitmapText(
            textNode.x,
            textNode.y,
            fontKey as string,
            textNode.text || "",
            (textNode.size as number) || undefined
          );
          if (typeof textNode.letterSpacing === "number") {
            (tf as Phaser.GameObjects.BitmapText).setLetterSpacing(textNode.letterSpacing);
          }
          if (textNode.textAnchorX !== undefined && textNode.textAnchorY !== undefined) {
            tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);
          }
          tf.setName(textNode.name);
          mc.add(tf);
          (mc as any)[textNode.name] = tf;
          this.applyFilters(childNode, tf);
        } else {
          let colorStr = "#ffffff";
          if (textNode.color) {
            if (typeof textNode.color === "number") {
              colorStr = "#" + textNode.color.toString(16).padStart(6, "0");
            } else {
              colorStr = textNode.color as string;
            }
          }
          const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: (textNode.fontName as string | undefined) || "Arial",
            fontSize: typeof textNode.size === "number" ? `${textNode.size}px` : textNode.size,
            color: colorStr,
            align: textNode.align || "left",
          };
          if (typeof textNode.fontWeight === "string") {
            style.fontStyle = textNode.fontWeight;
          }
          if (textNode.wordWrap && typeof textNode.wordWrapWidth === "number") {
            style.wordWrap = { width: textNode.wordWrapWidth, useAdvancedWrap: true };
          }
          const tf = this.phaserScene.add.text(
            textNode.x ?? 0,
            textNode.y ?? 0,
            (textNode.text ?? "") + "",
            style
          );
          if (typeof textNode.stroke === "string" && typeof textNode.strokeThickness === "number") {
            tf.setStroke(textNode.stroke, textNode.strokeThickness);
          }
          if (typeof textNode.padding === "number") {
            tf.setPadding(textNode.padding);
          }
          if (typeof textNode.leading === "number") {
            tf.setLineSpacing(textNode.leading);
          }
          if (textNode.dropShadow) {
            const angle = textNode.dropShadowAngle ?? 0;
            const dist = textNode.dropShadowDistance ?? 4;
            const shadowColor = typeof textNode.dropShadowColor === "number"
              ? "#" + textNode.dropShadowColor.toString(16).padStart(6, "0")
              : (textNode.dropShadowColor as string) || "#000000";
            tf.setShadow(Math.cos(angle) * dist, Math.sin(angle) * dist, shadowColor, textNode.dropShadowBlur ?? 0, false, true);
          }
          if (textNode.textAnchorX !== undefined && textNode.textAnchorY !== undefined) {
            tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);
          }
          tf.setName(textNode.name);
          (mc as any)[textNode.name] = tf;
          mc.add(tf);
          this.applyFilters(childNode, tf);
        }
      }

      // Sprite
      if (type === "img") {
        const spriteNode = childNode as SpriteData;
        const frameKey = spriteNode.name.replace(/(_IMG|_9S)$/, "");
        if (this.usesAtlas) {
          const texture = this.scene;
          if (!texture) {
            console.error("Cannot create sprite - atlas texture not loaded");
            continue;
          }
          if (!texture.has(frameKey)) {
            console.warn("Frame not found in atlas:", frameKey);
          }
          asset = this.phaserScene.add.sprite(spriteNode.x ?? 0, spriteNode.y ?? 0, this.sceneName as string, frameKey);
        } else {
          asset = this.phaserScene.add.sprite(spriteNode.x ?? 0, spriteNode.y ?? 0, frameKey);
        }
        if (!asset) { console.error("Failed to create sprite for:", frameKey); continue; }
        asset.setDisplaySize(spriteNode.width, spriteNode.height);
        asset.setOrigin(0, 0);
        mc.add(asset);
        (mc as any)[spriteNode.name] = asset;
        this.applyFilters(childNode, asset);
      }

      // 9-Slice
      if (type === "9slice") {
        const nineSliceData = childNode as NineSliceData;
        const frameKey = nineSliceData.name.replace("_9S", "");
        const textureKeyOrObj: string | Phaser.Textures.Texture = this.usesAtlas ? (this.sceneName as string) : frameKey;
        const frame: string | number | undefined = this.usesAtlas ? frameKey : undefined;
        const nineSlice = new ZNineSlice(this.phaserScene, 0, 0, textureKeyOrObj, frame, nineSliceData, this.orientation);
        mc.add(nineSlice);
        (mc as any)[nineSliceData.name] = nineSlice;
        nineSlice.setDisplaySize(nineSliceData.width, nineSliceData.height);
        nineSlice.setOrigin(0, 0);
        this.addToResizeMap(nineSlice);
      }

      // Asset / State / Button / Toggle / Slider / Scroll / Animation
      if (ZScene.isAssetType(type)) {
        const instanceData = childNode as InstanceData;
        const frames = this.getChildrenFrames(childNode.name);
        if (Object.keys(frames).length > 0) {
          asset = new ZTimeline(this.phaserScene);
          asset.setFrames(frames);
          if (this.data.cuePoints?.[childNode.name]) {
            (asset as ZTimeline).setCuePoints(this.data.cuePoints[childNode.name]);
          }
        } else {
          asset = new (ZScene.getAssetType(type) || ZContainer)(this.phaserScene);
        }
        asset.name = instanceData.instanceName;
        if (!asset.name) { continue; }
        (mc as any)[asset.name] = asset;
        this.applyFilters(childNode, asset);
        asset.setInstanceData(instanceData, this.orientation);
        mc.add(asset);
        this.addToResizeMap(asset);
      }

      // Particle
      if (type === "particle") {
        const particleData = childNode as ParticleData;
        let assetBasePath = this.assetBasePath;
        if (!assetBasePath.endsWith("/")) assetBasePath += "/";
        const pngPaths: string[] = Array.isArray(particleData.pngPaths)
          ? particleData.pngPaths as unknown as string[]
          : [particleData.pngPaths as unknown as string];
        const textureKeys: string[] = [];
        const loadPromises = pngPaths.map((pngPath: string) => {
          return new Promise<void>((resolve) => {
            const key = "particle_" + pngPath.replace(/[^a-zA-Z0-9]/g, "_");
            textureKeys.push(key);
            if (this.phaserScene.textures.exists(key)) { resolve(); return; }
            this.phaserScene.load.image(key, assetBasePath + pngPath);
            this.phaserScene.load.once("filecomplete-image-" + key, () => resolve());
            this.phaserScene.load.once("loaderror", () => resolve());
            this.phaserScene.load.start();
          });
        });
        Promise.all(loadPromises).then(() => {
          const jsonUrl = assetBasePath + particleData.jsonPath + "?t=" + Date.now();
          fetch(jsonUrl)
            .then(r => r.json())
            .then((config: any) => {
              try {
                const key = textureKeys[0];
                if (key && this.phaserScene.textures.exists(key)) {
                  const particles = this.phaserScene.add.particles(0, 0, key, config);
                  particles.setName(particleData.name || childNode.name);
                  mc.add(particles);
                  (mc as any)[childNode.name] = particles;
                }
              } catch (e) {
                console.error("Error creating particle emitter:", e);
              }
            })
            .catch(e => console.error("Failed to load particle config:", e));
        });
        continue;
      }

      // Spine
      if (type === "spine") {
        const spineData = childNode as SpineData;
        let assetBasePath = this.assetBasePath;
        if (!assetBasePath.endsWith("/")) assetBasePath += "/";
        const zSpine = new ZSpine(this.phaserScene, spineData, assetBasePath);
        zSpine.load((spineObj: any) => {
          if (spineObj) {
            spineObj.setName(spineData.name || childNode.name);
            mc.add(spineObj);
            (mc as any)[childNode.name] = spineObj;
            // Re-apply the container's transform so the spine object gets the
            // correct pivot offset (setOrigin runs on mc.list, which was empty
            // when setInstanceData first ran before this async callback fired).
            mc.applyTransform();
          }
        });
        continue;
      }

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
  private createImagesObject(assetBasePath: string, obj: SceneData): { alias: string; src: string }[] {
    const images: { alias: string; src: string }[] = [];
    const record: Record<string, boolean> = {};
    const templates = obj.templates;
    for (const templateName in templates) {
      const children = templates[templateName].children as BaseAssetData[];
      for (const child of children) {
        if (child.type === 'img' || child.type === '9slice') {
          const sprite = child as SpriteData | NineSliceData;
          if (!record[sprite.name]) {
            record[sprite.name] = true;
            let texName = sprite.name.endsWith('_9S') ? sprite.name.slice(0, -3) : sprite.name;
            texName = texName.endsWith('_IMG') ? texName.slice(0, -4) : texName;
            // SceneData SpriteData uses filePath for non-atlas images
            images.push({ alias: texName, src: assetBasePath + (sprite as any).filePath });
          }
        }
      }
    }
    return images;
  }
}
