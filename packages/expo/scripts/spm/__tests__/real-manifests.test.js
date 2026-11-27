'use strict';

const fs = require('fs');
const path = require('path');

const { dumpModuleManifest, emitDirectPackage, headersStandInsOf } = require('../direct');
const { makeTempDir, removeTempDirs } = require('./helpers');

const REPO_ROOT = path.resolve(__dirname, '../../../../..');

const REPO_FOLDERS = { '@expo/ui': 'expo-ui' };

/**
 * Copies a repository package the way npm installs it: the package's `.npmignore` strips
 * `/ios/Tests/**`, so a manifest that excludes `Tests` names a directory that is not there.
 */
function installLikeNpm(packageName, destination) {
  const source = path.join(REPO_ROOT, 'packages', REPO_FOLDERS[packageName] ?? packageName);
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
  ['@expo/ui', 'ExpoUI', ['ExpoModulesCoreHeaders', 'ExpoModulesWorkletsHeaders']],
  ['expo-age-range', 'ExpoAgeRange', CORE_ONLY],
  ['expo-ai', 'ExpoAI', CORE_ONLY],
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
  ['expo-location', ['ExpoLocation', 'ExpoLocationMotionActivity'], CORE_ONLY],
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

    const swiftPackageName = packageName.startsWith('@')
      ? packageName.slice(1).replace('/', '-')
      : packageName;
    const link = path.join(outDir, 'direct', packageName);
    expect(ok.packageDep).toEqual({ name: swiftPackageName, path: link });
    expect(ok.productDeps).toEqual(
      [productName].flat().map((name) => ({ name, package: swiftPackageName }))
    );
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

/** The targets a product of a dumped manifest builds, with every target they depend on. */
function targetsBuiltBy(manifest, productName) {
  const targets = new Map(manifest.targets.map((target) => [target.name, target]));
  const built = new Map();
  const visit = (name) => {
    if (built.has(name) || !targets.has(name)) return;
    built.set(name, targets.get(name));
    for (const dependency of targets.get(name).dependencies ?? []) {
      visit((dependency.byName ?? dependency.target)?.[0]);
    }
  };
  manifest.products.find((product) => product.name === productName)?.targets.forEach(visit);
  return [...built.values()];
}

/** Whether a dumped target compiles `file`, a path relative to the package root. */
function compiles(target, file) {
  const inTarget = path.relative(target.path ?? path.join('Sources', target.name), file);
  if (inTarget.startsWith('..')) return false;
  const under = (entry) => inTarget === entry || inTarget.startsWith(`${entry}/`);
  return !(target.exclude ?? []).some(under) && (target.sources?.some(under) ?? true);
}

describe('the motion-activity companion of the real expo-location', () => {
  const MOTION_PRODUCT = 'ExpoLocationMotionActivity';

  it('is gated by the Podfile property the location config plugin writes', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, 'packages', 'expo-location', 'spm.config.json'), 'utf8')
    );
    const product = config.products.find(({ name }) => name === MOTION_PRODUCT);
    expect(product?.autolinkWhen).toEqual({
      podfileProperty: 'expo.location.motionActivityEnabled',
      disabledValue: 'false',
    });
  });

  // The plugin withholds a gated product by not depending on it, so ExpoLocation links
  // CoreMotion unless every source that imports it builds only in the companion.
  it('builds every source importing CoreMotion, and ExpoLocation builds none', () => {
    const moduleRoot = installLikeNpm('expo-location', makeTempDir('spm-real-manifest-'));
    const { manifest } = dumpModuleManifest(moduleRoot, 'expo-location');
    const coreMotionSources = fs
      .readdirSync(moduleRoot, { recursive: true })
      .filter((file) => file.startsWith('ios/') && /\.(swift|h|m|mm)$/.test(file))
      .filter((file) =>
        /^\s*((@\w+\s+)*import\s+((typealias|struct|class|enum|protocol|let|var|func)\s+)?CoreMotion\b|@import\s+CoreMotion\b|#(import|include)\s+[<"]CoreMotion\/)/m.test(
          fs.readFileSync(path.join(moduleRoot, file), 'utf8')
        )
      );
    expect(coreMotionSources).not.toEqual([]);

    const builders = (file) =>
      ['ExpoLocation', MOTION_PRODUCT].filter((product) =>
        targetsBuiltBy(manifest, product).some((target) => compiles(target, file))
      );
    expect(Object.fromEntries(coreMotionSources.map((file) => [file, builders(file)]))).toEqual(
      Object.fromEntries(coreMotionSources.map((file) => [file, [MOTION_PRODUCT]]))
    );
  }, 60_000);
});
