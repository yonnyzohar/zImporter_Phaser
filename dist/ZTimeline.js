import { ZCuePointsManager } from "./ZCuePointsManager";
import { ZContainer } from "./ZContainer";
import { ZUpdatables } from "./ZUpdatables";
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
    totalFrames;
    _frames;
    currentFrame = 0;
    looping = true;
    cuePoints = {};
    func;
    constructor(scene, x = 0, y = 0, children) {
        super(scene, x, y, children);
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
    }
    setCuePoints(cuePoints) {
        this.cuePoints = cuePoints;
    }
    getFrames() {
        return this._frames;
    }
    //these are all the frames of all the kids who have a timeline
    //the numframes is longest child timeline
    setFrames(value) {
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
    removeStateEndEventListener() {
        this.func = undefined;
    }
    addStateEndEventListener(func) {
        this.func = func;
    }
    play() {
        ZUpdatables.addUpdateAble(this);
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }
    stop() {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.list.length; i++) {
            const child = this.list[i];
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }
    }
    gotoAndPlay(frameNum) {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }
    //todo, this is not time dependent, it is frame dependent
    update() {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints && this.cuePoints[this.currentFrame] !== undefined) {
            //emit the cue point event
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;
        if (this.currentFrame > this.totalFrames) {
            if (this.looping) {
                this.currentFrame = 0;
            }
            else {
                ZUpdatables.removeUpdateAble(this);
            }
            if (this.func) {
                this.func.call(this, this);
            }
        }
    }
    //this code goes over all the child timlines and set the transform of the child at the current frame
    gotoAndStop(frameNum) {
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
                        }
                        if (frame.scaleY !== undefined) {
                            child.scaleY = frame.scaleY;
                        }
                        // frame.x/y are in the parent's pivot-space (same as PIXI data).
                        // Phaser simulates pivot by offsetting children, so subtract this
                        // timeline's pivot to get the Phaser container's actual local position.
                        if (frame.x !== undefined) {
                            child.x = frame.x - myPivotX;
                        }
                        if (frame.y !== undefined) {
                            child.y = frame.y - myPivotY;
                        }
                        if (frame.alpha !== undefined) {
                            child.alpha = frame.alpha;
                        }
                        if (frame.rotation !== undefined) {
                            child.rotation = frame.rotation;
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
//# sourceMappingURL=ZTimeline.js.map