import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import type { BuildConfiguration, ModuleXCFramework } from './types';

const SPM_DEPS_RELATIVE = path.join('packages', 'precompile', '.build', '.spm-deps');

/**
 * Pod directories that host xcframeworks already covered by the fixed `XCFramework` constants
 * (hermesvm, React, ReactNativeDependencies). Excluded from enumerated Expo-module results
 * so they aren't double-copied into the Swift Package output.
 */
const RESERVED_POD_DIRS = new Set([
  'hermes-engine',
  'React-Core-prebuilt',
  'ReactNativeDependencies',
]);

/**
 * Scans `ios/Pods/` for prebuilt xcframeworks installed by autolinking when
 * `EXPO_USE_PRECOMPILED_MODULES=1` is set. A pod is "precompiled" when its directory contains
 * a `<Product>.xcframework/` dir and an `artifacts/<Product>-{debug,release}.tar.gz` tarball —
 * the exact signature written by `Expo::PrecompiledModules.ensure_artifacts` in
 * expo-modules-autolinking.
 *
 * For each precompiled pod we yield ALL xcframework subdirs, not just the main product, so
 * that SPM-dependency xcframeworks bundled alongside (e.g. SDWebImage / SDWebImageSVGCoder /
 * libavif laid down inside `Pods/ExpoImage/`) are surfaced too. Without these, the resulting
 * Swift Package would link against missing rpath entries at runtime
 * (`Library not loaded: @rpath/SDWebImage.framework/SDWebImage`).
 *
 * Results are deduplicated by xcframework basename — when the same SPM dep is claimed by
 * multiple pods, only the first one wins (subsequent pods reference it via FRAMEWORK_SEARCH_PATHS
 * in CocoaPods land, so we only need one copy in the SPM output).
 */
export const enumeratePrecompiledModules = (iosDir: string): ModuleXCFramework[] => {
  const podsDir = path.join(iosDir, 'Pods');
  if (!fs.existsSync(podsDir)) {
    return [];
  }

  const results: ModuleXCFramework[] = [];
  const seenNames = new Set<string>();

  for (const entry of fs.readdirSync(podsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || RESERVED_POD_DIRS.has(entry.name)) {
      continue;
    }
    const podDir = path.join(podsDir, entry.name);
    const artifactsDir = path.join(podDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      continue;
    }

    const tarballs = fs.readdirSync(artifactsDir).filter((f) => f.endsWith('.tar.gz'));
    if (tarballs.length === 0) {
      continue;
    }

    const xcframeworks = fs
      .readdirSync(podDir, { withFileTypes: true })
      .filter((f) => f.isDirectory() && f.name.endsWith('.xcframework'))
      .map((f) => f.name.replace(/\.xcframework$/, ''));

    // Identify the "main" product for this pod — the xcframework whose name matches a tarball.
    // Used as the `-m` argument when reconciling debug/release flavors via replace-xcframework.js.
    const mainProduct = xcframeworks.find((name) =>
      tarballs.some((f) => f === `${name}-debug.tar.gz` || f === `${name}-release.tar.gz`)
    );
    if (!mainProduct) {
      // No xcframework lines up with the tarball — defensive skip (treat as unrelated vendored fw).
      continue;
    }

    for (const name of xcframeworks) {
      if (seenNames.has(name)) {
        continue;
      }
      seenNames.add(name);
      results.push({
        name,
        podDir,
        xcframeworkPath: path.join(podDir, `${name}.xcframework`),
        mainProduct,
      });
    }
  }

  return results;
};

/**
 * Reads `<podDir>/artifacts/.last_build_configuration` and, if it doesn't match the requested
 * build configuration, shells out to autolinking's `replace-xcframework.js` to extract the
 * correct flavor tarball in place. This protects against the user having run
 * `EXPO_PRECOMPILED_FLAVOR=debug pod install` but then asking for a `--release` brownfield
 * build (or vice-versa).
 */
export const ensureCorrectFlavor = async (
  module: ModuleXCFramework,
  buildConfiguration: BuildConfiguration,
  options: { verbose: boolean }
): Promise<void> => {
  const flavor = buildConfiguration.toLowerCase();
  const artifactsDir = path.join(module.podDir, 'artifacts');
  // SPM-dep xcframeworks under `.spm-deps/<name>/<flavor>/` don't have an `artifacts/` dir
  // — they're already segregated by flavor on disk, so there's nothing to reconcile.
  if (!fs.existsSync(artifactsDir)) {
    return;
  }
  const lastConfigFile = path.join(artifactsDir, '.last_build_configuration');
  if (fs.existsSync(lastConfigFile)) {
    const last = fs.readFileSync(lastConfigFile, 'utf8').trim();
    if (last === flavor) {
      return;
    }
  }

  let scriptPath: string;
  try {
    scriptPath = require.resolve('expo-modules-autolinking/scripts/ios/replace-xcframework.js', {
      paths: [process.cwd()],
    });
  } catch {
    throw new Error(
      `Could not locate expo-modules-autolinking's replace-xcframework.js. ` +
        `Install expo-modules-autolinking in your project (it is usually a transitive dep of expo) ` +
        `and re-run with --use-prebuilds.`
    );
  }

  // `replace-xcframework.js -m` expects the pod's main product (the one whose tarball is at
  // `<podDir>/artifacts/<product>-<config>.tar.gz`), not necessarily the xcframework `name`
  // — sibling SPM-dep xcframeworks share the pod's main tarball.
  await runCommand(
    'node',
    [scriptPath, '-c', flavor, '-m', module.mainProduct, '-x', module.podDir],
    { verbose: options.verbose }
  );
};

export const resolvedFixedXCFrameworks = (): string[] => {
  return Object.values(XCFramework).map((f) => f.name);
};

/**
 * Walks up from `startDir` looking for `packages/precompile/.build/.spm-deps/`. The Expo monorepo
 * stages shared SPM-dependency xcframeworks (SDWebImage, libavif, lottie-ios, …) under that path
 * — one xcframework per `<productName>/<flavor>/`. Returns the absolute path or null.
 */
export const findSpmDepsRoot = (startDir: string): string | null => {
  let dir = path.resolve(startDir);
  while (true) {
    const candidate = path.join(dir, SPM_DEPS_RELATIVE);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
};

/**
 * Scans the monorepo `.spm-deps/` cache for prebuilt SPM-dependency xcframeworks matching the
 * requested build configuration. Each matching `<name>/<flavor>/<name>.xcframework` becomes a
 * `ModuleXCFramework` entry (with `mainProduct === name` since they have no parent pod).
 *
 * `existingNames` is the set of xcframework names already produced by the regular pod-scan
 * enumeration; matching entries here are skipped to avoid duplicate binary targets.
 *
 * Returns an empty array when the `.spm-deps/` cache can't be located (e.g. external users
 * outside the monorepo). Callers should treat that as a soft failure and warn that runtime
 * @rpath references for SPM deps may go unresolved.
 */
export const enumerateSpmDepsXcframeworks = (
  cwd: string,
  buildConfiguration: BuildConfiguration,
  existingNames: Set<string>
): ModuleXCFramework[] => {
  const spmDepsRoot = findSpmDepsRoot(cwd);
  if (!spmDepsRoot) {
    return [];
  }

  const flavor = buildConfiguration.toLowerCase();
  const results: ModuleXCFramework[] = [];

  for (const entry of fs.readdirSync(spmDepsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) {
      continue;
    }
    if (existingNames.has(entry.name)) {
      continue;
    }
    const xcframeworkPath = path.join(spmDepsRoot, entry.name, flavor, `${entry.name}.xcframework`);
    if (!fs.existsSync(xcframeworkPath)) {
      continue;
    }
    results.push({
      name: entry.name,
      podDir: path.join(spmDepsRoot, entry.name),
      xcframeworkPath,
      // SPM-dep xcframeworks aren't governed by `replace-xcframework.js` (no artifacts/ dir),
      // so flavor reconcile is a no-op for them. mainProduct mirrors `name` defensively.
      mainProduct: entry.name,
    });
  }

  return results;
};
