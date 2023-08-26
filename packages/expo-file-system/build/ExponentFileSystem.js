import { requireNativeModule } from 'expo-modules-core';
import ExponentFileSystemShim from './ExponentFileSystemShim';
let platformModule;
try {
    platformModule = requireNativeModule('ExponentFileSystem');
}
catch {
    platformModule = ExponentFileSystemShim;
}
export default platformModule;
//# sourceMappingURL=ExponentFileSystem.js.map