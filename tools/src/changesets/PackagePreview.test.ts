import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import {
  assertPackedPreviewAsync,
  assertPreviewable,
  createPreviewManifest,
  filterPreviewPublishPlan,
  findDependencyConflicts,
  getPreviewDistTag,
  getPreviewPrerelease,
  getPublishedSpecs,
  parsePublishedSelections,
  readWorkspaceManifestsAsync,
  resolveExactVersion,
  resolvePreviewMembers,
  type WorkspaceManifest,
} from './PackagePreview';

function manifest(name: string, fields: Partial<WorkspaceManifest> = {}): WorkspaceManifest {
  return { name, version: '1.0.0', path: `/repo/packages/${name}`, ...fields };
}

describe('resolvePreviewMembers', () => {
  const manifests = [
    manifest('root', {
      dependencies: { a: 'workspace:~', b: 'workspace:~', lodash: '^4.0.0' },
      peerDependencies: { expo: '*' },
      devDependencies: { expo: 'workspace:*' },
    }),
    manifest('a', { dependencies: { c: 'workspace:~' } }),
    manifest('b', { optionalDependencies: { d: 'workspace:~' } }),
    manifest('c', { dependencies: { a: 'workspace:~' } }),
    manifest('d'),
    manifest('expo'),
  ];

  it('builds the root and selected members, and takes every other runtime dependency from npm', () => {
    assert.deepEqual(resolvePreviewMembers('root', manifests, ['b']), {
      built: ['b', 'root'],
      published: ['a', 'd'],
    });
  });

  it('follows the checkout edges only through built members, including cycles', () => {
    assert.deepEqual(resolvePreviewMembers('root', manifests, ['a', 'c']), {
      built: ['a', 'c', 'root'],
      published: ['b'],
    });
  });

  it('rejects a selection the built members cannot reach', () => {
    // `c` is only reachable through `a`, which comes from npm here.
    assert.throws(() => resolvePreviewMembers('root', manifests, ['c']), /c is not a runtime/);
    assert.throws(
      () => resolvePreviewMembers('root', manifests, ['expo']),
      /expo is not a runtime/
    );
  });

  it('rejects an unknown or private root, and a private runtime dependency', () => {
    assert.throws(() => resolvePreviewMembers('missing', manifests, []), /missing/);
    assert.throws(
      () => resolvePreviewMembers('root', [manifest('root', { private: true })], []),
      /private/
    );
    assert.throws(
      () =>
        resolvePreviewMembers(
          'root',
          [
            manifest('root', { dependencies: { secret: 'workspace:*' } }),
            manifest('secret', { private: true }),
          ],
          []
        ),
      /secret.*private/
    );
  });

  it('resolves the tested Observe combination from the real workspace', async () => {
    const workspace = await readWorkspaceManifestsAsync(EXPO_DIR);
    assert.deepEqual(
      resolvePreviewMembers('expo-observe', workspace, [
        'expo-app-metrics',
        'expo-updates-interface',
      ]),
      {
        built: ['expo-app-metrics', 'expo-observe', 'expo-updates-interface'],
        published: ['expo-eas-client'],
      }
    );
  });
});

describe('parsePublishedSelections', () => {
  it('accepts exact versions, including scoped names and prereleases', () => {
    assert.deepEqual(
      parsePublishedSelections(['expo-eas-client@58.0.2', '@expo/ui@1.0.0-alpha-x-1']),
      new Map([
        ['expo-eas-client', '58.0.2'],
        ['@expo/ui', '1.0.0-alpha-x-1'],
      ])
    );
  });

  it('rejects ranges, tags, missing versions and duplicates', () => {
    for (const value of ['expo-eas-client@~58.0.2', 'expo-eas-client@latest', 'expo-eas-client']) {
      assert.throws(() => parsePublishedSelections([value]), /exact version/);
    }
    assert.throws(() => parsePublishedSelections(['a@1.0.0', 'a@1.0.1']), /more than once/);
  });
});

describe('getPublishedSpecs', () => {
  it('prefers an explicit version and otherwise uses the SDK range', () => {
    assert.deepEqual(
      getPublishedSpecs(
        ['expo-eas-client', 'expo-updates-interface'],
        new Map([['expo-updates-interface', '58.0.1']]),
        { 'expo-eas-client': '~58.0.2' },
        '58.0.26'
      ),
      new Map([
        ['expo-eas-client', '~58.0.2'],
        ['expo-updates-interface', '58.0.1'],
      ])
    );
  });

  it('requires an explicit selection for a package the SDK does not list', () => {
    // `expo-updates-interface` is not in `bundledNativeModules.json`.
    assert.throws(
      () => getPublishedSpecs(['expo-updates-interface'], new Map(), {}, '58.0.26'),
      /expo 58\.0\.26 does not list expo-updates-interface.*--build expo-updates-interface.*--use/s
    );
  });

  it('rejects an explicit version for a package that is not taken from npm', () => {
    assert.throws(
      () => getPublishedSpecs([], new Map([['expo-observe', '1.0.0']]), {}, '58.0.26'),
      /expo-observe is not a dependency taken from npm/
    );
  });
});

describe('resolveExactVersion', () => {
  const versions = ['58.0.1', '58.0.2', '58.0.3-canary-1', '59.0.0-canary-1', '58.1.0'];

  it('picks the newest stable version in an SDK range', () => {
    assert.equal(resolveExactVersion('a', '~58.0.1', versions), '58.0.2');
  });

  it('accepts a published exact version, including a prerelease', () => {
    assert.equal(resolveExactVersion('a', '59.0.0-canary-1', versions), '59.0.0-canary-1');
  });

  it('fails when nothing matches', () => {
    assert.throws(
      () => resolveExactVersion('a', '58.0.9', versions),
      /a@58\.0\.9 is not published/
    );
    assert.throws(
      () => resolveExactVersion('a', '~60.0.0', versions),
      /a@~60\.0\.0 is not published/
    );
  });
});

describe('findDependencyConflicts', () => {
  it('reports a published package whose range excludes the selected version', () => {
    assert.deepEqual(
      findDependencyConflicts(
        [
          { name: 'pub', version: '58.0.2', dependencies: { built: '~58.0.1', other: '^1.0.0' } },
          { name: 'ok', version: '1.0.0', optionalDependencies: { pub: '~58.0.0' } },
        ],
        new Map([
          ['built', '59.0.0-alpha-root-1'],
          ['pub', '58.0.2'],
          ['ok', '1.0.0'],
        ])
      ),
      ['pub@58.0.2 depends on built@~58.0.1, which excludes 59.0.0-alpha-root-1']
    );
  });
});

describe('preview versions', () => {
  const selection = { 'expo-eas-client': '58.0.2' };
  const prerelease = getPreviewPrerelease('expo-observe', 'a'.repeat(40), selection);
  const preview = `59.0.0-${prerelease}`;
  const canary = '59.0.0-canary-20261125081156-1e66ad39b0dc';

  it('is deterministic for the same commit and selection', () => {
    assert.equal(
      getPreviewPrerelease('expo-observe', 'a'.repeat(40), { ...selection }),
      prerelease
    );
    assert.match(prerelease, /^alpha-expo-observe-aaaaaaaaaaaa-[0-9a-f]{8}$/);
  });

  it('changes when the selection changes', () => {
    assert.notEqual(
      getPreviewPrerelease('expo-observe', 'a'.repeat(40), { 'expo-eas-client': '58.0.1' }),
      prerelease
    );
  });

  it('sorts below a full canary so neither range selects the other', () => {
    assert.ok(semver.lt(preview, canary));
    assert.equal(semver.satisfies(preview, `~${canary}`), false);
    assert.equal(semver.satisfies(preview, '~58.0.2'), false);
    // A range on the preview would select a newer full canary, so members pin exact versions.
    assert.equal(semver.satisfies(canary, `~${preview}`), true);
  });

  it('uses a branch-specific dist-tag', () => {
    assert.equal(getPreviewDistTag('expo-observe', 'main'), 'preview-expo-observe');
    assert.equal(getPreviewDistTag('@expo/ui', 'sdk-58'), 'preview-expo-ui-sdk-58');
  });
});

describe('createPreviewManifest', () => {
  it('sets the version, pins selected members exactly and drops Android precompilation', () => {
    const result = createPreviewManifest(
      {
        name: 'root',
        version: '58.0.16',
        scripts: { build: 'expo-build', 'precompile-android': 'et prebuild', prepack: 'x' },
        dependencies: { a: 'workspace:~', pub: 'workspace:~', lodash: '^4.0.0' },
        optionalDependencies: { a: 'workspace:~' },
        peerDependencies: { a: '*' },
        devDependencies: { expo: 'workspace:*' },
      },
      '59.0.0-alpha-root-1',
      new Map([
        ['a', '59.0.0-alpha-root-1'],
        ['pub', '58.0.2'],
      ])
    );
    assert.deepEqual(result, {
      name: 'root',
      version: '59.0.0-alpha-root-1',
      scripts: { build: 'expo-build', prepack: 'x' },
      dependencies: { a: '59.0.0-alpha-root-1', pub: '58.0.2', lodash: '^4.0.0' },
      optionalDependencies: { a: '59.0.0-alpha-root-1' },
      peerDependencies: { a: '*' },
      devDependencies: { expo: 'workspace:*' },
    });
  });
});

describe('assertPreviewable', () => {
  let workspace: Map<string, WorkspaceManifest>;
  before(async () => {
    workspace = new Map(
      (await readWorkspaceManifestsAsync(EXPO_DIR)).map((manifest) => [manifest.name, manifest])
    );
  });

  it('accepts a module that ships native source', () => {
    assertPreviewable(workspace.get('expo-observe')!);
  });

  it('rejects a module whose published package needs prebuilt binaries', () => {
    assert.throws(
      () => assertPreviewable(workspace.get('expo-image')!),
      /expo-image publishes iOS/
    );
    assert.throws(
      () => assertPreviewable(workspace.get('expo-modules-core')!),
      /expo-modules-core/
    );
  });

  it('rejects a workspace peer range, which would come from the checkout instead of the SDK', () => {
    assert.throws(
      () => assertPreviewable(workspace.get('expo-standard-web-crypto')!),
      /expo-standard-web-crypto has the workspace peer dependency expo-crypto@workspace:\^/
    );
  });
});

describe('filterPreviewPublishPlan', () => {
  const entry = (name: string, version = '2.0.0-alpha') => ({
    kind: 'publish' as const,
    name,
    version,
    access: 'public',
    tag: 'latest',
  });
  const versions = new Map([
    ['a', '2.0.0-alpha'],
    ['root', '2.0.0-alpha'],
  ]);

  it('drops unrelated unpublished packages and sets the preview tag on every entry', () => {
    assert.deepEqual(
      filterPreviewPublishPlan(
        [[entry('a'), entry('leak')], [entry('root')], [entry('other-leak')]],
        versions,
        'preview-root'
      ),
      {
        plan: [
          [{ ...entry('a'), tag: 'preview-root' }],
          [{ ...entry('root'), tag: 'preview-root' }],
        ],
        published: [],
      }
    );
  });

  it('reports members missing from the plan as already published for a retry', () => {
    assert.deepEqual(filterPreviewPublishPlan([[entry('root')]], versions, 'preview-root'), {
      plan: [[{ ...entry('root'), tag: 'preview-root' }]],
      published: ['a'],
    });
  });

  it('fails on an unexpected version or a git-tag-only entry', () => {
    assert.throws(
      () => filterPreviewPublishPlan([[entry('root', '9.9.9')]], versions, 'preview-root'),
      /root@9\.9\.9/
    );
    assert.throws(
      () =>
        filterPreviewPublishPlan(
          [[{ kind: 'tag-only', name: 'root', version: '2.0.0-alpha' }]],
          versions,
          'preview-root'
        ),
      /tag-only/
    );
  });
});

describe('assertPackedPreviewAsync', () => {
  function packFixture(
    dependencies: Record<string, string>,
    tag: string,
    extraFile?: string,
    { name = 'root', integrity }: { name?: string; integrity?: string } = {}
  ): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-preview-pack-'));
    const packageDir = path.join(dir, 'src/package');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'packages'));
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({ name, version: '2.0.0-alpha', dependencies })
    );
    if (extraFile) {
      fs.mkdirSync(path.dirname(path.join(packageDir, extraFile)), { recursive: true });
      fs.writeFileSync(path.join(packageDir, extraFile), '');
    }
    execFileSync('tar', [
      '-czf',
      path.join(dir, 'packages/root.tgz'),
      '-C',
      path.join(dir, 'src'),
      'package',
    ]);
    const digest = createHash('sha256')
      .update(fs.readFileSync(path.join(dir, 'packages/root.tgz')))
      .digest('base64');
    const packed = {
      ...{ kind: 'publish', name: 'root', version: '2.0.0-alpha', tag },
      tarball: { path: 'packages/root.tgz', integrity: integrity ?? `sha256-${digest}` },
    };
    fs.writeFileSync(
      path.join(dir, 'publish-plan.json'),
      JSON.stringify({ version: 1, plan: [[packed]] })
    );
    return dir;
  }
  const versions = new Map([
    ['root', '2.0.0-alpha'],
    ['a', '2.0.0-alpha'],
    ['pub', '58.0.2'],
  ]);

  it('accepts exact pins, the preview tag and a source-only package', async () => {
    const dir = packFixture(
      { a: '2.0.0-alpha', pub: '58.0.2' },
      'preview-root',
      'android/build.gradle'
    );
    await assertPackedPreviewAsync(dir, versions, ['root'], 'preview-root');
  });

  it('rejects ranges, the default latest tag and a missing member', async () => {
    const dir = packFixture({ a: '~2.0.0-alpha', pub: '^58.0.2' }, 'latest');
    await assert.rejects(
      assertPackedPreviewAsync(dir, versions, ['root', 'a'], 'preview-root'),
      (error: Error) =>
        /has tag latest/.test(error.message) &&
        /depends on a@~2\.0\.0-alpha/.test(error.message) &&
        /depends on pub@\^58\.0\.2/.test(error.message) &&
        /expected a in the pack/.test(error.message)
    );
  });

  it('rejects a tarball whose digest or package name differs from the plan', async () => {
    const changed = packFixture({}, 'preview-root', undefined, { integrity: 'sha256-AAAA' });
    await assert.rejects(
      assertPackedPreviewAsync(changed, versions, ['root'], 'preview-root'),
      /root tarball digest does not match/
    );
    const renamed = packFixture({}, 'preview-root', undefined, { name: 'other' });
    await assert.rejects(
      assertPackedPreviewAsync(renamed, versions, ['root'], 'preview-root'),
      /root tarball has name other/
    );
  });

  it('rejects precompiled native artifacts', async () => {
    for (const file of [
      'local-maven-repo/expo/root/2.0.0-alpha/root-2.0.0-alpha.aar',
      'prebuilds/output/Root.xcframework.tar.gz',
      'android/prebuilt/native-libs.tar.xz',
    ]) {
      const dir = packFixture({}, 'preview-root', file);
      await assert.rejects(
        assertPackedPreviewAsync(dir, versions, ['root'], 'preview-root'),
        /contains precompiled native output/
      );
    }
  });
});
