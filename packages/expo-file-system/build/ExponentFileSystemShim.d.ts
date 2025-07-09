import { NativeModule } from 'expo-modules-core';
import type { ExponentFileSystemModule, FileSystemEvents } from './types';
export default class FileSystemShim extends NativeModule<FileSystemEvents> implements ExponentFileSystemModule {
    documentDirectory: null;
    cacheDirectory: null;
    bundleDirectory: null;
}
//# sourceMappingURL=ExponentFileSystemShim.d.ts.map