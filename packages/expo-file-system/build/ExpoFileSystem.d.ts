import { NativeModule } from 'expo-modules-core';
import type { Directory, File, DownloadOptions, DownloadProgress, PathInfo } from './ExpoFileSystem.types';
type FileSystemEvents = {
    downloadProgress: (data: {
        uuid: string;
        data: DownloadProgress;
    }) => void;
};
declare class ExpoFileSystemModule extends NativeModule<FileSystemEvents> {
    FileSystemDirectory: typeof Directory;
    FileSystemFile: typeof File;
    downloadFileAsync(url: string, destination: File | Directory, options?: DownloadOptions, uuid?: string): Promise<string>;
    cancelDownloadAsync(uuid: string): void;
    pickDirectoryAsync(initialUri?: string): Promise<Directory>;
    pickFileAsync(initialUri?: string, mimeType?: string): Promise<File>;
    info(uri: string): PathInfo;
    totalDiskSpace: number;
    availableDiskSpace: number;
    documentDirectory: string;
    cacheDirectory: string;
    bundleDirectory: string;
    appleSharedContainers?: Record<string, string>;
}
declare const _default: ExpoFileSystemModule;
export default _default;
//# sourceMappingURL=ExpoFileSystem.d.ts.map