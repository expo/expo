import semver from 'semver';

export const REACT_NATIVE_TVOS_PACKAGE_NAME = 'react-native-tvos';

/**
 * Detects whether the project's `package.json` declares `react-native` as an
 * npm alias for `react-native-tvos` (e.g. `"react-native": "npm:react-native-tvos@0.83.0-0"`).
 *
 * The installed version reported from `node_modules/react-native/package.json` is the
 * upstream `react-native-tvos` version (e.g. `"0.83.0-0"`), so the alias is the only
 * reliable signal that this is a TV project.
 */
export function reactNativeTvPresentInPackageDependencies(
  dependencies: Record<string, string> | undefined
): boolean {
  const reactNativeSpec = dependencies?.['react-native'];
  return !!reactNativeSpec && reactNativeSpec.startsWith(`npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}`);
}

/**
 * Derives the `react-native-tvos` install spec that matches a given `react-native`
 * version. `react-native-tvos` ships a dist-tag per minor line in the form
 * `<major>.<minor>-stable`, so for `react-native@0.85.3` we install
 * `npm:react-native-tvos@0.85-stable`. For a prerelease `react-native` (e.g.
 * `0.85.3-rc.1`), the upstream stable line doesn't exist yet, so we target the
 * `next` dist-tag instead.
 *
 * Throws if `reactNativeVersion` is not a parseable semver value or range.
 */
export function correctReactNativeTvVersion(reactNativeVersion: string): string {
  let minVersion: semver.SemVer | null;
  try {
    minVersion = semver.minVersion(reactNativeVersion);
  } catch {
    minVersion = null;
  }
  if (!minVersion) {
    throw new Error(
      `Cannot derive a react-native-tvos version from "${reactNativeVersion}": not a valid semver value.`
    );
  }
  if (minVersion.prerelease.length > 0) {
    return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@next`;
  }
  return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${minVersion.major}.${minVersion.minor}-stable`;
}

/**
 * Returns true when an installed `react-native` (aliased to `react-native-tvos`)
 * version's `major.minor` lines up with the expected bundled `react-native`
 * version. `react-native-tvos` releases follow the upstream minor versions, so a
 * matching `major.minor` means the TV variant is already current.
 */
export function reactNativeTvVersionMatchesBundled(
  actualVersion: string,
  bundledReactNativeVersion: string
): boolean {
  const actual = semver.coerce(actualVersion);
  const bundled = semver.coerce(bundledReactNativeVersion);
  if (!actual || !bundled) {
    return false;
  }
  return actual.major === bundled.major && actual.minor === bundled.minor;
}
