export class ZUpdatables {
    static updatables = new Map();
    static fpsInterval = 0;
    static then = 0;
    static now = 0;
    static elapsed = 0;
    static startTime = 0;
    static init(fps) {
        this.fpsInterval = 1000 / fps;
        this.then = Date.now();
        this.startTime = this.then;
    }
    static addUpdateAble(mc) {
        ZUpdatables.updatables.set(mc, true);
    }
    static update() {
        this.now = Date.now();
        this.elapsed = this.now - this.then;
        if (this.elapsed > this.fpsInterval) {
            this.then = this.now - (this.elapsed % this.fpsInterval);
            for (const [key] of ZUpdatables.updatables) {
                key.update();
            }
        }
    }
    static removeUpdateAble(mc) {
        ZUpdatables.updatables.delete(mc);
    }
}
//# sourceMappingURL=ZUpdatables.js.map