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
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number = 0;
    looping: boolean = true;
    cuePoints: Record<number, string> = {};
    func: ((self: ZTimeline) => void) | undefined;

    constructor() {
        super();
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
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
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }

    stop(): void {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
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

    //this code goes over all the child timlines and set the transform of the child at the current frame
    gotoAndStop(frameNum: number): void {
        this.currentFrame = frameNum;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k][this.currentFrame]) {
                    const frame = this._frames[k][this.currentFrame];
                    
                    if (this[k]) {
                        
                        if (frame.pivotX != undefined) {
                            this[k].pivot.x = frame.pivotX;
                        }
                        if (frame.pivotY != undefined) {
                            this[k].pivot.y = frame.pivotY;
                        }
                        if (frame.scaleX != undefined) {
                            this[k].scale.x = frame.scaleX;
                        }
                        if (frame.scaleY != undefined) {
                            this[k].scale.y = frame.scaleY;
                        }
                        if (frame.x != undefined) {
                            this[k].x = frame.x;
                        }
                        if (frame.y != undefined) {
                            this[k].y = frame.y;
                        }
                        if (frame.alpha != undefined) {
                            this[k].alpha = frame.alpha;
                        }
                        if(frame.rotation != undefined) {
                            this[k].rotation = frame.rotation;
                        }

                       
                    }
                    /**/
                }
            }
        }
    }
}

