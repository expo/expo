import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import {
  assertManifestMatchesFlavor,
  assertSpmPackagesResolved,
  formatSpmPackageDiagnostics,
  parseOtoolLibraries,
  readSwiftManifest,
  type SpmPackageDiagnostic,
  type SpmPackagesCheckInput,
} from './SpmPackagesCheck';

const DEPENDENCY = 'SDWebImage';
const PRODUCT = 'ExpoImage';
const SIMULATOR = 'ios-arm64_x86_64-simulator';

/** Captured verbatim from `otool -arch arm64 -L` on a real ExpoImage.framework binary. */
const OTOOL_TEXT = [
  '/…/ExpoImage.xcframework/ios-arm64/ExpoImage.framework/ExpoImage:',
  '\t@rpath/ExpoImage.framework/ExpoImage (compatibility version 0.0.0, current version 0.0.0)',
  '\t/System/Library/Frameworks/Foundation.framework/Foundation (compatibility version 300.0.0, current version 5026.5.4)',
  '\t@rpath/ReactNativeDependencies.framework/ReactNativeDependencies (compatibility version 0.0.0, current version 0.0.0)',
  '\t@rpath/ExpoModulesCore.framework/ExpoModulesCore (compatibility version 0.0.0, current version 0.0.0)',
  '\t@rpath/SDWebImage.framework/SDWebImage (compatibility version 0.0.0, current version 0.0.0)',
  '\t@rpath/SDWebImageAVIFCoder.framework/SDWebImageAVIFCoder (compatibility version 0.0.0, current version 0.0.0)',
  '\t/usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 1800.107.0)',
  '',
].join('\n');

const OTOOL_WITHOUT_DEPENDENCY = OTOOL_TEXT.split('\n')
  .filter((line) => !/SDWebImage\.framework/.test(line))
  .join('\n');

/** A decoy whose install name merely starts with the dependency's (S3). */
const OTOOL_WITH_LOOKALIKE = OTOOL_WITHOUT_DEPENDENCY.replace(
  '\t/usr/lib/libc++.1.dylib',
  '\t@rpath/SDWebImage.framework/SDWebImageFake (compatibility version 0.0.0, current version 0.0.0)\n\t/usr/lib/libc++.1.dylib'
);

const DEPENDENCY_URL = 'https://github.com/SDWebImage/SDWebImage.git';

/**
 * A real `Package.swift`: the checks read it with `swift package dump-package`, so a fixture that
 * SwiftPM cannot evaluate would not be a fixture of anything.
 */
function manifestSource({
  prelude = '',
  dependencies = '',
  targets = '',
  trailer = '',
}: {
  prelude?: string;
  dependencies?: string;
  targets?: string;
  trailer?: string;
} = {}): string {
  return [
    '// swift-tools-version: 5.9',
    'import PackageDescription',
    prelude,
    'let package = Package(',
    `    name: "${PRODUCT}",`,
    `    dependencies: [${dependencies}],`,
    `    targets: [${targets}]`,
    ')',
    trailer,
    '',
  ].join('\n');
}

const BINARY_TARGET_MANIFEST = manifestSource({
  targets: [
    '',
    '        .binaryTarget(',
    `            name: "${DEPENDENCY}",`,
    `            path: "../../../.spm-deps/${DEPENDENCY}/debug/${DEPENDENCY}.xcframework"`,
    '        ),',
    '    ',
  ].join('\n'),
});

const PACKAGE_URL_MANIFEST = manifestSource({
  dependencies: `.package(url: "${DEPENDENCY_URL}", from: "5.19.0")`,
});

/** The emitter's spacing is not part of the contract: the same declaration, wrapped. (Item 4) */
const WRAPPED_PACKAGE_URL_MANIFEST = manifestSource({
  dependencies: [
    '',
    '        .package(',
    `            url: "${DEPENDENCY_URL}",`,
    '            exact: "5.21.6"',
    '        )',
    '    ',
  ].join('\n'),
});

const COMMENTED_OUT_MANIFEST = manifestSource({
  dependencies: `\n        // .package(url: "${DEPENDENCY_URL}", from: "5.19.0")\n    `,
  trailer: [
    '/*',
    `    .binaryTarget(name: "${DEPENDENCY}", path: "../${DEPENDENCY}.xcframework")`,
    '*/',
  ].join('\n'),
});

/** Swift block comments nest, so all of this is commented out. (Round 6a item 4) */
const NESTED_COMMENT_MANIFEST = manifestSource({
  trailer: [
    '/* superseded',
    '   /* was */',
    `   .package(url: "${DEPENDENCY_URL}", from: "5.19.0")`,
    '*/',
  ].join('\n'),
});

/** A comment that trails real code rather than owning its line. (Round 6a item 4) */
const TRAILING_COMMENT_MANIFEST = manifestSource({
  prelude: [
    `let note = "dropped" // .package(url: "${DEPENDENCY_URL}", from: "5.19.0")`,
    '_ = note',
  ].join('\n'),
});

/** A declaration quoted in a string literal is data, not a declaration. (Round 6a item 4) */
const RAW_STRING_MANIFEST = manifestSource({
  prelude: [
    'let template = #"""',
    `.package(url: "${DEPENDENCY_URL}", from: "5.19.0")`,
    '"""#',
    '_ = template',
  ].join('\n'),
});

const NO_DEPENDENCY_MANIFEST = manifestSource();

const SKIP_LOG = `⏭️  Skipping shared SPM dep ${DEPENDENCY} (already at shared location)\n`;
const NOT_FOUND_LOG = `⚠️  SPM dependency ${DEPENDENCY} not found in Build/Products/ or SourcePackages/artifacts/\n`;
const OTHER_DEPENDENCY_NOT_FOUND_LOG =
  '⚠️  SPM dependency SDWebImageAVIFCoder not found in Build/Products/ or SourcePackages/artifacts/\n';
/** The real pipeline colours the dependency name with chalk. */
const COLOURED_NOT_FOUND_LOG = `⚠️  SPM dependency [36m${DEPENDENCY}[39m not found in Build/Products/ or SourcePackages/artifacts/\n`;

type Overrides = {
  manifest?: string;
  preparedDependency?: boolean;
  buildLog?: string;
};

/**
 * Mirrors the real layout: the product xcframework and its tarball in `output/<flavor>/xcframeworks/`,
 * the shared dependency in `.build/.spm-deps/`, and nothing else beside the product.
 */
function makeLayout(overrides: Overrides = {}): {
  input: SpmPackagesCheckInput;
  outputDir: string;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-packages-check-'));
  const outputDir = path.join(root, '.build', 'expo-image', 'output', 'debug', 'xcframeworks');
  const xcframework = path.join(outputDir, `${PRODUCT}.xcframework`);
  const productBinaries = ['ios-arm64', SIMULATOR].map((slice) =>
    path.join(xcframework, slice, `${PRODUCT}.framework`, PRODUCT)
  );
  for (const binary of productBinaries) {
    fs.outputFileSync(binary, 'mach-o');
  }
  fs.outputFileSync(path.join(outputDir, `${PRODUCT}.tar.gz`), 'tarball');

  const sharedSpmDepsRoot = path.join(root, '.build', '.spm-deps');
  if (overrides.preparedDependency !== false) {
    fs.outputFileSync(
      path.join(sharedSpmDepsRoot, DEPENDENCY, 'debug', `${DEPENDENCY}.xcframework`, 'Info.plist'),
      '<plist/>'
    );
  }

  const manifestPath = path.join(root, 'Package.swift');
  fs.outputFileSync(manifestPath, overrides.manifest ?? BINARY_TARGET_MANIFEST);

  return {
    outputDir,
    input: {
      product: PRODUCT,
      flavor: 'Debug',
      spmPackages: [
        { productName: DEPENDENCY, url: 'https://github.com/SDWebImage/SDWebImage.git' },
      ],
      manifest: readSwiftManifest(manifestPath),
      sharedSpmDepsRoot,
      buildLog: overrides.buildLog ?? SKIP_LOG,
      artifacts: [{ path: xcframework, binaries: productBinaries }],
    },
  };
}

/** Every binary, every architecture, links the same set. */
const linkedEverywhere = (otoolText: string) => ({
  readLinkedLibraries: (binaryPath: string) =>
    new Map(
      (binaryPath.includes(SIMULATOR) ? ['x86_64', 'arm64'] : ['arm64']).map((arch) => [
        arch,
        parseOtoolLibraries(otoolText),
      ])
    ),
});

const linkedCorrectly = linkedEverywhere(OTOOL_TEXT);

function find(diagnostics: SpmPackageDiagnostic[], check: string): SpmPackageDiagnostic {
  const diagnostic = diagnostics.find((d) => d.check === check);
  assert.ok(diagnostic, `expected a ${check} diagnostic`);
  return diagnostic;
}

describe('parseOtoolLibraries', () => {
  it('reads the install names out of real otool -L output', () => {
    assert.deepEqual(parseOtoolLibraries(OTOOL_TEXT), [
      '@rpath/ExpoImage.framework/ExpoImage',
      '/System/Library/Frameworks/Foundation.framework/Foundation',
      '@rpath/ReactNativeDependencies.framework/ReactNativeDependencies',
      '@rpath/ExpoModulesCore.framework/ExpoModulesCore',
      '@rpath/SDWebImage.framework/SDWebImage',
      '@rpath/SDWebImageAVIFCoder.framework/SDWebImageAVIFCoder',
      '/usr/lib/libc++.1.dylib',
    ]);
  });
});

describe('assertSpmPackagesResolved (B5)', () => {
  it('passes the correct expo-image layout, where the dependency is NOT beside the product', () => {
    const { input, outputDir } = makeLayout();

    assert.deepEqual(fs.readdirSync(outputDir).sort(), [
      `${PRODUCT}.tar.gz`,
      `${PRODUCT}.xcframework`,
    ]);

    const diagnostics = assertSpmPackagesResolved(input, linkedCorrectly);

    assert.equal(diagnostics.length, 4);
    assert.deepEqual(
      diagnostics.filter((d) => d.status !== 'pass'),
      []
    );
  });

  it('accepts a .package(url:) declaration in place of a .binaryTarget', () => {
    const { input } = makeLayout({ manifest: PACKAGE_URL_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'pass'
    );
  });

  it('accepts a .package(url:) the emitter wrapped across lines (review item 4)', () => {
    const { input } = makeLayout({ manifest: WRAPPED_PACKAGE_URL_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'pass'
    );
  });

  it('fails when the manifest declares the dependency neither way', () => {
    const { input } = makeLayout({ manifest: NO_DEPENDENCY_MANIFEST });
    const diagnostic = find(
      assertSpmPackagesResolved(input, linkedCorrectly),
      'manifest-declaration'
    );
    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /SDWebImage/);
    assert.match(diagnostic.message, /\.package\(url:/);
    assert.match(diagnostic.message, /\.binaryTarget\(/);
  });

  it('fails when the only declaration is commented out (S2)', () => {
    const { input } = makeLayout({ manifest: COMMENTED_OUT_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'fail'
    );
  });

  it('fails when the only declaration sits inside a nested block comment (round 6a item 4)', () => {
    const { input } = makeLayout({ manifest: NESTED_COMMENT_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'fail'
    );
  });

  it('fails when the only declaration trails real code in a comment (round 6a item 4)', () => {
    const { input } = makeLayout({ manifest: TRAILING_COMMENT_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'fail'
    );
  });

  it('fails when the only declaration is quoted in a string literal (round 6a item 4)', () => {
    const { input } = makeLayout({ manifest: RAW_STRING_MANIFEST });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'fail'
    );
  });

  it('fails when a .binaryTarget names the dependency but points at another xcframework (S2)', () => {
    const { input } = makeLayout({
      manifest: BINARY_TARGET_MANIFEST.replace(`${DEPENDENCY}.xcframework`, 'Lottie.xcframework'),
    });
    const diagnostic = find(
      assertSpmPackagesResolved(input, linkedCorrectly),
      'manifest-declaration'
    );
    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /path/);
  });

  it('fails when the prepared xcframework is absent, naming the expected path', () => {
    const { input } = makeLayout({ preparedDependency: false });
    const diagnostic = find(
      assertSpmPackagesResolved(input, linkedCorrectly),
      'prepared-xcframework'
    );
    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /\.spm-deps/);
    assert.match(diagnostic.message, /SDWebImage\.xcframework/);
  });

  it('fails when the build log carries the silent "not found in Build/Products/" warning', () => {
    const { input } = makeLayout({ buildLog: NOT_FOUND_LOG });
    const diagnostic = find(assertSpmPackagesResolved(input, linkedCorrectly), 'build-log-warning');
    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /SDWebImage/);
    assert.match(diagnostic.message, /not found in Build\/Products\//);
  });

  it('sees the warning through chalk colour codes', () => {
    const { input } = makeLayout({ buildLog: COLOURED_NOT_FOUND_LOG });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'build-log-warning').status,
      'fail'
    );
  });

  it('does not blame SDWebImage for a warning about SDWebImageAVIFCoder (S4)', () => {
    const { input } = makeLayout({ buildLog: OTHER_DEPENDENCY_NOT_FOUND_LOG });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'build-log-warning').status,
      'pass'
    );
  });

  it('does not mistake the "Skipping shared SPM dep" line for the warning', () => {
    const { input } = makeLayout({ buildLog: SKIP_LOG });
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'build-log-warning').status,
      'pass'
    );
  });

  it('skips the log check, rather than passing it, when no build log is supplied', () => {
    const { input } = makeLayout({ buildLog: '' });
    const diagnostic = find(assertSpmPackagesResolved(input, linkedCorrectly), 'build-log-warning');
    assert.equal(diagnostic.status, 'skipped');
    assert.match(diagnostic.message, /build log/i);
  });

  it('fails when the product binary no longer links the dependency', () => {
    const { input } = makeLayout();
    const diagnostic = find(
      assertSpmPackagesResolved(input, linkedEverywhere(OTOOL_WITHOUT_DEPENDENCY)),
      'runtime-link'
    );
    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /@rpath\/SDWebImage\.framework\/SDWebImage/);
  });

  it('is not satisfied by an install name that merely starts with the dependency (S3)', () => {
    const { input } = makeLayout();
    assert.equal(
      find(assertSpmPackagesResolved(input, linkedEverywhere(OTOOL_WITH_LOOKALIKE)), 'runtime-link')
        .status,
      'fail'
    );
  });

  it('returns nothing for a product that declares no SPM packages', () => {
    const { input } = makeLayout();
    assert.deepEqual(assertSpmPackagesResolved({ ...input, spmPackages: [] }, linkedCorrectly), []);
  });
});

describe('assertSpmPackagesResolved — every binary and every architecture (B6 of review)', () => {
  it('fails when the dependency is linked on device but missing from the simulator slice', () => {
    const { input } = makeLayout();
    const diagnostic = find(
      assertSpmPackagesResolved(input, {
        readLinkedLibraries: (binaryPath) =>
          new Map(
            (binaryPath.includes(SIMULATOR) ? ['x86_64', 'arm64'] : ['arm64']).map((arch) => [
              arch,
              parseOtoolLibraries(
                binaryPath.includes(SIMULATOR) ? OTOOL_WITHOUT_DEPENDENCY : OTOOL_TEXT
              ),
            ])
          ),
      }),
      'runtime-link'
    );

    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, new RegExp(SIMULATOR));
  });

  it('fails when one architecture inside a fat binary is missing the dependency', () => {
    const { input } = makeLayout();
    const diagnostic = find(
      assertSpmPackagesResolved(input, {
        readLinkedLibraries: (binaryPath) =>
          new Map(
            (binaryPath.includes(SIMULATOR) ? ['x86_64', 'arm64'] : ['arm64']).map((arch) => [
              arch,
              parseOtoolLibraries(arch === 'x86_64' ? OTOOL_WITHOUT_DEPENDENCY : OTOOL_TEXT),
            ])
          ),
      }),
      'runtime-link'
    );

    assert.equal(diagnostic.status, 'fail');
    assert.match(diagnostic.message, /x86_64/);
  });
});

describe('assertSpmPackagesResolved — one verdict per artifact (B2 of review)', () => {
  /** A second artifact beside the layout's own, standing in for the build under test. */
  function withSecondArtifact(input: SpmPackagesCheckInput): {
    input: SpmPackagesCheckInput;
    underTest: string;
  } {
    const underTest = path.join(path.dirname(input.artifacts[0].path), 'under-test');
    return {
      underTest,
      input: {
        ...input,
        artifacts: [
          ...input.artifacts,
          {
            path: underTest,
            binaries: [path.join(underTest, 'ios-arm64', `${PRODUCT}.framework`, PRODUCT)],
          },
        ],
      },
    };
  }

  const runtimeLink = (diagnostics: SpmPackageDiagnostic[]) =>
    diagnostics.filter((d) => d.check === 'runtime-link');

  it('fails the artifact that dropped the dependency while the other one keeps it', () => {
    const { input, underTest } = withSecondArtifact(makeLayout().input);

    const diagnostics = runtimeLink(
      assertSpmPackagesResolved(input, {
        readLinkedLibraries: (binaryPath) =>
          new Map([
            [
              'arm64',
              parseOtoolLibraries(
                binaryPath.startsWith(underTest) ? OTOOL_WITHOUT_DEPENDENCY : OTOOL_TEXT
              ),
            ],
          ]),
      })
    );

    assert.deepEqual(
      diagnostics.map((d) => d.status),
      ['pass', 'fail']
    );
    assert.ok(diagnostics[1].message.includes(underTest), diagnostics[1].message);
  });

  it('fails the artifact holding no product binary, rather than reading the other one', () => {
    const { input, underTest } = withSecondArtifact(makeLayout().input);
    const withoutBinaries = {
      ...input,
      artifacts: [input.artifacts[0], { path: underTest, binaries: [] }],
    };

    const diagnostics = runtimeLink(assertSpmPackagesResolved(withoutBinaries, linkedCorrectly));

    assert.deepEqual(
      diagnostics.map((d) => d.status),
      ['pass', 'fail']
    );
    assert.ok(diagnostics[1].message.includes(underTest), diagnostics[1].message);
  });

  it('refuses to run on no artifacts at all, rather than reporting every dependency linked', () => {
    const { input } = makeLayout();

    assert.throws(() => assertSpmPackagesResolved({ ...input, artifacts: [] }, linkedCorrectly), {
      message: /no artifact[\s\S]*linked/i,
    });
  });

  it('names the artifact it read, not a label, when every artifact links the dependency', () => {
    const { input } = withSecondArtifact(makeLayout().input);
    const diagnostics = runtimeLink(assertSpmPackagesResolved(input, linkedCorrectly));

    assert.equal(diagnostics.length, input.artifacts.length);
    for (const diagnostic of diagnostics) {
      assert.equal(diagnostic.status, 'pass');
    }
    assert.ok(
      diagnostics.every((d, index) => d.message.includes(input.artifacts[index].path)),
      diagnostics.map((d) => d.message).join('\n')
    );
  });
});

describe('the manifest is read once, before the checks run (round 6a items 3/4)', () => {
  it('reports on the manifest it was given, not on whatever the file says later', () => {
    const { input } = makeLayout();

    fs.outputFileSync(input.manifest.path, NO_DEPENDENCY_MANIFEST);

    assert.equal(
      find(assertSpmPackagesResolved(input, linkedCorrectly), 'manifest-declaration').status,
      'pass',
      'a concurrent generator run overwrote the file; the check must not read the new one'
    );
  });
});

describe('formatSpmPackageDiagnostics', () => {
  it('prints one line per check and leads with the failing ones', () => {
    const { input } = makeLayout({ preparedDependency: false });
    const printed = formatSpmPackageDiagnostics(assertSpmPackagesResolved(input, linkedCorrectly));
    assert.match(printed, /prepared-xcframework/);
    assert.equal(printed.split('\n').filter(Boolean).length, 4);
  });
});

describe('assertManifestMatchesFlavor (D21)', () => {
  function manifestWith(binaryTargetPaths: string[]): string {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-flavor-')),
      'Package.swift'
    );
    fs.outputFileSync(
      file,
      manifestSource({
        targets: [
          '',
          ...binaryTargetPaths.flatMap((target, index) => [
            '        .binaryTarget(',
            `            name: "Dep${index}",`,
            `            path: "${target}"`,
            '        ),',
          ]),
          '    ',
        ].join('\n'),
      })
    );
    return file;
  }

  it("accepts a manifest whose binary targets carry the artifact's flavor", () => {
    const manifest = manifestWith([
      '../../../.spm-deps/SDWebImage/debug/SDWebImage.xcframework',
      '../../../expo-modules-core/output/debug/xcframeworks/ExpoModulesCore.xcframework',
    ]);

    assert.doesNotThrow(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'));
  });

  it('rejects the Release manifest of a Debug build, naming both flavors and the path', () => {
    const manifest = manifestWith(['../../../.spm-deps/SDWebImage/release/SDWebImage.xcframework']);

    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'), {
      message: /release[\s\S]*Debug[\s\S]*\.spm-deps\/SDWebImage\/release/,
    });
  });

  it('rejects a manifest in which only one binary target carries the other flavor', () => {
    const manifest = manifestWith([
      '../../../.spm-deps/SDWebImage/debug/SDWebImage.xcframework',
      '../../../.spm-deps/libavif/release/libavif.xcframework',
    ]);

    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'), {
      message: /libavif/,
    });
  });

  it('sees through a .. that undoes the flavor segment it names (round 6a item 3)', () => {
    const manifest = manifestWith([
      '../../../.spm-deps/libavif/debug/../release/libavif.xcframework',
    ]);

    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'), {
      message: /release[\s\S]*Debug/,
    });
  });

  it('refuses a manifest whose binary targets name no flavor, rather than passing it', () => {
    assert.throws(
      () =>
        assertManifestMatchesFlavor(
          readSwiftManifest(manifestWith(['Vendor.xcframework'])),
          'Debug'
        ),
      {
        message: /cannot tell|no binary target/i,
      }
    );
  });

  it('refuses a manifest with no binary target to read a flavor from', () => {
    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifestWith([])), 'Debug'), {
      message: /cannot tell|no binary target/i,
    });
  });

  it('ignores a flavor named inside a comment rather than a binary target path', () => {
    const manifest = manifestWith(['../../../.spm-deps/SDWebImage/debug/SDWebImage.xcframework']);
    fs.appendFileSync(
      manifest,
      '\n// .binaryTarget(name: "Old", path: "../.spm-deps/Old/release/Old.xcframework")\n'
    );

    assert.doesNotThrow(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'));
  });

  it('refuses a path naming release above the artifact and debug beside it, quoting both', () => {
    const manifest = manifestWith(['../release/.spm-deps/SDWebImage/debug/SDWebImage.xcframework']);

    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Release'), {
      message: /two build flavors[\s\S]*release[\s\S]*debug nearest the artifact/,
    });
  });

  it('refuses the same path read the other way round, rather than trusting the first segment', () => {
    const manifest = manifestWith(['../debug/.spm-deps/SDWebImage/release/SDWebImage.xcframework']);

    assert.throws(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'), {
      message: /two build flavors[\s\S]*debug[\s\S]*release nearest the artifact/,
    });
  });

  it('accepts a path that names the same flavor twice, which is not ambiguous', () => {
    const manifest = manifestWith(['../debug/.spm-deps/SDWebImage/debug/SDWebImage.xcframework']);

    assert.doesNotThrow(() => assertManifestMatchesFlavor(readSwiftManifest(manifest), 'Debug'));
  });

  it('leaves a missing manifest to the manifest-declaration check', () => {
    assert.doesNotThrow(() =>
      assertManifestMatchesFlavor(readSwiftManifest('/nowhere/Package.swift'), 'Debug')
    );
  });
});
