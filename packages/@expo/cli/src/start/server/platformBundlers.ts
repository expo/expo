import type { ExpoConfig, ExpoConfigWeb, Platform } from '@expo/config';
import resolveFrom from 'resolve-from';

/** Which bundler each platform should use. */
export type PlatformBundlers = Record<Platform, 'metro' | 'webpack'>;

/** XDL-schema doesn't have `ios.bundler` and `android.bundler`, since this is technically deprecated */
type WithBundlerConfig = Pick<ExpoConfigWeb, 'bundler'> | undefined | null;

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
    ios: (exp.ios as WithBundlerConfig)?.bundler ?? 'metro',
    android: (exp.android as WithBundlerConfig)?.bundler ?? 'metro',
    web,
  };
}
