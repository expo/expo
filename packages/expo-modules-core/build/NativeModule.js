import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
ensureNativeModulesAreInstalled();
function getNativeModule() {
    if (typeof window !== 'undefined' && globalThis.expo?.NativeModule) {
        return globalThis.expo.NativeModule;
    }
    else {
        return {};
    }
}
export default getNativeModule();
//# sourceMappingURL=NativeModule.js.map