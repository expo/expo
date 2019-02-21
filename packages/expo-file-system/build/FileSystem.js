import { UnavailabilityError } from 'expo-errors';
import { EventEmitter } from 'expo-core';
import UUID from 'uuid-js';
import FS from './ExponentFileSystem';
import { EncodingType, } from './FileSystem.types';
if (!FS) {
    console.warn("No native ExponentFileSystem module found, are you sure the expo-file-system's module is linked properly?");
}
export { EncodingType, };
function normalizeEndingSlash(p) {
    if (p != null) {
        return p.replace(/\/*$/, '') + '/';
    }
    return null;
}
FS.documentDirectory = normalizeEndingSlash(FS.documentDirectory);
FS.cacheDirectory = normalizeEndingSlash(FS.cacheDirectory);
export const { documentDirectory, cacheDirectory, bundledAssets, bundleDirectory } = FS;
export async function getInfoAsync(fileUri, options = {}) {
    if (!FS.getInfoAsync) {
        throw new UnavailabilityError('expo-file-system', 'getInfoAsync');
    }
    return await FS.getInfoAsync(fileUri, options);
}
export async function readAsStringAsync(fileUri, options) {
    if (!FS.readAsStringAsync) {
        throw new UnavailabilityError('expo-file-system', 'readAsStringAsync');
    }
    return await FS.readAsStringAsync(fileUri, options || {});
}
export async function writeAsStringAsync(fileUri, contents, options = {}) {
    if (!FS.writeAsStringAsync) {
        throw new UnavailabilityError('expo-file-system', 'writeAsStringAsync');
    }
    return await FS.writeAsStringAsync(fileUri, contents, options);
}
export async function deleteAsync(fileUri, options = {}) {
    if (!FS.deleteAsync) {
        throw new UnavailabilityError('expo-file-system', 'deleteAsync');
    }
    return await FS.deleteAsync(fileUri, options);
}
export async function moveAsync(options) {
    if (!FS.moveAsync) {
        throw new UnavailabilityError('expo-file-system', 'moveAsync');
    }
    return await FS.moveAsync(options);
}
export async function copyAsync(options) {
    if (!FS.copyAsync) {
        throw new UnavailabilityError('expo-file-system', 'copyAsync');
    }
    return await FS.copyAsync(options);
}
export async function makeDirectoryAsync(fileUri, options = {}) {
    if (!FS.makeDirectoryAsync) {
        throw new UnavailabilityError('expo-file-system', 'makeDirectoryAsync');
    }
    return await FS.makeDirectoryAsync(fileUri, options);
}
export async function readDirectoryAsync(fileUri) {
    if (!FS.readDirectoryAsync) {
        throw new UnavailabilityError('expo-file-system', 'readDirectoryAsync');
    }
    return await FS.readDirectoryAsync(fileUri, {});
}
export async function downloadAsync(uri, fileUri, options = {}) {
    if (!FS.downloadAsync) {
        throw new UnavailabilityError('expo-file-system', 'downloadAsync');
    }
    return await FS.downloadAsync(uri, fileUri, options);
}
export function createDownloadResumable(uri, fileUri, options, callback, resumeData) {
    return new DownloadResumable(uri, fileUri, options, callback, resumeData);
}
export class DownloadResumable {
    constructor(url, fileUri, options = {}, callback, resumeData) {
        this._uuid = UUID.create(4).toString();
        this._url = url;
        this._fileUri = fileUri;
        this._options = options;
        this._resumeData = resumeData;
        this._callback = callback;
        this._subscription = null;
        this._emitter = new EventEmitter(FS);
    }
    async downloadAsync() {
        if (!FS.downloadResumableStartAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
        }
        this._addSubscription();
        return await FS.downloadResumableStartAsync(this._url, this._fileUri, this._uuid, this._options, this._resumeData);
    }
    async pauseAsync() {
        if (!FS.downloadResumablePauseAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumablePauseAsync');
        }
        const pauseResult = await FS.downloadResumablePauseAsync(this._uuid);
        this._removeSubscription();
        if (pauseResult) {
            this._resumeData = pauseResult.resumeData;
            return this.savable();
        }
        else {
            throw new Error('Unable to generate a savable pause state');
        }
    }
    async resumeAsync() {
        if (!FS.downloadResumableStartAsync) {
            throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
        }
        this._addSubscription();
        return await FS.downloadResumableStartAsync(this._url, this._fileUri, this._uuid, this._options, this._resumeData);
    }
    savable() {
        return {
            url: this._url,
            fileUri: this._fileUri,
            options: this._options,
            resumeData: this._resumeData,
        };
    }
    _addSubscription() {
        if (this._subscription) {
            return;
        }
        this._subscription = this._emitter.addListener('Exponent.downloadProgress', (event) => {
            if (event.uuid === this._uuid) {
                const callback = this._callback;
                if (callback) {
                    callback(event.data);
                }
            }
        });
    }
    _removeSubscription() {
        if (!this._subscription) {
            return;
        }
        this._emitter.removeSubscription(this._subscription);
        this._subscription = null;
    }
}
//# sourceMappingURL=FileSystem.js.map