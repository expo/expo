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
 * The logic is split across sibling modules — cli.js (I/O), classify.js
 * (discovery), app-target.js (the app's Xcode target), flavored-frameworks.js
 * (precompiled frameworks), react-descriptor.js + manifests.js (rendering),
 * podspec.js (podspec reading),
 * script-phases.js (build script phases), diagnostics.js (errors and
 * warnings) — with unit tests in __tests__/. This file is just the orchestrator.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { resolveAppTarget } = require('./app-target');
const { resolveExpoModules, prebuiltMetadata, generateModulesProvider } = require('./cli');
const {
  APPLE_SOURCE_DIRS,
  appleSourceDir,
  collectWatchPaths,
  documentedPackageRoot,
  findModuleRoot,
  moduleNeedsReact,
  isPureSwift,
} = require('./classify');
const {
  classifyUnsupported,
  collectRootConflicts,
  collectUnmappedDependencies,
  renderExtraPodsWarning,
  renderRootConflictWarning,
  renderUnmappedDependencyWarning,
  renderXcconfigLinkerWarning,
  reportUnsupported,
} = require('./diagnostics');
const {
  assertDistinctFlavoredFrameworks,
  byteOrder,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveSpmDependencyFrameworks,
} = require('./flavored-frameworks');
const {
  emitSourceManifestPackage,
  emitPureSwiftSourcePackage,
  raiseFloor,
} = require('./manifests');
const { readPodspecs } = require('./podspec');
const { scriptPhasesForModules } = require('./script-phases');

/**
 * The module roots React Native resolved, keyed by npm package name, from the
 * autolinking.json it passes as `context.autolinking`. React Native passes `{}`
 * when it has no autolinking data, and a root it recorded can be gone after a
 * reinstall, so only roots that are on disk are kept.
 */
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
 * A pod's identity — where its npm package lives, what its product is called,
 * and whether the Expo prebuild pipeline can build it into an XCFramework.
 *
 * The document covers only packages that ship an spm.config.json; React Native's
 * autolinked root answers for the rest, and the filesystem walk stays as the
 * fallback for a sync that gets no autolinking data. A documented root that is
 * gone falls back too — a stale entry is not identity — but its product name
 * still holds.
 *
 * The pod name is NOT the product name — react-native-skia ships RNSkia — so
 * the product is what artifacts and prebuild diagnostics are named after.
 */
function podIdentity(entry, pod, packageName, autolinkedRoot) {
  const documentedRoot = documentedPackageRoot(entry);
  return {
    entry,
    packageName,
    documentedRoot,
    autolinkedRoot,
    moduleRoot: documentedRoot ?? autolinkedRoot ?? findModuleRoot(pod.podspecDir),
    productName: entry?.productName ?? pod.podName,
    prebuildProduct:
      entry != null ? { name: entry.productName, sourceOnly: entry.sourceOnly === true } : null,
  };
}

/** Every pod's identity, keyed by the pod, resolved once so every pass agrees on it. */
function resolvePodIdentities(modules, metadata, autolinkedRoots) {
  const identities = new Map();
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      identities.set(
        pod,
        podIdentity(
          metadata[pod.podName],
          pod,
          mod.packageName,
          autolinkedRoots.get(mod.packageName)
        )
      );
    }
  }
  return identities;
}

// Expo modules use Swift macros (@Field, @Record, @OptimizedFunction). A macro expands
// only when the compiler is handed the macro plugin executable, which ships prebuilt and
// declares no SwiftPM products — so it travels as a compiler flag, not a dependency.
// CocoaPods resolves the same binary the same way in
// `expo-modules-autolinking/scripts/ios/project_integrator.rb#resolve_macros_plugin_dir`.
function macroPluginFlags(coreModuleRoot) {
  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve('@expo/expo-modules-macros-plugin/package.json', {
      paths: [coreModuleRoot],
    });
  } catch {
    throw new Error(
      `[expo-spm-plugin] Could not resolve "@expo/expo-modules-macros-plugin" from ${coreModuleRoot}. ` +
        'Expo modules are compiled from source here, and their Swift macros cannot expand without ' +
        'this plugin — the build would fail with "external macro implementation could not be found". ' +
        'Reinstall your JavaScript dependencies and build again.'
    );
  }
  const tool = path.join(path.dirname(pkgJsonPath), 'apple', 'ExpoModulesMacros-tool');
  if (!fs.existsSync(tool)) {
    throw new Error(
      `[expo-spm-plugin] The Expo Swift macro plugin is missing its executable at ${tool}. ` +
        'Expo modules are compiled from source here, and their Swift macros cannot expand without ' +
        'it — the build would fail with "external macro implementation could not be found". ' +
        'Reinstall your JavaScript dependencies and build again.'
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
  const metadata = prebuiltMetadata(appRoot);
  const autolinkedRoots = collectAutolinkedRoots(autolinking);
  const identities = resolvePodIdentities(modules, metadata, autolinkedRoots);
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

  const packageDependencies = [];
  const productDependencies = [];
  const emitted = new Set(); // pod names already contributed
  const reactWired = []; // pods that got React wired (for logging)
  const sourceManifest = []; // packages emitted from a checked-in manifest
  const pureSwiftSource = []; // packages emitted from a pure-Swift descriptor
  const unmappedDeps = []; // emitted pods depending on pods with no SwiftPM counterpart
  const xcconfigLinkage = []; // emitted pods whose podspec xcconfig sets linker flags
  const unresolvedTargets = new Map(); // module root → manifest targets with no sources on disk
  const unsupportedTargetDeps = new Map(); // module root → deps the generated package cannot declare
  const podspecLinkage = new Map(); // module root → podspec line declaring native linkage

  // Pass 1 — precompiled runtime frameworks. The declaration is all-or-nothing:
  // once one flavor exists, the resolver requires and prepares both before RN
  // receives the plugin result. No runtime binary enters the SwiftPM graph.
  const precompiledFrameworks = new Map();
  const flavoredFrameworks = [];
  const precompiledPods = [];
  let coreModuleRoot = null;
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      if (emitted.has(pod.podName)) continue;
      const { entry, moduleRoot, productName } = identities.get(pod);
      if (pod.podName === 'ExpoModulesCore') coreModuleRoot = moduleRoot;
      const needsReact = moduleNeedsReact(pod.podName, moduleRoot);
      const framework = resolveFlavoredFramework({
        packageName: mod.packageName,
        moduleRoot,
        frameworkName: productName,
        cacheDir: artifactCacheDir,
      });
      if (framework != null) {
        precompiledFrameworks.set(pod.podName, framework);
        flavoredFrameworks.push(framework);
        precompiledPods.push({
          packageName: mod.packageName,
          podName: pod.podName,
          podspecDir: pod.podspecDir,
          moduleRoot,
          spmDependencies: entry?.spmDependencies,
        });
        emitted.add(pod.podName);
        if (needsReact) reactWired.push(pod.podName);
      }
    }
  }
  // The SwiftPM packages those modules link ship as their own XCFrameworks, and
  // RN takes them in the same flat array. They join before the interface tree is
  // built, so source modules compile against their headers too.
  const dependencyFrameworks = resolveSpmDependencyFrameworks(precompiledPods);
  flavoredFrameworks.push(...dependencyFrameworks);
  flavoredFrameworks.sort((a, b) => byteOrder(a.id, b.id));
  assertDistinctFlavoredFrameworks(flavoredFrameworks);

  // Pass 2 reports this for the modules it emits, which a precompiled pod reaches
  // only when a sibling pod of its package is not precompiled — so the report for
  // precompiled pods belongs here. What the resolved dependencies already carry is
  // not uncovered, their subspecs included.
  const satisfiedDependencies = new Set(dependencyFrameworks.map((f) => f.frameworkName));
  for (const { packageName, podName, podspecDir } of precompiledPods) {
    const unmapped = collectUnmappedDependencies(podspecDir, satisfiedDependencies);
    if (unmapped.length > 0) {
      unmappedDeps.push({ packageName, podName, pods: unmapped });
    }
  }
  const frameworkSearchPath =
    precompiledFrameworks.size > 0
      ? prepareCompileInterfaces(flavoredFrameworks, path.join(outDir, 'compile-interfaces'))
      : null;

  // Pass 2 — invariant source modules. They compile against the generated
  // headers/module-interface tree and leave runtime linking entirely to RN.
  const coreAvailable = precompiledFrameworks.has('ExpoModulesCore') && frameworkSearchPath != null;
  // Every module imports ExpoModulesCore, so none may be built below its floor —
  // the CocoaPods installer raises them the same way, after install.
  const coreDeploymentTarget = metadata['ExpoModulesCore']?.iosDeploymentTarget ?? null;
  if (coreAvailable) {
    // Every emitted source target compiles against the same ExpoModulesCore interface tree,
    // so every one of them may use the macros — the set CocoaPods reaches through its
    // "is core or depends on core" gate. Resolved on first use so an install that emits
    // no source package at all does not need the macro plugin present.
    let resolvedMacroFlags = null;
    const macroFlags = () => (resolvedMacroFlags ??= macroPluginFlags(coreModuleRoot));
    for (const mod of modules) {
      const pods = mod.pods ?? [];
      if (!pods.length || pods.every((p) => emitted.has(p.podName))) continue;
      const pod = pods[0];
      const { entry, moduleRoot } = identities.get(pod);

      if (fs.existsSync(path.join(moduleRoot, 'Package.swift'))) {
        // Module ships a checked-in Package.swift → mirror its targets + inject deps.
        const e = emitSourceManifestPackage({
          moduleRoot,
          react,
          frameworkSearchPath,
          outDir,
          codegenPkgPath,
          minimumIosDeploymentTarget: coreDeploymentTarget,
          macroFlags: macroFlags(),
        });
        if (e.unsupportedTargetDeps != null) {
          unsupportedTargetDeps.set(moduleRoot, e.unsupportedTargetDeps);
        } else if (e.unresolvedTargets != null) {
          unresolvedTargets.set(moduleRoot, e.unresolvedTargets);
        } else {
          packageDependencies.push(e.packageDep);
          productDependencies.push(...e.productDeps);
          pods.forEach((p) => emitted.add(p.podName));
          sourceManifest.push(mod.packageName);
          if (react != null) reactWired.push(pod.podName);
        }
      } else if (isPureSwift(moduleRoot)) {
        // Pure-Swift module → single Swift target over its ios sources. Its podspec is
        // only read for what would make the emission wrong: a module whose linkage only
        // the podspec declares is skipped and diagnosed, never emitted half-linked.
        const podspecs = readPodspecs(
          pod.podName,
          [
            pod.podspecDir,
            ...APPLE_SOURCE_DIRS.map((dir) => path.join(moduleRoot, dir)),
            moduleRoot,
          ].filter(Boolean)
        );
        if (podspecs.linkage != null) podspecLinkage.set(moduleRoot, podspecs.linkage);
        const e =
          podspecs.linkage != null
            ? null
            : emitPureSwiftSourcePackage({
                moduleRoot,
                product: pod.podName,
                react,
                frameworkSearchPath,
                outDir,
                codegenPkgPath,
                iosDeploymentTarget: raiseFloor(entry?.iosDeploymentTarget, coreDeploymentTarget),
                macroFlags: macroFlags(),
              });
        if (e != null) {
          packageDependencies.push(e.packageDep);
          productDependencies.push(e.productDep);
          pods.forEach((p) => emitted.add(p.podName));
          pureSwiftSource.push(pod.podName);
          if (react != null) reactWired.push(pod.podName);
          if (podspecs.linkerFlags != null) {
            xcconfigLinkage.push({
              packageName: mod.packageName,
              podName: pod.podName,
              ...podspecs.linkerFlags,
            });
          }
        }
      }

      // A precompiled pod was already diagnosed in pass 1. It still reaches here
      // when a sibling pod of the same package is not precompiled, and warning
      // again would print the identical block twice.
      if (emitted.has(pod.podName) && !precompiledFrameworks.has(pod.podName)) {
        const unmapped = collectUnmappedDependencies(pod.podspecDir, satisfiedDependencies);
        if (unmapped.length > 0) {
          unmappedDeps.push({
            packageName: mod.packageName,
            podName: pod.podName,
            pods: unmapped,
          });
        }
      }
    }
  }

  // Anything still uncovered has no xcframework and no way to be built from
  // source. Collect the facts each diagnostic needs, then report and fail —
  // dropping a module here would surface as a runtime "Cannot find native
  // module" instead of a build error.
  const pending = [];
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      if (emitted.has(pod.podName)) continue;
      const { moduleRoot, prebuildProduct } = identities.get(pod);
      pending.push({
        podName: pod.podName,
        packageName: mod.packageName,
        moduleRoot,
        pureSwift: isPureSwift(moduleRoot),
        hasSources: appleSourceDir(moduleRoot) != null,
        unsupportedTargetDeps: unsupportedTargetDeps.get(moduleRoot) ?? null,
        unresolvedTargets: unresolvedTargets.get(moduleRoot) ?? null,
        podspecLinkage: podspecLinkage.get(moduleRoot) ?? null,
        prebuildProduct,
      });
    }
  }

  console.log(
    `[expo-spm-plugin] paired runtime frameworks (${precompiledFrameworks.size}): ${[...precompiledFrameworks.keys()].join(', ') || '—'}`
  );
  console.log(
    `[expo-spm-plugin] source via checked-in manifest (${sourceManifest.length}): ${sourceManifest.join(', ') || '—'}`
  );
  console.log(
    `[expo-spm-plugin] source pure-Swift (${pureSwiftSource.length}): ${pureSwiftSource.join(', ') || '—'}`
  );
  console.log(
    `[expo-spm-plugin] React wired into (${reactWired.length}): ${reactWired.join(', ') || '—'}`
  );
  console.log(
    `[expo-spm-plugin] not supported (${pending.length}): ${pending.map((p) => p.podName).join(', ') || '—'}`
  );
  if (unmappedDeps.length > 0) {
    console.warn(renderUnmappedDependencyWarning(unmappedDeps));
  }
  if (xcconfigLinkage.length > 0) {
    console.warn(renderXcconfigLinkerWarning(xcconfigLinkage));
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

  const unsupported = reportUnsupported(classifyUnsupported({ pending, coreAvailable }));
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
  const appTarget = resolveAppTarget(context.appRoot);
  let providerPath;
  try {
    providerPath = generateModulesProvider({
      appRoot,
      outDir,
      moduleNames: modules.map((m) => m.packageName),
      ...appTarget,
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

  // Staleness inputs (`watchPaths` plugin contract): each module's checked-in
  // Package.swift and expo-module.config.json. Editing either must trip RN's
  // in-build re-sync — the manifests drive the generated wrapper packages, the
  // configs drive module resolution.
  const moduleRoots = new Set([...identities.values()].map((identity) => identity.moduleRoot));
  // The registry's other inputs: app groups come from the entitlements file and
  // inline-module registration from Podfile.properties.json, so editing either
  // must trip the re-sync as well. Known gap: repointing CODE_SIGN_ENTITLEMENTS
  // at a different file is not noticed, because that would mean watching
  // project.pbxproj — which RN rewrites during the sync itself.
  const watchPaths = [
    ...collectWatchPaths([...moduleRoots]),
    ...[appTarget.entitlementPath, appTarget.podfilePropertiesPath].filter((p) => p != null),
  ];

  const scriptPhases = scriptPhasesForModules(modules.map((m) => m.packageName));
  if (scriptPhases.length > 0) {
    console.log(
      `[expo-spm-plugin] script phases (${scriptPhases.length}): ${scriptPhases.map((p) => p.id).join(', ')}`
    );
  }

  return {
    packageDependencies,
    productDependencies,
    generatedSources,
    flavoredFrameworks,
    watchPaths,
    scriptPhases,
  };
};

module.exports.resolvePodIdentities = resolvePodIdentities;
