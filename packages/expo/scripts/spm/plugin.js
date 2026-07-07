/**
 * Expo SwiftPM autolinking plugin (PREVIEW).
 *
 * Invoked by React Native's `react-native spm` tooling (add / update / build-time
 * sync) via the `spm.autolinkingPlugin` field in `expo/react-native.config.js`.
 * It contributes Expo's native modules into RN's SwiftPM autolinking graph, in
 * two forms:
 *
 *   - PRECOMPILED  — modules with a built xcframework (ExpoModulesCore,
 *     ExpoModulesJSI, ExpoModulesWorklets, …): referenced through a lean,
 *     generated consumption `Package.swift` (binaryTarget → the xcframework).
 *   - SOURCE-BUILT — modules compiled from source (Expo, EXConstants, …):
 *     emitted as a source `Package.swift`. Pure-Swift modules are a single
 *     target; mixed Swift/ObjC modules need the objc/swift target split that
 *     Expo's precompile pipeline performs (see the note at the bottom).
 *
 * The plugin returns DATA (`{packageDependencies, productDependencies,
 * generatedSources}`); RN owns the merge into its generated tree, so this runs
 * cleanly on every autolinking regeneration.
 *
 * React is referenced through `context.react` (the ReactDescriptor RN passes):
 * a single source of truth for the React package ref + the product set, so this
 * plugin never re-derives RN's package path / identity / product names.
 *
 * NOTE: RN invokes the plugin SYNCHRONOUSLY (`plugin(context)`, no await), so
 * module resolution shells out to the `expo-modules-autolinking` CLI via
 * `execFileSync` rather than awaiting its async API.
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/** Locate the expo-modules-autolinking CLI (expo depends on it). */
function resolveAutolinkingBin() {
  return require.resolve('expo-modules-autolinking/bin/expo-modules-autolinking.js', {
    paths: [__dirname],
  });
}

/** `expo-modules-autolinking resolve --platform apple --json` from the app root. */
function resolveExpoModules(appRoot) {
  const bin = resolveAutolinkingBin();
  const stdout = execFileSync(process.execPath, [bin, 'resolve', '--platform', 'apple', '--json'], {
    cwd: appRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : (parsed.modules ?? []);
}

/**
 * Generate ExpoModulesProvider.swift (the module registry) via the autolinking CLI.
 * Returns its absolute path for `generatedSources`, or null if generation produced nothing.
 * RN compiles this into the AutolinkedAggregate target, which depends on every module
 * product — so the provider can `import` and register them all.
 */
function generateModulesProvider(appRoot, outDir, moduleNames) {
  const bin = resolveAutolinkingBin();
  const target = path.join(outDir, 'ExpoModulesProvider.swift');
  fs.mkdirSync(outDir, { recursive: true });
  // `generate-modules-provider` filters to an explicit allowlist (`--packages`);
  // without it the provider is empty. Pass every resolved module's package name.
  execFileSync(
    process.execPath,
    [
      bin,
      'generate-modules-provider',
      '--target',
      target,
      '--app-root',
      appRoot,
      '--platform',
      'apple',
      '--packages',
      ...moduleNames,
    ],
    { cwd: appRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return fs.existsSync(target) ? target : null;
}

/**
 * Map each built product name (e.g. "ExpoModulesCore") → absolute path of its
 * <flavor> xcframework under packages/precompile/.build/<pkg>/output/<flavor>/xcframeworks/.
 */
function collectPrecompiledProducts(flavor) {
  const precompileBuild = path.resolve(__dirname, '..', '..', '..', 'precompile', '.build');
  const map = new Map();
  let pkgDirs = [];
  try {
    pkgDirs = fs.readdirSync(precompileBuild, { withFileTypes: true });
  } catch {
    return map;
  }
  for (const pkg of pkgDirs) {
    if (!pkg.isDirectory()) continue;
    const xcfwDir = path.join(precompileBuild, pkg.name, 'output', flavor, 'xcframeworks');
    let entries = [];
    try {
      entries = fs.readdirSync(xcfwDir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.endsWith('.xcframework')) {
        map.set(path.basename(entry, '.xcframework'), path.join(xcfwDir, entry));
      }
    }
  }
  return map;
}

/** Render the React package ref (ReactDescriptor.packageRef) as a Package.swift `.package(...)`. */
function reactPackageDependency(react) {
  const ref = react.packageRef;
  if (ref.url != null) {
    return `.package(url: "${ref.url}", exact: "${ref.version}")`;
  }
  return `.package(name: "${ref.name}", path: "${ref.path}")`;
}

/** Render the React product set (ReactDescriptor.products) as target `.product(...)` deps. */
function reactProductDependencies(react) {
  return react.products.map((p) => `.product(name: "${p.name}", package: "${p.package}")`);
}

// The core layer genuinely needs React/Hermes/jsi — it *is* the React/JSI bridge.
const CORE_REACT_PRODUCTS = new Set(['ExpoModulesCore', 'ExpoModulesJSI', 'ExpoModulesWorklets']);

// A direct source-level import of the React/Hermes/jsi families (NOT ExpoModulesCore).
const REACT_IMPORT_RX =
  /(#import\s*[<"](React|react|ReactCommon|RCTDeprecation|hermes|jsi|cxxreact|jsinspector|jsireact)[\/>]|@?import\s+(React|ReactCommon|ReactAppDependencyProvider|hermes|jsi)\b)/;

/**
 * Whether a module needs React wired into its manifest. ExpoModulesCore strips
 * React from its public Swift interface, so a module that only uses the Expo
 * Modules API does NOT inherit React — only modules whose own source imports the
 * React/Hermes/jsi families (or the core bridge layer itself) do.
 */
function moduleNeedsReact(podName, moduleRoot) {
  if (CORE_REACT_PRODUCTS.has(podName)) return true;
  for (const sub of ['ios', 'apple', 'common']) {
    const dir = path.join(moduleRoot, sub);
    if (sourceTreeImportsReact(dir)) return true;
  }
  return false;
}

function sourceTreeImportsReact(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(Tests?|__tests__|node_modules|build|\.build)$/.test(e.name)) continue;
      if (sourceTreeImportsReact(p)) return true;
    } else if (/\.(swift|m|mm|h|hpp|cpp|cc)$/.test(e.name)) {
      let content = '';
      try {
        content = fs.readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      if (content.split('\n').some((l) => REACT_IMPORT_RX.test(l))) return true;
    }
  }
  return false;
}

/**
 * Emit a lean CONSUMPTION Package.swift for a precompiled product: a binary
 * target pointing at the prebuilt xcframework, exposed as a library product.
 * Depends on RN's React package so the xcframework's Swift interface (which
 * imports React) resolves for consumers.
 *
 * Returns { packageDep, productDep } for the plugin result, or null when the
 * ReactDescriptor is unavailable.
 */
function emitPrecompiledPackage(product, xcframeworkPath, react, outDir, needsReact) {
  const pkgDir = path.join(outDir, 'expo-precompiled', product);
  fs.mkdirSync(pkgDir, { recursive: true });

  // React is wired only when the module needs it (ExpoModulesCore strips React
  // from its public interface, so most consumers don't).
  const wireReact = needsReact && react != null;
  // SwiftPM requires .binaryTarget(path:) to be RELATIVE to the package root
  // (unlike .package(path:), which accepts absolute paths).
  const xcframeworkRelPath = path.relative(pkgDir, xcframeworkPath);
  // Wrapper target re-exports the binary and carries any React product deps
  // (a binaryTarget can't declare dependencies itself). The wrapper's single
  // source `@_exported import`s the binary module so `import <Product>` works.
  const shimDir = path.join(pkgDir, 'Shim');
  fs.mkdirSync(shimDir, { recursive: true });
  fs.writeFileSync(path.join(shimDir, 'Exports.swift'), `@_exported import ${product}Binary\n`);

  const pkgDeps = wireReact ? `        ${reactPackageDependency(react)},\n` : '';
  const targetDeps = ['"${product}Binary"'.replace('${product}', product)];
  if (wireReact) targetDeps.push(...reactProductDependencies(react));

  const manifest = `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/plugin.js — do not edit.
// Consumption package for the precompiled ${product}.xcframework.
import PackageDescription

let package = Package(
    name: "${product}",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "${product}", targets: ["${product}"]),
    ],
    dependencies: [
${pkgDeps}    ],
    targets: [
        .binaryTarget(name: "${product}Binary", path: "${xcframeworkRelPath}"),
        .target(
            name: "${product}",
            dependencies: [
                ${targetDeps.join(',\n                ')},
            ],
            path: "Shim"
        ),
    ]
)
`;
  fs.writeFileSync(path.join(pkgDir, 'Package.swift'), manifest);

  return {
    packageDep: { name: product, path: pkgDir },
    productDep: { name: product, package: product },
  };
}

/** Walk up from a directory to the nearest npm package root (has package.json). */
function findModuleRoot(startDir) {
  let dir = startDir;
  while (dir && path.dirname(dir) !== dir) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return startDir;
}

/** Dump a module's checked-in Package.swift → { name, products, targets } (library targets only). */
function dumpManifest(moduleRoot) {
  const json = execFileSync('swift', ['package', '--package-path', moduleRoot, 'dump-package'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const pkg = JSON.parse(json);
  const targets = (pkg.targets ?? [])
    .filter((t) => t.type === 'regular')
    .map((t) => ({
      name: t.name,
      path: t.path,
      publicHeadersPath: t.publicHeadersPath ?? null,
      // sibling targets referenced by name within this same package
      siblingDeps: (t.dependencies ?? []).map((d) => d.byName?.[0]).filter(Boolean),
    }));
  const regularNames = new Set(targets.map((t) => t.name));
  const products = (pkg.products ?? [])
    .filter((p) => Object.keys(p.type ?? {})[0] === 'library')
    .map((p) => ({ name: p.name, targets: (p.targets ?? []).filter((n) => regularNames.has(n)) }))
    .filter((p) => p.targets.length);
  return { name: pkg.name, products, targets };
}

/**
 * Option A: emit a CONSUMPTION Package.swift for a source module that ships a
 * checked-in Package.swift (e.g. `expo` after the SwiftPM restructure). Re-declares
 * its library targets against the real source (via a `root` symlink) and injects the
 * React product set + ExpoModulesCore — the deps the checked-in manifest deliberately
 * omits (it can't know the app-specific React package or the precompiled ExpoModulesCore
 * location). RN owns the merge; the checked-in manifest stays for standalone dev/describe.
 */
function emitSourceManifestPackage(moduleRoot, react, expoModulesCorePkgDir, outDir, needsReact) {
  const manifest = dumpManifest(moduleRoot);
  const pkgDir = path.join(outDir, 'expo-source', manifest.name);
  fs.mkdirSync(pkgDir, { recursive: true });
  // `root` symlink → the real module source so target paths resolve to real files.
  const rootLink = path.join(pkgDir, 'root');
  try {
    fs.rmSync(rootLink, { recursive: true, force: true });
  } catch {}
  fs.symlinkSync(moduleRoot, rootLink);

  // ExpoModulesCore is universal; React only when the module actually needs it.
  const wireReact = needsReact && react != null;
  const injected = [
    '.product(name: "ExpoModulesCore", package: "ExpoModulesCore")',
    ...(wireReact ? reactProductDependencies(react) : []),
  ];
  const pkgDeps = [
    ...(wireReact ? [reactPackageDependency(react)] : []),
    `.package(name: "ExpoModulesCore", path: "${expoModulesCorePkgDir}")`,
  ];

  const targetsSwift = manifest.targets
    .map((t) => {
      const deps = [...t.siblingDeps.map((n) => `"${n}"`), ...injected];
      const headers = t.publicHeadersPath
        ? `\n            publicHeadersPath: "${t.publicHeadersPath}",`
        : '';
      return `        .target(
            name: "${t.name}",
            dependencies: [
                ${deps.join(',\n                ')},
            ],
            path: "root/${t.path}",${headers}
        )`;
    })
    .join(',\n');

  const productsSwift = manifest.products
    .map(
      (p) =>
        `        .library(name: "${p.name}", targets: [${p.targets.map((n) => `"${n}"`).join(', ')}])`
    )
    .join(',\n');

  const content = `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/plugin.js — do not edit.
// Source consumption package for "${manifest.name}": mirrors the module's checked-in
// Package.swift targets and injects the React + ExpoModulesCore dependencies.
import PackageDescription

let package = Package(
    name: "${manifest.name}",
    platforms: [.iOS(.v15)],
    products: [
${productsSwift}
    ],
    dependencies: [
        ${pkgDeps.join(',\n        ')},
    ],
    targets: [
${targetsSwift}
    ]
)
`;
  fs.writeFileSync(path.join(pkgDir, 'Package.swift'), content);

  return {
    packageDep: { name: manifest.name, path: pkgDir },
    productDeps: manifest.products.map((p) => ({ name: p.name, package: manifest.name })),
  };
}

/**
 * Emit a source consumption package for a module WITHOUT a checked-in Package.swift,
 * from its resolved descriptor. Pure-Swift modules only (single Swift target over the
 * module's `ios` sources). Depends on ExpoModulesCore, plus React iff `needsReact`.
 */
function emitPureSwiftSourcePackage(
  moduleRoot,
  product,
  react,
  expoModulesCorePkgDir,
  outDir,
  needsReact
) {
  const srcDir = ['ios', 'apple']
    .map((s) => path.join(moduleRoot, s))
    .find((d) => fs.existsSync(d));
  if (srcDir == null) return null;
  const srcRel = path.relative(moduleRoot, srcDir); // e.g. "ios"
  const pkgDir = path.join(outDir, 'expo-source', product);
  fs.mkdirSync(pkgDir, { recursive: true });
  const rootLink = path.join(pkgDir, 'root');
  try {
    fs.rmSync(rootLink, { recursive: true, force: true });
  } catch {}
  fs.symlinkSync(moduleRoot, rootLink);

  const wireReact = needsReact && react != null;
  const pkgDeps = [
    ...(wireReact ? [reactPackageDependency(react)] : []),
    `.package(name: "ExpoModulesCore", path: "${expoModulesCorePkgDir}")`,
  ];
  const targetDeps = [
    '.product(name: "ExpoModulesCore", package: "ExpoModulesCore")',
    ...(wireReact ? reactProductDependencies(react) : []),
  ];

  const content = `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/plugin.js — do not edit.
// Pure-Swift source consumption package for "${product}".
import PackageDescription

let package = Package(
    name: "${product}",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "${product}", targets: ["${product}"]),
    ],
    dependencies: [
        ${pkgDeps.join(',\n        ')},
    ],
    targets: [
        .target(
            name: "${product}",
            dependencies: [
                ${targetDeps.join(',\n                ')},
            ],
            path: "root/${srcRel}"
        ),
    ]
)
`;
  fs.writeFileSync(path.join(pkgDir, 'Package.swift'), content);

  return {
    packageDep: { name: product, path: pkgDir },
    productDep: { name: product, package: product },
  };
}

/** Cheap check: a module is pure-Swift if its iOS/apple source has no .m/.mm/.cpp files. */
function isPureSwift(moduleRoot) {
  const hasNonSwift = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/^(Tests?|__tests__|node_modules|build|\.build)$/.test(e.name)) continue;
        if (hasNonSwift(p)) return true;
      } else if (/\.(m|mm|cpp|cc)$/.test(e.name)) {
        return true;
      }
    }
    return false;
  };
  return ['ios', 'apple']
    .map((s) => path.join(moduleRoot, s))
    .filter((d) => fs.existsSync(d))
    .every((d) => !hasNonSwift(d));
}

module.exports = function expoSpmPlugin(context) {
  const { appRoot, flavor, react, outputDir } = context;
  const modules = resolveExpoModules(appRoot);
  const precompiled = collectPrecompiledProducts(flavor === 'release' ? 'release' : 'debug');
  const outDir = path.join(outputDir, 'expo');

  const packageDependencies = [];
  const productDependencies = [];
  const emitted = new Set(); // pod names already contributed
  const reactWired = []; // pods that got React wired (for logging)
  const sourceManifest = []; // packages emitted from a checked-in manifest
  const pureSwiftSource = []; // packages emitted from a pure-Swift descriptor
  const stillPending = []; // source pods with no manifest and not pure-Swift

  // Pass 1 — precompiled modules (binaryTarget consumption packages).
  const precompiledPkgDirs = new Map();
  for (const mod of modules) {
    for (const pod of mod.pods ?? []) {
      const xcframeworkPath = precompiled.get(pod.podName);
      if (xcframeworkPath == null) continue;
      const moduleRoot = findModuleRoot(pod.podspecDir);
      const needsReact = moduleNeedsReact(pod.podName, moduleRoot);
      const e = emitPrecompiledPackage(pod.podName, xcframeworkPath, react, outDir, needsReact);
      if (e != null) {
        packageDependencies.push(e.packageDep);
        productDependencies.push(e.productDep);
        precompiledPkgDirs.set(pod.podName, e.packageDep.path);
        emitted.add(pod.podName);
        if (needsReact) reactWired.push(pod.podName);
      }
    }
  }
  const expoModulesCorePkgDir = precompiledPkgDirs.get('ExpoModulesCore');

  // Pass 2 — source modules (need ExpoModulesCore already emitted).
  if (expoModulesCorePkgDir != null) {
    for (const mod of modules) {
      const pods = mod.pods ?? [];
      if (!pods.length || pods.every((p) => emitted.has(p.podName))) continue;
      const pod = pods[0];
      const moduleRoot = findModuleRoot(pod.podspecDir);
      const needsReact = moduleNeedsReact(pod.podName, moduleRoot);

      if (fs.existsSync(path.join(moduleRoot, 'Package.swift'))) {
        // (A) module ships a checked-in Package.swift → mirror its targets + inject deps.
        const e = emitSourceManifestPackage(
          moduleRoot,
          react,
          expoModulesCorePkgDir,
          outDir,
          needsReact
        );
        if (e != null) {
          packageDependencies.push(e.packageDep);
          productDependencies.push(...e.productDeps);
          pods.forEach((p) => emitted.add(p.podName));
          sourceManifest.push(mod.packageName);
          if (needsReact) reactWired.push(pod.podName);
        }
      } else if (isPureSwift(moduleRoot)) {
        // Pure-Swift module → single Swift target over its ios sources.
        const e = emitPureSwiftSourcePackage(
          moduleRoot,
          pod.podName,
          react,
          expoModulesCorePkgDir,
          outDir,
          needsReact
        );
        if (e != null) {
          packageDependencies.push(e.packageDep);
          productDependencies.push(e.productDep);
          pods.forEach((p) => emitted.add(p.podName));
          pureSwiftSource.push(pod.podName);
          if (needsReact) reactWired.push(pod.podName);
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
    `[expo-spm-plugin] precompiled (${precompiledPkgDirs.size}): ${[...precompiledPkgDirs.keys()].join(', ') || '—'}`
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

  // ExpoModulesProvider.swift — the module registry. Compiled into RN's aggregate
  // target (which depends on every module product), so it can register them all.
  const generatedSources = [];
  try {
    const providerPath = generateModulesProvider(
      appRoot,
      outDir,
      modules.map((m) => m.packageName)
    );
    if (providerPath != null) {
      generatedSources.push({ path: providerPath });
      console.log(`[expo-spm-plugin] generated ExpoModulesProvider.swift → ${providerPath}`);
    }
  } catch (e) {
    console.warn(`[expo-spm-plugin] WARNING: ExpoModulesProvider generation failed: ${e.message}`);
  }

  return {
    packageDependencies,
    productDependencies,
    generatedSources,
  };
};
