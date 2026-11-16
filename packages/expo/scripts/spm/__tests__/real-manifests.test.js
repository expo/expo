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

const DIRECT_MANIFESTS = [
  ['expo-age-range', 'ExpoAgeRange'],
  ['expo-apple-authentication', 'ExpoAppleAuthentication'],
  ['expo-asset', 'ExpoAsset'],
  ['expo-background-fetch', 'ExpoBackgroundFetch'],
  ['expo-battery', 'ExpoBattery'],
  ['expo-blur', 'ExpoBlur'],
  ['expo-brightness', 'ExpoBrightness'],
  ['expo-cellular', 'ExpoCellular'],
  ['expo-document-picker', 'ExpoDocumentPicker'],
  ['expo-font', 'ExpoFont'],
  ['expo-haptics', 'ExpoHaptics'],
  ['expo-keep-awake', 'ExpoKeepAwake'],
  ['expo-linear-gradient', 'ExpoLinearGradient'],
  ['expo-linking', 'ExpoLinking'],
  ['expo-live-photo', 'ExpoLivePhoto'],
  ['expo-local-authentication', 'ExpoLocalAuthentication'],
  ['expo-mail-composer', 'ExpoMailComposer'],
  ['expo-mesh-gradient', 'ExpoMeshGradient'],
  ['expo-network', 'ExpoNetwork'],
  ['expo-print', 'ExpoPrint'],
  ['expo-secure-store', 'ExpoSecureStore'],
  ['expo-sensors', 'ExpoSensors'],
  ['expo-sms', 'ExpoSMS'],
  ['expo-speech', 'ExpoSpeech'],
  ['expo-status-bar', 'ExpoStatusBar'],
  ['expo-store-review', 'ExpoStoreReview'],
  ['expo-symbols', 'ExpoSymbols'],
  ['expo-video-thumbnails', 'ExpoVideoThumbnails'],
  ['expo-web-browser', 'ExpoWebBrowser'],
];

// expo-dev-menu-interface depends on nothing, so the plugin builds it through the generated
// manifest, not the direct path.
const CHECKED_IN_MANIFESTS = [
  ...DIRECT_MANIFESTS.map(([packageName]) => packageName),
  'expo-dev-menu-interface',
];

// These run the real `swift package dump-package`, so they read the checked-in manifests as
// SwiftPM does rather than a recorded dump of them.
it.each(DIRECT_MANIFESTS)(
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
    const macrosPackageRoot = path.join(tmp, 'app', 'node_modules', 'expo-modules-macros');
    fs.mkdirSync(macrosPackageRoot, { recursive: true });
    fs.writeFileSync(
      path.join(macrosPackageRoot, 'Package.swift'),
      '// swift-tools-version: 6.2\n'
    );

    const { ok } = emitDirectPackage({
      moduleRoot,
      packageName,
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath: path.join(outDir, 'ExpoModulesJSIHeaders'),
      macrosPackageRoot,
      manifest,
    });

    const link = path.join(outDir, 'direct', packageName);
    expect(ok.packageDep).toEqual({ name: packageName, path: link });
    expect(ok.productDeps).toEqual([{ name: productName, package: packageName }]);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(moduleRoot));
  },
  60_000
);

it.each(CHECKED_IN_MANIFESTS)(
  'loads the macros of the real %s with no unsafe flags',
  (packageName) => {
    const moduleRoot = installLikeNpm(packageName, makeTempDir('spm-real-manifest-'));
    const { manifest } = dumpModuleManifest(moduleRoot, packageName);
    const unsafeSettings = manifest.targets
      .flatMap((target) => target.settings ?? [])
      .filter((setting) => setting.kind?.unsafeFlags != null);
    expect(unsafeSettings).toEqual([]);
  },
  60_000
);
