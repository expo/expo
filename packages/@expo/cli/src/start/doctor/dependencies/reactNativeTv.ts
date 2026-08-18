import JsonFile from '@expo/json-file';
import { resolveFrom } from '@expo/require-utils';
import semver from 'semver';

import { env } from '../../../utils/env';
import { fetch } from '../../../utils/fetch';
import { debugEvent } from '../events';

export const REACT_NATIVE_TVOS_PACKAGE_NAME = 'react-native-tvos';

const NPM_DIST_TAGS_URL = `https://registry.npmjs.org/-/package/${REACT_NATIVE_TVOS_PACKAGE_NAME}/dist-tags`;

const LATEST_FALLBACK_SPEC = `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@latest`;

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
  const reactNativePackageJsonPath = resolveFrom(projectRoot, 'react-native/package.json');
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
 * Returns the install spec to use for `react-native-tvos` given the bundled
 * `react-native` version.
 *
 * `react-native-tvos` ships a dist-tag per minor line in the form
 * `<major>.<minor>-stable` and a rolling `next` tag for prereleases. We derive
 * the expected tag from the bundled `react-native` version (stable → `-stable`,
 * prerelease → `next`) and then verify the tag is actually published by
 * fetching the package's `dist-tags` from the npm registry. If the derived tag
 * isn't published (or the registry can't be reached), we fall back to
 * `npm:react-native-tvos@latest` so the install still resolves to something
 * usable.
 */
export async function correctReactNativeTvVersion(
  bundledReactNativeVersion: string
): Promise<string> {
  const derivedTag = deriveDistTag(bundledReactNativeVersion);
  if (!derivedTag) {
    debugEvent('tv_dist_tag_fallback', {
      bundledVersion: bundledReactNativeVersion,
      reason: 'could not derive dist-tag',
    });
    return LATEST_FALLBACK_SPEC;
  }
  // In offline mode skip the npm dist-tags lookup and trust the derived tag —
  // any other CLI code path that needs a network request also bails on
  // `EXPO_OFFLINE` (see `validateDependenciesVersionsAsync`).
  if (env.EXPO_OFFLINE) {
    return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${derivedTag}`;
  }
  const publishedTags = await fetchReactNativeTvDistTagsAsync();
  if (publishedTags.has(derivedTag)) {
    return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${derivedTag}`;
  }
  debugEvent('tv_dist_tag_not_published', { tag: derivedTag });
  return LATEST_FALLBACK_SPEC;
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

function deriveDistTag(reactNativeVersion: string): string | undefined {
  if (!reactNativeVersion) {
    return undefined;
  }
  let minVersion: semver.SemVer | null = null;
  try {
    minVersion = semver.minVersion(reactNativeVersion);
  } catch {
    minVersion = null;
  }
  if (!minVersion) {
    return undefined;
  }
  if (minVersion.prerelease.length > 0) {
    return 'next';
  }
  return `${minVersion.major}.${minVersion.minor}-stable`;
}

async function fetchReactNativeTvDistTagsAsync(): Promise<Set<string>> {
  let response;
  try {
    response = await fetch(NPM_DIST_TAGS_URL);
  } catch (error: any) {
    debugEvent('tv_dist_tags_fetch_error', { error: debugEvent.error(error as Error) });
    return new Set();
  }
  // Always read the body to release the underlying stream — even on a non-2xx —
  // before deciding what to do with it. Parse JSON manually so a malformed
  // body never escapes as a rejected promise.
  let body = '';
  try {
    body = await response.text();
  } catch (error: any) {
    debugEvent('tv_dist_tags_body_error', { error: debugEvent.error(error as Error) });
    return new Set();
  }
  if (!response.ok) {
    debugEvent('tv_dist_tags_http_error', { status: response.status });
    return new Set();
  }
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return new Set();
  }
  if (!json || typeof json !== 'object') {
    return new Set();
  }
  return new Set(Object.keys(json as Record<string, unknown>));
}
