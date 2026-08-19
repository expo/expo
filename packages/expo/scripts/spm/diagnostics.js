/**
 * Actionable diagnostics for modules the plugin cannot contribute to the SwiftPM
 * graph. A module that is dropped silently does not fail the build — it fails at
 * runtime with `Cannot find native module '<Name>'`, far from the cause. So every
 * uncovered module is reported as an `error:` line (Xcode parses that prefix into
 * a build error) and the sync fails.
 *
 * The remedy for a mixed Swift/ObjC module is the same one React Native's
 * autolinker prescribes for community libraries: the module ships a Package.swift
 * declaring its own target split. Locally that means patch-package; permanently it
 * means a PR to the module.
 *
 * Rendering is PURE (entries → string) so the exact wording is unit-testable.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Pod-name families already covered by the SwiftPM graph: Expo's own modules
 * (contributed by this plugin) and React Native's products (contributed by RN).
 * A dependency outside these is a CocoaPods-only dependency with no SwiftPM
 * counterpart.
 */
const COVERED_POD_PREFIXES = [
  'Expo',
  'EX',
  'UM',
  'EASClient',
  'expo-',
  'React',
  'RCT',
  'ReactCommon',
  'Yoga',
  'hermes',
  'glog',
  'boost',
  'DoubleConversion',
  'fmt',
  'folly',
  'RNReanimated',
  'RNWorklets',
];

/**
 * Pods that need no SwiftPM package because they resolve another way — a system
 * library reachable via `linkedLibrary`, for instance.
 */
const UNMAPPED_POD_ALLOWLIST = new Set(['sqlite3']);

class UnsupportedModulesError extends Error {
  constructor(entries) {
    const count = entries.reduce(
      (n, e) => n + (e.reason === 'core-unavailable' ? e.pods.length : 1),
      0
    );
    super(
      `${count} Expo native ${count === 1 ? 'module' : 'modules'} cannot be built with ` +
        'Swift Package Manager. See the errors above for the fix for each one.'
    );
    this.name = 'UnsupportedModulesError';
    this.unsupported = entries;
  }
}

/**
 * The `spm.config.json` product declaring `podName`, or null. A module with one
 * can be built into an XCFramework by the Expo prebuild pipeline, which compiles
 * mixed Swift/ObjC/C++ targets — so it needs no SwiftPM manifest at all. A
 * `sourceOnly` product declares the opposite: it never produces an artifact.
 */
function spmConfigProduct(moduleRoot, podName) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(path.join(moduleRoot, 'spm.config.json'), 'utf8'));
  } catch {
    return null;
  }
  const product = (config.products ?? []).find((p) => (p.podName ?? p.name) === podName);
  if (product == null) return null;
  return { name: product.name, sourceOnly: product.sourceOnly === true };
}

/**
 * Why each uncovered pod is uncovered. A missing interface tree is a single
 * project-level fault that would otherwise be reported once per module, so it
 * collapses into one entry naming the modules it took down.
 */
function classifyUnsupported({ pending, coreAvailable }) {
  if (!pending.length) return [];
  if (!coreAvailable) {
    return [{ reason: 'core-unavailable', pods: pending.map((p) => p.podName) }];
  }
  return pending.map((p) => {
    const prebuildable = p.prebuildProduct != null && !p.prebuildProduct.sourceOnly;
    return {
      reason:
        p.hasSources === false
          ? 'no-apple-sources'
          : prebuildable
            ? 'prebuild-available'
            : 'mixed-no-manifest',
      podName: p.podName,
      packageName: p.packageName,
      moduleRoot: p.moduleRoot,
      productName: p.prebuildProduct?.name ?? null,
    };
  });
}

/** Pod names a podspec depends on, ignoring `test_spec` blocks. Text-only. */
function podspecDependencies(text) {
  const deps = [];
  let inTestSpec = false;
  let testSpecIndent = 0;
  for (const line of text.split('\n')) {
    const indent = line.length - line.trimStart().length;
    if (inTestSpec && line.trim().length > 0 && indent <= testSpecIndent) {
      inTestSpec = false;
    }
    if (/\.test_spec\b/.test(line)) {
      inTestSpec = true;
      testSpecIndent = indent;
      continue;
    }
    if (inTestSpec) continue;
    const match = line.match(/\.dependency\s+['"]([^'"]+)['"]/);
    if (match) deps.push(match[1]);
  }
  return deps;
}

/** The subset of pod dependencies with no SwiftPM counterpart. */
function unmappedPodDependencies(deps) {
  return deps.filter(
    (dep) =>
      !UNMAPPED_POD_ALLOWLIST.has(dep) &&
      !COVERED_POD_PREFIXES.some((prefix) => dep.startsWith(prefix))
  );
}

/** Pods outside the SwiftPM graph that `podspecDir`'s podspecs depend on. */
function collectUnmappedDependencies(podspecDir) {
  let entries = [];
  try {
    entries = fs.readdirSync(podspecDir).filter((f) => f.endsWith('.podspec'));
  } catch {
    return [];
  }
  const deps = new Set();
  for (const name of entries) {
    let text = '';
    try {
      text = fs.readFileSync(path.join(podspecDir, name), 'utf8');
    } catch {
      continue;
    }
    unmappedPodDependencies(podspecDependencies(text)).forEach((d) => deps.add(d));
  }
  return [...deps];
}

function renderMixedNoManifest({ podName, packageName, moduleRoot }) {
  return [
    `error: Expo module "${packageName}" (pod ${podName}) mixes Swift and Objective-C/C++ sources but ships neither a Package.swift nor an spm.config.json, so it cannot be built with Swift Package Manager.`,
    `  Swift Package Manager compiles Swift and Objective-C in separate targets, and only the module can declare where its split goes. Either route makes it consumable:`,
    `  1. Add an spm.config.json to ${packageName} so the Expo prebuild pipeline can build it into an XCFramework — it compiles mixed-language targets, so no source split is needed. packages/expo-sensors is a worked example.`,
    `  2. Or add a Package.swift to ${packageName} that splits its sources into a Swift target and an Objective-C target. packages/expo-file-system is a worked example.`,
    `  3. If you do not own ${packageName}, persist either manifest with \`npx patch-package ${packageName}\` and commit the patch — node_modules is not committed, so without it this error returns on every fresh install and in CI.`,
    `  4. Ask ${packageName}'s maintainer to ship it upstream, or open a PR adding it, so every consumer gets Swift Package Manager support.`,
    `  5. To build without this module for now, exclude it in your app's package.json: "expo": { "autolinking": { "exclude": ["${packageName}"] } } — its native module will then be unavailable at runtime.`,
    `  Module path: ${moduleRoot}`,
  ].join('\n');
}

/**
 * The module declares a prebuildable product, so the artifact is simply not built
 * yet. Nothing about the module needs to change — this is a one-command fix, and
 * both flavors are mandatory because the plugin declares immutable pairs.
 */
function renderPrebuildAvailable({ podName, packageName, moduleRoot, productName }) {
  return [
    `error: Expo module "${packageName}" (pod ${podName}) has no prebuilt XCFramework, so it is not in the Swift Package Manager graph.`,
    `  It declares "${productName}" in its spm.config.json, so it does not need a Package.swift — the Expo prebuild pipeline builds it. The artifact is just missing.`,
    `  Build it — omit --flavor so both Debug and Release are built, since the plugin declares an immutable pair and rejects a half-built one:`,
    `      et prebuild ${packageName}`,
    `  Then re-run \`npx react-native spm update\`. A published ${packageName} that ships prebuilds/output/<flavor>/xcframeworks is picked up with no local build.`,
    `  Module path: ${moduleRoot}`,
  ].join('\n');
}

function renderNoAppleSources({ podName, packageName, moduleRoot }) {
  return [
    `error: Expo module "${packageName}" (pod ${podName}) has no \`ios\` or \`apple\` source directory, so Swift Package Manager has nothing to compile.`,
    `  Its podspec points at sources the plugin cannot locate — either the package is incomplete (a partial install) or it keeps its Apple sources somewhere non-standard and needs a checked-in Package.swift naming their real path.`,
    `  Reinstall the package first. If the layout is intentional, add a Package.swift to ${packageName} and persist it with \`npx patch-package ${packageName}\`, then upstream it.`,
    `  Module path: ${moduleRoot}`,
  ].join('\n');
}

function renderCoreUnavailable({ pods }) {
  return [
    `error: ExpoModulesCore has no prebuilt Debug and Release xcframework, so all ${pods.length} source-built Expo ${pods.length === 1 ? 'module' : 'modules'} were skipped.`,
    `  Every Expo source module compiles against the ExpoModulesCore framework interface tree; without both flavors the plugin cannot emit any of them.`,
    `  Build the precompiled core, once per flavor (the flavor name is case-sensitive):`,
    `      et prebuild -f Debug expo-modules-core expo-modules-jsi`,
    `      et prebuild -f Release expo-modules-core expo-modules-jsi`,
    `  Skipped: ${pods.join(', ')}`,
  ].join('\n');
}

const RENDERERS = {
  'mixed-no-manifest': renderMixedNoManifest,
  'prebuild-available': renderPrebuildAvailable,
  'no-apple-sources': renderNoAppleSources,
  'core-unavailable': renderCoreUnavailable,
};

/** The full report: one `error:`-prefixed block per entry. Pure. */
function renderUnsupportedReport(entries) {
  return entries.map((entry) => RENDERERS[entry.reason](entry)).join('\n\n');
}

/**
 * Non-fatal counterpart: modules that DO get emitted but depend on pods with no
 * SwiftPM counterpart. They compile until they reach the missing dependency, so
 * this is a warning that explains the compile error before it happens.
 */
function renderUnmappedDependencyWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, podName, pods }) =>
      [
        `warning: Expo module "${packageName}" (pod ${podName}) depends on ${pods.length} CocoaPods ${pods.length === 1 ? 'dependency' : 'dependencies'} with no Swift Package Manager counterpart: ${pods.join(', ')}.`,
        `  The module is in the build graph, but any source that uses one of those will fail to compile.`,
        `  Each dependency needs a SwiftPM package (or an xcframework) the module can declare. Until then, exclude "${packageName}" in your app's package.json: "expo": { "autolinking": { "exclude": ["${packageName}"] } }.`,
      ].join('\n')
    )
    .join('\n\n');
}

/** Print the report and return the error to throw, or null when nothing is uncovered. */
function reportUnsupported(entries) {
  if (!entries.length) return null;
  console.error(renderUnsupportedReport(entries));
  return new UnsupportedModulesError(entries);
}

module.exports = {
  UnsupportedModulesError,
  COVERED_POD_PREFIXES,
  UNMAPPED_POD_ALLOWLIST,
  classifyUnsupported,
  spmConfigProduct,
  podspecDependencies,
  unmappedPodDependencies,
  collectUnmappedDependencies,
  renderUnsupportedReport,
  renderUnmappedDependencyWarning,
  reportUnsupported,
};
