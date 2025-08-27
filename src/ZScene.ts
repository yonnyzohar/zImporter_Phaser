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

  constructor(_sceneId: string, phaserScene: Phaser.Scene) {
    this.sceneId = _sceneId;
    this.phaserScene = phaserScene;
    this.setOrientation();
    ZScene.Map.set(_sceneId, this);
    this._sceneStage = new Phaser.GameObjects.Container(null as any); // Will be added to scene later
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
    this.resize(window.innerWidth, window.innerHeight);
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
    const atlasKey = 'sceneAtlas';
    const atlasJsonUrl = assetBasePath + "ta.json?rnd=" + Math.random();
    const atlasImageUrl = assetBasePath + "ta.png?rnd=" + Math.random(); // assume the image is ta.png

    // Start loading the atlas
    this.phaserScene.load.atlas(atlasKey, atlasImageUrl, atlasJsonUrl);

    // Listen for completion
    this.phaserScene.load.once('complete', () => {
      // Store the loaded atlas
      this.scene = this.phaserScene.textures.get(atlasKey); // Phaser.TextureManager entry
      this.sceneName = atlasKey;

      this.initScene(placementsObj);
      _loadCompleteFnctn();
    });

    // Start the Phaser loader
    this.phaserScene.load.start();
  }




  async load(assetBasePath: string, _loadCompleteFnctn: Function) {
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
      mc = new (ZScene.getAssetType(baseNode.type) || ZContainer)();
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

      // Text
      if (type === "textField" || type === "bmpTextField") {
        const textNode = childNode as TextData;
        asset = this.phaserScene.add.text(textNode.x, textNode.y, textNode.text || "", {
          fontFamily: textNode.fontName as string,
          fontSize: textNode.size,
          color: textNode.color,
          align: textNode.align
        });
        mc.add(asset);
        (mc as any)[textNode.name] = asset;
      }

      // Sprite
      if (type === "img") {
        const spriteNode = childNode as SpriteData;
        const texKey = spriteNode.name.replace(/(_IMG|_9S)$/, "");
        asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, texKey);
        asset.setDisplaySize(spriteNode.width, spriteNode.height);
        mc.add(asset);
        (mc as any)[spriteNode.name] = asset;
      }

      // 9-Slice
      if (type === "9slice") {
        const nineSliceData = childNode as NineSliceData;
        const texKey = nineSliceData.name.replace("_9S", "");
        const nineSlice = new ZNineSlice(this.phaserScene, 0, 0, this.phaserScene.textures.get(texKey), 0, nineSliceData, this.orientation);
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
}
