import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type {
  Directory,
  File,
  ZipArchive,
  DownloadOptions,
  DownloadProgress,
  PickSingleFileOptions,
  PickMultipleFilesOptions,
  PathInfo,
  ZipOptions,
  UnzipOptions,
} from './ExpoFileSystem.types';

type FileSystemEvents = {
  downloadProgress: (data: { uuid: string; data: DownloadProgress }) => void;
};

declare class ExpoFileSystemModule extends NativeModule<FileSystemEvents> {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
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
  zip(
    sources: (File | Directory)[],
    destination: File | Directory,
    options?: ZipOptions
  ): Promise<File>;
  zipSync(sources: (File | Directory)[], destination: File | Directory, options?: ZipOptions): File;
  unzip(source: File, destination: Directory, options?: UnzipOptions): Promise<Directory>;
  unzipSync(source: File, destination: Directory, options?: UnzipOptions): Directory;
  ZipArchive: typeof ZipArchive;
  totalDiskSpace: number;
  availableDiskSpace: number;
  documentDirectory: string;
  cacheDirectory: string;
  bundleDirectory: string;
  appleSharedContainers?: Record<string, string>;
}

export default requireNativeModule<ExpoFileSystemModule>('FileSystem');
