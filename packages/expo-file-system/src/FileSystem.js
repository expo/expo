// @flow

import { EventEmitter } from 'expo-core';
import UUID from 'uuid-js';
import FS from './ExponentFileSystem';

const normalizeEndingSlash = p => {
  if (p != null) {
    return p.replace(/\/*$/, '') + '/';
  }
  return null;
};

FS.documentDirectory = normalizeEndingSlash(FS.documentDirectory);
FS.cacheDirectory = normalizeEndingSlash(FS.cacheDirectory);

export const documentDirectory = FS.documentDirectory;
export const cacheDirectory = FS.cacheDirectory;
export const bundledAssets = FS.bundledAssets;
export const bundleDirectory = FS.bundleDirectory;
export const EncodingTypes = {
  UTF8: 'utf8',
  Base64: 'base64',
};

type FileInfo =
  | {
      exists: true,
      uri: string,
      size: number,
      modificationTime: number,
      md5?: string,
    }
  | {
      exists: false,
      isDirectory: false,
    };

export type EncodingType = typeof EncodingTypes.UTF8 | typeof EncodingTypes.Base64;

export type ReadingOptions = {
  encoding?: EncodingType,
  position?: number,
  length?: number,
};
export type WritingOptions = {
  encoding?: EncodingType,
};

export function getInfoAsync(fileUri: string, options: { md5?: boolean } = {}): Promise<FileInfo> {
  return FS.getInfoAsync(fileUri, options);
}

export function readAsStringAsync(fileUri: string, options?: ReadingOptions): Promise<string> {
  return FS.readAsStringAsync(fileUri, options || {});
}

export function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: WritingOptions
): Promise<void> {
  return FS.writeAsStringAsync(fileUri, contents, options || {});
}

export function deleteAsync(
  fileUri: string,
  options: { idempotent?: boolean } = {}
): Promise<void> {
  return FS.deleteAsync(fileUri, options);
}

export function moveAsync(options: { from: string, to: string }): Promise<void> {
  return FS.moveAsync(options);
}

export function copyAsync(options: { from: string, to: string }): Promise<void> {
  return FS.copyAsync(options);
}

export function makeDirectoryAsync(
  fileUri: string,
  options: { intermediates?: boolean } = {}
): Promise<void> {
  return FS.makeDirectoryAsync(fileUri, options);
}

export function readDirectoryAsync(fileUri: string): Array<string> {
  return FS.readDirectoryAsync(fileUri, {});
}

type DownloadOptions = {
  md5?: boolean,
  headers?: { [string]: string },
};
type DownloadResult = {
  uri: string,
  status: number,
  headers: { [string]: string },
  md5?: string,
};

export function downloadAsync(
  uri: string,
  fileUri: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  return FS.downloadAsync(uri, fileUri, options);
}

export function createDownloadResumable(
  uri: string,
  fileUri: string,
  options?: DownloadOptions,
  callback?: DownloadProgressCallback,
  resumeData?: string
) {
  return new DownloadResumable(uri, fileUri, options, callback, resumeData);
}

type DownloadProgressCallback = (data: DownloadProgressData) => void;
type DownloadProgressData = {
  totalBytesWritten: number,
  totalBytesExpectedToWrite: number,
};
type DownloadPauseState = {
  url: string,
  fileUri: string,
  options: DownloadOptions,
  resumeData: ?string,
};

export class DownloadResumable {
  _uuid: string;
  _url: string;
  _fileUri: string;
  _options: DownloadOptions;
  _resumeData: ?string;
  _callback: ?DownloadProgressCallback;
  _subscription: ?Function;
  _emitter: EventEmitter;

  constructor(
    url: string,
    fileUri: string,
    options: DownloadOptions = {},
    callback: ?DownloadProgressCallback,
    resumeData: ?string
  ) {
    this._uuid = UUID.create(4).toString();
    this._url = url;
    this._fileUri = fileUri;
    this._options = options;
    this._resumeData = resumeData;
    this._callback = callback;
    this._subscription = null;
    this._emitter = new EventEmitter(FS);
  }

  async downloadAsync(): Promise<?DownloadResult> {
    this._addSubscription();
    return await FS.downloadResumableStartAsync(
      this._url,
      this._fileUri,
      this._uuid,
      this._options,
      this._resumeData
    );
  }

  async pauseAsync(): Promise<DownloadPauseState> {
    const pauseResult = await FS.downloadResumablePauseAsync(this._uuid);
    this._removeSubscription();
    if (pauseResult) {
      this._resumeData = pauseResult.resumeData;
      return this.savable();
    } else {
      throw new Error('Unable to generate a savable pause state');
    }
  }

  async resumeAsync(): Promise<?DownloadResult> {
    this._addSubscription();
    return await FS.downloadResumableStartAsync(
      this._url,
      this._fileUri,
      this._uuid,
      this._options,
      this._resumeData
    );
  }

  savable(): DownloadPauseState {
    return {
      url: this._url,
      fileUri: this._fileUri,
      options: this._options,
      resumeData: this._resumeData,
    };
  }

  _addSubscription(): void {
    if (this._subscription) {
      return;
    }
    this._subscription = this._emitter.addListener(
      'Exponent.downloadProgress',
      ({ uuid, data }) => {
        if (uuid === this._uuid) {
          const callback = this._callback;
          if (callback) {
            callback(data);
          }
        }
      }
    );
  }

  _removeSubscription(): void {
    if (!this._subscription) {
      return;
    }
    this._emitter.removeSubscription(this._subscription);
    this._subscription = null;
  }
}
