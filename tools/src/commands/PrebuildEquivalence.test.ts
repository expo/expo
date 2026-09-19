import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import type { SpmPackagesCheckInput } from '../prebuilds/equivalence/SpmPackagesCheck';
import {
  type ConfigRoots,
  type EquivalenceOptions,
  type EquivalenceRuntime,
  parseFlavor,
  repoConfigRoots,
  resolveProduct,
  resolveSpmPackagesCheck,
  runPrebuildEquivalence,
  type SpmPackagesCheckPlan,
} from './PrebuildEquivalence';

/** The input a plan carries, failing the test with the reason when the check will not run. */
function checkedInput(plan: SpmPackagesCheckPlan): SpmPackagesCheckInput {
  if (!plan.checked) {
    assert.fail(`expected the dependency check to run, but: ${plan.reason}`);
  }
  return plan.input;
}

/** The two checked-in config locations, mirrored in a temporary directory. */
function emptyRoots(): ConfigRoots {
  const packagesDir = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'prebuild-equivalence-')),
    'packages'
  );
  return {
    packagesDir,
    externalPackagesDir: path.join(
      packagesDir,
      'expo-modules-autolinking',
      'external-configs',
      'ios'
    ),
  };
}

/** Writes a `packages/` tree holding one package's spm.config.json. */
function packagesDirWith(packageName: string, products: object[]): ConfigRoots {
  const roots = emptyRoots();
  fs.outputJsonSync(path.join(roots.packagesDir, packageName, 'spm.config.json'), { products });
  return roots;
}

/** Writes the third-party equivalent: a config under `external-configs/ios/`. */
function externalConfigsWith(packageName: string, products: object[]): ConfigRoots {
  const roots = emptyRoots();
  fs.outputJsonSync(path.join(roots.externalPackagesDir, packageName, 'spm.config.json'), {
    products,
  });
  return roots;
}

const SPM_PACKAGES = [
  { productName: 'SDWebImage', url: 'https://github.com/SDWebImage/SDWebImage.git' },
];

/**
 * Writes a built artifact at a prebuild output path, with one slice holding
 * `<framework>.framework/<framework>`.
 */
function artifactAt(outputPath: string, framework: string): string {
  const xcframework = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'prebuild-equivalence-artifact-')),
    outputPath
  );
  fs.outputFileSync(
    path.join(xcframework, 'ios-arm64', `${framework}.framework`, framework),
    'mach-o'
  );
  return xcframework;
}

/**
 * A generated manifest points every binary target at the flavor the build used, so its paths are
 * what ties a manifest to an artifact.
 */
function manifestAt(binaryTargetPath: string): string {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'prebuild-equivalence-manifest-')),
    'Package.swift'
  );
  fs.outputFileSync(
    file,
    [
      '// swift-tools-version: 5.9',
      'import PackageDescription',
      'let package = Package(',
      '    name: "ExpoImage",',
      '    targets: [',
      '        .binaryTarget(',
      '            name: "SDWebImage",',
      `            path: "${binaryTargetPath}"`,
      '        )',
      '    ]',
      ')',
      '',
    ].join('\n')
  );
  return file;
}

const debugManifest = () =>
  manifestAt('../../../.spm-deps/SDWebImage/debug/SDWebImage.xcframework');
const releaseManifest = () =>
  manifestAt('../../../.spm-deps/SDWebImage/release/SDWebImage.xcframework');

/** The two prebuild output paths a run compares, written under one temporary directory. */
function artifactPair(outputPath: string, framework: string): [string, string] {
  return [artifactAt(outputPath, framework), artifactAt(outputPath, framework)];
}

const IMAGE_DEBUG = '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework';

function options(overrides: Partial<EquivalenceOptions> = {}): EquivalenceOptions {
  return {
    labelA: 'A',
    labelB: 'B',
    allowMissingBuildLog: false,
    skipSpmPackagesCheck: false,
    ...overrides,
  };
}

/** Records what the command reached for, in order, so a test can pin what ran before what. */
function runtimeSpy(roots: ConfigRoots, equivalent = true) {
  const calls: string[] = [];
  const logs: string[] = [];
  const runtime: EquivalenceRuntime = {
    compare: (pathA, pathB, compareOptions) => {
      calls.push('compare');
      return {
        equivalent,
        pathA,
        pathB,
        labelA: compareOptions?.labelA ?? 'A',
        labelB: compareOptions?.labelB ?? 'B',
        differences: [],
      };
    },
    configRoots: () => roots,
    log: (message) => {
      calls.push('log');
      logs.push(message);
    },
  };
  return { runtime, calls, logs };
}

describe('runPrebuildEquivalence — agreement is a precondition of the whole run (round 6a item 1)', () => {
  it('checks the artifacts are the same build even with --skip-spm-packages-check', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, calls } = runtimeSpy(roots);
    const a = artifactAt(IMAGE_DEBUG, 'ExpoImage');
    const b = artifactAt(
      '.build/expo-video/output/debug/xcframeworks/ExpoVideo.xcframework',
      'ExpoVideo'
    );

    assert.throws(
      () => runPrebuildEquivalence(a, b, options({ skipSpmPackagesCheck: true }), runtime),
      { message: /expo-image[\s\S]*expo-video/ }
    );
    assert.deepEqual(calls, []);
  });

  it('refuses a mismatched pair before printing a verdict', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, calls } = runtimeSpy(roots);
    const a = artifactAt(IMAGE_DEBUG, 'ExpoImage');
    const b = artifactAt(
      '.build/expo-image/output/release/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.throws(
      () => runPrebuildEquivalence(a, b, options({ manifest: debugManifest() }), runtime),
      {
        message: /Debug[\s\S]*Release/,
      }
    );
    assert.deepEqual(calls, []);
  });

  it('refuses an override that contradicts the artifacts before printing a verdict', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, calls } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(
      () =>
        runPrebuildEquivalence(
          a,
          b,
          options({ flavor: 'Release', manifest: releaseManifest() }),
          runtime
        ),
      { message: /-f[\s\S]*Release[\s\S]*Debug/ }
    );
    assert.deepEqual(calls, []);
  });

  it('prints the verdict and then the dependency verdicts, and exits 0 on agreement', () => {
    const roots = packagesDirWith('expo-application', [{ name: 'ExpoApplication' }]);
    const { runtime, calls, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(
      '.build/expo-application/output/debug/xcframeworks/EXApplication.xcframework',
      'EXApplication'
    );

    assert.equal(runPrebuildEquivalence(a, b, options(), runtime), 0);
    assert.equal(
      logs[0].split('\n')[0],
      'Passed — artifacts equivalent; SPM dependency check did not run.'
    );
    assert.deepEqual(calls, ['compare', 'log', 'log']);
    assert.match(logs[1], /ExpoApplication declares no spmPackages/);
  });

  it('still skips the dependency check itself when --skip-spm-packages-check is passed', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, calls } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.equal(
      runPrebuildEquivalence(a, b, options({ skipSpmPackagesCheck: true }), runtime),
      0,
      'the product declares spmPackages and no --manifest was passed, so only the skip flag can ' +
        'make this run exit 0'
    );
    assert.deepEqual(calls, ['compare', 'log', 'log']);
  });

  it('exits 1 when the two artifacts are not equivalent', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, logs } = runtimeSpy(roots, false);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.equal(runPrebuildEquivalence(a, b, options({ skipSpmPackagesCheck: true }), runtime), 1);
    assert.equal(
      logs[0].split('\n')[0],
      'Failed — artifacts not equivalent; SPM dependency check did not run.'
    );
  });
});

describe('runPrebuildEquivalence — every refusal comes before the verdict (round 6b item 7)', () => {
  it('refuses a manifest that describes another build without printing a verdict first', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, calls, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(
      () => runPrebuildEquivalence(a, b, options({ manifest: releaseManifest() }), runtime),
      { message: /release[\s\S]*Debug|Debug[\s\S]*release/ }
    );
    assert.deepEqual(calls, []);
    assert.deepEqual(logs, []);
  });

  it('refuses a --product that would switch off the dependency check without printing one', () => {
    const roots = packagesDirWith('expo-camera', [
      { name: 'ExpoCamera' },
      { name: 'ExpoCameraBarcodeScanning', spmPackages: SPM_PACKAGES },
    ]);
    const { runtime, calls } = runtimeSpy(roots);
    const [a, b] = artifactPair(
      '.build/expo-camera/output/debug/xcframeworks/EXCamera.xcframework',
      'EXCamera'
    );

    assert.throws(() => runPrebuildEquivalence(a, b, options({ product: 'ExpoCamera' }), runtime), {
      message: /--skip-spm-packages-check/,
    });
    assert.deepEqual(calls, []);
  });

  it('says the dependency check did not run when --skip-spm-packages-check turned it off', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.equal(runPrebuildEquivalence(a, b, options({ skipSpmPackagesCheck: true }), runtime), 0);
    assert.match(logs[1], /--skip-spm-packages-check/);
  });
});

describe('the report always says whether the dependency check ran (round 6b item 3)', () => {
  const CAMERA = '.build/expo-camera/output/debug/xcframeworks';
  const mixedPackage = () =>
    packagesDirWith('expo-camera', [
      { name: 'ExpoCamera' },
      { name: 'ExpoCameraBarcodeScanning', spmPackages: SPM_PACKAGES },
    ]);

  it('refuses --product when it alone switches the check off on a package with dependencies', () => {
    const { runtime } = runtimeSpy(mixedPackage());
    const [a, b] = artifactPair(`${CAMERA}/EXCamera.xcframework`, 'EXCamera');

    assert.throws(() => runPrebuildEquivalence(a, b, options({ product: 'ExpoCamera' }), runtime), {
      message:
        /-n\/--product[\s\S]*ExpoCamera[\s\S]*EXCamera[\s\S]*ExpoCameraBarcodeScanning[\s\S]*--skip-spm-packages-check/,
    });
  });

  it('does not refuse when --product was never passed', () => {
    const { runtime } = runtimeSpy(mixedPackage());
    const [a, b] = artifactPair(`${CAMERA}/EXCamera.xcframework`, 'EXCamera');

    assert.throws(() => runPrebuildEquivalence(a, b, options(), runtime), {
      message: /Could not tell which product of expo-camera to check/,
    });
  });

  it('does not refuse when the selected product declares spmPackages of its own', () => {
    const [a, b] = artifactPair(`${CAMERA}/EXCamera.xcframework`, 'EXCamera');

    assert.doesNotThrow(() =>
      resolveSpmPackagesCheck(
        { product: 'ExpoCameraBarcodeScanning', manifest: debugManifest() },
        a,
        b,
        mixedPackage()
      )
    );
  });

  it('does not refuse when the artifact is named after the selected product', () => {
    const { runtime, logs } = runtimeSpy(mixedPackage());
    const [a, b] = artifactPair(`${CAMERA}/ExpoCamera.xcframework`, 'ExpoCamera');

    assert.equal(runPrebuildEquivalence(a, b, options({ product: 'ExpoCamera' }), runtime), 0);
    assert.match(logs[1], /ExpoCamera declares no spmPackages[\s\S]*did not run/);
  });

  it('does not refuse when no sibling product declares spmPackages either', () => {
    const roots = packagesDirWith('expo-camera', [
      { name: 'ExpoCamera' },
      { name: 'ExpoCameraBarcodeScanning' },
    ]);
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(`${CAMERA}/EXCamera.xcframework`, 'EXCamera');

    assert.equal(runPrebuildEquivalence(a, b, options({ product: 'ExpoCamera' }), runtime), 0);
    assert.match(logs[1], /ExpoCamera declares no spmPackages[\s\S]*did not run/);
    assert.doesNotMatch(logs[1], /ExpoCameraBarcodeScanning/);
  });

  it('names the siblings that do declare spmPackages when the check did not run', () => {
    const { runtime, logs } = runtimeSpy(mixedPackage());
    const [a, b] = artifactPair(`${CAMERA}/ExpoCamera.xcframework`, 'ExpoCamera');

    assert.equal(runPrebuildEquivalence(a, b, options({ product: 'ExpoCamera' }), runtime), 0);
    assert.match(logs[1], /ExpoCameraBarcodeScanning/);
  });

  it('says the check did not run for a package that legitimately has no dependencies', () => {
    const { runtime, logs } = runtimeSpy(
      packagesDirWith('expo-application', [{ name: 'ExpoApplication' }])
    );
    const [a, b] = artifactPair(
      '.build/expo-application/output/debug/xcframeworks/EXApplication.xcframework',
      'EXApplication'
    );

    assert.equal(runPrebuildEquivalence(a, b, options(), runtime), 0);
    assert.match(logs[1], /ExpoApplication declares no spmPackages[\s\S]*did not run/);
    assert.match(logs[1], /spm\.config\.json/);
  });
});

describe('resolveProduct', () => {
  it('throws when the package has no spm.config.json, rather than skipping the check (C1)', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage' }]);

    assert.throws(() => resolveProduct(roots, 'expo-imagee', {}), {
      message: /expo-imagee[\s\S]*spm\.config\.json/,
    });
  });

  it('falls back to the sole declared product when the artifact is named differently (C2)', () => {
    const roots = packagesDirWith('expo-application', [
      { name: 'ExpoApplication', spmPackages: [] },
    ]);

    assert.deepEqual(
      resolveProduct(roots, 'expo-application', { artifactName: 'EXApplication' }).product,
      { name: 'ExpoApplication', spmPackages: [] }
    );
  });

  it('matches the artifact name when several products are declared', () => {
    const roots = packagesDirWith('expo-av', [{ name: 'ExpoAV' }, { name: 'ExpoAudio' }]);

    assert.deepEqual(resolveProduct(roots, 'expo-av', { artifactName: 'ExpoAudio' }).product, {
      name: 'ExpoAudio',
    });
  });

  it('says which names disagree when several are declared and none matches (C2)', () => {
    const roots = packagesDirWith('expo-av', [{ name: 'ExpoAV' }, { name: 'ExpoAudio' }]);

    assert.throws(() => resolveProduct(roots, 'expo-av', { artifactName: 'EXAV' }), {
      message: /EXAV[\s\S]*ExpoAV, ExpoAudio/,
    });
  });

  it('refuses --product naming another product when the artifact is itself a declared one', () => {
    const roots = packagesDirWith('expo-av', [{ name: 'ExpoAV' }, { name: 'ExpoAudio' }]);

    assert.throws(
      () => resolveProduct(roots, 'expo-av', { requested: 'ExpoAV', artifactName: 'ExpoAudio' }),
      { message: /ExpoAV[\s\S]*ExpoAudio/ }
    );
  });

  it('accepts --product when the artifact carries the framework name instead (C2)', () => {
    const roots = packagesDirWith('expo-application', [{ name: 'ExpoApplication' }]);

    assert.deepEqual(
      resolveProduct(roots, 'expo-application', {
        requested: 'ExpoApplication',
        artifactName: 'EXApplication',
      }).product,
      { name: 'ExpoApplication' }
    );
  });

  it('throws when --product names a product the config does not declare', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage' }]);

    assert.throws(() => resolveProduct(roots, 'expo-image', { requested: 'ExpoImages' }), {
      message: /ExpoImages[\s\S]*ExpoImage/,
    });
  });
});

describe('parseFlavor', () => {
  it('accepts the two build flavors, however they are cased', () => {
    assert.equal(parseFlavor('Debug'), 'Debug');
    assert.equal(parseFlavor('release'), 'Release');
  });

  it('rejects anything else, rather than looking for a .spm-deps/foo directory (C4)', () => {
    assert.throws(() => parseFlavor('Foo'), { message: /Foo[\s\S]*Debug or Release/ });
  });
});

describe('resolveProduct — third-party packages (B1 of review)', () => {
  it('reads the config of a package that has no directory under packages/', () => {
    const roots = externalConfigsWith('react-native-screens', [{ name: 'RNScreens' }]);

    assert.deepEqual(resolveProduct(roots, 'react-native-screens', {}).product, {
      name: 'RNScreens',
    });
  });

  it('reads the config of a scoped package, whose name spans two path segments', () => {
    const roots = externalConfigsWith('@shopify/react-native-skia', [{ name: 'RNSkia' }]);

    assert.deepEqual(resolveProduct(roots, '@shopify/react-native-skia', {}).product, {
      name: 'RNSkia',
    });
  });

  it('names both places it looked when neither holds a config', () => {
    const roots = externalConfigsWith('react-native-screens', [{ name: 'RNScreens' }]);

    assert.throws(() => resolveProduct(roots, 'react-native-screenss', {}), {
      message: new RegExp(
        `${roots.packagesDir}/react-native-screenss[\\s\\S]*` +
          `${roots.externalPackagesDir}/react-native-screenss`
      ),
    });
  });

  it('resolves the third-party configs this repo checks in', () => {
    assert.equal(
      resolveProduct(repoConfigRoots(), 'react-native-screens', {}).product.name,
      'RNScreens'
    );
    assert.equal(
      resolveProduct(repoConfigRoots(), '@shopify/react-native-skia', {}).product.name,
      'RNSkia'
    );
  });
});

describe('resolveSpmPackagesCheck', () => {
  it('runs on the versioned output path of a third-party package (B1 of review)', () => {
    const roots = externalConfigsWith('react-native-screens', [
      { name: 'RNScreens', spmPackages: SPM_PACKAGES },
    ]);
    const output =
      '.build/react-native-screens/output/4.26.0/0.88.0-nightly-20260729/260318099.0.1/debug/xcframeworks/RNScreens.xcframework';

    const input = checkedInput(
      resolveSpmPackagesCheck(
        { manifest: debugManifest() },
        artifactAt(output, 'RNScreens'),
        artifactAt(output, 'RNScreens'),
        roots
      )
    );

    assert.equal(input.product, 'RNScreens');
    assert.equal(input.flavor, 'Debug');
  });

  it('runs on the output path of a scoped third-party package (B1 of review)', () => {
    const roots = externalConfigsWith('@shopify/react-native-skia', [
      { name: 'RNSkia', spmPackages: SPM_PACKAGES },
    ]);
    const output =
      '.build/@shopify/react-native-skia/output/2.5.0/0.88.0/release/xcframeworks/RNSkia.xcframework';

    const input = checkedInput(
      resolveSpmPackagesCheck(
        { manifest: releaseManifest() },
        artifactAt(output, 'RNSkia'),
        artifactAt(output, 'RNSkia'),
        roots
      )
    );

    assert.equal(input.product, 'RNSkia');
    assert.equal(input.flavor, 'Release');
  });

  it('inspects both artifacts, so the order of the two paths cannot hide a gap (B2 of review)', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const output = '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework';
    const baseline = artifactAt(output, 'ExpoImage');
    const underTest = artifactAt(output, 'ExpoImage');

    const manifest = debugManifest();

    assert.deepEqual(
      checkedInput(resolveSpmPackagesCheck({ manifest }, baseline, underTest, roots)).artifacts.map(
        (a) => a.path
      ),
      [baseline, underTest]
    );
    assert.deepEqual(
      checkedInput(resolveSpmPackagesCheck({ manifest }, underTest, baseline, roots)).artifacts.map(
        (a) => a.path
      ),
      [underTest, baseline]
    );
  });

  it('finds the slice binary of a framework named differently from the product (B3 of review)', () => {
    const roots = packagesDirWith('expo-application', [
      { name: 'ExpoApplication', spmPackages: SPM_PACKAGES },
    ]);
    const output = '.build/expo-application/output/debug/xcframeworks/EXApplication.xcframework';
    const artifact = artifactAt(output, 'EXApplication');

    const input = checkedInput(
      resolveSpmPackagesCheck({ manifest: debugManifest() }, artifact, artifact, roots)
    );

    assert.equal(input.product, 'ExpoApplication');
    assert.deepEqual(
      input.artifacts.map((a) => a.binaries),
      [
        [path.join(artifact, 'ios-arm64', 'EXApplication.framework', 'EXApplication')],
        [path.join(artifact, 'ios-arm64', 'EXApplication.framework', 'EXApplication')],
      ]
    );
  });

  it('reads the product framework, not another one vendored into the same slice', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const artifact = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );
    fs.outputFileSync(
      path.join(artifact, 'ios-arm64', 'SDWebImage.framework', 'SDWebImage'),
      'mach-o'
    );

    assert.deepEqual(
      checkedInput(
        resolveSpmPackagesCheck({ manifest: debugManifest() }, artifact, artifact, roots)
      ).artifacts[0].binaries,
      [path.join(artifact, 'ios-arm64', 'ExpoImage.framework', 'ExpoImage')]
    );
  });

  it('rejects an explicitly empty flavor rather than reading one off the path (B4 of review)', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const artifact = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.throws(() => resolveSpmPackagesCheck({ flavor: '' }, artifact, artifact, roots), {
      message: /not a build flavor/,
    });
  });
});

describe('resolveSpmPackagesCheck — the manifest must describe this build (D21)', () => {
  it('requires --manifest when the product declares spmPackages', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const artifact = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.throws(() => resolveSpmPackagesCheck({}, artifact, artifact, roots), {
      message: /overwrites it[\s\S]*--manifest/,
    });
  });

  it('asks for no manifest when the product declares no spmPackages', () => {
    const roots = packagesDirWith('expo-application', [{ name: 'ExpoApplication' }]);
    const artifact = artifactAt(
      '.build/expo-application/output/debug/xcframeworks/EXApplication.xcframework',
      'EXApplication'
    );

    assert.equal(resolveSpmPackagesCheck({}, artifact, artifact, roots).checked, false);
  });

  it("accepts a manifest whose binary targets carry this build's flavor", () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const artifact = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );
    const manifest = debugManifest();

    assert.equal(
      checkedInput(resolveSpmPackagesCheck({ manifest }, artifact, artifact, roots)).manifest.path,
      manifest
    );
  });

  it('rejects the Release manifest of a Debug artifact, naming both flavors', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const artifact = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.throws(
      () => resolveSpmPackagesCheck({ manifest: releaseManifest() }, artifact, artifact, roots),
      { message: /release[\s\S]*Debug|Debug[\s\S]*release/ }
    );
  });
});

describe('resolveSpmPackagesCheck — A and B must be the same build (review item 3)', () => {
  it('fails when the two artifacts come from different packages, naming both', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const a = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );
    const b = artifactAt(
      '.build/expo-video/output/debug/xcframeworks/ExpoVideo.xcframework',
      'ExpoVideo'
    );

    assert.throws(() => resolveSpmPackagesCheck({ manifest: debugManifest() }, a, b, roots), {
      message: /package expo-image vs expo-video/,
    });
  });

  it('fails when the two artifacts were built with different flavors, naming both', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const a = artifactAt(
      '.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );
    const b = artifactAt(
      '.build/expo-image/output/release/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.throws(() => resolveSpmPackagesCheck({ manifest: debugManifest() }, a, b, roots), {
      message: /flavor Debug vs Release/,
    });
  });

  it('fails when the two artifacts are different products of one package, naming both', () => {
    const roots = packagesDirWith('expo-av', [
      { name: 'ExpoAV', spmPackages: SPM_PACKAGES },
      { name: 'ExpoAudio', spmPackages: SPM_PACKAGES },
    ]);
    const a = artifactAt('.build/expo-av/output/debug/xcframeworks/ExpoAV.xcframework', 'ExpoAV');
    const b = artifactAt(
      '.build/expo-av/output/debug/xcframeworks/ExpoAudio.xcframework',
      'ExpoAudio'
    );

    assert.throws(() => resolveSpmPackagesCheck({ manifest: debugManifest() }, a, b, roots), {
      message: /artifact ExpoAV vs ExpoAudio/,
    });
  });

  it('refuses a copy outside the output tree, rather than reading the configuration off B', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const copy = artifactAt('copies/ExpoImage.xcframework', 'ExpoImage');
    const b = artifactAt(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(() => resolveSpmPackagesCheck({ manifest: debugManifest() }, copy, b, roots), {
      message: new RegExp(`${copy}[\\s\\S]*not a prebuild output path`),
    });
  });

  it('refuses when neither path is a prebuild output path, naming the layout it reads', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const copy = artifactAt('copies/ExpoImage.xcframework', 'ExpoImage');

    assert.throws(
      () =>
        resolveSpmPackagesCheck(
          { manifest: debugManifest(), package: 'expo-image', flavor: 'Debug' },
          copy,
          copy,
          roots
        ),
      { message: /not a prebuild output path[\s\S]*\.build\/<package>\/output/ }
    );
  });

  it('names both output layouts when it refuses a path, not only the shared build tree', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const copy = artifactAt('copies/ExpoImage.xcframework', 'ExpoImage');

    assert.throws(() => resolveSpmPackagesCheck({ manifest: debugManifest() }, copy, copy, roots), {
      message:
        /\.build\/<package>\/output\/\[<version>\/\]<flavor>\/xcframeworks\/<Product>\.xcframework[\s\S]*<package>\/\.expo-prebuild\/output\/\[<version>\/\]<flavor>\/xcframeworks\/<Product>\.xcframework/,
    });
  });

  it('accepts the package-local build directory the publish path writes', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const [a, b] = artifactPair(
      'packages/expo-image/.expo-prebuild/output/debug/xcframeworks/ExpoImage.xcframework',
      'ExpoImage'
    );

    assert.equal(
      checkedInput(resolveSpmPackagesCheck({ manifest: debugManifest() }, a, b, roots)).product,
      'ExpoImage'
    );
  });
});

describe('resolveSpmPackagesCheck — an override may not contradict the artifacts (round 6a item 2)', () => {
  const roots = () =>
    packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);

  it('refuses --flavor Release for Debug artifacts, naming both', () => {
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(
      () =>
        resolveSpmPackagesCheck({ flavor: 'Release', manifest: releaseManifest() }, a, b, roots()),
      { message: /-f[\s\S]*Release[\s\S]*Debug/ }
    );
  });

  it('refuses --package naming a package the artifacts were not built from', () => {
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(
      () =>
        resolveSpmPackagesCheck(
          { package: 'expo-video', manifest: debugManifest() },
          a,
          b,
          roots()
        ),
      { message: /--package[\s\S]*expo-video[\s\S]*expo-image/ }
    );
  });

  it('accepts overrides that agree with the artifacts', () => {
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.equal(
      checkedInput(
        resolveSpmPackagesCheck(
          { package: 'expo-image', flavor: 'debug', manifest: debugManifest() },
          a,
          b,
          roots()
        )
      ).flavor,
      'Debug'
    );
  });
});

describe('round 6c command diagnostics', () => {
  it('allows --skip-spm-packages-check with malformed config JSON', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    fs.writeFileSync(path.join(roots.packagesDir, 'expo-image/spm.config.json'), '{invalid');
    const { runtime, calls, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.equal(runPrebuildEquivalence(a, b, options({ skipSpmPackagesCheck: true }), runtime), 0);
    assert.deepEqual(calls, ['compare', 'log', 'log']);
    assert.equal(
      logs[0].split('\n')[0],
      'Passed — artifacts equivalent; SPM dependency check did not run.'
    );
    assert.match(logs[1], /^The SPM dependency check was skipped with --skip-spm-packages-check/);
    assert.doesNotMatch(logs[1], /declares .* with spmPackages/);
  });

  it('item 1: leads with failure when equivalent artifacts fail the dependency check', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');
    for (const artifact of [a, b]) {
      fs.removeSync(path.join(artifact, 'ios-arm64/ExpoImage.framework/ExpoImage'));
    }

    assert.equal(runPrebuildEquivalence(a, b, options({ manifest: debugManifest() }), runtime), 1);
    assert.equal(
      logs[0].split('\n')[0],
      'Failed — artifacts equivalent; SPM dependency check failed or incomplete.'
    );
    assert.match(logs.join('\n'), /No ExpoImage binary/);
  });

  for (const side of ['A', 'B']) {
    it(`item 7: explains a missing artifact on side ${side} before any verdict`, () => {
      const roots = packagesDirWith('expo-image', [
        { name: 'ExpoImage', spmPackages: SPM_PACKAGES },
      ]);
      const { runtime, logs } = runtimeSpy(roots);
      const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');
      const missing = side === 'A' ? a : b;
      fs.removeSync(missing);

      assert.throws(
        () => runPrebuildEquivalence(a, b, options({ manifest: debugManifest() }), runtime),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.ok(error.message.includes(`There is no xcframework at ${missing} (side ${side})`));
          assert.match(error.message, /cannot.*both[\s\S]*Build.*point/);
          return true;
        }
      );
      assert.deepEqual(logs, []);
    });
  }

  it('item 9: explains an unreadable build log with a remedy', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage', spmPackages: SPM_PACKAGES }]);
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');
    const buildLog = path.join(a, 'missing.log');

    assert.throws(
      () => runPrebuildEquivalence(a, b, options({ manifest: debugManifest(), buildLog }), runtime),
      { message: /Could not read build log[\s\S]*dependency[\s\S]*Pass --build-log/ }
    );
    assert.deepEqual(logs, []);
  });

  it('item 9: explains an unreadable config with a remedy', () => {
    const roots = packagesDirWith('expo-image', [{ name: 'ExpoImage' }]);
    fs.writeFileSync(path.join(roots.packagesDir, 'expo-image/spm.config.json'), '{invalid');
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(IMAGE_DEBUG, 'ExpoImage');

    assert.throws(() => runPrebuildEquivalence(a, b, options(), runtime), {
      message: /Could not read[\s\S]*spm\.config\.json[\s\S]*dependenc[\s\S]*Fix/,
    });
    assert.deepEqual(logs, []);
  });

  it('item 10: names sibling dependencies even when explicitly skipped', () => {
    const roots = packagesDirWith('expo-camera', [
      { name: 'ExpoCamera' },
      { name: 'ExpoCameraBarcodeScanning', spmPackages: SPM_PACKAGES },
    ]);
    const { runtime, logs } = runtimeSpy(roots);
    const [a, b] = artifactPair(
      '.build/expo-camera/output/debug/xcframeworks/EXCamera.xcframework',
      'EXCamera'
    );

    assert.equal(
      runPrebuildEquivalence(
        a,
        b,
        options({ product: 'ExpoCamera', skipSpmPackagesCheck: true }),
        runtime
      ),
      0
    );
    assert.match(logs[1], /spm\.config\.json[\s\S]*ExpoCameraBarcodeScanning[\s\S]*spmPackages/);
    assert.match(logs[1], /--skip-spm-packages-check/);
  });
});
