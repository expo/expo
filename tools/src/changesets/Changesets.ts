import { readChangesets } from '@changesets/read';
import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { EXPO_DIR } from '../Constants';
import Git from '../Git';
import logger from '../Logger';
import { spawnAsync } from '../Utils';

const CHANGESETS_DIR = path.join(EXPO_DIR, '.changeset');
const EXPO_CHANGESETS_CONFIG = path.join(CHANGESETS_DIR, 'expo.json');

type ExpoReleaseRoute = 'publish' | 'canary';
type ExpoBranchPolicy = {
  publish: string | null;
  canary: string | null;
  allowMajor: boolean;
};
type ExpoChangesetsConfig = {
  branches: Record<string, ExpoBranchPolicy>;
  sdkBranchDefaults: ExpoBranchPolicy;
};

export type ChangesetPrerequisite = 'present' | 'absent';
export type ReleaseKind = 'stable' | 'canary';
export type PublishPlanEntry = { kind: 'publish' | 'tag-only'; name: string; version: string };

export async function getStablePublishArgsAsync(
  branchName: string,
  changesetsDir: string = CHANGESETS_DIR
): Promise<string[]> {
  const tag = await getReleaseTagAsync(branchName, 'publish');
  const prereleaseStatePath = path.join(changesetsDir, 'pre.json');
  if (
    await fs.promises.stat(prereleaseStatePath).then(
      () => true,
      () => false
    )
  ) {
    const prereleaseState = JSON.parse(await fs.promises.readFile(prereleaseStatePath, 'utf8'));
    if (typeof prereleaseState.tag !== 'string' || !prereleaseState.tag) {
      throw new Error('.changeset/pre.json does not contain a valid prerelease tag.');
    }
    // Changesets owns the prerelease tag in pre mode and rejects an explicit --tag option.
    return ['publish'];
  }
  return ['publish', '--tag', tag];
}

async function getExpoBranchPolicyAsync(branchName: string): Promise<ExpoBranchPolicy | null> {
  const config = JSON.parse(
    await fs.promises.readFile(EXPO_CHANGESETS_CONFIG, 'utf8')
  ) as ExpoChangesetsConfig;
  const configured = config.branches[branchName];
  if (configured) return configured;
  if (!/^sdk-\d+$/.test(branchName)) return null;
  return {
    ...config.sdkBranchDefaults,
    publish: config.sdkBranchDefaults.publish?.replaceAll('{branch}', branchName) ?? null,
    canary: config.sdkBranchDefaults.canary?.replaceAll('{branch}', branchName) ?? null,
  };
}

export async function getReleaseTagAsync(
  branchName: string,
  route: ExpoReleaseRoute
): Promise<string> {
  const policy = await getExpoBranchPolicyAsync(branchName);
  const tag = policy?.[route];
  if (!tag) {
    throw new Error(
      `${route === 'publish' ? 'Stable releases' : 'Canaries'} are not enabled for ${branchName}.`
    );
  }
  return tag;
}

export async function getReleaseBranchAsync(): Promise<string> {
  return (
    process.env.GITHUB_BASE_REF ||
    process.env.GITHUB_REF_NAME ||
    (await Git.getCurrentBranchNameAsync())
  );
}

export async function assertReleaseBranch(
  branchName: string,
  releaseKind: ReleaseKind
): Promise<void> {
  await getReleaseTagAsync(branchName, releaseKind === 'stable' ? 'publish' : 'canary');
}

export async function assertCleanWorkingTreeAsync(): Promise<void> {
  const { stdout } = await spawnAsync('git', ['status', '--porcelain'], { cwd: EXPO_DIR });
  if (stdout.trim()) {
    throw new Error('Package release commands require a clean working tree.');
  }
}

export async function getPublishPlanAsync(): Promise<PublishPlanEntry[]> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expo-publish-plan-'));
  const output = path.join(directory, 'publish-plan.json');
  try {
    await runChangesetsAsync(['publish-plan', '--output', output]);
    const result = JSON.parse(await fs.promises.readFile(output, 'utf8'));
    return (result.plan as PublishPlanEntry[][]).flat();
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

export async function packChangesetsAsync(prefix: string): Promise<void> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    await runChangesetsAsync(['pack', '--out-dir', directory]);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

export async function assertVersionCommitAsync(): Promise<void> {
  const { stdout } = await spawnAsync(
    'git',
    [
      'diff',
      '-G',
      '^[[:space:]]*"version"[[:space:]]*:',
      'HEAD^',
      'HEAD',
      '--',
      'packages/**/package.json',
      'templates/**/package.json',
    ],
    { cwd: EXPO_DIR }
  );
  if (!stdout.trim()) {
    throw new Error('Refusing to publish: the current commit did not change package versions.');
  }
}

export async function getPendingChangesetsAsync(
  changesetsDir: string = CHANGESETS_DIR
): ReturnType<typeof readChangesets> {
  return (await readChangesets(path.dirname(changesetsDir))).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
}

export async function assertChangesetPrerequisiteAsync(
  prerequisite: ChangesetPrerequisite,
  force: boolean,
  changesetsDir: string = CHANGESETS_DIR
): ReturnType<typeof readChangesets> {
  const changesets = await getPendingChangesetsAsync(changesetsDir);
  const satisfied = prerequisite === 'present' ? changesets.length > 0 : changesets.length === 0;

  if (satisfied) {
    return changesets;
  }

  const message =
    prerequisite === 'present'
      ? 'Canary publishing requires at least one pending changeset entry.'
      : `Stable publishing requires an already-versioned checkout, but found: ${changesets
          .map((changeset) => `${changeset.id}.md`)
          .join(', ')}`;

  if (!force) {
    throw new Error(`${message} Pass --force to bypass only this prerequisite.`);
  }

  logger.warn(chalk.yellow.bold(`⚠️  ${message} Continuing because --force was provided.`));
  return changesets;
}

export async function assertNoMajorChangesetsAsync(
  changesets: Awaited<ReturnType<typeof readChangesets>>,
  branchName: string
): Promise<void> {
  const policy = await getExpoBranchPolicyAsync(branchName);
  if (!policy || policy.allowMajor) {
    return;
  }
  for (const changeset of changesets) {
    if (changeset.releases.some((release) => release.type === 'major')) {
      throw new Error(
        `Major changesets are not allowed on an active SDK release line (${changeset.id}.md).`
      );
    }
  }
}

type SpawnChangesetsAsync = typeof spawnAsync;

export async function runChangesetsAsync(
  args: string[],
  spawnChangesetsAsync: SpawnChangesetsAsync = spawnAsync
): Promise<void> {
  await spawnChangesetsAsync('pnpm', ['exec', 'changeset', ...args], {
    cwd: EXPO_DIR,
    stdio: 'inherit',
  });
}
