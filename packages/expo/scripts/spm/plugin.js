/**
 * Expo SwiftPM autolinking plugin (PREVIEW).
 *
 * Invoked by React Native's `react-native spm` tooling (add / update / build-time
 * sync) via the `spm.autolinkingPlugin` field in `expo/react-native.config.js`.
 * It contributes Expo's native modules into RN's SwiftPM autolinking graph, in
 * two forms:
 *
 *   - PRECOMPILED  — modules with built Debug + Release xcframeworks
 *     (ExpoModulesCore, ExpoModulesJSI, ExpoModulesWorklets, …): declared to
 *     RN as paired dynamic frameworks. RN selects, links, embeds, and signs
 *     them outside SwiftPM.
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
const path = require('path');

const { readPodfileProperties, resolveAppTarget } = require('./app-target');
const { autolinkConditionLabel, autolinkConditionMet } = require('./autolink-gate');
const { resolveExpoModules, generateModulesProvider } = require('./cli');
const {
  collectWatchPaths,
  documentedPackageRoot,
  findModuleRoot,
  moduleNeedsReact,
  scanAppleSources,
} = require('./classify');
const {
  classifyUnsupported,
  collectDuplicatePods,
  collectRootConflicts,
  pluginError,
  renderExtraPodsWarning,
  renderRootConflictWarning,
  renderUnmappedDependencyWarning,
  renderXcconfigLinkerWarning,
  reportUnsupported,
  unmappedPodDependencies,
} = require('./diagnostics');
const {
  artifactBaseDirs,
  assertDistinctFlavoredFrameworks,
  byteOrder,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveSpmDependencyFrameworks,
} = require('./flavored-frameworks');
const { emitSourceManifestPackage, emitPureSwiftSourcePackage } = require('./manifests');
const { readPrebuiltMetadata } = require('./metadata');
const { readPodspecFacts } = require('./podspec');
const { scriptPhasesForModules } = require('./script-phases');

const CORE_POD = 'ExpoModulesCore';

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
function podIdentity(record, pod, packageName, autolinkedRoot, scanSources) {
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
    sources: scanSources(moduleRoot),
    podspec: readPodspecFacts({ podName: pod.podName, podspecDir: pod.podspecDir, moduleRoot }),
  };
}

/**
 * Every pod's identity, keyed by the pod, resolved once so every pass agrees on it.
 *
 * @param metadata `readPrebuiltMetadata()`: records by pod name.
 */
function resolvePodIdentities(modules, metadata, autolinkedRoots) {
  const sourceScans = new Map();
  const scanSources = (moduleRoot) =>
    sourceScans.get(moduleRoot) ??
    sourceScans.set(moduleRoot, scanAppleSources(moduleRoot)).get(moduleRoot);
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
          scanSources
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
 * gated companions are left out, so each fails the sync only where its condition is
 * met: there CocoaPods would link it.
 *
 * @param linked the precompiled and pure-Swift records, in pass order.
 */
function uncheckedAutolinkConditions(linked, { gatedCompanions, manifestRoots, autolinkGate }) {
  const companionRootsSeen = new Set();
  return linked.flatMap(({ identity, linkedAs }) => {
    const { podName, packageName, moduleRoot, productName, autolinkWhen } = identity;
    const refusal = {
      reason: 'unchecked-autolink-condition',
      packageName,
      moduleRoot,
      precompiled: linkedAs === 'precompiled',
    };
    const own = autolinkWhen != null ? [{ ...refusal, podName, productName }] : [];
    const root = path.resolve(moduleRoot);
    if (manifestRoots.has(root) || companionRootsSeen.has(root)) return own;
    companionRootsSeen.add(root);
    const companions = (gatedCompanions.get(root) ?? [])
      .filter((companion) => autolinkConditionMet(companion.autolinkWhen, autolinkGate))
      .map((companion) => ({ ...refusal, ...companion, linkedThrough: podName }));
    return [...own, ...companions];
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
 * unique, so a name two packages list is one pod. `linkedAs` is `'precompiled'`,
 * `'manifest'`, `'pure-swift'` or null. A precompiled record carries its
 * `framework`.
 */
function podRecords(identities) {
  const records = new Map();
  for (const identity of identities.values()) {
    if (!records.has(identity.podName)) {
      records.set(identity.podName, { identity, linkedAs: null });
    }
  }
  return records;
}

/**
 * Pass 1 — precompiled runtime frameworks. The declaration is all-or-nothing:
 * once one flavor exists, the resolver requires and prepares both before RN
 * receives the plugin result. No runtime binary enters the SwiftPM graph.
 * A pod name several packages list is looked up from each of them, in order,
 * until one has an artifact. Returns the records it linked, in that order.
 */
function linkPrecompiledPods(identities, records, cacheDir) {
  const linked = [];
  for (const identity of identities.values()) {
    const record = records.get(identity.podName);
    if (record.linkedAs != null) continue;
    const framework = resolveFlavoredFramework({
      packageName: identity.packageName,
      moduleRoot: identity.moduleRoot,
      frameworkName: identity.productName,
      cacheDir,
    });
    if (framework == null) continue;
    Object.assign(record, { identity, linkedAs: 'precompiled', framework });
    linked.push(record);
  }
  return linked;
}

/**
 * Emits the source package of the module whose first pod is `identity`: its
 * checked-in manifest mirrored, or else one Swift target over its sources. A
 * pure-Swift module is refused when its podspec declares linkage, because the
 * emitted package would link less than the podspec does. Returns null for a module
 * with no sources: the pod's own `no-apple-sources` report covers it.
 */
function emitSourceModule(identity, hasManifest, emitContext) {
  const { moduleRoot, podName, iosDeploymentTarget, spmPackages, sources, podspec } = identity;
  if (hasManifest) return emitSourceManifestPackage(moduleRoot, emitContext);
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
 * @returns `emitted`, one `{ identity, linkedAs, emission }` per package it emitted, in
 *   emission order, `identity` being the pod it was emitted for; and `refusals`, by
 *   module root and then reason, each a function from an uncovered pod's identity to
 *   its refusal.
 */
function linkSourceModules(modules, identities, records, emitContext) {
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

      const emission = emitSourceModule(first, hasManifest, emitContext);
      if (emission == null) continue;
      const { refusal, ok } = emission;
      if (refusal != null) {
        refuse(moduleRoot, refusal.reason, () => refusal);
        continue;
      }
      const kind = hasManifest ? 'manifest' : 'pure-swift';
      emitted.push({ identity: first, linkedAs: kind, emission: ok });
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
    .map(({ identity }) => uncoveredPod(identity, ...refusalsFor(identity)));

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
  const uncheckedConditions = uncheckedAutolinkConditions([...precompiled, ...pureSwift], {
    gatedCompanions,
    manifestRoots: new Set(
      emitted
        .filter((r) => r.linkedAs === 'manifest')
        .map((r) => path.resolve(r.identity.moduleRoot))
    ),
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

  return {
    packageDependencies: emitted.map((r) => r.emission.packageDep),
    ...gateProducts(emitted, autolinkConditions, autolinkGate),
    pending,
    uncheckedConditions,
    unmappedDeps,
    xcconfigLinkage,
    precompiledPods: podNames(precompiled),
    manifestPackages: emitted
      .filter((r) => r.linkedAs === 'manifest')
      .map((r) => r.identity.packageName),
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
function macroPluginFlags(coreModuleRoot) {
  const macroPluginFault = (what, missing) => ({
    what,
    why: `Expo modules are compiled from source here, and their Swift macros cannot expand without ${missing} — the build would fail with "external macro implementation could not be found".`,
    how: 'Reinstall your JavaScript dependencies and build again.',
  });
  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve('@expo/expo-modules-macros-plugin/package.json', {
      paths: [coreModuleRoot],
    });
  } catch (error) {
    throw pluginError(
      macroPluginFault(
        `Could not resolve "@expo/expo-modules-macros-plugin" from ${coreModuleRoot}.`,
        'this plugin'
      ),
      { cause: error }
    );
  }
  const tool = path.join(path.dirname(pkgJsonPath), 'apple', 'ExpoModulesMacros-tool');
  if (!fs.existsSync(tool)) {
    throw pluginError(
      macroPluginFault(`The Expo Swift macro plugin is missing its executable at ${tool}.`, 'it')
    );
  }
  return ['-Xfrontend', '-load-plugin-executable', '-Xfrontend', `${tool}#ExpoModulesMacros`];
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
  const { modules, extraDependencies } = resolveExpoModules(appRoot);
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
    autolinkedPackages: new Set(modules.map((m) => m.packageName)),
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

  const records = podRecords(identities);
  const precompiled = linkPrecompiledPods(identities, records, artifactCacheDir);
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
  const frameworkSearchPath =
    precompiled.length > 0
      ? prepareCompileInterfaces(flavoredFrameworks, path.join(outDir, 'compile-interfaces'))
      : null;

  const core = precompiled.find((r) => r.identity.podName === CORE_POD)?.identity ?? null;
  const coreAvailable = core != null && frameworkSearchPath != null;
  let sourceModules = { emitted: [], refusals: new Map() };
  if (coreAvailable) {
    let resolvedMacroFlags = null;
    sourceModules = linkSourceModules(modules, identities, records, {
      react,
      frameworkSearchPath,
      outDir,
      codegenPkgPath,
      minimumIosDeploymentTarget: core.iosDeploymentTarget,
      // Every emitted target may use the macros (CocoaPods' "is core or depends on core" gate).
      // Lazy: an install that emits no source package needs no macro plugin.
      get macroFlags() {
        return (resolvedMacroFlags ??= macroPluginFlags(core.moduleRoot));
      },
    });
  }

  // Anything still uncovered has no xcframework and no way to be built from
  // source. Report it and fail — dropping a module here would surface as a
  // runtime "Cannot find native module" instead of a build error.
  const summary = summarizeRecords(records, {
    precompiled,
    ...sourceModules,
    react,
    satisfiedDependencies: new Set(dependencyFrameworks.map((f) => f.frameworkName)),
    autolinkConditions,
    gatedCompanions: indexGatedCompanions(metadata, records),
    autolinkGate,
  });
  const logListed = (label, names) =>
    console.log(`[expo-spm-plugin] ${label} (${names.length}): ${names.join(', ') || '—'}`);
  logListed('paired runtime frameworks', summary.precompiledPods);
  logListed('source via checked-in manifest', summary.manifestPackages);
  logListed('source pure-Swift', summary.pureSwiftPods);
  logListed('React wired into', summary.reactWiredPods);
  logListed('gated off', summary.gatedOffProducts);
  logListed(
    'not supported',
    summary.pending.map((p) => p.podName)
  );
  if (summary.unmappedDeps.length > 0) {
    console.warn(renderUnmappedDependencyWarning(summary.unmappedDeps));
  }
  if (summary.xcconfigLinkage.length > 0) {
    console.warn(renderXcconfigLinkerWarning(summary.xcconfigLinkage));
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
        '  The message above comes from `expo-modules-autolinking generate-modules-provider`. Fix what it names — a module with an unreadable expo-module.config.json is the common cause — then re-run `npx react-native spm update`.',
      ].join('\n'),
      { cause: error }
    );
  }
  if (providerPath == null && modules.length > 0) {
    throw new Error(
      [
        `The Expo module registry generator wrote no ExpoModulesProvider.swift to ${outDir}, although ${modules.length} Expo ${modules.length === 1 ? 'module' : 'modules'} resolved.`,
        '  Without that file no Expo native module is registered, and the app fails at launch with "Cannot find native module".',
        '  Re-run `npx react-native spm update`. If the file is still missing, report it at https://github.com/expo/expo/issues with the output of `npx expo-modules-autolinking resolve --platform apple --json` run in your app.',
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

  return {
    packageDependencies: summary.packageDependencies,
    productDependencies: summary.productDependencies,
    generatedSources,
    flavoredFrameworks,
    watchPaths: watchPaths(identities, appTarget),
    scriptPhases,
  };
};

module.exports.macroPluginFlags = macroPluginFlags;
module.exports.resolvePodIdentities = resolvePodIdentities;
module.exports.uncoveredPod = uncoveredPod;
