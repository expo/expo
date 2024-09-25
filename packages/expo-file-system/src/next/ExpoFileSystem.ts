import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File } from './ExpoFileSystem.types';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  downloadFileAsync(url: string, destination: File | Directory): Promise<string>;
}

export default requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
