import path from 'path';

/**
 * Grammar of the precompiled xcframework artifact layout. The producer (`et prebuild`),
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

const PRECOMPILE_BUILD_DIR = '.build';
const SHARED_SPM_DEPS_SOURCE_DIR = '.spm-deps';
const BUNDLED_PREBUILDS_DIR = 'prebuilds';
const BUNDLED_SHARED_SPM_DEPS_SUBPATH = path.join(BUNDLED_PREBUILDS_DIR, 'spm-deps');
const XCFRAMEWORKS_DIR = 'xcframeworks';

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
  repoRoot?: string | null;
}

export type ArtifactBaseOptions =
  | (CommonArtifactBaseOptions & { type: 'internal'; versionPrefix?: never })
  | (CommonArtifactBaseOptions & { type: 'external'; versionPrefix?: string | null });

/** Ordered candidate base directories. Callers probe them in order. */
export function getArtifactBases({
  type,
  npmPackage,
  packageRoot,
  customModulesPath,
  repoRoot,
  versionPrefix,
}: ArtifactBaseOptions): string[] {
  const buildRoot = customModulesPath || (repoRoot && monorepoBuildDir(repoRoot));
  const bundledOutput = packageRoot && path.join(packageRoot, BUNDLED_PREBUILDS_DIR, 'output');
  const versioned = type === 'external' ? versionPrefix : null;

  const bases: string[] = [];
  if (buildRoot) {
    const output = path.join(buildRoot, npmPackage, 'output');
    bases.push(versioned ? path.join(output, versioned) : output);
  }
  if (bundledOutput) {
    if (versioned) {
      bases.push(path.join(bundledOutput, versioned));
    }
    bases.push(bundledOutput);
  }
  return bases;
}

export interface ArtifactSuffixes {
  dir: string;
  framework: string;
  tarball: string;
}

/** Base-relative. Join against an entry from getArtifactBases(). */
export function getArtifactSuffixes(productName: string, flavor: PrebuiltFlavor): ArtifactSuffixes {
  const dir = path.posix.join(flavor, XCFRAMEWORKS_DIR);
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
 * The version prefix is always included. precompiled_modules.rb derives this key from
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
    'output',
    versionPrefix || '',
    getArtifactSuffixes(productName, flavor).tarball
  );
}

export interface SharedSpmDepBaseOptions {
  packageRoot?: string | null;
  customModulesPath?: string | null;
  repoRoot?: string | null;
}

/**
 * Ordered candidate base directories for a shared SPM dependency. A custom
 * modules path adds a candidate here instead of replacing the monorepo one, so
 * that a partial override cannot hide a complete build.
 */
export function getSharedSpmDepBases(
  depName: string,
  { packageRoot, customModulesPath, repoRoot }: SharedSpmDepBaseOptions
): string[] {
  const bases: string[] = [];
  if (customModulesPath) {
    bases.push(path.join(customModulesPath, SHARED_SPM_DEPS_SOURCE_DIR, depName));
  }
  if (repoRoot) {
    bases.push(path.join(monorepoBuildDir(repoRoot), SHARED_SPM_DEPS_SOURCE_DIR, depName));
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

function monorepoBuildDir(repoRoot: string): string {
  return path.join(repoRoot, 'packages', 'precompile', PRECOMPILE_BUILD_DIR);
}
