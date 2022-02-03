import { DownloadOptions, DownloadPauseState, DownloadProgressCallback, FileSystemNetworkTaskProgressCallback, DownloadProgressData, UploadProgressData, DownloadResult, EncodingType, FileInfo, FileSystemAcceptedUploadHttpMethod, FileSystemDownloadResult, FileSystemRequestDirectoryPermissionsResult, FileSystemSessionType, FileSystemUploadOptions, FileSystemUploadResult, FileSystemUploadType, ReadingOptions, WritingOptions } from './FileSystem.types';
export { DownloadOptions, DownloadPauseState, DownloadProgressCallback, DownloadProgressData, DownloadResult, EncodingType, FileInfo, FileSystemDownloadResult, FileSystemRequestDirectoryPermissionsResult, FileSystemAcceptedUploadHttpMethod, FileSystemSessionType, FileSystemUploadOptions, FileSystemUploadResult, FileSystemUploadType, FileSystemNetworkTaskProgressCallback, ReadingOptions, WritingOptions, };
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
export declare function createDownloadResumable(uri: string, fileUri: string, options?: DownloadOptions, callback?: FileSystemNetworkTaskProgressCallback<DownloadProgressData>, resumeData?: string): DownloadResumable;
export declare function createUploadTask(url: string, fileUri: string, options?: FileSystemUploadOptions, callback?: FileSystemNetworkTaskProgressCallback<UploadProgressData>): UploadTask;
export declare abstract class FileSystemCancellableNetworkTask<T extends DownloadProgressData | UploadProgressData> {
    private _uuid;
    protected taskWasCanceled: boolean;
    private emitter;
    private subscription?;
    cancelAsync(): Promise<void>;
    protected isTaskCancelled(): boolean;
    protected get uuid(): string;
    protected abstract getEventName(): string;
    protected abstract getCallback(): FileSystemNetworkTaskProgressCallback<T> | undefined;
    protected addSubscription(): void;
    protected removeSubscription(): void;
}
export declare class UploadTask extends FileSystemCancellableNetworkTask<UploadProgressData> {
    private url;
    private fileUri;
    private callback?;
    private options;
    constructor(url: string, fileUri: string, options?: FileSystemUploadOptions, callback?: FileSystemNetworkTaskProgressCallback<UploadProgressData> | undefined);
    protected getEventName(): string;
    protected getCallback(): FileSystemNetworkTaskProgressCallback<UploadProgressData> | undefined;
    uploadAsync(): Promise<FileSystemUploadResult | undefined>;
}
export declare class DownloadResumable extends FileSystemCancellableNetworkTask<DownloadProgressData> {
    private url;
    private _fileUri;
    private options;
    private callback?;
    private resumeData?;
    constructor(url: string, _fileUri: string, options?: DownloadOptions, callback?: FileSystemNetworkTaskProgressCallback<DownloadProgressData> | undefined, resumeData?: string | undefined);
    get fileUri(): string;
    protected getEventName(): string;
    protected getCallback(): FileSystemNetworkTaskProgressCallback<DownloadProgressData> | undefined;
    downloadAsync(): Promise<FileSystemDownloadResult | undefined>;
    pauseAsync(): Promise<DownloadPauseState>;
    resumeAsync(): Promise<FileSystemDownloadResult | undefined>;
    savable(): DownloadPauseState;
}
/**
 * Android only
 */
export declare namespace StorageAccessFramework {
    function getUriForDirectoryInRoot(folderName: string): string;
    function requestDirectoryPermissionsAsync(initialFileUrl?: string | null): Promise<FileSystemRequestDirectoryPermissionsResult>;
    function readDirectoryAsync(dirUri: string): Promise<string[]>;
    function makeDirectoryAsync(parentUri: string, dirName: string): Promise<string>;
    function createFileAsync(parentUri: string, fileName: string, mimeType: string): Promise<string>;
    const writeAsStringAsync: typeof import("./FileSystem").writeAsStringAsync;
    const readAsStringAsync: typeof import("./FileSystem").readAsStringAsync;
    const deleteAsync: typeof import("./FileSystem").deleteAsync;
    const moveAsync: typeof import("./FileSystem").moveAsync;
    const copyAsync: typeof import("./FileSystem").copyAsync;
}
//# sourceMappingURL=FileSystem.d.ts.map