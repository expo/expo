import path from 'path';
import process from 'process';

export function getExpoRepositoryRootDir(): string {
  // EXPO_ROOT_DIR is set locally by direnv
  return process.env.EXPO_ROOT_DIR || path.join(__dirname, '..', '..', '..');
}

export function getExpoHomeJSDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'home');
}

export function getExpotoolsDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'tools', 'expotools');
}

export function getBinDir(): string {
  return path.join(getExpotoolsDir(), 'bin');
}

export function getPackagesDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'packages');
}

export function getIosDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'ios');
}

export function getAndroidDir(): string {
  return path.join(getExpoRepositoryRootDir(), 'android');
}
