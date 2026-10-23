import path from 'path';

/**
 * Where precompiled iOS xcframeworks are stored, locally and in the remote artifact store.
 * `et prebuild` writes artifacts with it (`tools/src/prebuilds/Frameworks.ts`, through the
 * `internal/prebuiltArtifactPaths` subpath), and `prebuiltMetadata.ts` uses it to tell
 * consumers where to look. `scripts/ios/precompiled_modules.rb` still has its own copy.
 *
 * Which base holds an artifact depends on the flavor chosen at build time and on what
 * exists on disk, so callers get ordered candidate bases plus base-relative suffixes and
 * do the probing themselves.
 */

export type PrebuiltFlavor = 'debug' | 'release';

export const PREBUILT_FLAVORS: readonly PrebuiltFlavor[] = Object.freeze(['debug', 'release']);

const SHARED_SPM_DEPS_SOURCE_DIR = '.spm-deps';
const BUNDLED_PREBUILDS_DIR = 'prebuilds';
const BUNDLED_SHARED_SPM_DEPS_SUBPATH = path.join(BUNDLED_PREBUILDS_DIR, 'spm-deps');
const XCFRAMEWORKS_DIR = 'xcframeworks';
const ARTIFACT_OUTPUT_DIR = 'output';

/**
 * Returns null when any version is missing. An empty string counts as missing, which is
 * stricter than Ruby's version_prefix_for_external_package: it would join `''` into the
 * path and yield a prefix with a trailing empty segment.
 */
export function buildVersionPrefix(
  packageVersion: string | null | undefined,
  reactNativeVersion: string | null | undefined,
  hermesVersion: string | null | undefined
): string | null {
  if (!packageVersion || !reactNativeVersion || !hermesVersion) {
    return null;
  }
  return path.posix.join(packageVersion, reactNativeVersion, hermesVersion);
}

interface CommonArtifactBaseOptions {
  npmPackage: string;
  packageRoot: string;
  customModulesPath?: string | null;
  /** Laid out like `customModulesPath`: `<npmPackage>/output/...` and `.spm-deps/<depName>`. */
  localBuildsPath?: string | null;
}

export type ArtifactBaseOptions =
  | (CommonArtifactBaseOptions & { type: 'internal'; versionPrefix?: never })
  | (CommonArtifactBaseOptions & { type: 'external'; versionPrefix?: string | null });

export function getArtifactBase(buildPath: string, versionPrefix?: string | null): string {
  const output = path.join(buildPath, ARTIFACT_OUTPUT_DIR);
  return versionPrefix ? path.join(output, versionPrefix) : output;
}

/** Ordered candidate base directories. Callers probe them in order. */
export function getArtifactBases({
  type,
  npmPackage,
  packageRoot,
  customModulesPath,
  localBuildsPath,
  versionPrefix,
}: ArtifactBaseOptions): string[] {
  const packageBuildDir = customModulesPath
    ? path.join(customModulesPath, npmPackage)
    : localBuildsPath && path.join(localBuildsPath, npmPackage);
  const versioned = type === 'external' ? versionPrefix : null;

  const bases: string[] = [];
  if (packageBuildDir) {
    bases.push(getArtifactBase(packageBuildDir, versioned));
  }
  if (packageRoot) {
    const bundled = path.join(packageRoot, BUNDLED_PREBUILDS_DIR);
    if (versioned) {
      bases.push(getArtifactBase(bundled, versioned));
    }
    bases.push(getArtifactBase(bundled));
  }
  return bases;
}

export interface ArtifactSuffixes {
  dir: string;
  framework: string;
  tarball: string;
}

export function getArtifactDirSuffix(flavor: PrebuiltFlavor): string {
  return path.posix.join(flavor, XCFRAMEWORKS_DIR);
}

/** Base-relative. Join against an entry from getArtifactBases(). */
export function getArtifactSuffixes(productName: string, flavor: PrebuiltFlavor): ArtifactSuffixes {
  const dir = getArtifactDirSuffix(flavor);
  return {
    dir,
    framework: path.posix.join(dir, `${productName}.xcframework`),
    tarball: path.posix.join(dir, `${productName}.tar.gz`),
  };
}

/**
 * Key of a product tarball within the remote artifact store and its local mirror.
 * Unlike the suffixes above this is not base-relative: it starts at the package
 * name, and it stays slash-separated because it is also a URL path.
 *
 * The version prefix is included even when the artifact was found in an unversioned
 * base, because the remote store is always written with versioned paths.
 */
export function getRemoteArtifactKey(
  npmPackage: string,
  versionPrefix: string | null | undefined,
  productName: string,
  flavor: PrebuiltFlavor
): string {
  return path.posix.join(
    npmPackage,
    ARTIFACT_OUTPUT_DIR,
    versionPrefix || '',
    getArtifactSuffixes(productName, flavor).tarball
  );
}

export interface SharedSpmDepBaseOptions {
  packageRoot?: string | null;
  customModulesPath?: string | null;
  /** Laid out like `customModulesPath`: `<npmPackage>/output/...` and `.spm-deps/<depName>`. */
  localBuildsPath?: string | null;
}

/**
 * Ordered candidate base directories for a shared SPM dependency. A custom
 * modules path adds a candidate here instead of replacing the local builds one, so
 * that a partial override cannot hide a complete build.
 */
export function getSharedSpmDepBases(
  depName: string,
  { packageRoot, customModulesPath, localBuildsPath }: SharedSpmDepBaseOptions
): string[] {
  const bases: string[] = [];
  if (customModulesPath) {
    bases.push(path.join(customModulesPath, SHARED_SPM_DEPS_SOURCE_DIR, depName));
  }
  if (localBuildsPath) {
    bases.push(path.join(localBuildsPath, SHARED_SPM_DEPS_SOURCE_DIR, depName));
  }
  if (packageRoot) {
    bases.push(path.join(packageRoot, BUNDLED_SHARED_SPM_DEPS_SUBPATH, depName));
  }
  return bases;
}

/** Base-relative, and deliberately not the product grammar: no 'xcframeworks' segment. */
export function getSharedSpmDepSuffix(depName: string, flavor: PrebuiltFlavor): string {
  return path.posix.join(flavor, `${depName}.xcframework`);
}
