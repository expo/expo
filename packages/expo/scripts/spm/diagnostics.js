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
const { podspecBodyLines } = require('./podspec');

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
    const subject = { podName: p.podName, packageName: p.packageName, moduleRoot: p.moduleRoot };
    const prebuildable = p.prebuildProduct != null && !p.prebuildProduct.sourceOnly;
    if (prebuildable) {
      return { reason: 'prebuild-available', ...subject, productName: p.prebuildProduct.name };
    }
    if (p.podspecLinkage != null) {
      const { file, line, snippet } = p.podspecLinkage;
      return { reason: 'needs-manifest-for-linkage', ...subject, file, line, snippet };
    }
    if (p.unsupportedTargetDeps?.length) {
      return {
        reason: 'unsupported-target-dependency',
        ...subject,
        dependencies: p.unsupportedTargetDeps,
      };
    }
    if (p.unresolvedTargets?.length) {
      return { reason: 'unresolvable-target-path', ...subject, targetNames: p.unresolvedTargets };
    }
    return {
      reason: p.hasSources === false ? 'no-apple-sources' : 'mixed-no-manifest',
      ...subject,
      productName: p.prebuildProduct?.name ?? null,
    };
  });
}

/** Pod names a podspec depends on, ignoring `test_spec` blocks. Text-only. */
function podspecDependencies(text) {
  const deps = [];
  for (const { text: line } of podspecBodyLines(text)) {
    const match = line.match(/\.dependency\s+['"]([^'"]+)['"]/);
    if (match) deps.push(match[1]);
  }
  return deps;
}

/**
 * The subset of pod dependencies with no SwiftPM counterpart. `satisfied` holds
 * the SwiftPM packages already declared as frameworks, matched on the root of the
 * pod name so that a subspec (`libavif/libdav1d`) is covered by its package —
 * the match CocoaPods makes in `precompiled_modules.rb#strip_matching_dependencies`.
 */
function unmappedPodDependencies(deps, satisfied = new Set()) {
  return deps.filter(
    (dep) =>
      !UNMAPPED_POD_ALLOWLIST.has(dep) &&
      !satisfied.has(dep.split('/')[0]) &&
      !COVERED_POD_PREFIXES.some((prefix) => dep.startsWith(prefix))
  );
}

/** Pods outside the SwiftPM graph that `podspecDir`'s podspecs depend on. */
function collectUnmappedDependencies(podspecDir, satisfied) {
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
    unmappedPodDependencies(podspecDependencies(text), satisfied).forEach((d) => deps.add(d));
  }
  return [...deps];
}

/**
 * Two paths that name different real directories. A path that cannot be resolved
 * — a broken symlink, an unreadable parent — counts as no difference: a symlinked
 * layout is the normal case here, and a diagnostic is never worth failing on.
 */
function resolveToDifferentDirectories(left, right) {
  try {
    return fs.realpathSync(left) !== fs.realpathSync(right);
  } catch {
    return false;
  }
}

/**
 * Modules whose documented package root and autolinked root are two different
 * real directories: the package is installed twice, and the plugin builds the
 * copy the app's JavaScript does not import. One directory reached by two paths
 * — the routine pnpm and monorepo case — is not a conflict.
 *
 * @param identities every pod's identity, from `plugin.js#resolvePodIdentities`.
 */
function collectRootConflicts(identities) {
  const conflicts = new Map();
  // A root is resolved per POD, so the module conflicts as soon as ANY pod
  // documents another copy, not only the first pod that documents one.
  for (const { packageName, documentedRoot, autolinkedRoot } of identities.values()) {
    if (conflicts.has(packageName) || documentedRoot == null || autolinkedRoot == null) continue;
    if (resolveToDifferentDirectories(documentedRoot, autolinkedRoot)) {
      conflicts.set(packageName, { packageName, moduleRoot: documentedRoot, autolinkedRoot });
    }
  }
  return [...conflicts.values()];
}

function renderMixedNoManifest({ podName, packageName, moduleRoot }) {
  return [
    `error: Expo module "${packageName}" (pod ${podName}) mixes Swift and Objective-C/C++ sources but ships neither a Package.swift nor an spm.config.json, so it cannot be built with Swift Package Manager.`,
    `  Swift Package Manager compiles Swift and Objective-C in separate targets, and only the module can declare where its split goes. Either route makes it consumable:`,
    `  1. Add an spm.config.json to ${packageName} so the Expo prebuild pipeline can build it into an XCFramework — it compiles mixed-language targets, so no source split is needed. packages/expo-sensors is a worked example.`,
    `  2. Or add a Package.swift to ${packageName} that splits its sources into a Swift target and an Objective-C target. packages/expo-constants is a worked example, splitting into EXConstants and EXConstantsObjC.`,
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

function renderUnresolvableTargetPath({ podName, packageName, moduleRoot, targetNames }) {
  const quoted = targetNames.map((n) => `"${n}"`).join(', ');
  const plural = targetNames.length === 1 ? 'target' : 'targets';
  return [
    `error: Expo module "${packageName}" (pod ${podName}) ships a Package.swift whose ${plural} ${quoted} declare no \`path:\` and have no sources on disk, so it was skipped.`,
    `  A target without \`path:\` takes its sources from Sources/<target name> (or Source/, src/, srcs/). None of those directories exist in the module, so the generated package would point at nothing — usually a partial install, or a manifest naming targets whose sources live elsewhere.`,
    `  Reinstall ${packageName} first. If its layout is intentional, add an explicit \`path:\` to each target in its Package.swift, persist it with \`npx patch-package ${packageName}\`, and upstream it.`,
    `  Module path: ${moduleRoot}`,
  ].join('\n');
}

// Map, not an object: the kind comes from a dumped manifest, and an inherited key like
// "constructor" would otherwise resolve to a function.
const TARGET_KIND_PHRASES = new Map([
  ['binary', 'a binary target'],
  ['macro', 'a macro target'],
  ['plugin', 'a plugin target'],
  ['system', 'a system library target'],
  ['systemLibrary', 'a system library target'],
  ['test', 'a test target'],
  ['executable', 'an executable target'],
]);

const targetKindPhrase = (kind) => TARGET_KIND_PHRASES.get(kind) ?? 'not a source target';

/**
 * The module's manifest wires a source target to a target the generated package
 * cannot re-declare. Emitting the target without that dependency would compile and
 * fail at link time instead, with nothing naming the manifest that caused it.
 */
function renderUnsupportedTargetDependency({ podName, packageName, moduleRoot, dependencies }) {
  const wiring =
    dependencies.length === 1
      ? 'whose source target depends on a target'
      : 'whose source targets depend on targets';
  return [
    `error: Expo module "${packageName}" (pod ${podName}) ships a Package.swift ${wiring} the generated package cannot declare, so it was skipped.`,
    ...dependencies.map(
      ({ target, dependsOn, kind }) =>
        `      target "${target}" depends on "${dependsOn}", ${targetKindPhrase(kind)}`
    ),
    `  The generated package mirrors only the module's regular source targets. A target of any other kind is built by Swift Package Manager from the module's own manifest, so the generated package has nothing to depend on. Emitting the target without that dependency would compile and then fail at link time with undefined symbols, far from the manifest that declared it.`,
    `  Add an spm.config.json to ${packageName} so the Expo prebuild pipeline builds the whole module into an XCFramework instead — it compiles the package as checked in, these targets included. packages/expo-sensors is a worked example.`,
    `  If you do not own ${packageName}, persist that file with \`npx patch-package ${packageName}\` and commit the patch — node_modules is not committed, so without it this error returns on every fresh install and in CI.`,
    `  Module path: ${moduleRoot}`,
  ].join('\n');
}

function renderNeedsManifestForLinkage({ podName, packageName, moduleRoot, file, line, snippet }) {
  return [
    `error: Expo module "${packageName}" (pod ${podName}) declares native linkage in its podspec, which the Swift Package Manager plugin does not read, so it was skipped.`,
    `  ${file}:${line} declares it:`,
    `      ${snippet}`,
    `  A podspec is Ruby: reading it without running it means guessing, and a guessed link line does not fail here — it fails in a shipped app with a missing symbol. Swift Package Manager needs the linkage stated exactly.`,
    `  Add a Package.swift to ${packageName} declaring the module's target with \`linkerSettings: [.linkedFramework("Photos"), .linkedLibrary("sqlite3")]\` — the plugin mirrors those verbatim. Or add an spm.config.json, so the Expo prebuild pipeline builds the module into an XCFramework instead. packages/expo-constants shows the shape of a checked-in Package.swift, though it declares no linkage of its own; packages/expo-sensors is a worked spm.config.json.`,
    `  If you do not own ${packageName}, persist that file with \`npx patch-package ${packageName}\` and commit the patch — node_modules is not committed, so without it this error returns on every fresh install and in CI.`,
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
  'unresolvable-target-path': renderUnresolvableTargetPath,
  'unsupported-target-dependency': renderUnsupportedTargetDependency,
  'needs-manifest-for-linkage': renderNeedsManifestForLinkage,
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

/**
 * Modules that ARE emitted but set linker flags in their podspec xcconfig. Swift
 * autolinks what its sources import, so these are usually redundant; when one is not,
 * the link error is what points here.
 */
function renderXcconfigLinkerWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, podName, file, line, snippet }) =>
      [
        `warning: Expo module "${packageName}" (pod ${podName}) sets linker flags in its podspec xcconfig, which the Swift Package Manager plugin does not read:`,
        `      ${file}:${line}: ${snippet}`,
        `  The module is built anyway — Swift links the system frameworks and the C++ runtime its sources import, so these flags are usually redundant outside CocoaPods.`,
        `  If it fails to link, declare what is missing in a Package.swift for the module — \`linkerSettings: [.linkedLibrary("c++"), .linkedFramework("Photos")]\` — which the plugin mirrors verbatim.`,
      ].join('\n')
    )
    .join('\n\n');
}

/**
 * Two installed copies of one module. The sync does not fail: the plugin builds
 * one copy while the app imports the other, so the warning is the only place the
 * mismatch is visible.
 */
function renderRootConflictWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, moduleRoot, autolinkedRoot }) =>
      [
        `warning: Expo module "${packageName}" is installed twice, so its native code and your JavaScript can come from different copies of the package:`,
        `      built by this plugin: ${moduleRoot}`,
        `      imported by your app: ${autolinkedRoot}`,
        `  Both are real directories, not one directory reached through a symlink, so the copies can be different versions. The plugin builds the first one; your app's JavaScript imports the second. When the two disagree it usually surfaces at runtime, as a missing method or "Cannot find native module" — and two copies of different versions can fail the build instead.`,
        `  Run \`npm ls ${packageName}\` (or \`yarn why\` / \`pnpm why\`) to find what pulls in the second copy, deduplicate it with \`npm dedupe\` (or \`yarn dedupe\` / \`pnpm dedupe\`), then re-run \`npx react-native spm update\`.`,
      ].join('\n')
    )
    .join('\n\n');
}

// Most specific ref first: CocoaPods accepts only one, and a pod that somehow
// carries two is best described by the one that pins a single commit.
const GIT_REFS = ['commit', 'tag', 'branch'];

// A pod's `source` is a custom spec repo, not the CocoaPods trunk. A git pod is
// identified by its ref rather than a version, and a local path pod by neither:
// CocoaPods takes that directory as it is.
function extraPodOrigin(pod) {
  const versioned = (origin) =>
    pod.version != null ? `${origin}, version ${pod.version}` : origin;
  if (pod.path != null) return `local path: ${pod.path}`;
  if (pod.git != null) {
    const ref = GIT_REFS.find((key) => pod[key] != null);
    return ref != null ? `git: ${pod.git}, ${ref} ${pod[ref]}` : versioned(`git: ${pod.git}`);
  }
  if (pod.podspec != null) return versioned(`podspec: ${pod.podspec}`);
  if (pod.source != null) return versioned(`spec repo: ${pod.source}`);
  return versioned('published pod');
}

/**
 * Pods the app adds for CocoaPods — `extraPods` in its config, which
 * expo-build-properties writes into Podfile.properties.json. `pod install`
 * installs them and this plugin does not, so this names them before the compile,
 * link or runtime failure that would otherwise be their first sign.
 */
function renderExtraPodsWarning(pods) {
  if (!pods.length) return '';
  const one = pods.length === 1;
  return [
    `warning: This app declares ${pods.length} extra CocoaPods ${one ? 'dependency' : 'dependencies'}, and the Swift Package Manager plugin does not install ${one ? 'it' : 'them'}:`,
    ...pods.map((pod) => `      ${pod.name} (${extraPodOrigin(pod)})`),
    `  ${one ? 'It comes' : 'They come'} from \`extraPods\` in your app config, which expo-build-properties writes into ios/Podfile.properties.json. The plugin reads that file — that is how ${one ? 'the pod is' : 'these pods are'} named here — but it contributes no CocoaPods dependency to the Swift Package Manager graph, whatever ${one ? 'it is' : 'they are'} installed from.`,
    `  Native code that imports ${one ? 'it' : 'one of them'} fails to compile or link. Code that reaches a pod at runtime instead — a class looked up by name, an Objective-C category, a bundled resource — builds and then fails on device, so a pod nothing imports is not necessarily unused.`,
    `  There is no Swift Package Manager route for ${one ? 'it' : 'them'} today. Add a Swift package providing the same code to your Xcode project and drop the \`extraPods\` entry, or keep this app on CocoaPods.`,
  ].join('\n');
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
  podspecDependencies,
  unmappedPodDependencies,
  collectUnmappedDependencies,
  collectRootConflicts,
  renderUnsupportedReport,
  renderUnmappedDependencyWarning,
  renderXcconfigLinkerWarning,
  renderRootConflictWarning,
  renderExtraPodsWarning,
  reportUnsupported,
};
