import type { ExpoConfig, Platform } from '@expo/config';
import resolveFrom from 'resolve-from';

/** Which bundler each platform should use. */
export type PlatformBundlers = Record<Platform, 'metro' | 'webpack'>;

// TODO(@kitten): Not on type yet
declare module '@expo/config-types' {
  export interface IOS {
    bundler?: 'webpack' | 'metro';
  }
  export interface Android {
    bundler?: 'webpack' | 'metro';
  }
}

/** Get the platform bundlers mapping. */
export function getPlatformBundlers(
  projectRoot: string,
  exp: Partial<ExpoConfig>
): PlatformBundlers {
  /**
   * SDK 50+: The web bundler is dynamic based upon the presence of the `@expo/webpack-config` package.
   */
  let web = exp.web?.bundler;
  if (!web) {
    const resolved = resolveFrom.silent(projectRoot, '@expo/webpack-config/package.json');
    web = resolved ? 'webpack' : 'metro';
  }

  return {
    ios: exp.ios?.bundler ?? 'metro',
    android: exp.android?.bundler ?? 'metro',
    web,
  };
}
