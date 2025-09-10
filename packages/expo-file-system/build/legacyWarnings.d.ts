import type { DownloadOptions, FileSystemNetworkTaskProgressCallback, DownloadProgressData, UploadProgressData, FileInfo, FileSystemDownloadResult, FileSystemUploadOptions, FileSystemUploadResult, ReadingOptions, WritingOptions, DeletingOptions, InfoOptions, RelocatingOptions, MakeDirectoryOptions } from './legacy/FileSystem.types';
/**
 * @deprecated Use `new File().info` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function getInfoAsync(fileUri: string, options?: InfoOptions): Promise<FileInfo>;
/**
 * @deprecated Use `new File().text()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function readAsStringAsync(fileUri: string, options?: ReadingOptions): Promise<string>;
/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function getContentUriAsync(fileUri: string): Promise<string>;
/**
 * @deprecated Use `new File().write()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function writeAsStringAsync(fileUri: string, contents: string, options?: WritingOptions): Promise<void>;
/**
 * @deprecated Use `new File().delete()` or `new Directory().delete()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function deleteAsync(fileUri: string, options?: DeletingOptions): Promise<void>;
/**
 * @deprecated
 */
export declare function deleteLegacyDocumentDirectoryAndroid(): Promise<void>;
/**
 * @deprecated Use `new File().move()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function moveAsync(options: RelocatingOptions): Promise<void>;
/**
 * @deprecated Use `new File().copy()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function copyAsync(options: RelocatingOptions): Promise<void>;
/**
 * @deprecated Use `new Directory().create()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function makeDirectoryAsync(fileUri: string, options?: MakeDirectoryOptions): Promise<void>;
/**
 * @deprecated Use `new Directory().list()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function readDirectoryAsync(fileUri: string): Promise<string[]>;
/**
 * @deprecated Use `Paths.availableDiskSpace` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function getFreeDiskStorageAsync(): Promise<number>;
/**
 * @deprecated Use `Paths.totalDiskSpace` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function getTotalDiskCapacityAsync(): Promise<number>;
/**
 * @deprecated Use `File.downloadFileAsync` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function downloadAsync(uri: string, fileUri: string, options?: DownloadOptions): Promise<FileSystemDownloadResult>;
/**
 * @deprecated Use `@expo/fetch` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function uploadAsync(url: string, fileUri: string, options?: FileSystemUploadOptions): Promise<FileSystemUploadResult>;
/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function createDownloadResumable(uri: string, fileUri: string, options?: DownloadOptions, callback?: FileSystemNetworkTaskProgressCallback<DownloadProgressData>, resumeData?: string): any;
/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export declare function createUploadTask(url: string, fileUri: string, options?: FileSystemUploadOptions, callback?: FileSystemNetworkTaskProgressCallback<UploadProgressData>): any;
//# sourceMappingURL=legacyWarnings.d.ts.map