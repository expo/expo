import { ReferenceBase } from 'expo-firebase-app';
import StorageTask, { DOWNLOAD_TASK, UPLOAD_TASK } from './task';
/**
 * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference
 */
export default class StorageReference extends ReferenceBase {
    constructor(storage, path) {
        super(path);
        this._storage = storage;
    }
    get fullPath() {
        return this.path;
    }
    toString() {
        return `gs://${this._storage.app.options.storageBucket}${this.path}`;
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#child
     * @param path
     * @returns {StorageReference}
     */
    child(path) {
        return new StorageReference(this._storage, `${this.path}/${path}`);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#delete
     * @returns {Promise.<T>|*}
     */
    delete() {
        return this._storage.nativeModule.delete(this.path);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getDownloadURL
     * @returns {Promise.<T>|*}
     */
    getDownloadURL() {
        return this._storage.nativeModule.getDownloadURL(this.path);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getMetadata
     * @returns {Promise.<T>|*}
     */
    getMetadata() {
        return this._storage.nativeModule.getMetadata(this.path);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#updateMetadata
     * @param metadata
     * @returns {Promise.<T>|*}
     */
    updateMetadata(metadata = {}) {
        return this._storage.nativeModule.updateMetadata(this.path, metadata);
    }
    /**
     * Downloads a reference to the device
     * @param {String} filePath Where to store the file
     * @return {Promise}
     */
    downloadFile(filePath) {
        const task = new StorageTask(DOWNLOAD_TASK, this._storage.nativeModule.downloadFile(this.path, filePath), this);
        return task;
    }
    /**
     * Alias to putFile
     * @returns {StorageReference.putFile}
     */
    get put() {
        return this.putFile;
    }
    /**
     * Upload a file path
     * @param  {string} filePath The local path of the file
     * @param  {object} metadata An object containing metadata
     * @return {Promise}
     */
    putFile(filePath, metadata = {}) {
        let _filePath = filePath.replace('file://', '');
        if (_filePath.includes('%')) {
            _filePath = decodeURI(_filePath);
        }
        const task = new StorageTask(UPLOAD_TASK, this._storage.nativeModule.putFile(this.path, _filePath, metadata), this);
        return task;
    }
}
//# sourceMappingURL=reference.js.map