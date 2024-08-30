import { NativeModule } from 'expo-modules-core';
import type { Directory, File } from './FileSystem.types';
declare class ExpoFileSystemNextModule extends NativeModule {
    FileSystemDirectory: typeof Directory;
    FileSystemFile: typeof File;
    downloadFileAsync(url: string, destination: File | Directory): Promise<string>;
    size: number | null;
    md5: string | null;
}
declare const _default: ExpoFileSystemNextModule;
export default _default;
//# sourceMappingURL=ExpoFileSystem.d.ts.map