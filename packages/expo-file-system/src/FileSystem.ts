import { EventEmitter, Subscription, UnavailabilityError } from '@unimodules/core';
import { Platform } from 'react-native';
import uuidv4 from 'uuid/v4';

import ExponentFileSystem from './ExponentFileSystem';
import {
  DownloadOptions,
  DownloadPauseState,
  DownloadProgressCallback,
  DownloadProgressData,
  DownloadResult,
  EncodingType,
  FileInfo,
  FileSystemDownloadResult,
  FileSystemAcceptedHttpMethod,
  FileSystemSessionType,
  FileSystemUploadOptions,
  FileSystemUploadResult,
  ProgressEvent,
  ReadingOptions,
  WritingOptions,
} from './FileSystem.types';

if (!ExponentFileSystem) {
  console.warn(
    "No native ExponentFileSystem module found, are you sure the expo-file-system's module is linked properly?"
  );
}
// Prevent webpack from pruning this.
const _unused = new EventEmitter(ExponentFileSystem); // eslint-disable-line

export {
  DownloadOptions,
  DownloadPauseState,
  DownloadProgressCallback,
  DownloadProgressData,
  DownloadResult,
  EncodingType,
  FileInfo,
  FileSystemDownloadResult,
  FileSystemAcceptedHttpMethod,
  FileSystemSessionType,
  FileSystemUploadOptions,
  FileSystemUploadResult,
  ProgressEvent,
  ReadingOptions,
  WritingOptions,
};

function normalizeEndingSlash(p: string | null): string | null {
  if (p != null) {
    return p.replace(/\/*$/, '') + '/';
  }
  return null;
}

export const documentDirectory = normalizeEndingSlash(ExponentFileSystem.documentDirectory);
export const cacheDirectory = normalizeEndingSlash(ExponentFileSystem.cacheDirectory);

export const { bundledAssets, bundleDirectory } = ExponentFileSystem;

export async function getInfoAsync(
  fileUri: string,
  options: { md5?: boolean; size?: boolean } = {}
): Promise<FileInfo> {
  if (!ExponentFileSystem.getInfoAsync) {
    throw new UnavailabilityError('expo-file-system', 'getInfoAsync');
  }
  return await ExponentFileSystem.getInfoAsync(fileUri, options);
}

export async function readAsStringAsync(
  fileUri: string,
  options?: ReadingOptions
): Promise<string> {
  if (!ExponentFileSystem.readAsStringAsync) {
    throw new UnavailabilityError('expo-file-system', 'readAsStringAsync');
  }
  return await ExponentFileSystem.readAsStringAsync(fileUri, options || {});
}

export async function getContentUriAsync(fileUri: string): Promise<string> {
  if (Platform.OS === 'android') {
    if (!ExponentFileSystem.getContentUriAsync) {
      throw new UnavailabilityError('expo-file-system', 'getContentUriAsync');
    }
    return await ExponentFileSystem.getContentUriAsync(fileUri);
  } else {
    return new Promise(function(resolve, reject) {
      resolve(fileUri);
    });
  }
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options: WritingOptions = {}
): Promise<void> {
  if (!ExponentFileSystem.writeAsStringAsync) {
    throw new UnavailabilityError('expo-file-system', 'writeAsStringAsync');
  }
  return await ExponentFileSystem.writeAsStringAsync(fileUri, contents, options);
}

export async function deleteAsync(
  fileUri: string,
  options: { idempotent?: boolean } = {}
): Promise<void> {
  if (!ExponentFileSystem.deleteAsync) {
    throw new UnavailabilityError('expo-file-system', 'deleteAsync');
  }
  return await ExponentFileSystem.deleteAsync(fileUri, options);
}

export async function deleteLegacyDocumentDirectoryAndroid(): Promise<void> {
  if (Platform.OS !== 'android' || documentDirectory == null) {
    return;
  }
  const legacyDocumentDirectory = `${documentDirectory}ExperienceData/`;
  return await deleteAsync(legacyDocumentDirectory, { idempotent: true });
}

export async function moveAsync(options: { from: string; to: string }): Promise<void> {
  if (!ExponentFileSystem.moveAsync) {
    throw new UnavailabilityError('expo-file-system', 'moveAsync');
  }
  return await ExponentFileSystem.moveAsync(options);
}

export async function copyAsync(options: { from: string; to: string }): Promise<void> {
  if (!ExponentFileSystem.copyAsync) {
    throw new UnavailabilityError('expo-file-system', 'copyAsync');
  }
  return await ExponentFileSystem.copyAsync(options);
}

export async function makeDirectoryAsync(
  fileUri: string,
  options: { intermediates?: boolean } = {}
): Promise<void> {
  if (!ExponentFileSystem.makeDirectoryAsync) {
    throw new UnavailabilityError('expo-file-system', 'makeDirectoryAsync');
  }
  return await ExponentFileSystem.makeDirectoryAsync(fileUri, options);
}

export async function readDirectoryAsync(fileUri: string): Promise<string[]> {
  if (!ExponentFileSystem.readDirectoryAsync) {
    throw new UnavailabilityError('expo-file-system', 'readDirectoryAsync');
  }
  return await ExponentFileSystem.readDirectoryAsync(fileUri, {});
}

export async function getFreeDiskStorageAsync(): Promise<number> {
  if (!ExponentFileSystem.getFreeDiskStorageAsync) {
    throw new UnavailabilityError('expo-file-system', 'getFreeDiskStorageAsync');
  }
  return await ExponentFileSystem.getFreeDiskStorageAsync();
}

export async function getTotalDiskCapacityAsync(): Promise<number> {
  if (!ExponentFileSystem.getTotalDiskCapacityAsync) {
    throw new UnavailabilityError('expo-file-system', 'getTotalDiskCapacityAsync');
  }
  return await ExponentFileSystem.getTotalDiskCapacityAsync();
}

export async function downloadAsync(
  uri: string,
  fileUri: string,
  options: DownloadOptions = {}
): Promise<FileSystemDownloadResult> {
  if (!ExponentFileSystem.downloadAsync) {
    throw new UnavailabilityError('expo-file-system', 'downloadAsync');
  }

  return await ExponentFileSystem.downloadAsync(uri, fileUri, {
    sessionType: FileSystemSessionType.BACKGROUND,
    ...options,
  });
}

export async function uploadAsync(
  url: string,
  fileUri: string,
  options: FileSystemUploadOptions = {}
): Promise<FileSystemUploadResult> {
  if (!ExponentFileSystem.uploadAsync) {
    throw new UnavailabilityError('expo-file-system', 'uploadAsync');
  }

  return await ExponentFileSystem.uploadAsync(url, fileUri, {
    sessionType: FileSystemSessionType.BACKGROUND,
    ...options,
    httpMethod: (options.httpMethod || 'POST').toUpperCase(),
  });
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
    this._uuid = uuidv4();
    this._url = url;
    this._fileUri = fileUri;
    this._options = options;
    this._resumeData = resumeData;
    this._callback = callback;
    this._subscription = null;
    this._emitter = new EventEmitter(ExponentFileSystem);
  }

  async downloadAsync(): Promise<FileSystemDownloadResult | undefined> {
    if (!ExponentFileSystem.downloadResumableStartAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
    }
    this._addSubscription();
    return await ExponentFileSystem.downloadResumableStartAsync(
      this._url,
      this._fileUri,
      this._uuid,
      this._options,
      this._resumeData
    );
  }

  async pauseAsync(): Promise<DownloadPauseState> {
    if (!ExponentFileSystem.downloadResumablePauseAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumablePauseAsync');
    }
    const pauseResult = await ExponentFileSystem.downloadResumablePauseAsync(this._uuid);
    this._removeSubscription();
    if (pauseResult) {
      this._resumeData = pauseResult.resumeData;
      return this.savable();
    } else {
      throw new Error('Unable to generate a savable pause state');
    }
  }

  async resumeAsync(): Promise<FileSystemDownloadResult | undefined> {
    if (!ExponentFileSystem.downloadResumableStartAsync) {
      throw new UnavailabilityError('expo-file-system', 'downloadResumableStartAsync');
    }
    this._addSubscription();
    return await ExponentFileSystem.downloadResumableStartAsync(
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
      'expo-file-system.downloadProgress',
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
