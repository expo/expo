/**
 * Tests for SPMBuild helper functions:
 *  - formatVersionRequirement
 *  - findFirstExisting
 *  - findXCFrameworkInDir
 *  - getBuildPlatformsFromProductPlatform
 *  - buildXcodeBuildArgs
 */
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import os from 'os';
import path from 'path';
import stripAnsi from 'strip-ansi';

import type { SPMPackageSource } from './ExternalPackage';
import {
  type CheckedInLayout,
  type CheckedInTargetLayout,
  buildXcodeBuildArgs,
  formatVersionRequirement,
  findFirstExisting,
  findXCFrameworkInDir,
  getBuildPlatformsFromProductPlatform,
} from './SPMBuild';
import type { SPMProduct, SPMTarget } from './SPMConfig.types';

// ---------------------------------------------------------------------------
// getBuildPlatformsFromProductPlatform
// ---------------------------------------------------------------------------

describe('getBuildPlatformsFromProductPlatform', () => {
  it('expands iOS 16.4 to device and simulator build platforms', () => {
    assert.deepEqual(getBuildPlatformsFromProductPlatform('iOS("16.4")'), ['iOS', 'iOS Simulator']);
  });
});

// ---------------------------------------------------------------------------
// formatVersionRequirement
// ---------------------------------------------------------------------------

describe('formatVersionRequirement', () => {
  it('formats exact version', () => {
    assert.equal(formatVersionRequirement({ exact: '5.21.6' }), 'exact: "5.21.6"');
  });

  it('formats from version', () => {
    assert.equal(formatVersionRequirement({ from: '1.0.0' }), 'from: "1.0.0"');
  });

  it('formats branch version', () => {
    assert.equal(formatVersionRequirement({ branch: 'main' }), 'branch: "main"');
  });

  it('formats revision version', () => {
    assert.equal(formatVersionRequirement({ revision: 'abc123' }), 'revision: "abc123"');
  });

  it('throws for invalid version', () => {
    assert.throws(() => formatVersionRequirement({} as any), /Invalid SPM version/);
  });
});

// ---------------------------------------------------------------------------
// findFirstExisting  (uses real temp files)
// ---------------------------------------------------------------------------

describe('findFirstExisting', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-test-'));
    await fs.writeFile(path.join(tmpDir, 'a.txt'), '');
    await fs.writeFile(path.join(tmpDir, 'b.txt'), '');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns the first existing path', async () => {
    const result = await findFirstExisting([
      path.join(tmpDir, 'missing.txt'),
      path.join(tmpDir, 'a.txt'),
      path.join(tmpDir, 'b.txt'),
    ]);
    assert.equal(result, path.join(tmpDir, 'a.txt'));
  });

  it('returns null when none exist', async () => {
    const result = await findFirstExisting([
      path.join(tmpDir, 'x.txt'),
      path.join(tmpDir, 'y.txt'),
    ]);
    assert.equal(result, null);
  });

  it('returns null for empty array', async () => {
    assert.equal(await findFirstExisting([]), null);
  });
});

// ---------------------------------------------------------------------------
// findXCFrameworkInDir  (uses real temp directories)
// ---------------------------------------------------------------------------

describe('findXCFrameworkInDir', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-xcfw-test-'));
    // Simulate SPM artifacts layout:
    //   artifacts/lottie-spm/Lottie/Lottie.xcframework/Info.plist
    //   artifacts/other-pkg/Other/Other.xcframework/Info.plist
    const lottiePath = path.join(tmpDir, 'lottie-spm', 'Lottie', 'Lottie.xcframework');
    const otherPath = path.join(tmpDir, 'other-pkg', 'Other', 'Other.xcframework');
    await fs.mkdirp(lottiePath);
    await fs.writeFile(path.join(lottiePath, 'Info.plist'), '');
    await fs.mkdirp(otherPath);
    await fs.writeFile(path.join(otherPath, 'Info.plist'), '');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('finds an xcframework nested in subdirectories', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'Lottie');
    assert.equal(result, path.join(tmpDir, 'lottie-spm', 'Lottie', 'Lottie.xcframework'));
  });

  it('finds a different xcframework', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'Other');
    assert.equal(result, path.join(tmpDir, 'other-pkg', 'Other', 'Other.xcframework'));
  });

  it('returns null when xcframework does not exist', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'NonExistent');
    assert.equal(result, null);
  });

  it('returns null for empty directory', async () => {
    const emptyDir = path.join(tmpDir, '_empty');
    await fs.mkdirp(emptyDir);
    const result = await findXCFrameworkInDir(emptyDir, 'Anything');
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// buildXcodeBuildArgs
// ---------------------------------------------------------------------------

function productWithTargets(targets: SPMTarget[]): SPMProduct {
  return {
    name: 'ExpoHaptics',
    podName: 'ExpoHaptics',
    platforms: ['iOS("16.4")'],
    targets,
  };
}

/** The lines `logger.warn` wrote while `run` executed, without their colour codes. */
function captureWarnings(run: () => void): string[] {
  const lines: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };
  try {
    run();
  } finally {
    console.warn = original;
  }
  return lines.map(stripAnsi);
}

/** The layout `buildSwiftPackageAsync` resolves once: targets plus their canonical root. */
function checkedIn(
  targets: CheckedInTargetLayout[],
  root = '/repo/packages/expo-haptics'
): CheckedInLayout {
  return { root, targets };
}

describe('buildXcodeBuildArgs', () => {
  const originalRepoRoot = process.env.EXPO_ROOT_DIR;

  before(() => {
    process.env.EXPO_ROOT_DIR = '/repo';
  });

  after(() => {
    if (originalRepoRoot === undefined) delete process.env.EXPO_ROOT_DIR;
    else process.env.EXPO_ROOT_DIR = originalRepoRoot;
  });

  const pkg: SPMPackageSource = {
    path: '/repo/packages/expo-haptics',
    buildPath: '/repo/packages/precompile/.build/expo-haptics',
    packageName: 'expo-haptics',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [] }),
  };

  function settingValue(args: string[], setting: string): string {
    const entry = args.find((arg) => arg.startsWith(`${setting}=`));
    assert.ok(entry, `${setting} must be passed to xcodebuild: ${args.join(' ')}`);
    return entry.slice(setting.length + 1);
  }

  it('maps a declared target path to its canonical source path', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics', path: 'ios' }]),
      'Debug',
      'iOS'
    );
    assert.match(
      settingValue(args, 'OTHER_CFLAGS'),
      /-fdebug-prefix-map=\/repo\/packages\/precompile\/\.build\/expo-haptics\/generated\/ExpoHaptics\/ExpoHaptics\/=\/expo-src\/packages\/expo-haptics\/ios\//
    );
  });

  it('orders each compiler flag list so the per-target map wins', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics', path: 'ios' }]),
      'Debug',
      'iOS'
    );
    // swiftc applies the first matching -debug-prefix-map and clang the last, so the
    // repository-root catch-all sits at opposite ends of the two lists.
    const swiftFlags = settingValue(args, 'OTHER_SWIFT_FLAGS');
    assert.ok(
      swiftFlags.indexOf('-debug-prefix-map /repo/packages/precompile') <
        swiftFlags.indexOf('-debug-prefix-map /repo='),
      `The per-target map must lead for swiftc: ${swiftFlags}`
    );
    const cFlags = settingValue(args, 'OTHER_CFLAGS');
    assert.ok(
      cFlags.indexOf('-fdebug-prefix-map=/repo=') <
        cFlags.indexOf('-fdebug-prefix-map=/repo/packages/precompile'),
      `The per-target map must trail for clang: ${cFlags}`
    );
  });

  describe('a target generated under .build/', () => {
    const screensPkg: SPMPackageSource = {
      path: '/repo/node_modules/react-native-screens',
      buildPath: '/repo/packages/precompile/.build/react-native-screens',
      packageName: 'react-native-screens',
      packageVersion: '4.0.0',
      getSwiftPMConfiguration: () => ({ products: [] }),
    };
    const screensProduct: SPMProduct = {
      name: 'RNScreens',
      podName: 'RNScreens',
      platforms: ['iOS("16.4")'],
      targets: [
        {
          type: 'cpp',
          name: 'RNScreens_codegen_components',
          path: '.build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/rnscreens',
        },
        { type: 'swift', name: 'RNScreensSwift', path: 'ios/swift' },
      ],
    };
    const stagingDirectory =
      '/repo/packages/precompile/.build/react-native-screens/generated/RNScreens/RNScreens_codegen_components/';
    const generatedMapping = `${stagingDirectory}=/expo-src/generated/react-native-screens/RNScreens/RNScreens_codegen_components/`;

    it('maps its staging directory to a canonical generated path', () => {
      const args = buildXcodeBuildArgs(screensPkg, screensProduct, 'Debug', 'iOS');
      assert.ok(
        settingValue(args, 'OTHER_CFLAGS').includes(`-fdebug-prefix-map=${generatedMapping}`),
        `clang needs the generated map: ${settingValue(args, 'OTHER_CFLAGS')}`
      );
      assert.ok(
        settingValue(args, 'OTHER_SWIFT_FLAGS').includes(`-debug-prefix-map ${generatedMapping}`),
        `swiftc needs the generated map: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
      );
    });

    it('orders the generated map so it beats the repository-root catch-all', () => {
      const args = buildXcodeBuildArgs(screensPkg, screensProduct, 'Debug', 'iOS');
      const swiftFlags = settingValue(args, 'OTHER_SWIFT_FLAGS');
      const swiftGenerated = swiftFlags.indexOf(`-debug-prefix-map ${generatedMapping}`);
      assert.ok(
        swiftGenerated >= 0 && swiftGenerated < swiftFlags.indexOf('-debug-prefix-map /repo='),
        `The generated map must lead for swiftc: ${swiftFlags}`
      );
      const cFlags = settingValue(args, 'OTHER_CFLAGS');
      assert.ok(
        cFlags.indexOf('-fdebug-prefix-map=/repo=') <
          cFlags.indexOf(`-fdebug-prefix-map=${generatedMapping}`),
        `The generated map must trail for clang: ${cFlags}`
      );
    });
  });

  describe('a checked-in target directory', () => {
    const layout = checkedIn([
      { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios', type: 'swift' },
    ]);
    const targetDirectory =
      '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/';
    // Holds <Product>+Exports.swift, which is written beside the `src` link rather than under it.
    const generatedMapping = `${targetDirectory}=/expo-src/generated/expo-haptics/ExpoHaptics/ExpoHaptics/`;
    const sourceMapping = `${targetDirectory}src/=/expo-src/packages/expo-haptics/ios/`;

    it('maps the files generated beside the source link', () => {
      const args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
        'Debug',
        'iOS',
        layout
      );
      assert.ok(
        settingValue(args, 'OTHER_CFLAGS').includes(`-fdebug-prefix-map=${generatedMapping}`),
        `clang needs the target directory map: ${settingValue(args, 'OTHER_CFLAGS')}`
      );
      assert.ok(
        settingValue(args, 'OTHER_SWIFT_FLAGS').includes(`-debug-prefix-map ${generatedMapping}`),
        `swiftc needs the target directory map: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
      );
    });

    it('lets the source link map beat the target directory map for every compiler', () => {
      const args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
        'Debug',
        'iOS',
        layout
      );
      const swiftFlags = settingValue(args, 'OTHER_SWIFT_FLAGS');
      const swiftSource = swiftFlags.indexOf(`-debug-prefix-map ${sourceMapping}`);
      const swiftGenerated = swiftFlags.indexOf(`-debug-prefix-map ${generatedMapping}`);
      assert.ok(
        swiftSource >= 0 && swiftGenerated >= 0 && swiftSource < swiftGenerated,
        `swiftc applies the first match, so src/ must lead: ${swiftFlags}`
      );
      const xccSource = swiftFlags.indexOf(`-Xcc -fdebug-prefix-map=${sourceMapping}`);
      const xccGenerated = swiftFlags.indexOf(`-Xcc -fdebug-prefix-map=${generatedMapping}`);
      assert.ok(
        xccSource >= 0 && xccGenerated >= 0 && xccGenerated < xccSource,
        `clang applies the last match, so src/ must trail in the -Xcc list: ${swiftFlags}`
      );
      const cFlags = settingValue(args, 'OTHER_CFLAGS');
      const cSource = cFlags.indexOf(`-fdebug-prefix-map=${sourceMapping}`);
      const cGenerated = cFlags.indexOf(`-fdebug-prefix-map=${generatedMapping}`);
      assert.ok(
        cSource >= 0 && cGenerated >= 0 && cGenerated < cSource,
        `clang applies the last match, so src/ must trail: ${cFlags}`
      );
    });
  });

  describe('sources SwiftPM derives into the derived data directory', () => {
    // Such as resource_bundle_accessor.swift, which a non-WMO Debug build compiles on its own.
    const derivedDataMapping =
      '/repo/packages/precompile/.build/expo-haptics/output/debug/frameworks/ExpoHaptics/Build/Intermediates.noindex/=' +
      '/expo-src/generated/expo-haptics/ExpoHaptics/DerivedData/Build/Intermediates.noindex/';

    function assertDerivedDataMapWins(args: string[], mapping = derivedDataMapping) {
      const swiftFlags = settingValue(args, 'OTHER_SWIFT_FLAGS');
      const swiftDerived = swiftFlags.indexOf(`-debug-prefix-map ${mapping}`);
      assert.ok(
        swiftDerived >= 0 && swiftDerived < swiftFlags.indexOf('-debug-prefix-map /repo='),
        `swiftc applies the first match, so the derived data map must lead: ${swiftFlags}`
      );
      const xccDerived = swiftFlags.indexOf(`-Xcc -fdebug-prefix-map=${mapping}`);
      assert.ok(
        xccDerived >= 0 && swiftFlags.indexOf('-Xcc -fdebug-prefix-map=/repo=') < xccDerived,
        `clang applies the last match, so the derived data map must trail in -Xcc: ${swiftFlags}`
      );
      const cFlags = settingValue(args, 'OTHER_CFLAGS');
      const cDerived = cFlags.indexOf(`-fdebug-prefix-map=${mapping}`);
      assert.ok(
        cDerived >= 0 && cFlags.indexOf('-fdebug-prefix-map=/repo=') < cDerived,
        `clang applies the last match, so the derived data map must trail: ${cFlags}`
      );
    }

    it('maps them for a product built from spm.config.json', () => {
      assertDerivedDataMapWins(
        buildXcodeBuildArgs(
          pkg,
          productWithTargets([{ type: 'swift', name: 'ExpoHaptics', path: 'ios' }]),
          'Debug',
          'iOS'
        )
      );
    });

    it('maps them for a product built from a checked-in Package.swift', () => {
      assertDerivedDataMapWins(
        buildXcodeBuildArgs(
          pkg,
          productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
          'Debug',
          'iOS',
          checkedIn([
            { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios', type: 'swift' },
          ])
        )
      );
    });

    it('maps them for a package built into its own directory', () => {
      // Without its own map this path would pass for a checkout path, /expo-src/packages/….
      const localPkg: SPMPackageSource = {
        ...pkg,
        buildPath: '/repo/packages/expo-haptics/.expo-prebuild',
      };
      assertDerivedDataMapWins(
        buildXcodeBuildArgs(
          localPkg,
          productWithTargets([{ type: 'swift', name: 'ExpoHaptics', path: 'ios' }]),
          'Release',
          'iOS'
        ),
        '/repo/packages/expo-haptics/.expo-prebuild/intermediates/products/release/ExpoHaptics/Build/Intermediates.noindex/=' +
          '/expo-src/generated/expo-haptics/ExpoHaptics/DerivedData/Build/Intermediates.noindex/'
      );
    });

    it('leaves third-party package checkouts to the repository-root catch-all', () => {
      // Source-built dependencies are real sources, not generated ones: rewriting them under
      // /expo-src/generated/ would hide from the dSYM check that the consumer cannot resolve them.
      const checkoutSource =
        '/repo/packages/precompile/.build/expo-haptics/output/debug/frameworks/ExpoHaptics/' +
        'SourcePackages/checkouts/ZXingObjC/Sources/a.swift';
      const args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([{ type: 'swift', name: 'ExpoHaptics', path: 'ios' }]),
        'Debug',
        'iOS'
      );
      const flags = `${settingValue(args, 'OTHER_CFLAGS')} ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`;
      const covering = [...flags.matchAll(/-f?debug-prefix-map[= ](\S+?)=/g)]
        .map(([, from]) => from)
        .filter((from) => from !== '/repo' && checkoutSource.startsWith(from));
      assert.deepEqual(covering, [], `No map but the catch-all may cover ${checkoutSource}`);
    });
  });

  it('maps a target whose layout comes from a checked-in Package.swift', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([
        { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios', type: 'swift' },
      ])
    );
    // The compiler records the staging source link, not the directory it points at, so the
    // mapped side carries the extra `src` segment while the canonical side stays the one a
    // declared `path: "ios"` produces.
    const mapping =
      '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/=' +
      '/expo-src/packages/expo-haptics/ios/';
    assert.equal(
      settingValue(args, 'OTHER_CFLAGS'),
      '$(inherited) -fdebug-prefix-map=/repo=/expo-src -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/output/debug/frameworks/ExpoHaptics/Build/Intermediates.noindex/=' +
        '/expo-src/generated/expo-haptics/ExpoHaptics/DerivedData/Build/Intermediates.noindex/ -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/=' +
        `/expo-src/generated/expo-haptics/ExpoHaptics/ExpoHaptics/ -fdebug-prefix-map=${mapping}`
    );
    assert.ok(
      settingValue(args, 'OTHER_SWIFT_FLAGS').includes(`-debug-prefix-map ${mapping}`),
      `Swift sources need the map too: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
    );
  });

  it('maps a manifest target that spm.config.json does not list', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([
        { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios', type: 'swift' },
        { name: 'ObjC', sourceRoot: '/repo/packages/expo-haptics/objc', type: 'objc' },
      ])
    );
    const mapping =
      '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ObjC/src/=' +
      '/expo-src/packages/expo-haptics/objc/';
    assert.ok(
      settingValue(args, 'OTHER_CFLAGS').includes(`-fdebug-prefix-map=${mapping}`),
      `The manifest decides the targets, so every one it builds is mapped: ${settingValue(args, 'OTHER_CFLAGS')}`
    );
    assert.ok(
      settingValue(args, 'OTHER_SWIFT_FLAGS').includes(`-debug-prefix-map ${mapping}`),
      `Swift flags need the map too: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
    );
  });

  it('passes Swift flags when only the manifest says a target is Swift', () => {
    const manifestTargets = [
      {
        name: 'ExpoHaptics',
        sourceRoot: '/repo/packages/expo-haptics/ios',
        type: 'swift' as const,
      },
    ];
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'objc', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn(manifestTargets)
    );
    assert.ok(
      args.includes('BUILD_LIBRARY_FOR_DISTRIBUTION=YES'),
      `The manifest decides the language: ${args.join(' ')}`
    );
    assert.ok(
      settingValue(args, 'OTHER_SWIFT_FLAGS').includes(
        '-debug-prefix-map /repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/=' +
          '/expo-src/packages/expo-haptics/ios/'
      ),
      `The Swift target needs its map: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
    );
  });

  it('maps a target when the package path spells the manifest root differently', () => {
    // pkg.path is never canonicalised, the manifest root always is, so the two can name one
    // directory two ways. Comparing them lexically drops the map and silently restores the
    // defect it exists to prevent.
    const symlinkedPkg: SPMPackageSource = {
      ...pkg,
      path: '/repo/packages-link/expo-haptics',
    };
    const args = buildXcodeBuildArgs(
      symlinkedPkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([
        { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios', type: 'swift' },
      ])
    );
    assert.ok(
      settingValue(args, 'OTHER_CFLAGS').includes('=/expo-src/packages/expo-haptics/ios/'),
      `The map must survive a lexically different package path: ${settingValue(args, 'OTHER_CFLAGS')}`
    );
  });

  it('maps a source root that is the package root itself', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics', type: 'swift' }])
    );
    // An empty source directory must not leave a doubled separator behind: no recorded path
    // ever spells `…/expo-haptics//`, so such a map matches nothing.
    assert.equal(
      settingValue(args, 'OTHER_CFLAGS'),
      '$(inherited) -fdebug-prefix-map=/repo=/expo-src -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/output/debug/frameworks/ExpoHaptics/Build/Intermediates.noindex/=' +
        '/expo-src/generated/expo-haptics/ExpoHaptics/DerivedData/Build/Intermediates.noindex/ -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/=' +
        '/expo-src/generated/expo-haptics/ExpoHaptics/ExpoHaptics/ -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/=' +
        '/expo-src/packages/expo-haptics/'
    );
  });

  it('maps a source directory whose name merely starts with two dots', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([
        { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/..shared', type: 'swift' },
      ])
    );
    assert.ok(
      settingValue(args, 'OTHER_CFLAGS').includes('=/expo-src/packages/expo-haptics/..shared/'),
      `"..shared" is a directory, not a parent reference: ${settingValue(args, 'OTHER_CFLAGS')}`
    );
  });

  it('rejects a source root outside the manifest root', () => {
    // The thrown message explains why this cannot happen; the test exists so a refactor that
    // makes it happen fails here rather than silently shipping unmappable debug info.
    assert.throws(
      () =>
        buildXcodeBuildArgs(
          pkg,
          productWithTargets([{ type: 'swift', name: 'ExpoHapticsShared' }]),
          'Debug',
          'iOS',
          checkedIn([
            {
              name: 'ExpoHapticsShared',
              sourceRoot: '/repo/packages/expo-haptics-shared/ios',
              type: 'swift',
            },
          ])
        ),
      (error: Error) => {
        assert.ok(
          error.message.includes('ExpoHaptics/ExpoHapticsShared'),
          `Name the product and the target: ${error.message}`
        );
        assert.ok(
          error.message.includes('/repo/packages/expo-haptics-shared/ios'),
          `Name the source root: ${error.message}`
        );
        assert.match(
          error.message,
          /\/repo\/packages\/expo-haptics(?![\w-])/,
          `Name the manifest root: ${error.message}`
        );
        return true;
      }
    );
  });

  it('keeps mapping the targets that do declare a path', () => {
    let args: string[] = [];
    const warnings = captureWarnings(() => {
      args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'objc', name: 'ExpoHapticsObjC', path: 'ios/objc' },
        ]),
        'Debug',
        'iOS'
      );
    });
    // Without a checked-in manifest a target that declares no path is Mode A's error, and
    // SPMGenerator throws a full one for it; a warning here would only precede it with noise.
    assert.deepEqual(warnings, [], 'Mode A reports the missing path itself');
    const cFlags = settingValue(args, 'OTHER_CFLAGS');
    assert.match(
      cFlags,
      /generated\/ExpoHaptics\/ExpoHapticsObjC\/=\/expo-src\/packages\/expo-haptics\/ios\/objc\//
    );
    assert.ok(
      !cFlags.includes('generated/ExpoHaptics/ExpoHaptics/'),
      `Only the target with a path is mapped: ${cFlags}`
    );
  });
});
