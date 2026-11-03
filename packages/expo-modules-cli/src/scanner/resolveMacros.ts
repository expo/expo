import type * as Macros from 'expo-modules-macros';
import path from 'path';

/** The `expo-modules-macros` package: the scanner wrapper and the scanner it ships. */
export type MacrosPackage = typeof Macros;

/**
 * The `scan-exports` schema version this CLI renders. It must match the macros version the CLI is
 * built and tested against (the one `expo-modules-core` in this repository depends on); a test
 * keeps the two in sync.
 */
export const SCAN_EXPORTS_SCHEMA_VERSION = 10;

/**
 * The packages to walk from the scanned package to the macros, each resolved from the one before.
 * A module reaches `expo-modules-core` only through `expo`, which every module declares as a peer
 * dependency. Autolinking and the SPM plugin resolve the macros from `expo-modules-core` too, so the
 * scan reads the sources with the same macros version that the iOS build compiles them with.
 */
const RESOLUTION_CHAIN = ['expo', 'expo-modules-core', 'expo-modules-macros'];

/** The `expo-modules-macros` package that a package compiles with, and where it is installed. */
export type ResolvedMacros = {
  macros: MacrosPackage;
  root: string;
  version: string;
};

/**
 * Loads the `expo-modules-macros` package that the `expo-modules-core` of the package at
 * `packageDir` depends on. `packageDir` can also be any directory inside that package.
 */
export function loadMacros(packageDir: string): ResolvedMacros {
  let root = packageDir;
  for (const name of RESOLUTION_CHAIN) {
    try {
      root = path.dirname(require.resolve(`${name}/package.json`, { paths: [root] }));
    } catch (error) {
      throw new Error(
        `Could not resolve "${name}" from ${root}. expo-modules-cli uses the ` +
          `expo-modules-macros version that expo-modules-core depends on, and finds it through the ` +
          `"expo" package of the module, so install "expo" in ${packageDir}.`,
        { cause: error }
      );
    }
  }
  const { version } = require(path.join(root, 'package.json'));
  return { macros: require(root), root, version };
}

/**
 * Loads the `expo-modules-macros` package that the `expo-modules-core` of the scanned package
 * depends on, and checks that it reports the schema this CLI renders.
 */
export function resolveMacros(packageDir: string): MacrosPackage {
  const { macros, root, version } = loadMacros(packageDir);
  if (macros.SUPPORTED_SCAN_EXPORTS_SCHEMA_VERSION !== SCAN_EXPORTS_SCHEMA_VERSION) {
    throw new Error(
      `expo-modules-macros ${version} at ${root} reports schema version ` +
        `${macros.SUPPORTED_SCAN_EXPORTS_SCHEMA_VERSION}, but this CLI understands version ` +
        `${SCAN_EXPORTS_SCHEMA_VERSION}. Use the expo-modules-cli version that matches your "expo" version.`
    );
  }
  return macros;
}
