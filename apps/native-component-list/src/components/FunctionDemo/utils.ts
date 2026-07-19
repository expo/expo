import { Platform } from 'react-native';

/**
 * @param supportedPlatforms empty array means all platforms are supported
 */
export function isCurrentPlatformSupported(supportedPlatforms: string[] = []): boolean {
  return supportedPlatforms.length === 0 || supportedPlatforms.includes(Platform.OS);
}
