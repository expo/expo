import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

type PackageSpec = {
  name: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

type Release = {
  name: string;
  type: string;
  oldVersion: string;
  changesets: string[];
  newVersion: string;
};

const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-changesets-policy-'));
const requireFromChangesets = createRequire(require.resolve('@changesets/cli/package.json'));

after(() => {
  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
});

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function importChangesetsDependency(moduleName: string): Promise<any> {
  return await import(pathToFileURL(requireFromChangesets.resolve(moduleName)).href);
}

async function runPolicyFixture(options: {
  name: string;
  packages: PackageSpec[];
  changes: Record<string, 'major' | 'minor' | 'patch'>;
  fixed?: string[][];
  linked?: string[][];
}): Promise<Release[]> {
  const root = path.join(fixtureDirectory, options.name);
  fs.mkdirSync(path.join(root, '.changeset'), { recursive: true });
  writeJson(path.join(root, 'package.json'), {
    name: `fixture-${options.name}`,
    private: true,
    version: '1.0.0',
  });
  fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
  writeJson(path.join(root, '.changeset', 'config.json'), {
    changelog: false,
    commit: false,
    access: 'public',
    baseBranch: 'main',
    updateInternalDependencies: 'patch',
    bumpVersionsWithWorkspaceProtocolOnly: true,
    ignore: [],
    fixed: options.fixed ?? [],
    linked: options.linked ?? [],
    privatePackages: { version: false, tag: false },
    ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH: {
      onlyUpdatePeerDependentsWhenOutOfRange: true,
      updateInternalDependents: 'out-of-range',
    },
  });
  for (const pkg of options.packages) {
    writeJson(path.join(root, 'packages', pkg.name, 'package.json'), {
      version: '1.0.0',
      ...pkg,
    });
  }
  const frontmatter = Object.entries(options.changes)
    .map(([name, type]) => `"${name}": ${type}`)
    .join('\n');
  fs.writeFileSync(
    path.join(root, '.changeset', 'fixture.md'),
    `---\n${frontmatter}\n---\n\nFixture release.\n`
  );

  const [{ getPackages }, { readConfig }, { readChangesets }, { assembleReleasePlan }] =
    await Promise.all([
      importChangesetsDependency('@manypkg/get-packages'),
      importChangesetsDependency('@changesets/config'),
      importChangesetsDependency('@changesets/read'),
      importChangesetsDependency('@changesets/assemble-release-plan'),
    ]);
  const packages = await getPackages(root);
  const configResult = await readConfig(root, packages);
  assert.equal(configResult.errors, undefined, configResult.errors?.join('\n'));
  const changesets = await readChangesets(root);
  return assembleReleasePlan(changesets, packages, configResult.config, undefined).releases;
}

function releaseMap(releases: Release[]): Map<string, Release> {
  return new Map(releases.map((release) => [release.name, release]));
}

describe('Changesets dependency policy', () => {
  it('updates dependencies only when their explicit workspace range is exceeded', async () => {
    const releases = releaseMap(
      await runPolicyFixture({
        name: 'dependencies',
        packages: [
          { name: 'dependency-in-range' },
          { name: 'consumer-in-range', dependencies: { 'dependency-in-range': 'workspace:^' } },
          { name: 'dependency-out-of-range' },
          {
            name: 'consumer-out-of-range',
            dependencies: { 'dependency-out-of-range': 'workspace:1.0.0' },
          },
          { name: 'optional-source' },
          {
            name: 'optional-consumer',
            optionalDependencies: { 'optional-source': 'workspace:1.0.0' },
          },
        ],
        changes: {
          'dependency-in-range': 'patch',
          'dependency-out-of-range': 'patch',
          'optional-source': 'patch',
        },
      })
    );

    assert.equal(releases.has('consumer-in-range'), false);
    assert.equal(releases.get('consumer-out-of-range')?.type, 'patch');
    assert.equal(releases.get('optional-consumer')?.type, 'patch');
  });

  it('updates peer dependents transitively only when their range is exceeded', async () => {
    const releases = releaseMap(
      await runPolicyFixture({
        name: 'peers',
        packages: [
          { name: 'peer-source' },
          { name: 'peer-in-range', peerDependencies: { 'peer-source': 'workspace:^' } },
          { name: 'peer-out-of-range', peerDependencies: { 'peer-source': 'workspace:1.0.0' } },
          {
            name: 'peer-second-hop',
            peerDependencies: { 'peer-out-of-range': 'workspace:1.0.0' },
          },
        ],
        changes: { 'peer-source': 'patch' },
      })
    );

    assert.equal(releases.has('peer-in-range'), false);
    assert.equal(releases.get('peer-out-of-range')?.type, 'patch');
    assert.equal(releases.get('peer-second-hop')?.type, 'patch');
  });

  it('applies fixed and linked group semantics without guessing production groups', async () => {
    const fixed = releaseMap(
      await runPolicyFixture({
        name: 'fixed',
        packages: [{ name: 'fixed-a' }, { name: 'fixed-b' }],
        changes: { 'fixed-a': 'patch' },
        fixed: [['fixed-a', 'fixed-b']],
      })
    );
    assert.equal(fixed.get('fixed-a')?.newVersion, '1.0.1');
    assert.equal(fixed.get('fixed-b')?.newVersion, '1.0.1');

    const linked = releaseMap(
      await runPolicyFixture({
        name: 'linked',
        packages: [{ name: 'linked-a' }, { name: 'linked-b', version: '2.0.0' }],
        changes: { 'linked-a': 'patch' },
        linked: [['linked-a', 'linked-b']],
      })
    );
    assert.equal(linked.get('linked-a')?.newVersion, '2.0.1');
    assert.equal(linked.has('linked-b'), false);
  });

  it('does not version private workspaces', async () => {
    const releases = releaseMap(
      await runPolicyFixture({
        name: 'private',
        packages: [{ name: 'public-package' }, { name: 'private-tool', private: true }],
        changes: { 'public-package': 'patch' },
      })
    );

    assert.equal(releases.has('public-package'), true);
    assert.equal(releases.has('private-tool'), false);
  });

  it('ignores release intent that targets a private workspace', async () => {
    assert.deepEqual(
      await runPolicyFixture({
        name: 'private-target',
        packages: [{ name: 'private-tool', private: true }],
        changes: { 'private-tool': 'patch' },
      }),
      []
    );
  });
});
