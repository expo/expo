import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
ensureNativeModulesAreInstalled();
function getSharedObject() {
    if (typeof window !== 'undefined' && globalThis.expo?.SharedObject) {
        return globalThis.expo.SharedObject;
    }
    else {
        return {};
    }
}
export default getSharedObject();
//# sourceMappingURL=SharedObject.js.map