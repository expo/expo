import { NativeModule } from 'expo-modules-core';
import { DownloadProgressData, ProgressEvent, UploadProgressData } from './FileSystem.types';
type PlatformMethod = (...args: any[]) => Promise<any>;
/**
 * @hidden
 */
export type FileSystemEvents = {
    'expo-file-system.downloadProgress'(event: ProgressEvent<DownloadProgressData>): void;
    'expo-file-system.uploadProgress'(event: ProgressEvent<UploadProgressData>): void;
};
export declare class ExponentFileSystemModule extends NativeModule<FileSystemEvents> {
    readonly documentDirectory: string | null;
    readonly cacheDirectory: string | null;
    readonly bundleDirectory: string | null;
    readonly getInfoAsync?: PlatformMethod;
    readonly readAsStringAsync?: PlatformMethod;
    readonly writeAsStringAsync?: PlatformMethod;
    readonly deleteAsync?: PlatformMethod;
    readonly moveAsync?: PlatformMethod;
    readonly copyAsync?: PlatformMethod;
    readonly makeDirectoryAsync?: PlatformMethod;
    readonly readDirectoryAsync?: PlatformMethod;
    readonly downloadAsync?: PlatformMethod;
    readonly uploadAsync?: PlatformMethod;
    readonly downloadResumableStartAsync?: PlatformMethod;
    readonly downloadResumablePauseAsync?: PlatformMethod;
    readonly getContentUriAsync?: PlatformMethod;
    readonly getFreeDiskStorageAsync?: PlatformMethod;
    readonly getTotalDiskCapacityAsync?: PlatformMethod;
    readonly requestDirectoryPermissionsAsync?: PlatformMethod;
    readonly readSAFDirectoryAsync?: PlatformMethod;
    readonly makeSAFDirectoryAsync?: PlatformMethod;
    readonly createSAFFileAsync?: PlatformMethod;
    readonly networkTaskCancelAsync?: PlatformMethod;
    readonly uploadTaskStartAsync?: PlatformMethod;
}
export {};
//# sourceMappingURL=types.d.ts.map