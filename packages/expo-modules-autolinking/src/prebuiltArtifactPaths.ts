import path from 'path';

/**
 * Grammar of the prebuilt xcframework artifact layout. The producer (`et prebuild`),
 * the CocoaPods integrator and the remote artifact cache each still encode their own
 * copy; this module is the one they are being migrated onto.
 *
 * Every function here is pure: it turns already-resolved strings into paths.
 * Which base actually holds an artifact depends on the flavor chosen at build
 * time and on what exists on disk, so this module emits ordered candidate bases
 * plus base-relative suffixes and leaves the probing to each caller.
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

/** The base an already-resolved build path holds its artifacts under. */
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

/** Base-relative directory holding every product of one flavor. */
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
 * The version prefix is always included. The CocoaPods integrator derives this key from
 * the base it resolved the artifact from, so a fall back to the npm-bundled directory
 * silently drops the prefix and points the key at nothing — the remote store is always
 * written with versioned paths. Switching Ruby onto this module fixes that, and changes
 * the key for any consumer that cached the unversioned form.
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
