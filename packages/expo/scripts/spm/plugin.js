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
 * (discovery), react-descriptor.js + manifests.js (rendering) — with unit tests
 * in __tests__/. This file is just the orchestrator.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { resolveExpoModules, generateModulesProvider } = require('./cli');
const { collectWatchPaths, findModuleRoot, moduleNeedsReact, isPureSwift } = require('./classify');
const { prepareCompileInterfaces, resolveFlavoredFramework } = require('./flavored-frameworks');
const { emitSourceManifestPackage, emitPureSwiftSourcePackage } = require('./manifests');

/** Nearest ancestor of `dir` (inclusive) containing a package.json, or `dir` itself. */
function findAppPackageRoot(dir) {
  let current = path.resolve(dir);
  while (true) {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(dir);
    }
    current = parent;
  }
}

module.exports = function expoSpmPlugin(context) {
  const { react, outputDir } = context;
  // RN passes the Xcode project dir (`<app>/ios`) as appRoot. The autolinking
  // CLI's --app-root must be the app PACKAGE root: `generate-modules-provider`
  // filters modules against that dir's package.json dependencies, and with no
  // package.json the filter matches nothing → a silently EMPTY provider (no
  // Expo modules register at runtime). Walk up to the nearest package.json.
  const appRoot = findAppPackageRoot(context.appRoot);
  const modules = resolveExpoModules(appRoot);
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
  const stillPending = []; // source pods with no manifest and not pure-Swift

  // Pass 1 — precompiled runtime frameworks. The declaration is all-or-nothing:
  // once one flavor exists, the resolver requires and prepares both before RN
  // receives the plugin result. No runtime binary enters the SwiftPM graph.
  const precompiledFrameworks = new Map();
  const flavoredFrameworks = [];
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      if (emitted.has(pod.podName)) continue;
      const moduleRoot = findModuleRoot(pod.podspecDir);
      const needsReact = moduleNeedsReact(pod.podName, moduleRoot);
      const framework = resolveFlavoredFramework({
        packageName: mod.packageName,
        moduleRoot,
        frameworkName: pod.podName,
        cacheDir: artifactCacheDir,
      });
      if (framework != null) {
        precompiledFrameworks.set(pod.podName, framework);
        flavoredFrameworks.push(framework);
        emitted.add(pod.podName);
        if (needsReact) reactWired.push(pod.podName);
      }
    }
  }
  flavoredFrameworks.sort((a, b) => a.id.localeCompare(b.id));
  const frameworkSearchPath =
    precompiledFrameworks.size > 0
      ? prepareCompileInterfaces(flavoredFrameworks, path.join(outDir, 'compile-interfaces'))
      : null;

  // Pass 2 — invariant source modules. They compile against the generated
  // headers/module-interface tree and leave runtime linking entirely to RN.
  if (precompiledFrameworks.has('ExpoModulesCore') && frameworkSearchPath != null) {
    for (const mod of modules) {
      const pods = mod.pods ?? [];
      if (!pods.length || pods.every((p) => emitted.has(p.podName))) continue;
      const pod = pods[0];
      const moduleRoot = findModuleRoot(pod.podspecDir);

      if (fs.existsSync(path.join(moduleRoot, 'Package.swift'))) {
        // (A) module ships a checked-in Package.swift → mirror its targets + inject deps.
        const e = emitSourceManifestPackage(
          moduleRoot,
          react,
          frameworkSearchPath,
          outDir,
          codegenPkgPath
        );
        if (e != null) {
          packageDependencies.push(e.packageDep);
          productDependencies.push(...e.productDeps);
          pods.forEach((p) => emitted.add(p.podName));
          sourceManifest.push(mod.packageName);
          if (react != null) reactWired.push(pod.podName);
        }
      } else if (isPureSwift(moduleRoot)) {
        // Pure-Swift module → single Swift target over its ios sources.
        const e = emitPureSwiftSourcePackage(
          moduleRoot,
          pod.podName,
          react,
          frameworkSearchPath,
          outDir,
          codegenPkgPath
        );
        if (e != null) {
          packageDependencies.push(e.packageDep);
          productDependencies.push(e.productDep);
          pods.forEach((p) => emitted.add(p.podName));
          pureSwiftSource.push(pod.podName);
          if (react != null) reactWired.push(pod.podName);
        }
      }
    }
  }

  // Whatever's left is mixed Swift/ObjC with no xcframework and no manifest.
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      if (!emitted.has(pod.podName)) stillPending.push(pod.podName);
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
    `[expo-spm-plugin] still pending — mixed, no manifest (${stillPending.length}): ${stillPending.join(', ') || '—'}`
  );
  if (react == null) {
    console.warn(
      '[expo-spm-plugin] WARNING: context.react is null — no React dependency available.'
    );
  }

  // ExpoModulesProvider.swift — the module registry. Written to a stable path and
  // returned in `generatedSources`; the APP target must compile it (add it to the app's
  // Compile Sources — an `expo prebuild` template does this). It can't live in RN's static
  // AutolinkedAggregate target: an @objc class there isn't registered in the ObjC runtime's
  // classlist (static lib, name-only lookup via NSClassFromString), so the registry would be
  // empty. In the app's main module the class always registers, matching CocoaPods
  // `use_expo_modules!` (which adds ExpoModulesProvider.swift to the app target).
  const generatedSources = [];
  try {
    const providerPath = generateModulesProvider(
      appRoot,
      outDir,
      modules.map((m) => m.packageName)
    );
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
  } catch (e) {
    console.warn(`[expo-spm-plugin] WARNING: ExpoModulesProvider generation failed: ${e.message}`);
  }

  // Staleness inputs (`watchPaths` plugin contract): each module's checked-in
  // Package.swift and expo-module.config.json. Editing either must trip RN's
  // in-build re-sync — the manifests drive the generated wrapper packages, the
  // configs drive module resolution.
  const moduleRoots = new Set();
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      moduleRoots.add(findModuleRoot(pod.podspecDir));
    }
  }
  const watchPaths = collectWatchPaths([...moduleRoots]);

  return {
    packageDependencies,
    productDependencies,
    generatedSources,
    flavoredFrameworks,
    watchPaths,
  };
};
