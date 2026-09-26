import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, it, type TestContext } from 'node:test';

import { getExpoRepositoryRootDir } from '../Directories';
import {
  isFirstPartyPackagePath,
  resolveCheckedInManifestAsync as resolve,
  resolveCheckedInManifestRoot,
} from './CheckedInManifest';
import { ExternalPackage, type SPMPackageSource } from './ExternalPackage';
import type {
  SPMConfig,
  SPMPackageDependencyConfig,
  SPMProduct,
  SourceTarget,
} from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { SPMPackage } from './SPMPackage';

const temporaryDirectories: string[] = [];
const originalRepoRoot = process.env.EXPO_ROOT_DIR;

afterEach(() => {
  if (originalRepoRoot === undefined) delete process.env.EXPO_ROOT_DIR;
  else process.env.EXPO_ROOT_DIR = originalRepoRoot;
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function fixture(
  targets = '.target(name: "Main", path: "ios")',
  files: Record<string, string> = { 'ios/Main.swift': 'public let value = 1' },
  options: {
    dependencies?: string;
    members?: string;
    imports?: string;
    packageName?: string;
    packageJson?: Record<string, unknown>;
  } = {}
) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'checked-in-manifest-'));
  temporaryDirectories.push(repoRoot);
  process.env.EXPO_ROOT_DIR = repoRoot;
  const root = path.join(repoRoot, 'packages/fixture');
  const manifest = `// swift-tools-version: 5.9
import PackageDescription
${options.imports ?? ''}
let package = Package(
  name: "${options.packageName ?? 'fixture'}",
  platforms: [.macOS(.v13)],
  products: [.library(name: "Fixture", targets: [${options.members ?? '"Main"'}])],
  dependencies: [${options.dependencies ?? ''}],
  targets: [${targets}]
)
`;
  const packageJson = JSON.stringify(options.packageJson ?? { name: 'fixture', version: '1.0.0' });
  for (const [relative, content] of Object.entries({
    'package.json': packageJson,
    'Package.swift': manifest,
    ...files,
  })) {
    const destination = path.join(root, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  }
  const product: SPMProduct = {
    name: 'Fixture',
    podName: 'Fixture',
    platforms: ['macOS(.v11)'],
    targets: [
      { type: 'swift', name: 'Main', path: 'deliberately-wrong', linkedFrameworks: ['Foundation'] },
    ],
  };
  const pkg = {
    path: root,
    buildPath: path.join(root, '.build-prebuild'),
    packageName: 'fixture',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [product] }),
  };
  return { root, product, pkg };
}

/** Every diagnostic this module produces — thrown or logged — closes with a next step: an
 * imperative sentence telling the developer what to do about it. */
const NEXT_STEP =
  /\. (Add|Check|Declare|Exclude|Fix|Keep|Move|Provide|Remove|Set|Split|Update|Use)\b[^\n]+[.]$/;

/** What every error-path test in this file requires of a diagnostic: that it names the target, that
 * it carries the expected detail, and that it closes with a remediation sentence. Kept separate
 * from `rejectsManifest` so the tests that guard it can feed it an error directly. */
function assertManifestDiagnostic(error: Error, detail: RegExp, target: string) {
  const prefix = `Cannot use the checked-in Package.swift for product "Fixture", target "${target}": `;
  assert.ok(error.message.startsWith(prefix), `Error must name target ${target}: ${error.message}`);
  assert.match(error.message, detail);
  assert.match(error.message.slice(prefix.length), NEXT_STEP);
  // Mode A/B is pipeline vocabulary; the reader of this error has never seen it.
  assert.doesNotMatch(error.message, /\bMode [AB]\b/);
}

/** The logged counterpart of assertManifestDiagnostic: the debug line carrying `detail` must close
 * with a next step too. */
function assertLoggedNextStep(lines: string[], detail: RegExp) {
  const line = lines.find((candidate) => detail.test(candidate));
  assert.ok(line, `Expected a debug line matching ${detail}, got ${JSON.stringify(lines)}`);
  assert.match(line, NEXT_STEP);
}

async function rejectsManifest(input: ReturnType<typeof fixture>, detail: RegExp, target = 'Main') {
  await assert.rejects(resolve(input.root, input.product), (error: Error) => {
    assertManifestDiagnostic(error, detail, target);
    return true;
  });
}

it('transforms manifest layout and drops test targets', async () => {
  const input = fixture(
    `.target(name: "Main", path: "ios", exclude: ["Tests"], resources: [.copy("PrivacyInfo.xcprivacy")]),
     .target(name: "ObjC", path: "objc", publicHeadersPath: "headers"),
     .testTarget(name: "MainTests", dependencies: ["Main"], path: "tests")`,
    {
      'ios/Main.swift': 'public let value = 1',
      'ios/Tests/Bad.swift': 'INVALID SWIFT',
      'ios/PrivacyInfo.xcprivacy': '<plist/>',
      'objc/Thing.m': 'int thing(void) { return 1; }',
      'objc/headers/Thing.h': 'int thing(void);',
      'tests/Test.swift': 'import XCTest',
    },
    { members: '"Main", "ObjC"' }
  );
  const targets = await resolve(input.root, input.product);
  assert.deepEqual(
    targets.map((target) => target.name),
    ['Main', 'ObjC']
  );
  assert.equal(targets[0].path, 'Main');
  assert.deepEqual(targets[0].sources, ['src', 'Fixture+Exports.swift']);
  assert.deepEqual(targets[0].exclude, ['src/Tests']);
  assert.deepEqual(targets[0].resources, [{ path: 'src/PrivacyInfo.xcprivacy', rule: 'copy' }]);
  assert.equal(targets[1].publicHeadersPath, 'src/headers');
  assert.deepEqual(targets[1].sources, ['src']);
});

for (const [npmName, packageName] of [
  ['fixture', 'fixture'],
  ['@expo/log-box', 'expo-log-box'],
]) {
  it(`package name: accepts Package(name: "${packageName}") for npm package ${npmName}`, async () => {
    const input = fixture(undefined, undefined, { packageName, packageJson: { name: npmName } });
    const targets = await resolve(input.root, input.product);
    assert.deepEqual(
      targets.map((target) => target.name),
      ['Main']
    );
  });
}

for (const [npmName, packageName, expected] of [
  ['fixture', 'Fixture', 'fixture'],
  ['@expo/log-box', 'log-box', 'expo-log-box'],
  ['@expo/log-box', '@expo/log-box', 'expo-log-box'],
]) {
  it(`package name: rejects Package(name: "${packageName}") for npm package ${npmName}`, async () => {
    const input = fixture(undefined, undefined, { packageName, packageJson: { name: npmName } });
    await rejectsManifest(
      input,
      new RegExp(
        `declares Package\\(name: "${packageName}"\\), but .*"${expected}".*Set name: "${expected}"`
      )
    );
  });
}

for (const [label, packageJson] of [
  ['no name', { version: '1.0.0' }],
  ['a non-string name', { name: 42 }],
] as const) {
  it(`package name: rejects a package.json with ${label}`, async () => {
    const input = fixture(undefined, undefined, { packageJson });
    await rejectsManifest(input, /package\.json does not declare a non-empty string "name"/);
  });
}

it('package name: rejects a package directory without package.json', async () => {
  const input = fixture();
  fs.rmSync(path.join(input.root, 'package.json'));
  await rejectsManifest(input, /could not read .*package\.json/);
});

for (const [extension, expected] of [
  ['swift', 'swift'],
  ['m', 'objc'],
  ['c', 'objc'],
  ['cpp', 'cpp'],
  ['cc', 'cpp'],
  ['cxx', 'cpp'],
  ['mm', 'cpp'],
] as const) {
  it(`infers ${expected} from .${extension} sources`, async () => {
    const input = fixture(undefined, { [`ios/Main.${extension}`]: '// source' });
    input.product.targets[0].type = expected;
    assert.equal((await resolve(input.root, input.product))[0].type, expected);
  });
}

it('rejects a config type that differs from the language of the manifest sources', async () => {
  const input = fixture(undefined, { 'ios/Main.m': '// source' });
  await rejectsManifest(
    input,
    /spm\.config\.json declares type "swift", but the target's sources resolve to type "objc".*Set "type" to "objc"/
  );
});

it('accepts a manifest target that spm.config.json does not list', async () => {
  const input = fixture(undefined, { 'ios/Main.m': '// source' });
  input.product.targets = [];
  assert.equal((await resolve(input.root, input.product))[0].type, 'objc');
});

it('applies explicit sources and excludes before inferring language', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios", exclude: ["Skipped"], sources: ["Chosen"])',
    {
      'ios/Chosen/Main.swift': 'public let value = 1',
      'ios/Skipped/Other.m': '// ignored',
      'ios/Other.cpp': '// outside sources',
    }
  );
  const [target] = await resolve(input.root, input.product);
  assert.equal(target.type, 'swift');
  assert.deepEqual(target.sources, ['src/Chosen', 'Fixture+Exports.swift']);
});

it('resolves SwiftPM default target paths', async () => {
  const input = fixture('.target(name: "Main")', {
    'Sources/Main/Main.swift': 'public let value = 1',
  });
  assert.equal((await resolve(input.root, input.product))[0].path, 'Main');
});

it('rejects a target without a real source directory', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "missing")'),
    /: its source path "missing" does not resolve to a real directory\./
  );
});

for (const [kind, declaration, imports] of [
  ['binary', '.binaryTarget(name: "Helper", path: "Helper.xcframework")', ''],
  ['system', '.systemLibrary(name: "Helper", path: "system")', ''],
  ['macro', '.macro(name: "Helper", path: "macro")', 'import CompilerPluginSupport'],
  ['plugin', '.plugin(name: "Helper", capability: .buildTool(), path: "plugin")', ''],
] as const) {
  it(`rejects a dependency on a ${kind} target`, async () => {
    await rejectsManifest(
      fixture(
        `.target(name: "Main", dependencies: ["Helper"], path: "ios"), ${declaration}`,
        undefined,
        { imports }
      ),
      new RegExp(`: it depends on non-regular target "Helper" \\(${kind}\\),`)
    );
  });
}

const REMOTE_URL = 'https://example.com/remote.git';
const REMOTE_PACKAGE = `.package(url: "${REMOTE_URL}", exact: "1.2.3")`;

function remote(
  version: SPMPackageDependencyConfig['version'] = { exact: '1.2.3' },
  url = REMOTE_URL,
  productName = 'Remote'
): SPMPackageDependencyConfig {
  return { url, productName, version };
}

function withPackages(
  dependencies: string,
  spmPackages: SPMPackageDependencyConfig[],
  targets?: string
) {
  const input = fixture(targets, undefined, { dependencies });
  input.product.spmPackages = spmPackages;
  return input;
}

const PACKAGES_DIFFER =
  /: its package dependencies do not match spmPackages in spm\.config\.json: /;

async function rejectsPackageDifferences(input: ReturnType<typeof fixture>, differences: string[]) {
  await assert.rejects(resolve(input.root, input.product), (error: Error) => {
    assertManifestDiagnostic(error, PACKAGES_DIFFER, 'Main');
    assert.match(error.message, /Package\.swift is the authority for third-party packages/);
    assert.match(
      error.message,
      /Update spmPackages in spm\.config\.json to match Package\.swift\.$/
    );
    for (const difference of differences) {
      assert.ok(error.message.includes(difference), `Missing "${difference}" in: ${error.message}`);
    }
    return true;
  });
}

it('packages: accepts a manifest whose packages match spmPackages by normalized URL', async () => {
  const input = withPackages(
    `.package(url: "https://example.com/Remote.git", exact: "1.2.3"),
     .package(url: "https://example.com/branchy", branch: "main"),
     .package(url: "https://example.com/pinned.git", revision: "abc123")`,
    [
      remote(),
      remote({ exact: '1.2.3' }, REMOTE_URL, 'RemoteExtras'),
      remote({ branch: 'main' }, 'https://example.com/branchy.git', 'Branchy'),
      remote({ revision: 'abc123' }, 'https://EXAMPLE.com/pinned', 'Pinned'),
    ]
  );
  assert.equal((await resolve(input.root, input.product))[0].name, 'Main');
});

it('packages: rejects a version that differs from spmPackages and shows both', async () => {
  await rejectsPackageDifferences(withPackages(REMOTE_PACKAGE, [remote({ exact: '1.2.4' })]), [
    `${REMOTE_URL} requires exact: "1.2.3" in Package.swift but exact: "1.2.4" in spmPackages (product "Remote")`,
  ]);
});

it('packages: rejects a requirement kind that differs from spmPackages', async () => {
  await rejectsPackageDifferences(withPackages(REMOTE_PACKAGE, [remote({ revision: '1.2.3' })]), [
    `${REMOTE_URL} requires exact: "1.2.3" in Package.swift but revision: "1.2.3" in spmPackages (product "Remote")`,
  ]);
});

it('packages: rejects a URL that differs from spmPackages as a package on each side', async () => {
  const fork = 'https://example.com/remote-fork.git';
  await rejectsPackageDifferences(withPackages(REMOTE_PACKAGE, [remote(undefined, fork)]), [
    `${REMOTE_URL} (exact: "1.2.3") is declared in Package.swift but missing from spmPackages`,
    `${fork} (exact: "1.2.3", product "Remote") is in spmPackages but not declared in Package.swift`,
  ]);
});

it('packages: rejects a package declared only in the manifest', async () => {
  await rejectsPackageDifferences(withPackages(REMOTE_PACKAGE, []), [
    `${REMOTE_URL} (exact: "1.2.3") is declared in Package.swift but missing from spmPackages`,
  ]);
});

it('packages: rejects a package declared only in spmPackages', async () => {
  await rejectsPackageDifferences(withPackages('', [remote()]), [
    `${REMOTE_URL} (exact: "1.2.3", product "Remote") is in spmPackages but not declared in Package.swift`,
  ]);
});

it('packages: reports every difference in one error', async () => {
  await rejectsPackageDifferences(
    withPackages(
      `${REMOTE_PACKAGE}, .package(url: "https://example.com/extra.git", branch: "main")`,
      [remote({ exact: '2.0.0' }), remote(undefined, 'https://example.com/absent.git', 'Absent')]
    ),
    [
      `${REMOTE_URL} requires exact: "1.2.3" in Package.swift but exact: "2.0.0" in spmPackages (product "Remote")`,
      'https://example.com/absent.git (exact: "1.2.3", product "Absent") is in spmPackages but not declared in Package.swift',
      'https://example.com/extra.git (branch: "main") is declared in Package.swift but missing from spmPackages',
    ]
  );
});

it('packages: rejects a manifest version range, which the dump cannot report exactly', async () => {
  await rejectsManifest(
    withPackages(`.package(url: "${REMOTE_URL}", from: "1.0.0")`, [remote({ from: '1.0.0' })]),
    new RegExp(
      `: the manifest declares ${REMOTE_URL} with a version range, .*\\. Use exact: in Package\\.swift`
    )
  );
});

it('packages: rejects from: in spmPackages, which a checked-in manifest can never match', async () => {
  await rejectsManifest(
    withPackages(REMOTE_PACKAGE, [remote({ from: '1.2.3' })]),
    new RegExp(
      `: spm\\.config\\.json declares ${REMOTE_URL} \\(product "Remote"\\) with from: "1\\.2\\.3", .*\\. Use exact: in spm\\.config\\.json`
    )
  );
});

for (const [label, version, url] of [
  ['an empty version', {}, REMOTE_URL],
  ['an empty exact value', { exact: '' }, REMOTE_URL],
  ['a non-string exact value', { exact: 1 }, REMOTE_URL],
  ['two requirement kinds', { exact: '1.2.3', branch: 'main' }, REMOTE_URL],
  ['an unknown requirement kind', { tag: '1.2.3' }, REMOTE_URL],
  ['a null version', null, REMOTE_URL],
  ['an empty URL', { exact: '1.2.3' }, ''],
] as const) {
  it(`packages: rejects an spmPackages entry with ${label}`, async () => {
    const entry = { url, productName: 'Remote', version } as unknown as SPMPackageDependencyConfig;
    await rejectsManifest(
      withPackages(REMOTE_PACKAGE, [entry]),
      /: spm\.config\.json declares an spmPackages entry that et prebuild cannot read: /
    );
  });
}

it('packages: rejects a local .package(path:) dependency', async () => {
  const input = withPackages('.package(path: "local")', []);
  fs.mkdirSync(path.join(input.root, 'local'));
  fs.writeFileSync(
    path.join(input.root, 'local/Package.swift'),
    '// swift-tools-version: 5.9\nimport PackageDescription\nlet package = Package(name: "Local")\n'
  );
  await rejectsManifest(input, /: the manifest declares local package dependency "[^"]*local"/);
});

it('packages: rejects a registry .package(id:) dependency', async () => {
  await rejectsManifest(
    withPackages('.package(id: "example.remote", exact: "1.2.3")', []),
    /: the manifest declares registry package dependency "example\.remote"/
  );
});

it('packages: rejects an empty branch the dump reports verbatim', async () => {
  await rejectsManifest(
    withPackages(`.package(url: "${REMOTE_URL}", branch: "")`, [remote({ branch: 'main' })]),
    /: the dumped manifest declares a package dependency that et prebuild cannot read: /
  );
});

it('packages: rejects a local Git repository, which has no remote URL', async () => {
  await rejectsManifest(
    withPackages('.package(url: "/abs/remote", exact: "1.2.3")', []),
    /: the dumped manifest declares a package dependency that et prebuild cannot read: /
  );
});

it('packages: rejects two declarations of one package that differ only in spelling', async () => {
  await rejectsManifest(
    withPackages(`${REMOTE_PACKAGE}, .package(url: "https://example.com/Remote", exact: "1.2.3")`, [
      remote(),
    ]),
    /: the manifest declares https:\/\/example\.com\/remote\.git and https:\/\/example\.com\/Remote, which name the same package/
  );
});

const pinned = {
  identity: 'remote',
  location: { remote: [{ urlString: REMOTE_URL }] },
  productFilter: null,
  requirement: { exact: ['1.2.3'] },
};
for (const [label, dependency] of [
  ['a null entry', null],
  ['an empty entry', {}],
  ['an empty sourceControl list', { sourceControl: [] }],
  ['two sourceControl entries', { sourceControl: [pinned, pinned] }],
  ['an unknown dependency kind', { git: [pinned] }],
  ['a missing location', { sourceControl: [{ ...pinned, location: undefined }] }],
  ['an empty remote list', { sourceControl: [{ ...pinned, location: { remote: [] } }] }],
  ['an empty URL', { sourceControl: [{ ...pinned, location: { remote: [{ urlString: '' }] } }] }],
  [
    'a non-string URL',
    { sourceControl: [{ ...pinned, location: { remote: [{ urlString: 1 }] } }] },
  ],
  ['a missing requirement', { sourceControl: [{ ...pinned, requirement: undefined }] }],
  ['an empty requirement', { sourceControl: [{ ...pinned, requirement: {} }] }],
  ['an empty exact list', { sourceControl: [{ ...pinned, requirement: { exact: [] } }] }],
  ['an empty exact value', { sourceControl: [{ ...pinned, requirement: { exact: [''] } }] }],
  ['a bare exact string', { sourceControl: [{ ...pinned, requirement: { exact: '1.2.3' } }] }],
  ['an unknown requirement', { sourceControl: [{ ...pinned, requirement: { tag: ['1.2.3'] } }] }],
] as const) {
  it(`packages: rejects a dumped package dependency with ${label}`, async () => {
    const input = fixture();
    input.product.spmPackages = [remote()];
    await withSwiftOnPath(stubSwiftDump(input, {}, { dependencies: [dependency] }), () =>
      rejectsManifest(
        input,
        /: the dumped manifest declares a package dependency that et prebuild cannot read: /
      )
    );
  });
}

it('packages: rejects a dumped dependency list that is not a list', async () => {
  const input = fixture();
  await withSwiftOnPath(stubSwiftDump(input, {}, { dependencies: {} }), () =>
    rejectsManifest(
      input,
      /: the dumped manifest declares a package dependency that et prebuild cannot read: /
    )
  );
});

it('packages: rejects package traits the generated manifest cannot carry', async () => {
  const input = fixture();
  input.product.spmPackages = [remote()];
  const traits = [{ name: 'Extras' }];
  await withSwiftOnPath(
    stubSwiftDump(input, {}, { dependencies: [{ sourceControl: [{ ...pinned, traits }] }] }),
    () =>
      rejectsManifest(
        input,
        /: the manifest enables traits \["Extras"\] on https:\/\/example\.com\/remote\.git/
      )
  );
});

it('packages: rejects an empty traits list, which disables the default traits', async () => {
  const input = fixture();
  input.product.spmPackages = [remote()];
  await withSwiftOnPath(
    stubSwiftDump(input, {}, { dependencies: [{ sourceControl: [{ ...pinned, traits: [] }] }] }),
    () =>
      rejectsManifest(
        input,
        /: the manifest disables the default traits of https:\/\/example\.com\/remote\.git, which the generated build manifest would silently re-enable\./
      )
  );
});

it('packages: accepts the default trait the dump reports for every package', async () => {
  const input = fixture();
  input.product.spmPackages = [remote()];
  const traits = [{ name: 'default' }];
  await withSwiftOnPath(
    stubSwiftDump(input, {}, { dependencies: [{ sourceControl: [{ ...pinned, traits }] }] }),
    async () => {
      assert.equal((await resolve(input.root, input.product))[0].name, 'Main');
    }
  );
});

it('product dependency: resolves .product(name:package:) as its spmPackages product', async () => {
  const input = withPackages(
    REMOTE_PACKAGE,
    [remote()],
    '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote")], path: "ios")'
  );
  (input.product.targets[0] as SourceTarget).linkedFrameworks = [];
  const [target] = await resolve(input.root, input.product);
  assert.deepEqual(target.dependencies, ['Remote']);
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  assert.match(
    fs.readFileSync(SPMGenerator.getSwiftPackagePath(input.pkg, input.product), 'utf8'),
    /dependencies: \[\.product\(name: "Remote", package: "remote"\)\]/
  );
});

it('product dependency: resolves a .product whose name is also a local target to the product', async () => {
  const input = withPackages(
    REMOTE_PACKAGE,
    [remote(undefined, undefined, 'Helper')],
    '.target(name: "Main", dependencies: [.product(name: "Helper", package: "remote")], path: "ios"), .binaryTarget(name: "Helper", path: "Helper.xcframework")'
  );
  assert.deepEqual((await resolve(input.root, input.product))[0].dependencies, ['Helper']);
});

it('product dependency: rejects a .product platform condition like any other dependency', async () => {
  await rejectsManifest(
    withPackages(
      REMOTE_PACKAGE,
      [remote()],
      '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote", condition: .when(platforms: [.iOS]))], path: "ios")'
    ),
    /: dependency "Remote" has a platform condition, but the generated dependency format cannot preserve it\./
  );
});

it('product dependency: rejects .product moduleAliases instead of silently dropping them', async () => {
  await rejectsManifest(
    withPackages(
      REMOTE_PACKAGE,
      [remote()],
      '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote", moduleAliases: ["Remote": "RemoteAlias"])], path: "ios")'
    ),
    /: dependency "Remote" declares moduleAliases, which the generated dependency format cannot preserve\./
  );
});

it('product dependency: rejects a .product naming a product absent from spm.config.json', async () => {
  await rejectsManifest(
    withPackages(
      REMOTE_PACKAGE,
      [remote()],
      '.target(name: "Main", dependencies: [.product(name: "Ghost", package: "remote")], path: "ios")'
    ),
    /: it depends on \.product\(name: "Ghost", package: "remote"\), but no spmPackages entry in spm\.config\.json has productName "Ghost"\./
  );
});

const PACKAGE_NAME_DIFFERS = (configured: string) =>
  new RegExp(
    `: it depends on \\.product\\(name: "Remote", package: "[^"]+"\\), but spm\\.config\\.json resolves product "Remote" to package "${configured}", .*\\. Set packageName in spm\\.config\\.json or package: in Package\\.swift`
  );

it('product dependency: accepts a .product package that matches the URL-derived name exactly', async () => {
  const input = withPackages(
    REMOTE_PACKAGE,
    [remote()],
    '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote")], path: "ios")'
  );
  assert.deepEqual((await resolve(input.root, input.product))[0].dependencies, ['Remote']);
});

it('product dependency: accepts a .product package that differs from the derived name only in case', async () => {
  const url = 'https://example.com/Remote.git';
  const input = withPackages(
    `.package(url: "${url}", exact: "1.2.3")`,
    [remote(undefined, url)],
    '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote")], path: "ios")'
  );
  assert.deepEqual((await resolve(input.root, input.product))[0].dependencies, ['Remote']);
});

it('product dependency: rejects a .product package that differs from the URL-derived name', async () => {
  await rejectsManifest(
    withPackages(
      `${REMOTE_PACKAGE}, .package(url: "https://example.com/other.git", exact: "1.0.0")`,
      [remote(), remote({ exact: '1.0.0' }, 'https://example.com/other.git', 'Other')],
      '.target(name: "Main", dependencies: [.product(name: "Remote", package: "other")], path: "ios")'
    ),
    PACKAGE_NAME_DIFFERS('remote')
  );
});

it('product dependency: rejects a .product package that differs from an explicit packageName', async () => {
  await rejectsManifest(
    withPackages(
      REMOTE_PACKAGE,
      [{ ...remote(), packageName: 'RemoteKit' }],
      '.target(name: "Main", dependencies: [.product(name: "Remote", package: "remote")], path: "ios")'
    ),
    PACKAGE_NAME_DIFFERS('RemoteKit')
  );
});

// SwiftPM only accepts a `package:` that names a declared package identity, so a real manifest
// cannot spell a packageName that differs from the URL; the stubbed dump isolates the override.
for (const [label, packageName, accepted] of [
  ['honours an explicit packageName over the URL-derived name', 'RemoteKit', true],
  ['does not fall back to the URL-derived name without packageName', undefined, false],
] as const) {
  it(`product dependency: ${label}`, async () => {
    const input = fixture();
    input.product.spmPackages = [{ ...remote(), packageName }];
    const bin = stubSwiftDump(
      input,
      { dependencies: [{ product: ['Remote', 'remotekit', null, null] }] },
      { dependencies: [{ sourceControl: [pinned] }] }
    );
    await withSwiftOnPath(bin, async () => {
      if (accepted) {
        assert.deepEqual((await resolve(input.root, input.product))[0].dependencies, ['Remote']);
      } else {
        await rejectsManifest(input, PACKAGE_NAME_DIFFERS('remote'));
      }
    });
  });
}

it('product dependency: rejects a .product naming only an externalDependencies entry', async () => {
  const input = withPackages(
    REMOTE_PACKAGE,
    [remote()],
    '.target(name: "Main", dependencies: [.product(name: "React", package: "remote")], path: "ios")'
  );
  input.product.externalDependencies = ['React'];
  await rejectsManifest(
    input,
    /: it depends on \.product\(name: "React", package: "remote"\), but no spmPackages entry in spm\.config\.json has productName "React"\./
  );
});

it('product dependency: rejects a .product named like a regular target in the product graph', async () => {
  const input = fixture(
    '.target(name: "Main", dependencies: [.product(name: "Helper", package: "remote")], path: "ios"), .target(name: "Helper", path: "helper")',
    { 'ios/Main.swift': 'public let value = 1', 'helper/Helper.swift': 'public let helper = 1' },
    { dependencies: REMOTE_PACKAGE, members: '"Main", "Helper"' }
  );
  input.product.spmPackages = [remote(undefined, undefined, 'Helper')];
  await rejectsManifest(
    input,
    /: dependency \.product\(name: "Helper", package: "remote"\) has the same name as regular target "Helper", /
  );
});

for (const [kind, declaration, imports] of [
  ['macro', '.macro(name: "Helper", path: "macro")', 'import CompilerPluginSupport'],
  ['system-library', '.systemLibrary(name: "Helper", path: "system")', ''],
] as const) {
  it(`rejects a declared ${kind} target`, async () => {
    await rejectsManifest(
      fixture(`.target(name: "Main", path: "ios"), ${declaration}`, undefined, { imports }),
      new RegExp(
        `: the manifest declares an unsupported ${kind === 'macro' ? 'macro' : 'system'} target\\.`
      ),
      'Helper'
    );
  });
}

it('rejects uncovered nested test sources', async () => {
  await rejectsManifest(
    fixture(undefined, {
      'ios/Main.swift': 'public let value = 1',
      'ios/Nested/Tests/Bad.swift': 'INVALID SWIFT',
    }),
    /: its Tests directory contains source "[^"]+" that is not excluded and would ship in the artifact\./
  );
});

it('rejects Swift and C-family sources in one target', async () => {
  await rejectsManifest(
    fixture(undefined, {
      'ios/Main.swift': 'public let value = 1',
      'ios/Other.m': 'int other(void) { return 1; }',
    }),
    /: it mixes Swift and C-family source files, which SwiftPM cannot compile in one target\./
  );
});

it('rejects an empty resolved source set', async () => {
  await rejectsManifest(
    fixture(undefined, { 'ios/README.md': 'No sources' }),
    /: its resolved source set is empty, so the pipeline cannot infer its language\./
  );
});

it('an explicit empty sources array does not mean all files', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", sources: [])'),
    /: its resolved source set is empty, so the pipeline cannot infer its language\./
  );
});

it('accepts a Tests directory outside explicit sources', async () => {
  const input = fixture('.target(name: "Main", path: "ios", sources: ["Main.swift"])', {
    'ios/Main.swift': 'public let value = 1',
    'ios/Tests/Bad.swift': 'INVALID SWIFT',
  });
  assert.equal((await resolve(input.root, input.product))[0].type, 'swift');
});

it('rejects a Tests directory inside explicit sources', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", sources: ["Main.swift", "Tests"])', {
      'ios/Main.swift': 'public let value = 1',
      'ios/Tests/Bad.swift': 'INVALID SWIFT',
    }),
    /: its Tests directory contains source "[^"]+" that is not excluded and would ship in the artifact\./
  );
});

it('excluding an ancestor covers nested tests', async () => {
  const input = fixture('.target(name: "Main", path: "ios", exclude: ["Support"])', {
    'ios/Main.swift': 'public let value = 1',
    'ios/Support/Tests/Bad.swift': 'INVALID SWIFT',
  });
  assert.equal((await resolve(input.root, input.product))[0].type, 'swift');
});

it('canonicalizes collapsed exclude paths', async () => {
  const input = fixture('.target(name: "Main", path: "ios", exclude: ["Folder/../Tests"])', {
    'ios/Folder/Keep.swift': 'public let keep = 1',
    'ios/Tests/Bad.swift': 'INVALID SWIFT',
    'ios/Main.swift': 'public let value = 1',
  });
  const [target] = await resolve(input.root, input.product);
  assert.deepEqual(target.exclude, ['src/Tests']);
});

it('canonicalizes trailing separators in exclude paths', async () => {
  const input = fixture('.target(name: "Main", path: "ios", exclude: ["Tests/"])', {
    'ios/Tests/Bad.swift': 'INVALID SWIFT',
    'ios/Main.swift': 'public let value = 1',
  });
  const [target] = await resolve(input.root, input.product);
  assert.deepEqual(target.exclude, ['src/Tests']);
});

it('canonicalizes trailing separators in sources and public headers', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios", sources: ["Chosen/"]), .target(name: "ObjC", path: "objc", publicHeadersPath: "headers/")',
    {
      'ios/Chosen/Main.swift': 'public let value = 1',
      'objc/Thing.m': 'int thing(void) { return 1; }',
      'objc/headers/Thing.h': 'int thing(void);',
    },
    { members: '"Main", "ObjC"' }
  );
  const targets = await resolve(input.root, input.product);
  assert.deepEqual(targets[0].sources, ['src/Chosen', 'Fixture+Exports.swift']);
  assert.equal(targets[1].publicHeadersPath, 'src/headers');
});

it('rejects the empty source set a target-directory exclude leaves', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", exclude: ["."])'),
    /: its resolved source set is empty, so the pipeline cannot infer its language\. Provide a real target path and sources containing Swift, Objective-C, C, or C\+\+ files, and check that exclude does not remove them all\.$/
  );
});

it('rejects an explicit source directory emptied by excluding the target root', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", exclude: ["."], sources: ["Chosen"])', {
      'ios/Chosen/Main.swift': 'public let value = 1',
    }),
    /: its resolved source set is empty, so the pipeline cannot infer its language\. Provide a real target path and sources containing Swift, Objective-C, C, or C\+\+ files, and check that exclude does not remove them all\.$/
  );
});

// The real toolchain collapses `..` in resource paths before dump, so the raw uncollapsed shape needed to exercise this module's own canonicalisation can only be produced by a stub.
it('canonicalizes collapsed resource paths before inferring language', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios", resources: [.copy("Folder/../Assets")])',
    {
      'ios/Folder/Keep.swift': 'public let keep = 1',
      'ios/Assets/Ignored.m': 'int ignored(void) { return 1; }',
      'ios/Main.swift': 'public let value = 1',
    }
  );
  await withSwiftOnPath(
    stubSwiftDump(input, {
      resources: [{ path: 'Folder/../Assets', rule: { copy: {} } }],
    }),
    async () => {
      const [target] = await resolve(input.root, input.product);
      assert.equal(target.type, 'swift');
      assert.deepEqual(target.resources, [{ path: 'src/Assets', rule: 'copy' }]);
    }
  );
});

it('keeps rejecting collapsed paths that escape the target source directory', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", exclude: ["Support/../../other"])'),
    /: path "Support\/\.\.\/\.\.\/other" escapes the target source directory\. Keep sources, excludes, resources, and public headers inside the target directory\.$/
  );
});

it('rejects a target path that escapes the package root through a symbolic link', async () => {
  const input = fixture();
  const outside = path.join(process.env.EXPO_ROOT_DIR!, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'Main.swift'), 'public let value = 1');
  fs.rmSync(path.join(input.root, 'ios'), { recursive: true });
  fs.symlinkSync(outside, path.join(input.root, 'ios'));
  await rejectsManifest(input, /escapes the package root/);
});

it('walks a target directory with cyclic symbolic links to completion', async () => {
  const input = fixture();
  // Two links make the unguarded walk exponential; one alone only repeats until ELOOP.
  fs.symlinkSync('.', path.join(input.root, 'ios/first'));
  fs.symlinkSync('.', path.join(input.root, 'ios/second'));
  const [target] = await resolve(input.root, input.product);
  assert.equal(target.type, 'swift');
});

for (const field of ['headerPattern', 'fileMapping'] as const) {
  it(`rejects ${field} in spm.config.json`, async () => {
    const input = fixture();
    const target = input.product.targets[0] as SourceTarget;
    if (field === 'headerPattern') target.headerPattern = '**/*.h';
    else target.fileMapping = [{ from: '*.swift', to: '{filename}', type: 'source' }];
    await rejectsManifest(input, new RegExp(`: spm.config\\.json declares ${field},`));
  });

  it(`rejects a declared empty ${field} in spm.config.json`, async () => {
    const input = fixture();
    const target = input.product.targets[0] as SourceTarget;
    if (field === 'headerPattern') target.headerPattern = '';
    else target.fileMapping = [];
    await rejectsManifest(input, new RegExp(`: spm.config\\.json declares ${field},`));
  });
}

it('rejects pattern, the glob a checked-in manifest never applies', async () => {
  const input = fixture();
  const target = input.product.targets[0] as SourceTarget;
  target.pattern = '*.swift';
  await assert.rejects(resolve(input.root, input.product), (error: Error) => {
    assertManifestDiagnostic(error, /: spm\.config\.json declares pattern "\*\.swift",/, 'Main');
    assert.match(error.message, /never applies that glob/);
    assert.match(
      error.message,
      /Remove pattern from spm\.config\.json[^\n]*sources[^\n]*exclude[^\n]*Package\.swift/
    );
    return true;
  });
});

it('rejects a declared empty pattern in spm.config.json', async () => {
  const input = fixture();
  const target = input.product.targets[0] as SourceTarget;
  target.pattern = '';
  await rejectsManifest(input, /: spm\.config\.json declares pattern "",/);
});

it('reports the moduleMapContent conflict with read-only manifest-owned headers', async () => {
  const input = fixture('.target(name: "Main", path: "ios", publicHeadersPath: "include")', {
    'ios/Main.m': 'int value(void) { return 1; }',
    'ios/include/Main.h': 'int value(void);',
  });
  const target = input.product.targets[0] as SourceTarget;
  target.moduleMapContent = 'module Main { header "Main.h" export * }';
  await rejectsManifest(input, /: spm\.config\.json declares moduleMapContent,/);
});

it('merges sibling and external dependencies in equivalent Mode A order without duplicates', async () => {
  const input = fixture(
    '.target(name: "Main", dependencies: ["Helper", "Helper"], path: "ios"), .target(name: "Helper", path: "helper")',
    { 'ios/Main.swift': 'public let value = 1', 'helper/Helper.swift': 'public let helper = 1' }
  );
  input.product.externalDependencies = ['React', 'Hermes', 'React'];
  const targets = await resolve(input.root, input.product);
  assert.deepEqual(targets.find((target) => target.name === 'Main')?.dependencies, [
    'Helper',
    'React',
    'Hermes',
  ]);
  assert.deepEqual(targets.find((target) => target.name === 'Helper')?.dependencies, [
    'React',
    'Hermes',
  ]);

  fs.renameSync(path.join(input.root, 'Package.swift'), path.join(input.root, 'Input.swift'));
  input.product.targets = [
    { type: 'swift', name: 'Main', path: 'ios', dependencies: ['Helper', 'React', 'Hermes'] },
    { type: 'swift', name: 'Helper', path: 'helper', dependencies: ['React', 'Hermes'] },
  ];
  const output = path.join(input.pkg.buildPath, 'generated/Fixture/Package.swift');
  await SPMPackage.writePackageSwiftAsync(
    input.pkg,
    input.product,
    'Debug',
    output,
    path.dirname(output)
  );
  const modeA = fs.readFileSync(output, 'utf8');
  const dependencyLine = targets[0].dependencies
    .map((dependency) => JSON.stringify(dependency))
    .join(', ');
  assert.ok(
    modeA.includes(`dependencies: [${dependencyLine}],`),
    'Mode B dependency order matches Mode A'
  );
});

// The generated manifest links Foundation as a framework, which only Apple platforms provide.
it(
  'stages real directories and compiles a source relying on generated exports',
  { skip: process.platform !== 'darwin' && 'links Foundation, which needs an Apple platform' },
  async () => {
    const input = fixture(
      '.target(name: "Main", dependencies: ["Helper"], path: "ios", exclude: ["Tests"]), .target(name: "Helper", path: "helper")',
      {
        'ios/UsesExports.swift':
          'public func fixtureDate() -> Date { Date() }\npublic let fromHelper = helper',
        'ios/Tests/Bad.swift': 'THIS MUST NOT COMPILE',
        'helper/Helper.swift': 'public let helper = 42',
      }
    );
    const sourceBefore = fs.readFileSync(path.join(input.root, 'ios/UsesExports.swift'), 'utf8');
    assert.doesNotMatch(sourceBefore, /import/);
    await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
    await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
    const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
    assert.ok(fs.lstatSync(path.join(generated, 'Main/src')).isSymbolicLink());
    assert.equal(
      fs.realpathSync(path.join(generated, 'Main/src')),
      fs.realpathSync(path.join(input.root, 'ios'))
    );
    const exports = fs.readFileSync(path.join(generated, 'Main/Fixture+Exports.swift'), 'utf8');
    assert.match(exports, /@_exported import Foundation/);
    assert.match(exports, /@_exported import Helper/);
    assert.ok(!fs.existsSync(path.join(input.root, 'ios/Fixture+Exports.swift')));
    const manifest = fs.readFileSync(path.join(generated, 'Package.swift'), 'utf8');
    assert.match(manifest, /targets: \["Main"\]/);
    assert.match(manifest, /sources: \["src", "Fixture\+Exports.swift"\]/);
    assert.match(manifest, /exclude: \["src\/Tests"\]/);
    const swiftOptions = [
      '--disable-sandbox',
      '--package-path',
      generated,
      '--cache-path',
      path.join(input.root, 'cache'),
      '--config-path',
      path.join(input.root, 'config'),
      '--security-path',
      path.join(input.root, 'security'),
      '--scratch-path',
      path.join(input.root, 'swift-build'),
    ];
    const env = { ...process.env, CLANG_MODULE_CACHE_PATH: path.join(input.root, 'clang-cache') };
    const described = execFileSync('swift', ['package', ...swiftOptions, 'describe'], {
      encoding: 'utf8',
      env,
    });
    assert.match(described, /UsesExports.swift/);
    assert.match(described, /Fixture\+Exports.swift/);
    assert.doesNotMatch(described, /Bad.swift/);
    const built = execFileSync('swift', ['build', ...swiftOptions], { encoding: 'utf8', env });
    assert.match(built, /Build complete!/);
    assert.equal(
      fs.readFileSync(path.join(input.root, 'ios/UsesExports.swift'), 'utf8'),
      sourceBefore
    );
  }
);

it('keeps config settings and platforms while replacing structure and membership', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios"), .target(name: "Unused", path: "unused")',
    { 'ios/Main.swift': 'public let value = 1', 'unused/Unused.swift': 'public let unused = 1' },
    { dependencies: REMOTE_PACKAGE }
  );
  const target = input.product.targets[0] as SourceTarget;
  target.compilerFlags = ['-DCONFIG_FLAG=1'];
  target.linkerFlags = ['-lz'];
  input.product.spmPackages = [
    { url: 'https://example.com/remote.git', productName: 'Remote', version: { exact: '1.2.3' } },
  ];
  const output = SPMGenerator.getSwiftPackagePath(input.pkg, input.product);
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Release');
  const manifest = fs.readFileSync(output, 'utf8');
  assert.match(manifest, /\.macOS\(\.v11\)/);
  assert.doesNotMatch(manifest, /v13|Unused/);
  assert.match(manifest, /\.linkedFramework\("Foundation"\)/);
  assert.match(manifest, /CONFIG_FLAG=1/);
  assert.match(manifest, /-lz/);
  assert.match(manifest, /\.package\(url: "https:\/\/example.com\/remote.git", exact: "1.2.3"\)/);
});

function rejectsLinkedFrameworks(target: string, offender: string) {
  return (error: Error) => {
    assert.ok(!(error instanceof TypeError), `Expected a diagnostic, got ${error.stack}`);
    assert.ok(
      error.message.startsWith(
        `Cannot read "linkedFrameworks" for target "${target}": ${offender} is not`
      ),
      `Unexpected message: ${error.message}`
    );
    return true;
  };
}

const generationStages = {
  manifest: (input: ReturnType<typeof fixture>) =>
    SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug'),
  sources: (input: ReturnType<typeof fixture>) =>
    SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product),
};

// Keep `null`: in Mode B it is the only value that fails if the checked-in-manifest read loses its
// validation, because `?? []` would turn it into an empty list, while `["Foo.Bar"]` would still be
// caught later by resolveSourceTarget.
for (const linkedFrameworks of [null, ['Foo.Bar']]) {
  const label = JSON.stringify(linkedFrameworks);
  const offender = JSON.stringify(linkedFrameworks?.[0] ?? linkedFrameworks);

  for (const mode of ['A', 'B'] as const) {
    for (const [stage, generate] of Object.entries(generationStages)) {
      it(`rejects linkedFrameworks ${label} on a source target in Mode ${mode} during ${stage} generation`, async () => {
        const input = fixture();
        if (mode === 'A') fs.rmSync(path.join(input.root, 'Package.swift'));
        (input.product.targets[0] as SourceTarget).linkedFrameworks =
          linkedFrameworks as unknown as string[];
        await assert.rejects(generate(input), rejectsLinkedFrameworks('Main', offender));
      });
    }

    it(`rejects linkedFrameworks ${label} on a framework target in Mode ${mode}`, async () => {
      const input = fixture();
      if (mode === 'A') fs.rmSync(path.join(input.root, 'Package.swift'));
      fs.mkdirSync(path.join(input.root, 'Vendor.xcframework'));
      input.product.targets = [
        { type: 'swift', name: 'Main', path: 'ios', dependencies: ['Vendor'] },
        {
          type: 'framework',
          name: 'Vendor',
          path: 'Vendor.xcframework',
          linkedFrameworks: linkedFrameworks as unknown as string[],
        },
      ];
      await assert.rejects(
        generationStages.manifest(input),
        rejectsLinkedFrameworks('Vendor', offender)
      );
    });
  }
}

it('checks only the package-root manifest', async () => {
  const input = fixture();
  fs.mkdirSync(path.join(input.root, 'apple'));
  fs.renameSync(
    path.join(input.root, 'Package.swift'),
    path.join(input.root, 'apple/Package.swift')
  );
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const manifest = fs.readFileSync(
    SPMGenerator.getSwiftPackagePath(input.pkg, input.product),
    'utf8'
  );
  assert.match(manifest, /sources: nil/);
  assert.doesNotMatch(manifest, /Fixture\+Exports.swift/);
});

it('preserves resolved SPM product references and sibling transitive dependencies', async () => {
  const input = fixture(undefined, undefined, { dependencies: REMOTE_PACKAGE });
  const target = input.product.targets[0] as SourceTarget;
  target.dependencies = ['Remote', 'Sibling'];
  input.product.spmPackages = [
    { url: 'https://example.com/remote.git', productName: 'Remote', version: { exact: '1.2.3' } },
  ];
  const sibling: SPMProduct = {
    name: 'Sibling',
    podName: 'Sibling',
    platforms: ['macOS(.v11)'],
    externalDependencies: ['React'],
    targets: [{ name: 'Sibling', type: 'swift', path: 'sibling' }],
  };
  input.pkg.getSwiftPMConfiguration = () => ({ products: [sibling, input.product] });
  fs.mkdirSync(path.join(input.pkg.buildPath, 'output/debug/xcframeworks/Sibling.xcframework'), {
    recursive: true,
  });
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const manifest = fs.readFileSync(
    SPMGenerator.getSwiftPackagePath(input.pkg, input.product),
    'utf8'
  );
  assert.match(
    manifest,
    /dependencies: \[\.product\(name: "Remote", package: "remote"\), "Sibling", "React"\]/
  );
});

it('uses manifest resources even when config resources no longer exist', async () => {
  const input = fixture('.target(name: "Main", path: "ios", resources: [.copy("asset.txt")])', {
    'ios/Thing.swift': 'public let value = 1',
    'ios/asset.txt': 'resource',
  });
  (input.product.targets[0] as SourceTarget).resources = [{ path: 'missing-old-layout.txt' }];
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const manifest = fs.readFileSync(
    SPMGenerator.getSwiftPackagePath(input.pkg, input.product),
    'utf8'
  );
  assert.match(manifest, /\.copy\("src\/asset.txt"\)/);
  assert.doesNotMatch(manifest, /missing-old-layout/);
});

it('prefixes implicit C public headers and builds through the source symlink', async () => {
  const input = fixture('.target(name: "Main", path: "native")', {
    'native/Thing.c': '#include "Thing.h"\nint thing(void) { return 1; }',
    'native/include/Thing.h': 'int thing(void);',
  });
  input.product.targets[0].type = 'objc';
  (input.product.targets[0] as SourceTarget).linkedFrameworks = [];
  assert.equal((await resolve(input.root, input.product))[0].publicHeadersPath, 'src/include');
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
  const options = [
    '--disable-sandbox',
    '--package-path',
    generated,
    '--cache-path',
    path.join(input.root, 'cache'),
    '--config-path',
    path.join(input.root, 'config'),
    '--security-path',
    path.join(input.root, 'security'),
    '--scratch-path',
    path.join(input.root, 'swift-build'),
  ];
  const env = { ...process.env, CLANG_MODULE_CACHE_PATH: path.join(input.root, 'clang-cache') };
  assert.match(
    execFileSync('swift', ['package', ...options, 'describe'], { encoding: 'utf8', env }),
    /Thing.c/
  );
  assert.match(
    execFileSync('swift', ['build', ...options], { encoding: 'utf8', env }),
    /Build complete!/
  );
});

it('rejects resource localization rather than silently removing it', async () => {
  await rejectsManifest(
    fixture(
      '.target(name: "Main", path: "ios", resources: [.process("message.txt", localization: .base)])',
      {
        'ios/Thing.swift': 'public let value = 1',
        'ios/message.txt': 'localized',
      }
    ),
    /: resource "message\.txt" uses localization metadata that the generated target cannot represent\./
  );
});

it('rejects a default localization rather than silently removing it', async () => {
  const input = fixture();
  const manifestPath = path.join(input.root, 'Package.swift');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  fs.writeFileSync(
    manifestPath,
    manifest.replace('name: "fixture",', 'name: "fixture",\n  defaultLocalization: "en",')
  );
  await rejectsManifest(
    input,
    /: the manifest declares default localization "en", which the generated target cannot represent\./
  );
});

it('rejects target build settings rather than silently dropping them', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", linkerSettings: [.linkedFramework("AppKit")])'),
    /: target "Main" declares settings \[.*"AppKit".*\], .* in spm\.config\.json instead: .*linkedFrameworks\.$/
  );
});

it('ignores stale config edges between source targets', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios"), .target(name: "Helper", path: "helper")',
    {
      'ios/Thing.swift': 'public let value = 1',
      'helper/Helper.swift': 'public let helper = 1',
    }
  );
  (input.product.targets[0] as SourceTarget).dependencies = ['Helper'];
  assert.deepEqual((await resolve(input.root, input.product))[0].dependencies, []);
});

for (const typo of [
  { type: 'objc', name: 'Typo' },
  { type: 'objc', name: 'Typo', path: 'ios/typo' },
] as const) {
  it(`rejects a config target the manifest does not declare${'path' in typo ? ', even with a path' : ''}`, async () => {
    const input = fixture();
    input.product.targets.push(typo);
    await rejectsManifest(
      input,
      /spm\.config\.json declares this target, but the checked-in Package\.swift declares no regular target with that name/,
      'Typo'
    );
  });
}

it('rejects a config target the manifest declares but the library product never reaches', async () => {
  const input = fixture(
    '.target(name: "Main", path: "ios"), .target(name: "Helper", path: "helper")',
    { 'ios/Main.swift': 'public let value = 1', 'helper/Helper.swift': 'public let helper = 1' }
  );
  input.product.targets.push({ type: 'swift', name: 'Helper', path: 'helper' });
  await rejectsManifest(input, /the library product "Fixture" does not reach it/, 'Helper');
});

it('uses the evaluated manifest rather than matching dependency text in comments', async () => {
  const input = fixture(undefined, undefined, {
    imports: '// Example only: .product(name: "Remote", package: "remote")',
  });
  assert.equal((await resolve(input.root, input.product))[0].name, 'Main');
});

it('rejects conditional sibling dependencies instead of making them unconditional', async () => {
  await rejectsManifest(
    fixture(
      '.target(name: "Main", dependencies: [.target(name: "Helper", condition: .when(platforms: [.iOS]))], path: "ios"), .target(name: "Helper", path: "helper")',
      { 'ios/Thing.swift': 'public let value = 1', 'helper/Helper.swift': 'public let helper = 1' }
    ),
    /: dependency "Helper" has a platform condition, but the generated dependency format cannot preserve it\./
  );
});

it('rejects an undeclared Ghost dependency instead of silently dropping it', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", dependencies: ["Ghost"], path: "ios")'),
    /unknown dependency "Ghost"/
  );
});

it('rejects a legal build-tool plugin application', async () => {
  const input = fixture(
    `.target(name: "Main", path: "ios", plugins: [.plugin(name: "Generate")]),
     .plugin(name: "Generate", capability: .buildTool(), path: "plugin")`,
    {
      'ios/Value.swift': 'public let value = 1',
      'plugin/Generate.swift':
        'import PackagePlugin\n@main struct Generate: BuildToolPlugin { func createBuildCommands(context: PluginContext, target: Target) throws -> [Command] { [] } }',
    }
  );
  assert.match(
    execFileSync(
      'swift',
      ['package', '--disable-sandbox', '--package-path', input.root, 'describe'],
      {
        encoding: 'utf8',
        env: { ...process.env, CLANG_MODULE_CACHE_PATH: path.join(input.root, 'clang-cache') },
      }
    ),
    /Generate/
  );
  await rejectsManifest(input, /non-regular target "Generate" \(plugin\)/);
});

it('preserves the environment-owned vendored binary target in Mode B', async () => {
  const input = fixture();
  fs.mkdirSync(path.join(input.root, 'Vendor.xcframework'));
  input.product.targets = [
    { type: 'swift', name: 'Main', path: 'ios', dependencies: ['Vendor'] },
    { type: 'framework', name: 'Vendor', path: 'Vendor.xcframework' },
  ];
  const output = SPMGenerator.getSwiftPackagePath(input.pkg, input.product);
  fs.renameSync(path.join(input.root, 'Package.swift'), path.join(input.root, 'Input.swift'));
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const modeA = fs.readFileSync(output, 'utf8');
  fs.renameSync(path.join(input.root, 'Input.swift'), path.join(input.root, 'Package.swift'));
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const modeB = fs.readFileSync(output, 'utf8');
  const binary = /\.binaryTarget\(\s*name: "Vendor",\s*path: "[^"]+"\s*\)/;
  assert.match(modeA, binary);
  assert.match(modeB, /dependencies: \["Vendor"\]/);
  assert.equal(modeB.match(binary)?.[0], modeA.match(binary)?.[0]);
});

for (const stage of ['manifest', 'sources'] as const) {
  it(`keeps third-party root manifests in Mode A during ${stage} generation`, async () => {
    const input = fixture();
    const externalRoot = path.join(process.env.EXPO_ROOT_DIR!, 'node_modules/react-native-screens');
    fs.mkdirSync(path.dirname(externalRoot), { recursive: true });
    fs.renameSync(input.root, externalRoot);
    input.pkg.path = externalRoot;
    input.product.targets = [
      { type: 'swift', name: 'Main', path: 'ios', linkedFrameworks: ['Foundation'] },
    ];
    if (stage === 'manifest') {
      await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
      const manifest = fs.readFileSync(
        SPMGenerator.getSwiftPackagePath(input.pkg, input.product),
        'utf8'
      );
      assert.match(manifest, /sources: nil/);
    } else {
      await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
      const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
      assert.equal(fs.existsSync(path.join(generated, 'Main/src')), false);
      assert.ok(fs.lstatSync(path.join(generated, 'Main/Main.swift')).isSymbolicLink());
    }
  });
}

it('respects config publicHeaders false', async () => {
  const input = fixture(undefined, { 'ios/Main.c': 'int value(void) { return 1; }' });
  input.product.targets = [{ type: 'objc', name: 'Main', path: 'ios', publicHeaders: false }];
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  assert.doesNotMatch(
    fs.readFileSync(SPMGenerator.getSwiftPackagePath(input.pkg, input.product), 'utf8'),
    /publicHeadersPath:/
  );
});

for (const rule of [
  'sources: ["../other"]',
  'exclude: ["../other"]',
  'resources: [.copy("../other")]',
  'publicHeadersPath: "../other"',
]) {
  it(`rejects paths escaping src for ${rule}`, async () => {
    await rejectsManifest(
      fixture(`.target(name: "Main", path: "ios", ${rule})`, {
        'ios/Main.c': 'int value(void) { return 1; }',
        'other/Other.c': 'int other(void) { return 2; }',
      }),
      /path "\.\.\/other" escapes the target source directory/
    );
  });
}

it('escapes quoted source paths in emitted Swift', async () => {
  const input = fixture('.target(name: "Main", path: "ios", sources: ["a\\"b.swift"])', {
    'ios/a"b.swift': 'public let value = 1',
  });
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
  const dumped = execFileSync(
    'swift',
    ['package', '--disable-sandbox', '--package-path', generated, 'dump-package'],
    {
      encoding: 'utf8',
      env: { ...process.env, CLANG_MODULE_CACHE_PATH: path.join(input.root, 'clang-cache') },
    }
  );
  assert.deepEqual(JSON.parse(dumped).targets[0].sources, [
    'src/a"b.swift',
    'Fixture+Exports.swift',
  ]);
});

it('prunes Mode A staging and stale exports without touching real sources', async () => {
  const input = fixture();
  (input.product.targets[0] as SourceTarget).path = 'ios';
  fs.renameSync(path.join(input.root, 'Package.swift'), path.join(input.root, 'Input.swift'));
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  const staged = path.join(
    SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product),
    'Main'
  );
  assert.ok(fs.lstatSync(path.join(staged, 'Main.swift')).isSymbolicLink());
  fs.renameSync(path.join(input.root, 'Input.swift'), path.join(input.root, 'Package.swift'));
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  assert.deepEqual(fs.readdirSync(staged).sort(), ['Fixture+Exports.swift', 'src']);
  (input.product.targets[0] as SourceTarget).linkedFrameworks = [];
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  assert.deepEqual(fs.readdirSync(staged), ['src']);
  assert.equal(
    fs.readFileSync(path.join(input.root, 'ios/Main.swift'), 'utf8'),
    'public let value = 1'
  );
});

it('dumps a package only once while resolving fresh product settings', async () => {
  const input = fixture();
  const bin = path.join(input.root, 'bin');
  const counter = path.join(input.root, 'swift-calls');
  fs.mkdirSync(bin);
  const swift = execFileSync('which', ['swift'], { encoding: 'utf8' }).trim();
  fs.writeFileSync(
    path.join(bin, 'swift'),
    `#!/bin/sh\nprintf 'call\\n' >> '${counter}'\nexec '${swift}' "$@"\n`,
    { mode: 0o755 }
  );
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath}`;
  try {
    await resolve(input.root, input.product);
    (input.product.targets[0] as SourceTarget).linkedFrameworks = [];
    assert.deepEqual((await resolve(input.root, input.product))[0].linkedFrameworks, []);
    await resolve(input.root, { ...input.product });
    assert.equal(fs.readFileSync(counter, 'utf8'), 'call\n');
    fs.appendFileSync(path.join(input.root, 'Package.swift'), '\n// manifest changed');
    await resolve(input.root, input.product);
    assert.equal(fs.readFileSync(counter, 'utf8'), 'call\ncall\n');
  } finally {
    process.env.PATH = originalPath;
  }
});

it('retains by-name dependencies owned by externalDependencies and spmPackages', async () => {
  const input = fixture(
    '.target(name: "Main", dependencies: ["React", "Remote"], path: "ios")',
    undefined,
    { dependencies: REMOTE_PACKAGE }
  );
  (input.product.targets[0] as SourceTarget).linkedFrameworks = [];
  input.product.externalDependencies = ['React'];
  input.product.spmPackages = [
    { url: 'https://example.com/remote.git', productName: 'Remote', version: { exact: '1.2.3' } },
  ];
  const [target] = await resolve(input.root, input.product);
  assert.deepEqual(target.dependencies, ['React', 'Remote']);
  assert.deepEqual(target.sources, ['src']);
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  assert.match(
    fs.readFileSync(SPMGenerator.getSwiftPackagePath(input.pkg, input.product), 'utf8'),
    /dependencies: \["React", \.product\(name: "Remote", package: "remote"\)\]/
  );
});

it('recognizes a scoped in-repo package', async () => {
  const input = fixture();
  const scopedRoot = path.join(process.env.EXPO_ROOT_DIR!, 'packages/@expo/fixture');
  fs.mkdirSync(path.dirname(scopedRoot), { recursive: true });
  fs.renameSync(input.root, scopedRoot);
  input.pkg.path = scopedRoot;
  await SPMGenerator.generateSwiftPackageAsync(input.pkg, input.product, 'Debug');
  assert.match(
    fs.readFileSync(SPMGenerator.getSwiftPackagePath(input.pkg, input.product), 'utf8'),
    /sources: \["src", "Fixture\+Exports.swift"\]/
  );
});

for (const directory of ['Templates', 'Tests']) {
  it(`treats ${directory} containing C files as resources, not sources`, async () => {
    const input = fixture(
      `.target(name: "Main", path: "ios", resources: [.copy("${directory}")])`,
      {
        'ios/Value.swift': 'public let value = 1',
        [`ios/${directory}/template.c`]: 'int template(void) { return 1; }',
      }
    );
    const [target] = await resolve(input.root, input.product);
    assert.equal(target.type, 'swift');
    assert.deepEqual(target.resources, [{ path: `src/${directory}`, rule: 'copy' }]);
  });
}

it('rejects packages/fixture symlinked to node_modules/third-party', () => {
  const input = fixture();
  const external = path.join(process.env.EXPO_ROOT_DIR!, 'node_modules/third-party');
  fs.mkdirSync(path.dirname(external), { recursive: true });
  fs.renameSync(input.root, external);
  fs.symlinkSync(external, input.root);
  assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
});

for (const stage of ['manifest', 'sources'] as const) {
  it(`keeps a real ExternalPackage workspace link in Mode A during ${stage} generation`, async () => {
    const input = fixture();
    const repo = fs.realpathSync(process.env.EXPO_ROOT_DIR!);
    process.env.EXPO_ROOT_DIR = repo;
    const name = `third-party-${path.basename(repo)}`;
    fs.writeFileSync(
      path.join(input.root, 'package.json'),
      JSON.stringify({ name, version: '1.0.0' })
    );
    const link = path.join(repo, 'node_modules', name);
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(input.root, link);
    (input.product.targets[0] as SourceTarget).path = 'ios';
    const configPath = path.join(repo, 'config');
    fs.mkdirSync(configPath);
    fs.writeFileSync(
      path.join(configPath, 'spm.config.json'),
      JSON.stringify({ products: [input.product] })
    );
    const pkg = new ExternalPackage(configPath, name);
    assert.equal(fs.realpathSync(pkg.path), fs.realpathSync(input.root));
    if (stage === 'manifest') {
      await SPMGenerator.generateSwiftPackageAsync(pkg, input.product, 'Debug');
      assert.match(
        fs.readFileSync(SPMGenerator.getSwiftPackagePath(pkg, input.product), 'utf8'),
        /sources: nil/
      );
    } else {
      await SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, input.product);
      const generated = SPMGenerator.getGeneratedProductFilesPath(pkg, input.product);
      assert.equal(fs.existsSync(path.join(generated, 'Main/src')), false);
      assert.ok(fs.lstatSync(path.join(generated, 'Main/Main.swift')).isSymbolicLink());
    }
  });
}

it('recognizes PACKAGES on a case-insensitive filesystem', (t: TestContext) => {
  const input = fixture();
  const flipped = path.join(process.env.EXPO_ROOT_DIR!, 'PACKAGES/fixture');
  // The precondition is a volume that folds case, which no platform check can stand in for: macOS
  // can be formatted either way. Ask the volume the fixture actually lives on.
  if (!fs.existsSync(path.join(flipped, 'Package.swift'))) {
    t.skip('the volume holding the fixture does not fold case');
    return;
  }
  input.pkg.path = flipped;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), fs.realpathSync.native(input.root));
});

it('opts a first-party package carrying Package.swift into Mode B', () => {
  const input = fixture();
  assert.equal(resolveCheckedInManifestRoot(input.pkg), fs.realpathSync.native(input.root));
});

it('rejects a package when the packages root is inside node_modules', () => {
  const input = fixture();
  const repoRoot = process.env.EXPO_ROOT_DIR!;
  const nestedRepoRoot = path.join(repoRoot, 'node_modules/expo');
  fs.mkdirSync(nestedRepoRoot, { recursive: true });
  fs.renameSync(path.join(repoRoot, 'packages'), path.join(nestedRepoRoot, 'packages'));
  input.pkg.path = path.join(nestedRepoRoot, 'packages/fixture');
  process.env.EXPO_ROOT_DIR = nestedRepoRoot;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
});

it('contains a package and a scoped package under the packages directory', () => {
  const root = '/repo/packages';
  assert.equal(isFirstPartyPackagePath(root, '/repo/packages/fixture'), true);
  assert.equal(isFirstPartyPackagePath(root, '/repo/packages/@scope/fixture'), true);
});

for (const [reason, candidate] of [
  ['the packages directory itself', '/repo/packages'],
  ['a directory outside the packages directory', '/repo/other/fixture'],
  ['a node_modules directory under a scope', '/repo/packages/@scope/node_modules'],
  ['a package nested below the scope level', '/repo/packages/@scope/fixture/nested'],
] as const) {
  it(`rejects ${reason}`, () => {
    assert.equal(isFirstPartyPackagePath('/repo/packages', candidate), false);
  });
}

function captureConsoleLines(level: 'debug' | 'warn', run: () => void): string[] {
  const lines: string[] = [];
  const original = console[level];
  console[level] = (...args: unknown[]) => {
    lines.push(args.map((argument) => String(argument)).join(' '));
  };
  try {
    run();
  } finally {
    console[level] = original;
  }
  return lines;
}

function captureDebugLines(run: () => void): string[] {
  return captureConsoleLines('debug', run);
}

function captureWarnLines(run: () => void): string[] {
  return captureConsoleLines('warn', run);
}

/** A second repository root beside the fixture's own, standing in for an EXPO_ROOT_DIR that points
 * at a different checkout: every package of the fixture repository then fails containment. */
function otherRepositoryRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'other-repo-'));
  temporaryDirectories.push(root);
  fs.mkdirSync(path.join(root, 'packages'));
  return root;
}

it('rejects a sibling that differs from the packages directory only in case', () => {
  assert.equal(isFirstPartyPackagePath('/repo/packages', '/repo/PACKAGES/fixture'), false);
});

it('answers false when the packages directory does not exist', () => {
  const input = fixture();
  const missing = path.join(input.root, 'missing-checkout');
  process.env.EXPO_ROOT_DIR = missing;
  const lines = captureDebugLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  assert.ok(
    lines.some((line) => line.includes(path.join(missing, 'packages'))),
    `Expected a debug line naming the directory that could not be resolved, got ${JSON.stringify(lines)}`
  );
});

it('names both canonical paths when containment rejects', () => {
  const input = fixture();
  const other = otherRepositoryRoot();
  process.env.EXPO_ROOT_DIR = other;
  const lines = captureWarnLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  const logged = lines.join('\n');
  for (const canonical of [
    fs.realpathSync.native(path.join(other, 'packages')),
    fs.realpathSync.native(input.root),
  ]) {
    assert.ok(
      logged.includes(canonical),
      `Expected a warning naming ${canonical}, got ${JSON.stringify(lines)}`
    );
  }
});

it('warns once per package when containment falls back to a generated manifest', () => {
  const input = fixture();
  const other = otherRepositoryRoot();
  process.env.EXPO_ROOT_DIR = other;
  const lines = captureWarnLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  assert.equal(lines.length, 1, `Expected exactly one warning, got ${JSON.stringify(lines)}`);
  for (const canonical of [
    fs.realpathSync.native(path.join(other, 'packages')),
    fs.realpathSync.native(input.root),
  ]) {
    assert.ok(
      lines[0].includes(canonical),
      `Expected the warning to name ${canonical}: ${lines[0]}`
    );
  }
});

it('rejects a package directory symlinked outside the packages directory', () => {
  const input = fixture();
  const outside = path.join(process.env.EXPO_ROOT_DIR!, 'vendor/fixture');
  fs.mkdirSync(path.dirname(outside), { recursive: true });
  fs.renameSync(input.root, outside);
  fs.symlinkSync(outside, input.root);
  assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
});

it('reports the package directory that does not resolve', () => {
  const input = fixture();
  input.pkg.path = path.join(process.env.EXPO_ROOT_DIR!, 'packages/absent');
  const lines = captureDebugLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  assert.ok(
    lines.some((line) => line.includes(input.pkg.path) && line.includes('did not resolve')),
    `Expected a debug line naming the package directory that could not be resolved, got ${JSON.stringify(lines)}`
  );
});

it('resolves a package reached through lexical .. traversal to its canonical directory', () => {
  const input = fixture();
  const repoRoot = process.env.EXPO_ROOT_DIR!;
  fs.mkdirSync(path.join(repoRoot, 'packages/anchor'));
  input.pkg.path = `${repoRoot}/packages/anchor/../fixture`;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), fs.realpathSync.native(input.root));
});

it('rejects a package path whose lexical and canonical spellings disagree', () => {
  const input = fixture();
  const repoRoot = process.env.EXPO_ROOT_DIR!;
  fs.rmSync(path.join(input.root, 'Package.swift'));
  fs.mkdirSync(path.join(repoRoot, 'packages/anchor'));
  const outside = path.join(repoRoot, 'vendor/fixture');
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, 'Package.swift'), '// outside the packages directory');
  fs.symlinkSync(path.join(repoRoot, 'packages/anchor'), path.join(repoRoot, 'vendor/link'));
  // Collapsed lexically this path is `vendor/fixture`, which holds the manifest; resolved through
  // the symlink it is `packages/fixture`, which passes containment. One path must answer both.
  input.pkg.path = `${repoRoot}/vendor/link/../fixture`;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
});

/** A first-party package reached through a real symlink, carrying a second, different
 * `Package.swift` at the lexical spelling of its path. `vendor/link` points at the real
 * `packages/anchor`, so `vendor/link/../fixture` collapses lexically to `vendor/fixture` and
 * resolves canonically to `packages/fixture`. Both manifests parse and they declare different
 * targets, so a caller that reads the raw package path instead of the validated one builds
 * "Decoy" and says so in its output. */
function fixtureBehindSymlink() {
  const input = fixture();
  const repoRoot = process.env.EXPO_ROOT_DIR!;
  fs.mkdirSync(path.join(repoRoot, 'packages/anchor'));
  const decoy = path.join(repoRoot, 'vendor/fixture');
  fs.mkdirSync(path.join(decoy, 'decoy'), { recursive: true });
  fs.writeFileSync(path.join(decoy, 'decoy/Decoy.swift'), 'public let decoy = 1');
  fs.writeFileSync(
    path.join(decoy, 'Package.swift'),
    `// swift-tools-version: 5.9
import PackageDescription
let package = Package(
  name: "Fixture",
  platforms: [.macOS(.v13)],
  products: [.library(name: "Fixture", targets: ["Decoy"])],
  targets: [.target(name: "Decoy", path: "decoy")]
)
`
  );
  fs.symlinkSync(path.join(repoRoot, 'packages/anchor'), path.join(repoRoot, 'vendor/link'));
  input.pkg.path = `${repoRoot}/vendor/link/../fixture`;
  return input;
}

it('stages the canonical manifest when the package path resolves through a symlink', async () => {
  const input = fixtureBehindSymlink();
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
  assert.equal(
    fs.realpathSync(path.join(generated, 'Main/src')),
    fs.realpathSync(path.join(input.root, 'ios'))
  );
  assert.equal(fs.existsSync(path.join(generated, 'Decoy')), false);
});

it('writes the canonical manifest targets when the package path resolves through a symlink', async () => {
  const input = fixtureBehindSymlink();
  const output = path.join(input.pkg.buildPath, 'generated/Fixture/Package.swift');
  await SPMPackage.writePackageSwiftAsync(
    input.pkg,
    input.product,
    'Debug',
    output,
    path.dirname(output)
  );
  const manifest = fs.readFileSync(output, 'utf8');
  assert.match(manifest, /name: "Main",/);
  assert.match(manifest, /sources: \["src", "Fixture\+Exports.swift"\]/);
  assert.doesNotMatch(manifest, /Decoy/);
});

it('rejects a dependency tree nested inside a first-party package', () => {
  const input = fixture();
  const nested = path.join(input.root, 'node_modules/evil');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, 'Package.swift'), '// a dependency of a first-party package');
  input.pkg.path = nested;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
});

it('says what to do when the package directory does not resolve', () => {
  const input = fixture();
  input.pkg.path = path.join(process.env.EXPO_ROOT_DIR!, 'packages/absent');
  const lines = captureDebugLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  assertLoggedNextStep(lines, /did not resolve/);
});

it('says what to do when the package is outside the packages directory', () => {
  const input = fixture();
  process.env.EXPO_ROOT_DIR = otherRepositoryRoot();
  const lines = captureWarnLines(() => {
    assert.equal(resolveCheckedInManifestRoot(input.pkg), null);
  });
  assertLoggedNextStep(lines, /is not a package directory under/);
});

it('opts a scoped first-party package into Mode B', () => {
  const input = fixture();
  const scoped = path.join(process.env.EXPO_ROOT_DIR!, 'packages/@expo/fixture');
  fs.mkdirSync(path.dirname(scoped), { recursive: true });
  fs.renameSync(input.root, scoped);
  input.pkg.path = scoped;
  assert.equal(resolveCheckedInManifestRoot(input.pkg), fs.realpathSync.native(scoped));
});

it('rejects a target path escaping the package root', async () => {
  const input = fixture('.target(name: "Main", path: "../secret")', {
    '../secret/Value.swift': 'public let value = 1',
  });
  await rejectsManifest(input, /path "\.\.\/secret" escapes/);
});

for (const rule of ['publicHeadersPath: "/abs/x"']) {
  it(`rejects absolute paths for ${rule}`, async () => {
    await rejectsManifest(
      fixture(`.target(name: "Main", path: "ios", ${rule})`),
      /path "\/abs\/x" escapes the target source directory/
    );
  });
}

function failFirstSwiftDump(input: ReturnType<typeof fixture>) {
  const bin = path.join(input.root, 'bin');
  const counter = path.join(input.root, 'swift-calls');
  const swift = execFileSync('which', ['swift'], { encoding: 'utf8' }).trim();
  fs.mkdirSync(bin);
  fs.writeFileSync(
    path.join(bin, 'swift'),
    `#!/bin/sh
if [ ! -f '${counter}' ]; then
  printf 'failed\\n' > '${counter}'
  echo 'transient dump failure' >&2
  exit 1
fi
printf 'success\\n' >> '${counter}'
exec '${swift}' "$@"
`,
    { mode: 0o755 }
  );
  return { bin, counter };
}

function stubSwiftDump(
  input: ReturnType<typeof fixture>,
  target: Record<string, unknown>,
  manifest: Record<string, unknown> = {}
) {
  const bin = path.join(input.root, 'bin');
  const dumped = {
    name: 'fixture',
    products: [{ name: 'Fixture', type: { library: ['automatic'] }, targets: ['Main'] }],
    targets: [{ name: 'Main', type: 'regular', path: 'ios', ...target }],
    ...manifest,
  };
  fs.mkdirSync(bin, { recursive: true });
  const script = `#!/bin/sh\ncat <<'JSON'\n${JSON.stringify(dumped)}\nJSON\n`;
  fs.writeFileSync(path.join(bin, 'swift'), script, { mode: 0o755 });
  return bin;
}

async function withSwiftOnPath(bin: string, run: () => Promise<void>) {
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath}`;
  try {
    await run();
  } finally {
    process.env.PATH = originalPath;
  }
}

for (const [rule, dumped] of [
  ['sources', { sources: ['/abs/x'] }],
  ['exclude', { exclude: ['/abs/x'] }],
  ['resources', { resources: [{ path: '/abs/x', rule: { copy: {} } }] }],
  ['publicHeadersPath', { publicHeadersPath: '/abs/x' }],
] as const) {
  it(`rejects an absolute ${rule} path reported by a dumped manifest`, async () => {
    const input = fixture();
    await withSwiftOnPath(stubSwiftDump(input, dumped), () =>
      rejectsManifest(input, /path "\/abs\/x" escapes the target source directory/)
    );
  });
}

// Swift rejects absolute sources, excludes and resources itself, so our guard never sees them
// from a real manifest. It stays as defence in depth for dumps we do not control; the four
// `rejects an absolute ... path reported by a dumped manifest` tests above reach it.
it('surfaces Swift rejecting an absolute sources entry before the guard runs', async () => {
  await rejectsManifest(
    fixture('.target(name: "Main", path: "ios", sources: ["/abs/x"])'),
    /Swift Package Manager could not read .*fixture\/Package\.swift: swift package .* non-zero code/
  );
  // The same manifest without the absolute entry resolves, which is what pins the rejection above
  // to the absolute path rather than to anything else in the fixture.
  const control = fixture('.target(name: "Main", path: "ios")');
  assert.equal((await resolve(control.root, control.product))[0].name, 'Main');
});

it('retries a failed dump without changing the manifest stamp', async () => {
  const input = fixture();
  const { bin, counter } = failFirstSwiftDump(input);
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath}`;
  try {
    await assert.rejects(resolve(input.root, input.product), /could not read/);
    assert.equal((await resolve(input.root, input.product))[0].type, 'swift');
    assert.equal(fs.readFileSync(counter, 'utf8'), 'failed\nsuccess\n');
  } finally {
    process.env.PATH = originalPath;
  }
});

it('Mode A staging writes framework and internal dependency exports', async () => {
  const input = fixture(undefined, {
    'ios/Main.swift': 'public let value = 1',
    'helper/Helper.swift': 'public let helper = 1',
  });
  fs.unlinkSync(path.join(input.root, 'Package.swift'));
  input.product.targets = [
    {
      type: 'swift',
      name: 'Main',
      path: 'ios',
      linkedFrameworks: ['Foundation'],
      dependencies: ['Helper', 'Remote'],
    },
    { type: 'swift', name: 'Helper', path: 'helper' },
  ];
  await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
  const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
  const exports = fs.readFileSync(path.join(generated, 'Main/Fixture+Exports.swift'), 'utf8');
  assert.match(exports, /^@_exported import Foundation$/m);
  assert.match(exports, /^@_exported import Helper$/m);
  assert.doesNotMatch(exports, /import Remote/);
  assert.ok(fs.lstatSync(path.join(generated, 'Main/Main.swift')).isSymbolicLink());
  assert.equal(fs.existsSync(path.join(generated, 'Main/src')), false);
});

it('staging retries a transient failed dump before returning to Mode A', async () => {
  const input = fixture();
  (input.product.targets[0] as SourceTarget).path = 'ios';
  const { bin, counter } = failFirstSwiftDump(input);
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath}`;
  try {
    await assert.rejects(
      SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product),
      /could not read/
    );
    await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
    const generated = SPMGenerator.getGeneratedProductFilesPath(input.pkg, input.product);
    assert.ok(fs.lstatSync(path.join(generated, 'Main/src')).isSymbolicLink());
    assert.equal(fs.readFileSync(counter, 'utf8'), 'failed\nsuccess\n');
    fs.unlinkSync(path.join(input.root, 'Package.swift'));
    await SPMGenerator.generateIsolatedSourcesForTargetsAsync(input.pkg, input.product);
    assert.match(
      fs.readFileSync(path.join(generated, 'Main/Fixture+Exports.swift'), 'utf8'),
      /@_exported import Foundation/
    );
    assert.ok(fs.lstatSync(path.join(generated, 'Main/Main.swift')).isSymbolicLink());
    assert.equal(fs.readFileSync(counter, 'utf8'), 'failed\nsuccess\n');
  } finally {
    process.env.PATH = originalPath;
  }
});

for (const mutation of ['missing remediation', 'wrong quoted target'] as const) {
  it(`rejects diagnostics with ${mutation}`, () => {
    const target = mutation === 'wrong quoted target' ? 'Wrong' : 'Main';
    const remediation =
      mutation === 'missing remediation'
        ? ''
        : ' Set path in Package.swift to the source directory.';
    const error = new Error(
      `Cannot use the checked-in Package.swift for product "Fixture", target "${target}": its source path "Main/missing" does not resolve to a real directory.${remediation}`
    );
    assert.throws(
      () => assertManifestDiagnostic(error, /its source path/, 'Main'),
      assert.AssertionError
    );
  });
}

/** Every other Mode B test here builds a synthetic package in a temp directory, so none of them
 * would notice the day a real checked-in manifest stops resolving. expo-haptics is the pilot
 * conversion and this is the one test wired to the repository itself. */
it('pilot resolves the real expo-haptics manifest against its real sources', async () => {
  const packagePath = path.join(getExpoRepositoryRootDir(), 'packages/expo-haptics');
  const config: SPMConfig = JSON.parse(
    fs.readFileSync(path.join(packagePath, 'spm.config.json'), 'utf8')
  );
  const product = config.products.find((candidate) => candidate.name === 'ExpoHaptics');
  assert.ok(product, 'expo-haptics must declare an ExpoHaptics product');

  const pkg: SPMPackageSource = {
    path: packagePath,
    buildPath: path.join(packagePath, '.build'),
    packageName: 'expo-haptics',
    packageVersion: '0.0.0',
    getSwiftPMConfiguration: () => config,
  };
  assert.equal(
    resolveCheckedInManifestRoot(pkg),
    fs.realpathSync.native(packagePath),
    'expo-haptics must opt into Mode B by carrying a checked-in Package.swift'
  );

  const targets = await resolve(packagePath, product);
  assert.deepEqual(
    targets.map((target) => target.name),
    ['ExpoHaptics']
  );
  const [target] = targets;
  assert.equal(target.type, 'swift');
  assert.equal(target.sourceRoot, path.join(packagePath, 'ios'));
  // The podspec sits inside the target path; without the exclude SwiftPM warns that it is unhandled.
  assert.deepEqual(target.exclude, ['src/ExpoHaptics.podspec']);
  // `src` is the read-only symlink Mode B stages over sourceRoot; the exports file is generated
  // beside it because the config links Foundation and UIKit.
  assert.deepEqual(target.sources, ['src', 'ExpoHaptics+Exports.swift']);
  assert.deepEqual(
    fs
      .readdirSync(target.sourceRoot, { recursive: true, encoding: 'utf8' })
      .filter((entry) => /\.(swift|h|m|mm|c|cc|cpp)$/i.test(entry)),
    ['HapticsModule.swift']
  );
});
