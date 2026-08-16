import type { ExpoConfig, ExpoConfigWeb, Platform } from '@expo/config';
import resolveFrom from 'resolve-from';

/** Which bundler each platform should use. */
export type PlatformBundlers = Record<Platform, 'metro' | 'webpack' | 'rollipop'>;

/** XDL-schema doesn't have `ios.bundler` and `android.bundler`, since this is technically deprecated */
type WithBundlerConfig = Pick<ExpoConfigWeb, 'bundler'> | undefined | null;

/** Get the platform bundlers mapping. */
export function getPlatformBundlers(
  projectRoot: string,
  exp: Partial<ExpoConfig>,
  /** CLI override from `expo start --bundler ...`, applied to native platforms. */
  bundlerOverride?: 'metro' | 'webpack' | 'rollipop'
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
    ios: bundlerOverride ?? (exp.ios as WithBundlerConfig)?.bundler ?? 'metro',
    android: bundlerOverride ?? (exp.android as WithBundlerConfig)?.bundler ?? 'metro',
    web,
    // tvOS and macOS are Xcode-built targets, not rollipop bundling targets.
    // Applying a global `--bundler` override (e.g. `expo start --bundler
    // rollipop`) must not misconfigure them — keep them on metro so their
    // native builds continue to work. Per-platform `ios.bundler` /
    // `android.bundler` in app.json still select rollipop for the mobile
    // platforms only.
    tvos: 'metro',
    macos: 'metro',
  };
}
