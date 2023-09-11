import { requireOptionalNativeModule } from 'expo-modules-core';

import ExponentFileSystemShim from './ExponentFileSystemShim';
import { ExponentFileSystemModule } from './types';

export default requireOptionalNativeModule<ExponentFileSystemModule>('ExponentFileSystem') ??
  ExponentFileSystemShim;
