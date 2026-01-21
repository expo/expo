import type { DummySharedObject } from './DummySharedObject';
export type ExpoUIModuleType = {
    DummySharedObject: typeof DummySharedObject;
    completeRefresh(id: string): Promise<void>;
};
declare const _default: ExpoUIModuleType;
export default _default;
//# sourceMappingURL=NativeExpoUIModule.d.ts.map