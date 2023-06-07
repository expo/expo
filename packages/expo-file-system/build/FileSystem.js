import { EventEmitter, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import ExponentFileSystem from './ExponentFileSystem';
import { FileSystemSessionType, FileSystemUploadType, } from './FileSystem.types';
if (!ExponentFileSystem) {
    console.warn("No native ExponentFileSystem module found, are you sure the expo-file-system's module is linked properly?");
}
// Prevent webpack from pruning this.
const _unused = new EventEmitter(ExponentFileSystem); // eslint-disable-line
function normalizeEndingSlash(p) {
    if (p != null) {
        return p.replace(/\/*$/, '') + '/';
    }
    return null;
}
/**
 * `file://` URI pointing to the directory where user documents for this app will be stored.
 * Files stored here will remain until explicitly deleted by the app. Ends with a trailing `/`.
 * Example uses are for files the user saves that they expect to see again.
 */
export const documentDirectory = normalizeEndingSlash(ExponentFileSystem.documentDirectory);
/**
 * `file://` URI pointing to the directory where temporary files used by this app will be stored.
 * Files stored here may be automatically deleted by the system when low on storage.
 * Example uses are for downloaded or generated files that the app just needs for one-time usage.
 */
export const cacheDirectory = normalizeEndingSlash(ExponentFileSystem.cacheDirectory);
// @docsMissing
export const { bundledAssets, bundleDirectory } = ExponentFileSystem;
/**
 * Get metadata information about a file, directory or external content/asset.
 * @param fileUri URI to the file or directory. See [supported URI schemes](#supported-uri-schemes).
 * @param options A map of options represented by [`GetInfoAsyncOptions`](#getinfoasyncoptions) type.
 * @return A Promise that resolves to a `FileInfo` object. If no item exists at this URI,
 * the returned Promise resolves to `FileInfo` object in form of `{ exists: false, isDirectory: false }`.
 */
export async function getInfoAsync(fileUri, options = {}) {
    if (!ExponentFileSystem.getInfoAsync) {
        throw new UnavailabilityError('expo-file-system', 'getInfoAsync');
    }
    return await ExponentFileSystem.getInfoAsync(fileUri, options);
}
/**
 * Read the entire contents of a file as a string. Binary will be returned in raw format, you will need to append `data:image/png;base64,` to use it as Base64.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * @param options A map of read options represented by [`ReadingOptions`](#readingoptions) type.
 * @return A Promise that resolves to a string containing the entire contents of the file.
 */
export async function readAsStringAsync(fileUri, options = {}) {
    if (!ExponentFileSystem.readAsStringAsync) {
        throw new UnavailabilityError('expo-file-system', 'readAsStringAsync');
    }
    return await ExponentFileSystem.readAsStringAsync(fileUri, options);
}
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
export async function getContentUriAsync(fileUri) {
    if (Platform.OS === 'android') {
        if (!ExponentFileSystem.getContentUriAsync) {
            throw new UnavailabilityError('expo-file-system', 'getContentUriAsync');
        }
        return await ExponentFileSystem.getContentUriAsync(fileUri);
    }
    else {
        return fileUri;
    }
}
/**
 * Write the entire contents of a file as a string.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * > Note: when you're using SAF URI the file needs to exist. You can't create a new file.
 * @param contents The string to replace the contents of the file with.
 * @param options A map of write options represented by [`WritingOptions`](#writingoptions) type.
 */
export async function writeAsStringAsync(fileUri, contents, options = {}) {
    if (!ExponentFileSystem.writeAsStringAsync) {
        throw new UnavailabilityError('expo-file-system', 'writeAsStringAsync');
    }
    return await ExponentFileSystem.writeAsStringAsync(fileUri, contents, options);
}
/**
 * Delete a file or directory. If the URI points to a directory, the directory and all its contents are recursively deleted.
 * @param fileUri `file://` or [SAF](#saf-uri) URI to the file or directory.
 * @param options A map of write options represented by [`DeletingOptions`](#deletingoptions) type.
 */
export async function deleteAsync(fileUri, options = {}) {
    if (!ExponentFileSystem.deleteAsync) {
        throw new UnavailabilityError('expo-file-system', 'deleteAsync');
    }
    return await ExponentFileSystem.deleteAsync(fileUri, options);
}
export async function deleteLegacyDocumentDirectoryAndroid() {
    if (Platform.OS !== 'android' || documentDirectory == null) {
        return;
    }
    const legacyDocumentDirectory = `${documentDirectory}ExperienceData/`;
    return await deleteAsync(legacyDocumentDirectory, { idempotent: true });
}
/**
 * Move a file or directory to a new location.
 * @param options A map of move options represented by [`RelocatingOptions`](#relocatingoptions) type.
 */
export async function moveAsync(options) {
    if (!ExponentFileSystem.moveAsync) {
        throw new UnavailabilityError('expo-file-system', 'moveAsync');
    }
    return await ExponentFileSystem.moveAsync(options);
}
/**
 * Create a copy of a file or directory. Directories are recursively copied with all of their contents.
 * It can be also used to copy content shared by other apps to local filesystem.
 * @param options A map of move options represented by [`RelocatingOptions`](#relocatingoptions) type.
 */
export async function copyAsync(options) {
    if (!ExponentFileSystem.copyAsync) {
        throw new UnavailabilityError('expo-file-system', 'copyAsync');
    }
    return await ExponentFileSystem.copyAsync(options);
}
/**
 * Create a new empty directory.
 * @param fileUri `file://` URI to the new directory to create.
 * @param options A map of create directory options represented by [`MakeDirectoryOptions`](#makedirectoryoptions) type.
 */
export async function makeDirectoryAsync(fileUri, options = {}) {
    if (!ExponentFileSystem.makeDirectoryAsync) {
        throw new UnavailabilityError('expo-file-system', 'makeDirectoryAsync');
    }
    return await ExponentFileSystem.makeDirectoryAsync(fileUri, options);
}
/**
 * Enumerate the contents of a directory.
 * @param fileUri `file://` URI to the directory.
 * @return A Promise that resolves to an array of strings, each containing the name of a file or directory contained in the directory at `fileUri`.
 */
export async function readDirectoryAsync(fileUri) {
    if (!ExponentFileSystem.readDirectoryAsync) {
        throw new UnavailabilityError('expo-file-system', 'readDirectoryAsync');
    }
    return await ExponentFileSystem.readDirectoryAsync(fileUri);
}
/**
 * Gets the available internal disk storage size, in bytes. This returns the free space on the data partition that hosts all of the internal storage for all apps on the device.
 * @return Returns a Promise that resolves to the number of bytes available on the internal disk, or JavaScript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
 * if the capacity is greater than 2<sup>53</sup> - 1 bytes.
 */
export async function getFreeDiskStorageAsync() {
    if (!ExponentFileSystem.getFreeDiskStorageAsync) {
        throw new UnavailabilityError('expo-file-system', 'getFreeDiskStorageAsync');
    }
    return await ExponentFileSystem.getFreeDiskStorageAsync();
}
/**
 * Gets total internal disk storage size, in bytes. This is the total capacity of the data partition that hosts all the internal storage for all apps on the device.
 * @return Returns a Promise that resolves to a number that specifies the total internal disk storage capacity in bytes, or JavaScript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
 * if the capacity is greater than 2<sup>53</sup> - 1 bytes.
 */
export async function getTotalDiskCapacityAsync() {
    if (!ExponentFileSystem.getTotalDiskCapacityAsync) {
        throw new UnavailabilityError('expo-file-system', 'getTotalDiskCapacityAsync');
    }
    return await ExponentFileSystem.getTotalDiskCapacityAsync();
}
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
export async function downloadAsync(uri, fileUri, options = {}) {
    if (!ExponentFileSystem.downloadAsync) {
        throw new UnavailabilityError('expo-file-system', 'downloadAsync');
    }
    return await ExponentFileSystem.downloadAsync(uri, fileUri, {
        sessionType: FileSystemSessionType.BACKGROUND,
        ...options,
    });
}
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
export async function uploadAsync(url, fileUri, options = {}) {
    if (!ExponentFileSystem.uploadAsync) {
        throw new UnavailabilityError('expo-file-system', 'uploadAsync');
    }
    return await ExponentFileSystem.uploadAsync(url, fileUri, {
        sessionType: FileSystemSessionType.BACKGROUND,
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        ...options,
        httpMethod: (options.httpMethod || 'POST').toUpperCase(),
    });
}
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
export function createDownloadResumable(uri, fileUri, options, callback, resumeData) {
    return new DownloadResumable(uri, fileUri, options, callback, resumeData);
}
export function createUploadTask(url, fileUri, options, callback) {
    return new UploadTask(url, fileUri, options, callback);
}
export class FileSystemCancellableNetworkTask {
    _uuid = uuidv4();
    taskWasCanceled = false;
    emitter = new EventEmitter(ExponentFileSystem);
    subscription;
    // @docsMissing
    async cancelAsync() {
        if (!ExponentFileSystem.networkTaskCancelAsync) {
            throw new UnavailabilityError('expo-file-system', 'networkTaskCancelAsync');
        }
        this.removeSubscription();
        this.taskWasCanceled = true;
        return await ExponentFileSystem.networkTaskCancelAsync(this.uuid);
    }
    isTaskCancelled() {
        if (this.taskWasCanceled) {
            console.warn('This task was already canceled.');
            return true;
        }
        return false;
    }
    get uuid() {
        return this._uuid;
    }
    addSubscription() {
        if (this.subscription) {
            return;
        }
        this.subscription = this.emitter.addListener(this.getEventName(), (event) => {
            if (event.uuid === this.uuid) {
                const callback = this.getCallback();
                if (callback) {
                    callback(event.data);
                }
            }
        });
    }
    removeSubscription() {
        if (!this.subscription) {
            return;
        }
        this.emitter.removeSubscription(this.subscription);
        this.subscription = null;
    }
}
export class UploadTask extends FileSystemCancellableNetworkTask {
    url;
    fileUri;
    callback;
    options;
    constructor(url, fileUri, options, callback) {
        super();
        this.url = url;
        this.fileUri = fileUri;
        this.callback = callback;
        const httpMethod = (options?.httpMethod?.toUpperCase() ||
            'POST');
        this.options = {
            sessionType: FileSystemSessionType.BACKGROUND,
            uploadType: FileSystemUploadType.BINARY_CONTENT,
            ...options,
            httpMethod,
        };
    }
    getEventName() {
        return 'expo-file-system.uploadProgress';
    }
    getCallback() {
        return this.callback;
    }
    // @docsMissing
    async uploadAsync() {
        if (!ExponentFileSystem.uploadTaskStartAsync) {
            throw new UnavailabilityError('expo-file-system', 'uploadTaskStartAsync');
        }
        if (this.isTaskCancelled()) {
            return;
        }
        this.addSubscription();
        const result = await ExponentFileSystem.uploadTaskStartAsync(this.url, this.fileUri, this.uuid, this.options);
        this.removeSubscription();
        return result;
    }
}
export class DownloadResumable extends FileSystemCancellableNetworkTask {
    url;
    _fileUri;
    options;
    callback;
    resumeData;
    constructor(url, _fileUri, options = {}, callback, resumeData) {
        super();
        this.url = url;
        this._fileUri = _fileUri;
        this.options = options;
        this.callback = callback;
        this.resumeData = resumeData;
    }
    get fileUri() {
        return this._fileUri;
    }
    getEventName() {
        return 'expo-file-system.downloadProgress';
    }
    getCallback() {
        return this.callback;
    }
    /**
     * Download the contents at a remote URI to a file in the app's file system.
     * @return Returns a Promise that resolves to `FileSystemDownloadResult` object, or to `undefined` when task was cancelled.
     */
    async downloadAsync() {
        if (!ExponentFileSystem.downloadResumableStartAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
        }
        if (this.isTaskCancelled()) {
            return;
        }
        this.addSubscription();
        return await ExponentFileSystem.downloadResumableStartAsync(this.url, this._fileUri, this.uuid, this.options, this.resumeData);
    }
    /**
     * Pause the current download operation. `resumeData` is added to the `DownloadResumable` object after a successful pause operation.
     * Returns an object that can be saved with `AsyncStorage` for future retrieval (the same object that is returned from calling `FileSystem.DownloadResumable.savable()`).
     * @return Returns a Promise that resolves to `DownloadPauseState` object.
     */
    async pauseAsync() {
        if (!ExponentFileSystem.downloadResumablePauseAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumablePauseAsync');
        }
        if (this.isTaskCancelled()) {
            return {
                fileUri: this._fileUri,
                options: this.options,
                url: this.url,
            };
        }
        const pauseResult = await ExponentFileSystem.downloadResumablePauseAsync(this.uuid);
        this.removeSubscription();
        if (pauseResult) {
            this.resumeData = pauseResult.resumeData;
            return this.savable();
        }
        else {
            throw new Error('Unable to generate a savable pause state');
        }
    }
    /**
     * Resume a paused download operation.
     * @return Returns a Promise that resolves to `FileSystemDownloadResult` object, or to `undefined` when task was cancelled.
     */
    async resumeAsync() {
        if (!ExponentFileSystem.downloadResumableStartAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
        }
        if (this.isTaskCancelled()) {
            return;
        }
        this.addSubscription();
        return await ExponentFileSystem.downloadResumableStartAsync(this.url, this.fileUri, this.uuid, this.options, this.resumeData);
    }
    /**
     * Method to get the object which can be saved with `AsyncStorage` for future retrieval.
     * @returns Returns object in shape of `DownloadPauseState` type.
     */
    savable() {
        return {
            url: this.url,
            fileUri: this.fileUri,
            options: this.options,
            resumeData: this.resumeData,
        };
    }
}
const baseReadAsStringAsync = readAsStringAsync;
const baseWriteAsStringAsync = writeAsStringAsync;
const baseDeleteAsync = deleteAsync;
const baseMoveAsync = moveAsync;
const baseCopyAsync = copyAsync;
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
export var StorageAccessFramework;
(function (StorageAccessFramework) {
    /**
     * Gets a [SAF URI](#saf-uri) pointing to a folder in the Android root directory. You can use this function to get URI for
     * `StorageAccessFramework.requestDirectoryPermissionsAsync()` when you trying to migrate an album. In that case, the name of the album is the folder name.
     * @param folderName The name of the folder which is located in the Android root directory.
     * @return Returns a [SAF URI](#saf-uri) to a folder.
     */
    function getUriForDirectoryInRoot(folderName) {
        return `content://com.android.externalstorage.documents/tree/primary:${folderName}/document/primary:${folderName}`;
    }
    StorageAccessFramework.getUriForDirectoryInRoot = getUriForDirectoryInRoot;
    /**
     * Allows users to select a specific directory, granting your app access to all of the files and sub-directories within that directory.
     * @param initialFileUrl The [SAF URI](#saf-uri) of the directory that the file picker should display when it first loads.
     * If URI is incorrect or points to a non-existing folder, it's ignored.
     * @platform android 11+
     * @return Returns a Promise that resolves to `FileSystemRequestDirectoryPermissionsResult` object.
     */
    async function requestDirectoryPermissionsAsync(initialFileUrl = null) {
        if (!ExponentFileSystem.requestDirectoryPermissionsAsync) {
            throw new UnavailabilityError('expo-file-system', 'StorageAccessFramework.requestDirectoryPermissionsAsync');
        }
        return await ExponentFileSystem.requestDirectoryPermissionsAsync(initialFileUrl);
    }
    StorageAccessFramework.requestDirectoryPermissionsAsync = requestDirectoryPermissionsAsync;
    /**
     * Enumerate the contents of a directory.
     * @param dirUri [SAF](#saf-uri) URI to the directory.
     * @return A Promise that resolves to an array of strings, each containing the full [SAF URI](#saf-uri) of a file or directory contained in the directory at `fileUri`.
     */
    async function readDirectoryAsync(dirUri) {
        if (!ExponentFileSystem.readSAFDirectoryAsync) {
            throw new UnavailabilityError('expo-file-system', 'StorageAccessFramework.readDirectoryAsync');
        }
        return await ExponentFileSystem.readSAFDirectoryAsync(dirUri);
    }
    StorageAccessFramework.readDirectoryAsync = readDirectoryAsync;
    /**
     * Creates a new empty directory.
     * @param parentUri The [SAF](#saf-uri) URI to the parent directory.
     * @param dirName The name of new directory.
     * @return A Promise that resolves to a [SAF URI](#saf-uri) to the created directory.
     */
    async function makeDirectoryAsync(parentUri, dirName) {
        if (!ExponentFileSystem.makeSAFDirectoryAsync) {
            throw new UnavailabilityError('expo-file-system', 'StorageAccessFramework.makeDirectoryAsync');
        }
        return await ExponentFileSystem.makeSAFDirectoryAsync(parentUri, dirName);
    }
    StorageAccessFramework.makeDirectoryAsync = makeDirectoryAsync;
    /**
     * Creates a new empty file.
     * @param parentUri The [SAF](#saf-uri) URI to the parent directory.
     * @param fileName The name of new file **without the extension**.
     * @param mimeType The MIME type of new file.
     * @return A Promise that resolves to a [SAF URI](#saf-uri) to the created file.
     */
    async function createFileAsync(parentUri, fileName, mimeType) {
        if (!ExponentFileSystem.createSAFFileAsync) {
            throw new UnavailabilityError('expo-file-system', 'StorageAccessFramework.createFileAsync');
        }
        return await ExponentFileSystem.createSAFFileAsync(parentUri, fileName, mimeType);
    }
    StorageAccessFramework.createFileAsync = createFileAsync;
    /**
     * Alias for [`writeAsStringAsync`](#filesystemwriteasstringasyncfileuri-contents-options) method.
     */
    StorageAccessFramework.writeAsStringAsync = baseWriteAsStringAsync;
    /**
     * Alias for [`readAsStringAsync`](#filesystemreadasstringasyncfileuri-options) method.
     */
    StorageAccessFramework.readAsStringAsync = baseReadAsStringAsync;
    /**
     * Alias for [`deleteAsync`](#filesystemdeleteasyncfileuri-options) method.
     */
    StorageAccessFramework.deleteAsync = baseDeleteAsync;
    /**
     * Alias for [`moveAsync`](#filesystemmoveasyncoptions) method.
     */
    StorageAccessFramework.moveAsync = baseMoveAsync;
    /**
     * Alias for [`copyAsync`](#filesystemcopyasyncoptions) method.
     */
    StorageAccessFramework.copyAsync = baseCopyAsync;
})(StorageAccessFramework || (StorageAccessFramework = {}));
//# sourceMappingURL=FileSystem.js.map