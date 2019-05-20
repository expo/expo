import { NativeModulesProxy } from '@unimodules/core';
import ExponentFileSystemShim from './ExponentFileSystemShim';
let platformModule;
if (NativeModulesProxy.ExponentFileSystem) {
    platformModule = NativeModulesProxy.ExponentFileSystem;
}
else {
    platformModule = ExponentFileSystemShim;
}
export default platformModule;
//# sourceMappingURL=ExponentFileSystem.js.map