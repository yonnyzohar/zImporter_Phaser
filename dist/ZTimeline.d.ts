import { ZContainer } from "./ZContainer";
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
export declare class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number;
    looping: boolean;
    cuePoints: Record<number, string>;
    func: ((self: ZTimeline) => void) | undefined;
    constructor();
    setCuePoints(cuePoints: Record<number, string>): void;
    getFrames(): any;
    setFrames(value: any): void;
    removeStateEndEventListener(): void;
    addStateEndEventListener(func: (self: ZTimeline) => void): void;
    play(): void;
    stop(): void;
    gotoAndPlay(frameNum: number): void;
    update(): void;
    gotoAndStop(frameNum: number): void;
}
//# sourceMappingURL=ZTimeline.d.ts.map