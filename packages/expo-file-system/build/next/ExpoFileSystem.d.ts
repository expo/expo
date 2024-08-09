import { NativeModule } from 'expo-modules-core';
import type { Directory, File } from './FileSystem.types';
declare class ExpoFileSystemNextModule extends NativeModule {
    FileSystemDirectory: typeof Directory;
    FileSystemFile: typeof File;
    download(url: string, to: Directory | File): Promise<string>;
}
declare const _default: ExpoFileSystemNextModule;
export default _default;
//# sourceMappingURL=ExpoFileSystem.d.ts.map