import path from 'path';

import * as Directories from './Directories';

export const LOCAL_API_HOST = 'localhost:3000';
export const STAGING_API_HOST = 'staging.exp.host';
export const PRODUCTION_API_HOST = 'exp.host';

export const EXPO_DIR = Directories.getExpoRepositoryRootDir();
export const EXPOTOOLS_DIR = Directories.getExpotoolsDir();
export const IOS_DIR = Directories.getIosDir();
export const ANDROID_DIR = Directories.getAndroidDir();
export const TEMPLATES_DIR = Directories.getTemplatesDir();
export const PACKAGES_DIR = Directories.getPackagesDir();
export const VERSIONED_RN_IOS_DIR = Directories.getVersionedReactNativeIosDir();
export const REACT_NATIVE_SUBMODULE_MONOREPO_ROOT = Directories.getReactNativeSubmoduleDir();
export const REACT_NATIVE_SUBMODULE_DIR = path.join(
  REACT_NATIVE_SUBMODULE_MONOREPO_ROOT,
  'packages',
  'react-native'
);

// Vendored dirs
export const ANDROID_VENDORED_DIR = path.join(ANDROID_DIR, 'vendored');
export const IOS_VENDORED_DIR = path.join(IOS_DIR, 'vendored');
