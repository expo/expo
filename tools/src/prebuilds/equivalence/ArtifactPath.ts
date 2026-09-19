import { PACKAGE_LOCAL_BUILD_DIRECTORY } from '../PackageLocalBuild';
import type { BuildFlavor } from '../Prebuilder.types';

export interface ArtifactContext {
  /** Directory name under `packages/`, e.g. `expo-image`. */
  packageName: string;
  flavor: BuildFlavor;
  /**
   * The `.xcframework` basename, e.g. `EXApplication`. This is the framework name, which often
   * differs from the SPM product name that built it (`ExpoApplication`).
   */
  artifactName: string;
}

/** Everything after the package name, common to both layouts. */
const OUTPUT_TAIL = String.raw`output/(?:.+/)?(debug|release)/xcframeworks/([^/]+)\.xcframework/?$`;

/**
 * `packages/precompile/.build/<package>/output/[<version>/]<flavor>/xcframeworks/<Product>.xcframework`
 * — the shared build tree `et prebuild` writes into. The package name follows the marker, and a
 * scoped one spans two segments.
 */
const SHARED_BUILD_TREE = new RegExp(
  String.raw`(?:^|/)\.build/(@[^/]+/[^/]+|[^/]+)/${OUTPUT_TAIL}`
);

/**
 * `<package>/.expo-prebuild/output/[<version>/]<flavor>/xcframeworks/<Product>.xcframework` — what
 * `et prebuild-package-for-publish` writes, building inside the package instead of the shared tree.
 * Here the package name *precedes* the marker, which is why this cannot be an alternation inside
 * the pattern above.
 */
const PACKAGE_LOCAL_BUILD = new RegExp(
  String.raw`(?:^|/)((?:@[^/]+/)?[^/]+)/${escapeRegExp(PACKAGE_LOCAL_BUILD_DIRECTORY)}/${OUTPUT_TAIL}`
);

/** How to spell each layout, for a refusal that has to tell the caller where to point instead. */
export const ARTIFACT_PATH_LAYOUTS = [
  '.build/<package>/output/[<version>/]<flavor>/xcframeworks/<Product>.xcframework',
  `<package>/${PACKAGE_LOCAL_BUILD_DIRECTORY}/output/[<version>/]<flavor>/xcframeworks/<Product>.xcframework`,
];

/**
 * Reads the package, flavor and artifact name out of a prebuild output path, or returns `null`
 * when the path is somewhere else — a copy in a scratch directory, say.
 */
export function parseArtifactPath(xcframeworkPath: string): ArtifactContext | null {
  for (const layout of [SHARED_BUILD_TREE, PACKAGE_LOCAL_BUILD]) {
    const match = xcframeworkPath.match(layout);
    if (match) {
      const [, packageName, flavor, artifactName] = match;
      return { packageName, flavor: flavor === 'debug' ? 'Debug' : 'Release', artifactName };
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
