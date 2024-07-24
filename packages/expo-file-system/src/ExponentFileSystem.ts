import { requireOptionalNativeModule } from 'expo-modules-core';

import ExponentFileSystemShim from './ExponentFileSystemShim';

export default requireOptionalNativeModule('ExponentFileSystem') ?? ExponentFileSystemShim;
