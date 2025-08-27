export declare class ZPool {
    private dict;
    private static instance;
    private constructor();
    static getInstance(): ZPool;
    init(_numElements: number, symbolTemplate: string, type: string): void;
    clear(type: string): void;
    get(type: string): any;
    putBack(e: any, type: string): void;
}
//# sourceMappingURL=ZPool.d.ts.map