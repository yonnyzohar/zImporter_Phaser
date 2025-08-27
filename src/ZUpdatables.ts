export class ZUpdatables {
    static updatables = new Map<any, boolean>();
    static fpsInterval: number = 0;
    static then: number = 0;
    static now: number = 0;
    static elapsed: number = 0;
    static startTime: number = 0;

    static init(fps: number) {
        this.fpsInterval = 1000 / fps;
        this.then = Date.now();
        this.startTime = this.then;
    }

    static addUpdateAble(mc: any) {
        ZUpdatables.updatables.set(mc, true);
    }

    static update() {
        this.now = Date.now();
        this.elapsed = this.now - this.then;

        if (this.elapsed > this.fpsInterval) {
            this.then = this.now - (this.elapsed % this.fpsInterval);

            for (const [key] of ZUpdatables.updatables) {
                (key as any).update();
            }
        }
    }

    static removeUpdateAble(mc: any) {
        ZUpdatables.updatables.delete(mc);
    }
}

