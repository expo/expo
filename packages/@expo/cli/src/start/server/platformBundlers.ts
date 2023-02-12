import { ExpoConfig, Platform } from '@expo/config';

/** Which bundler each platform should use. */
export type PlatformBundlers = Record<Platform, 'metro' | 'webpack'>;

/** Get the platform bundlers mapping. */
export function getPlatformBundlers(exp: Partial<ExpoConfig>): PlatformBundlers {
  return {
    // @ts-expect-error: not on type yet
    ios: exp.ios?.bundler ?? 'metro',
    // @ts-expect-error: not on type yet
    android: exp.android?.bundler ?? 'metro',
    web: exp.web?.bundler ?? 'webpack',
  };
}
