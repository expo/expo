'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../cli', () => ({ runDumpPackage: jest.fn() }));
const { runDumpPackage } = require('../cli');

const {
  parseDumpedManifest,
  renderSourceManifest,
  renderPureSwiftManifest,
  emitSourceManifestPackage,
  emitPureSwiftSourcePackage,
  raiseFloor,
  spmPackageIdentity,
  spmPackageDeclaration,
  spmProductDependency,
} = require('../manifests');

describe('parseDumpedManifest', () => {
  const dumped = JSON.stringify({
    name: 'expo-file-system',
    products: [
      {
        name: 'ExpoFileSystem',
        type: { library: ['automatic'] },
        targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'],
      },
      { name: 'ExpoFileSystemExecutable', type: { executable: [] }, targets: ['CLI'] },
    ],
    targets: [
      {
        name: 'ExpoFileSystem',
        type: 'regular',
        path: 'ios/ExpoFileSystem',
        dependencies: [{ byName: ['ExpoFileSystemObjC', null] }],
      },
      {
        name: 'ExpoFileSystemObjC',
        type: 'regular',
        path: 'ios/ExpoFileSystemObjC',
        publicHeadersPath: 'include',
        dependencies: [],
      },
      { name: 'ExpoFileSystemTests', type: 'test', path: 'ios/Tests', dependencies: [] },
    ],
  });

  it('keeps only regular targets, records path/publicHeadersPath, resolves sibling deps', () => {
    const { name, targets } = parseDumpedManifest(dumped);
    expect(name).toBe('expo-file-system');
    expect(targets).toEqual([
      {
        name: 'ExpoFileSystem',
        path: 'ios/ExpoFileSystem',
        publicHeadersPath: null,
        exclude: [],
        sources: [],
        resources: [],
        settings: [],
        dependencies: ['ExpoFileSystemObjC'],
      },
      {
        name: 'ExpoFileSystemObjC',
        path: 'ios/ExpoFileSystemObjC',
        publicHeadersPath: 'include',
        exclude: [],
        sources: [],
        resources: [],
        settings: [],
        dependencies: [],
      },
    ]);
  });

  it('keeps only library products and drops product targets not present as regular targets', () => {
    const { products } = parseDumpedManifest(dumped);
    expect(products).toEqual([
      { name: 'ExpoFileSystem', targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'] },
    ]);
  });
});

describe('parseDumpedManifest target dependencies', () => {
  // Verbatim shapes from `swift package dump-package` (SwiftPM 6.0).
  const dumped = JSON.stringify({
    name: 'TestModule',
    products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
    targets: [
      {
        name: 'Main',
        type: 'regular',
        path: 'Main',
        dependencies: [
          { target: ['Helper', null] },
          { byName: ['Plain', null] },
          { target: ['Conditioned', { platformNames: ['ios', 'macos'] }] },
          { byName: ['Watch', { platformNames: ['watchos'] }] },
          { product: ['SomeProduct', 'SomePackage', null, null] },
        ],
      },
      { name: 'Helper', type: 'regular', path: 'Helper', dependencies: [] },
      { name: 'Plain', type: 'regular', path: 'Plain', dependencies: [] },
      { name: 'Conditioned', type: 'regular', path: 'Conditioned', dependencies: [] },
      { name: 'Watch', type: 'regular', path: 'Watch', dependencies: [] },
    ],
  });

  it('accepts both the .target and .byName forms and drops a product of an undeclared package', () => {
    const [main] = parseDumpedManifest(dumped).targets;
    expect(main.dependencies).toEqual([
      'Helper',
      'Plain',
      { name: 'Conditioned', platforms: ['ios', 'macos'] },
      { name: 'Watch', platforms: ['watchos'] },
    ]);
  });
});

describe('renderSourceManifest', () => {
  const manifest = {
    name: 'expo-file-system',
    products: [{ name: 'ExpoFileSystem', targets: ['ExpoFileSystem', 'ExpoFileSystemObjC'] }],
    targets: [
      {
        name: 'ExpoFileSystem',
        path: 'ios/ExpoFileSystem',
        publicHeadersPath: null,
        dependencies: ['ExpoFileSystemObjC'],
      },
      {
        name: 'ExpoFileSystemObjC',
        path: 'ios/ExpoFileSystemObjC',
        publicHeadersPath: 'include',
        dependencies: [],
      },
    ],
  };
  const out = renderSourceManifest({
    manifest,
    pkgDeps: ['.package(name: "ReactNative", path: "/abs/rn")'],
    injectedTargetDeps: ['.product(name: "ReactHeaders", package: "ReactNative")'],
    frameworkSearchPath: '/abs/interfaces',
  });

  it('mirrors targets with sibling deps first, then injected deps', () => {
    expect(out).toContain('name: "ExpoFileSystem"');
    expect(out).toContain(
      '"ExpoFileSystemObjC",\n                .product(name: "ReactHeaders", package: "ReactNative")'
    );
    expect(out).toContain('path: "root/ios/ExpoFileSystem"');
  });

  it('emits publicHeadersPath only for targets that declare it', () => {
    expect(out).toContain(
      'path: "root/ios/ExpoFileSystemObjC",\n            publicHeadersPath: "include",'
    );
    // the Swift target has no publicHeadersPath line
    expect(out).not.toContain('path: "root/ios/ExpoFileSystem",\n            publicHeadersPath:');
  });

  it('always emits the Swift-5 language mode + C++20 tail (folly needs C++17+)', () => {
    expect(out).toContain('swiftLanguageModes: [.v5],\n    cxxLanguageStandard: .cxx20');
  });

  it('uses the compile-only interface tree and never emits a binary target', () => {
    expect(out).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).not.toContain('.binaryTarget');
    expect(out).not.toContain('ExpoModulesCore.xcframework');
  });
});

describe('renderPureSwiftManifest', () => {
  const out = renderPureSwiftManifest({
    product: 'ExpoAsset',
    srcRel: 'ios',
    frameworkSearchPath: '/abs/interfaces',
  });

  it('emits a single target over the source dir with the given deps', () => {
    expect(out).toContain('.library(name: "ExpoAsset", targets: ["ExpoAsset"])');
    expect(out).toContain('path: "root/ios"');
    expect(out).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).not.toContain('.binaryTarget');
    expect(out).not.toMatch(/\[\s*,\s*\]/);
    expect(out).toContain('swiftLanguageModes: [.v5],\n    cxxLanguageStandard: .cxx20');
  });

  it('loads no macro plugin when no macro flags are given', () => {
    expect(out).not.toContain('-Xfrontend');
  });
});

// Expo modules use Swift macros (@Field, @Record, @OptimizedFunction). A macro only
// expands when the compiler is handed the macro plugin executable, the same way
// `project_integrator.rb#integrate_core_macro_plugins` hands it to CocoaPods.
describe('macro plugin flags', () => {
  const MACRO_FLAGS = [
    '-Xfrontend',
    '-load-plugin-executable',
    '-Xfrontend',
    '/abs/macros/ExpoModulesMacros-tool#ExpoModulesMacros',
  ];
  const EXPECTED_SWIFT =
    'swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces", "-Xfrontend", ' +
    '"-load-plugin-executable", "-Xfrontend", ' +
    '"/abs/macros/ExpoModulesMacros-tool#ExpoModulesMacros"])]';

  describe('renderPureSwiftManifest', () => {
    const out = renderPureSwiftManifest({
      product: 'ExpoCrypto',
      srcRel: 'ios',
      frameworkSearchPath: '/abs/interfaces',
      extraSwiftFlags: MACRO_FLAGS,
    });

    it('loads the macro plugin from swiftSettings', () => {
      expect(out).toContain(EXPECTED_SWIFT);
    });

    it('never hands the Swift-only frontend flags to clang', () => {
      expect(out).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
      expect(out).toContain('cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    });
  });

  describe('renderSourceManifest', () => {
    const out = renderSourceManifest({
      manifest: {
        name: 'TestModule',
        products: [{ name: 'TestModule', targets: ['Main'] }],
        targets: [{ name: 'Main', path: 'Main', publicHeadersPath: null, dependencies: [] }],
      },
      frameworkSearchPath: '/abs/interfaces',
      extraSwiftFlags: MACRO_FLAGS,
    });

    it('loads the macro plugin from swiftSettings', () => {
      expect(out).toContain(EXPECTED_SWIFT);
    });

    it('never hands the Swift-only frontend flags to clang', () => {
      expect(out).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
      expect(out).toContain('cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    });
  });

  // The emit functions are what the plugin actually calls, so the flags have to
  // survive the whole way to the file on disk, not just the render call.
  describe('the emitted file', () => {
    let moduleRoot;
    let outDir;

    beforeEach(() => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-macro-emit-'));
      moduleRoot = path.join(tmp, 'module');
      outDir = path.join(tmp, 'out');
      fs.mkdirSync(path.join(moduleRoot, 'ios'), { recursive: true });
    });

    it('carries the flags through emitSourceManifestPackage', () => {
      runDumpPackage.mockReturnValue(
        JSON.stringify({
          name: 'TestModule',
          products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
          targets: [{ name: 'Main', type: 'regular', path: 'Main', dependencies: [] }],
        })
      );
      emitSourceManifestPackage({
        moduleRoot,
        frameworkSearchPath: '/abs/interfaces',
        outDir,
        macroFlags: MACRO_FLAGS,
      });

      expect(
        fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8')
      ).toContain(EXPECTED_SWIFT);
    });

    it('carries the flags through emitPureSwiftSourcePackage', () => {
      emitPureSwiftSourcePackage({
        moduleRoot,
        product: 'ExpoCrypto',
        frameworkSearchPath: '/abs/interfaces',
        outDir,
        macroFlags: MACRO_FLAGS,
      });

      expect(
        fs.readFileSync(path.join(outDir, 'expo-source', 'ExpoCrypto', 'Package.swift'), 'utf8')
      ).toContain(EXPECTED_SWIFT);
    });
  });
});

describe('renderSourceManifest target dependency conditions', () => {
  const render = (dependencies) =>
    renderSourceManifest({
      manifest: {
        name: 'TestModule',
        products: [{ name: 'TestModule', targets: ['Main'] }],
        targets: [{ name: 'Main', path: 'Main', publicHeadersPath: null, dependencies }],
      },
      frameworkSearchPath: '/abs/interfaces',
    });

  it('renders a conditioned sibling dependency with its platform condition', () => {
    expect(render([{ name: 'Helper', platforms: ['ios', 'macos'] }])).toContain(
      '.target(name: "Helper", condition: .when(platforms: [.iOS, .macOS]))'
    );
  });

  it('maps every supported platform name to its Swift case', () => {
    expect(
      render([{ name: 'H', platforms: ['tvos', 'watchos', 'visionos', 'maccatalyst'] }])
    ).toContain('condition: .when(platforms: [.tvOS, .watchOS, .visionOS, .macCatalyst])');
  });

  it('keeps the platforms it recognizes and drops the rest', () => {
    expect(render([{ name: 'Helper', platforms: ['ios', 'plan9'] }])).toContain(
      '.target(name: "Helper", condition: .when(platforms: [.iOS]))'
    );
  });
});

describe('implicit target source paths', () => {
  const dumpWithoutPath = JSON.stringify({
    name: 'TestModule',
    products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Example'] }],
    targets: [{ name: 'Example', type: 'regular', dependencies: [] }],
  });

  let moduleRoot;
  let outDir;

  beforeEach(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-emit-'));
    moduleRoot = path.join(tmp, 'module');
    outDir = path.join(tmp, 'out');
    fs.mkdirSync(moduleRoot, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });
  });

  const emit = () =>
    emitSourceManifestPackage({ moduleRoot, frameworkSearchPath: '/abs/interfaces', outDir });
  const emittedManifest = () =>
    fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8');

  it('keeps the path unresolved during parsing when the manifest omits it', () => {
    expect(parseDumpedManifest(dumpWithoutPath).targets[0].path).toBeNull();
  });

  it('resolves a target with no explicit path to its predefined source directory', () => {
    fs.mkdirSync(path.join(moduleRoot, 'Sources', 'Example'), { recursive: true });
    runDumpPackage.mockReturnValue(dumpWithoutPath);

    expect(emit().packageDep).toEqual({
      name: 'TestModule',
      path: path.join(outDir, 'expo-source', 'TestModule'),
    });
    expect(emittedManifest()).toContain('path: "root/Sources/Example"');
  });

  it('leaves an explicit path untouched', () => {
    runDumpPackage.mockReturnValue(
      JSON.stringify({
        name: 'TestModule',
        products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Example'] }],
        targets: [{ name: 'Example', type: 'regular', path: 'ios/Example', dependencies: [] }],
      })
    );
    emit();
    expect(emittedManifest()).toContain('path: "root/ios/Example"');
  });

  it('skips the module and names the unresolved targets instead of emitting root/undefined', () => {
    runDumpPackage.mockReturnValue(dumpWithoutPath);
    const result = emit();

    expect(result.packageDep).toBeUndefined();
    expect(result.unresolvedTargets).toEqual(['Example']);
    expect(fs.existsSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'))).toBe(
      false
    );
  });

  it('refuses to render a target whose path was never resolved', () => {
    expect(() =>
      renderSourceManifest({
        manifest: {
          name: 'TestModule',
          products: [{ name: 'TestModule', targets: ['Example'] }],
          targets: [{ name: 'Example', path: null, publicHeadersPath: null, dependencies: [] }],
        },
        frameworkSearchPath: '/abs/interfaces',
      })
    ).toThrow(/Example/);
  });
});

describe('renderPureSwiftManifest excludes', () => {
  it('excludes the directories classification ignores, in the given order', () => {
    const out = renderPureSwiftManifest({
      product: 'ExpoClipboard',
      srcRel: 'ios',
      frameworkSearchPath: '/abs/interfaces',
      excludes: ['Feature/Tests', 'Tests'],
    });
    expect(out).toContain('path: "root/ios",\n            exclude: ["Feature/Tests", "Tests"],');
  });

  it('emits no exclude key when nothing is ignored', () => {
    expect(
      renderPureSwiftManifest({
        product: 'ExpoAsset',
        srcRel: 'ios',
        frameworkSearchPath: '/abs/interfaces',
        excludes: [],
      })
    ).not.toContain('exclude:');
  });
});

describe('renderPureSwiftManifest privacy manifest', () => {
  it('copies the privacy manifest into the target resources, after the excludes', () => {
    const out = renderPureSwiftManifest({
      product: 'ExpoDevice',
      srcRel: 'ios',
      frameworkSearchPath: '/abs/interfaces',
      excludes: ['Tests'],
      hasPrivacyManifest: true,
    });
    expect(out).toContain(
      'exclude: ["Tests"],\n            resources: [.copy("PrivacyInfo.xcprivacy")],'
    );
  });

  it('emits no resources key when the module ships no privacy manifest', () => {
    expect(
      renderPureSwiftManifest({
        product: 'ExpoAsset',
        srcRel: 'ios',
        frameworkSearchPath: '/abs/interfaces',
        hasPrivacyManifest: false,
      })
    ).not.toContain('resources:');
    expect(
      renderPureSwiftManifest({
        product: 'ExpoAsset',
        srcRel: 'ios',
        frameworkSearchPath: '/abs/interfaces',
      })
    ).not.toContain('resources:');
  });
});

describe('emitPureSwiftSourcePackage', () => {
  it('excludes ignored directories found under the module sources', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-pure-emit-'));
    const moduleRoot = path.join(tmp, 'module');
    const outDir = path.join(tmp, 'out');
    fs.mkdirSync(path.join(moduleRoot, 'ios', 'Feature', 'Tests'), { recursive: true });
    fs.mkdirSync(path.join(moduleRoot, 'ios', '__tests__'), { recursive: true });
    fs.writeFileSync(path.join(moduleRoot, 'ios', 'A.swift'), '// swift\n');

    emitPureSwiftSourcePackage({
      moduleRoot,
      product: 'ExpoAsset',
      frameworkSearchPath: '/abs/interfaces',
      outDir,
    });
    const manifest = fs.readFileSync(
      path.join(outDir, 'expo-source', 'ExpoAsset', 'Package.swift'),
      'utf8'
    );
    expect(manifest).toContain('exclude: ["Feature/Tests", "__tests__"],');
  });

  describe('privacy manifest detection', () => {
    const emit = (withPrivacyManifest) => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-privacy-emit-'));
      const moduleRoot = path.join(tmp, 'module');
      const outDir = path.join(tmp, 'out');
      fs.mkdirSync(path.join(moduleRoot, 'ios'), { recursive: true });
      fs.writeFileSync(path.join(moduleRoot, 'ios', 'A.swift'), '// swift\n');
      if (withPrivacyManifest) {
        fs.writeFileSync(path.join(moduleRoot, 'ios', 'PrivacyInfo.xcprivacy'), '<plist/>\n');
      }
      emitPureSwiftSourcePackage({
        moduleRoot,
        product: 'ExpoDevice',
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });
      return fs.readFileSync(
        path.join(outDir, 'expo-source', 'ExpoDevice', 'Package.swift'),
        'utf8'
      );
    };

    it('copies a privacy manifest sitting beside the module sources', () => {
      expect(emit(true)).toContain('resources: [.copy("PrivacyInfo.xcprivacy")],');
    });

    it('emits no resources key for a module that ships none', () => {
      expect(emit(false)).not.toContain('resources:');
    });
  });
});

describe('single-target packages with sources directly in a predefined directory', () => {
  const dumpTargets = (names) =>
    JSON.stringify({
      name: 'TestModule',
      products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: names }],
      targets: names.map((name) => ({ name, type: 'regular', dependencies: [] })),
    });

  let moduleRoot;
  let outDir;

  beforeEach(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-bare-sources-'));
    moduleRoot = path.join(tmp, 'module');
    outDir = path.join(tmp, 'out');
    fs.mkdirSync(moduleRoot, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });
  });

  const write = (rel, content = '// swift\n') => {
    const target = path.join(moduleRoot, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  const emit = () =>
    emitSourceManifestPackage({ moduleRoot, frameworkSearchPath: '/abs/interfaces', outDir });

  it('resolves the only target to the bare predefined directory holding its sources', () => {
    write('Sources/File.swift');
    runDumpPackage.mockReturnValue(dumpTargets(['RootSrc']));

    expect(emit().unresolvedTargets).toBeUndefined();
    expect(
      fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8')
    ).toContain('path: "root/Sources"');
  });

  it('prefers Sources/<target name> over the bare directory', () => {
    write('Sources/File.swift');
    write('Sources/RootSrc/File.swift');
    runDumpPackage.mockReturnValue(dumpTargets(['RootSrc']));

    emit();
    expect(
      fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8')
    ).toContain('path: "root/Sources/RootSrc"');
  });

  it('never resolves the targets of a multi-target package to the shared bare directory', () => {
    write('Sources/File.swift');
    runDumpPackage.mockReturnValue(dumpTargets(['A', 'B']));

    expect(emit().unresolvedTargets).toEqual(['A', 'B']);
  });

  it('accepts a predefined directory whose sources are nested below it', () => {
    write('Sources/Nested/File.swift');
    runDumpPackage.mockReturnValue(dumpTargets(['RootSrc']));

    expect(emit().unresolvedTargets).toBeUndefined();
    expect(
      fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8')
    ).toContain('path: "root/Sources"');
  });

  it('ignores a predefined directory with no source files at any depth', () => {
    write('Sources/Nested/README.md', '# docs\n');
    runDumpPackage.mockReturnValue(dumpTargets(['RootSrc']));

    expect(emit().unresolvedTargets).toEqual(['RootSrc']);
  });
});

describe('sibling dependencies on non-regular targets', () => {
  it('drops a dependency on a target the generated package does not mirror', () => {
    const [main] = parseDumpedManifest(
      JSON.stringify({
        name: 'TestModule',
        products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
        targets: [
          {
            name: 'Main',
            type: 'regular',
            path: 'Main',
            dependencies: [
              { byName: ['Helper', null] },
              { target: ['Prebuilt', null] },
              { target: ['Macro', { platformNames: ['ios'] }] },
            ],
          },
          { name: 'Helper', type: 'regular', path: 'Helper', dependencies: [] },
          { name: 'Prebuilt', type: 'binary', path: 'Prebuilt.xcframework', dependencies: [] },
          { name: 'Macro', type: 'macro', path: 'Macro', dependencies: [] },
        ],
      })
    ).targets;
    expect(main.dependencies).toEqual(['Helper']);
  });
});

describe('unsupported platform conditions', () => {
  it('refuses a freebsd-only condition instead of widening the dependency', () => {
    expect(() =>
      renderSourceManifest({
        manifest: {
          name: 'TestModule',
          products: [{ name: 'TestModule', targets: ['Main'] }],
          targets: [
            {
              name: 'Main',
              path: 'Main',
              publicHeadersPath: null,
              dependencies: [{ name: 'Helper', platforms: ['freebsd'] }],
            },
          ],
        },
        frameworkSearchPath: '/abs/interfaces',
      })
    ).toThrow(/"Helper".*freebsd/s);
  });
});

describe('mirrored target file rules', () => {
  // Verbatim `swift package dump-package` output (Swift 6.3.3, tools-version 6.0).
  const dumped = JSON.stringify({
    name: 'TestModule',
    products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
    targets: [
      {
        name: 'Main',
        type: 'regular',
        path: 'Main',
        dependencies: [],
        exclude: ['Skip'],
        sources: ['Sub'],
        resources: [
          { path: 'Res', rule: { process: {} } },
          { path: 'Res/en.lproj', rule: { process: { localization: 'base' } } },
          { path: 'Res/raw.txt', rule: { copy: {} } },
          { path: 'Sub/embed.txt', rule: { embedInCode: {} } },
        ],
      },
    ],
  });
  const render = (manifest) =>
    renderSourceManifest({ manifest, frameworkSearchPath: '/abs/interfaces' });

  it('carries exclude/sources/resources through parsing', () => {
    const [main] = parseDumpedManifest(dumped).targets;
    expect(main.exclude).toEqual(['Skip']);
    expect(main.sources).toEqual(['Sub']);
    expect(main.resources).toEqual([
      { path: 'Res', rule: { process: {} } },
      { path: 'Res/en.lproj', rule: { process: { localization: 'base' } } },
      { path: 'Res/raw.txt', rule: { copy: {} } },
      { path: 'Sub/embed.txt', rule: { embedInCode: {} } },
    ]);
  });

  it('renders them in PackageDescription argument order, before publicHeadersPath', () => {
    expect(render(parseDumpedManifest(dumped))).toContain(
      [
        '            path: "root/Main",',
        '            exclude: ["Skip"],',
        '            sources: ["Sub"],',
        '            resources: [.process("Res"), .process("Res/en.lproj", localization: .base), .copy("Res/raw.txt"), .embedInCode("Sub/embed.txt")],',
      ].join('\n')
    );
  });

  it('omits every key the module does not declare', () => {
    const out = render(
      parseDumpedManifest(
        JSON.stringify({
          name: 'TestModule',
          products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
          targets: [{ name: 'Main', type: 'regular', path: 'Main', dependencies: [] }],
        })
      )
    );
    expect(out).not.toContain('exclude:');
    expect(out).not.toContain('sources:');
    expect(out).not.toContain('resources:');
  });

  it('refuses to render a resource rule it does not recognize', () => {
    const manifest = parseDumpedManifest(
      JSON.stringify({
        name: 'TestModule',
        products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
        targets: [
          {
            name: 'Main',
            type: 'regular',
            path: 'Main',
            dependencies: [],
            resources: [{ path: 'Res', rule: { teleport: {} } }],
          },
        ],
      })
    );
    expect(() => render(manifest)).toThrow(/teleport/);
  });
});

describe('mirrored target build settings', () => {
  // Verbatim `swift package dump-package` output (Swift 6.3.3, tools-version 6.0).
  const dumpWithSettings = (settings) =>
    JSON.stringify({
      name: 'TestModule',
      products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
      targets: [{ name: 'Main', type: 'regular', path: 'Main', dependencies: [], settings }],
    });
  const render = (settings) =>
    renderSourceManifest({
      manifest: parseDumpedManifest(dumpWithSettings(settings)),
      frameworkSearchPath: '/abs/interfaces',
    });

  const settings = [
    { kind: { define: { _0: 'RCT_NEW_ARCH_ENABLED=1' } }, tool: 'c' },
    { kind: { define: { _0: 'FOLLY_NO_CONFIG' } }, tool: 'cxx' },
    { kind: { headerSearchPath: { _0: 'common' } }, tool: 'cxx' },
    {
      condition: { config: 'debug', platformNames: [] },
      kind: { define: { _0: 'DBG' } },
      tool: 'swift',
    },
    {
      condition: { platformNames: ['ios'] },
      kind: { linkedFramework: { _0: 'PhotosUI' } },
      tool: 'linker',
    },
    { kind: { linkedLibrary: { _0: 'sqlite3' } }, tool: 'linker' },
    { kind: { unsafeFlags: { _0: ['-lc++'] } }, tool: 'linker' },
  ];

  it('carries the settings through parsing', () => {
    expect(parseDumpedManifest(dumpWithSettings(settings)).targets[0].settings).toEqual(settings);
  });

  it('renders each tool family with the injected interface flags first', () => {
    const out = render(settings);
    expect(out).toContain(
      'cSettings: [.unsafeFlags(["-F", "/abs/interfaces"]), .define("RCT_NEW_ARCH_ENABLED", to: "1")],'
    );
    expect(out).toContain(
      'cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"]), .define("FOLLY_NO_CONFIG"), .headerSearchPath("common")],'
    );
    expect(out).toContain(
      'swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"]), .define("DBG", .when(configuration: .debug))],'
    );
    expect(out).toContain(
      'linkerSettings: [.linkedFramework("PhotosUI", .when(platforms: [.iOS])), .linkedLibrary("sqlite3"), .unsafeFlags(["-lc++"])],'
    );
  });

  it('renders a platform + configuration condition as one .when', () => {
    expect(
      render([
        {
          condition: { config: 'release', platformNames: ['ios', 'tvos'] },
          kind: { define: { _0: 'NDEBUG=1' } },
          tool: 'c',
        },
      ])
    ).toContain(
      '.define("NDEBUG", to: "1", .when(platforms: [.iOS, .tvOS], configuration: .release))'
    );
  });

  it('keeps the known platforms of a condition and drops the rest', () => {
    expect(
      render([
        {
          condition: { platformNames: ['ios', 'plan9'] },
          kind: { define: { _0: 'X' } },
          tool: 'c',
        },
      ])
    ).toContain('.define("X", .when(platforms: [.iOS]))');
  });

  it('refuses to render a condition whose platforms are all unknown', () => {
    expect(() =>
      render([
        { condition: { platformNames: ['plan9'] }, kind: { define: { _0: 'X' } }, tool: 'c' },
      ])
    ).toThrow(/plan9.*SWIFT_PLATFORM_CASES/s);
  });

  it('drops the value from a Swift define, which swiftc cannot express', () => {
    const out = render([{ kind: { define: { _0: 'K=V' } }, tool: 'swift' }]);
    expect(out).toContain(
      'swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"]), .define("K")],'
    );
    expect(out).not.toContain('to: "V"');
  });

  it('refuses to render a setting kind it does not recognize', () => {
    expect(() => render([{ kind: { strictMemorySafety: { _0: 'X' } }, tool: 'swift' }])).toThrow(
      /"Main".*strictMemorySafety/s
    );
  });

  it('refuses to render a setting whose tool it cannot place', () => {
    expect(() => render([{ kind: { define: { _0: 'X' } }, tool: 'nasm' }])).toThrow(
      /"Main".*nasm/s
    );
  });

  it('refuses to render a setting the dump left without a value', () => {
    expect(() => render([{ kind: { define: {} }, tool: 'c' }])).toThrow(/"Main".*define/s);
  });

  it('renders the Swift-only setting kinds', () => {
    const out = render([
      { kind: { enableUpcomingFeature: { _0: 'StrictConcurrency' } }, tool: 'swift' },
      { kind: { enableExperimentalFeature: { _0: 'AccessLevelOnImport' } }, tool: 'swift' },
      { kind: { swiftLanguageMode: { _0: '5' } }, tool: 'swift' },
      { kind: { interoperabilityMode: { _0: 'Cxx' } }, tool: 'swift' },
    ]);
    expect(out).toContain(
      '.enableUpcomingFeature("StrictConcurrency"), .enableExperimentalFeature("AccessLevelOnImport"), .swiftLanguageMode(.v5), .interoperabilityMode(.Cxx)],'
    );
  });

  it('maps every Swift language mode and interoperability mode', () => {
    const modes = { 4: '.v4', 4.2: '.v4_2', 5: '.v5', 6: '.v6' };
    for (const [dumped, swift] of Object.entries(modes)) {
      expect(render([{ kind: { swiftLanguageMode: { _0: dumped } }, tool: 'swift' }])).toContain(
        `.swiftLanguageMode(${swift})`
      );
    }
    expect(render([{ kind: { interoperabilityMode: { _0: 'C' } }, tool: 'swift' }])).toContain(
      '.interoperabilityMode(.C)'
    );
  });

  it('refuses a mode the dump did not write as a string', () => {
    expect(() => render([{ kind: { swiftLanguageMode: { _0: 5 } }, tool: 'swift' }])).toThrow(
      /"Main".*a non-empty string belongs/s
    );
  });

  it('says so when the dump left a setting without a kind', () => {
    expect(() => render([{ kind: {}, tool: 'swift' }])).toThrow(/"Main".*no kind/s);
  });

  it('refuses to render a language or interoperability mode it cannot map', () => {
    expect(() => render([{ kind: { swiftLanguageMode: { _0: '7' } }, tool: 'swift' }])).toThrow(
      /Swift language mode "7"/
    );
    expect(() =>
      render([{ kind: { interoperabilityMode: { _0: 'ObjC' } }, tool: 'swift' }])
    ).toThrow(/interoperability mode "ObjC"/);
  });

  it('never resolves a mode or platform name off Object.prototype', () => {
    expect(() =>
      render([{ kind: { swiftLanguageMode: { _0: 'constructor' } }, tool: 'swift' }])
    ).toThrow(/Swift language mode "constructor"/);
    expect(() =>
      render([{ kind: { interoperabilityMode: { _0: 'toString' } }, tool: 'swift' }])
    ).toThrow(/interoperability mode "toString"/);
    expect(() =>
      render([
        { condition: { platformNames: ['constructor'] }, kind: { define: { _0: 'X' } }, tool: 'c' },
      ])
    ).toThrow(/constructor/);
  });

  it.each([
    ['a number', 42],
    ['an empty string', ''],
    ['a define with no name', '=1'],
    ['a flag list that is not a list', 'not-an-array'],
  ])('refuses to render %s as a setting value', (_name, value) => {
    const kind =
      value === 'not-an-array' ? { unsafeFlags: { _0: value } } : { define: { _0: value } };
    const expected =
      value === 'not-an-array' ? /an array of flags belongs/ : /a non-empty string belongs/;
    expect(() => render([{ kind, tool: 'c' }])).toThrow(expected);
    expect(() => render([{ kind, tool: 'c' }])).toThrow(/"Main"/);
  });

  it('splits a valued define on its first `=` only', () => {
    expect(render([{ kind: { define: { _0: 'K=a=b' } }, tool: 'c' }])).toContain(
      '.define("K", to: "a=b")'
    );
  });

  it('escapes quotes, backslashes and shell-like values in every string it renders', () => {
    const out = render([
      { kind: { define: { _0: 'K=say "hi"' } }, tool: 'c' },
      { kind: { headerSearchPath: { _0: 'a\\b' } }, tool: 'c' },
      { kind: { unsafeFlags: { _0: ['-I$(SRCROOT)/"inc"'] } }, tool: 'c' },
    ]);
    expect(out).toContain('.define("K", to: "say \\"hi\\"")');
    expect(out).toContain('.headerSearchPath("a\\\\b")');
    expect(out).toContain('.unsafeFlags(["-I$(SRCROOT)/\\"inc\\""])');
  });

  it('renders nothing extra for a target with no settings', () => {
    expect(render([])).toBe(render(undefined));
    expect(render([])).not.toContain('linkerSettings:');
    expect(render([])).toContain('cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],');
  });
});

describe('deployment target', () => {
  const dumpWithPlatforms = (platforms) =>
    JSON.stringify({
      name: 'TestModule',
      platforms,
      products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
      targets: [{ name: 'Main', type: 'regular', path: 'Main', dependencies: [] }],
    });

  it('takes the iOS floor the module declares', () => {
    const manifest = parseDumpedManifest(
      dumpWithPlatforms([
        { options: [], platformName: 'ios', version: '16.4' },
        { options: [], platformName: 'macos', version: '13.4' },
      ])
    );
    expect(manifest.iosDeploymentTarget).toBe('16.4');
    const out = renderSourceManifest({ manifest, frameworkSearchPath: '/abs/interfaces' });
    expect(out).toContain('platforms: [.iOS("16.4")],');
    expect(out).not.toContain('.macOS');
  });

  it('falls back to the plugin floor when the module declares no iOS platform', () => {
    const manifest = parseDumpedManifest(
      dumpWithPlatforms([{ options: [], platformName: 'macos', version: '13.4' }])
    );
    expect(manifest.iosDeploymentTarget).toBeNull();
    expect(renderSourceManifest({ manifest, frameworkSearchPath: '/abs/interfaces' })).toContain(
      'platforms: [.iOS(.v15)],'
    );
  });

  it('falls back to the plugin floor when the manifest declares no platforms at all', () => {
    expect(
      renderSourceManifest({
        manifest: parseDumpedManifest(dumpWithPlatforms(undefined)),
        frameworkSearchPath: '/abs/interfaces',
      })
    ).toContain('platforms: [.iOS(.v15)],');
  });

  it('takes the pure-Swift floor the plugin read from the prebuilt-metadata document', () => {
    expect(
      renderPureSwiftManifest({
        product: 'ExpoAsset',
        srcRel: 'ios',
        frameworkSearchPath: '/abs/interfaces',
        iosDeploymentTarget: '16.4',
      })
    ).toContain('platforms: [.iOS("16.4")],');
    expect(
      renderPureSwiftManifest({
        product: 'ExpoAsset',
        srcRel: 'ios',
        frameworkSearchPath: '/abs/interfaces',
      })
    ).toContain('platforms: [.iOS(.v15)],');
  });

  it('emits the floor the emit layer was given, and never linker settings', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-floor-emit-'));
    const moduleRoot = path.join(tmp, 'module');
    const outDir = path.join(tmp, 'out');
    fs.mkdirSync(path.join(moduleRoot, 'ios'), { recursive: true });
    fs.writeFileSync(path.join(moduleRoot, 'ios', 'A.swift'), '// swift\n');

    emitPureSwiftSourcePackage({
      moduleRoot,
      product: 'ExpoAsset',
      frameworkSearchPath: '/abs/interfaces',
      outDir,
      iosDeploymentTarget: '16.4',
    });
    const manifest = fs.readFileSync(
      path.join(outDir, 'expo-source', 'ExpoAsset', 'Package.swift'),
      'utf8'
    );
    expect(manifest).toContain('platforms: [.iOS("16.4")],');
    expect(manifest).not.toContain('linkerSettings:');
  });
});

describe('raiseFloor', () => {
  it('keeps the higher of the two floors', () => {
    expect(raiseFloor('15.0', '16.4')).toBe('16.4');
    expect(raiseFloor('17.0', '16.4')).toBe('17.0');
  });

  it('keeps the declared floor when both are the same', () => {
    expect(raiseFloor('16.4', '16.4')).toBe('16.4');
  });

  it('compares components numerically, not as text', () => {
    expect(raiseFloor('16.10', '16.9')).toBe('16.10');
    expect(raiseFloor('16.9', '16.10')).toBe('16.10');
  });

  it('reads a missing component as zero', () => {
    expect(raiseFloor('16', '16.0')).toBe('16');
    expect(raiseFloor('16', '16.4')).toBe('16.4');
  });

  it('falls back to whichever floor is present', () => {
    expect(raiseFloor(null, '16.4')).toBe('16.4');
    expect(raiseFloor('16.4', null)).toBe('16.4');
    expect(raiseFloor(undefined, '16.4')).toBe('16.4');
    expect(raiseFloor('16.4', undefined)).toBe('16.4');
  });

  it('has no floor to report when neither side declares one', () => {
    expect(raiseFloor(null, null)).toBeNull();
    expect(raiseFloor(undefined, undefined)).toBeNull();
  });
});

describe('the minimum floor a checked-in manifest is raised to', () => {
  const dumpWithIos = (version) =>
    JSON.stringify({
      name: 'TestModule',
      platforms: [{ options: [], platformName: 'ios', version }],
      products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
      targets: [{ name: 'Main', type: 'regular', path: 'Main', dependencies: [] }],
    });

  let moduleRoot;
  let outDir;

  beforeEach(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-minimum-'));
    moduleRoot = path.join(tmp, 'module');
    outDir = path.join(tmp, 'out');
    fs.mkdirSync(moduleRoot, { recursive: true });
  });

  const emitted = (declared, minimum) => {
    runDumpPackage.mockReturnValue(dumpWithIos(declared));
    emitSourceManifestPackage({
      moduleRoot,
      frameworkSearchPath: '/abs/interfaces',
      outDir,
      minimumIosDeploymentTarget: minimum,
    });
    return fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8');
  };

  it('raises a module declaring less than the minimum', () => {
    expect(emitted('15.0', '16.4')).toContain('platforms: [.iOS("16.4")],');
  });

  it('leaves a module declaring more than the minimum alone', () => {
    expect(emitted('17.0', '16.4')).toContain('platforms: [.iOS("17.0")],');
  });

  it('keeps the declared floor when there is no minimum', () => {
    expect(emitted('16.4', null)).toContain('platforms: [.iOS("16.4")],');
  });
});

describe('dependencies on targets the generated package cannot declare', () => {
  const dumpWithBinaryTarget = JSON.stringify({
    name: 'TestModule',
    products: [
      { name: 'TestModule', type: { library: ['automatic'] }, targets: ['Src', 'Vendored'] },
    ],
    targets: [
      {
        name: 'Src',
        type: 'regular',
        path: 'ios/Src',
        dependencies: [{ byName: ['Vendored', null] }],
      },
      { name: 'Vendored', type: 'binary', path: 'ios/Vendored.xcframework' },
    ],
  });

  it('reports a dependency on a non-regular target of the same package', () => {
    const { targets, unsupportedTargetDeps } = parseDumpedManifest(dumpWithBinaryTarget);
    expect(unsupportedTargetDeps).toEqual([
      { target: 'Src', dependsOn: 'Vendored', kind: 'binary' },
    ]);
    expect(targets.map((t) => t.name)).toEqual(['Src']);
  });

  it('reports the kind of every non-regular target a dependency names', () => {
    const { unsupportedTargetDeps } = parseDumpedManifest(
      JSON.stringify({
        name: 'TestModule',
        products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Src'] }],
        targets: [
          {
            name: 'Src',
            type: 'regular',
            path: 'ios/Src',
            dependencies: [{ byName: ['Macros', null] }, { target: ['Codegen', null] }],
          },
          { name: 'Macros', type: 'macro', path: 'Macros' },
          { name: 'Codegen', type: 'plugin', path: 'Codegen' },
        ],
      })
    );
    expect(unsupportedTargetDeps).toEqual([
      { target: 'Src', dependsOn: 'Macros', kind: 'macro' },
      { target: 'Src', dependsOn: 'Codegen', kind: 'plugin' },
    ]);
  });

  // The shape of packages/expo-constants, which the diagnostics cite as a worked
  // manifest: an ordinary Swift/Objective-C split must stay out of this entirely.
  it('says nothing about a dependency between two regular targets', () => {
    const { targets, unsupportedTargetDeps } = parseDumpedManifest(
      JSON.stringify({
        name: 'expo-constants',
        products: [
          {
            name: 'EXConstants',
            type: { library: ['automatic'] },
            targets: ['EXConstants', 'EXConstantsObjC'],
          },
        ],
        targets: [
          {
            name: 'EXConstants',
            type: 'regular',
            path: 'ios/EXConstants',
            dependencies: [{ byName: ['EXConstantsObjC', null] }],
          },
          {
            name: 'EXConstantsObjC',
            type: 'regular',
            path: 'ios/EXConstantsObjC',
            dependencies: [],
          },
        ],
      })
    );
    expect(unsupportedTargetDeps).toEqual([]);
    expect(targets[0].dependencies).toEqual(['EXConstantsObjC']);
  });

  // No longer dropped: SwiftPM resolves it against the products of the packages the
  // module declares, and rendering it verbatim leaves that resolution where it belongs.
  it('renders a name that is no target of this package — an external product — verbatim', () => {
    const { targets, unsupportedTargetDeps } = parseDumpedManifest(
      JSON.stringify({
        name: 'TestModule',
        products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Src'] }],
        targets: [
          {
            name: 'Src',
            type: 'regular',
            path: 'ios/Src',
            dependencies: [{ byName: ['SomeUpstreamProduct', null] }],
          },
        ],
      })
    );
    expect(unsupportedTargetDeps).toEqual([]);
    expect(targets[0].dependencies).toEqual(['SomeUpstreamProduct']);
  });

  it('skips the module instead of emitting a target whose dependency was dropped', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-binary-dep-'));
    const moduleRoot = path.join(tmp, 'module');
    const outDir = path.join(tmp, 'out');
    fs.mkdirSync(path.join(moduleRoot, 'ios', 'Src'), { recursive: true });
    runDumpPackage.mockReturnValue(dumpWithBinaryTarget);

    const result = emitSourceManifestPackage({
      moduleRoot,
      frameworkSearchPath: '/abs/interfaces',
      outDir,
    });

    expect(result.packageDep).toBeUndefined();
    expect(result.unsupportedTargetDeps).toEqual([
      { target: 'Src', dependsOn: 'Vendored', kind: 'binary' },
    ]);
    expect(fs.existsSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'))).toBe(
      false
    );
  });
});

// A pure-Swift module's SwiftPM dependencies come from its spm.config.json, the
// same coordinates CocoaPods resolves through the podspec. Without them
// `import SDWebImage` names a package the generated manifest never declared.
describe('SwiftPM package coordinates', () => {
  const sdWebImage = {
    url: 'https://github.com/SDWebImage/SDWebImage.git',
    productName: 'SDWebImage',
    version: { exact: '5.21.6' },
  };

  describe('spmPackageIdentity', () => {
    it("takes the URL's last path component, without the .git suffix", () => {
      expect(spmPackageIdentity(sdWebImage)).toBe('SDWebImage');
      expect(
        spmPackageIdentity({ ...sdWebImage, url: 'https://github.com/SDWebImage/SDWebImage' })
      ).toBe('SDWebImage');
    });

    // libavif-Xcode ships the `libavif` product: the identity SwiftPM resolves is
    // the repository name, not the product name.
    it('reads the repository name, not the product it ships', () => {
      expect(
        spmPackageIdentity({
          url: 'https://github.com/SDWebImage/libavif-Xcode.git',
          productName: 'libavif',
          version: { exact: '1.0.0' },
        })
      ).toBe('libavif-Xcode');
    });

    // A URL ending in a slash has an empty last component, which would render
    // `package: ""` and fail the whole graph rather than the one declaration.
    it('ignores a trailing slash', () => {
      expect(
        spmPackageIdentity({ ...sdWebImage, url: 'https://github.com/SDWebImage/SDWebImage/' })
      ).toBe('SDWebImage');
      expect(
        spmPackageIdentity({ ...sdWebImage, url: 'https://github.com/SDWebImage/SDWebImage.git/' })
      ).toBe('SDWebImage');
    });
  });

  describe('spmPackageDeclaration', () => {
    it('renders every version requirement PackageDescription declares', () => {
      const withVersion = (version) => spmPackageDeclaration({ ...sdWebImage, version });
      expect(withVersion({ exact: '5.21.6' })).toBe(
        '.package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6")'
      );
      expect(withVersion({ from: '5.21.6' })).toBe(
        '.package(url: "https://github.com/SDWebImage/SDWebImage.git", from: "5.21.6")'
      );
      expect(withVersion({ branch: 'main' })).toBe(
        '.package(url: "https://github.com/SDWebImage/SDWebImage.git", branch: "main")'
      );
      expect(withVersion({ revision: 'c0ffee' })).toBe(
        '.package(url: "https://github.com/SDWebImage/SDWebImage.git", revision: "c0ffee")'
      );
    });

    it('refuses a version it cannot spell', () => {
      expect(() => spmPackageDeclaration({ ...sdWebImage, version: { tag: 'v5.21.6' } })).toThrow(
        /names no version requirement this renderer supports/
      );
    });

    // The reader upstream drops an ambiguous version, so this only fires when the
    // two ends disagree — better than picking one requirement and hiding the rest.
    it('refuses a version naming more than one requirement', () => {
      expect(() =>
        spmPackageDeclaration({ ...sdWebImage, version: { exact: '5.21.6', branch: 'main' } })
      ).toThrow(/names more than one version requirement \(exact, branch\)/);
    });
  });

  describe('spmProductDependency', () => {
    it('names the product, resolved against its package identity', () => {
      expect(spmProductDependency(sdWebImage)).toBe(
        '.product(name: "SDWebImage", package: "SDWebImage")'
      );
      expect(
        spmProductDependency({
          url: 'https://github.com/SDWebImage/libavif-Xcode.git',
          productName: 'libavif',
          version: { exact: '1.0.0' },
        })
      ).toBe('.product(name: "libavif", package: "libavif-Xcode")');
    });
  });

  describe('the emitted manifest', () => {
    const emit = (spmPackages) => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-packages-emit-'));
      const moduleRoot = path.join(tmp, 'module');
      const outDir = path.join(tmp, 'out');
      fs.mkdirSync(path.join(moduleRoot, 'ios'), { recursive: true });
      fs.writeFileSync(path.join(moduleRoot, 'ios', 'A.swift'), '// swift\n');
      emitPureSwiftSourcePackage({
        moduleRoot,
        product: 'ExpoImage',
        frameworkSearchPath: '/abs/interfaces',
        outDir,
        iosDeploymentTarget: '16.4',
        spmPackages,
      });
      return fs.readFileSync(
        path.join(outDir, 'expo-source', 'ExpoImage', 'Package.swift'),
        'utf8'
      );
    };

    it('declares each package and depends the target on its product', () => {
      const manifest = emit([
        sdWebImage,
        {
          url: 'https://github.com/SDWebImage/libavif-Xcode.git',
          productName: 'libavif',
          version: { exact: '1.0.0' },
        },
      ]);
      expect(manifest).toContain(
        'dependencies: [\n' +
          '        .package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),\n' +
          '        .package(url: "https://github.com/SDWebImage/libavif-Xcode.git", exact: "1.0.0"),\n' +
          '    ],'
      );
      expect(manifest).toContain(
        'dependencies: [\n' +
          '                .product(name: "SDWebImage", package: "SDWebImage"),\n' +
          '                .product(name: "libavif", package: "libavif-Xcode"),\n' +
          '            ],'
      );
    });

    // Every module that declares no SwiftPM package must keep generating the
    // manifest it generates today, byte for byte.
    it('renders a module with no packages exactly as before', () => {
      const unchanged =
        '// swift-tools-version: 6.0\n' +
        '// AUTO-GENERATED by expo/scripts/spm/plugin.js \u2014 do not edit.\n' +
        '// Pure-Swift source consumption package for "ExpoImage".\n' +
        'import PackageDescription\n' +
        '\n' +
        'let package = Package(\n' +
        '    name: "ExpoImage",\n' +
        '    platforms: [.iOS("16.4")],\n' +
        '    products: [\n' +
        '        .library(name: "ExpoImage", targets: ["ExpoImage"]),\n' +
        '    ],\n' +
        '    dependencies: [],\n' +
        '    targets: [\n' +
        '        .target(\n' +
        '            name: "ExpoImage",\n' +
        '            dependencies: [],\n' +
        '            path: "root/ios",\n' +
        '            cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],\n' +
        '            cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],\n' +
        '            swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],\n' +
        '        ),\n' +
        '    ],\n' +
        '    swiftLanguageModes: [.v5],\n' +
        '    cxxLanguageStandard: .cxx20\n' +
        ')\n';
      expect(emit([])).toBe(unchanged);
      expect(emit(undefined)).toBe(unchanged);
    });
  });
});

// A module that ships a checked-in Package.swift may declare third-party SwiftPM
// packages of its own. The generated consumption package has to mirror them, or its
// sources fail to compile with "no such module".
describe('mirrored package dependencies', () => {
  // Verbatim shapes from `swift package dump-package` (SwiftPM 6.0).
  const remote = (identity, url, requirement) => ({
    sourceControl: [
      {
        identity,
        location: { remote: [{ urlString: url }] },
        productFilter: null,
        requirement,
        traits: [{ name: 'default' }],
      },
    ],
  });

  const SDWEB_IMAGE = remote('sdwebimage', 'https://github.com/SDWebImage/SDWebImage.git', {
    exact: ['5.21.6'],
  });
  // `.package(url:from:)` dumps as a range — the renderer never sees a `from` form.
  const LIBAVIF = remote('libavif-xcode', 'https://github.com/SDWebImage/libavif-Xcode.git', {
    range: [{ lowerBound: '0.11.0', upperBound: '1.0.0' }],
  });

  const dumpWith = ({ dependencies = [], targetDeps = [] }) =>
    JSON.stringify({
      name: 'TestModule',
      dependencies,
      products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
      targets: [
        { name: 'Main', type: 'regular', path: 'ios/Main', dependencies: targetDeps },
        { name: 'Helper', type: 'regular', path: 'ios/Helper', dependencies: [] },
      ],
    });

  const render = (dump, injectedNames = []) =>
    renderSourceManifest({
      manifest: parseDumpedManifest(dump, injectedNames),
      pkgDeps: ['.package(name: "ReactNative", path: "/abs/rn")'],
      injectedTargetDeps: ['.product(name: "React", package: "ReactNative")'],
      frameworkSearchPath: '/abs/interfaces',
    });

  const unsupported = (dependencies, targetDeps) =>
    parseDumpedManifest(dumpWith({ dependencies, targetDeps })).unsupportedPackageDeps;

  it('parses every requirement form the generated package can declare', () => {
    const { packageDeps, unsupportedPackageDeps } = parseDumpedManifest(
      dumpWith({
        dependencies: [
          SDWEB_IMAGE,
          remote('branchy', 'https://github.com/acme/branchy.git', { branch: ['main'] }),
          remote('pinned', 'https://github.com/acme/pinned.git', {
            revision: ['0123456789abcdef'],
          }),
          LIBAVIF,
        ],
      })
    );
    expect(unsupportedPackageDeps).toEqual([]);
    expect(packageDeps).toEqual([
      {
        identity: 'sdwebimage',
        url: 'https://github.com/SDWebImage/SDWebImage.git',
        requirement: { kind: 'exact', value: '5.21.6' },
      },
      {
        identity: 'branchy',
        url: 'https://github.com/acme/branchy.git',
        requirement: { kind: 'branch', value: 'main' },
      },
      {
        identity: 'pinned',
        url: 'https://github.com/acme/pinned.git',
        requirement: { kind: 'revision', value: '0123456789abcdef' },
      },
      {
        identity: 'libavif-xcode',
        url: 'https://github.com/SDWebImage/libavif-Xcode.git',
        requirement: { kind: 'range', lowerBound: '0.11.0', upperBound: '1.0.0' },
      },
    ]);
  });

  it('declares each requirement form the way PackageDescription spells it', () => {
    const out = render(
      dumpWith({
        dependencies: [
          SDWEB_IMAGE,
          remote('branchy', 'https://github.com/acme/branchy.git', { branch: ['main'] }),
          remote('pinned', 'https://github.com/acme/pinned.git', {
            revision: ['0123456789abcdef'],
          }),
          LIBAVIF,
        ],
      })
    );
    expect(out).toContain(
      '.package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),'
    );
    expect(out).toContain('.package(url: "https://github.com/acme/branchy.git", branch: "main"),');
    expect(out).toContain(
      '.package(url: "https://github.com/acme/pinned.git", revision: "0123456789abcdef"),'
    );
    expect(out).toContain(
      '.package(url: "https://github.com/SDWebImage/libavif-Xcode.git", "0.11.0"..<"1.0.0"),'
    );
  });

  it('declares the mirrored packages after the injected ones', () => {
    expect(render(dumpWith({ dependencies: [SDWEB_IMAGE] }))).toContain(
      'dependencies: [\n' +
        '        .package(name: "ReactNative", path: "/abs/rn"),\n' +
        '        .package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),\n' +
        '    ],'
    );
  });

  it('keeps target dependencies in their declared order, siblings and products alike', () => {
    const dump = dumpWith({
      dependencies: [SDWEB_IMAGE, LIBAVIF],
      targetDeps: [
        { product: ['SDWebImage', 'SDWebImage', null, null] },
        { byName: ['Helper', null] },
        { product: ['SDWebImageAVIFCoder', 'libavif-Xcode', null, { platformNames: ['ios'] }] },
      ],
    });
    expect(parseDumpedManifest(dump).targets[0].dependencies).toEqual([
      { product: 'SDWebImage', package: 'SDWebImage', platforms: [] },
      'Helper',
      { product: 'SDWebImageAVIFCoder', package: 'libavif-Xcode', platforms: ['ios'] },
    ]);
    expect(render(dump)).toContain(
      [
        '                .product(name: "SDWebImage", package: "SDWebImage"),',
        '                "Helper",',
        '                .product(name: "SDWebImageAVIFCoder", package: "libavif-Xcode", condition: .when(platforms: [.iOS])),',
        '                .product(name: "React", package: "ReactNative"),',
      ].join('\n')
    );
  });

  it('keeps a byName dependency that names a declared package', () => {
    const dump = dumpWith({
      dependencies: [
        remote('branchy', 'https://github.com/acme/branchy.git', { branch: ['main'] }),
      ],
      targetDeps: [
        { byName: ['branchy', null] },
        { byName: ['Branchy', { platformNames: ['ios'] }] },
      ],
    });
    const { targets, unsupportedPackageDeps } = parseDumpedManifest(dump);
    expect(unsupportedPackageDeps).toEqual([]);
    expect(targets[0].dependencies).toEqual(['branchy', { byName: 'Branchy', platforms: ['ios'] }]);
    expect(render(dump)).toContain(
      '                "branchy",\n' +
        '                .byName(name: "Branchy", condition: .when(platforms: [.iOS])),'
    );
  });

  it('reports a local path dependency instead of dropping it', () => {
    expect(
      unsupported([
        { fileSystem: [{ identity: 'local-thing', path: '/abs/path', productFilter: null }] },
      ])
    ).toEqual([{ form: 'local-path', identity: 'local-thing', target: null }]);
  });

  it('reports a registry dependency', () => {
    expect(
      unsupported([{ registry: [{ identity: 'acme.widgets', requirement: { exact: ['1.0.0'] } }] }])
    ).toEqual([{ form: 'registry', identity: 'acme.widgets', target: null }]);
  });

  it('reports a source-control dependency that is not a remote URL', () => {
    expect(
      unsupported([
        {
          sourceControl: [
            {
              identity: 'local-scm',
              location: { local: [{ path: '/abs/checkout' }] },
              requirement: { branch: ['main'] },
            },
          ],
        },
      ])
    ).toEqual([{ form: 'unsupported-location', identity: 'local-scm', target: null }]);
  });

  it('reports a requirement form it cannot render', () => {
    expect(
      unsupported([
        remote('futured', 'https://github.com/acme/futured.git', { upToNextMajor: ['1.0.0'] }),
      ])
    ).toEqual([{ form: 'unsupported-requirement', identity: 'futured', target: null }]);
  });

  it('reports a dependency form it does not recognize', () => {
    expect(unsupported([{ sourceArchive: [{ identity: 'zipped' }] }])).toEqual([
      { form: 'unknown-form', identity: 'zipped', target: null },
    ]);
  });

  it('reports a product whose package the manifest never declared, naming the target', () => {
    expect(unsupported([], [{ product: ['SDWebImage', 'SDWebImage', null, null] }])).toEqual([
      { form: 'undeclared-package', identity: 'SDWebImage', target: 'Main' },
    ]);
  });

  it('reports a product that names no package at all', () => {
    expect(unsupported([], [{ product: ['Vendored', null, null, null] }])).toEqual([
      { form: 'undeclared-package', identity: null, target: 'Main' },
    ]);
  });

  // The package IS declared — the line above says why it cannot be mirrored. A second
  // line calling it undeclared would send the reader looking for a declaration that is
  // right in front of them.
  it('does not also call a product of an unmirrorable package undeclared', () => {
    expect(
      unsupported(
        [{ fileSystem: [{ identity: 'vendored', path: '/abs/vendored' }] }],
        [{ product: ['Vendored', 'vendored', null, null] }]
      )
    ).toEqual([{ form: 'local-path', identity: 'vendored', target: 'Main' }]);
  });

  it('attributes a product to an unmirrorable package declared under another name', () => {
    expect(
      unsupported(
        [
          {
            fileSystem: [
              {
                identity: 'libavif-xcode',
                nameForTargetDependencyResolutionOnly: 'Avif',
                path: '/abs/libavif-Xcode',
              },
            ],
          },
        ],
        [{ product: ['Avif', 'Avif', null, null] }]
      )
    ).toEqual([{ form: 'local-path', identity: 'libavif-xcode', target: 'Main' }]);
  });

  it('still reports a product whose package nothing declares', () => {
    expect(
      unsupported(
        [{ fileSystem: [{ identity: 'vendored', path: '/abs/vendored' }] }],
        [{ product: ['Elsewhere', 'elsewhere', null, null] }]
      )
    ).toEqual([
      { form: 'local-path', identity: 'vendored', target: null },
      { form: 'undeclared-package', identity: 'elsewhere', target: 'Main' },
    ]);
  });

  it('reports two declared packages that answer to one name', () => {
    const named = {
      sourceControl: [
        {
          identity: 'libavif-xcode',
          nameForTargetDependencyResolutionOnly: 'libavif',
          location: {
            remote: [{ urlString: 'https://github.com/SDWebImage/libavif-Xcode.git' }],
          },
          requirement: { exact: ['1.0.0'] },
          traits: [{ name: 'default' }],
        },
      ],
    };
    expect(
      unsupported([
        remote('libavif', 'https://github.com/acme/libavif.git', { exact: ['2.0.0'] }),
        named,
      ])
    ).toEqual([{ form: 'ambiguous-package-name', identity: 'libavif', target: null }]);
  });

  it('reports a package whose identity collides with one the injected set occupies', () => {
    const { unsupportedPackageDeps } = parseDumpedManifest(
      dumpWith({
        dependencies: [
          remote('reactnative', 'https://github.com/acme/ReactNative.git', {
            exact: ['1.0.0'],
          }),
        ],
      }),
      ['ReactNative', 'React-GeneratedCode']
    );
    expect(unsupportedPackageDeps).toEqual([
      { form: 'collides-with-injected', identity: 'reactnative', target: null },
    ]);
  });

  // The modules that ship a checked-in Package.swift today declare no packages of their
  // own. Mirroring must not move a byte of what they already emit.
  it('renders a manifest without dependencies exactly as it did before', () => {
    const dump = JSON.stringify({
      name: 'expo-constants',
      dependencies: [],
      platforms: [{ platformName: 'ios', version: '15.1' }],
      products: [
        {
          name: 'EXConstants',
          type: { library: ['automatic'] },
          targets: ['EXConstants', 'EXConstantsObjC'],
        },
      ],
      targets: [
        {
          name: 'EXConstants',
          type: 'regular',
          path: 'ios/EXConstants',
          dependencies: [{ byName: ['EXConstantsObjC', null] }],
        },
        {
          name: 'EXConstantsObjC',
          type: 'regular',
          path: 'ios/EXConstantsObjC',
          publicHeadersPath: 'include',
          dependencies: [],
        },
      ],
    });
    expect(render(dump)).toBe(`// swift-tools-version: 6.0
// AUTO-GENERATED by expo/scripts/spm/plugin.js — do not edit.
// Source consumption package for "expo-constants": mirrors the module's checked-in
// Package.swift targets and injects invariant React compile dependencies.
import PackageDescription

let package = Package(
    name: "expo-constants",
    platforms: [.iOS("15.1")],
    products: [
        .library(name: "EXConstants", targets: ["EXConstants", "EXConstantsObjC"])
    ],
    dependencies: [
        .package(name: "ReactNative", path: "/abs/rn"),
    ],
    targets: [
        .target(
            name: "EXConstants",
            dependencies: [
                "EXConstantsObjC",
                .product(name: "React", package: "ReactNative"),
            ],
            path: "root/ios/EXConstants",
            cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
            cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
            swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
        ),
        .target(
            name: "EXConstantsObjC",
            dependencies: [
                .product(name: "React", package: "ReactNative"),
            ],
            path: "root/ios/EXConstantsObjC",
            publicHeadersPath: "include",
            cSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
            cxxSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
            swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])],
        )
    ],
    swiftLanguageModes: [.v5],
    cxxLanguageStandard: .cxx20
)
`);
  });

  // SwiftPM resolves a `.byName` that is no target of this package against the products
  // of the packages it declares, which a dumped manifest does not enumerate.
  it('renders a byName that names no target verbatim rather than dropping it', () => {
    const dump = dumpWith({
      dependencies: [LIBAVIF],
      targetDeps: [
        { byName: ['libavif', null] },
        { byName: ['SVGKit', { platformNames: ['ios'] }] },
      ],
    });
    const { targets, unsupportedPackageDeps } = parseDumpedManifest(dump);
    expect(unsupportedPackageDeps).toEqual([]);
    expect(targets[0].dependencies).toEqual(['libavif', { byName: 'SVGKit', platforms: ['ios'] }]);
    expect(render(dump)).toContain(
      '                "libavif",\n' +
        '                .byName(name: "SVGKit", condition: .when(platforms: [.iOS])),'
    );
  });

  // `.package(name:url:)` is deprecated but legal, and the manifest then names the
  // package by that name rather than by the identity SwiftPM derives from the URL.
  it('matches a product against the name the manifest gave the package', () => {
    const named = {
      sourceControl: [
        {
          identity: 'libavif-xcode',
          nameForTargetDependencyResolutionOnly: 'libavif',
          location: {
            remote: [{ urlString: 'https://github.com/SDWebImage/libavif-Xcode.git' }],
          },
          requirement: { range: [{ lowerBound: '1.0.0', upperBound: '2.0.0' }] },
          traits: [{ name: 'default' }],
        },
      ],
    };
    const dump = dumpWith({
      dependencies: [named],
      targetDeps: [{ product: ['libavif', 'libavif', null, null] }],
    });
    expect(parseDumpedManifest(dump).unsupportedPackageDeps).toEqual([]);
    // The mirrored declaration carries no `name:`, so the product has to name the identity.
    expect(render(dump)).toContain('.product(name: "libavif", package: "libavif-xcode"),');
  });

  it('reports a product dependency that renames modules with moduleAliases', () => {
    expect(
      unsupported([SDWEB_IMAGE], [{ product: ['SDWebImage', 'SDWebImage', { SD: 'SDWeb' }, null] }])
    ).toEqual([{ form: 'module-aliases', identity: 'SDWebImage', target: 'Main' }]);
  });

  it('says nothing about an empty moduleAliases map', () => {
    expect(
      unsupported([SDWEB_IMAGE], [{ product: ['SDWebImage', 'SDWebImage', {}, null] }])
    ).toEqual([]);
  });

  it('reports a product dependency conditioned on something other than platforms', () => {
    expect(
      unsupported(
        [SDWEB_IMAGE],
        [{ product: ['SDWebImage', 'SDWebImage', null, { platformNames: ['ios'], traits: ['x'] }] }]
      )
    ).toEqual([{ form: 'unsupported-condition', identity: 'SDWebImage', target: 'Main' }]);
  });

  // Its own form: the identity slot holds a target name here, and the diagnostic has to
  // call it a dependency rather than a package.
  it('reports a sibling dependency conditioned the same way', () => {
    expect(unsupported([], [{ byName: ['Helper', { traits: ['x'] }] }])).toEqual([
      { form: 'unsupported-target-condition', identity: 'Helper', target: 'Main' },
    ]);
  });

  it('says nothing about a condition whose only set key is the platform list', () => {
    expect(
      unsupported(
        [SDWEB_IMAGE],
        [
          {
            product: [
              'SDWebImage',
              'SDWebImage',
              null,
              { platformNames: ['ios'], traits: null, config: null },
            ],
          },
        ]
      )
    ).toEqual([]);
  });

  it('reports a package declared with a trait set that is not the default', () => {
    const traited = {
      sourceControl: [
        {
          identity: 'traited',
          location: { remote: [{ urlString: 'https://github.com/acme/traited.git' }] },
          requirement: { exact: ['1.0.0'] },
          traits: [{ name: 'default' }, { name: 'extras' }],
        },
      ],
    };
    expect(unsupported([traited])).toEqual([
      { form: 'unsupported-traits', identity: 'traited', target: null },
    ]);
  });

  it('escapes a conditioned sibling target name like every other dependency', () => {
    const out = renderSourceManifest({
      manifest: {
        name: 'TestModule',
        products: [{ name: 'TestModule', targets: ['Main'] }],
        targets: [
          {
            name: 'Main',
            path: 'Main',
            publicHeadersPath: null,
            dependencies: [{ name: 'We"ird', platforms: ['ios'] }],
          },
        ],
      },
      frameworkSearchPath: '/abs/interfaces',
    });
    expect(out).toContain('.target(name: "We\\"ird", condition: .when(platforms: [.iOS]))');
  });

  describe('emitting a module that declares packages', () => {
    let moduleRoot;
    let outDir;

    beforeEach(() => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-pkg-deps-'));
      moduleRoot = path.join(tmp, 'module');
      outDir = path.join(tmp, 'out');
      fs.mkdirSync(path.join(moduleRoot, 'ios', 'Main'), { recursive: true });
      fs.mkdirSync(path.join(moduleRoot, 'ios', 'Helper'), { recursive: true });
    });

    const emittedManifest = () =>
      fs.readFileSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'), 'utf8');

    it('carries the module packages and their products into the emitted manifest', () => {
      runDumpPackage.mockReturnValue(
        dumpWith({
          dependencies: [SDWEB_IMAGE],
          targetDeps: [{ product: ['SDWebImage', 'SDWebImage', null, null] }],
        })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.unsupportedPackageDeps).toBeUndefined();
      expect(emittedManifest()).toContain(
        '.package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),'
      );
      expect(emittedManifest()).toContain('.product(name: "SDWebImage", package: "SDWebImage"),');
    });

    it('skips the module instead of emitting a manifest missing a package it declares', () => {
      runDumpPackage.mockReturnValue(
        dumpWith({ dependencies: [{ fileSystem: [{ identity: 'local-thing', path: '/abs' }] }] })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.packageDep).toBeUndefined();
      expect(result.unsupportedPackageDeps).toEqual([
        { form: 'local-path', identity: 'local-thing', target: null },
      ]);
      expect(fs.existsSync(path.join(outDir, 'expo-source', 'TestModule', 'Package.swift'))).toBe(
        false
      );
    });

    // `unmappedPodDependencies` subtracts these from the pods the module's podspec
    // names, matching a pod against the PRODUCT name, not the package identity.
    it('names the third-party products it mirrored, and no sibling target', () => {
      runDumpPackage.mockReturnValue(
        JSON.stringify({
          name: 'TestModule',
          dependencies: [
            SDWEB_IMAGE,
            LIBAVIF,
            remote('branchy', 'https://github.com/acme/branchy.git', { branch: ['main'] }),
          ],
          products: [{ name: 'TestModule', type: { library: ['automatic'] }, targets: ['Main'] }],
          targets: [
            {
              name: 'Main',
              type: 'regular',
              path: 'ios/Main',
              dependencies: [
                { byName: ['Helper', null] },
                { product: ['SDWebImage', 'SDWebImage', null, null] },
                { byName: ['branchy', null] },
              ],
            },
            {
              name: 'Helper',
              type: 'regular',
              path: 'ios/Helper',
              dependencies: [
                { product: ['libavif', 'libavif-Xcode', null, { platformNames: ['ios'] }] },
                { product: ['SDWebImage', 'SDWebImage', null, null] },
              ],
            },
          ],
        })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.spmProductNames).toEqual(['SDWebImage', 'branchy', 'libavif']);
    });

    it('counts a byName that names no target as a product it mirrored', () => {
      runDumpPackage.mockReturnValue(
        dumpWith({
          dependencies: [LIBAVIF],
          targetDeps: [{ byName: ['Helper', null] }, { byName: ['libavif', null] }],
        })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.spmProductNames).toEqual(['libavif']);
    });

    // A path package's SwiftPM identity is its directory name, whatever `name:` calls it.
    it('occupies the identity of a path-based React package, not only its name', () => {
      runDumpPackage.mockReturnValue(
        dumpWith({
          dependencies: [remote('rn', 'https://github.com/acme/rn.git', { exact: ['1.0.0'] })],
        })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        react: { packageRef: { name: 'ReactNative', path: '/abs/checkout/rn' }, products: [] },
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.unsupportedPackageDeps).toEqual([
        { form: 'collides-with-injected', identity: 'rn', target: null },
      ]);
    });

    it('takes the identities the injected set occupies from the React descriptor', () => {
      runDumpPackage.mockReturnValue(
        dumpWith({
          dependencies: [
            remote('reactnative', 'https://github.com/acme/ReactNative.git', { exact: ['1.0.0'] }),
          ],
        })
      );

      const result = emitSourceManifestPackage({
        moduleRoot,
        react: {
          packageRef: { name: 'ReactNative', path: '/abs/rn' },
          products: [{ name: 'React', package: 'ReactNative' }],
        },
        frameworkSearchPath: '/abs/interfaces',
        outDir,
      });

      expect(result.unsupportedPackageDeps).toEqual([
        { form: 'collides-with-injected', identity: 'reactnative', target: null },
      ]);
    });
  });
});
