import { SpineData } from "./SceneData";
import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
export declare class ZSpine {
    private spineData;
    private assetBasePath;
    constructor(spineData: SpineData, assetBasePath: string);
    load(callback: (spine: PIXISpine3.Spine | PIXISpine4.Spine | undefined) => void): Promise<void>;
    getFileNameWithoutExtension(path: string): string;
}
//# sourceMappingURL=ZSpine.d.ts.map