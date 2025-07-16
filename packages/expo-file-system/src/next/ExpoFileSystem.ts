import { isRunningInExpoGo } from 'expo';
import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File, DownloadOptions } from './ExpoFileSystem.types';
import ExpoGoFileSystemNextStub from './ExpoGoFileSystemNextStub';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  downloadFileAsync(
    url: string,
    destination: File | Directory,
    options?: DownloadOptions
  ): Promise<string>;
  totalDiskSpace: number;
  availableDiskSpace: number;
}

export default isRunningInExpoGo()
  ? (ExpoGoFileSystemNextStub as any as ExpoFileSystemNextModule)
  : requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
