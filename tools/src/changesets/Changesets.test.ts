import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { EXPO_DIR } from '../Constants';
import {
  assertReleaseBranch,
  assertChangesetPrerequisiteAsync,
  assertNoMajorChangesetsAsync,
  getPendingChangesetsAsync,
  getReleaseTagAsync,
  getStablePublishArgsAsync,
  runChangesetsAsync,
} from './Changesets';

const config = JSON.parse(fs.readFileSync(path.join(EXPO_DIR, '.changeset/expo.json'), 'utf8')) as {
  branches: Record<string, { publish: string | null; canary: string | null; allowMajor: boolean }>;
};
const temporaryDirectories: string[] = [];

async function makeChangesetsDirAsync(files: Record<string, string>): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expo-changesets-test-'));
  const directory = path.join(root, '.changeset');
  temporaryDirectories.push(root);
  await fs.promises.mkdir(directory);
  await Promise.all(
    Object.entries(files).map(([name, contents]) =>
      fs.promises.writeFile(path.join(directory, name), contents)
    )
  );
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.promises.rm(directory, { recursive: true, force: true }))
  );
});

describe('Changesets release prerequisites', () => {
  it('restricts stable and canary release branches independently', async () => {
    for (const [branch, policy] of Object.entries(config.branches)) {
      for (const [kind, tag] of [
        ['stable', policy.publish],
        ['canary', policy.canary],
      ] as const) {
        if (tag) {
          await assert.doesNotReject(assertReleaseBranch(branch, kind));
        } else {
          await assert.rejects(assertReleaseBranch(branch, kind), /not enabled/);
        }
      }
    }
    await assert.doesNotReject(assertReleaseBranch('sdk-0', 'stable'));
    await assert.rejects(assertReleaseBranch('feature', 'canary'), /not enabled/);
  });

  it('discovers sorted release-intent Markdown files only', async () => {
    const directory = await makeChangesetsDirAsync({
      'zebra.md': '---\n"expo": patch\n---\n\nZebra.\n',
      'README.md': 'support',
      'config.json': '{}',
      'alpha.md': '---\n"expo-asset": patch\n---\n\nAlpha.\n',
      'notes.txt': 'ignored',
    });

    assert.deepEqual(
      (await getPendingChangesetsAsync(directory)).map((changeset) => changeset.id),
      ['alpha', 'zebra']
    );
  });

  it('enforces opposite stable and canary prerequisites', async () => {
    const empty = await makeChangesetsDirAsync({ 'README.md': 'support' });
    const pending = await makeChangesetsDirAsync({
      'release.md': '---\n"expo": patch\n---\n\nRelease.\n',
    });

    await assert.doesNotReject(assertChangesetPrerequisiteAsync('absent', false, empty));
    await assert.doesNotReject(assertChangesetPrerequisiteAsync('present', false, pending));
    await assert.rejects(assertChangesetPrerequisiteAsync('present', false, empty), /--force/);
    await assert.rejects(assertChangesetPrerequisiteAsync('absent', false, pending), /release\.md/);
    await assert.doesNotReject(assertChangesetPrerequisiteAsync('present', true, empty));
    await assert.doesNotReject(assertChangesetPrerequisiteAsync('absent', true, pending));
  });

  it('rejects major bumps without matching summary text', async () => {
    const directory = await makeChangesetsDirAsync({
      'major.md': '---\n"expo": major\n---\n\nA deliberate breaking change.\n',
      'quoted-major.md': "---\n'expo-router': 'major' # deliberate\n---\n\nAnother break.\n",
      'patch.md': "---\n'expo-asset': patch\n---\n\nMentions major in prose.\n",
    });

    const changesets = await getPendingChangesetsAsync(directory);
    for (const [branch, policy] of Object.entries(config.branches)) {
      if (policy.allowMajor) {
        await assert.doesNotReject(assertNoMajorChangesetsAsync(changesets, branch));
      } else {
        await assert.rejects(assertNoMajorChangesetsAsync(changesets, branch), /major\.md/);
        await assert.rejects(
          assertNoMajorChangesetsAsync(
            changesets.filter((changeset) => changeset.id === 'quoted-major'),
            branch
          ),
          /quoted-major\.md/
        );
      }
      await assert.doesNotReject(
        assertNoMajorChangesetsAsync(
          changesets.filter((changeset) => changeset.id === 'patch'),
          branch
        )
      );
    }
    await assert.rejects(assertNoMajorChangesetsAsync(changesets, 'sdk-0'), /major\.md/);
    await assert.doesNotReject(assertNoMajorChangesetsAsync(changesets, 'feature'));
  });

  it('runs the pinned CLI transparently for Changesets Action integration', async () => {
    const previousOutput = process.env.CHANGESETS_OUTPUT;
    process.env.CHANGESETS_OUTPUT = '/tmp/action-publish-output.json';
    let invocation: { command: string; args: readonly string[]; options: any } | undefined;

    try {
      await runChangesetsAsync(['publish', '--tag', 'latest'], ((command, args, options) => {
        invocation = { command, args, options };
        return Promise.resolve({ status: 0, signal: null, stdout: '', stderr: '', output: [] });
      }) as any);
    } finally {
      if (previousOutput === undefined) {
        delete process.env.CHANGESETS_OUTPUT;
      } else {
        process.env.CHANGESETS_OUTPUT = previousOutput;
      }
    }

    assert.equal(invocation?.command, 'pnpm');
    assert.deepEqual(invocation?.args, ['exec', 'changeset', 'publish', '--tag', 'latest']);
    assert.equal(invocation?.options.stdio, 'inherit');
    assert.equal(invocation?.options.env, undefined);
  });

  it('derives release tags and respects disabled routes', async () => {
    const stable = await makeChangesetsDirAsync({ 'README.md': 'support' });
    const prerelease = await makeChangesetsDirAsync({
      'pre.json': JSON.stringify({ mode: 'pre', tag: 'next' }),
    });
    const latestBranches = Object.entries(config.branches)
      .filter(([, policy]) => policy.publish === 'latest')
      .map(([branch]) => branch);
    assert.equal(latestBranches.length, 1, 'Exactly one branch must publish latest');
    const [latestBranch] = latestBranches;
    assert.deepEqual(await getStablePublishArgsAsync(latestBranch, stable), [
      'publish',
      '--tag',
      'latest',
    ]);
    assert.deepEqual(await getStablePublishArgsAsync(latestBranch, prerelease), ['publish']);
    for (const [branch, policy] of Object.entries(config.branches)) {
      for (const route of ['publish', 'canary'] as const) {
        if (policy[route]) {
          assert.equal(await getReleaseTagAsync(branch, route), policy[route]);
        } else {
          await assert.rejects(getReleaseTagAsync(branch, route), /not enabled/);
        }
      }
    }
    assert.deepEqual(await getStablePublishArgsAsync('sdk-0', stable), [
      'publish',
      '--tag',
      'sdk-0',
    ]);
    assert.equal(await getReleaseTagAsync('sdk-0', 'canary'), 'canary-sdk-0');
  });
});
