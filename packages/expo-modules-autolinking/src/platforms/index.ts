import { REACT_NATIVE_HOST_PACKAGES, getReactNativeHostPackage } from '@expo/platforms';

import type { SupportedPlatform } from '../types';

interface PlatformImplementations {
  ios: typeof import('./apple/apple');
  macos: typeof import('./apple/apple');
  tvos: typeof import('./apple/apple');
  apple: typeof import('./apple/apple');
  android: typeof import('./android/android');
  devtools: typeof import('./devtools');
  web: typeof import('./web');
}

function getLinkingImplementationForPlatform<Platform extends keyof PlatformImplementations>(
  platform: Platform
): PlatformImplementations[Platform];
function getLinkingImplementationForPlatform(
  platform: 'ios' | 'macos' | 'tvos' | 'apple'
): PlatformImplementations['apple'];
function getLinkingImplementationForPlatform(
  platform: 'android'
): PlatformImplementations['android'];
function getLinkingImplementationForPlatform(
  platform: 'devtools'
): PlatformImplementations['devtools'];
function getLinkingImplementationForPlatform(platform: 'web'): PlatformImplementations['web'];
function getLinkingImplementationForPlatform(
  platform: SupportedPlatform
): PlatformImplementations[keyof PlatformImplementations];

function getLinkingImplementationForPlatform(
  platform: SupportedPlatform
): PlatformImplementations[keyof PlatformImplementations] {
  if (!platform) {
    throw new Error(`No platform was specified, but linking commands require a specific platform.`);
  }
  switch (platform) {
    case 'ios':
    case 'macos':
    case 'tvos':
    case 'apple':
      return require('../platforms/apple');
    case 'android':
      return require('../platforms/android');
    case 'devtools':
      return require('../platforms/devtools');
    case 'web':
      return require('../platforms/web');
    default:
      throw new Error(`No linking implementation is available for platform "${platform}"`);
  }
}

export { getLinkingImplementationForPlatform };

/**
 * Every react-native host package. A host is a platform's react-native distribution rather than a
 * linkable module, so none of them may be autolinked — not even the hosts belonging to other
 * platforms, which a project installs alongside its own (e.g. `react-native` and
 * `react-native-tvos` are both dependencies of an app that builds for iOS and tvOS).
 */
const HOST_PACKAGE_NAMES = new Set(Object.values(REACT_NATIVE_HOST_PACKAGES));

/** Whether the package is a react-native host for any platform, and so must not be autolinked. */
export function isReactNativeHostPackage(packageName: string): boolean {
  return HOST_PACKAGE_NAMES.has(packageName);
}

export function getSupportPackageForPlatform(platform: SupportedPlatform): string | null {
  switch (platform) {
    case 'ios':
    case 'android':
    case 'tvos':
    case 'macos':
    case 'windows':
      // The host package names are shared tooling-wide data in @expo/platforms.
      return getReactNativeHostPackage(platform)!;
    case 'apple':
    case 'web':
    case 'devtools':
      return null;
    default:
      throw new Error(`No support package is known for platform "${platform}"`);
  }
}
