import { DownloadOptions, DownloadPauseState, FileSystemNetworkTaskProgressCallback, DownloadProgressData, UploadProgressData, FileInfo, FileSystemDownloadResult, FileSystemRequestDirectoryPermissionsResult, FileSystemUploadOptions, FileSystemUploadResult, ReadingOptions, WritingOptions, DeletingOptions, InfoOptions, RelocatingOptions, MakeDirectoryOptions } from './FileSystem.types';
/**
 * `file://` URI pointing to the directory where user documents for this app will be stored.
 * Files stored here will remain until explicitly deleted by the app. Ends with a trailing `/`.
 * Example uses are for files the user saves that they expect to see again.
 */
export declare const documentDirectory: string | null;
/**
 * `file://` URI pointing to the directory where temporary files used by this app will be stored.
 * Files stored here may be automatically deleted by the system when low on storage.
 * Example uses are for downloaded or generated files that the app just needs for one-time usage.
 */
export declare const cacheDirectory: string | null;
export declare const bundledAssets: string | null, bundleDirectory: string | null;
/**
 * Get metadata information about a file, directory or external content/asset.
 * @param fileUri URI to the file or directory. See [supported URI schemes](#supported-uri-schemes).
 * @param options A map of options represented by [`InfoOptions`](#infooptions) type.
 * @return A Promise that resolves to a `FileInfo` object. If no item exists at this URI,
 * the returned Promise resolves to `FileInfo` object in form of `{ exists: false, isDirectory: false }`.
 */
export declare function getInfoAsync(fileUri: string, options?: InfoOptions): Promise<FileInfo>;
/**
 * Read the entire contents of a file as a string. Binary will be returned in raw format, you will need to append `data:image/png;base64,` to use it as Base64.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * @param options A map of read options represented by [`ReadingOptions`](#readingoptions) type.
 * @return A Promise that resolves to a string containing the entire contents of the file.
 */
export declare function readAsStringAsync(fileUri: string, options?: ReadingOptions): Promise<string>;
/**
 * Takes a `file://` URI and converts it into content URI (`content://`) so that it can be accessed by other applications outside of Expo.
 * @param fileUri The local URI of the file. If there is no file at this URI, an exception will be thrown.
 * @example
 * ```js
 * FileSystem.getContentUriAsync(uri).then(cUri => {
 *   console.log(cUri);
 *   IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
 *     data: cUri,
 *     flags: 1,
 *   });
 * });
 * ```
 * @return Returns a Promise that resolves to a `string` containing a `content://` URI pointing to the file.
 * The URI is the same as the `fileUri` input parameter but in a different format.
 * @platform android
 */
export declare function getContentUriAsync(fileUri: string): Promise<string>;
/**
 * Write the entire contents of a file as a string.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * > Note: when you're using SAF URI the file needs to exist. You can't create a new file.
 * @param contents The string to replace the contents of the file with.
 * @param options A map of write options represented by [`WritingOptions`](#writingoptions) type.
 */
export declare function writeAsStringAsync(fileUri: string, contents: string, options?: WritingOptions): Promise<void>;
/**
 * Delete a file or directory. If the URI points to a directory, the directory and all its contents are recursively deleted.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * @param options A map of write options represented by [`DeletingOptions`](#deletingoptions) type.
 */
export declare function deleteAsync(fileUri: string, options?: DeletingOptions): Promise<void>;
export declare function deleteLegacyDocumentDirectoryAndroid(): Promise<void>;
/**
 * Move a file or directory to a new location.
 * @param options A map of move options represented by [`RelocatingOptions`](#relocatingoptions) type.
 */
export declare function moveAsync(options: RelocatingOptions): Promise<void>;
/**
 * Create a copy of a file or directory. Directories are recursively copied with all of their contents.
 * It can be also used to copy content shared by other apps to local filesystem.
 * @param options A map of move options represented by [`RelocatingOptions`](#relocatingoptions) type.
 */
export declare function copyAsync(options: RelocatingOptions): Promise<void>;
/**
 * Create a new empty directory.
 * @param fileUri `file://` URI to the new directory to create.
 * @param options A map of create directory options represented by [`MakeDirectoryOptions`](#makedirectoryoptions) type.
 */
export declare function makeDirectoryAsync(fileUri: string, options?: MakeDirectoryOptions): Promise<void>;
/**
 * Enumerate the contents of a directory.
 * @param fileUri `file://` URI to the directory.
 * @return A Promise that resolves to an array of strings, each containing the name of a file or directory contained in the directory at `fileUri`.
 */
export declare function readDirectoryAsync(fileUri: string): Promise<string[]>;
/**
 * Gets the available internal disk storage size, in bytes. This returns the free space on the data partition that hosts all of the internal storage for all apps on the device.
 * @return Returns a Promise that resolves to the number of bytes available on the internal disk, or JavaScript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
 * if the capacity is greater than 2<sup>53</sup> - 1 bytes.
 */
export declare function getFreeDiskStorageAsync(): Promise<number>;
/**
 * Gets total internal disk storage size, in bytes. This is the total capacity of the data partition that hosts all the internal storage for all apps on the device.
 * @return Returns a Promise that resolves to a number that specifies the total internal disk storage capacity in bytes, or JavaScript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
 * if the capacity is greater than 2<sup>53</sup> - 1 bytes.
 */
export declare function getTotalDiskCapacityAsync(): Promise<number>;
/**
 * Download the contents at a remote URI to a file in the app's file system. The directory for a local file uri must exist prior to calling this function.
 * @param uri The remote URI to download from.
 * @param fileUri The local URI of the file to download to. If there is no file at this URI, a new one is created.
 * If there is a file at this URI, its contents are replaced. The directory for the file must exist.
 * @param options A map of download options represented by [`DownloadOptions`](#downloadoptions) type.
 * @example
 * ```js
 * FileSystem.downloadAsync(
 *   'http://techslides.com/demos/sample-videos/small.mp4',
 *   FileSystem.documentDirectory + 'small.mp4'
 * )
 *   .then(({ uri }) => {
 *     console.log('Finished downloading to ', uri);
 *   })
 *   .catch(error => {
 *     console.error(error);
 *   });
 * ```
 * @return Returns a Promise that resolves to a `FileSystemDownloadResult` object.
 */
export declare function downloadAsync(uri: string, fileUri: string, options?: DownloadOptions): Promise<FileSystemDownloadResult>;
/**
 * Upload the contents of the file pointed by `fileUri` to the remote url.
 * @param url The remote URL, where the file will be sent.
 * @param fileUri The local URI of the file to send. The file must exist.
 * @param options A map of download options represented by [`FileSystemUploadOptions`](#filesystemuploadoptions) type.
 * @example
 * **Client**
 *
 * ```js
 * import * as FileSystem from 'expo-file-system';
 *
 * try {
 *   const response = await FileSystem.uploadAsync(`http://192.168.0.1:1234/binary-upload`, fileUri, {
 *     fieldName: 'file',
 *     httpMethod: 'PATCH',
 *     uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
 *   });
 *   console.log(JSON.stringify(response, null, 4));
 * } catch (error) {
 *   console.log(error);
 * }
 * ```
 *
 * **Server**
 *
 * Please refer to the "[Server: Handling multipart requests](#server-handling-multipart-requests)" example - there is code for a simple Node.js server.
 * @return Returns a Promise that resolves to `FileSystemUploadResult` object.
 */
export declare function uploadAsync(url: string, fileUri: string, options?: FileSystemUploadOptions): Promise<FileSystemUploadResult>;
/**
 * Create a `DownloadResumable` object which can start, pause, and resume a download of contents at a remote URI to a file in the app's file system.
 * > Note: You need to call `downloadAsync()`, on a `DownloadResumable` instance to initiate the download.
 * The `DownloadResumable` object has a callback that provides download progress updates.
 * Downloads can be resumed across app restarts by using `AsyncStorage` to store the `DownloadResumable.savable()` object for later retrieval.
 * The `savable` object contains the arguments required to initialize a new `DownloadResumable` object to resume the download after an app restart.
 * The directory for a local file uri must exist prior to calling this function.
 * @param uri The remote URI to download from.
 * @param fileUri The local URI of the file to download to. If there is no file at this URI, a new one is created.
 * If there is a file at this URI, its contents are replaced. The directory for the file must exist.
 * @param options A map of download options represented by [`DownloadOptions`](#downloadoptions) type.
 * @param callback This function is called on each data write to update the download progress.
 * > **Note**: When the app has been moved to the background, this callback won't be fired until it's moved to the foreground.
 * @param resumeData The string which allows the api to resume a paused download. This is set on the `DownloadResumable` object automatically when a download is paused.
 * When initializing a new `DownloadResumable` this should be `null`.
 */
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
    /**
     * Download the contents at a remote URI to a file in the app's file system.
     * @return Returns a Promise that resolves to `FileSystemDownloadResult` object, or to `undefined` when task was cancelled.
     */
    downloadAsync(): Promise<FileSystemDownloadResult | undefined>;
    /**
     * Pause the current download operation. `resumeData` is added to the `DownloadResumable` object after a successful pause operation.
     * Returns an object that can be saved with `AsyncStorage` for future retrieval (the same object that is returned from calling `FileSystem.DownloadResumable.savable()`).
     * @return Returns a Promise that resolves to `DownloadPauseState` object.
     */
    pauseAsync(): Promise<DownloadPauseState>;
    /**
     * Resume a paused download operation.
     * @return Returns a Promise that resolves to `FileSystemDownloadResult` object, or to `undefined` when task was cancelled.
     */
    resumeAsync(): Promise<FileSystemDownloadResult | undefined>;
    /**
     * Method to get the object which can be saved with `AsyncStorage` for future retrieval.
     * @returns Returns object in shape of `DownloadPauseState` type.
     */
    savable(): DownloadPauseState;
}
/**
 * The `StorageAccessFramework` is a namespace inside of the `expo-file-system` module, which encapsulates all functions which can be used with [SAF URIs](#saf-uri).
 * You can read more about SAF in the [Android documentation](https://developer.android.com/guide/topics/providers/document-provider).
 *
 * @example
 * # Basic Usage
 *
 * ```ts
 * import { StorageAccessFramework } from 'expo-file-system';
 *
 * // Requests permissions for external directory
 * const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
 *
 * if (permissions.granted) {
 *   // Gets SAF URI from response
 *   const uri = permissions.directoryUri;
 *
 *   // Gets all files inside of selected directory
 *   const files = await StorageAccessFramework.readDirectoryAsync(uri);
 *   alert(`Files inside ${uri}:\n\n${JSON.stringify(files)}`);
 * }
 * ```
 *
 * # Migrating an album
 *
 * ```ts
 * import * as MediaLibrary from 'expo-media-library';
 * import * as FileSystem from 'expo-file-system';
 * const { StorageAccessFramework } = FileSystem;
 *
 * async function migrateAlbum(albumName: string) {
 *   // Gets SAF URI to the album
 *   const albumUri = StorageAccessFramework.getUriForDirectoryInRoot(albumName);
 *
 *   // Requests permissions
 *   const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(albumUri);
 *   if (!permissions.granted) {
 *     return;
 *   }
 *
 *   const permittedUri = permissions.directoryUri;
 *   // Checks if users selected the correct folder
 *   if (!permittedUri.includes(albumName)) {
 *     return;
 *   }
 *
 *   const mediaLibraryPermissions = await MediaLibrary.requestPermissionsAsync();
 *   if (!mediaLibraryPermissions.granted) {
 *     return;
 *   }
 *
 *   // Moves files from external storage to internal storage
 *   await StorageAccessFramework.moveAsync({
 *     from: permittedUri,
 *     to: FileSystem.documentDirectory!,
 *   });
 *
 *   const outputDir = FileSystem.documentDirectory! + albumName;
 *   const migratedFiles = await FileSystem.readDirectoryAsync(outputDir);
 *
 *   // Creates assets from local files
 *   const [newAlbumCreator, ...assets] = await Promise.all(
 *     migratedFiles.map<Promise<MediaLibrary.Asset>>(
 *       async fileName => await MediaLibrary.createAssetAsync(outputDir + '/' + fileName)
 *     )
 *   );
 *
 *   // Album was empty
 *   if (!newAlbumCreator) {
 *     return;
 *   }
 *
 *   // Creates a new album in the scoped directory
 *   const newAlbum = await MediaLibrary.createAlbumAsync(albumName, newAlbumCreator, false);
 *   if (assets.length) {
 *     await MediaLibrary.addAssetsToAlbumAsync(assets, newAlbum, false);
 *   }
 * }
 * ```
 * @platform Android
 */
export declare namespace StorageAccessFramework {
    /**
     * Gets a [SAF URI](#saf-uri) pointing to a folder in the Android root directory. You can use this function to get URI for
     * `StorageAccessFramework.requestDirectoryPermissionsAsync()` when you trying to migrate an album. In that case, the name of the album is the folder name.
     * @param folderName The name of the folder which is located in the Android root directory.
     * @return Returns a [SAF URI](#saf-uri) to a folder.
     */
    function getUriForDirectoryInRoot(folderName: string): string;
    /**
     * Allows users to select a specific directory, granting your app access to all of the files and sub-directories within that directory.
     * @param initialFileUrl The [SAF URI](#saf-uri) of the directory that the file picker should display when it first loads.
     * If URI is incorrect or points to a non-existing folder, it's ignored.
     * @platform android 11+
     * @return Returns a Promise that resolves to `FileSystemRequestDirectoryPermissionsResult` object.
     */
    function requestDirectoryPermissionsAsync(initialFileUrl?: string | null): Promise<FileSystemRequestDirectoryPermissionsResult>;
    /**
     * Enumerate the contents of a directory.
     * @param dirUri [SAF](#saf-uri) URI to the directory.
     * @return A Promise that resolves to an array of strings, each containing the full [SAF URI](#saf-uri) of a file or directory contained in the directory at `fileUri`.
     */
    function readDirectoryAsync(dirUri: string): Promise<string[]>;
    /**
     * Creates a new empty directory.
     * @param parentUri The [SAF](#saf-uri) URI to the parent directory.
     * @param dirName The name of new directory.
     * @return A Promise that resolves to a [SAF URI](#saf-uri) to the created directory.
     */
    function makeDirectoryAsync(parentUri: string, dirName: string): Promise<string>;
    /**
     * Creates a new empty file.
     * @param parentUri The [SAF](#saf-uri) URI to the parent directory.
     * @param fileName The name of new file **without the extension**.
     * @param mimeType The MIME type of new file.
     * @return A Promise that resolves to a [SAF URI](#saf-uri) to the created file.
     */
    function createFileAsync(parentUri: string, fileName: string, mimeType: string): Promise<string>;
    /**
     * Alias for [`writeAsStringAsync`](#filesystemwriteasstringasyncfileuri-contents-options) method.
     */
    const writeAsStringAsync: typeof import("./FileSystem").writeAsStringAsync;
    /**
     * Alias for [`readAsStringAsync`](#filesystemreadasstringasyncfileuri-options) method.
     */
    const readAsStringAsync: typeof import("./FileSystem").readAsStringAsync;
    /**
     * Alias for [`deleteAsync`](#filesystemdeleteasyncfileuri-options) method.
     */
    const deleteAsync: typeof import("./FileSystem").deleteAsync;
    /**
     * Alias for [`moveAsync`](#filesystemmoveasyncoptions) method.
     */
    const moveAsync: typeof import("./FileSystem").moveAsync;
    /**
     * Alias for [`copyAsync`](#filesystemcopyasyncoptions) method.
     */
    const copyAsync: typeof import("./FileSystem").copyAsync;
}
//# sourceMappingURL=FileSystem.d.ts.map