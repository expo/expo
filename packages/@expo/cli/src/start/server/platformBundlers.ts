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
    // tvOS and macOS are native RN targets that consume the same iOS-style
    // native bundle as iOS (macOS reuses iOS's `Platform.OS`). Rollipop builds
    // them through its native pipeline, so they are first-class rotatable
    // bundler targets — a global `--bundler` override (e.g. `expo export
    // --bundler rollipop`) or per-platform `tvos.bundler` / `macos.bundler` in
    // app.json selects rollipop for them, exactly like ios/android. They are
    // excluded from the *dev-server* rotation (Expo has no tvOS/macOS dev
    // server; they build via `expo run:ios`), but production exports must be
    // able to rotate to rollipop.
    tvos:
      bundlerOverride ??
      (exp as Partial<Record<string, WithBundlerConfig>>).tvos?.bundler ??
      'metro',
    macos:
      bundlerOverride ??
      (exp as Partial<Record<string, WithBundlerConfig>>).macos?.bundler ??
      'metro',
  };
}
