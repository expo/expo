import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory } from './Directory';
import type { File } from './File';
import type { PickMultipleFilesOptions, PickSingleFileOptions } from './File.types';
import type { DownloadOptions, DownloadProgress } from './NetworkTasks.types';
import type { PathInfo } from './Paths.types';
import type {
  FileSystemDownloadTask,
  FileSystemUploadTask,
  NativeFileSystemDirectory,
  NativeFileSystemFile,
  NativeFileSystemWatcher,
} from './internal/NativeFileSystem.types';

type FileSystemEvents = {
  downloadProgress: (data: { uuid: string; data: DownloadProgress }) => void;
};

declare class ExpoFileSystemModule extends NativeModule<FileSystemEvents> {
  FileSystemDirectory: typeof NativeFileSystemDirectory;
  FileSystemFile: typeof NativeFileSystemFile;
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
