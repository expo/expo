import type { DummySharedObject } from './DummySharedObject';
import type { NativeStateString } from './NativeState/NativeStateString';
export type ExpoUIModuleType = {
    DummySharedObject: typeof DummySharedObject;
    NativeStateString: typeof NativeStateString;
    completeRefresh(id: string): Promise<void>;
};
declare const _default: ExpoUIModuleType;
export default _default;
//# sourceMappingURL=NativeExpoUIModule.d.ts.map