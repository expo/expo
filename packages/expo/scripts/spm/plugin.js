/**
 * Expo SwiftPM autolinking plugin (PREVIEW).
 *
 * Invoked by React Native's `react-native spm` tooling (add / update / build-time
 * sync) via the `spm.autolinkingPlugin` field in `expo/react-native.config.js`.
 * It contributes Expo's native modules into RN's SwiftPM autolinking graph, in
 * two forms:
 *
 *   - PRECOMPILED  — modules with built Debug + Release xcframeworks
 *     (ExpoModulesCore, ExpoModulesWorklets, …): declared to
 *     RN as paired dynamic frameworks. RN selects, links, embeds, and signs
 *     them outside SwiftPM. ExpoModulesJSI is the exception: an app build
 *     phase compiles it against the app's React Native.
 *   - SOURCE-BUILT — modules compiled from source (Expo, EXConstants, …):
 *     emitted as a source `Package.swift`. Pure-Swift modules are a single
 *     target; mixed Swift/ObjC modules need a checked-in Package.swift.
 *
 * SwiftPM receives only Expo's invariant source products and a compile-only
 * framework interface tree (headers/module interfaces, never Mach-O binaries).
 * The plugin returns DATA; RN owns the merge into its generated tree.
 *
 * React is referenced through `context.react` (the ReactDescriptor RN passes):
 * a single source of truth for the React package ref + the product set, so this
 * plugin never re-derives RN's package path / identity / product names.
 *
 * NOTE: RN invokes the plugin SYNCHRONOUSLY (`plugin(context)`, no await), so
 * everything shells out via `execFileSync` (see cli.js) rather than awaiting.
 *
 * The logic is split across sibling modules — cli.js (I/O), metadata.js (the
 * prebuilt-metadata document), classify.js (discovery), app-target.js (the app's
 * Xcode target), flavored-frameworks.js (precompiled frameworks),
 * react-descriptor.js + manifests.js (rendering),
 * podspec.js (podspec reading), autolink-gate.js (`autolinkWhen` gates),
 * script-phases.js (build script phases), diagnostics.js (errors and
 * warnings) — with unit tests in __tests__/. This file is just the orchestrator.
 */

'use strict';

const fs = require('fs');
const { createRequire } = require('module');
const path = require('path');

const { readPodfileProperties, resolveAppTarget } = require('./app-target');
const {
  autolinkConditionKey,
  autolinkConditionLabel,
  autolinkConditionMet,
} = require('./autolink-gate');
const { resolveExpoModules, generateModulesProvider } = require('./cli');
const {
  collectWatchPaths,
  documentedPackageRoot,
  findModuleRoot,
  moduleNeedsReact,
  scanAppleSources,
} = require('./classify');
const { configureSpmUpdateCommand, spmUpdateCommand } = require('./commands');
const {
  classifyUnsupported,
  collectDuplicatePods,
  collectRootConflicts,
  pluginError,
  realPathOrSelf,
  renderBuildFromSourceFallbackWarning,
  renderExtraPodsWarning,
  renderLeftOutCompanionWarning,
  renderPartlyProvidedPackageWarning,
  renderRootConflictWarning,
  renderUnmappedDependencyWarning,
  renderXcconfigLinkerWarning,
  reportUnsupported,
  BUILD_FROM_SOURCE_OPTION,
  rerunSpmUpdate,
  unmappedPodDependencies,
} = require('./diagnostics');
const {
  PRECOMPILED_SOURCE_KINDS,
  artifactBaseDirs,
  assertDistinctFlavoredFrameworks,
  assertHeadersMatchSources,
  byteOrder,
  frameworkSource,
  hasPrecompiledArtifact,
  headersXCFrameworkDirs,
  headersXCFrameworkSearchPaths,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveHeadersXCFramework,
  resolveHeadersXCFrameworkWithSource,
  resolveSpmDependencyFrameworks,
} = require('./flavored-frameworks');
const {
  dependsOnCoreHeaders,
  dumpModuleManifest,
  emitDirectPackage,
  prepareDirectWatchPaths,
} = require('./direct');
const {
  emitExpoModulesJSIHeadersPackage,
  emitPureSwiftSourcePackage,
  emitSourceManifestPackage,
} = require('./manifests');
const { readPrebuiltMetadata } = require('./metadata');
const { readPodspecFacts } = require('./podspec');
const { scriptPhasesForModules } = require('./script-phases');

const CORE_POD = 'ExpoModulesCore';
const CORE_PACKAGE = 'expo-modules-core';
const JSI_POD = 'ExpoModulesJSI';

/** npm name → autolinked root, only for roots still on disk. */
function collectAutolinkedRoots(autolinking) {
  const roots = new Map();
  for (const [packageName, dependency] of Object.entries(autolinking?.dependencies ?? {})) {
    if (dependency?.root != null && fs.existsSync(dependency.root)) {
      roots.set(packageName, dependency.root);
    }
  }
  return roots;
}

/**
 * Root: documented (if on disk) → autolinked → walk. The product name can differ from
 * the pod name (react-native-skia → RNSkia).
 *
 * `declaringRoot` is the root of the package that lists the pod: the document is keyed
 * by pod name, so it documents only one of two packages that list the same pod. A
 * podspec dir that is gone is its own declaring root, or two missing packages would
 * walk up to one ancestor and pass for one.
 */
function podIdentity(record, pod, packageName, autolinkedRoot, readModuleRoot) {
  const documentedRoot = documentedPackageRoot(record);
  const walkedRoot = autolinkedRoot ?? findModuleRoot(pod.podspecDir);
  const declaringRoot =
    autolinkedRoot == null && !fs.existsSync(pod.podspecDir) ? pod.podspecDir : walkedRoot;
  const moduleRoot = documentedRoot ?? walkedRoot;
  return {
    podName: pod.podName,
    packageName,
    documentedRoot,
    autolinkedRoot,
    declaringRoot,
    moduleRoot,
    productName: record?.productName ?? pod.podName,
    prebuildProduct:
      record != null ? { name: record.productName, sourceOnly: record.sourceOnly } : null,
    iosDeploymentTarget: record?.iosDeploymentTarget ?? null,
    spmPackages: record?.spmPackages ?? [],
    autolinkWhen: record?.autolinkWhen ?? null,
    sources: readModuleRoot.sources(moduleRoot),
    podspec: readPodspecFacts({ podName: pod.podName, podspecDir: pod.podspecDir, moduleRoot }),
  };
}

/** `read`, run at most once per module root: several pods can share one. */
function oncePerModuleRoot(read) {
  const results = new Map();
  return (moduleRoot) => {
    if (!results.has(moduleRoot)) results.set(moduleRoot, read(moduleRoot));
    return results.get(moduleRoot);
  };
}

/**
 * Every pod's identity, keyed by the pod, resolved once so every pass agrees on it.
 *
 * @param metadata `readPrebuiltMetadata()`: records by pod name.
 */
function resolvePodIdentities(modules, metadata, autolinkedRoots) {
  const readModuleRoot = { sources: oncePerModuleRoot(scanAppleSources) };
  const identities = new Map();
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      identities.set(
        pod,
        podIdentity(
          metadata.get(pod.podName),
          pod,
          mod.packageName,
          autolinkedRoots.get(mod.packageName),
          readModuleRoot
        )
      );
    }
  }
  return identities;
}

/**
 * `autolinkWhen` by package root, then product name (first entry wins). Read from the
 * document: autolinking never resolves a companion pod such as expo-camera's barcode scanner.
 */
function indexAutolinkConditions(metadata) {
  const byRoot = new Map();
  for (const { packageRoot, productName, autolinkWhen } of metadata.values()) {
    if (packageRoot == null) continue;
    const root = path.resolve(packageRoot);
    const products = byRoot.get(root) ?? new Map();
    byRoot.set(root, products);
    if (!products.has(productName)) products.set(productName, autolinkWhen);
  }
  return byRoot;
}

/**
 * The gate for one product of the module at `moduleRoot`, or null when it declares
 * none. A product no entry matches stays ungated: withholding one because a path
 * failed to line up would drop a module with no diagnostic at all.
 */
function productAutolinkCondition(autolinkConditions, moduleRoot, productName) {
  return autolinkConditions.get(path.resolve(moduleRoot))?.get(productName) ?? null;
}

/**
 * The gated products autolinking never resolves as a pod, by package root: companions
 * such as expo-camera's barcode scanner, which only a checked-in manifest links.
 */
function indexGatedCompanions(metadata, records) {
  const byRoot = new Map();
  for (const [podName, { packageRoot, productName, autolinkWhen }] of metadata) {
    if (autolinkWhen == null || packageRoot == null || records.has(podName)) continue;
    const root = path.resolve(packageRoot);
    byRoot.set(root, [...(byRoot.get(root) ?? []), { podName, productName, autolinkWhen }]);
  }
  return byRoot;
}

/**
 * Only a checked-in manifest's products have their autolinkWhen checked. A gated pod
 * linked any other way fails the sync whichever way its condition falls. Its module's
 * gated companions are left out, which differs from CocoaPods only where a companion's
 * condition is met. Such a companion fails the sync only when a Podfile property
 * decides it, because the app can switch that off; a pod or npm package condition is
 * met by what the app installs for its own reasons, so refusing it would block the app.
 *
 * @param linked the precompiled and pure-Swift records, in pass order.
 * @returns the `refusals` that fail the sync, and the `leftOutCompanions` to warn about.
 */
function uncheckedAutolinkConditions(linked, { gatedCompanions, manifestRoots, autolinkGate }) {
  const companionRootsSeen = new Set();
  const refusals = [];
  const leftOutCompanions = [];
  for (const { identity, linkedAs } of linked) {
    const { podName, packageName, moduleRoot, productName, autolinkWhen } = identity;
    const subject = { packageName, moduleRoot, precompiled: linkedAs === 'precompiled' };
    const refusal = { reason: 'unchecked-autolink-condition', ...subject };
    if (autolinkWhen != null) refusals.push({ ...refusal, podName, productName });
    const root = path.resolve(moduleRoot);
    if (manifestRoots.has(root) || companionRootsSeen.has(root)) continue;
    companionRootsSeen.add(root);
    for (const companion of gatedCompanions.get(root) ?? []) {
      if (!autolinkConditionMet(companion.autolinkWhen, autolinkGate)) continue;
      if (autolinkConditionKey(companion.autolinkWhen) === 'podfileProperty') {
        refusals.push({ ...refusal, ...companion, linkedThrough: podName });
      } else {
        leftOutCompanions.push({ ...subject, ...companion, linkedThrough: podName });
      }
    }
  }
  return { refusals, leftOutCompanions };
}

/**
 * The gated companions a checked-in manifest does not export, where their condition
 * is met: there CocoaPods would link them. Matched by real path, because a companion's
 * documented root and its module's root can reach one directory through different
 * symlinks.
 */
function companionsNotExportedByManifests(emitted, { gatedCompanions, autolinkGate }) {
  const companionsByRealRoot = new Map();
  for (const [root, companions] of gatedCompanions) {
    const realRoot = realPathOrSelf(root);
    companionsByRealRoot.set(realRoot, [
      ...(companionsByRealRoot.get(realRoot) ?? []),
      ...companions,
    ]);
  }
  return emitted
    .filter((r) => r.linkedAs === 'manifest')
    .flatMap(({ identity: { packageName, moduleRoot }, emission }) => {
      const exported = new Set(emission.productDeps.map((dep) => dep.name));
      return (companionsByRealRoot.get(realPathOrSelf(moduleRoot)) ?? [])
        .filter(
          (companion) =>
            !exported.has(companion.productName) &&
            autolinkConditionMet(companion.autolinkWhen, autolinkGate)
        )
        .map((companion) => ({
          reason: 'companion-not-exported-by-manifest',
          packageName,
          moduleRoot,
          ...companion,
        }));
    });
}

/**
 * A pod nothing covers, with every refusal that applies to it: those recorded at
 * its module root, if any, and what its identity alone says. `classifyUnsupported`
 * reports the most specific of them.
 */
function uncoveredPod(identity, ...refusals) {
  const { podName, packageName, moduleRoot, prebuildProduct, sources } = identity;
  const productName = prebuildProduct?.name ?? null;
  const prebuildable = prebuildProduct != null && !prebuildProduct.sourceOnly;
  const ownReport = {
    reason: sources.hasSources ? 'mixed-no-manifest' : 'no-apple-sources',
    productName,
  };
  const candidates = [
    ...refusals,
    prebuildable ? { reason: 'prebuild-available', productName } : null,
    ownReport,
  ];
  return { podName, packageName, moduleRoot, refusals: candidates.filter((r) => r != null) };
}

/**
 * What the passes decided for each pod, keyed by pod name: CocoaPods pod names are
 * unique, so a name two packages list is one pod. `linkedAs` is `'build-phase'`,
 * `'precompiled'`, `'manifest'`, `'pure-swift'` or null. ExpoModulesJSI starts as
 * `'build-phase'` (see `linkExpoModulesJSI`). A precompiled record carries its
 * `framework`; `linkPrecompiledPods` documents `buildFromSource`.
 */
function podRecords(identities) {
  const records = new Map();
  for (const identity of identities.values()) {
    if (!records.has(identity.podName)) {
      const linkedAs = identity.podName === JSI_POD ? 'build-phase' : null;
      records.set(identity.podName, { identity, linkedAs });
    }
  }
  return records;
}

/**
 * Before pass 1 — ExpoModulesJSI is never linked precompiled, whatever artifacts exist:
 * it must be compiled against the app's React Native, which the app's "Build
 * ExpoModulesJSI" phase does. Source packages compile against its headers package
 * instead. Returns that package's directory, or null when expo-modules-jsi is not
 * autolinked.
 */
function linkExpoModulesJSI(identities, outDir, cacheDir, appRoot) {
  const identity = [...identities.values()].find((i) => i.podName === JSI_POD);
  if (identity == null) return null;
  const { packageName, moduleRoot, productName } = identity;
  const headers = resolveHeadersXCFramework({ packageName, moduleRoot, productName, cacheDir });
  if (headers == null) {
    const searched = headersXCFrameworkDirs(packageName, moduleRoot);
    throw pluginError({
      what: `${productName}Headers.xcframework (or .tar.gz) was not found in ${searched.join(', ')}.`,
      why: `npm ships only the headers of ${productName}, because the framework must be compiled against the app's React Native: Swift packages compile against those headers, and the app's "Build ${productName}" phase builds the framework.`,
      how: `Reinstall ${packageName} with your package manager. From the Expo repository root, build the headers with \`node tools/bin/expotools.js prebuild ${packageName}\`.`,
    });
  }
  const builtRoot = buildPhaseJsiRoot(appRoot);
  assertHeadersMatchSources(headers, {
    packageName,
    productName,
    sourceRoots: builtRoot == null ? [moduleRoot] : [moduleRoot, builtRoot],
  });
  return emitExpoModulesJSIHeadersPackage(headers, outDir);
}

/**
 * The expo-modules-jsi the app's "Build ExpoModulesJSI" phase builds, resolved through expo and
 * expo-modules-core as its launcher in script-phases.js does. Null when that chain does not resolve.
 */
function buildPhaseJsiRoot(appRoot) {
  // Not `require.resolve(..., { paths })`: from inside the expo package, Node resolves `expo` to
  // this package itself, whatever the paths.
  const dir = (name, from) =>
    path.dirname(createRequire(path.join(from, 'package.json')).resolve(`${name}/package.json`));
  try {
    return dir('expo-modules-jsi', dir('expo-modules-core', dir('expo', appRoot)));
  } catch {
    return null;
  }
}

/**
 * The entry of the app's `buildFromSource` autolinking option that matches a pod, as
 * `{ entry, exact }`, or undefined. An entry is exact for a pod when it is, character for
 * character, the pod name or the npm package name. Any other entry is a pattern, matched as
 * CocoaPods matches it in `precompiled_modules.rb#build_from_source?`: a regular expression
 * that must match the whole pod name or npm package name. An exact entry wins over a pattern.
 * An exact entry for ExpoModulesCore fails the sync, because every source package compiles
 * against the precompiled one; a pattern matching it leaves it precompiled.
 */
function buildFromSourceMatcher(patterns) {
  const entries = patterns.map((pattern) => {
    try {
      return { pattern, expression: new RegExp(`^${pattern}$`) };
    } catch (error) {
      throw pluginError(
        {
          what: `The buildFromSource entry "${pattern}" in your app's Expo autolinking options is not a valid regular expression: ${error.message}.`,
          why: 'Each entry is matched as a regular expression against the pod name and the npm package name of every module, to choose the modules built from source instead of linked precompiled.',
          how: `Fix the entry in ${BUILD_FROM_SOURCE_OPTION}. ${rerunSpmUpdate()}`,
        },
        { cause: error }
      );
    }
  });
  const matchFor = ({ podName, packageName }) => {
    const exact = patterns.find((pattern) => pattern === podName || pattern === packageName);
    if (exact != null) return { entry: exact, exact: true };
    const pattern = entries.find(
      ({ expression }) => expression.test(podName) || expression.test(packageName)
    )?.pattern;
    return pattern != null ? { entry: pattern, exact: false } : undefined;
  };
  const coreMatch = matchFor({ podName: CORE_POD, packageName: CORE_PACKAGE });
  if (coreMatch?.exact) {
    const coreEntry = coreMatch.entry;
    throw pluginError({
      what: `The buildFromSource entry "${coreEntry}" in your app's Expo autolinking options matches ${CORE_POD} (${CORE_PACKAGE}), which Swift Package Manager cannot build from source.`,
      why: `Under Swift Package Manager, ${CORE_POD} is always linked precompiled: every Expo module built from source compiles against its precompiled interface.`,
      how: `Remove "${coreEntry}" from ${BUILD_FROM_SOURCE_OPTION}, or narrow it so it no longer matches ${CORE_POD} or ${CORE_PACKAGE}. ${rerunSpmUpdate()}`,
    });
  }
  return matchFor;
}

/**
 * Pass 1 — precompiled runtime frameworks. The declaration is all-or-nothing:
 * once one flavor exists, the resolver requires and prepares both before RN
 * receives the plugin result. No runtime binary enters the SwiftPM graph.
 * A pod name several packages list is looked up from each of them, in order,
 * until one has an artifact. A pod the app builds from source — buildFromSource matches
 * the pod or any package that lists it, an exact entry for any of them winning — is never
 * linked precompiled, unless it is one of `fallbackPods`; when it has an artifact, its
 * record keeps the `buildFromSource` match, so a pattern can fall back and an exact entry
 * be reported should no source route take it. A fallback pod whose artifact does not resolve
 * keeps its match too, marked `precompiledIncomplete`. Returns the records it linked, in that
 * order.
 *
 * @param matchBuildFromSource `buildFromSourceMatcher`'s result.
 * @param fallbackPods the matching pattern by pod name, for each pod linked precompiled though
 *   a pattern matches it.
 */
function linkPrecompiledPods(identities, records, cacheDir, matchBuildFromSource, fallbackPods) {
  const matchesByPod = new Map();
  for (const identity of identities.values()) {
    if (fallbackPods.has(identity.podName)) continue;
    const match = matchBuildFromSource(identity);
    const known = matchesByPod.get(identity.podName);
    if (match != null && (known == null || (match.exact && !known.exact))) {
      matchesByPod.set(identity.podName, match);
    }
  }
  const linked = [];
  for (const identity of identities.values()) {
    const record = records.get(identity.podName);
    if (record.linkedAs != null) continue;
    const lookup = {
      packageName: identity.packageName,
      moduleRoot: identity.moduleRoot,
      frameworkName: identity.productName,
    };
    const match = matchesByPod.get(identity.podName);
    if (match != null) {
      if (record.buildFromSource == null && hasPrecompiledArtifact(lookup)) {
        record.buildFromSource = match;
      }
      continue;
    }
    const framework = resolveFlavoredFramework({ ...lookup, cacheDir });
    if (framework == null) {
      if (fallbackPods.has(identity.podName)) {
        const entry = fallbackPods.get(identity.podName);
        record.buildFromSource = { entry, exact: false, precompiledIncomplete: true };
      }
      continue;
    }
    Object.assign(record, { identity, linkedAs: 'precompiled', framework });
    linked.push(record);
  }
  return linked;
}

const SOURCE_LABELS = {
  env: 'EXPO_PRECOMPILED_MODULES_PATH',
  monorepo: 'the Expo monorepo prebuild output',
  bundled: 'its npm package',
};

const describeSource = (source) => `${SOURCE_LABELS[source.kind]} (${source.dir})`;

/**
 * Compares the kind of place, not the directory: every package has its own directory in
 * each of them. Returns the `pluginError` parts describing the mix, or null when there is
 * none.
 *
 * @param subjects `{ label, packageName, source }` for each precompiled artifact to check.
 */
function mixedSourcesReport(coreSource, subjects) {
  const mixed = subjects.filter((subject) => subject.source?.kind !== coreSource?.kind);
  if (mixed.length === 0) return null;
  const packages = [...new Set(mixed.map((subject) => subject.packageName))].join(' ');
  return {
    what: `${mixed
      .map(
        (subject) =>
          `${subject.label} (${subject.packageName}) comes from ${describeSource(subject.source)}`
      )
      .join('; ')}, but ExpoModulesCore comes from ${describeSource(coreSource)}.`,
    why: 'Precompiled Expo modules, and the headers Expo modules compile against, are bound to the exact ExpoModulesCore build they were made with, so mixing builds from different places can crash the app at launch on a missing symbol.',
    how: `Take every precompiled module from one place: unset EXPO_PRECOMPILED_MODULES_PATH if it is set; from the Expo repository root, build the packages into the same place as ExpoModulesCore with \`node tools/bin/expotools.js prebuild ${packages}\`; otherwise reinstall your JavaScript dependencies so every package uses the build it ships. ${rerunSpmUpdate()}`,
  };
}

/**
 * The ExpoModulesCore headers xcframework, for direct modules to compile against. It must
 * come from the same kind of place as the ExpoModulesCore binary.
 */
function resolveCoreHeaders(core, coreSource, cacheDir) {
  const { packageName, moduleRoot, productName } = core;
  const lookup = { packageName, moduleRoot, productName };
  const lookupRank = (source) => PRECOMPILED_SOURCE_KINDS.indexOf(source.kind);
  const builtLocally = coreSource?.kind === 'env' || coreSource?.kind === 'monorepo';
  // Headers past the place a local ExpoModulesCore build comes from cannot match it, so the
  // lookup ends there: a broken copy further on would fail first, with advice that cannot
  // fix the missing headers. No headers up to that place mean the build produced none.
  const headers = resolveHeadersXCFrameworkWithSource({
    ...lookup,
    cacheDir,
    lastKind: builtLocally ? coreSource.kind : undefined,
  });
  if (builtLocally && (headers == null || lookupRank(headers.source) > lookupRank(coreSource))) {
    const prebuild = '`node tools/bin/expotools.js prebuild expo-modules-core expo-modules-jsi`';
    throw pluginError({
      what: `${productName}Headers.xcframework is missing under ${coreSource.dir}, where ${productName} comes from (${SOURCE_LABELS[coreSource.kind]}).`,
      why: `Expo modules built from their own Package.swift compile against these headers, and the headers must come from the same build as ${productName}. That build did not produce them.`,
      how:
        coreSource.kind === 'env'
          ? `Unset EXPO_PRECOMPILED_MODULES_PATH, or point it at a directory that holds a complete prebuild of expo-modules-core and expo-modules-jsi, including their headers. ${rerunSpmUpdate()}`
          : `From the Expo repository root, run ${prebuild}. ${rerunSpmUpdate()}`,
    });
  }
  if (headers == null) {
    throw pluginError({
      what: `Expo modules built from their own Package.swift compile against ${productName}Headers.xcframework, which was not found (searched ${headersXCFrameworkSearchPaths(lookup).join(', ')}).`,
      why: `The installed ${packageName} was published without a headers xcframework, or the local prebuild has not produced it yet.`,
      how: `From the Expo repository root, run \`node tools/bin/expotools.js prebuild ${packageName}\`. Otherwise upgrade ${packageName} to a version that ships a headers xcframework. ${rerunSpmUpdate()}`,
    });
  }
  const mixed = mixedSourcesReport(coreSource, [
    { label: `${productName}Headers.xcframework`, packageName, source: headers.source },
  ]);
  if (mixed != null) throw pluginError(mixed);
  return headers.xcframework;
}

/**
 * Emits the source package of the module whose first pod is `identity`: its checked-in
 * manifest as it stands when that depends on ExpoModulesCoreHeaders (`direct` is then
 * set), else that manifest mirrored, or else one Swift target over its sources. A
 * pure-Swift module is refused when its podspec declares linkage, because the
 * emitted package would link less than the podspec does. Returns null for a module
 * with no sources: the pod's own `no-apple-sources` report covers it.
 *
 * @param dumpManifest `dumpModuleManifest`, run at most once per real module root.
 */
function emitSourceModule(identity, hasManifest, emitContext, dumpManifest) {
  const { moduleRoot, packageName, podName, iosDeploymentTarget, spmPackages, sources, podspec } =
    identity;
  if (hasManifest) {
    const { json, manifest } = dumpManifest(moduleRoot, packageName);
    if (!dependsOnCoreHeaders(manifest)) {
      return emitSourceManifestPackage(moduleRoot, emitContext, json);
    }
    const emission = emitDirectPackage({
      moduleRoot,
      packageName,
      outDir: emitContext.outDir,
      coreHeadersXCFramework: emitContext.coreHeadersXCFramework,
      jsiHeadersPkgPath: emitContext.jsiHeadersPkgPath,
      macroTool: emitContext.macroTool,
      manifest,
    });
    return { ...emission, direct: true };
  }
  if (podspec.linkage != null) {
    return { refusal: { reason: 'needs-manifest-for-linkage', ...podspec.linkage } };
  }
  if (!sources.hasSources) return null;
  return emitPureSwiftSourcePackage(
    { moduleRoot, product: podName, iosDeploymentTarget, spmPackages, sources },
    emitContext
  );
}

/**
 * Pass 2 — invariant source modules. They compile against the generated
 * headers/module-interface tree and leave runtime linking entirely to RN.
 *
 * @param emitContext what every emitted package is generated against.
 * @param dumpManifest `manifestDumper`'s result.
 * @returns `emitted`, one `{ identity, linkedAs, direct, emission }` per package it emitted,
 *   in emission order, `identity` being the pod it was emitted for and `direct` whether a
 *   checked-in manifest is built as it stands; and `refusals`, by
 *   module root and then reason, each a function from an uncovered pod's identity to
 *   its refusal.
 */
function linkSourceModules(modules, identities, records, emitContext, dumpManifest) {
  const emitted = [];
  const refusals = new Map();
  // What the branches below read comes from the first pod's module root, so a
  // refusal they record applies to every uncovered pod at that root, whichever
  // package lists it.
  const refuse = (root, reason, refusalFor) =>
    refusals.set(root, (refusals.get(root) ?? new Map()).set(reason, refusalFor));
  const linkedAs = (identity) => records.get(identity.podName).linkedAs;
  const manifestProductsByRoot = new Map();
  for (const mod of modules) {
    const pods = (mod.pods ?? []).map((pod) => identities.get(pod));
    if (!pods.length || pods.every(linkedAs)) continue;

    const [first] = pods;
    const { moduleRoot, sources } = first;
    const hasManifest = fs.existsSync(path.join(moduleRoot, 'Package.swift'));

    const precompiledSiblings = pods.filter((p) => linkedAs(p) === 'precompiled');
    if (precompiledSiblings.length > 0 && (hasManifest || sources.pureSwift)) {
      // Both source branches build the whole module, so emitting it would link
      // the precompiled pods a second time, from source.
      const siblings = {
        precompiledSiblings: precompiledSiblings.map((p) => p.podName),
        precompiledProducts: precompiledSiblings.map((p) => p.productName),
        artifactDirs: artifactBaseDirs(mod.packageName, moduleRoot),
      };
      refuse(moduleRoot, 'partially-precompiled', (p) => ({
        reason: 'partially-precompiled',
        ...siblings,
        prebuildProduct: p.prebuildProduct,
      }));
      continue;
    }
    // A manifest is emitted once, by whichever listing reaches it first; every listing
    // then links the pods whose product it exports, so the order they come in decides
    // nothing.
    const realRoot = hasManifest ? fs.realpathSync(moduleRoot) : null;
    let manifestProducts = manifestProductsByRoot.get(realRoot);
    if (manifestProducts == null) {
      // Only this pod is built; siblings must stay pending to be diagnosed.
      const covered = hasManifest ? pods : [first];
      if (covered.some(linkedAs)) continue;
      // A module with no sources at all scans as pure Swift too, so it reaches
      // emitSourceModule for the podspec linkage check that outranks it.
      if (!hasManifest && !sources.pureSwift) continue;

      const emission = emitSourceModule(first, hasManifest, emitContext, dumpManifest);
      if (emission == null) continue;
      const { refusal, ok, direct = false } = emission;
      if (refusal != null) {
        refuse(moduleRoot, refusal.reason, () => refusal);
        continue;
      }
      const kind = hasManifest ? 'manifest' : 'pure-swift';
      emitted.push({ identity: first, linkedAs: kind, direct, emission: ok });
      if (!hasManifest) {
        Object.assign(records.get(first.podName), { identity: first, linkedAs: kind });
        continue;
      }
      manifestProducts = new Set(ok.productDeps.map((dep) => dep.name));
      manifestProductsByRoot.set(realRoot, manifestProducts);
    }
    for (const p of pods) {
      if (linkedAs(p)) continue;
      if (manifestProducts.has(p.productName)) {
        Object.assign(records.get(p.podName), { identity: p, linkedAs: 'manifest' });
      } else {
        refuse(moduleRoot, 'not-exported-by-manifest', (u) => ({
          reason: 'not-exported-by-manifest',
          productName: u.productName,
          exportedProducts: [...manifestProducts],
        }));
      }
    }
  }
  return { emitted, refusals };
}

/** `dumpModuleManifest`, run at most once per real module root. */
function manifestDumper() {
  // By real path: listings can reach one manifest through different symlinks.
  const dumpsByRealRoot = new Map();
  return (moduleRoot, packageName) => {
    const realRoot = fs.realpathSync(moduleRoot);
    if (!dumpsByRealRoot.has(realRoot)) {
      dumpsByRealRoot.set(realRoot, dumpModuleManifest(moduleRoot, packageName));
    }
    return dumpsByRealRoot.get(realRoot);
  };
}

/**
 * Both passes, over fresh pod records, with the pods in `fallbackPods` linked precompiled
 * though a buildFromSource pattern matches them.
 *
 * @param sourceContext `{ react, outDir, codegenPkgPath, jsiHeadersPkgPath }`: what every
 *   emitted package is generated against, besides what pass 1 decides.
 */
function linkPasses(
  fallbackPods,
  { modules, identities, cacheDir, matchBuildFromSource, dumpManifest, sourceContext }
) {
  const records = podRecords(identities);
  const precompiled = linkPrecompiledPods(
    identities,
    records,
    cacheDir,
    matchBuildFromSource,
    fallbackPods
  );
  // The SwiftPM packages those modules link ship as their own XCFrameworks, and
  // RN takes them in the same flat array. They join before the interface tree is
  // built, so source modules compile against their headers too.
  const dependencyFrameworks = resolveSpmDependencyFrameworks(
    precompiled.map(({ identity: { podName, moduleRoot, spmPackages } }) => ({
      podName,
      moduleRoot,
      spmDependencies: spmPackages.map((pkg) => pkg.productName),
    }))
  );
  const flavoredFrameworks = [...precompiled.map((r) => r.framework), ...dependencyFrameworks].sort(
    (a, b) => byteOrder(a.id, b.id)
  );
  assertDistinctFlavoredFrameworks(flavoredFrameworks);
  const coreRecord = precompiled.find((r) => r.identity.podName === CORE_POD) ?? null;
  const coreSource = coreRecord && frameworkSource(coreRecord.framework);
  const satisfiedDependencies = new Set(dependencyFrameworks.map((f) => f.frameworkName));
  const frameworkSearchPath =
    precompiled.length > 0
      ? prepareCompileInterfaces(
          flavoredFrameworks,
          path.join(sourceContext.outDir, 'compile-interfaces')
        )
      : null;

  const core = coreRecord?.identity ?? null;
  const coreAvailable = core != null && frameworkSearchPath != null;
  let sourceModules = { emitted: [], refusals: new Map() };
  if (coreAvailable) {
    let resolvedMacroFlags = null;
    let resolvedCoreHeadersXCFramework = null;
    sourceModules = linkSourceModules(
      modules,
      identities,
      records,
      {
        ...sourceContext,
        frameworkSearchPath,
        minimumIosDeploymentTarget: core.iosDeploymentTarget,
        satisfiedDependencies,
        // Every emitted target may use the macros (CocoaPods' "is core or depends on core" gate).
        // Lazy: an install that emits no source package needs no macro plugin.
        get macroFlags() {
          return (resolvedMacroFlags ??= macroPluginFlags(core.moduleRoot));
        },
        get macroTool() {
          return macroPluginTool(core.moduleRoot);
        },
        // Lazy: only a direct module needs the headers, and only then must they exist.
        get coreHeadersXCFramework() {
          return (resolvedCoreHeadersXCFramework ??= resolveCoreHeaders(
            core,
            coreSource,
            cacheDir
          ));
        },
      },
      dumpManifest
    );
  }
  return {
    records,
    precompiled,
    flavoredFrameworks,
    coreRecord,
    coreSource,
    satisfiedDependencies,
    coreAvailable,
    sourceModules,
  };
}

/**
 * Removes the packages an earlier round of `linkPasses` emitted that the last round did not,
 * so no package the sync dropped is left beside the ones it links.
 *
 * @param emittedByRound `sourceModules.emitted` of each round, the last round last.
 */
function removeDiscardedEmissions(emittedByRound) {
  const packagePath = ({ emission }) => emission.packageDep.path;
  const kept = new Set(emittedByRound.at(-1).map(packagePath));
  for (const discarded of new Set(emittedByRound.slice(0, -1).flat().map(packagePath))) {
    if (!kept.has(discarded)) fs.rmSync(discarded, { recursive: true, force: true });
  }
}

/**
 * The emitted products React Native links, and a label for each one an unmet
 * `autolinkWhen` condition withholds. Only a checked-in manifest's products are
 * checked: its emitted package keeps every target, and a withheld product is simply
 * never depended on, so SwiftPM never builds it.
 */
function gateProducts(emitted, autolinkConditions, autolinkGate) {
  const productDependencies = [];
  const gatedOffProducts = [];
  for (const { identity, linkedAs, emission } of emitted) {
    for (const dep of emission.productDeps) {
      const condition =
        linkedAs === 'manifest'
          ? productAutolinkCondition(autolinkConditions, identity.moduleRoot, dep.name)
          : null;
      if (condition != null && !autolinkConditionMet(condition, autolinkGate)) {
        gatedOffProducts.push(
          `${dep.name} (${autolinkConditionLabel(condition) ?? 'unrecognized condition'})`
        );
      } else {
        productDependencies.push(dep);
      }
    }
  }
  return { productDependencies, gatedOffProducts };
}

/**
 * Everything that follows from the pod records once both passes ran: the source
 * packages and products React Native links, the pods nothing covers, the
 * diagnostics, and what each pass linked. Each check runs once per pod, in pass
 * order — the precompiled pods, then the modules pass 2 emitted. `precompiled` is
 * what `linkPrecompiledPods` returned; `emitted` and `refusals` are what
 * `linkSourceModules` returned; `gatedCompanions` is what `indexGatedCompanions` returned.
 *
 * @param satisfiedDependencies the SwiftPM packages already declared as frameworks.
 */
function summarizeRecords(
  records,
  {
    precompiled,
    emitted,
    refusals,
    react,
    satisfiedDependencies,
    autolinkConditions,
    gatedCompanions,
    autolinkGate,
  }
) {
  const pureSwift = emitted.filter((r) => r.linkedAs === 'pure-swift');
  const refusalsFor = (identity) =>
    [...(refusals.get(identity.moduleRoot)?.values() ?? [])].map((refusalFor) =>
      refusalFor(identity)
    );
  const pending = [...records.values()]
    .filter((r) => r.linkedAs == null)
    .map(({ identity, buildFromSource }) => ({
      ...uncoveredPod(identity, ...refusalsFor(identity)),
      buildFromSourceEntry: buildFromSource?.entry,
      precompiledIncomplete: buildFromSource?.precompiledIncomplete,
    }));

  // What the resolved dependencies already carry is not uncovered, their subspecs
  // included.
  const unmappedDeps = [...precompiled, ...emitted]
    .map((record) => ({
      packageName: record.identity.packageName,
      podName: record.identity.podName,
      pods: unmappedPodDependencies(
        record.identity.podspec.dependencies,
        new Set([...satisfiedDependencies, ...(record.emission?.spmProductNames ?? [])])
      ),
    }))
    .filter((entry) => entry.pods.length > 0);
  const unchecked = uncheckedAutolinkConditions([...precompiled, ...pureSwift], {
    gatedCompanions,
    manifestRoots: new Set(
      emitted
        .filter((r) => r.linkedAs === 'manifest')
        .map((r) => path.resolve(r.identity.moduleRoot))
    ),
    autolinkGate,
  });
  const unexportedCompanions = companionsNotExportedByManifests(emitted, {
    gatedCompanions,
    autolinkGate,
  });
  const xcconfigLinkage = pureSwift
    .filter(({ identity }) => identity.podspec.linkerFlags != null)
    .map(({ identity }) => ({
      packageName: identity.packageName,
      podName: identity.podName,
      ...identity.podspec.linkerFlags,
    }));

  const reactWired = [
    ...precompiled.filter(({ identity }) => moduleNeedsReact(identity.podName, identity.sources)),
    ...(react != null ? emitted : []),
  ];
  const podNames = (list) => list.map((r) => r.identity.podName);
  const packageNames = (list) => list.map((r) => r.identity.packageName);
  const fromManifests = emitted.filter((r) => r.linkedAs === 'manifest');

  return {
    packageDependencies: emitted.map((r) => r.emission.packageDep),
    ...gateProducts(emitted, autolinkConditions, autolinkGate),
    pending,
    uncheckedConditions: unchecked.refusals,
    leftOutCompanions: unchecked.leftOutCompanions,
    unexportedCompanions,
    unmappedDeps,
    partlyProvidedPackages: emitted.flatMap(({ identity: { packageName, moduleRoot }, emission }) =>
      emission.partlyProvidedPackages.map((pkg) => ({ packageName, moduleRoot, ...pkg }))
    ),
    xcconfigLinkage,
    precompiledPods: podNames(precompiled),
    manifestPackages: packageNames(fromManifests),
    directPackages: packageNames(fromManifests.filter((r) => r.direct)),
    pureSwiftPods: podNames(pureSwift),
    reactWiredPods: podNames(reactWired),
  };
}

/**
 * The staleness inputs (`watchPaths` plugin contract) whose edits must trip RN's
 * in-build re-sync: each module's checked-in Package.swift and
 * expo-module.config.json, which drive the generated packages and module
 * resolution; and the registry's app-target inputs — app groups come from the
 * entitlements file, inline-module registration from Podfile.properties.json.
 * Known gap: repointing CODE_SIGN_ENTITLEMENTS at a different file is not noticed,
 * because that would mean watching project.pbxproj — which RN rewrites during the
 * sync itself.
 */
function watchPaths(identities, { entitlementPath, podfilePropertiesPath }) {
  const moduleRoots = new Set([...identities.values()].map((identity) => identity.moduleRoot));
  return [
    ...collectWatchPaths([...moduleRoots]),
    ...[entitlementPath, podfilePropertiesPath].filter((p) => p != null),
  ];
}

// Swift macros need the prebuilt plugin executable; mirrors
// project_integrator.rb#resolve_macros_plugin_dir.
// It declares no SwiftPM products, so it travels as a compiler flag, not a dependency.
function macroPluginTool(coreModuleRoot) {
  const macroPluginFault = (
    what,
    missing,
    how = 'Reinstall your JavaScript dependencies and build again.'
  ) => ({
    what,
    why: `Expo modules are compiled from source here, and their Swift macros cannot expand without ${missing} — the build would fail with "external macro implementation could not be found".`,
    how,
  });
  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve('expo-modules-macros/package.json', {
      paths: [coreModuleRoot],
    });
  } catch (error) {
    throw pluginError(
      macroPluginFault(
        `Could not resolve "expo-modules-macros" from ${coreModuleRoot}.`,
        'this plugin',
        '"expo-modules-core" must be a version that depends on "expo-modules-macros", the new name of "@expo/expo-modules-macros-plugin". Run `npx expo install --fix` to align the Expo package versions, then build again.'
      ),
      { cause: error }
    );
  }
  const tool = path.join(path.dirname(pkgJsonPath), 'apple', 'ExpoModulesMacros');
  if (!fs.existsSync(tool)) {
    throw pluginError(
      macroPluginFault(`The Expo Swift macro plugin is missing its executable at ${tool}.`, 'it')
    );
  }
  return tool;
}

function macroPluginFlags(coreModuleRoot) {
  const tool = macroPluginTool(coreModuleRoot);
  return ['-Xfrontend', '-load-plugin-executable', '-Xfrontend', `${tool}#ExpoModulesMacros`];
}

/** The app's react-native: the root React Native passes, or else the one the app resolves. */
function appReactNativeRoot(context, appRoot) {
  if (typeof context.reactNativeRoot === 'string') return context.reactNativeRoot;
  try {
    return path.dirname(require.resolve('react-native/package.json', { paths: [appRoot] }));
  } catch {
    return null;
  }
}

module.exports = function expoSpmPlugin(context) {
  const { autolinking, react, outputDir } = context;
  // `context.appRoot` is the Xcode project dir (`<app>/ios`); the autolinking
  // CLI's --app-root must be the app PACKAGE root, because
  // `generate-modules-provider` filters modules against that dir's package.json
  // dependencies and a dir without one matches nothing — a silently EMPTY
  // provider, with no Expo modules registering at runtime. RN's contract hands
  // us that root directly.
  const appRoot = context.projectRoot;
  configureSpmUpdateCommand({ appRoot, reactNativeRoot: appReactNativeRoot(context, appRoot) });
  const { modules, extraDependencies, buildFromSource = [] } = resolveExpoModules(appRoot);
  const matchBuildFromSource = buildFromSourceMatcher(buildFromSource);
  const metadata = readPrebuiltMetadata(appRoot);
  const autolinkedRoots = collectAutolinkedRoots(autolinking);
  const identities = resolvePodIdentities(modules, metadata, autolinkedRoots);
  // Before either pass: which copy of a pod the passes reached first depends on the
  // order the packages were autolinked in, so linking any of them would too.
  const duplicatePods = reportUnsupported(collectDuplicatePods(identities));
  if (duplicatePods != null) {
    throw duplicatePods;
  }
  const autolinkConditions = indexAutolinkConditions(metadata);
  // Read once so gating and registry agree.
  const appTarget = resolveAppTarget(context.appRoot);
  const autolinkGate = {
    // Every pod the install DECLARES, not the ones linked: a declared pod
    // CocoaPods links is a satisfied condition here too.
    declaredPodNames: new Set(metadata.keys()),
    // CocoaPods counts React Native's autolinked packages by key, root on disk or not.
    autolinkedPackages: new Set([
      ...modules.map((m) => m.packageName),
      ...Object.keys(autolinking?.dependencies ?? {}),
    ]),
    podfileProperties: readPodfileProperties(appTarget.podfilePropertiesPath),
  };
  const outDir = path.join(outputDir, 'expo');
  // The old contract generated mutable binaryTarget packages here. They are
  // invalid under automatic configuration selection and must never survive a
  // regeneration as apparent SwiftPM runtime products.
  fs.rmSync(path.join(outDir, 'expo-precompiled'), { recursive: true, force: true });
  const artifactCacheDir = path.join(context.appRoot, 'build', 'expo-xcframeworks');
  // The per-app React-GeneratedCode (codegen) package — RN's convention: <outputDir>/../ios.
  // Products like ReactAppHeaders live there, so any manifest wiring them must declare it.
  const codegenCandidate = path.resolve(outputDir, '..', 'ios');
  const codegenPkgPath = fs.existsSync(path.join(codegenCandidate, 'Package.swift'))
    ? codegenCandidate
    : null;

  const jsiHeadersPkgPath = linkExpoModulesJSI(identities, outDir, artifactCacheDir, appRoot);
  const passOptions = {
    modules,
    identities,
    cacheDir: artifactCacheDir,
    matchBuildFromSource,
    dumpManifest: manifestDumper(),
    sourceContext: { react, outDir, codegenPkgPath, jsiHeadersPkgPath },
  };
  // A pod a buildFromSource pattern matches is linked precompiled when no source route takes
  // it, as ExpoModulesCore never is. Linking one changes what pass 2 decides — a sibling pod's
  // route, the products already satisfied, the interface tree — so both passes run again until
  // no other pod falls back. Transitional: needed until every Expo module, ExpoModulesCore
  // included, has a checked-in Package.swift that SwiftPM can build from source.
  const fallbackEntries = new Map();
  const coreMatch = matchBuildFromSource({ podName: CORE_POD, packageName: CORE_PACKAGE });
  if (coreMatch != null) fallbackEntries.set(CORE_POD, coreMatch.entry);
  const emittedByRound = [];
  let passes;
  let fallingBack;
  do {
    passes = linkPasses(fallbackEntries, passOptions);
    emittedByRound.push(passes.sourceModules.emitted);
    fallingBack = [...passes.records.values()].filter(
      (r) =>
        r.linkedAs == null &&
        r.buildFromSource?.exact === false &&
        !fallbackEntries.has(r.identity.podName)
    );
    for (const { identity, buildFromSource } of fallingBack) {
      fallbackEntries.set(identity.podName, buildFromSource.entry);
    }
  } while (fallingBack.length > 0);
  removeDiscardedEmissions(emittedByRound);
  const {
    records,
    precompiled,
    flavoredFrameworks,
    coreRecord,
    coreSource,
    satisfiedDependencies,
    coreAvailable,
    sourceModules,
  } = passes;
  const mixedModules =
    coreRecord &&
    mixedSourcesReport(
      coreSource,
      precompiled
        .filter((r) => r !== coreRecord)
        .map(({ identity, framework }) => ({
          label: identity.productName,
          packageName: identity.packageName,
          source: frameworkSource(framework),
        }))
    );
  if (mixedModules != null) {
    const { what, why, how } = mixedModules;
    console.warn(`[expo-spm-plugin] WARNING: ${what} ${why} ${how}`);
  }

  // Anything still uncovered has no xcframework and no way to be built from
  // source. Report it and fail — dropping a module here would surface as a
  // runtime "Cannot find native module" instead of a build error.
  const summary = summarizeRecords(records, {
    precompiled,
    ...sourceModules,
    react,
    satisfiedDependencies,
    autolinkConditions,
    gatedCompanions: indexGatedCompanions(metadata, records),
    autolinkGate,
  });
  const logListed = (label, names) =>
    console.log(`[expo-spm-plugin] ${label} (${names.length}): ${names.join(', ') || '—'}`);
  logListed('built by an app build phase', jsiHeadersPkgPath != null ? [JSI_POD] : []);
  logListed('paired runtime frameworks', summary.precompiledPods);
  logListed('source via checked-in manifest', summary.manifestPackages);
  logListed('source via direct checked-in manifest', summary.directPackages);
  logListed('source pure-Swift', summary.pureSwiftPods);
  logListed('React wired into', summary.reactWiredPods);
  logListed('gated off', summary.gatedOffProducts);
  logListed(
    'not supported',
    summary.pending.map((p) => p.podName)
  );
  const fellBack = precompiled
    .filter((r) => fallbackEntries.has(r.identity.podName))
    .map(({ identity: { podName, packageName } }) => ({
      podName,
      packageName,
      entry: fallbackEntries.get(podName),
    }));
  if (fellBack.length > 0) {
    console.warn(renderBuildFromSourceFallbackWarning(fellBack));
  }
  if (summary.unmappedDeps.length > 0) {
    console.warn(renderUnmappedDependencyWarning(summary.unmappedDeps));
  }
  if (summary.partlyProvidedPackages.length > 0) {
    console.warn(renderPartlyProvidedPackageWarning(summary.partlyProvidedPackages));
  }
  if (summary.xcconfigLinkage.length > 0) {
    console.warn(renderXcconfigLinkerWarning(summary.xcconfigLinkage));
  }
  if (summary.leftOutCompanions.length > 0) {
    console.warn(renderLeftOutCompanionWarning(summary.leftOutCompanions));
  }
  const rootConflicts = collectRootConflicts(identities);
  if (rootConflicts.length > 0) {
    console.warn(renderRootConflictWarning(rootConflicts));
  }
  if (extraDependencies.length > 0) {
    console.warn(renderExtraPodsWarning(extraDependencies));
  }
  if (react == null) {
    console.warn(
      '[expo-spm-plugin] WARNING: context.react is null — no React dependency available.'
    );
  }

  const unsupported = reportUnsupported([
    ...classifyUnsupported({ pending: summary.pending, coreAvailable }),
    ...summary.uncheckedConditions,
    ...summary.unexportedCompanions,
  ]);
  if (unsupported != null) {
    throw unsupported;
  }

  // ExpoModulesProvider.swift — the module registry. Written to a stable path and
  // returned in `generatedSources`; the APP target must compile it (add it to the app's
  // Compile Sources — an `expo prebuild` template does this). It can't live in RN's static
  // AutolinkedAggregate target: an @objc class there isn't registered in the ObjC runtime's
  // classlist (static lib, name-only lookup via NSClassFromString), so the registry would be
  // empty. In the app's main module the class always registers, matching CocoaPods
  // `use_expo_modules!` (which adds ExpoModulesProvider.swift to the app target).
  const generatedSources = [];
  let providerPath;
  try {
    providerPath = generateModulesProvider({
      appRoot,
      outDir,
      moduleNames: modules.map((m) => m.packageName),
      targetName: appTarget.targetName,
      entitlementPath: appTarget.entitlementPath,
      podfilePropertiesPath: appTarget.podfilePropertiesPath,
    });
  } catch (error) {
    throw new Error(
      [
        `Generating ExpoModulesProvider.swift for ${appRoot} failed: ${error.message}`,
        '  That file is the registry every Expo native module is looked up through, so without it the app builds and then fails at launch with "Cannot find native module".',
        `  The message above comes from \`expo-modules-autolinking generate-modules-provider\`. Fix what it names — a module with an unreadable expo-module.config.json is the common cause — then re-run \`${spmUpdateCommand()}\`.`,
      ].join('\n'),
      { cause: error }
    );
  }
  if (providerPath == null && modules.length > 0) {
    throw new Error(
      [
        `The Expo module registry generator wrote no ExpoModulesProvider.swift to ${outDir}, although ${modules.length} Expo ${modules.length === 1 ? 'module' : 'modules'} resolved.`,
        '  Without that file no Expo native module is registered, and the app fails at launch with "Cannot find native module".',
        `  Re-run \`${spmUpdateCommand()}\`. If the file is still missing, report it at https://github.com/expo/expo/issues with the output of \`npx expo-modules-autolinking resolve --platform apple --json\` run in your app.`,
      ].join('\n')
    );
  }
  if (providerPath != null) {
    // An empty registry while modules resolved means the allowlist/app-root
    // filtering broke — the app would launch with NO Expo modules. Loud, not silent.
    const registered = (fs.readFileSync(providerPath, 'utf8').match(/\.self/g) ?? []).length;
    if (registered === 0 && modules.length > 0) {
      console.warn(
        `[expo-spm-plugin] WARNING: ExpoModulesProvider.swift is EMPTY although ` +
          `${modules.length} modules resolved (appRoot: ${appRoot}) — no Expo modules will register at runtime.`
      );
    }
    generatedSources.push({ path: providerPath });
    console.log(`[expo-spm-plugin] generated ExpoModulesProvider.swift → ${providerPath}`);
  }

  const scriptPhases = scriptPhasesForModules(modules.map((m) => m.packageName));
  if (scriptPhases.length > 0) {
    console.log(
      `[expo-spm-plugin] script phases (${scriptPhases.length}): ${scriptPhases.map((p) => p.id).join(', ')}`
    );
  }

  const directWatchPaths = prepareDirectWatchPaths(summary.directPackages, outDir);
  return {
    packageDependencies: summary.packageDependencies,
    productDependencies: summary.productDependencies,
    generatedSources,
    flavoredFrameworks,
    watchPaths: [...watchPaths(identities, appTarget), ...directWatchPaths],
    scriptPhases,
  };
};

module.exports.macroPluginFlags = macroPluginFlags;
module.exports.resolvePodIdentities = resolvePodIdentities;
module.exports.uncoveredPod = uncoveredPod;
