import { requireNativeModule } from 'expo-modules-core';

import ExponentFileSystemShim from './ExponentFileSystemShim';
import { ExponentFileSystemModule } from './types';

let platformModule;

try {
  platformModule = requireNativeModule('ExponentFileSystem');
} catch {
  platformModule = ExponentFileSystemShim;
}

export default platformModule as ExponentFileSystemModule;
