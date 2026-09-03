const RESERVED_PREFIX = '__expo_';
const LEGACY_HOST = 'expo-development-client';

// @needsAudit
/**
 * Resolves a launch URL to the URL the app should handle.
 *
 * Expo Go and development builds accept launcher commands as reserved `__expo_*` query params on
 * any URL, or through the legacy `expo-development-client` host with a `url` param. This function
 * returns the target URL named by `__expo_url` (or the legacy `url`), or the given URL without its
 * reserved params. A URL that carries no launcher command is returned unchanged.
 *
 * @param url A URL received by the app, for example from `Linking.getInitialURL()`.
 * @return The URL the app should route. An empty string for a legacy launch URL without a target.
 *
 * @example
 * ```ts
 * unwrapDevLaunchURL('myapp://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081%2F--%2Fprofile');
 * // 'http://10.0.0.5:8081/--/profile'
 * unwrapDevLaunchURL('myapp://login?__expo_launch_token=abc');
 * // 'myapp://login'
 * ```
 */
export function unwrapDevLaunchURL(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const isLegacyHost = parsed.hostname === LEGACY_HOST;
  const target =
    parsed.searchParams.get('__expo_url') ?? (isLegacyHost ? parsed.searchParams.get('url') : null);
  if (target != null) {
    return target;
  }
  if (isLegacyHost) {
    return '';
  }

  const reserved = [...parsed.searchParams.keys()].filter((key) => key.startsWith(RESERVED_PREFIX));
  if (!reserved.length) {
    return url;
  }
  for (const key of reserved) {
    parsed.searchParams.delete(key);
  }
  return parsed.toString();
}
