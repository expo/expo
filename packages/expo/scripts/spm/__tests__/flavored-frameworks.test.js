'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  FLAVORS,
  assertHeadersMatchSources,
  byteOrder,
  headersXCFrameworkDirs,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveHeadersXCFramework,
  stableFrameworkId,
  validateFlavoredFramework,
} = require('../flavored-frameworks');
const { thrownBy } = require('./helpers');

// GNU tar reads the `C:` in a Windows path as a remote hostname and fails to connect.
const itNotWindows = process.platform === 'win32' ? it.skip : it;

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
    path.join(
      framework,
      'Modules',
      `${frameworkName}.swiftmodule`,
      'arm64-apple-ios.swiftinterface'
    ),
    contents
  );
  return xcframework;
}

function packTarball(sourceDir, tarballPath, entries, { preservePaths = false } = {}) {
  fs.mkdirSync(path.dirname(tarballPath), { recursive: true });
  const flags = preservePaths ? ['-czPf'] : ['-czf'];
  execFileSync('tar', [...flags, tarballPath, '-C', sourceDir, ...entries]);
  return tarballPath;
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

describe('byteOrder', () => {
  // The compile-interface merge and the declaration order both run through it,
  // and a locale-aware comparison would order these the other way around.
  it('orders every uppercase letter before every lowercase one, as CocoaPods does', () => {
    expect(['expo-a', 'expo-B'].sort(byteOrder)).toEqual(['expo-B', 'expo-a']);
  });
});

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
    expect(() => validateFlavoredFramework(declaration('ExpoTest', debug, undefined))).toThrow(
      'release path must be absolute'
    );
  });

  it('rejects static linkage', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    const release = makeXcframework(root, 'ExpoTest', 'release');
    expect(() =>
      validateFlavoredFramework(declaration('ExpoTest', debug, release, { linkage: 'static' }))
    ).toThrow('linkage="dynamic"');
  });

  it('rejects relative, malformed, and wrongly named XCFramework paths', () => {
    const debug = makeXcframework(root, 'ExpoTest', 'debug');
    const release = makeXcframework(root, 'ExpoTest', 'release');
    expect(() =>
      validateFlavoredFramework(declaration('ExpoTest', 'relative/ExpoTest.xcframework', release))
    ).toThrow('debug path must be absolute');
    expect(() => validateFlavoredFramework(declaration('WrongName', debug, release))).toThrow(
      'must identify WrongName.xcframework'
    );

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
    fs.renameSync(debug, path.join(output, 'debug', 'xcframeworks', 'ExpoPair.xcframework'));
    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow('missing release');
  });

  itNotWindows('expands both bundled tarballs before returning absolute flavor paths', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of ['debug', 'release']) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'ExpoPair', flavor);
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['ExpoPair.xcframework']
      );
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

  it('accepts a tarball that also bundles a SwiftPM dependency xcframework', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'ExpoPair', flavor);
      makeXcframework(source, 'Lottie', flavor);
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['ExpoPair.xcframework', 'Lottie.xcframework']
      );
    }

    const result = resolveFlavoredFramework({
      packageName: 'test-package',
      moduleRoot: path.join(root, 'module'),
      frameworkName: 'ExpoPair',
      cacheDir: path.join(root, 'cache'),
    });
    expect(result.flavors).toEqual({
      debug: path.join(root, 'cache', 'expo-pair', 'debug', 'ExpoPair.xcframework'),
      release: path.join(root, 'cache', 'expo-pair', 'release', 'ExpoPair.xcframework'),
    });
    expect(fs.existsSync(path.join(result.flavors.debug, 'Info.plist'))).toBe(true);
    expect(
      fs.existsSync(path.join(root, 'cache', 'expo-pair', 'debug', 'Lottie.xcframework'))
    ).toBe(true);
  });

  it('rejects a tarball holding an entry outside an xcframework root', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'ExpoPair', flavor);
      fs.writeFileSync(path.join(source, flavor, 'README.md'), 'stray');
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['ExpoPair.xcframework', 'README.md']
      );
    }

    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow("'README.md' is not part of an .xcframework");
  });

  it('rejects a tarball that never contains the requested framework', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'Lottie', flavor);
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['Lottie.xcframework']
      );
    }

    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow('does not contain ExpoPair.xcframework');
  });

  it('rejects a tarball whose member escapes through an absolute path', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      const xcframework = makeXcframework(source, 'ExpoPair', flavor);
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        [xcframework],
        { preservePaths: true }
      );
    }

    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow(/holds the unsafe path '\/.*ExpoPair\.xcframework/);
  });

  it("rejects a tarball whose member escapes through '..'", () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      const xcframework = makeXcframework(source, 'ExpoPair', flavor);
      packTarball(
        xcframework,
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['../ExpoPair.xcframework'],
        { preservePaths: true }
      );
    }

    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow("holds the unsafe path '../ExpoPair.xcframework");
  });

  it('rejects a root named only .xcframework', () => {
    const output = path.join(root, 'test-package', 'output');
    for (const flavor of FLAVORS) {
      const source = path.join(root, `source-${flavor}`);
      makeXcframework(source, 'ExpoPair', flavor);
      fs.mkdirSync(path.join(source, flavor, '.xcframework'), { recursive: true });
      fs.writeFileSync(path.join(source, flavor, '.xcframework', 'Info.plist'), '<plist/>');
      packTarball(
        path.join(source, flavor),
        path.join(output, flavor, 'xcframeworks', 'ExpoPair.tar.gz'),
        ['ExpoPair.xcframework', '.xcframework']
      );
    }

    expect(() =>
      resolveFlavoredFramework({
        packageName: 'test-package',
        moduleRoot: path.join(root, 'module'),
        frameworkName: 'ExpoPair',
        cacheDir: path.join(root, 'cache'),
      })
    ).toThrow('is not part of an .xcframework');
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

describe('resolveHeadersXCFramework', () => {
  let root;
  let oldOverride;
  let moduleRoot;

  /** `<output>/headers/xcframeworks/ExpoPairHeaders.xcframework`, the layout the prebuild writes. */
  const headersIn = (output) =>
    makeXcframework(path.join(output, 'headers'), 'ExpoPairHeaders', 'xcframeworks');
  const resolve = () =>
    resolveHeadersXCFramework({
      packageName: 'test-package',
      moduleRoot,
      productName: 'ExpoPair',
      cacheDir: path.join(root, 'cache'),
    });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-headers-'));
    moduleRoot = path.join(root, 'module');
    oldOverride = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = path.join(root, 'override');
  });

  afterEach(() => {
    if (oldOverride == null) {
      delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
    } else {
      process.env.EXPO_PRECOMPILED_MODULES_PATH = oldOverride;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('returns null when no lookup base has the headers', () => {
    expect(resolve()).toBeNull();
  });

  it('names the directories it searches, in lookup order', () => {
    expect(headersXCFrameworkDirs('test-package', moduleRoot)).toEqual([
      path.join(root, 'override', 'test-package', 'output', 'headers', 'xcframeworks'),
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'precompile',
        '.build',
        'test-package',
        'output',
        'headers',
        'xcframeworks'
      ),
      path.join(moduleRoot, 'prebuilds', 'output', 'headers', 'xcframeworks'),
    ]);
  });

  it('finds the headers the installed package ships under prebuilds/output', () => {
    const shipped = headersIn(path.join(moduleRoot, 'prebuilds', 'output'));
    expect(resolve()).toBe(shipped);
  });

  it('prefers EXPO_PRECOMPILED_MODULES_PATH over the installed package', () => {
    headersIn(path.join(moduleRoot, 'prebuilds', 'output'));
    const override = headersIn(path.join(root, 'override', 'test-package', 'output'));
    expect(resolve()).toBe(override);
  });

  itNotWindows('expands a bundled tarball into the cache', () => {
    const source = path.join(root, 'source');
    headersIn(source);
    packTarball(
      path.join(source, 'headers', 'xcframeworks'),
      path.join(
        moduleRoot,
        'prebuilds',
        'output',
        'headers',
        'xcframeworks',
        'ExpoPairHeaders.tar.gz'
      ),
      ['ExpoPairHeaders.xcframework']
    );

    const resolved = resolve();
    expect(resolved).toBe(
      path.join(root, 'cache', 'expo-pair-headers', 'headers', 'ExpoPairHeaders.xcframework')
    );
    expect(fs.existsSync(path.join(resolved, 'Info.plist'))).toBe(true);
  });

  it('rejects an expanded XCFramework with no Info.plist', () => {
    const shipped = headersIn(path.join(moduleRoot, 'prebuilds', 'output'));
    fs.rmSync(path.join(shipped, 'Info.plist'));
    expect(resolve).toThrow(`${shipped} has no Info.plist`);
  });
});

describe('assertHeadersMatchSources', () => {
  let root;
  let headers;

  const writeJson = (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value));
  };
  const stampHeaders = (version) =>
    writeJson(path.join(headers, 'expo-package.json'), { name: 'test-package', version });
  const installed = (name, version) => {
    const dir = path.join(root, name);
    writeJson(path.join(dir, 'package.json'), { name: 'test-package', version });
    return dir;
  };
  const check = (sourceRoots) =>
    assertHeadersMatchSources(headers, {
      packageName: 'test-package',
      productName: 'ExpoPair',
      sourceRoots,
    });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-headers-version-'));
    headers = path.join(root, 'ExpoPairHeaders.xcframework');
    fs.mkdirSync(headers);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Headers published before the stamp existed carry none.
  it('accepts headers without a version stamp', () => {
    expect(() => check([installed('module', '1.0.0')])).not.toThrow();
  });

  it('accepts headers of the same version as every source', () => {
    stampHeaders('1.0.0');
    expect(() => check([installed('module', '1.0.0'), installed('built', '1.0.0')])).not.toThrow();
  });

  it('rejects headers of another version, naming both versions, both paths, why and how', () => {
    stampHeaders('2.0.0');
    const moduleRoot = installed('module', '1.0.0');
    const { message } = thrownBy(() => check([moduleRoot]));
    for (const part of [headers, '2.0.0', moduleRoot, '1.0.0']) {
      expect(message).toContain(part);
    }
    expect(message).toContain('"Build ExpoPair" phase builds the framework from the installed');
    expect(message).toContain('et prebuild test-package');
    expect(message).toContain('EXPO_PRECOMPILED_MODULES_PATH');
  });

  it('rejects headers that differ from any one source', () => {
    stampHeaders('1.0.0');
    const built = installed('built', '1.1.0');
    expect(() => check([installed('module', '1.0.0'), built])).toThrow(built);
  });

  it('names a stamp it cannot parse instead of surfacing the JSON error', () => {
    const stampPath = path.join(headers, 'expo-package.json');
    fs.writeFileSync(stampPath, '{ not json');
    const { message } = thrownBy(() => check([installed('module', '1.0.0')]));
    expect(message).toContain(`[expo-spm-plugin] ${stampPath}`);
    expect(message).toContain('et prebuild test-package');
    expect(message).not.toMatch(/SyntaxError|Unexpected token/);
  });

  it('names a stamp without a version', () => {
    const stampPath = path.join(headers, 'expo-package.json');
    writeJson(stampPath, { name: 'test-package' });
    expect(() => check([installed('module', '1.0.0')])).toThrow(`[expo-spm-plugin] ${stampPath}`);
  });

  it('names an installed package.json without a version', () => {
    stampHeaders('1.0.0');
    const moduleRoot = installed('module', undefined);
    const { message } = thrownBy(() => check([moduleRoot]));
    expect(message).toContain(`[expo-spm-plugin] ${path.join(moduleRoot, 'package.json')}`);
    expect(message).not.toContain('undefined');
  });
});
