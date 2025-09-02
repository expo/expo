import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File, DownloadOptions } from './ExpoFileSystem.types';

declare class ExpoFileSystemModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  downloadFileAsync(
    url: string,
    destination: File | Directory,
    options?: DownloadOptions
  ): Promise<string>;
  pickDirectoryAsync(initialUri?: string): Promise<Directory>;
  pickFileAsync(initialUri?: string, mimeType?: string): Promise<File>;
  totalDiskSpace: number;
  availableDiskSpace: number;
  documentDirectory: string;
  cacheDirectory: string;
  bundleDirectory: string;
}

export default requireNativeModule<ExpoFileSystemModule>('FileSystem');
