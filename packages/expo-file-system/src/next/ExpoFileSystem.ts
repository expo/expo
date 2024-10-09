import { NativeModule, requireNativeModule, requireOptionalNativeModule } from 'expo-modules-core';

import type { Directory, File } from './ExpoFileSystem.types';
import ExpoGoFileSystemNextStub from './ExpoGoFileSystemNextStub';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  downloadFileAsync(url: string, destination: File | Directory): Promise<string>;
}

const isExpoGo = requireOptionalNativeModule('ExponentConstants')?.appOwnership === 'expo';
export default isExpoGo
  ? (ExpoGoFileSystemNextStub as any as ExpoFileSystemNextModule)
  : requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
