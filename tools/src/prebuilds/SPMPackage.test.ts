import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { type CheckedInResolvedTarget, isCheckedInResolvedTarget } from './CheckedInManifest';
import type { BuildFlavor } from './Prebuilder.types';
import type { ObjcTarget, SPMProduct, SwiftTarget } from './SPMConfig.types';
import {
  applyCheckedInTarget,
  buildCSettings,
  buildLinkerSettings,
  buildSwiftSettings,
  expandTransitiveExternalDeps,
  findSiblingProductDependencies,
  resolveCompilerFlags,
  type ExternalDepResolver,
} from './SPMPackage';
import type { ResolvedTarget } from './SPMPackage.types';

/** Builds an ArtifactPaths fixture whose React cache slot we then populate per-format. */
function makeArtifactPaths(cachePath: string, version: string) {
  return {
    hermes: path.join(cachePath, 'hermes'),
    reactNativeDependencies: path.join(cachePath, 'deps'),
    react: path.join(cachePath, 'react', version, 'debug'),
    cachePath,
    hermesVersion: '1.0.0',
    reactNativeVersion: version,
  };
}

function makeProduct(name: string, targetDeps: string[] = []): SPMProduct {
  return {
    name,
    podName: name,
    platforms: ['iOS(.v15)'],
    targets: [
      {
        type: 'swift' as const,
        name,
        path: 'ios',
        pattern: '**/*.swift',
        dependencies: targetDeps,
      },
    ],
  };
}

describe('findSiblingProductDependencies', () => {
  it('returns empty when product has no target dependencies', () => {
    const product = makeProduct('ExpoCamera');
    const all = [product, makeProduct('Other')];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('returns empty when dependencies are not sibling products', () => {
    const product = makeProduct('ExpoCamera', ['ZXingObjC', 'ExpoModulesCore']);
    const all = [product];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('detects a sibling product dependency', () => {
    const camera = makeProduct('ExpoCamera');
    const scanner = makeProduct('ExpoCameraBarcodeScanning', ['ExpoCamera', 'ZXingObjC']);
    const all = [camera, scanner];
    assert.deepEqual(findSiblingProductDependencies(scanner, all), ['ExpoCamera']);
  });

  it('does not include self as a sibling', () => {
    const product = makeProduct('ExpoCamera', ['ExpoCamera']);
    const all = [product];
    assert.deepEqual(findSiblingProductDependencies(product, all), []);
  });

  it('deduplicates across multiple targets', () => {
    const product: SPMProduct = {
      name: 'Scanner',
      podName: 'Scanner',
      platforms: ['iOS(.v15)'],
      targets: [
        {
          type: 'swift',
          name: 'ScannerSwift',
          path: 'ios',
          pattern: '**/*.swift',
          dependencies: ['Core'],
        },
        {
          type: 'objc',
          name: 'ScannerObjC',
          path: 'ios',
          pattern: '**/*.m',
          dependencies: ['Core'],
        },
      ],
    };
    const all = [makeProduct('Core'), product];
    assert.deepEqual(findSiblingProductDependencies(product, all), ['Core']);
  });
});

// Synthetic resolver for tests. Keys map a `package/Product` to its further
// externalDeps; anything not in the map resolves to null (matching production).
const makeResolver =
  (graph: Record<string, string[]>): ExternalDepResolver =>
  (dep) =>
    dep in graph ? graph[dep] : null;

describe('expandTransitiveExternalDeps', () => {
  it('passes through and deduplicates leaf-only seeds', () => {
    assert.deepEqual(
      expandTransitiveExternalDeps(['A', 'B', 'A', 'C', 'B'], () => null),
      ['A', 'B', 'C']
    );
  });

  it('walks transitive deps across multiple levels', () => {
    const resolver = makeResolver({
      'pkg-a/A': ['pkg-b/B', 'Hermes'],
      'pkg-b/B': ['pkg-c/C'],
      'pkg-c/C': ['Hermes'], // dup with seed-derived Hermes — must dedup
    });
    assert.deepEqual(expandTransitiveExternalDeps(['pkg-a/A'], resolver), [
      'pkg-a/A',
      'pkg-b/B',
      'Hermes',
      'pkg-c/C',
    ]);
  });

  it('terminates on cycles', () => {
    const resolver = makeResolver({ 'pkg-a/A': ['pkg-b/B'], 'pkg-b/B': ['pkg-a/A'] });
    assert.deepEqual(expandTransitiveExternalDeps(['pkg-a/A'], resolver), ['pkg-a/A', 'pkg-b/B']);
  });
});

describe('buildSwiftSettings ExpoModulesMacros plugin flags', () => {
  const makeSwiftTarget = (name: string): SwiftTarget => ({
    type: 'swift',
    name,
    path: 'ios',
    pattern: '**/*.swift',
  });

  const hasMacroPluginFlags = (settings: string[]): boolean =>
    settings.some(
      (line) => line.includes('-load-plugin-executable') && line.includes('#ExpoModulesMacros')
    );

  const macroToolPathSegment = path.join(
    'node_modules',
    '@expo',
    'expo-modules-macros-plugin',
    'apple',
    'ExpoModulesMacros-tool'
  );

  it('should emit load-plugin-executable flags for the ExpoModulesCore swift target', () => {
    const settings = buildSwiftSettings(
      ['ReactNativeDependencies', 'React', 'Hermes', 'expo-modules-jsi/ExpoModulesJSI'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesCore')
    );
    assert.ok(
      hasMacroPluginFlags(settings),
      `expected macro plugin flags in swiftSettings, got:\n${settings.join('\n')}`
    );
    assert.ok(
      settings.some((line) => line.includes(macroToolPathSegment)),
      `expected macro plugin executable path in swiftSettings, got:\n${settings.join('\n')}`
    );
  });

  it('should emit load-plugin-executable flags for a target that depends directly on ExpoModulesCore', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'React', 'ExpoModulesCore'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesWorklets')
    );
    assert.ok(hasMacroPluginFlags(settings));
  });

  it('should emit load-plugin-executable flags for a target that depends on ExpoModulesCore via the cross-package form', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'expo-modules-core/ExpoModulesCore'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoCrypto')
    );
    assert.ok(hasMacroPluginFlags(settings));
  });

  it('should not emit load-plugin-executable flags for a target unrelated to ExpoModulesCore', () => {
    const settings = buildSwiftSettings(
      ['Hermes', 'React', 'ReactNativeDependencies'],
      null,
      '/tmp/pkg',
      'Debug',
      makeSwiftTarget('ExpoModulesJSI')
    );
    assert.equal(hasMacroPluginFlags(settings), false);
  });

  it('should not emit load-plugin-executable flags when no swift target is provided', () => {
    const settings = buildSwiftSettings(['ExpoModulesCore'], null, '/tmp/pkg', 'Debug');
    assert.equal(hasMacroPluginFlags(settings), false);
  });
});

/**
 * Recovers the clang command line a settings array produces: the rendered form is
 * `.unsafeFlags(["-Xcc", "-I", "-Xcc", "/path"], …)`, so take the quoted tokens and drop the
 * `-Xcc` separators the Swift compiler needs but clang never sees.
 */
function clangFlagsOf(settings: string[]): string {
  return [...settings.join(' ').matchAll(/"([^"]*)"/g)]
    .map((match) => match[1])
    .filter((flag) => flag !== '-Xcc')
    .join(' ');
}

describe('React header flags: modular module map', () => {
  const version = '1000.0.0';
  const tmpDirs: string[] = [];

  afterEach(() => {
    while (tmpDirs.length) {
      fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
    }
  });

  /** Creates an empty debug slot of the React artifact cache; tests fill it in per case. */
  function makeReactCache(): { cachePath: string; debugBase: string } {
    const cachePath = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-react-flags-'));
    tmpDirs.push(cachePath);
    const debugBase = path.join(cachePath, 'react', version, 'debug');
    fs.mkdirSync(debugBase, { recursive: true });
    return { cachePath, debugBase };
  }

  /** Writes the headers-only sidecar a 0.87+ artifact ships, and returns its headers dir. */
  function writeModularHeaders(basePath: string): string {
    const headersDir = path.join(
      basePath,
      'ReactNativeHeaders.xcframework',
      'ios-arm64',
      'Headers'
    );
    fs.mkdirSync(headersDir, { recursive: true });
    fs.writeFileSync(
      path.join(headersDir, 'module.modulemap'),
      'module ReactNativeHeaders_react {}'
    );
    return headersDir;
  }

  it('emits the module map and headers dir of ReactNativeHeaders.xcframework, and nothing from React.xcframework', () => {
    const { cachePath, debugBase } = makeReactCache();
    const headersDir = writeModularHeaders(debugBase);

    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);

    // clang requires the joined form `-fmodule-map-file=<path>`; the space-separated variant errors.
    assert.ok(
      clangFlags.includes(`-fmodule-map-file=${path.join(headersDir, 'module.modulemap')}`),
      `missing module map flag in: ${clangFlags}`
    );
    assert.ok(
      clangFlags.includes(`-I ${headersDir}`),
      `missing include path for the modular headers dir in: ${clangFlags}`
    );
    // React.xcframework is a binary target, not a header root: any include into it means the
    // lowercase `react/`, `yoga/` namespaces resolve non-modularly again.
    assert.ok(
      !clangFlags.includes('React.xcframework'),
      `unexpected React.xcframework include root in: ${clangFlags}`
    );
  });

  it('throws when a downloaded React artifact has no ReactNativeHeaders.xcframework', () => {
    const { cachePath, debugBase } = makeReactCache();

    assert.throws(
      () =>
        buildSwiftSettings(
          ['React'],
          makeArtifactPaths(cachePath, version),
          path.join(cachePath, 'pkg'),
          'Debug'
        ),
      (error: Error) =>
        error.message.includes(debugBase) &&
        error.message.includes('ReactNativeHeaders.xcframework')
    );
  });

  it('ignores a flavor whose slot exists but is still being extracted', () => {
    const { cachePath, debugBase } = makeReactCache();
    const headersDir = writeModularHeaders(debugBase);

    // downloadArtifactAsync mkdirs the flavor slot before extracting into it, and the pipeline
    // downloads flavors concurrently, so the release slot can exist and be empty while Debug
    // generates. An interrupted download leaves the same state permanently.
    fs.mkdirSync(path.join(cachePath, 'react', version, 'release'), { recursive: true });

    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);
    assert.ok(
      clangFlags.includes(`-fmodule-map-file=${path.join(headersDir, 'module.modulemap')}`),
      `missing module map flag for the built flavor in: ${clangFlags}`
    );
    assert.ok(
      clangFlags.includes(`-I ${headersDir}`),
      `missing include path for the built flavor in: ${clangFlags}`
    );
  });

  it('ignores a flavor that was never downloaded', () => {
    const { cachePath, debugBase } = makeReactCache();
    writeModularHeaders(debugBase);

    // `et prebuild --flavor Debug` only populates the debug slot; the absent release slot must
    // not fail the build it never takes part in.
    const settings = buildSwiftSettings(
      ['React'],
      makeArtifactPaths(cachePath, version),
      path.join(cachePath, 'pkg'),
      'Debug'
    );
    const clangFlags = clangFlagsOf(settings);
    assert.ok(
      !clangFlags.includes(`${version}/release`),
      `unexpected release flavor flags in: ${clangFlags}`
    );
  });
});

describe('buildCSettings include directories', () => {
  function settingsFor(target: ObjcTarget) {
    return buildCSettings(
      target,
      [],
      null,
      '/repo/packages/precompile/.build/fixture/spm',
      'Fixture',
      '1.0.0',
      '/repo/packages/fixture',
      '/repo/packages/precompile/.build/fixture',
      'Debug'
    );
  }

  it('resolves include directories against the target path', () => {
    const { cSettings } = settingsFor({
      type: 'objc',
      name: 'FixtureObjC',
      path: 'ios',
      includeDirectories: ['common'],
    });
    assert.ok(
      cSettings.some((setting) => setting.includes('/repo/packages/fixture/ios/common')),
      `Expected an -I flag for ios/common: ${cSettings.join(' ')}`
    );
  });

  it('explains include directories on a target that declares no path', () => {
    assert.throws(
      () => settingsFor({ type: 'objc', name: 'FixtureObjC', includeDirectories: ['common'] }),
      (error: Error) => {
        assert.ok(!(error instanceof TypeError), `Expected a diagnostic, got ${error.stack}`);
        assert.match(error.message, /product "Fixture", target "FixtureObjC"/);
        assert.match(error.message, /includeDirectories/);
        assert.match(error.message, /no "path"/);
        assert.match(error.message, /Package\.swift/);
        assert.match(error.message, /spm\.config\.json/);
        return true;
      }
    );
  });
});

describe('applyCheckedInTarget', () => {
  function resolvedTarget(overrides: Partial<ResolvedTarget> = {}): ResolvedTarget {
    return {
      type: 'swift',
      name: 'ExpoHaptics',
      path: 'ios',
      dependencies: ['ExpoModulesCore'],
      linkedFrameworks: ['UIKit'],
      publicHeadersPath: 'ios/include',
      cSettings: ['-I/repo/packages/expo-haptics/ios'],
      cxxSettings: ['-std=c++20'],
      swiftSettings: ['-DEXPO_CONFIGURATION_DEBUG'],
      linkerSettings: ['-ObjC'],
      resources: [{ path: 'ios/Assets', rule: 'copy' }],
      ...overrides,
    };
  }

  function checkedInTarget(
    overrides: Partial<CheckedInResolvedTarget> = {}
  ): CheckedInResolvedTarget {
    return {
      type: 'objc',
      name: 'ExpoHaptics',
      path: 'ExpoHaptics',
      sourceRoot: '/repo/packages/expo-haptics/ios',
      productMember: true,
      sources: ['src'],
      exclude: ['src/Tests'],
      dependencies: ['ManifestOnly'],
      linkedFrameworks: ['CoreHaptics'],
      resources: [],
      publicHeadersPath: 'src/include',
      ...overrides,
    };
  }

  it('takes the manifest spelling for every key the manifest owns', () => {
    const merged = applyCheckedInTarget(resolvedTarget(), checkedInTarget());
    assert.equal(merged.type, 'objc');
    assert.equal(merged.path, 'ExpoHaptics');
    assert.equal(merged.publicHeadersPath, 'src/include');
    assert.deepEqual(merged.linkedFrameworks, ['CoreHaptics']);
    assert.deepEqual(merged.resources, []);
    // Mode B is discriminated on sourceRoot and sources alone, and five call sites gate the
    // whole checked-in layout on it: dropping either key emits the package with Mode A spelling.
    assert.ok(isCheckedInResolvedTarget(merged), 'The merged target must still read as Mode B');
    assert.equal(merged.sourceRoot, '/repo/packages/expo-haptics/ios');
    assert.deepEqual(merged.sources, ['src']);
    assert.deepEqual(merged.exclude, ['src/Tests']);
    assert.equal(merged.productMember, true);
  });

  it('leaves a key the manifest does not own to the resolved target', () => {
    const merged = applyCheckedInTarget(
      resolvedTarget(),
      checkedInTarget({ includeDirectories: ['src/include'] })
    );
    // Whatever the manifest reader grows next must not silently replace what the config
    // resolved: only the listed keys cross over, everything else stays where it was computed.
    assert.ok(
      !('includeDirectories' in merged),
      `A key outside the merged set must not cross over: ${JSON.stringify(merged)}`
    );
  });

  it('keeps the dependencies and compiler settings the config resolved', () => {
    const merged = applyCheckedInTarget(resolvedTarget(), checkedInTarget());
    assert.deepEqual(merged.dependencies, ['ExpoModulesCore']);
    assert.deepEqual(merged.cSettings, ['-I/repo/packages/expo-haptics/ios']);
    assert.deepEqual(merged.cxxSettings, ['-std=c++20']);
    assert.deepEqual(merged.swiftSettings, ['-DEXPO_CONFIGURATION_DEBUG']);
    assert.deepEqual(merged.linkerSettings, ['-ObjC']);
  });

  it('clears a resolved public headers path the manifest leaves undefined', () => {
    const merged = applyCheckedInTarget(
      resolvedTarget({ publicHeadersPath: 'ios/include' }),
      checkedInTarget({ publicHeadersPath: undefined })
    );
    // A Swift target, and any target opting out with publicHeaders: false, carries the key
    // present and undefined; keeping the config's path there would export headers Mode B does not.
    assert.ok('publicHeadersPath' in merged, 'The manifest owns the key even when it has no value');
    assert.equal(merged.publicHeadersPath, undefined);
  });
});

describe('resolveCompilerFlags', () => {
  /** Asserts the thrown diagnostic names the target and points at the offending key or value. */
  function expectRejection(flags: unknown, offender: RegExp, buildType: BuildFlavor = 'Debug') {
    assert.throws(
      () => resolveCompilerFlags(flags, buildType, 'FixtureSqlite'),
      (error: Error) => {
        assert.ok(!(error instanceof TypeError), `Expected a diagnostic, got ${error.stack}`);
        assert.match(error.message, /target "FixtureSqlite"/);
        assert.match(error.message, offender);
        return true;
      }
    );
  }

  it('applies a bare array to both C and C++', () => {
    assert.deepEqual(resolveCompilerFlags(['-DFOO=1'], 'Debug', 'FixtureSqlite'), {
      c: ['-DFOO=1'],
      cxx: ['-DFOO=1'],
    });
  });

  it('applies common flags to both build flavors', () => {
    const flags = { common: ['-DSQLITE_ENABLE_SESSION'] };
    assert.deepEqual(resolveCompilerFlags(flags, 'Debug', 'FixtureSqlite'), {
      c: ['-DSQLITE_ENABLE_SESSION'],
      cxx: ['-DSQLITE_ENABLE_SESSION'],
    });
    assert.deepEqual(resolveCompilerFlags(flags, 'Release', 'FixtureSqlite'), {
      c: ['-DSQLITE_ENABLE_SESSION'],
      cxx: ['-DSQLITE_ENABLE_SESSION'],
    });
  });

  it('applies debug flags only to a Debug build', () => {
    const flags = { common: ['-DCOMMON'], debug: ['-DDEBUG_ONLY'] };
    assert.deepEqual(resolveCompilerFlags(flags, 'Debug', 'FixtureSqlite'), {
      c: ['-DCOMMON', '-DDEBUG_ONLY'],
      cxx: ['-DCOMMON', '-DDEBUG_ONLY'],
    });
    assert.deepEqual(resolveCompilerFlags(flags, 'Release', 'FixtureSqlite'), {
      c: ['-DCOMMON'],
      cxx: ['-DCOMMON'],
    });
  });

  it('applies release flags only to a Release build', () => {
    const flags = { common: ['-DCOMMON'], release: ['-DRELEASE_ONLY'] };
    assert.deepEqual(resolveCompilerFlags(flags, 'Release', 'FixtureSqlite'), {
      c: ['-DCOMMON', '-DRELEASE_ONLY'],
      cxx: ['-DCOMMON', '-DRELEASE_ONLY'],
    });
    assert.deepEqual(resolveCompilerFlags(flags, 'Debug', 'FixtureSqlite'), {
      c: ['-DCOMMON'],
      cxx: ['-DCOMMON'],
    });
  });

  it('splits a per-language variant between C and C++', () => {
    const flags = { common: { c: ['-DC_ONLY'] }, debug: { cxx: ['-std=c++20'] } };
    assert.deepEqual(resolveCompilerFlags(flags, 'Debug', 'FixtureSqlite'), {
      c: ['-DC_ONLY'],
      cxx: ['-std=c++20'],
    });
  });

  it('accepts an empty object as no flags', () => {
    assert.deepEqual(resolveCompilerFlags({}, 'Debug', 'FixtureSqlite'), { c: [], cxx: [] });
  });

  it('accepts an object whose only variant does not apply to this build', () => {
    assert.deepEqual(
      resolveCompilerFlags({ debug: ['-DDEBUG_ONLY'] }, 'Release', 'FixtureSqlite'),
      {
        c: [],
        cxx: [],
      }
    );
  });

  it('rejects the per-language shape written at the top level', () => {
    expectRejection({ c: ['-DFOO'] }, /"c"/);
  });

  it('rejects a misspelled build variant', () => {
    expectRejection({ debugg: ['-DFOO'] }, /"debugg"/);
  });

  it('rejects an unknown key inside a variant', () => {
    expectRejection({ common: { swift: ['-DFOO'] } }, /"swift"/);
  });

  it('rejects a string where a list of flags belongs', () => {
    expectRejection({ common: '-DFOO' }, /"-DFOO"/);
  });

  it('rejects a non-string item in a flag list', () => {
    expectRejection({ common: [1] }, /contains 1, which is not a flag string/);
  });

  it('rejects a malformed variant that this build would not apply', () => {
    // A Release-only mistake must not wait for a Release build to surface.
    expectRejection({ release: { swift: ['-DFOO'] } }, /"swift"/, 'Debug');
  });

  it('spells out the accepted shapes so the config can be fixed from the message alone', () => {
    assert.throws(
      () => resolveCompilerFlags({ debugg: ['-DFOO'] }, 'Debug', 'FixtureSqlite'),
      (error: Error) => {
        assert.match(error.message, /"compilerFlags": \["-DFOO=1"\]/);
        assert.match(error.message, /"common"/);
        assert.match(error.message, /"debug"/);
        assert.match(error.message, /"release"/);
        assert.match(error.message, /"c": \[\.\.\.\], "cxx": \[\.\.\.\]/);
        assert.match(error.message, /spm\.config\.json/);
        return true;
      }
    );
  });
});

describe('malformed compilerFlags reaching the resolver from its call sites', () => {
  // JSON can hold a falsy malformed value, and a truthiness guard skips validation for every one
  // of them — the same silent drop the validation exists to stop, moved up one frame.
  const falsyMalformed = [null, '', 0, false];

  for (const value of falsyMalformed) {
    const label = JSON.stringify(value) ?? String(value);

    it(`rejects ${label} on a Swift target`, () => {
      assert.throws(
        () =>
          buildSwiftSettings(['ExpoModulesCore'], null, '/tmp/pkg', 'Debug', {
            type: 'swift',
            name: 'FixtureSwift',
            path: 'ios',
            compilerFlags: value,
          } as unknown as SwiftTarget),
        /Cannot read "compilerFlags" for target "FixtureSwift"/
      );
    });

    it(`rejects ${label} on an ObjC target`, () => {
      assert.throws(
        () =>
          buildCSettings(
            {
              type: 'objc',
              name: 'FixtureObjC',
              path: 'ios',
              compilerFlags: value,
            } as unknown as ObjcTarget,
            [],
            null,
            '/repo/packages/precompile/.build/fixture/spm',
            'Fixture',
            '1.0.0',
            '/repo/packages/fixture',
            '/repo/packages/precompile/.build/fixture',
            'Debug'
          ),
        /Cannot read "compilerFlags" for target "FixtureObjC"/
      );
    });
  }
});

describe('buildLinkerSettings', () => {
  it('returns undefined when there are no frameworks and no flags', () => {
    assert.equal(buildLinkerSettings([], undefined, 'FixtureLinker'), undefined);
    assert.equal(buildLinkerSettings([], [], 'FixtureLinker'), undefined);
  });

  it('emits linked frameworks before the unsafe linker flags', () => {
    assert.deepEqual(buildLinkerSettings(['Foundation'], ['-lz', '-all_load'], 'FixtureLinker'), [
      '.linkedFramework("Foundation")',
      '.unsafeFlags(["-lz", "-all_load"])',
    ]);
  });

  it('escapes quotes and backslashes in a linker flag', () => {
    assert.deepEqual(buildLinkerSettings([], ['-Wl,-foo="a\\b"'], 'FixtureLinker'), [
      '.unsafeFlags(["-Wl,-foo=\\"a\\\\b\\""])',
    ]);
  });

  const malformed: [string, unknown, RegExp][] = [
    ['an object', { common: ['-lz'] }, /\{"common":\["-lz"\]\}/],
    ['a bare string', '-lz', /"-lz"/],
    ['a non-string entry', [1], /contains 1/],
    ['null', null, /is null/],
    ['an empty string', '', /is ""/],
    ['zero', 0, /is 0/],
    ['false', false, /is false/],
  ];

  for (const [description, value, offender] of malformed) {
    it(`rejects ${description} with a diagnostic naming the target`, () => {
      assert.throws(
        () => buildLinkerSettings([], value, 'FixtureLinker'),
        (error: Error) => {
          assert.ok(!(error instanceof TypeError), `Expected a diagnostic, got ${error.stack}`);
          assert.match(error.message, /Cannot read "linkerFlags" for target "FixtureLinker"/);
          assert.match(error.message, offender);
          return true;
        }
      );
    });
  }
});
