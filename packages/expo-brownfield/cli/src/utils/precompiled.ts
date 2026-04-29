import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import CLIError from './error';
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
 * Locates the shared SPM-deps cache root. Resolution order:
 *
 *  1. `$EXPO_PRECOMPILED_MODULES_PATH/.spm-deps/` — explicit override matching the Ruby
 *     autolinking convention (precompiled_modules.rb's MODULES_PATH_ENV_VAR).
 *  2. Walk up from `startDir` looking for `packages/precompile/.build/.spm-deps/` — the Expo
 *     monorepo's centralized cache.
 *
 * Returns the absolute path to the `.spm-deps/` dir, or null when neither is reachable.
 */
export const findSpmDepsRoot = (startDir: string): string | null => {
  const envOverride = process.env.EXPO_PRECOMPILED_MODULES_PATH;
  if (envOverride) {
    const candidate = path.join(envOverride, '.spm-deps');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

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

/**
 * Subset of the `spm.config.json` schema we actually care about for resolving deps. Each
 * Expo precompiled module ships one of these (e.g. `node_modules/expo-image/spm.config.json`).
 */
export interface SpmConfig {
  products?: SpmProduct[];
}

export interface SpmProduct {
  name?: string;
  podName?: string;
  spmPackages?: SpmPackageEntry[];
}

export interface SpmPackageEntry {
  productName?: string;
  url?: string;
}

export interface NpmPackageInfo {
  npmPackage: string;
  packageRoot: string;
  spmConfig: SpmConfig;
}

const SPM_CONFIG_FILENAME = 'spm.config.json';

/** Reads + parses an `spm.config.json` file. Returns null on any read/parse failure. */
const readSpmConfig = (filePath: string): SpmConfig | null => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SpmConfig;
  } catch {
    return null;
  }
};

/**
 * Builds a `Map<podName, NpmPackageInfo>` for every npm package reachable from `cwd` that has
 * an `spm.config.json` declaring a `podName`. Used to walk an enumerated pod (e.g. `ExpoImage`)
 * back to its npm package so we can read its declared `spmPackages`.
 *
 * Two scan passes:
 *  1. `<cwd>/node_modules/{*,@scope/*}/spm.config.json` — packages that ship their own config.
 *  2. `<expo-modules-autolinking>/external-configs/ios/{*,@scope/*}/spm.config.json` — third-party
 *     packages (RNReanimated, RNScreens, RNSkia, …) whose configs live in the autolinking
 *     package rather than alongside their own source.
 *
 * The node_modules pass runs first so a workspace-installed `spm.config.json` always wins over
 * the bundled external default. Each candidate is `realpath`'d for pnpm's `.pnpm/` store layout.
 */
export const buildPodToNpmPackageMap = (cwd: string): Map<string, NpmPackageInfo> => {
  const map = new Map<string, NpmPackageInfo>();
  const nodeModules = path.join(cwd, 'node_modules');

  const recordProducts = (spmConfig: SpmConfig, npmPackage: string, packageRoot: string): void => {
    for (const product of spmConfig.products ?? []) {
      if (!product.podName) {
        continue;
      }
      if (!map.has(product.podName)) {
        map.set(product.podName, { npmPackage, packageRoot, spmConfig });
      }
    }
  };

  const indexNodeModulesCandidate = (candidate: string) => {
    const configPath = path.join(candidate, SPM_CONFIG_FILENAME);
    if (!fs.existsSync(configPath)) {
      return;
    }
    let packageRoot: string;
    try {
      packageRoot = fs.realpathSync(candidate);
    } catch {
      packageRoot = candidate;
    }
    const spmConfig = readSpmConfig(path.join(packageRoot, SPM_CONFIG_FILENAME));
    if (!spmConfig?.products?.length) {
      return;
    }
    let npmPackage: string | undefined;
    try {
      const pkgJson = JSON.parse(
        fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
      ) as { name?: string };
      npmPackage = pkgJson.name;
    } catch {
      // Best-effort — fall back to dir basename.
    }
    if (!npmPackage) {
      npmPackage = path.basename(packageRoot);
    }
    recordProducts(spmConfig, npmPackage, packageRoot);
  };

  if (fs.existsSync(nodeModules)) {
    for (const entry of fs.readdirSync(nodeModules, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }
      if (entry.name.startsWith('.')) {
        continue;
      }
      if (entry.name.startsWith('@')) {
        const scopeDir = path.join(nodeModules, entry.name);
        let scopedEntries: fs.Dirent[];
        try {
          scopedEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const scoped of scopedEntries) {
          if (!scoped.isDirectory() && !scoped.isSymbolicLink()) {
            continue;
          }
          indexNodeModulesCandidate(path.join(scopeDir, scoped.name));
        }
      } else {
        indexNodeModulesCandidate(path.join(nodeModules, entry.name));
      }
    }
  }

  // Pass 2: expo-modules-autolinking/external-configs/ios — configs for 3rd-party packages that
  // don't ship their own spm.config.json (e.g. react-native-reanimated, @shopify/react-native-skia).
  // Resolve directly inside `<cwd>/node_modules/` (following symlinks for pnpm) instead of using
  // `require.resolve`, which would walk up parent dirs and pick up an unrelated install.
  let externalConfigsRoot: string | null = null;
  const autolinkingPath = path.join(nodeModules, 'expo-modules-autolinking');
  if (fs.existsSync(path.join(autolinkingPath, 'package.json'))) {
    let autolinkingRoot = autolinkingPath;
    try {
      autolinkingRoot = fs.realpathSync(autolinkingPath);
    } catch {
      // realpath failed — keep the unresolved path; existsSync below handles the rest.
    }
    externalConfigsRoot = path.join(autolinkingRoot, 'external-configs', 'ios');
  }

  const indexExternalConfig = (configDir: string, npmPackage: string) => {
    const configPath = path.join(configDir, SPM_CONFIG_FILENAME);
    if (!fs.existsSync(configPath)) {
      return;
    }
    const spmConfig = readSpmConfig(configPath);
    if (!spmConfig?.products?.length) {
      return;
    }
    // The actual package install root (where `prebuilds/output/` would live, if anything) is
    // resolved via `require.resolve`. Fall back to the external-config dir so the entry still
    // exists in the map for declared-deps aggregation even when the package isn't installed.
    let packageRoot = configDir;
    try {
      const pkgJsonPath = require.resolve(`${npmPackage}/package.json`, { paths: [cwd] });
      packageRoot = path.dirname(pkgJsonPath);
    } catch {
      // Package not installed; the external-config dir is fine for spmConfig-only consumers.
    }
    recordProducts(spmConfig, npmPackage, packageRoot);
  };

  if (externalConfigsRoot && fs.existsSync(externalConfigsRoot)) {
    for (const entry of fs.readdirSync(externalConfigsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }
      if (entry.name.startsWith('@')) {
        const scopeDir = path.join(externalConfigsRoot, entry.name);
        let scopedEntries: fs.Dirent[];
        try {
          scopedEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const scoped of scopedEntries) {
          if (!scoped.isDirectory() && !scoped.isSymbolicLink()) {
            continue;
          }
          indexExternalConfig(path.join(scopeDir, scoped.name), `${entry.name}/${scoped.name}`);
        }
      } else {
        indexExternalConfig(path.join(externalConfigsRoot, entry.name), entry.name);
      }
    }
  }

  return map;
};

/**
 * Recursively searches `<packageRoot>/prebuilds/output/` for an xcframework matching the
 * requested name + flavor. The npm-publish pipeline writes deps under either:
 *   `prebuilds/output/<pkgVer>/<rnVer>/<hermesVer>/<flavor>/xcframeworks/<name>.xcframework` (versioned)
 *   `prebuilds/output/<flavor>/xcframeworks/<name>.xcframework` (flat)
 * We treat the layout as opaque and return the first match — RN/Hermes versions in the
 * consumer's project may not align with what was published, so an exact path match would be
 * brittle.
 *
 * Bounded depth to avoid pathological scans.
 */
const findBundledXcframework = (
  packageRoot: string,
  name: string,
  flavor: string,
  maxDepth = 10
): string | null => {
  const root = path.join(packageRoot, 'prebuilds', 'output');
  if (!fs.existsSync(root)) {
    return null;
  }
  const target = path.join(flavor, 'xcframeworks', `${name}.xcframework`);

  const walk = (dir: string, depth: number): string | null => {
    if (depth > maxDepth) {
      return null;
    }
    const candidate = path.join(dir, target);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const entry of entries) {
      let isDir = entry.isDirectory();
      // pnpm and similar package managers symlink workspace packages — readdir's Dirent
      // reports `isDirectory() === false` for them, so resolve the link with `statSync`
      // (which follows symlinks) to avoid skipping legitimate prebuild output trees.
      if (!isDir && entry.isSymbolicLink()) {
        try {
          isDir = fs.statSync(path.join(dir, entry.name)).isDirectory();
        } catch {
          // Broken symlink, skip it.
          continue;
        }
      }
      if (!isDir) {
        continue;
      }
      const found = walk(path.join(dir, entry.name), depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  };

  return walk(root, 0);
};

/**
 * Returns the unique set of declared SPM-dep product names across the given pods, looked up
 * via each pod's npm package's `spm.config.json`. Used both as the source-of-truth completeness
 * check and as the input to bundled-dep enumeration.
 */
export const collectDeclaredSpmDeps = (
  modules: ModuleXCFramework[],
  podToNpm: Map<string, NpmPackageInfo>
): { name: string; declaringPod: string }[] => {
  const seen = new Map<string, string>();
  for (const module of modules) {
    // Look up by pod name. The map is keyed on `spm.config.json`'s `podName`, but our enumerator
    // uses the pod directory name; for first-party Expo modules these match exactly.
    // Fall back to the xcframework basename for the rare case where they don't.
    const podName = path.basename(module.podDir);
    const info = podToNpm.get(podName) ?? podToNpm.get(module.mainProduct);
    if (!info) {
      continue;
    }
    for (const product of info.spmConfig.products ?? []) {
      for (const pkg of product.spmPackages ?? []) {
        if (pkg.productName && !seen.has(pkg.productName)) {
          seen.set(pkg.productName, info.npmPackage);
        }
      }
    }
  }
  return Array.from(seen.entries()).map(([name, declaringPod]) => ({ name, declaringPod }));
};

/**
 * For each enumerated pod, walk back to its npm package, read declared `spmPackages`, and look
 * for a matching `<name>.xcframework` under that package's `prebuilds/output/.../<flavor>/`
 * tree. This is the npm-published consumer path — the precompile pipeline's `bundleSharedDeps`
 * mode drops the SPM-dep xcframeworks alongside the main product when publishing, so external
 * (non-monorepo) users have everything they need locally without any shared cache.
 *
 * Skips entries already in `existingNames` (pod-scan layer wins over bundled). Silently omits
 * deps whose xcframework can't be found here — the strict completeness check downstream
 * (in copyXCFrameworks) is the source of truth for surfacing unresolvable deps.
 */
export const enumerateBundledSpmDepsXcframeworks = (
  modules: ModuleXCFramework[],
  podToNpm: Map<string, NpmPackageInfo>,
  buildConfiguration: BuildConfiguration,
  existingNames: Set<string>
): ModuleXCFramework[] => {
  const flavor = buildConfiguration.toLowerCase();
  const results: ModuleXCFramework[] = [];
  const seen = new Set(existingNames);

  for (const module of modules) {
    const podName = path.basename(module.podDir);
    const info = podToNpm.get(podName) ?? podToNpm.get(module.mainProduct);
    if (!info) {
      continue;
    }
    for (const product of info.spmConfig.products ?? []) {
      for (const pkg of product.spmPackages ?? []) {
        const depName = pkg.productName;
        if (!depName || seen.has(depName)) {
          continue;
        }
        const xcframeworkPath = findBundledXcframework(info.packageRoot, depName, flavor);
        if (!xcframeworkPath) {
          continue;
        }
        seen.add(depName);
        results.push({
          name: depName,
          podDir: path.dirname(xcframeworkPath),
          xcframeworkPath,
          // No `artifacts/` dir → ensureCorrectFlavor is a no-op. mainProduct mirrors name.
          mainProduct: depName,
        });
      }
    }
  }

  return results;
};

/**
 * Single source of truth for the full prebuild module set. Walks all three layers in priority
 * order (pod → bundled-npm → shared `.spm-deps/`), deduping by xcframework name across layers,
 * and runs the strict completeness check before returning.
 *
 * Both `copyXCFrameworks` (bundles xcframeworks into the package) and `generatePackageMetadataFile`
 * (declares them in `Package.swift`) need to see the exact same module set, otherwise an
 * xcframework can land on disk without a matching `.binaryTarget` (or vice-versa). Calling this
 * helper from both sites guarantees they agree, and gates both behind the completeness check
 * so we never produce a half-baked package on missing deps.
 */
export const enumerateAllPrebuildModules = (
  cwd: string,
  buildConfiguration: BuildConfiguration
): ModuleXCFramework[] => {
  const podModules = enumeratePrecompiledModules(path.join(cwd, 'ios'));
  const podToNpm = buildPodToNpmPackageMap(cwd);
  const seenNames = new Set(podModules.map((m) => m.name));

  const bundledModules = enumerateBundledSpmDepsXcframeworks(
    podModules,
    podToNpm,
    buildConfiguration,
    seenNames
  );
  bundledModules.forEach((m) => seenNames.add(m.name));

  const spmDepModules = enumerateSpmDepsXcframeworks(cwd, buildConfiguration, seenNames);

  const modules = [...podModules, ...bundledModules, ...spmDepModules];

  const declaredDeps = collectDeclaredSpmDeps(podModules, podToNpm);
  const coveredNames = new Set(modules.map((m) => m.name));
  const missing = declaredDeps.filter(({ name }) => !coveredNames.has(name));
  if (missing.length > 0) {
    const detail = missing
      .map(({ name, declaringPod }) => `${name} (required by ${declaringPod})`)
      .join(', ');
    CLIError.handle('ios-prebuilds-spm-dep-missing', detail);
  }

  return modules;
};
