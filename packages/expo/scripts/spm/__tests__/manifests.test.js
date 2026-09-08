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
        siblingDeps: ['ExpoFileSystemObjC'],
      },
      {
        name: 'ExpoFileSystemObjC',
        path: 'ios/ExpoFileSystemObjC',
        publicHeadersPath: 'include',
        exclude: [],
        sources: [],
        resources: [],
        siblingDeps: [],
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

  it('accepts both the .target and .byName forms and ignores product dependencies', () => {
    const [main] = parseDumpedManifest(dumped).targets;
    expect(main.siblingDeps).toEqual([
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
        siblingDeps: ['ExpoFileSystemObjC'],
      },
      {
        name: 'ExpoFileSystemObjC',
        path: 'ios/ExpoFileSystemObjC',
        publicHeadersPath: 'include',
        siblingDeps: [],
      },
    ],
  };
  const out = renderSourceManifest(
    manifest,
    ['.package(name: "ReactNative", path: "/abs/rn")'],
    ['.product(name: "ReactHeaders", package: "ReactNative")'],
    '/abs/interfaces'
  );

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
  const out = renderPureSwiftManifest('ExpoAsset', 'ios', [], [], '/abs/interfaces');

  it('emits a single target over the source dir with the given deps', () => {
    expect(out).toContain('.library(name: "ExpoAsset", targets: ["ExpoAsset"])');
    expect(out).toContain('path: "root/ios"');
    expect(out).toContain('swiftSettings: [.unsafeFlags(["-F", "/abs/interfaces"])]');
    expect(out).not.toContain('.binaryTarget');
    expect(out).not.toMatch(/\[\s*,\s*\]/);
    expect(out).toContain('swiftLanguageModes: [.v5],\n    cxxLanguageStandard: .cxx20');
  });
});

describe('renderSourceManifest target dependency conditions', () => {
  const render = (siblingDeps) =>
    renderSourceManifest(
      {
        name: 'TestModule',
        products: [{ name: 'TestModule', targets: ['Main'] }],
        targets: [{ name: 'Main', path: 'Main', publicHeadersPath: null, siblingDeps }],
      },
      [],
      [],
      '/abs/interfaces'
    );

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

  it('keeps the dependency but drops an unrecognized platform condition', () => {
    const out = render([{ name: 'Helper', platforms: ['ios', 'plan9'] }]);
    expect(out).toContain('"Helper",');
    expect(out).not.toContain('condition:');
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

  const emit = () => emitSourceManifestPackage(moduleRoot, null, '/abs/interfaces', outDir, null);
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
      renderSourceManifest(
        {
          name: 'TestModule',
          products: [{ name: 'TestModule', targets: ['Example'] }],
          targets: [{ name: 'Example', path: null, publicHeadersPath: null, siblingDeps: [] }],
        },
        [],
        [],
        '/abs/interfaces'
      )
    ).toThrow(/Example/);
  });
});

describe('renderPureSwiftManifest excludes', () => {
  it('excludes the directories classification ignores, in the given order', () => {
    const out = renderPureSwiftManifest('ExpoClipboard', 'ios', [], [], '/abs/interfaces', [
      'Feature/Tests',
      'Tests',
    ]);
    expect(out).toContain('path: "root/ios",\n            exclude: ["Feature/Tests", "Tests"],');
  });

  it('emits no exclude key when nothing is ignored', () => {
    expect(
      renderPureSwiftManifest('ExpoAsset', 'ios', [], [], '/abs/interfaces', [])
    ).not.toContain('exclude:');
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

    emitPureSwiftSourcePackage(moduleRoot, 'ExpoAsset', null, '/abs/interfaces', outDir, null);
    const manifest = fs.readFileSync(
      path.join(outDir, 'expo-source', 'ExpoAsset', 'Package.swift'),
      'utf8'
    );
    expect(manifest).toContain('exclude: ["Feature/Tests", "__tests__"],');
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
  const emit = () => emitSourceManifestPackage(moduleRoot, null, '/abs/interfaces', outDir, null);

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
    expect(main.siblingDeps).toEqual(['Helper']);
  });
});

describe('unsupported platform conditions', () => {
  it('drops a freebsd condition, which PackageDescription 6.0 does not declare', () => {
    const out = renderSourceManifest(
      {
        name: 'TestModule',
        products: [{ name: 'TestModule', targets: ['Main'] }],
        targets: [
          {
            name: 'Main',
            path: 'Main',
            publicHeadersPath: null,
            siblingDeps: [{ name: 'Helper', platforms: ['freebsd'] }],
          },
        ],
      },
      [],
      [],
      '/abs/interfaces'
    );
    expect(out).toContain('"Helper",');
    expect(out).not.toContain('condition:');
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
  const render = (manifest) => renderSourceManifest(manifest, [], [], '/abs/interfaces');

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
