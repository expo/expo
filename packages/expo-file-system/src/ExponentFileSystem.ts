import { NativeModulesProxy } from 'expo-modules-core';

import ExponentFileSystemShim from './ExponentFileSystemShim';
import { ExponentFileSystemModule } from './types';

let platformModule;

if (NativeModulesProxy.ExponentFileSystem) {
  platformModule = NativeModulesProxy.ExponentFileSystem;
} else {
  platformModule = ExponentFileSystemShim;
}

export default platformModule as ExponentFileSystemModule;
