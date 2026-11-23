/**
 * Links a module whose checked-in Package.swift depends on a headers stand-in, such as the
 * ExpoModulesCoreHeaders product, through that manifest instead of a generated one. It names
 * its Expo dependencies by paths relative to `<outDir>/direct/<package>`, so this writes those
 * neighbours:
 *
 *   direct/<package>     → relative symlink to the module root
 *   direct/<stand-in>    → compile-only Expo product: a relative symlink to its prebuilt
 *                          headers xcframework, plus dependencies on the packages its
 *                          interface needs, as HEADERS_STAND_INS lists them, and, when its
 *                          entry sets `reactHeaders`, on React Native's header products
 *   direct/<placeholder> → a React Native library's product, as RN_LIBRARY_PLACEHOLDERS
 *                          lists them
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { runDumpPackage } = require('./cli');
const { pluginError, rerunSpmUpdate } = require('./diagnostics');
const { raiseFloor } = require('./manifests');
const { reactPackageDeclarations, reactProductDependencies } = require('./react-descriptor');

const JSI_HEADERS = 'ExpoModulesJSIHeaders';
const MACROS_PACKAGE = 'expo-modules-macros';
// Written into the package by an earlier generator; nothing reads it now.
const LEGACY_STUBS_DIR = '.stubs';

/**
 * The headers stand-ins a checked-in manifest can depend on, by package and product name. Each
 * is compile-only `productName` of the npm package `packageName`, over its prebuilt
 * `<productName>Headers.xcframework`, and depends on the stand-ins in `standIns` and on the
 * packages in `packages`, whose paths `emitDirectPackage` is given. A stand-in with
 * `reactHeaders` also depends on React Native's header products, so a module that imports
 * React gets them through it, as does a stand-in that depends on it.
 *
 * ExpoModulesCore's interface re-exports ExpoModulesJSI, so its stand-in brings the JSI
 * headers package along; it must not declare a JSI headers target of its own, because SwiftPM
 * rejects two targets of one name in a graph. SwiftPM loads the macro plugin into every target
 * that depends, at any depth, on a target that depends on the plugin's product, so module
 * manifests need no flags to load it.
 */
const HEADERS_STAND_INS = {
  ExpoModulesCoreHeaders: {
    packageName: 'expo-modules-core',
    productName: 'ExpoModulesCore',
    standIns: [],
    packages: [
      { name: JSI_HEADERS, product: JSI_HEADERS },
      { name: MACROS_PACKAGE, product: 'ExpoModulesMacrosPlugin' },
    ],
    reactHeaders: true,
  },
  ExpoModulesWorkletsHeaders: {
    packageName: 'expo-modules-core',
    productName: 'ExpoModulesWorklets',
    standIns: ['ExpoModulesCoreHeaders'],
    packages: [],
    reactHeaders: false,
  },
  ExpoUIHeaders: {
    packageName: '@expo/ui',
    productName: 'ExpoUI',
    standIns: ['ExpoModulesCoreHeaders', 'ExpoModulesWorkletsHeaders'],
    packages: [],
  },
};

/**
 * The React Native libraries a checked-in manifest can depend on, by placeholder package. React
 * Native's sync links the library's package at `libs/<productName>`, a path that differs per app.
 * `packageSwiftVersions`, when set, names the library versions that ship a Package.swift.
 */
const RN_LIBRARY_PLACEHOLDERS = {
  RNWorkletsHeaders: { packageName: 'react-native-worklets', productName: 'RNWorklets' },
  RNScreensHeaders: {
    packageName: 'react-native-screens',
    productName: 'RNScreens',
    packageSwiftVersions: '5.x',
  },
};

// react-native-screens declares iOS 15.1. SwiftPM refuses a product whose floor is above that of
// the package that depends on it.
const PLACEHOLDER_IOS_FLOOR = '15.1';

/**
 * The names of the products a dumped manifest's targets depend on. A `byName` dependency
 * counts: SwiftPM resolves it to that product when no target of the package has the name.
 */
function productDependencyNamesOf(manifest) {
  const targets = manifest.targets ?? [];
  const targetNames = new Set(targets.map((target) => target.name));
  return targets
    .flatMap((target) => target.dependencies ?? [])
    .filter((dependency) => dependency.byName == null || !targetNames.has(dependency.byName[0]))
    .map((dependency) => dependency.product?.[0] ?? dependency.byName?.[0]);
}

/**
 * The headers stand-ins a dumped manifest compiles against, with the stand-ins they depend on,
 * each once and after its dependencies. Only a manifest written to be built as it stands can
 * name one, so the list is empty for any other.
 */
function headersStandInsOf(manifest) {
  const standIns = new Set();
  const add = (name) => {
    if (standIns.has(name)) return;
    HEADERS_STAND_INS[name].standIns.forEach(add);
    standIns.add(name);
  };
  productDependencyNamesOf(manifest)
    .filter((name) => Object.hasOwn(HEADERS_STAND_INS, name))
    .forEach(add);
  return [...standIns];
}

/**
 * The React Native library placeholders a dumped manifest depends on. Like a headers stand-in,
 * one is reachable only when the manifest is built as it stands.
 */
function rnLibraryPlaceholdersOf(manifest) {
  const names = productDependencyNamesOf(manifest);
  return Object.keys(RN_LIBRARY_PLACEHOLDERS).filter((name) => names.includes(name));
}

/**
 * Module manifests depend on the product, so it keeps the package's name. A binary target
 * cannot have dependencies, so the `<name>Dependencies` source target carries them.
 *
 * @param dependencies `{ name, product, path }` for each package the stand-in depends on, `path`
 *   relative to the stand-in.
 * @param reactDependencies `{ packages, products }`: React Native's package declarations and
 *   product dependencies, as `react-descriptor.js` writes them, empty for no React headers.
 */
function standInManifest(name, productName, dependencies, reactDependencies) {
  const dependenciesTarget = `${name}Dependencies`;
  const lines = (indent, entries) => entries.map((entry) => `${indent}${entry},\n`).join('');
  const packages = [
    ...dependencies.map((d) => `.package(name: "${d.name}", path: "${d.path}")`),
    ...reactDependencies.packages,
  ];
  const products = [
    ...dependencies.map((d) => `.product(name: "${d.product}", package: "${d.name}")`),
    ...reactDependencies.products,
  ];
  return `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/direct.js — do not edit.
// Compile-only ${productName}. The runtime framework is linked and embedded by React
// Native outside SwiftPM.
import PackageDescription

let package = Package(
    name: "${name}",
    products: [
        .library(name: "${name}", targets: ["${name}", "${dependenciesTarget}"]),
    ],
    dependencies: [
${lines('        ', packages)}    ],
    targets: [
        .binaryTarget(name: "${name}", path: "${name}.xcframework"),
        .target(
            name: "${dependenciesTarget}",
            dependencies: [
${lines('                ', products)}            ],
            path: "${dependenciesTarget}"
        ),
    ]
)
`;
}

/**
 * The placeholder's source target must not be named `productName`: SwiftPM rejects two
 * targets of one name in a graph, and the library's package declares that one.
 *
 * @param libraryPath the library's `libs/<productName>` link, relative to the placeholder.
 */
function placeholderManifest(name, libraryPath, iosDeploymentTarget) {
  const { productName } = RN_LIBRARY_PLACEHOLDERS[name];
  const dependenciesTarget = `${name}Dependencies`;
  return `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/direct.js — do not edit.
// Stands in for ${productName}, as React Native's sync links it.
import PackageDescription

let package = Package(
    name: "${name}",
    platforms: [.iOS("${raiseFloor(iosDeploymentTarget, PLACEHOLDER_IOS_FLOOR)}")],
    products: [
        .library(name: "${name}", targets: ["${dependenciesTarget}"]),
    ],
    dependencies: [
        .package(path: "${libraryPath}"),
    ],
    targets: [
        .target(
            name: "${dependenciesTarget}",
            dependencies: [
                .product(name: "${productName}", package: "${productName}"),
            ],
            path: "${dependenciesTarget}"
        ),
    ]
)
`;
}

/**
 * SwiftPM names a package by the last component of its path and does not resolve links, so
 * the library is declared through React Native's `libs/<productName>` link, never its real
 * directory: that would be a second package with the same targets.
 */
function emitRNLibraryPlaceholder(directDir, name, libraryLink, iosDeploymentTarget) {
  const pkgDir = path.join(directDir, name);
  writeIfChanged(path.join(pkgDir, `${name}Dependencies`, `${name}Dependencies.swift`), '');
  writeIfChanged(
    path.join(pkgDir, 'Package.swift'),
    placeholderManifest(name, path.relative(pkgDir, libraryLink), iosDeploymentTarget)
  );
}

function relativeSymlink(target, link) {
  const relative = path.relative(path.dirname(link), target);
  try {
    if (fs.readlinkSync(link) === relative) return;
  } catch {}
  fs.rmSync(link, { recursive: true, force: true });
  fs.symlinkSync(relative, link);
}

function writeIfChanged(file, contents) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === contents) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/** @param packageRoots the directory of each package in `HEADERS_STAND_INS[name].packages`. */
function emitStandInPackage(directDir, name, headersXCFramework, packageRoots, reactDependencies) {
  const { productName, standIns, packages, reactHeaders } = HEADERS_STAND_INS[name];
  const pkgDir = path.join(directDir, name);
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.rmSync(path.join(pkgDir, LEGACY_STUBS_DIR), { recursive: true, force: true });
  relativeSymlink(headersXCFramework, path.join(pkgDir, `${name}.xcframework`));
  writeIfChanged(path.join(pkgDir, `${name}Dependencies`, `${name}Dependencies.swift`), '');
  const dependencies = [
    ...standIns.map((standIn) => ({
      name: standIn,
      product: standIn,
      root: path.join(directDir, standIn),
    })),
    ...packages.map((dependency) => ({ ...dependency, root: packageRoots[dependency.name] })),
  ].map(({ root, ...dependency }) => ({ ...dependency, path: path.relative(pkgDir, root) }));
  writeIfChanged(
    path.join(pkgDir, 'Package.swift'),
    standInManifest(
      name,
      productName,
      dependencies,
      reactHeaders ? reactDependencies : { packages: [], products: [] }
    )
  );
}

/**
 * Wire one module through its own checked-in manifest. Returns the emission shape
 * `manifests.js#emitPackage` returns, so the plugin links it like any manifest package.
 *
 * @param headersXCFrameworks the headers xcframework of each stand-in to emit, by stand-in
 *   name: every one `headersStandInsOf(manifest)` lists.
 * @param jsiHeadersPkgPath the ExpoModulesJSI headers package the plugin emits, or null when
 *   expo-modules-jsi is not autolinked.
 * @param macrosPackageRoot the expo-modules-macros package that expo-modules-core resolves.
 * @param react React Native's ReactDescriptor, or null when React Native passes none.
 * @param codegenPkgPath the app's React-GeneratedCode package, or null when there is none.
 * @param placeholders the RN library placeholders to emit: every one
 *   `rnLibraryPlaceholdersOf(manifest)` lists.
 * @param reactNativeLibsDir the `libs` directory of React Native's sync output, where it links
 *   each library that ships a Package.swift.
 * @param minimumIosDeploymentTarget the Expo modules' iOS floor. Each placeholder declares it, or
 *   PLACEHOLDER_IOS_FLOOR when that is higher or the floor is null.
 * @param manifest the module's manifest, as `dumpModuleManifest` parsed it.
 */
function emitDirectPackage({
  moduleRoot,
  packageName,
  outDir,
  headersXCFrameworks,
  jsiHeadersPkgPath,
  macrosPackageRoot,
  react,
  codegenPkgPath,
  placeholders = [],
  reactNativeLibsDir,
  minimumIosDeploymentTarget,
  manifest,
}) {
  const standIns = Object.keys(headersXCFrameworks);
  const packages = new Set(
    standIns.flatMap((name) =>
      HEADERS_STAND_INS[name].packages.map((dependency) => dependency.name)
    )
  );
  if (packages.has(JSI_HEADERS) && jsiHeadersPkgPath == null) {
    throw pluginError({
      what: `${packageName} is built from its own Package.swift and needs the ExpoModulesJSI headers, but expo-modules-jsi is not autolinked.`,
      why: 'The ExpoModulesCore headers it compiles against re-export ExpoModulesJSI.',
      how: `expo-modules-core depends on expo-modules-jsi, so reinstall your JavaScript dependencies, and remove expo-modules-jsi from \`"expo": { "autolinking": { "exclude": [...] } }\` in your package.json if it is listed there. ${rerunSpmUpdate()}`,
    });
  }
  if (
    packages.has(MACROS_PACKAGE) &&
    !fs.existsSync(path.join(macrosPackageRoot, 'Package.swift'))
  ) {
    throw pluginError({
      what: `${packageName} is built from its own Package.swift and needs the Expo Swift macros as a Swift package, but ${MACROS_PACKAGE} at ${macrosPackageRoot} has no Package.swift.`,
      why: `SwiftPM builds the macro plugin from that package, and versions of ${MACROS_PACKAGE} before 0.29.0 ship it only as a prebuilt binary.`,
      how: `expo-modules-core must depend on ${MACROS_PACKAGE} 0.29.0 or later. Run \`npx expo install --fix\` to align the Expo package versions. ${rerunSpmUpdate()}`,
    });
  }
  const libraryLinks = Object.fromEntries(
    placeholders.map((name) => [
      name,
      path.join(reactNativeLibsDir, RN_LIBRARY_PLACEHOLDERS[name].productName),
    ])
  );
  for (const [name, libraryLink] of Object.entries(libraryLinks)) {
    if (fs.existsSync(libraryLink)) continue;
    const {
      packageName: libraryPackage,
      productName,
      packageSwiftVersions,
    } = RN_LIBRARY_PLACEHOLDERS[name];
    const versions = packageSwiftVersions != null ? ` (${packageSwiftVersions})` : '';
    throw pluginError({
      what: `${packageName}'s Package.swift depends on ${name}, but React Native linked no ${productName} package at ${libraryLink}.`,
      why: `${libraryPackage} is not installed in the app, or the installed version ships no Package.swift, so React Native's sync did not link it.`,
      how: `Install a version of ${libraryPackage} that ships a Package.swift${versions}. \`npx expo install ${libraryPackage}\` can pick a version that does not. ${rerunSpmUpdate()}`,
    });
  }
  const directDir = path.join(outDir, 'direct');
  fs.mkdirSync(directDir, { recursive: true });
  const packageRoots = { [JSI_HEADERS]: jsiHeadersPkgPath, [MACROS_PACKAGE]: macrosPackageRoot };
  const reactDependencies = {
    packages: react != null ? reactPackageDeclarations(react, codegenPkgPath) : [],
    products: react != null ? reactProductDependencies(react) : [],
  };
  for (const name of standIns) {
    emitStandInPackage(directDir, name, headersXCFrameworks[name], packageRoots, reactDependencies);
  }
  for (const [name, libraryLink] of Object.entries(libraryLinks)) {
    emitRNLibraryPlaceholder(directDir, name, libraryLink, minimumIosDeploymentTarget);
  }
  const link = path.join(directDir, packageName);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  relativeSymlink(moduleRoot, link);
  fs.rmSync(path.join(outDir, 'expo-source', manifest.name), { recursive: true, force: true });

  return {
    ok: {
      packageDep: { name: manifest.name, path: link },
      productDeps: manifest.products.map((p) => ({ name: p.name, package: manifest.name })),
      spmProductNames: placeholders.map((name) => RN_LIBRARY_PLACEHOLDERS[name].productName),
      partlyProvidedPackages: [],
    },
  };
}

/**
 * `swift package dump-package` of the checked-in manifest at `moduleRoot`: the JSON the
 * tool printed, and its parse.
 */
function dumpModuleManifest(moduleRoot, packageName) {
  try {
    const json = runDumpPackage(moduleRoot);
    return { json, manifest: JSON.parse(json) };
  } catch (error) {
    throw pluginError(
      {
        what: `${packageName}'s Package.swift could not be evaluated: ${dumpFailureDetail(error)}.`,
        why: `${packageName} is built from source, so the plugin reads its manifest with \`swift package dump-package\` to decide how to build it and to find the products it exports.`,
        how: `Fix the Package.swift in ${moduleRoot}; run \`swift package dump-package\` in that folder to see the full error. If the swift command is missing, install Xcode and select its command line tools with \`sudo xcode-select --switch /Applications/Xcode.app\`. ${rerunSpmUpdate()}`,
      },
      { cause: error }
    );
  }
}

function dumpFailureDetail(error) {
  if (error.code === 'ENOENT') return 'the swift command was not found';
  const output =
    typeof error.stderr === 'string' && error.stderr.trim() ? error.stderr : error.message;
  return output.trim().split('\n')[0];
}

module.exports = {
  HEADERS_STAND_INS,
  dumpModuleManifest,
  emitDirectPackage,
  headersStandInsOf,
  rnLibraryPlaceholdersOf,
};
