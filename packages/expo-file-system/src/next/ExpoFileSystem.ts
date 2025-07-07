import { isRunningInExpoGo } from 'expo';
import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File, DownloadOptions } from './ExpoFileSystem.types';
import ExpoGoFileSystemNextStub from './ExpoGoFileSystemNextStub';

export declare class TestSO {
  constructor(parts?: TestSO[]);
  readonly size: number;
}

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  TestSO: typeof TestSO;
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
