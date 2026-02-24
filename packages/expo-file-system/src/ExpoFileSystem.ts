import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type {
  Directory,
  ExpoFile,
  DownloadOptions,
  PathInfo,
  PickSingleFileOptions,
  PickMultipleFilesOptions,
} from './ExpoFileSystem.types';

declare class ExpoFileSystemModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof ExpoFile;
  downloadFileAsync(
    url: string,
    destination: ExpoFile | Directory,
    options?: DownloadOptions
  ): Promise<string>;
  pickDirectoryAsync(initialUri?: string): Promise<Directory>;
  pickFileAsync(options: PickSingleFileOptions): Promise<ExpoFile>;
  pickFileAsync(options: PickMultipleFilesOptions): Promise<ExpoFile[]>;
  info(uri: string): PathInfo;
  totalDiskSpace: number;
  availableDiskSpace: number;
  documentDirectory: string;
  cacheDirectory: string;
  bundleDirectory: string;
  appleSharedContainers?: Record<string, string>;
}

export default requireNativeModule<ExpoFileSystemModule>('FileSystem');
