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
export const REACT_NATIVE_SUBMODULE_DIR = Directories.getReactNativeSubmoduleDir();
