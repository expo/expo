import { isRunningInExpoGo } from 'expo';
import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File } from './ExpoFileSystem.types';
import ExpoGoFileSystemNextStub from './ExpoGoFileSystemNextStub';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  downloadFileAsync(url: string, destination: File | Directory): Promise<string>;
}

export default isRunningInExpoGo()
  ? (ExpoGoFileSystemNextStub as any as ExpoFileSystemNextModule)
  : requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
