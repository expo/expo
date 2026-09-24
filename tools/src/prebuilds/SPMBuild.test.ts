/**
 * Tests for SPMBuild helper functions:
 *  - derivePackageName
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
  derivePackageName,
  formatVersionRequirement,
  findFirstExisting,
  findXCFrameworkInDir,
  getBuildPlatformsFromProductPlatform,
  warnUnreconciledConfigTargets,
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
// derivePackageName
// ---------------------------------------------------------------------------

describe('derivePackageName', () => {
  it('strips .git suffix and extracts last path segment', () => {
    assert.equal(
      derivePackageName('https://github.com/SDWebImage/SDWebImageWebPCoder.git'),
      'SDWebImageWebPCoder'
    );
  });

  it('works without .git suffix', () => {
    assert.equal(derivePackageName('https://github.com/airbnb/lottie-spm'), 'lottie-spm');
  });

  it('handles scoped / deeply nested URLs', () => {
    assert.equal(
      derivePackageName('https://github.com/nicklockwood/libavif-Xcode.git'),
      'libavif-Xcode'
    );
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
// buildXcodeBuildArgs / warnUnreconciledConfigTargets
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

describe('warnUnreconciledConfigTargets', () => {
  it('reports a config target the checked-in manifest does not declare', () => {
    const warnings = captureWarnings(() => {
      warnUnreconciledConfigTargets(
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'objc', name: 'ExpoHapticsObjC' },
        ]),
        checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
      );
    });
    // Nothing else reconciles the two name sets, so an unmatched name would otherwise be a
    // silently inert entry: either a typo hiding sources, or dead configuration.
    assert.equal(warnings.length, 1, `The unmatched target must be reported: ${warnings.join()}`);
    const warning = warnings[0];
    assert.ok(
      warning.includes('ExpoHaptics/ExpoHapticsObjC'),
      `Name the product and the target: ${warning}`
    );
    assert.ok(
      warning.includes('Package.swift'),
      `Name the manifest that decides the targets: ${warning}`
    );
    assert.ok(
      warning.includes('/repo/packages/expo-haptics'),
      `Name the manifest root: ${warning}`
    );
  });

  it('reports an unmatched config target that still declares a path', () => {
    const warnings = captureWarnings(() => {
      warnUnreconciledConfigTargets(
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'objc', name: 'ExpoHapticsObjC', path: 'ios/objc' },
        ]),
        checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
      );
    });
    assert.equal(
      warnings.length,
      1,
      `A leftover path does not reconcile a name: ${warnings.join()}`
    );
  });

  it('stays silent when every config target is declared', () => {
    const warnings = captureWarnings(() => {
      warnUnreconciledConfigTargets(
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'framework', name: 'Prebuilt', path: 'ios/Prebuilt.xcframework' },
        ]),
        checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
      );
    });
    // A framework target is a prebuilt binary, not a manifest target: it is never declared there.
    assert.deepEqual(warnings, []);
  });
});

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
      { name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' },
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

  it('maps a target whose layout comes from a checked-in Package.swift', () => {
    const args = buildXcodeBuildArgs(
      pkg,
      productWithTargets([{ type: 'swift', name: 'ExpoHaptics' }]),
      'Debug',
      'iOS',
      checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
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
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/=' +
        `/expo-src/generated/expo-haptics/ExpoHaptics/ExpoHaptics/ -fdebug-prefix-map=${mapping}`
    );
    assert.ok(
      settingValue(args, 'OTHER_SWIFT_FLAGS').includes(`-debug-prefix-map ${mapping}`),
      `Swift sources need the map too: ${settingValue(args, 'OTHER_SWIFT_FLAGS')}`
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
      checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
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
      checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics' }])
    );
    // An empty source directory must not leave a doubled separator behind: no recorded path
    // ever spells `…/expo-haptics//`, so such a map matches nothing.
    assert.equal(
      settingValue(args, 'OTHER_CFLAGS'),
      '$(inherited) -fdebug-prefix-map=/repo=/expo-src -fdebug-prefix-map=' +
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
      checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/..shared' }])
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
            { name: 'ExpoHapticsShared', sourceRoot: '/repo/packages/expo-haptics-shared/ios' },
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

  it('skips a config target the checked-in manifest does not declare', () => {
    let args: string[] = [];
    const warnings = captureWarnings(() => {
      args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'objc', name: 'ExpoHapticsObjC' },
        ]),
        'Debug',
        'iOS',
        checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
      );
    });
    // warnUnreconciledConfigTargets reports the mismatch once for the whole product; repeating
    // it here would print the same paragraph again for every platform and flavor.
    assert.deepEqual(warnings, [], 'The mismatch is reported once per product, not per platform');
    assert.equal(
      settingValue(args, 'OTHER_CFLAGS'),
      '$(inherited) -fdebug-prefix-map=/repo=/expo-src -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/=' +
        '/expo-src/generated/expo-haptics/ExpoHaptics/ExpoHaptics/ -fdebug-prefix-map=' +
        '/repo/packages/precompile/.build/expo-haptics/generated/ExpoHaptics/ExpoHaptics/src/=' +
        '/expo-src/packages/expo-haptics/ios/'
    );
  });

  it('skips an unmatched config target that still declares a path', () => {
    let args: string[] = [];
    const warnings = captureWarnings(() => {
      args = buildXcodeBuildArgs(
        pkg,
        productWithTargets([
          { type: 'swift', name: 'ExpoHaptics' },
          { type: 'objc', name: 'ExpoHapticsObjC', path: 'ios/objc' },
        ]),
        'Debug',
        'iOS',
        checkedIn([{ name: 'ExpoHaptics', sourceRoot: '/repo/packages/expo-haptics/ios' }])
      );
    });
    assert.deepEqual(warnings, [], 'The mismatch is reported once per product, not per platform');
    // The manifest alone decides the targets, so no staging directory is ever generated for
    // this one: a map built from its config path would rewrite nothing.
    assert.ok(
      !settingValue(args, 'OTHER_CFLAGS').includes('ExpoHapticsObjC'),
      `A target the manifest does not declare must not be mapped: ${settingValue(
        args,
        'OTHER_CFLAGS'
      )}`
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
