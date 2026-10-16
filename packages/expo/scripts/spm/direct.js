/**
 * SPIKE — consume a module's checked-in Package.swift DIRECTLY, with no generated
 * wrapper manifest. The module's own manifest names its Expo dependencies by paths
 * relative to `<outDir>/direct/<package>`, so this writes those neighbours:
 *
 *   direct/<package>                 → relative symlink to the module root
 *   direct/ExpoModulesCoreHeaders    → compile-only ExpoModulesCore + ExpoModulesJSI
 *   $BUILD_DIR/ExpoModulesMacros     → relative symlink to the prebuilt macro plugin; the
 *                                      manifest names it as `${BUILD_DIR}/ExpoModulesMacros`
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { runDumpPackage } = require('./cli');

const DIRECT_MODULES = new Set(['expo-haptics']);
const HEADER_MODULES = ['ExpoModulesCore', 'ExpoModulesJSI'];
const STUB_LIBRARY = 'libExpoModulesCoreHeaders.a';

// The real frameworks are dynamic, and RN links and embeds them outside SwiftPM. The
// compile-only copy is a LIBRARY xcframework: Xcode embeds every framework a package
// binary target vends, static or not, and the copy would collide with RN's embedded
// one. A library slice is linked, never embedded, and its stub archive defines one
// unreferenced symbol, so the linker pulls nothing from it.
const SLICES = [
  { id: 'ios-arm64', sdk: 'iphoneos', archs: ['arm64'], variant: null },
  {
    id: 'ios-arm64_x86_64-simulator',
    sdk: 'iphonesimulator',
    archs: ['arm64', 'x86_64'],
    variant: 'simulator',
  },
];

function relativeSymlink(target, link) {
  fs.rmSync(link, { recursive: true, force: true });
  fs.symlinkSync(path.relative(path.dirname(link), target), link);
}

function writeIfChanged(file, contents) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === contents) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function buildStubArchive(slice, output, scratch) {
  const source = path.join(scratch, 'stub.c');
  fs.writeFileSync(source, `int ExpoModulesCoreHeadersStub_${slice.sdk} = 0;\n`);
  const objects = slice.archs.map((arch) => {
    const object = path.join(scratch, `${slice.sdk}-${arch}.o`);
    const target = `${arch}-apple-ios16.4${slice.variant ? `-${slice.variant}` : ''}`;
    execFileSync('xcrun', [
      '--sdk',
      slice.sdk,
      'clang',
      '-target',
      target,
      '-c',
      source,
      '-o',
      object,
    ]);
    return object;
  });
  execFileSync('xcrun', ['libtool', '-static', '-o', output, ...objects]);
}

function xcframeworkInfoPlist() {
  const libraries = SLICES.map(
    (slice) => `		<dict>
			<key>BinaryPath</key>
			<string>${STUB_LIBRARY}</string>
			<key>HeadersPath</key>
			<string>Headers</string>
			<key>LibraryIdentifier</key>
			<string>${slice.id}</string>
			<key>LibraryPath</key>
			<string>${STUB_LIBRARY}</string>
			<key>SupportedArchitectures</key>
			<array>
${slice.archs.map((a) => `				<string>${a}</string>`).join('\n')}
			</array>
			<key>SupportedPlatform</key>
			<string>ios</string>${
        slice.variant
          ? `
			<key>SupportedPlatformVariant</key>
			<string>${slice.variant}</string>`
          : ''
      }
		</dict>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AvailableLibraries</key>
	<array>
${libraries}
	</array>
	<key>CFBundlePackageType</key>
	<string>XFWK</string>
	<key>XCFrameworkFormatVersion</key>
	<string>1.0</string>
</dict>
</plist>
`;
}

/**
 * A framework's clang module map, rewritten for a plain include directory. Xcode merges
 * every library slice's `Headers` into one shared `include/`, so each module keeps its
 * map in its own `<Module>/` subdirectory, where clang finds it by module name.
 */
function headerModuleMap(framework, name) {
  const source = [
    path.join(framework, 'Modules', 'module.modulemap'),
    path.join(framework, 'Headers', 'module.modulemap'),
  ].find((file) => fs.existsSync(file));
  return (
    source && fs.readFileSync(source, 'utf8').replace(`framework module ${name}`, `module ${name}`)
  );
}

/** Headers-only ExpoModulesCore/ExpoModulesJSI: the invariant interface tree around a stub archive. */
function emitCoreHeadersPackage(directDir, compileInterfacesDir) {
  const pkgDir = path.join(directDir, 'ExpoModulesCoreHeaders');
  const stubCache = path.join(pkgDir, '.stubs');
  const xcframework = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
  fs.mkdirSync(stubCache, { recursive: true });
  fs.rmSync(xcframework, { recursive: true, force: true });
  for (const slice of SLICES) {
    const sliceDir = path.join(xcframework, slice.id);
    const stub = path.join(stubCache, `${slice.id}.a`);
    if (!fs.existsSync(stub)) buildStubArchive(slice, stub, stubCache);
    fs.mkdirSync(sliceDir, { recursive: true });
    fs.copyFileSync(stub, path.join(sliceDir, STUB_LIBRARY));
    for (const name of HEADER_MODULES) {
      const framework = path.join(compileInterfacesDir, `${name}.framework`);
      const headers = path.join(sliceDir, 'Headers', name);
      // Copied, not linked: Xcode copies each slice into the build products directory,
      // where a relative symlink would no longer resolve.
      fs.cpSync(path.join(framework, 'Headers'), headers, { recursive: true });
      const moduleMap = headerModuleMap(framework, name);
      if (moduleMap != null) fs.writeFileSync(path.join(headers, 'module.modulemap'), moduleMap);
      fs.cpSync(
        path.join(framework, 'Modules', `${name}.swiftmodule`),
        path.join(sliceDir, `${name}.swiftmodule`),
        { recursive: true }
      );
    }
  }
  fs.writeFileSync(path.join(xcframework, 'Info.plist'), xcframeworkInfoPlist());
  writeIfChanged(
    path.join(pkgDir, 'Package.swift'),
    `// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/direct.js — do not edit.
// Compile-only ExpoModulesCore and ExpoModulesJSI. The runtime frameworks are linked
// and embedded by React Native outside SwiftPM.
import PackageDescription

let package = Package(
    name: "ExpoModulesCoreHeaders",
    products: [
        .library(name: "ExpoModulesCoreHeaders", targets: ["ExpoModulesCoreHeaders"]),
    ],
    targets: [
        .binaryTarget(name: "ExpoModulesCoreHeaders", path: "ExpoModulesCoreHeaders.xcframework"),
    ]
)
`
  );
}

/**
 * Wire one module through its own checked-in manifest. Returns the emission shape
 * `manifests.js#emitPackage` returns, so the plugin links it like any manifest package.
 */
function emitDirectPackage({ moduleRoot, packageName, outDir, compileInterfacesDir, macroTool }) {
  const directDir = path.join(outDir, 'direct');
  fs.mkdirSync(directDir, { recursive: true });
  emitCoreHeadersPackage(directDir, compileInterfacesDir);
  // BUILD_DIR is set only when sync runs as the scheme pre-action, which precedes every build.
  if (process.env.BUILD_DIR) {
    fs.mkdirSync(process.env.BUILD_DIR, { recursive: true });
    relativeSymlink(macroTool, path.join(process.env.BUILD_DIR, 'ExpoModulesMacros'));
  }
  const link = path.join(directDir, packageName);
  relativeSymlink(moduleRoot, link);
  fs.rmSync(path.join(outDir, 'expo-source', packageName), { recursive: true, force: true });

  const manifest = JSON.parse(runDumpPackage(link));
  return {
    ok: {
      packageDep: { name: manifest.name, path: link },
      productDeps: manifest.products.map((p) => ({ name: p.name, package: manifest.name })),
      spmProductNames: [],
      partlyProvidedPackages: [],
    },
  };
}

module.exports = { DIRECT_MODULES, emitDirectPackage };
