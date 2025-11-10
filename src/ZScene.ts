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
    console.log('Loading stage with', children?.length || 0, 'children');

    if (children) {
      for (const child of children) {
        const tempName = child.name;
        console.log('Spawning template:', tempName);
        const mc = this.spawn(tempName);
        if (mc) {
          // Set instance data BEFORE adding to stage (like PIXI version)
          mc.setInstanceData(child as InstanceData, this.orientation);
          this.addToResizeMap(mc);
          this._sceneStage.add(mc);
          (this._sceneStage as any)[mc.name] = mc;
          const bounds = mc.getBounds();
          console.log('Added to stage:', mc.name, 'visible:', mc.visible, 'alpha:', mc.alpha, 'bounds:', bounds.width, 'x', bounds.height, 'at', mc.x, mc.y);
        } else {
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
      const firstChild = this._sceneStage.list[0] as any;
      console.log('First child:', firstChild.name, 'type:', firstChild.constructor.name, 'children:', firstChild.list?.length || 0);
      if (firstChild.list && firstChild.list.length > 0) {
        const firstGrandchild = firstChild.list[0];
        console.log('First grandchild:', firstGrandchild.name || 'unnamed', 'type:', firstGrandchild.constructor.name, 'visible:', firstGrandchild.visible, 'alpha:', firstGrandchild.alpha);
      }
    }

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
        console.log('Atlas image loaded:', atlasKey);
      });

      this.phaserScene.load.once('filecomplete-json-' + atlasKey, () => {
        console.log('Atlas JSON loaded:', atlasKey);
      });

      this.phaserScene.load.once('loaderror', (file: any) => {
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
            fontFamily: (textNode.fontName as string | undefined) || 'Arial',
            fontSize: (typeof textNode.size === 'number') ? `${textNode.size}px` : textNode.size,
            color: textNode.color || '#ffffff',
            align: textNode.align || 'center',
          };

          // Phaser doesn’t support letterSpacing directly — requires bitmap or DOM text workaround
          if (typeof textNode.fontWeight === 'string') {
            // Phaser uses fontStyle for things like 'bold', 'italic'
            style.fontStyle = textNode.fontWeight;
          }

          if (textNode.wordWrap && typeof textNode.wordWrapWidth === 'number') {
            style.wordWrap = {
              width: textNode.wordWrapWidth,
              useAdvancedWrap: true
            };
          }

          // Create text
          const tf = this.phaserScene.add.text(
            textNode.x ?? 0,
            textNode.y ?? 0,
            (textNode.text ?? '') + '',
            style
          );

          // Apply stroke
          if (typeof textNode.stroke === 'string' && typeof textNode.strokeThickness === 'number') {
            tf.setStroke(textNode.stroke, textNode.strokeThickness);
          }

          // Apply padding
          if (typeof textNode.padding === 'number') {
            tf.setPadding(textNode.padding);
          }

          // Leading (line spacing)
          if (typeof textNode.leading === 'number') {
            tf.setLineSpacing(textNode.leading);
          }

          // Set origin (anchors in PIXI map to origin in Phaser)
          tf.setOrigin(textNode.textAnchorX, textNode.textAnchorY);

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
          const texture = this.scene;
          if (!texture) {
            console.error('Cannot create sprite - atlas texture not loaded');
            continue;
          }
          const hasFrame = texture.has(frameKey);
          if (!hasFrame) {
            console.warn('Frame not found in atlas:', frameKey, 'Available frames:', Object.keys(texture.frames).slice(0, 10).join(', '));
          } else {
            console.log('Creating sprite:', frameKey, 'at', spriteNode.x, spriteNode.y, 'size:', spriteNode.width, spriteNode.height);
          }
          asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, this.sceneName as string, frameKey);
          if (!asset) {
            console.error('Failed to create sprite for:', frameKey);
            continue;
          }
        } else {
          asset = this.phaserScene.add.sprite(spriteNode.x, spriteNode.y, frameKey);
        }
        asset.setDisplaySize(spriteNode.width, spriteNode.height);
        // Handle pivot like PIXI version - set origin based on pivot
        //const pivotX = (spriteNode as any).pivotX || 0;
        //const pivotY = (spriteNode as any).pivotY || 0;
        //asset.setOrigin(pivotX / spriteNode.width, pivotY / spriteNode.height);
        asset.setOrigin(0, 0);
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
        nineSlice.setOrigin(0, 0);
        this.addToResizeMap(nineSlice);
      }

      if (ZScene.isAssetType(type)) {
        var instanceData = childNode as InstanceData;
        //this will tell me fi this asses template has children with frames
        var frames = this.getChildrenFrames(childNode.name);

        if (Object.keys(frames).length > 0) {
          asset = new ZTimeline(this.phaserScene);
          asset.setFrames(frames);
          if (this.data.cuePoints && this.data.cuePoints[childNode.name]) {
            (asset as ZTimeline).setCuePoints(this.data.cuePoints[childNode.name]);
          }
        }
        else {
          asset = new (ZScene.getAssetType(type) || ZContainer)(this.phaserScene);
        }
        //console.log("creation", instanceData.instanceName); // Should print "ZTimeline"
        //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
        //console.log("instanceof", asset instanceof ZTimeline);

        asset.name = instanceData.instanceName;
        if (!asset.name) {
          return;
        }
        (mc as any)[asset.name] = asset;
        //this.applyFilters(childNode, asset);
        asset.setInstanceData(instanceData, this.orientation);
        mc.add(asset);
        this.addToResizeMap(asset);


        //console.log("after addition", instanceData.instanceName); // Should print "ZTimeline"
        //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
        //console.log("instanceof", asset instanceof ZTimeline);
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
