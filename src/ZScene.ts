import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import * as PIXI from "pixi.js";
import { ZButton } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { InstanceData, SceneData, TemplateData, AnimTrackData, TextData, BaseAssetData, SpriteData, SpineData, ParticleData, TextInputData, NineSliceData } from "./SceneData";
import { ZState } from "./ZState";
import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
import * as PIXISpine3Base from "@pixi-spine/base";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZTextInput } from "./ZTextInput";
import { NineSlicePlane } from "pixi.js";
import { ZNineSlice } from "./ZNineSlice";
import { ZSpine } from "./ZSpine";



export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen";

/**
 * Represents a scene in the application, managing its assets, layout, and lifecycle.
 * Handles loading, resizing, and instantiation of scene elements using PIXI.js.
 *
 * @remarks
 * - Supports both landscape and portrait orientations.
 * - Manages scene assets, templates, and animation tracks.
 * - Provides methods for loading assets, creating display objects, and handling responsive resizing.
 * - Integrates with custom containers such as `ZContainer`, `ZButton`, `ZState`, and `ZTimeline`.
 */
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


  //the base path for assets used in the scene, set during loading.
  private assetBasePath: string = "";
  /**
   * The loaded PIXI spritesheet for the scene, or null if not loaded.
   */
  private scene: PIXI.Spritesheet | null = null;
  /**
   * The root container for all scene display objects.
   */
  private _sceneStage: ZContainer = new ZContainer();
  /**
   * The data describing the scene's structure, assets, and templates.
   */
  private data: SceneData;
  /**
   * A map of containers that should be resized when the scene resizes.
   */
  private resizeMap: Map<ZContainer | ZNineSlice, boolean> = new Map();
  /**
   * Static map of all instantiated scenes by their ID.
   */
  private static Map: Map<string, ZScene> = new Map();
  /**
   * The unique identifier for this scene.
   */
  private sceneId: string;
  /**
   * The current orientation of the scene ("landscape" or "portrait").
   */
  private orientation: "landscape" | "portrait" = "portrait";

  /**
   * The current stage of the scene, used for managing scene transitions.
   */
  private sceneName: string | null = null;


  public get sceneStage() {
    return this._sceneStage;
  }

  /**
   * Constructs a new ZScene instance.
   * @param _sceneId - The unique identifier for the scene.
   */
  constructor(_sceneId: string) {
    this.sceneId = _sceneId;
    this.setOrientation();
    ZScene.Map.set(_sceneId, this);
  }

  /**
   * Sets the orientation property based on the current window dimensions.
   */
  public setOrientation(): void {
    this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  /**
   * Retrieves a scene instance by its ID.
   * @param sceneId - The ID of the scene to retrieve.
   * @returns The ZScene instance, or undefined if not found.
   */
  public static getSceneById(sceneId: string): ZScene | undefined {
    return ZScene.Map.get(sceneId);
  }



  /**
   * Loads and initializes the scene's stage, adding its children to the global stage.
   * @param globalStage - The main PIXI.Container to which the scene will be added.
   */
  loadStage(globalStage: PIXI.Container): void {
    this.resize(window.innerWidth, window.innerHeight);
    let stageAssets = this.data.stage;
    let children = stageAssets!.children;
    if (children) {
      for (let i = 0; i < children.length; i++) {
        let child = children[i] as InstanceData;
        let tempName = child.name;
        let mc: ZContainer | undefined = this.spawn(tempName);
        if (mc) {
          mc.setInstanceData(child, this.orientation);
          this.addToResizeMap(mc);
          this._sceneStage.addChild(mc);
          (this._sceneStage as any)[mc.name] = mc;
        }
      }
    }
    globalStage.addChild(this._sceneStage);
    this.resize(window.innerWidth, window.innerHeight);
  }

  /**
   * Adds a container to the resize map, so it will be resized with the scene.
   * @param mc - The container to add.
   */
  public addToResizeMap(mc: ZContainer | ZNineSlice): void {
    this.resizeMap.set(mc, true);
  }


  /**
   * Removes a container from the resize map.
   * @param mc - The container to remove.
   */
  public removeFromResizeMap(mc: ZContainer): void {
    this.resizeMap.delete(mc);
  }

  /**
   * Resizes the scene and all registered containers to fit the given dimensions.
   * @param width - The new width.
   * @param height - The new height.
   */
  public resize(width: number, height: number): void {
    if (this.data && this.data.resolution) {

      this.setOrientation();
      let baseWidth = this.data.resolution.x;
      let baseHeight = this.data.resolution.y;
      if (this.orientation === "portrait") {
        baseWidth = this.data.resolution.y;
        baseHeight = this.data.resolution.x;

      }

      const scaleX = width / baseWidth;
      const scaleY = height / baseHeight;
      const scale = Math.min(scaleX, scaleY); // uniform scale to fit
      //console.log("resize", width, height, baseWidth, baseHeight, scaleX, scaleY, scale);

      this._sceneStage.scale.x = scale;
      this._sceneStage.scale.y = scale;

      // Center the stage
      this._sceneStage.x = (width - baseWidth * scale) / 2;
      this._sceneStage.y = (height - baseHeight * scale) / 2;

      for (const [mc, _] of this.resizeMap) {
        mc.resize(width, height, this.orientation);
      }
    }
  }

  /**
   * Loads the scene's placement and asset data asynchronously.
   * @param assetBasePath - The base path for assets.
   * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
   */
  async load(
    assetBasePath: string,
    _loadCompleteFnctn: Function
  ): Promise<void> {
    this.assetBasePath = assetBasePath;
    let placementsUrl: string =
      assetBasePath + "placements.json?rnd=" + Math.random();
    fetch(placementsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((placemenisObj) => {
        this.loadAssets(assetBasePath, placemenisObj, _loadCompleteFnctn);
      })
      .catch((error) => {
        //errorCallback(error);
      });
  }


  /**
   * Destroys the scene and its assets, freeing resources.
   */
  async destroy(): Promise<void> {
    const spritesheet = this.scene as PIXI.Spritesheet;

    if (spritesheet) {
      // Ensure spritesheet is fully parsed before attempting to destroy
      await spritesheet.parse();

      // Destroy individual textures
      for (const textureName in spritesheet.textures) {
        spritesheet.textures[textureName].destroy();
      }
      spritesheet.baseTexture?.destroy();
    }

    // Now unload the asset from the asset manager
    await PIXI.Assets.unload(this.sceneName!);
  }


  private createImagesObject(assetBasePath: string, obj: SceneData): { alias: string; src: string }[] {
    let images: { alias: string; src: string }[] = [];
    let record: any = {};
    let templates: Record<string, TemplateData> = obj.templates;
    for (let template in templates) {
      let children = templates[template].children;
      for (let child in children) {
        let childObj: BaseAssetData = children[child];
        if (childObj.type == "img" || childObj.type == "9slice") {
          let imgData: SpriteData = <SpriteData>childObj;
          if (!record[imgData.name]) {
            record[imgData.name] = true;
            let texName: string = imgData.name.endsWith("_9S") ? imgData.name.slice(0, -3) : imgData.name;
            texName = texName.endsWith("_IMG") ? texName.slice(0, -4) : texName;
            images.push({ alias: texName, src: assetBasePath + imgData.filePath });
          }

        }
      }
    }
    return images;
  }

  /**
   * Loads the scene's assets and fonts, then initializes the scene.
   * @param assetBasePath - The base path for assets.
   * @param placemenisObj - The placements object describing the scene.
   * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
   */
  async loadAssets(
    assetBasePath: string,
    placemenisObj: SceneData,
    _loadCompleteFnctn: Function
  ) {
    let _jsonPath: string = assetBasePath + "ta.json?rnd=" + Math.random();
    try {
      this.scene = await PIXI.Assets.load(_jsonPath);
      // success: scene is loaded
    } catch (error) {
      console.error("Failed to load asset:", _jsonPath, error);
      let imagesObj = this.createImagesObject(assetBasePath, placemenisObj);
      // handle the missing file gracefully here
      this.scene = await PIXI.Assets.load(imagesObj);
      (this.scene as any).textures = this.scene;//ugly hack
    }
    this.sceneName = _jsonPath;
    if (placemenisObj.fonts.length == 0) {
      this.initScene(placemenisObj);
      _loadCompleteFnctn();
      return;
    }
    for (let i = 0; i < placemenisObj.fonts.length; i++) {
      let path: string = placemenisObj.fonts[i];
      let url: string = assetBasePath + path + ".fnt";
      fetch(url)
        .then((response) => response.text())
        .then((data) => {
          const fontData = new PIXI.BitmapFontData();
          PIXI.BitmapFont.install(
            data,
            new PIXI.Texture(this.scene!.baseTexture)
          ); // Install the font data
          //console.log("Parsed font data:", fontData);
          if (i === placemenisObj.fonts.length - 1) {
            this.initScene(placemenisObj);
            _loadCompleteFnctn();
          }
        })
        .catch((error) => console.error("Error loading .fnt:", error));
    }
  }

  /**
   * Creates a PIXI.Sprite for a given frame name from the loaded spritesheet.
   * @param itemName - The name of the frame.
   * @returns The created sprite, or null if not found.
   */
  createFrame(itemName: string): PIXI.Sprite | null {
    ////console.log(itemName);
    let img: PIXI.Sprite | null = new PIXI.Sprite(
      this.scene!.textures[itemName]
    );

    if (img === null) {
      //console.log("COULD NOT FIND " + itemName);
    }

    return img;
  }

  /**
   * Gets the number of frames that match a given prefix in the spritesheet data.
   * @param _framePrefix - The prefix to search for.
   * @returns The number of matching frames.
   */
  getNumOfFrames(_framePrefix: string): number {
    let num = 0;
    var a: any = this.scene!.data;
    for (const k in a) {
      if (k.indexOf(_framePrefix) !== -1) {
        num++;
      }
    }

    return num;
  }

  /**
   * Creates an animated sprite (movie clip) from frames with a given prefix.
   * @param _framePrefix - The prefix for the frames.
   * @returns The created animated sprite.
   */
  createMovieClip(_framePrefix: string): PIXI.AnimatedSprite {
    const frames: PIXI.Texture[] = [];
    const numFrames = this.getNumOfFrames(_framePrefix);
    ////console.log(numFrames + " in " + _framePrefix);
    for (let i = 0; i < numFrames; i++) {
      const val = i < 10 ? "0" + i : i;
      const textureName = _framePrefix + "00" + val;
      frames.push(PIXI.Texture.from(textureName));
    }

    const mc = new PIXI.AnimatedSprite(frames);
    mc.animationSpeed = 1;
    mc.loop = false;
    mc.name = _framePrefix;
    return mc;
  }

  ////////////////////////////////---done loading scene--------//////////////

  /**
   * Initializes the scene with the given placements object.
   * @param _placementsObj - The scene data.
   */
  initScene(_placementsObj: SceneData): void {
    this.data = _placementsObj;
  }

  /**
   * Retrieves animation frames for all children of a template.
   * @param _templateName - The name of the template.
   * @returns A record mapping child instance names to their animation tracks.
   */
  //this gives the frames of all the children of a template
  //it combines the template name of the parent with the child name to get the frame
  getChildrenFrames(_templateName: string) {
    var frames: Record<string, AnimTrackData[]> = {};
    var templates = this.data.templates;
    var animTracks = this.data.animTracks!;
    var baseNode = templates[_templateName];
    if (baseNode && baseNode.children) {
      for (var i = 0; i < baseNode.children.length; i++) {
        let childNode = baseNode.children[i] as InstanceData;
        var childInstanceName = childNode.instanceName;
        var combinedName = childInstanceName + "_" + _templateName;
        //anim tracks are saved on the scene file via child name + template name to make sure it is uniquie
        //however when passed to the ZTimeline it is just the child name - because the ZTimeline will look for the child by name to set its timeline
        if (animTracks[combinedName]) {
          frames[childInstanceName] = animTracks[combinedName];
        }
      }
    }

    return frames;
  }

  static getAssetType(value: string): any {
    if (this.assetTypes.has(value as AssetType)) {
      return this.assetTypes.get(value as AssetType);
    }
    return null;
  }

  static isAssetType(value: string): value is AssetType {
    return this.assetTypes.has(value as AssetType);
  }

  /**
   * Spawns a new container or timeline for a given template name.
   * @param tempName - The template name.
   * @returns The created container or timeline, or undefined if not found.
   */
  spawn(tempName: string): ZContainer | undefined {
    var templates = this.data.templates;
    var baseNode = templates[tempName];
    if (!baseNode) {
      return;
    }
    var mc: ZContainer;
    var frames = this.getChildrenFrames(tempName);

    if (Object.keys(frames).length > 0) {
      mc = new ZTimeline();
      this.createAsset(mc, baseNode);
      (mc as ZTimeline).setFrames(frames);
      if (this.data.cuePoints && this.data.cuePoints[tempName]) {
        (mc as ZTimeline).setCuePoints(this.data.cuePoints[tempName]);
      }
      (mc as ZTimeline).gotoAndStop(0);
    } else {
      mc = new (ZScene.getAssetType(baseNode.type) || ZContainer)();
      this.createAsset(mc, baseNode);
      mc.init();
    }

    //mc.name = baseNode.instanceName;

    return mc;
  }

  /**
   * Recursively collects all asset nodes from a given object.
   * @param o - The object to search.
   * @param allAssets - The accumulator for found assets.
   * @returns The map of all found assets.
   */
  getAllAssets(o: any, allAssets: any): any {
    for (const k in o) {
      if (k === "type" && o[k] === "asset") {
        allAssets[o["name"]] = o;
      }

      if (o[k] instanceof Object) {
        this.getAllAssets(o[k], allAssets);
      }
    }
    return allAssets;
  }

  /**
   * Converts degrees to radians.
   * @param degrees - The angle in degrees.
   * @returns The angle in radians.
   */
  degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Recursively creates and adds child assets to a container based on template data.
   * @param mc - The parent container.
   * @param baseNode - The template data for the asset.
   */
  async createAsset(mc: ZContainer, baseNode: TemplateData): Promise<void> {
    // //console.log(baseNode.name);
    for (var i = 0; i < baseNode.children.length; i++) {
      var childNode = baseNode.children[i] as BaseAssetData;
      ////console.log(child);

      var _name = childNode.name;

      var type = childNode.type;
      var asset;

      if (type == "inputField") {
        let inputData = childNode as TextInputData;
        asset = new ZTextInput(inputData);
        asset.name = _name;
        (mc as any)[_name] = asset;
        mc.addChild(asset);
        //asset.setInstanceData(inputData, this.orientation);
        this.applyFilters(childNode, asset);

      }

      if (type == "bmpTextField" || type == "textField") {
        let textInstanceNode = childNode as any as TextData;
        if (PIXI.BitmapFont.available[textInstanceNode.fontName as string]) {
          const tf = new PIXI.BitmapText(textInstanceNode.text || "", {
            fontName: textInstanceNode.fontName as string, // This must match the "face" attribute in the .fnt file
            fontSize: textInstanceNode.size as number,       // Adjust as needed,
            letterSpacing: textInstanceNode.letterSpacing || 0               // Adjust the letter spacing between characters
          });

          tf.name = _name;
          (mc as any)[_name] = tf;
          mc.addChild(tf);
          tf.x = textInstanceNode.x;
          tf.y = textInstanceNode.y;
          this.applyFilters(childNode, tf);
        } else {
          //if ()

          const tf = new PIXI.Text(textInstanceNode.text + "", {
            fontFamily: textInstanceNode.fontName,
            fontSize: textInstanceNode.size,
            fill: textInstanceNode.color,
            align: "center",
          });

          if (textInstanceNode.textAnchorX !== undefined && textInstanceNode.textAnchorY !== undefined) {
            tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
          }


          if (textInstanceNode.size) {
            tf.style.fontSize = textInstanceNode.size;
          }
          if (textInstanceNode.color) {
            tf.style.fill = textInstanceNode.color;
          }
          if (textInstanceNode.align) {
            tf.style.align = textInstanceNode.align as PIXI.TextStyleAlign;
          }
          if (textInstanceNode.stroke) {
            tf.style.stroke = textInstanceNode.stroke;
          }
          if (textInstanceNode.strokeThickness) {
            tf.style.strokeThickness = textInstanceNode.strokeThickness;
          }
          if (textInstanceNode.wordWrap) {
            tf.style.wordWrap = textInstanceNode.wordWrap;
          }
          if (textInstanceNode.wordWrapWidth) {
            tf.style.wordWrapWidth = textInstanceNode.wordWrapWidth;
          }
          if (textInstanceNode.breakWords) {
            tf.style.breakWords = textInstanceNode.breakWords;
          }
          if (textInstanceNode.leading) {
            tf.style.leading = textInstanceNode.leading;
          }
          if (textInstanceNode.letterSpacing) {
            tf.style.letterSpacing = textInstanceNode.letterSpacing;
          }
          if (textInstanceNode.padding) {
            tf.style.padding = textInstanceNode.padding as number;
          }

          if (textInstanceNode.fontWeight) {
            tf.style.fontWeight = textInstanceNode.fontWeight as PIXI.TextStyleFontWeight;
          }

          tf.name = _name;
          tf.x = textInstanceNode.x;
          tf.y = textInstanceNode.y;
          (mc as any)[_name] = tf;
          mc.addChild(tf);
          this.applyFilters(childNode, tf);
        }
      }

      if (type == "img") {
        let spriteData = childNode as SpriteData;
        var _w: number = (spriteData.width);
        var _h: number = (spriteData.height);
        var _x: number = spriteData.x;
        var _y: number = spriteData.y;
        var texName = _name;

        texName = texName.endsWith("_IMG") ? texName.slice(0, -4) : texName;
        var img = this.createFrame(texName);
        if (!img) {
          return;
        }
        img.name = _name;
        (mc as any)[texName] = img;
        mc.addChild(img);
        img.x = _x;
        img.y = _y;
        img.width = _w;
        img.height = _h;
      }

      if (type == "9slice") {
        let nineSliceData = childNode as NineSliceData;
        var _w: number = (nineSliceData.width);
        var _h: number = (nineSliceData.height);
        var _x: number = nineSliceData.x;
        var _y: number = nineSliceData.y;
        var texName = _name;

        texName = texName.endsWith("_9S") ? texName.slice(0, -3) : texName;
        var nineSlice: ZNineSlice | null = new ZNineSlice(
          this.scene!.textures[texName], nineSliceData, this.orientation
        );
        if (!nineSlice) {
          return;
        }
        nineSlice.name = _name;
        (mc as any)[texName] = nineSlice;
        mc.addChild(nineSlice);
        this.addToResizeMap(nineSlice);
        nineSlice.x = _x;
        nineSlice.y = _y;
      }

      if (ZScene.isAssetType(type)) {
        var instanceData = childNode as InstanceData;
        //this will tell me fi this asses template has children with frames
        var frames = this.getChildrenFrames(childNode.name);

        if (Object.keys(frames).length > 0) {
          asset = new ZTimeline();
          asset.setFrames(frames);
          if (this.data.cuePoints && this.data.cuePoints[childNode.name]) {
            (asset as ZTimeline).setCuePoints(this.data.cuePoints[childNode.name]);
          }
        }
        else {
          asset = new (ZScene.getAssetType(type) || ZContainer)();
        }
        //console.log("creation", instanceData.instanceName); // Should print "ZTimeline"
        //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
        //console.log("instanceof", asset instanceof ZTimeline);

        asset.name = instanceData.instanceName;
        if (!asset.name) {
          return;
        }
        (mc as any)[asset.name] = asset;
        this.applyFilters(childNode, asset);
        asset.setInstanceData(instanceData, this.orientation);
        mc.addChild(asset);
        this.addToResizeMap(asset);


        //console.log("after addition", instanceData.instanceName); // Should print "ZTimeline"
        //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
        //console.log("instanceof", asset instanceof ZTimeline);
      }

      if (type == "particle") {
        let assetBasePath = this.assetBasePath;
        if (!assetBasePath.endsWith("/")) {
          assetBasePath += "/";
        }
        let particleData = childNode as ParticleData;
        let jsonPath = assetBasePath + particleData.jsonPath + `?t=${Date.now()}`;
        let pngPaths = assetBasePath + particleData.pngPaths + `?t=${Date.now()}`;
        PIXI.Assets.load(pngPaths)
          .then((texture: PIXI.Texture) => {
            PIXI.Assets.load(jsonPath)
              .then((particleData: any) => {
                mc.loadParticle(particleData, texture, particleData.name);
              })
              .catch((err) => {
                console.error("Failed to load particle data:", err);
              });
          });
      }

      if (type == "spine") {
        let assetBasePath = this.assetBasePath;
        if (!assetBasePath.endsWith("/")) {
          assetBasePath += "/";
        }
        let spineData = childNode as SpineData;
        let zSpine = new ZSpine(spineData, assetBasePath);
        zSpine.load((spine: PIXISpine3.Spine | PIXISpine4.Spine | undefined) => {
          if (spine) {
            mc.addChild(spine);
          }
        });
      }
      var templates = this.data.templates;
      var childTempObj = templates[childNode.name];

      if (childTempObj && childTempObj.children) {
        if (asset) {
          this.createAsset(asset, childTempObj);
        } else {
          this.createAsset(mc, childTempObj);
        }
      }
      asset?.init();
    }
  }

  /**
   * Applies visual filters (such as drop shadow) to a PIXI container.
   * @param obj - The object containing filter data.
   * @param tf - The PIXI container to apply filters to.
   */
  applyFilters(obj: any, tf: PIXI.Container) {
    if (obj.filters) {
      for (var k in obj.filters) {
        let filter = obj.filters[k];
        if (filter.type == "dropShadow") {
          let dropShadowFilter = new DropShadowFilter();
          dropShadowFilter.alpha = filter.alpha;
          dropShadowFilter.blur = filter.blur;
          dropShadowFilter.color = filter.color;
          dropShadowFilter.distance = filter.distance;
          dropShadowFilter.resolution = filter.resolution;
          dropShadowFilter.rotation = filter.rotation;
          if (!tf.filters) {
            tf.filters = [];
          }
          tf.filters.push(dropShadowFilter);
        }
      }
    }
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
    // Load the texture atlas referenced in your XML

    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML font data: ${response.statusText}`);
    }
    const xmlData = await response.text();
    //grab the ta file name
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    // Extract the page.file attribute from the XML
    const pageElement = xmlDoc.querySelector("page");
    if (!pageElement) {
      throw new Error("Page element not found in XML");
    }
    const fileAttribute = pageElement.getAttribute("file");
    if (!fileAttribute) {
      throw new Error("Page file attribute not found in XML");
    }

    var textureUrl: string = "./../assets/" + fileAttribute;

    this.loadTexture(textureUrl)
      .then((texture) => {
        PIXI.BitmapFont.install(xmlDoc, texture);

        if (PIXI.BitmapFont.available[fontName]) {
          callback();
        }
      })
      .catch((error) => {
        console.error("Error loading texture:", error);
      });

    return null;
  }

  /**
   * Loads a texture from a given URL.
   * @param textureUrl - The URL of the texture.
   * @returns A promise that resolves to the loaded PIXI.Texture.
   */
  loadTexture(textureUrl: string): Promise<PIXI.Texture> {
    return new Promise((resolve, reject) => {
      const texture = PIXI.Texture.from(textureUrl);
      // Listen for the "update" event to check when the texture is fully loaded
      texture.on("update", () => {
        if (texture.valid) {
          resolve(texture); // Resolve the promise when the texture is ready
        } else {
          reject(new Error("Failed to load texture."));
        }
      });
    });
  }
}
