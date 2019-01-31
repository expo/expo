import { UnavailabilityError } from 'expo-errors';
import { EventEmitter, Subscription } from 'expo-core';
import UUID from 'uuid-js';
import FS from './ExponentFileSystem';

import {
  DownloadOptions,
  DownloadResult,
  DownloadProgressCallback,
  DownloadProgressData,
  DownloadPauseState,
  FileInfo,
  EncodingType,
  ReadingOptions,
  WritingOptions,
  ProgressEvent,
} from './FileSystem.types';

if (!FS) {
  console.warn(
    "No native ExponentFileSystem module found, are you sure the expo-file-system's module is linked properly?"
  );
}

export {
  DownloadOptions,
  DownloadResult,
  DownloadProgressCallback,
  DownloadProgressData,
  DownloadPauseState,
  FileInfo,
  EncodingType,
  ReadingOptions,
  WritingOptions,
  ProgressEvent,
};

function normalizeEndingSlash(p: string | null): string | null {
  if (p != null) {
    return p.replace(/\/*$/, '') + '/';
  }
  return null;
}

FS.documentDirectory = normalizeEndingSlash(FS.documentDirectory);
FS.cacheDirectory = normalizeEndingSlash(FS.cacheDirectory);

export const { documentDirectory, cacheDirectory, bundledAssets, bundleDirectory } = FS;

export async function getInfoAsync(
  fileUri: string,
  options: { md5?: boolean; cache?: boolean } = {}
): Promise<FileInfo> {
  if (!FS.getInfoAsync) {
    throw new UnavailabilityError('expo-file-system', 'getInfoAsync');
  }
  return await FS.getInfoAsync(fileUri, options);
}

export async function readAsStringAsync(
  fileUri: string,
  options?: ReadingOptions
): Promise<string> {
  if (!FS.readAsStringAsync) {
    throw new UnavailabilityError('expo-file-system', 'readAsStringAsync');
  }
  return await FS.readAsStringAsync(fileUri, options || {});
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options: WritingOptions = {}
): Promise<void> {
  if (!FS.writeAsStringAsync) {
    throw new UnavailabilityError('expo-file-system', 'writeAsStringAsync');
  }
  return await FS.writeAsStringAsync(fileUri, contents, options);
}

export async function deleteAsync(
  fileUri: string,
  options: { idempotent?: boolean } = {}
): Promise<void> {
  if (!FS.deleteAsync) {
    throw new UnavailabilityError('expo-file-system', 'deleteAsync');
  }
  return await FS.deleteAsync(fileUri, options);
}

export async function moveAsync(options: { from: string; to: string }): Promise<void> {
  if (!FS.moveAsync) {
    throw new UnavailabilityError('expo-file-system', 'moveAsync');
  }
  return await FS.moveAsync(options);
}

export async function copyAsync(options: { from: string; to: string }): Promise<void> {
  if (!FS.copyAsync) {
    throw new UnavailabilityError('expo-file-system', 'copyAsync');
  }
  return await FS.copyAsync(options);
}

export async function makeDirectoryAsync(
  fileUri: string,
  options: { intermediates?: boolean } = {}
): Promise<void> {
  if (!FS.makeDirectoryAsync) {
    throw new UnavailabilityError('expo-file-system', 'makeDirectoryAsync');
  }
  return await FS.makeDirectoryAsync(fileUri, options);
}

export async function readDirectoryAsync(fileUri: string): Promise<string[]> {
  if (!FS.readDirectoryAsync) {
    throw new UnavailabilityError('expo-file-system', 'readDirectoryAsync');
  }
  return await FS.readDirectoryAsync(fileUri, {});
}

export async function downloadAsync(
  uri: string,
  fileUri: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  if (!FS.downloadAsync) {
    throw new UnavailabilityError('expo-file-system', 'downloadAsync');
  }
  return await FS.downloadAsync(uri, fileUri, options);
}

export function createDownloadResumable(
  uri: string,
  fileUri: string,
  options?: DownloadOptions,
  callback?: DownloadProgressCallback,
  resumeData?: string
): DownloadResumable {
  return new DownloadResumable(uri, fileUri, options, callback, resumeData);
}

export class DownloadResumable {
  _uuid: string;
  _url: string;
  _fileUri: string;
  _options: DownloadOptions;
  _resumeData?: string;
  _callback?: DownloadProgressCallback;
  _subscription?: Subscription | null;
  _emitter: EventEmitter;

  constructor(
    url: string,
    fileUri: string,
    options: DownloadOptions = {},
    callback?: DownloadProgressCallback,
    resumeData?: string
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

  async downloadAsync(): Promise<DownloadResult | undefined> {
    if (!FS.downloadResumableStartAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
    }
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
    if (!FS.downloadResumablePauseAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumablePauseAsync');
    }
    const pauseResult = await FS.downloadResumablePauseAsync(this._uuid);
    this._removeSubscription();
    if (pauseResult) {
      this._resumeData = pauseResult.resumeData;
      return this.savable();
    } else {
      throw new Error('Unable to generate a savable pause state');
    }
  }

  async resumeAsync(): Promise<DownloadResult | undefined> {
    if (!FS.downloadResumableStartAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
    }
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
      (event: ProgressEvent) => {
        if (event.uuid === this._uuid) {
          const callback = this._callback;
          if (callback) {
            callback(event.data);
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
