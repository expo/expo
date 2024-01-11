import path from 'path';
import process from 'process';

export function getExpoRepositoryRootDir(): string {
  // EXPO_ROOT_DIR is set locally by direnv
  return process.env.EXPO_ROOT_DIR || path.join(__dirname, '..', '..');
}

export function getExpoGoDir(): string {
  return path.join(getAppsDir(), 'expo-go');
}

export function getExpotoolsDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'tools');
}

export function getBinDir(): string {
  return path.join(getExpotoolsDir(), 'bin');
}

export function getPackagesDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'packages');
}

export function getExpoGoIosDir(): string {
  return path.join(getExpoGoDir(), 'ios');
}

export function getExpoGoAndroidDir(): string {
  return path.join(getExpoGoDir(), 'android');
}

export function getTemplatesDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'templates');
}

export function getReactNativeSubmoduleDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'react-native-lab', 'react-native');
}

export function getVersionedReactNativeIosDir(): string {
  return path.join(getExpoGoIosDir(), 'versioned-react-native');
}

export function getAppsDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'apps');
}
