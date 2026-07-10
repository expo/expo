'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  stableFrameworkId,
  validateFlavoredFramework,
} = require('../flavored-frameworks');

function makeXcframework(root, frameworkName, flavor, contents = flavor) {
  const xcframework = path.join(root, flavor, `${frameworkName}.xcframework`);
  const framework = path.join(xcframework, 'ios-arm64', `${frameworkName}.framework`);
  fs.mkdirSync(path.join(framework, 'Headers'), { recursive: true });
  fs.mkdirSync(path.join(framework, 'Modules', `${frameworkName}.swiftmodule`), {
    recursive: true,
  });
  fs.writeFileSync(path.join(xcframework, 'Info.plist'), '<plist/>');
  fs.writeFileSync(path.join(framework, 'Headers', `${frameworkName}.h`), contents);
  fs.writeFileSync(
    path.join(framework, 'Modules', `${frameworkName}.swiftmodule`, 'arm64-apple-ios.swiftinterface'),
    contents
  );
  return xcframework;
}

function declaration(frameworkName, debug, release, overrides = {}) {
  return {
    id: stableFrameworkId(frameworkName),
    frameworkName,
    linkage: 'dynamic',
    flavors: { debug, release },
    ...overrides,
  };
}

describe('validateFlavoredFramework', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-flavored-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('returns the strict two-flavor dynamic declaration', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    const release = makeXcframework(root, 'ExpoTest', 'release');
    expect(validateFlavoredFramework(declaration('ExpoTest', debug, release))).toEqual({
      id: 'expo-test',
      frameworkName: 'ExpoTest',
      linkage: 'dynamic',
      flavors: { debug, release },
    });
  });

  it('rejects a missing Debug or Release path', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    expect(() =>
      validateFlavoredFramework(declaration('ExpoTest', debug, undefined))
    ).toThrow('release path must be absolute');
  });

  it('rejects static linkage', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    const release = makeXcframework(root, 'ExpoTest', 'release');
    expect(() =>
      validateFlavoredFramework(
        declaration('ExpoTest', debug, release, { linkage: 'static' })
      )
    ).toThrow('linkage="dynamic"');
  });

  it('rejects relative, malformed, and wrongly named XCFramework paths', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    const release = makeXcframework(root, 'ExpoTest', 'release');
    expect(() =>
      validateFlavoredFramework(declaration('ExpoTest', 'relative/ExpoTest.xcframework', release))
    ).toThrow('debug path must be absolute');
    expect(() =>
      validateFlavoredFramework(declaration('WrongName', debug, release))
    ).toThrow('must identify WrongName.xcframework');

    fs.rmSync(path.join(debug, 'Info.plist'));
    expect(() => validateFlavoredFramework(declaration('ExpoTest', debug, release))).toThrow(
      'debug XCFramework is incomplete'
    );
  });
});

describe('artifact preparation', () => {
  let root;
  let oldOverride;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-artifacts-'));
    oldOverride = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = root;
  });

  afterEach(() => {
    if (oldOverride == null) {
      delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    } else {
      process.env.EXPO_PRECOMPILED_MODULES_PATH = oldOverride;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('fails when a discovered artifact base contains only one flavor', () => {
    const output = path.join(root, 'test-package', 'output');
    const debug = makeXcframework(output, 'ExpoPair', 'debug');
    fs.mkdirSync(path.join(output, 'debug', 'xcframeworks'), { recursive: true });
    fs.renameSync(
      debug,
      path.join(output, 'debug', 'xcframeworks', 'ExpoPair.xcframework')
    );
    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow('missing release');
  });

  it('expands both bundled tarballs before returning absolute flavor paths', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of ['debug', 'release']) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'ExpoPair', flavor);
      const sourceDir = path.join(source, flavor);
      const tarballDir = path.join(output, flavor, 'xcframeworks');
      fs.mkdirSync(tarballDir, { recursive: true });
      execFileSync('tar', [
        '-czf',
        path.join(tarballDir, 'ExpoPair.tar.gz'),
        '-C',
        sourceDir,
        'ExpoPair.xcframework',
      ]);
    }

    const result = resolveFlavoredFramework({
      packageName: 'test-package',
      moduleRoot: path.join(root, 'module'),
      frameworkName: 'ExpoPair',
      cacheDir: path.join(root, 'cache'),
    });
    expect(result).toEqual({
      id: 'expo-pair',
      frameworkName: 'ExpoPair',
      linkage: 'dynamic',
      flavors: {
        debug: path.join(root, 'cache', 'expo-pair', 'debug', 'ExpoPair.xcframework'),
        release: path.join(root, 'cache', 'expo-pair', 'release', 'ExpoPair.xcframework'),
      },
    });
    expect(fs.existsSync(path.join(result.flavors.debug, 'Info.plist'))).toBe(true);
    expect(fs.existsSync(path.join(result.flavors.release, 'Info.plist'))).toBe(true);
  });

  it('produces byte-identical compile interfaces regardless of declaration order', () => {
    const aDebug = makeXcframework(root, 'ExpoA', 'a-debug', 'a');
    const aRelease = makeXcframework(root, 'ExpoA', 'a-release', 'a');
    const bDebug = makeXcframework(root, 'ExpoB', 'b-debug', 'b');
    const bRelease = makeXcframework(root, 'ExpoB', 'b-release', 'b');
    const a = validateFlavoredFramework(declaration('ExpoA', aDebug, aRelease));
    const b = validateFlavoredFramework(declaration('ExpoB', bDebug, bRelease));
    const destination = path.join(root, 'interfaces');

    prepareCompileInterfaces([b, a], destination);
    const first = [
      fs.readFileSync(path.join(destination, 'ExpoA.framework', 'Headers', 'ExpoA.h'), 'utf8'),
      fs.readFileSync(path.join(destination, 'ExpoB.framework', 'Headers', 'ExpoB.h'), 'utf8'),
    ];
    prepareCompileInterfaces([a, b], destination);
    const second = [
      fs.readFileSync(path.join(destination, 'ExpoA.framework', 'Headers', 'ExpoA.h'), 'utf8'),
      fs.readFileSync(path.join(destination, 'ExpoB.framework', 'Headers', 'ExpoB.h'), 'utf8'),
    ];
    expect(second).toEqual(first);
  });
});
