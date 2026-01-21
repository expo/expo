import type { DummySharedObject } from './DummySharedObject';
import type { NativeStateString, NativeStateDouble, NativeStateBool } from './NativeState';
export type ExpoUIModuleType = {
    DummySharedObject: typeof DummySharedObject;
    NativeStateString: typeof NativeStateString;
    NativeStateDouble: typeof NativeStateDouble;
    NativeStateBool: typeof NativeStateBool;
    completeRefresh(id: string): Promise<void>;
};
declare const _default: ExpoUIModuleType;
export default _default;
//# sourceMappingURL=NativeExpoUIModule.d.ts.map