import { ZSceneStack } from "./ZSceneStack";
export class ZPool {
    dict = {};
    static instance = new ZPool();
    constructor() {
        if (ZPool.instance) {
            throw new Error("Singleton and can only be accessed through Singleton.getInstance()");
        }
    }
    static getInstance() {
        return ZPool.instance;
    }
    init(_numElements, symbolTemplate, type) {
        this.dict[type] = {
            curIndex: 0,
            numElements: _numElements,
            CLS: symbolTemplate,
            pool: new Array(_numElements)
        };
        const pool = this.dict[type].pool;
        for (let i = 0; i < _numElements; i++) {
            pool[i] = ZSceneStack.spawn(symbolTemplate);
        }
    }
    clear(type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            obj.curIndex = 0;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
    get(type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            const pool = obj.pool;
            const e = pool[obj.curIndex];
            if (e === null || e === undefined) {
                throw new Error(`pool ${type} limit exceeded ${obj.curIndex}`);
            }
            if (obj.fnctn) {
                obj.fnctn(e);
            }
            obj.curIndex++;
            return e;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
    putBack(e, type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            const pool = obj.pool;
            obj.curIndex--;
            pool[obj.curIndex] = e;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
}
//# sourceMappingURL=ZPool.js.map