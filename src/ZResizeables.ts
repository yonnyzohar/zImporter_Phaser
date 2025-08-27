export class ZResizeables {
    static resizeables = new Map<any, boolean>();

    static addResizeable(mc: any) {
        ZResizeables.resizeables.set(mc, true);
    }

    static resize() {
        for (const [key] of ZResizeables.resizeables) {
            (key as any).resize();
        }
    }

    static removeResizeable(mc: any) {
        ZResizeables.resizeables.delete(mc);
    }
}

