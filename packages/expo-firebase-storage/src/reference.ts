/**
 * @flow
 * StorageReference representation wrapper
 */
import { ReferenceBase } from 'expo-firebase-app';

import type { Storage } from './index.types';

import StorageTask, { DOWNLOAD_TASK, UPLOAD_TASK } from './task';

/**
 * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference
 */
export default class StorageReference extends ReferenceBase {
  _storage: Storage;

  constructor(storage: Storage, path: string) {
    super(path);
    this._storage = storage;
  }

  get fullPath(): string {
    return this.path;
  }

  toString(): string {
    return `gs://${this._storage.app.options.storageBucket}${this.path}`;
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#child
   * @param path
   * @returns {StorageReference}
   */
  child(path: string): StorageReference {
    return new StorageReference(this._storage, `${this.path}/${path}`);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#delete
   * @returns {Promise.<T>|*}
   */
  delete(): Promise<void> {
    return this._storage.nativeModule.delete(this.path);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getDownloadURL
   * @returns {Promise.<T>|*}
   */
  getDownloadURL(): Promise<string> {
    return this._storage.nativeModule.getDownloadURL(this.path);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getMetadata
   * @returns {Promise.<T>|*}
   */
  getMetadata(): Promise<Object> {
    return this._storage.nativeModule.getMetadata(this.path);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#updateMetadata
   * @param metadata
   * @returns {Promise.<T>|*}
   */
  updateMetadata(metadata: Object = {}): Promise<Object> {
    return this._storage.nativeModule.updateMetadata(this.path, metadata);
  }

  /**
   * Downloads a reference to the device
   * @param {String} filePath Where to store the file
   * @return {Promise}
   */
  downloadFile(filePath: string): Promise<Object> {
    return new StorageTask(
      DOWNLOAD_TASK,
      this._storage.nativeModule.downloadFile(this.path, filePath),
      this
    );
  }

  /**
   * Alias to putFile
   * @returns {StorageReference.putFile}
   */
  get put(): (Object, Object) => Promise<Object> {
    return this.putFile;
  }

  /**
   * Upload a file path
   * @param  {string} filePath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  putFile(filePath: Object, metadata: Object = {}): Promise<Object> {
    let _filePath = filePath.replace('file://', '');
    if (_filePath.includes('%')) _filePath = decodeURI(_filePath);
    return new StorageTask(
      UPLOAD_TASK,
      this._storage.nativeModule.putFile(this.path, _filePath, metadata),
      this
    );
  }
}
