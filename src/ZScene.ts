import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { ZState } from "./ZState";
import { ZButton } from "./ZButton";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZNineSlice } from "./ZNineSlice";
import { SceneData, TemplateData, InstanceData, AnimTrackData, SpriteData, SpineData, NineSliceData, ParticleData, TextData, TextInputData, BaseAssetData } from "./SceneData";

export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen";

export class ZScene {

  static assetTypes: Map<AssetType, any> = new Map([
    ["btn", ZButton],
    ["asset", ZContainer],
    ["state", ZState],
    ["toggle", ZToggle],
    ["slider", ZSlider],
    ["scrollBar", ZScroll],
    ["fullScreen", ZContainer]
  ]);

  private assetBasePath: string = "";
  private _sceneStage!: Phaser.GameObjects.Container;
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

  public get sceneStage() {
    return this._sceneStage;
  }

  public setOrientation(): void {
    this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  public static getSceneById(sceneId: string): ZScene | undefined {
    return ZScene.Map.get(sceneId);
  }

  // Add all children to the main stage
  loadStage(): void {
    this.resize(window.innerWidth, window.innerHeight);

    const stageAssets = this.data.stage;
    const children = stageAssets?.children;
    if (children) {
      for (const child of children) {
        const tempName = child.name;
        const mc = this.spawn(tempName);
        if (mc) {
          mc.setInstanceData(child as InstanceData, this.orientation);
          this.addToResizeMap(mc);
          this._sceneStage.add(mc);
          (this._sceneStage as any)[mc.name] = mc;
        }
      }
    }

    this.phaserScene.add.existing(this._sceneStage);
    (window as any).game = this._sceneStage;
    this.resize(window.innerWidth, window.innerHeight);
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
      this.phaserScene.load.atlas(atlasKey, atlasImageUrl, atlasJsonUrl);
      this.phaserScene.load.once('complete', () => {
        this.scene = this.phaserScene.textures.get(atlasKey);
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
    if ((placementsObj as any).fonts && (placementsObj as any).fonts.length > 0) {
      try {
        for (const fontName of (placementsObj as any).fonts as string[]) {
          const pngUrl = assetBasePath + fontName + '.png';
          const xmlUrl = assetBasePath + fontName + '.fnt';
          // Phaser will ignore if keys duplicate
          this.phaserScene.load.bitmapFont(fontName, pngUrl, xmlUrl);
        }
      } catch { }
    }

    this.phaserScene.load.once('complete', () => {
      this.sceneName = 'images';
      this.initScene(placementsObj);
      _loadCompleteFnctn();
    });
    this.phaserScene.load.start();
  }




  async load(assetBasePath: string, _loadCompleteFnctn: Function) {
    this._sceneStage = new Phaser.GameObjects.Container(this.phaserScene); // Will be added to scene later
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
    if (!baseNode) return;

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
      mc = new (ZScene.getAssetType(baseNode.type) || ZContainer)(this.phaserScene);
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

      // Text (BitmapText preferred if font is available)
      if (type === "textField" || type === "bmpTextField") {
        const textNode = childNode as TextData & {
          textAnchorX?: number; textAnchorY?: number;
          pivotX?: number; pivotY?: number;
          stroke?: string; strokeThickness?: number;
          wordWrap?: boolean; wordWrapWidth?: number; breakWords?: boolean;
          leading?: number; letterSpacing?: number; padding?: number;
          fontWeight?: string;
        };

        const hasBitmap = this.phaserScene.cache.bitmapFont.exists(textNode.fontName as string);
        if (hasBitmap) {
          const tf = this.phaserScene.add.bitmapText(
            textNode.x,
            textNode.y,
            textNode.fontName as string,
            textNode.text || "",
            (textNode.size as number) || undefined
          );
          if (typeof textNode.letterSpacing === 'number' && (tf as any).setLetterSpacing) {
            (tf as Phaser.GameObjects.BitmapText).setLetterSpacing(textNode.letterSpacing);
          }
          tf.setName(textNode.name);
          mc.add(tf);
          (mc as any)[textNode.name] = tf;
        } else {
          const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: textNode.fontName as string,
            fontSize: textNode.size as any,
            color: textNode.color as any,
            align: textNode.align as any
          };
          if (typeof textNode.letterSpacing === 'number') {
            (style as any).letterSpacing = textNode.letterSpacing;
          }
          if (typeof textNode.fontWeight === 'string') {
            (style as any).fontStyle = textNode.fontWeight; // Phaser uses fontStyle e.g. 'bold'
          }
          if (textNode.wordWrap && typeof textNode.wordWrapWidth === 'number') {
            style.wordWrap = { width: textNode.wordWrapWidth, useAdvancedWrap: true } as any;
          }
          const tf = this.phaserScene.add.text(textNode.x, textNode.y, (textNode.text ?? "") + "", style);
          if (typeof textNode.stroke === 'string' && typeof textNode.strokeThickness === 'number') {
            tf.setStroke(textNode.stroke as any, textNode.strokeThickness);
          }
          if (typeof textNode.padding === 'number') {
            tf.setPadding(textNode.padding);
          }
          if (typeof textNode.leading === 'number' && (tf as any).setLineSpacing) {
            (tf as Phaser.GameObjects.Text).setLineSpacing(textNode.leading);
          }
          if (typeof textNode.textAnchorX === 'number' && typeof textNode.textAnchorY === 'number') {
            tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);
          }
          // Pivot in PIXI is pixel-based; Phaser origin is normalized. Skipping exact pivot emulation.
          tf.setName(textNode.name);
          (mc as any)[textNode.name] = tf;
          mc.add(tf);
        }
      }

      // Sprite
      if (type === "img") {
        const spriteNode = childNode as SpriteData;
        const frameKey = spriteNode.name.replace(/(_IMG|_9S)$/, "");
        if (this.usesAtlas) {
          asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, this.sceneName as string, frameKey);
        } else {
          asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, frameKey);
        }
        asset.setDisplaySize(spriteNode.width, spriteNode.height);
        mc.add(asset);
        (mc as any)[spriteNode.name] = asset;
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
