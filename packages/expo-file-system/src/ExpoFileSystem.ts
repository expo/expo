import { NativeModule, requireNativeModule, type SharedObject } from 'expo-modules-core';

import type {
  Directory,
  File,
  DownloadOptions,
  DownloadProgress,
  PathInfo,
  WatchEventType,
  WatchOptions,
  PickSingleFileOptions,
  PickMultipleFilesOptions,
  UploadProgress,
  UploadResult,
} from './ExpoFileSystem.types';

type FileSystemEvents = {
  downloadProgress: (data: { uuid: string; data: DownloadProgress }) => void;
};

type UploadTaskEvents = {
  progress: (data: UploadProgress) => void;
};

type DownloadTaskEvents = {
  progress: (data: DownloadProgress) => void;
};

declare class FileSystemUploadTask extends SharedObject<UploadTaskEvents> {
  /**
   * @hidden
   */
  start(url: string, file: File, options: Record<string, any>): Promise<UploadResult>;
  /**
   * @hidden
   */
  cancel(): void;
}

declare class FileSystemDownloadTask extends SharedObject<DownloadTaskEvents> {
  /**
   * @hidden
   */
  start(url: string, to: File | Directory, options?: Record<string, any>): Promise<string | null>;
  /**
   * @hidden
   */
  pause(): any;
  /**
   * @hidden
   */
  resume(
    url: string,
    to: File | Directory,
    resumeData: string,
    options?: Record<string, any>
  ): Promise<string | null>;
  /**
   * @hidden
   */
  cancel(): void;
}

type FileSystemWatcherEvent = {
  type: WatchEventType;
  path: string;
  isDirectory: boolean;
  nativeEventFlags?: number;
  newPath?: string;
  newPathIsDirectory?: boolean;
};

type FileSystemWatcherEvents = {
  change: (event: FileSystemWatcherEvent) => void;
};

declare class NativeFileSystemWatcher extends SharedObject<FileSystemWatcherEvents> {
  constructor(path: string, options?: WatchOptions);
  start(): void;
  stop(): void;
}

declare class ExpoFileSystemModule extends NativeModule<FileSystemEvents> {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  FileSystemUploadTask: typeof FileSystemUploadTask;
  FileSystemDownloadTask: typeof FileSystemDownloadTask;
  FileSystemWatcher: typeof NativeFileSystemWatcher;
  downloadFileAsync(
    url: string,
    destination: File | Directory,
    options?: DownloadOptions,
    uuid?: string
  ): Promise<string>;
  cancelDownloadAsync(uuid: string): void;
  pickDirectoryAsync(initialUri?: string): Promise<Directory>;
  pickFileAsync(options: PickSingleFileOptions): Promise<File>;
  pickFileAsync(options: PickMultipleFilesOptions): Promise<File[]>;
  info(uri: string): PathInfo;
  totalDiskSpace: number;
  availableDiskSpace: number;
  documentDirectory: string;
  cacheDirectory: string;
  bundleDirectory: string;
  appleSharedContainers?: Record<string, string>;
}

export default requireNativeModule<ExpoFileSystemModule>('FileSystem');
