import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File } from './FileSystem.types';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemDirectory: typeof Directory;
  FileSystemFile: typeof File;
  download(url: string, to: Directory | File): Promise<string>;
}

export default requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
