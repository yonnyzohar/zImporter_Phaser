export class ZCuePointsManager{
    //static class where you can add a listener to a cue point with a callback function
    private static cuePoints: Map<string, Function[]> = new Map();

    public static addCuePointListener(cuePoint: string, callback: Function): void {
        if (!this.cuePoints.has(cuePoint)) {
            this.cuePoints.set(cuePoint, []);
        }
        this.cuePoints.get(cuePoint)?.push(callback);
    }
    public static removeCuePointListener(cuePoint: string, callback: Function): void {
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
    public static triggerCuePoint(cuePoint: string, ...args: any[]): void {
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