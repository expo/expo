const SEPARATOR = ',';

/**
 * Derives a URL-safe route from a screen name.
 * Converts spaces to hyphens, removes special characters, and handles parentheses.
 *
 * Test this:
 * For the "tests" tab:
 * `xcrun simctl openurl booted bareexpo://test-suite/run?tests=brightness-device-only,blur`
 * or `yarn open ios brightness-device-only blur`
 *
 * For the "components" tab:
 * `xcrun simctl openurl booted bareexpo://components/blurview`
 *
 * @example
 * deriveRouteFromName('Cellular (device-only)') // => 'cellular-device-only'
 * deriveRouteFromName('Video Thumbnails') // => 'video-thumbnails'
 */
function deriveRouteFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      // Handle parentheses: "Test (foo)" -> "test-foo"
      .replace(/\s*\(([^)]*)\)/g, '-$1')
      // Remove special characters (keep alphanumeric, hyphens, underscores, spaces)
      .replace(/[^a-z0-9\-_\s]/g, '')
      // Convert spaces to hyphens
      .replace(/\s+/g, '-')
      // Collapse multiple hyphens/underscores into single hyphen
      .replace(/[-_]+/g, '-')
      // Trim leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Validates that a route ID only contains safe characters.
 * Allows slashes for nested routes and @ symbols.
 * Allows uppercase letters for explicit routes (camelCase).
 */
function isValidRouteId(id: string): boolean {
  return /^[a-zA-Z0-9\-_\/@]+$/.test(id);
}

/**
 * for the "APIs" tab in Bare-Expo:
 * in ExpoApisStackNavigator.tsx (ScreensList) you may specify a `name` and optional `route`. By default, `name` is used.
 *
 * for the "Tests" tab in Bare-Expo: in the test screens in apps/test-suite/tests you may specify (export const ...):
 * - `name`: visible in the list
 * - `route`: string used for deep linking (by default, derived from `name`)
 * */
export const getScreenIdForLinking = ({
  name,
  route,
}: {
  name: string;
  route?: string;
}): string => {
  const id = route ? route.trim() : deriveRouteFromName(name);

  if (!id || !isValidRouteId(id)) {
    console.error(
      `The screen linking id "${id}" from module name "${name}" is invalid. ` +
        `Routes must be non-empty and only contain letters, numbers, hyphens, underscores, slashes, and @ symbols.`
    );
  }

  return id;
};

export function createQueryString(tests: string[]): string {
  if (!Array.isArray(tests) || !tests.every((v) => typeof v === 'string')) {
    throw new Error(
      `test-suite: Cannot create query string for runner. Expected array of strings, instead got: ${tests}`
    );
  }
  // Normalize first, then deduplicate
  const normalized = tests.map((it) => it.trim().toLowerCase());
  const uniqueTests = Array.from(new Set(normalized).values());
  // Skip encoding or React Navigation will encode twice
  return uniqueTests.join(SEPARATOR);
}

export function getSelectedTestNames(selectionQuery: string): string[] {
  return selectionQuery
    .split(SEPARATOR)
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);
}
