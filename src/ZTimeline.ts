import { ZCuePointsManager } from "./ZCuePointsManager";
import { ZContainer } from "./ZContainer";
import { ZUpdatables } from "./ZUpdatables";
import { InstanceData } from "./SceneData";

/**
 * Represents a timeline container that manages frame-based animations for its children.
 * Extends `ZContainer` and provides methods to control playback, frame navigation, and event listeners.
 *
 * @property {number | undefined} totalFrames - The total number of frames in the timeline, determined by the longest child timeline.
 * @property {any} _frames - The frame data for all children with timelines.
 * @property {number} currentFrame - The current frame index being displayed.
 * @property {boolean} looping - Indicates whether the timeline should loop when it reaches the end.
 * @property {(self: ZTimeline) => void | undefined} func - Optional callback function invoked when the timeline ends.
 *
 * @method getFrames - Returns the frame data for the timeline.
 * @method setFrames - Sets the frame data and updates the total frame count based on the longest child timeline.
 * @method removeStateEndEventListener - Removes the end-of-state event listener.
 * @method addStateEndEventListener - Adds a callback to be invoked when the timeline ends.
 * @method play - Starts playback of the timeline and all child timelines.
 * @method stop - Stops playback of the timeline and all child timelines.
 * @method gotoAndPlay - Jumps to a specific frame and starts playback.
 * @method update - Advances the timeline by one frame, handles looping, and invokes the end event listener if present.
 * @method gotoAndStop - Jumps to a specific frame and updates all child transforms to match that frame.
 */
export class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number = 0;
    looping: boolean = true;
    playOnStart:boolean = true;
    cuePoints: Record<number, string> = {};
    func: ((self: ZTimeline) => void) | undefined;

    constructor(scene: Phaser.Scene, x = 0, y = 0, children?: Phaser.GameObjects.GameObject[]) {
        super(scene, x, y, children);
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
        super.setInstanceData(data, orientation);
        this.looping = data.looping ?? false;
        this.playOnStart = true;//we want animations to play by default unless explicitly told not to
        if(data.playOnStart == false)
        {
            this.playOnStart = false;
        }
        if (this.playOnStart) {
            this.gotoAndPlay(0);
        }
    }

    setCuePoints(cuePoints: Record<number, string>): void {
        this.cuePoints = cuePoints;
    }

    getFrames(): any {
        return this._frames;
    }

    //these are all the frames of all the kids who have a timeline
    //the numframes is longest child timeline
    setFrames(value: any): void {
        this._frames = value;
        let totalFrames = 0;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k] instanceof Array) {
                    if (this._frames[k].length > totalFrames) {
                        totalFrames = this._frames[k].length;
                    }
                }
            }
            this.totalFrames = totalFrames;
        }
    }

    removeStateEndEventListener(): void {
        this.func = undefined;
    }

    addStateEndEventListener(func: (self: ZTimeline) => void): void {
        this.func = func;
    }

    play(): void {
        ZUpdatables.addUpdateAble(this);
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }

    stop(): void {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i];
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }
    }

    gotoAndPlay(frameNum: number): void {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }

    //todo, this is not time dependent, it is frame dependent
    update(): void {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints && this.cuePoints[this.currentFrame] !== undefined) {
            //emit the cue point event
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;

        if (this.currentFrame > this.totalFrames!) {
            if (this.looping) {
                this.currentFrame = 0;
            } else {
                ZUpdatables.removeUpdateAble(this);
            }

            if (this.func) {
                this.func.call(this, this);
            }
        }
    }

    // Override setOrigin so that a resize doesn't reset children back to their
    // authored initial positions. When this timeline has frame data, re-apply the
    // current animation frame instead — gotoAndStop reads the already-updated
    // currentTransform.pivotX/Y, so pivot offsets remain correct for the new size.
    setOrigin(): void {
        if (this._frames != null) {
            this.gotoAndStop(this.currentFrame);
        } else {
            super.setOrigin();
        }
    }

    public destroy(): void {
        this.stop();
        ZUpdatables.removeUpdateAble(this);
        super.destroy();
    }

    //this code goes over all the child timlines and set the transform of the child at the current frame
    gotoAndStop(frameNum: number): void {
        this.currentFrame = frameNum;
        if (this._frames != null) {
            // This timeline's own pivot is used to offset child positions,
            // mirroring how PIXI's native pivot works (child.x is in pivot-space of parent).
            const myPivotX = (this.currentTransform?.pivotX) || 0;
            const myPivotY = (this.currentTransform?.pivotY) || 0;

            for (const k in this._frames) {
                if (this._frames[k][this.currentFrame]) {
                    const frame = this._frames[k][this.currentFrame];
                    const child = this[k];

                    if (child) {
                        // Update the child's own pivot on its currentTransform first,
                        // so setOrigin() (which reads currentTransform.pivotX/Y) is correct.
                        if (frame.pivotX !== undefined && child.currentTransform) {
                            child.currentTransform.pivotX = frame.pivotX;
                        }
                        if (frame.pivotY !== undefined && child.currentTransform) {
                            child.currentTransform.pivotY = frame.pivotY;
                        }
                        if (frame.scaleX !== undefined) {
                            child.scaleX = frame.scaleX;
                            if (child.currentTransform) child.currentTransform.scaleX = frame.scaleX;
                        }
                        if (frame.scaleY !== undefined) {
                            child.scaleY = frame.scaleY;
                            if (child.currentTransform) child.currentTransform.scaleY = frame.scaleY;
                        }
                        // frame.x/y are in the parent's pivot-space (same as PIXI data).
                        // Phaser simulates pivot by offsetting children, so subtract this
                        // timeline's pivot to get the Phaser container's actual local position.
                        // Also store the logical position in currentTransform so that a window
                        // resize (which calls applyTransform on children from resizeMap) re-applies
                        // the animated value rather than reverting to the design-time position.
                        // This mirrors PIXI's ZContainer where the `set x` setter keeps
                        // currentTransform.x in sync automatically.
                        if (frame.x !== undefined) {
                            child.x = frame.x - myPivotX;
                            if (child.currentTransform) child.currentTransform.x = frame.x;
                        }
                        if (frame.y !== undefined) {
                            child.y = frame.y - myPivotY;
                            if (child.currentTransform) child.currentTransform.y = frame.y;
                        }
                        if (frame.alpha !== undefined) {
                            child.alpha = frame.alpha;
                            if (child.currentTransform) child.currentTransform.alpha = frame.alpha;
                        }
                        if (frame.rotation !== undefined) {
                            child.rotation = frame.rotation;
                            if (child.currentTransform) child.currentTransform.rotation = frame.rotation;
                        }
                        // Apply Flash-style skew using the raw Flash skewY / skewX values.
                        // The ZContainer localTransform patch converts these to the correct matrix.
                        if (frame.skewY !== undefined) {
                            child._flashSkewY = frame.skewY;
                            if (child.currentTransform) child.currentTransform.skewY = frame.skewY;
                        }
                        if (frame.skewX !== undefined) {
                            child._flashSkewX = frame.skewX;
                            if (child.currentTransform) child.currentTransform.skewX = frame.skewX;
                        }
                        // Re-apply pivot simulation for ZContainer children so their
                        // own children are repositioned when pivot changes.
                        if ((frame.pivotX !== undefined || frame.pivotY !== undefined) &&
                            typeof child.setOrigin === 'function' && child.currentTransform) {
                            child.setOrigin();
                        }
                    }
                }
            }
        }
    }
}

