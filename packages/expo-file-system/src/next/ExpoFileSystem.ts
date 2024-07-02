import { requireNativeModule } from 'expo-modules-core';

import type { Directory, File } from './FileSystem.types';

type ExpoFileSystemNextModule = {
  FileSystemNextDirectory: typeof Directory;
  FileSystemNextFile: typeof File;
};

export default requireNativeModule<ExpoFileSystemNextModule>('FileSystemNext');
