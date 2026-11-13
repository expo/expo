'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({
  runDumpPackage: jest.fn(() =>
    JSON.stringify({ name: 'ExpoHaptics', products: [{ name: 'ExpoHaptics' }] })
  ),
}));

const { runDumpPackage } = require('../cli');
const { dependsOnCoreHeaders, dumpModuleManifest, emitDirectPackage } = require('../direct');
const { rerunSpmUpdate, thrownBy } = require('./helpers');

const hapticsManifest = {
  name: 'expo-haptics',
  products: [{ name: 'ExpoHaptics' }, { name: 'ExpoHapticsExtras' }],
};

/** A dumped manifest whose one target depends on `dependencies`. */
const manifestDependingOn = (...dependencies) => ({
  name: 'expo-haptics',
  products: [{ name: 'ExpoHaptics' }],
  targets: [{ name: 'ExpoHaptics', type: 'regular', dependencies }],
});

describe('dependsOnCoreHeaders', () => {
  // Verbatim shape from `swift package dump-package` (Swift 6.4) of a manifest with
  // `.product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")`.
  const coreHeadersProduct = {
    product: ['ExpoModulesCoreHeaders', 'ExpoModulesCoreHeaders', null, null],
  };

  it('is true when a target depends on the ExpoModulesCoreHeaders product', () => {
    expect(
      dependsOnCoreHeaders({
        ...manifestDependingOn(),
        targets: [
          { name: 'ExpoHapticsObjC', type: 'regular', dependencies: [] },
          { name: 'ExpoHaptics', type: 'regular', dependencies: [coreHeadersProduct] },
        ],
      })
    ).toBe(true);
  });

  // `.byName(name:)` and a bare string both dump as `byName`; SwiftPM resolves the name to
  // a product of a package dependency when no target has it.
  it.each([
    ['without a condition', { byName: ['ExpoModulesCoreHeaders', null] }],
    ['with a condition', { byName: ['ExpoModulesCoreHeaders', { platformNames: ['ios'] }] }],
  ])('is true for a dependency by name %s', (_, dependency) => {
    expect(dependsOnCoreHeaders(manifestDependingOn(dependency))).toBe(true);
  });

  it.each([
    ['no target dependencies', manifestDependingOn()],
    ['a dependency on another name', manifestDependingOn({ byName: ['ExpoModulesCore', null] })],
    [
      'another product',
      manifestDependingOn({ product: ['ExpoModulesCore', 'ExpoModulesCore', null, null] }),
    ],
    ['a target of that name', manifestDependingOn({ target: ['ExpoModulesCoreHeaders', null] })],
    [
      'only a package dependency',
      {
        ...manifestDependingOn(),
        dependencies: [{ fileSystem: [{ identity: 'expomodulescoreheaders' }] }],
      },
    ],
    ['no targets', { name: 'expo-haptics', products: [] }],
  ])('is false for a manifest with %s', (_, manifest) => {
    expect(dependsOnCoreHeaders(manifest)).toBe(false);
  });
});

describe('dumpModuleManifest', () => {
  const moduleRoot = path.join(os.tmpdir(), 'expo-haptics');
  const dump = () => dumpModuleManifest(moduleRoot, 'expo-haptics');

  it('returns the JSON the tool printed and its parse', () => {
    const json = JSON.stringify(hapticsManifest);
    runDumpPackage.mockReturnValueOnce(json);
    expect(dump()).toEqual({ json, manifest: hapticsManifest });
    expect(runDumpPackage).toHaveBeenLastCalledWith(moduleRoot);
  });

  describe('when the Package.swift cannot be evaluated', () => {
    const failWith = (error) =>
      runDumpPackage.mockImplementationOnce(() => {
        throw error;
      });

    it('names the package, the first line the tool printed, and how to fix it', () => {
      const error = Object.assign(new Error('Command failed: swift package dump-package'), {
        status: 1,
        stderr: '\nerror: Invalid manifest\nPackage.swift:3:1: error: expected expression\n',
      });
      failWith(error);
      const thrown = thrownBy(dump);
      expect(thrown.message).toContain(
        "expo-haptics's Package.swift could not be evaluated: error: Invalid manifest."
      );
      expect(thrown.message).toContain('`swift package dump-package`');
      expect(thrown.message).toContain(moduleRoot);
      expect(thrown.message).toContain('xcode-select');
      expect(thrown.message).toContain(rerunSpmUpdate);
      expect(thrown.cause).toBe(error);
    });

    it('says the swift command was not found when it is missing', () => {
      failWith(Object.assign(new Error('spawnSync swift ENOENT'), { code: 'ENOENT' }));
      expect(thrownBy(dump).message).toContain(
        "expo-haptics's Package.swift could not be evaluated: the swift command was not found."
      );
    });

    it('says what the tool printed is not a manifest', () => {
      runDumpPackage.mockReturnValueOnce('warning: not JSON');
      const thrown = thrownBy(dump);
      expect(thrown.message).toContain("expo-haptics's Package.swift could not be evaluated:");
      expect(thrown.cause).toBeInstanceOf(SyntaxError);
    });
  });
});

describe('emitDirectPackage', () => {
  const savedBuildDir = process.env.BUILD_DIR;
  let root;
  let outDir;
  let pkgDir;
  let coreHeadersXCFramework;
  let jsiHeadersPkgPath;
  let macrosPackageRoot;

  const emit = (react = null, codegenPkgPath = null) =>
    emitDirectPackage({
      moduleRoot: path.join(root, 'expo-haptics'),
      packageName: 'expo-haptics',
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath,
      macrosPackageRoot,
      react,
      codegenPkgPath,
      manifest: hapticsManifest,
    });
  const manifest = () => fs.readFileSync(path.join(pkgDir, 'Package.swift'), 'utf8');

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-emit-'));
    outDir = path.join(root, 'out');
    pkgDir = path.join(outDir, 'direct', 'ExpoModulesCoreHeaders');
    jsiHeadersPkgPath = path.join(outDir, 'ExpoModulesJSIHeaders');
    macrosPackageRoot = path.join(root, 'node_modules', 'expo-modules-macros');
    fs.mkdirSync(macrosPackageRoot, { recursive: true });
    fs.writeFileSync(
      path.join(macrosPackageRoot, 'Package.swift'),
      '// swift-tools-version: 6.2\n'
    );
    fs.mkdirSync(path.join(root, 'expo-haptics'));
    coreHeadersXCFramework = path.join(
      root,
      'expo-modules-core',
      'headers',
      'ExpoModulesCoreHeaders.xcframework'
    );
    fs.mkdirSync(coreHeadersXCFramework, { recursive: true });
    fs.writeFileSync(path.join(coreHeadersXCFramework, 'Info.plist'), '<plist/>');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    if (savedBuildDir === undefined) {
      delete process.env.BUILD_DIR;
    } else {
      process.env.BUILD_DIR = savedBuildDir;
    }
  });

  it('declares one product over the ExpoModulesCore headers binary target', () => {
    emit();
    expect(manifest().match(/\.binaryTarget\(/g)).toHaveLength(1);
    expect(manifest()).toContain(
      '.binaryTarget(name: "ExpoModulesCoreHeaders", path: "ExpoModulesCoreHeaders.xcframework")'
    );
    expect(manifest().match(/\.library\(/g)).toHaveLength(1);
    expect(manifest()).toMatch(
      /\.library\(name: "ExpoModulesCoreHeaders", targets: \["ExpoModulesCoreHeaders"/
    );
  });

  // The ExpoModulesJSI headers package declares that target too, and SwiftPM rejects a
  // graph with two targets of one name.
  it('declares no ExpoModulesJSIHeaders target, and depends on the JSI headers package by path', () => {
    emit();
    expect(manifest()).not.toMatch(/\.(binaryTarget|target)\(name: "ExpoModulesJSIHeaders"/);
    expect(manifest()).toContain(
      '.package(name: "ExpoModulesJSIHeaders", path: "../../ExpoModulesJSIHeaders")'
    );
    expect(manifest()).toContain(
      '.product(name: "ExpoModulesJSIHeaders", package: "ExpoModulesJSIHeaders")'
    );
  });

  it('fails, writing no package, when there is no JSI headers package', () => {
    jsiHeadersPkgPath = null;
    expect(emit).toThrow(
      'expo-haptics is built from its own Package.swift and needs the ExpoModulesJSI headers, but expo-modules-jsi is not autolinked.'
    );
    expect(emit).toThrow('re-export ExpoModulesJSI');
    expect(emit).toThrow('"expo": { "autolinking": { "exclude": [...] } }');
    expect(emit).toThrow(rerunSpmUpdate);
    expect(fs.existsSync(path.join(outDir, 'direct'))).toBe(false);
  });

  it('gives its dependents the macro plugin through the expo-modules-macros package', () => {
    emit();
    expect(manifest()).toContain(
      '.package(name: "expo-modules-macros", path: "../../../node_modules/expo-modules-macros")'
    );
    expect(manifest()).toMatch(
      /\.target\(\s*name: "ExpoModulesCoreHeadersDependencies",\s*dependencies: \[[^\]]*\.product\(name: "ExpoModulesMacrosPlugin", package: "expo-modules-macros"\)/
    );
  });

  describe("gives its dependents React Native's header products", () => {
    const dependenciesTarget = () =>
      manifest().match(
        /\.target\(\s*name: "ExpoModulesCoreHeadersDependencies",\s*dependencies: \[([^\]]*)\]/
      )[1];

    it('from a local React Native package and the app codegen package', () => {
      emit(
        {
          packageRef: { name: 'ReactNative', path: '/abs/react-native' },
          products: [
            { name: 'ReactHeaders', package: 'ReactNative' },
            { name: 'ReactNativeHeaders', package: 'ReactNative' },
            { name: 'ReactNativeDependenciesHeaders', package: 'ReactNative' },
            { name: 'ReactAppHeaders', package: 'React-GeneratedCode' },
          ],
        },
        '/abs/app/ios'
      );
      expect(manifest()).toContain('.package(name: "ReactNative", path: "/abs/react-native")');
      expect(manifest()).toContain('.package(name: "React-GeneratedCode", path: "/abs/app/ios")');
      for (const [name, pkg] of [
        ['ReactHeaders', 'ReactNative'],
        ['ReactNativeHeaders', 'ReactNative'],
        ['ReactNativeDependenciesHeaders', 'ReactNative'],
        ['ReactAppHeaders', 'React-GeneratedCode'],
      ]) {
        expect(dependenciesTarget()).toContain(`.product(name: "${name}", package: "${pkg}")`);
      }
    });

    it('from a remote React Native package', () => {
      emit(
        {
          packageRef: { name: 'ReactNative', url: 'https://example/rn.git', version: '0.87.0' },
          products: [{ name: 'ReactHeaders', package: 'ReactNative' }],
        },
        '/abs/app/ios'
      );
      expect(manifest()).toContain('.package(url: "https://example/rn.git", exact: "0.87.0")');
      expect(dependenciesTarget()).toContain(
        '.product(name: "ReactHeaders", package: "ReactNative")'
      );
    });
  });

  it('links no macro plugin into the build folder', () => {
    process.env.BUILD_DIR = path.join(root, 'Build', 'Products');
    emit();
    expect(fs.existsSync(path.join(root, 'Build'))).toBe(false);
  });

  it('fails, writing no package, when expo-modules-macros is too old to be a Swift package', () => {
    fs.rmSync(path.join(macrosPackageRoot, 'Package.swift'));
    expect(emit).toThrow(
      `expo-haptics is built from its own Package.swift and needs the Expo Swift macros as a Swift package, but expo-modules-macros at ${macrosPackageRoot} has no Package.swift.`
    );
    expect(emit).toThrow('expo-modules-macros 0.29.0 or later');
    expect(emit).toThrow('npx expo install --fix');
    expect(emit).toThrow(rerunSpmUpdate);
    expect(fs.existsSync(path.join(outDir, 'direct'))).toBe(false);
  });

  it('places the ExpoModulesCore headers xcframework in the package by link', () => {
    emit();
    const link = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(coreHeadersXCFramework));
    expect(fs.existsSync(path.join(pkgDir, 'ExpoModulesJSIHeaders.xcframework'))).toBe(false);
  });

  it('replaces the xcframework an earlier plugin generated in the package', () => {
    const generated = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
    fs.mkdirSync(path.join(generated, 'ios-arm64'), { recursive: true });
    emit();
    expect(fs.realpathSync(generated)).toBe(fs.realpathSync(coreHeadersXCFramework));
  });

  it('removes the stubs directory an earlier plugin generated in the package', () => {
    const stubs = path.join(pkgDir, '.stubs');
    fs.mkdirSync(path.join(stubs, 'ExpoModulesCore'), { recursive: true });
    emit();
    expect(fs.existsSync(stubs)).toBe(false);
  });

  it('moves the xcframework link when the ExpoModulesCore headers come from another path', () => {
    emit();
    coreHeadersXCFramework = path.join(root, 'other', 'ExpoModulesCoreHeaders.xcframework');
    fs.mkdirSync(coreHeadersXCFramework, { recursive: true });
    emit();
    const link = path.join(pkgDir, 'ExpoModulesCoreHeaders.xcframework');
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(coreHeadersXCFramework));
  });

  it('links a scoped package under its scope directory', () => {
    const moduleRoot = path.join(root, 'node_modules', '@acme', 'widgets');
    fs.mkdirSync(moduleRoot, { recursive: true });
    const { ok } = emitDirectPackage({
      moduleRoot,
      packageName: '@acme/widgets',
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath,
      macrosPackageRoot,
      manifest: hapticsManifest,
    });
    const link = path.join(outDir, 'direct', '@acme', 'widgets');
    expect(ok.packageDep.path).toBe(link);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(moduleRoot));
  });

  // That package is written under its SwiftPM package name, which need not be the npm name.
  it('removes the package an earlier sync generated from the manifest', () => {
    const generated = path.join(outDir, 'expo-source', 'ExpoHapticsPackage');
    fs.mkdirSync(generated, { recursive: true });
    fs.writeFileSync(path.join(generated, 'Package.swift'), '// generated\n');
    emitDirectPackage({
      moduleRoot: path.join(root, 'expo-haptics'),
      packageName: 'expo-haptics',
      outDir,
      coreHeadersXCFramework,
      jsiHeadersPkgPath,
      macrosPackageRoot,
      manifest: { ...hapticsManifest, name: 'ExpoHapticsPackage' },
    });
    expect(fs.existsSync(generated)).toBe(false);
  });

  it('links the products of the manifest it is given, without dumping it again', () => {
    runDumpPackage.mockClear();
    const { ok } = emit();
    expect(runDumpPackage).not.toHaveBeenCalled();
    expect(ok.packageDep).toEqual({
      name: 'expo-haptics',
      path: path.join(outDir, 'direct', 'expo-haptics'),
    });
    expect(ok.productDeps).toEqual([
      { name: 'ExpoHaptics', package: 'expo-haptics' },
      { name: 'ExpoHapticsExtras', package: 'expo-haptics' },
    ]);
  });

  it('changes no file in the package when emitted again with the same inputs', () => {
    emit();
    const snapshot = () =>
      fs
        .readdirSync(pkgDir, { recursive: true })
        .sort()
        .map((entry) => {
          const stat = fs.lstatSync(path.join(pkgDir, entry), { bigint: true });
          return [entry, stat.ino, stat.mtimeNs];
        });
    const first = snapshot();
    emit();
    expect(snapshot()).toEqual(first);
  });
});
