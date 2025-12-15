import { SupportedPlatform } from '../types';

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
