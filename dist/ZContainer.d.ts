import * as PIXI from 'pixi.js';
import { InstanceData } from './SceneData';
import { OrientationData } from './SceneData';
import { Emitter } from "@pixi/particle-emitter";
export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}
/**
 * A custom container class extending `PIXI.Container` that supports orientation-based transforms,
 * anchoring, and instance data management for responsive layouts.
 *
 * @remarks
 * - Handles portrait and landscape orientation transforms.
 * - Supports anchoring to screen percentage positions.
 * - Synchronizes transform properties with an internal `OrientationData` object.
 *
 * @property portrait - Transform data for portrait orientation.
 * @property landscape - Transform data for landscape orientation.
 * @property currentTransform - The currently active transform data.
 * @property name - The instance name of the container.
 *
 * @method setState
 * Sets the state of the container by name. (Implementation placeholder)
 * @param stateName - The name of the state to set.
 *
 * @method init
 * Called once all children of the container are loaded. (Implementation placeholder)
 *
 * @method setInstanceData
 * Sets the instance data and orientation for the container, applying the corresponding transform.
 * @param data - The instance data containing orientation transforms and name.
 * @param orientation - The orientation to use ("portrait" or "landscape").
 *
 * @method resize
 * Updates the container's transform based on new width, height, and orientation.
 * @param width - The new width of the container.
 * @param height - The new height of the container.
 * @param orientation - The new orientation ("portrait" or "landscape").
 *
 * @method applyAnchor
 * Applies anchoring based on the current transform's anchor settings, positioning the container
 * relative to the screen size.
 *
 * @method isAnchored
 * Checks if the current transform is anchored.
 * @returns `true` if anchored, otherwise `false`.
 *
 * @method set x
 * Sets the x position and updates the current transform.
 * @param value - The new x position.
 *
 * @method set y
 * Sets the y position and updates the current transform.
 * @param value - The new y position.
 *
 * @method set rotation
 * Sets the rotation and updates the current transform.
 * @param value - The new rotation value.
 *
 * @method set scaleX
 * Sets the x scale and updates the current transform.
 * @param value - The new x scale.
 *
 * @method set scaleY
 * Sets the y scale and updates the current transform.
 * @param value - The new y scale.
 *
 * @method set pivotX
 * Sets the x pivot and updates the current transform.
 * @param value - The new x pivot.
 *
 * @method set pivotY
 * Sets the y pivot and updates the current transform.
 * @param value - The new y pivot.
 */
export declare class ZContainer extends PIXI.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    _fitToScreen: boolean;
    emitter: Emitter | undefined;
    originalTextWidth?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    get(childName: string): ZContainer | null;
    getAll(childName: string): ZContainer[];
    init(): void;
    setText(text: string): void;
    getTextField(): PIXI.Text | null;
    setInstanceData(data: InstanceData, orientation: string): void;
    set fitToScreen(value: boolean);
    get fitToScreen(): boolean;
    applyTransform(): void;
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    executeFitToScreen(): void;
    applyAnchor(): void;
    isAnchored(): boolean;
    set x(value: number);
    set width(value: number);
    get width(): number;
    get height(): number;
    set height(value: number);
    set y(value: number);
    set rotation(value: number);
    get x(): number;
    get y(): number;
    get rotation(): number;
    get scaleX(): number;
    get scaleY(): number;
    get pivotX(): number;
    get pivotY(): number;
    set scaleX(value: number);
    set scaleY(value: number);
    set pivotX(value: number);
    set pivotY(value: number);
    loadParticle(emitterConfig: any, texture: PIXI.Texture, name: string): void;
    playParticleAnim(): void;
    stopParticleAnim(): void;
}
//# sourceMappingURL=ZContainer.d.ts.map