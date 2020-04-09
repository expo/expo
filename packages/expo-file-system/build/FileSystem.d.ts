import { EventEmitter, Subscription } from '@unimodules/core';
import { DownloadOptions, DownloadPauseState, DownloadProgressCallback, DownloadProgressData, DownloadResult, EncodingType, FileInfo, FileSystemDownloadResult, FileSystemHttpMethod, FileSystemSessionType, FileSystemUploadOptions, FileSystemUploadResult, ProgressEvent, ReadingOptions, WritingOptions } from './FileSystem.types';
export { DownloadOptions, DownloadPauseState, DownloadProgressCallback, DownloadProgressData, DownloadResult, EncodingType, FileInfo, FileSystemDownloadResult, FileSystemHttpMethod, FileSystemSessionType, FileSystemUploadOptions, FileSystemUploadResult, ProgressEvent, ReadingOptions, WritingOptions, };
export declare const documentDirectory: string | null;
export declare const cacheDirectory: string | null;
export declare const bundledAssets: string | null, bundleDirectory: string | null;
export declare function getInfoAsync(fileUri: string, options?: {
    md5?: boolean;
    size?: boolean;
}): Promise<FileInfo>;
export declare function readAsStringAsync(fileUri: string, options?: ReadingOptions): Promise<string>;
export declare function getContentUriAsync(fileUri: string): Promise<string>;
export declare function writeAsStringAsync(fileUri: string, contents: string, options?: WritingOptions): Promise<void>;
export declare function deleteAsync(fileUri: string, options?: {
    idempotent?: boolean;
}): Promise<void>;
export declare function deleteLegacyDocumentDirectoryAndroid(): Promise<void>;
export declare function moveAsync(options: {
    from: string;
    to: string;
}): Promise<void>;
export declare function copyAsync(options: {
    from: string;
    to: string;
}): Promise<void>;
export declare function makeDirectoryAsync(fileUri: string, options?: {
    intermediates?: boolean;
}): Promise<void>;
export declare function readDirectoryAsync(fileUri: string): Promise<string[]>;
export declare function getFreeDiskStorageAsync(): Promise<number>;
export declare function getTotalDiskCapacityAsync(): Promise<number>;
export declare function downloadAsync(uri: string, fileUri: string, options?: DownloadOptions): Promise<FileSystemDownloadResult>;
export declare function uploadAsync(url: string, fileUri: string, options?: FileSystemUploadOptions): Promise<FileSystemUploadResult>;
export declare function createDownloadResumable(uri: string, fileUri: string, options?: DownloadOptions, callback?: DownloadProgressCallback, resumeData?: string): DownloadResumable;
export declare class DownloadResumable {
    _uuid: string;
    _url: string;
    _fileUri: string;
    _options: DownloadOptions;
    _resumeData?: string;
    _callback?: DownloadProgressCallback;
    _subscription?: Subscription | null;
    _emitter: EventEmitter;
    constructor(url: string, fileUri: string, options?: DownloadOptions, callback?: DownloadProgressCallback, resumeData?: string);
    downloadAsync(): Promise<FileSystemDownloadResult | undefined>;
    pauseAsync(): Promise<DownloadPauseState>;
    resumeAsync(): Promise<FileSystemDownloadResult | undefined>;
    savable(): DownloadPauseState;
    _addSubscription(): void;
    _removeSubscription(): void;
}
