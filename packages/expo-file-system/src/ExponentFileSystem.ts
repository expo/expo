import { NativeModulesProxy } from '@unimodules/core';

import ExponentFileSystemShim from './ExponentFileSystemShim';
import { ExponentFileSystemModule } from './FileSystem.types';

let platformModule;

if (NativeModulesProxy.ExponentFileSystem) {
  platformModule = NativeModulesProxy.ExponentFileSystem;
} else {
  platformModule = ExponentFileSystemShim;
}

export default platformModule as ExponentFileSystemModule;
