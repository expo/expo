/**
 * Platform identity metadata shared by Expo tooling.
 *
 * This package is the single source of truth for pure data about platform names. It has zero
 * runtime dependencies so that every layer of the toolchain can consume it — including
 * `expo-modules-autolinking`, which deliberately keeps its dependency list minimal.
 *
 * Keep this package free of behavior: no filesystem access, no path resolution, no config
 * evaluation. Consumers wrap this data in their own semantics (defaults, throws, gating).
 */

/** All platform names known to Expo tooling. */
export type PlatformName = 'android' | 'ios' | 'web' | 'tvos' | 'macos';

/** Platform names that run a react-native runtime (every platform except `web`). */
export type NativePlatformName = Exclude<PlatformName, 'web'>;

/** Out-of-tree platform names: hosted by a react-native fork rather than `react-native` itself. */
export type OutOfTreePlatformName = Extract<PlatformName, 'tvos' | 'macos'>;

/** All platform names known to Expo tooling, in display order. */
export const KNOWN_PLATFORMS: readonly PlatformName[] = ['android', 'ios', 'web', 'tvos', 'macos'];

/**
 * Out-of-tree platforms. These are available only behind `experiments.outOfTreePlatforms` in the
 * app config, and each is hosted by the react-native fork named in `REACT_NATIVE_HOST_PACKAGES`.
 */
export const OUT_OF_TREE_PLATFORMS: readonly OutOfTreePlatformName[] = ['tvos', 'macos'];

/** Whether the platform is an out-of-tree platform (see `OUT_OF_TREE_PLATFORMS`). */
export function isOutOfTreePlatform(
  platform: string | null | undefined
): platform is OutOfTreePlatformName {
  return (OUT_OF_TREE_PLATFORMS as readonly string[]).includes(platform!);
}

/** Platform names that build through Xcode and follow Apple bundle conventions. */
export type AppleTargetPlatformName = Extract<PlatformName, 'ios' | 'tvos' | 'macos'>;

/**
 * Platforms that build through Xcode and follow Apple bundle conventions (`main.jsbundle`,
 * `PLATFORM_NAME` environment, CocoaPods).
 */
export const APPLE_TARGET_PLATFORMS: readonly AppleTargetPlatformName[] = ['ios', 'tvos', 'macos'];

/** Whether the platform builds through Xcode and follows Apple bundle conventions. */
export function isAppleTargetPlatform(
  platform: string | null | undefined
): platform is AppleTargetPlatformName {
  return (APPLE_TARGET_PLATFORMS as readonly string[]).includes(platform!);
}

/**
 * The react-native host package for each platform: the package providing the platform's
 * react-native implementation. `windows` is listed for `expo-modules-autolinking`, which
 * recognizes it even though the rest of the toolchain does not target it yet.
 */
export const REACT_NATIVE_HOST_PACKAGES: Readonly<Record<string, string>> = {
  android: 'react-native',
  ios: 'react-native',
  tvos: 'react-native-tvos',
  macos: 'react-native-macos',
  windows: 'react-native-windows',
};

/**
 * Returns the react-native host package for the platform, or `undefined` for platforms without
 * one (such as `web`). Consumers decide their own fallback and error semantics.
 */
export function getReactNativeHostPackage(platform: string | null | undefined): string | undefined {
  return platform == null ? undefined : REACT_NATIVE_HOST_PACKAGES[platform];
}

/**
 * Metro source-extension fallback chains for out-of-tree platforms: the platform-qualified file
 * extensions tried in order when bundling for the platform (for example, `App.tvos.tsx` falls
 * back to `App.ios.tsx`, then `App.native.tsx`). In-tree platforms use Metro's default behavior
 * and are deliberately absent.
 */
export const PLATFORM_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  tvos: ['tvos', 'ios', 'native'],
  macos: ['macos', 'ios', 'native'],
};
