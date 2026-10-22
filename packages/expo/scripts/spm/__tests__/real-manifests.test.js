'use strict';

const fs = require('fs');
const path = require('path');

const { dependsOnCoreHeaders, dumpModuleManifest, emitDirectPackage } = require('../direct');
const { makeTempDir, removeTempDirs } = require('./helpers');

const REPO_ROOT = path.resolve(__dirname, '../../../../..');

/**
 * Copies a repository package the way npm installs it: the package's `.npmignore` strips
 * `/ios/Tests/**`, so a manifest that excludes `Tests` names a directory that is not there.
 */
function installLikeNpm(packageName, destination) {
  const source = path.join(REPO_ROOT, 'packages', packageName);
  const moduleRoot = path.join(destination, 'node_modules', packageName);
  fs.cpSync(source, moduleRoot, {
    recursive: true,
    filter: (file) => {
      const relative = path.relative(source, file);
      return relative !== 'node_modules' && relative !== path.join('ios', 'Tests');
    },
  });
  return moduleRoot;
}

afterEach(removeTempDirs);

// These run the real `swift package dump-package`, so they read the checked-in manifests as
// SwiftPM does rather than a recorded dump of them.
it.each([
  ['expo-haptics', 'ExpoHaptics'],
  ['expo-sensors', 'ExpoSensors'],
])(
  'links the real %s, installed from npm, directly through its checked-in Package.swift',
  (packageName, productName) => {
    const tmp = makeTempDir('spm-real-manifest-');
    const moduleRoot = installLikeNpm(packageName, path.join(tmp, 'app'));
    expect(fs.existsSync(path.join(moduleRoot, 'ios', 'Tests'))).toBe(false);

    const { manifest } = dumpModuleManifest(moduleRoot, packageName);
    expect(dependsOnCoreHeaders(manifest)).toBe(true);

    const outDir = path.join(tmp, 'out');
    const coreHeadersXCFramework = path.join(tmp, 'headers', 'ExpoModulesCoreHeaders.xcframework');
    fs.mkdirSync(coreHeadersXCFramework, { recursive: true });

    const { ok } = emitDirectPackage({
      moduleRoot,
      packageName,
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath: path.join(outDir, 'ExpoModulesJSIHeaders'),
      macroTool: path.join(tmp, 'ExpoModulesMacros'),
      manifest,
    });

    const link = path.join(outDir, 'direct', packageName);
    expect(ok.packageDep).toEqual({ name: packageName, path: link });
    expect(ok.productDeps).toEqual([{ name: productName, package: packageName }]);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(moduleRoot));
  },
  60_000
);
