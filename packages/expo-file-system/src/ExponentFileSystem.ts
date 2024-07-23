import { requireOptionalNativeModule } from 'expo';

import ExponentFileSystemShim from './ExponentFileSystemShim';

export default requireOptionalNativeModule('ExponentFileSystem') ?? ExponentFileSystemShim;
