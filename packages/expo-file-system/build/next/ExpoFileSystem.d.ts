import { NativeModule } from 'expo-modules-core';
import type { Directory, File } from './ExpoFileSystem.types';
declare class ExpoFileSystemNextModule extends NativeModule {
    FileSystemDirectory: typeof Directory;
    FileSystemFile: typeof File;
    downloadFileAsync(url: string, destination: File | Directory): Promise<string>;
}
declare const _default: ExpoFileSystemNextModule;
export default _default;
//# sourceMappingURL=ExpoFileSystem.d.ts.map