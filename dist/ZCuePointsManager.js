export class ZCuePointsManager {
    //static class where you can add a listener to a cue point with a callback function
    static cuePoints = new Map();
    static addCuePointListener(cuePoint, callback) {
        if (!this.cuePoints.has(cuePoint)) {
            this.cuePoints.set(cuePoint, []);
        }
        this.cuePoints.get(cuePoint)?.push(callback);
    }
    static removeCuePointListener(cuePoint, callback) {
        if (this.cuePoints.has(cuePoint)) {
            const callbacks = this.cuePoints.get(cuePoint);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }
    static triggerCuePoint(cuePoint, ...args) {
        if (this.cuePoints.has(cuePoint)) {
            const callbacks = this.cuePoints.get(cuePoint);
            if (callbacks) {
                for (const callback of callbacks) {
                    callback(...args);
                }
            }
        }
    }
}
//# sourceMappingURL=ZCuePointsManager.js.map