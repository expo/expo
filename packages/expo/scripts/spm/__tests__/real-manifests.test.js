'use strict';

const fs = require('fs');
const path = require('path');

const { dumpModuleManifest, emitDirectPackage, headersStandInsOf } = require('../direct');
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

const CORE_ONLY = ['ExpoModulesCoreHeaders'];

const DIRECT_MANIFESTS = [
  ['expo-age-range', 'ExpoAgeRange', CORE_ONLY],
  ['expo-apple-authentication', 'ExpoAppleAuthentication', CORE_ONLY],
  ['expo-asset', 'ExpoAsset', CORE_ONLY],
  ['expo-background-fetch', 'ExpoBackgroundFetch', CORE_ONLY],
  ['expo-battery', 'ExpoBattery', CORE_ONLY],
  ['expo-blur', 'ExpoBlur', CORE_ONLY],
  ['expo-brightness', 'ExpoBrightness', CORE_ONLY],
  ['expo-cellular', 'ExpoCellular', CORE_ONLY],
  ['expo-document-picker', 'ExpoDocumentPicker', CORE_ONLY],
  ['expo-font', 'ExpoFont', CORE_ONLY],
  ['expo-haptics', 'ExpoHaptics', CORE_ONLY],
  ['expo-hinge', 'ExpoHinge', ['ExpoModulesCoreHeaders', 'ExpoModulesWorkletsHeaders']],
  ['expo-keep-awake', 'ExpoKeepAwake', CORE_ONLY],
  ['expo-linear-gradient', 'ExpoLinearGradient', CORE_ONLY],
  ['expo-linking', 'ExpoLinking', CORE_ONLY],
  ['expo-live-photo', 'ExpoLivePhoto', CORE_ONLY],
  ['expo-local-authentication', 'ExpoLocalAuthentication', CORE_ONLY],
  ['expo-mail-composer', 'ExpoMailComposer', CORE_ONLY],
  ['expo-mesh-gradient', 'ExpoMeshGradient', CORE_ONLY],
  ['expo-network', 'ExpoNetwork', CORE_ONLY],
  ['expo-print', 'ExpoPrint', CORE_ONLY],
  ['expo-secure-store', 'ExpoSecureStore', CORE_ONLY],
  ['expo-sensors', 'ExpoSensors', CORE_ONLY],
  ['expo-sms', 'ExpoSMS', CORE_ONLY],
  ['expo-speech', 'ExpoSpeech', CORE_ONLY],
  ['expo-status-bar', 'ExpoStatusBar', CORE_ONLY],
  ['expo-store-review', 'ExpoStoreReview', CORE_ONLY],
  ['expo-symbols', 'ExpoSymbols', CORE_ONLY],
  ['expo-video-thumbnails', 'ExpoVideoThumbnails', CORE_ONLY],
  ['expo-web-browser', 'ExpoWebBrowser', CORE_ONLY],
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
  (packageName, productName, standIns) => {
    const tmp = makeTempDir('spm-real-manifest-');
    const moduleRoot = installLikeNpm(packageName, path.join(tmp, 'app'));
    expect(fs.existsSync(path.join(moduleRoot, 'ios', 'Tests'))).toBe(false);

    const { manifest } = dumpModuleManifest(moduleRoot, packageName);
    expect(headersStandInsOf(manifest)).toEqual(standIns);

    const outDir = path.join(tmp, 'out');
    const headersXCFrameworks = Object.fromEntries(
      standIns.map((name) => [name, path.join(tmp, 'headers', `${name}.xcframework`)])
    );
    Object.values(headersXCFrameworks).forEach((xcframework) =>
      fs.mkdirSync(xcframework, { recursive: true })
    );
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
      headersXCFrameworks,
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
