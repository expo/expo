import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

export const REACT_NATIVE_TVOS_PACKAGE_NAME = 'react-native-tvos';

/**
 * Detects whether this is a TV project by inspecting the installed
 * `react-native` package's `name` field. When the project's `package.json`
 * aliases `react-native` to `react-native-tvos` (e.g.
 * `"react-native": "npm:react-native-tvos@0.83.0-0"`), the installed package
 * at `node_modules/react-native/package.json` is the upstream
 * `react-native-tvos` manifest, whose `name` is `"react-native-tvos"`.
 *
 * Reading the installed manifest is more reliable than reading the project's
 * `package.json` spec string, which can vary across package managers and
 * lockfile rewrites.
 */
export async function isReactNativeTvProjectAsync(projectRoot: string): Promise<boolean> {
  const reactNativePackageJsonPath = resolveFrom.silent(projectRoot, 'react-native/package.json');
  if (!reactNativePackageJsonPath) {
    return false;
  }
  try {
    const installedPkg = await JsonFile.readAsync<{ name?: string }>(reactNativePackageJsonPath);
    return installedPkg.name === REACT_NATIVE_TVOS_PACKAGE_NAME;
  } catch {
    return false;
  }
}

/**
 * Picks the `react-native-tvos` install spec for a TV project. Resolution order:
 *
 * 1. If `bundledNativeModules` lists `react-native-tvos`, install that exact
 *    version. The map is the merged result of the SDK versions endpoint and the
 *    local `expo/bundledNativeModules.json`, so this is the same source of
 *    truth used for every other package.
 * 2. Otherwise derive from the bundled `react-native` version: stable
 *    `react-native` lines have a matching `<major>.<minor>-stable` dist-tag on
 *    `react-native-tvos`; prerelease lines (e.g. `0.85.3-rc.1`) target `next`.
 * 3. If `bundledReactNativeVersion` isn't a parseable semver value, fall back
 *    to `npm:react-native-tvos@latest`.
 */
export function correctReactNativeTvVersion(
  bundledReactNativeVersion: string,
  bundledNativeModules?: Record<string, string>
): string {
  const bundledTvVersion = bundledNativeModules?.[REACT_NATIVE_TVOS_PACKAGE_NAME];
  if (bundledTvVersion) {
    return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${bundledTvVersion}`;
  }

  let minVersion: semver.SemVer | null = null;
  if (bundledReactNativeVersion) {
    try {
      minVersion = semver.minVersion(bundledReactNativeVersion);
    } catch {
      minVersion = null;
    }
  }
  if (!minVersion) {
    return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@latest`;
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
