import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Directory, File } from './FileSystem.types';

declare class ExpoFileSystemNextModule extends NativeModule {
  FileSystemNextDirectory: typeof Directory;
  FileSystemNextFile: typeof File;
}

export default requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
