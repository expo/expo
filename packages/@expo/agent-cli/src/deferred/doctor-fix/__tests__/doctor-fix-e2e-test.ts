// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
/* eslint-env jest */
// @ref llp/0017-deferred-commands.reference.md §doctor:fix
// `doctor:fix` through the published bin, against planted caches in a temporary project and a
// temporary `$TMPDIR` of its own.
//
// The first test is the one the command exists to make safe: a dry run with every cache present,
// asserting each planted path is still on disk afterwards. A test that only checked the exit code
// would have passed for a command that deleted everything and said it had not.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { executeAgentCliAsync, installStubBinAsync, setupFixtureAsync, stubExpoEnv } from '../../../../e2e/utils';

/** The shape `doctor:fix --json` prints, per `src/doctor/fixTypes.ts`. */
type FixPayload = {
  projectRoot: string;
  tier: string;
  applied: boolean;
  platforms: string[];
  packageManager: { name: string; lockfile: string | null };
  steps: {
    id: string;
    kind: string;
    targets: string[];
    argv: string[] | null;
    cwd: string | null;
    scope: string;
    bytes: number | null;
    reason: string;
    timeClass: string;
    recoverable: string;
  }[];
  skipped: { id: string; reason: string }[];
  results: { id: string; status: string; durationMs: number; detail: string }[] | null;
  checkpoint: { id: string | null; files: number; note: string } | null;
  followups: { id: string; command: string; why: string }[];
};

const STUB_PM_LOG_NAME = 'stub-pm-invocations.jsonl';

/**
 * Stub package manager. It records whether `node_modules` was there when it ran, which is how the
 * ordering rule "every deletion before any reinstall" is asserted from the outside: a log line
 * saying the directory was already gone is the only proof the install came second.
 */
const STUB_PACKAGE_MANAGER = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(
  path.join(process.env.STUB_PM_LOG_DIR, ${JSON.stringify(STUB_PM_LOG_NAME)}),
  JSON.stringify({
    args: process.argv.slice(2),
    cwd: process.cwd(),
    nodeModulesPresent: fs.existsSync(path.join(process.cwd(), 'node_modules')),
  }) + '\\n'
);
if (process.env.STUB_PM_FAIL) {
  process.stderr.write('stub npm: ENOSPC: no space left on device\\n');
  process.exit(1);
}
process.exit(0);
`;

/** One planted project, its private temporary directory, and the environment that pairs them. */
type Planted = {
  projectRoot: string;
  /** The `$TMPDIR` the command under test sees, with the file map planted in it. */
  tmpDir: string;
  /** Absolute paths the safe tier is expected to delete. */
  planted: string[];
  /** The Metro file map directory of this project, inside {@link tmpDir}. */
  fileMap: string;
  env: Record<string, string>;
};

/** The name Metro's file map goes under for one project root, mirrored from `src/doctor/fixSteps.ts`. */
function fileMapName(projectRoot: string): string {
  const hash = require('node:crypto')
    .createHash('md5')
    .update(projectRoot.split(path.sep).join('/'))
    .digest('hex');
  return `metro-file-map-expo-${hash}-e2econfig`;
}

/**
 * Copy a fixture, plant every cache the safe tier looks for, and give the run a `$TMPDIR` of its
 * own so the machine's real Metro caches are never in reach of a test.
 */
async function plantAsync(fixtureName: string, lockfile = 'package-lock.json'): Promise<Planted> {
  const projectRoot = await fs.promises.realpath(await setupFixtureAsync(fixtureName));
  const tmpDir = path.join(projectRoot, '.e2e-tmp');
  const write = async (relative: string, contents: string) => {
    const target = path.join(projectRoot, relative);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, contents);
    return target;
  };

  const planted = [
    path.dirname(await write('node_modules/.cache/babel/entry.json', 'cached')),
    path.dirname(await write('.expo/web/cache/index.html', '<html>')),
    path.dirname(await write('.expo/dev/logs/start.log', 'logged')),
  ];
  await fs.promises.writeFile(path.join(projectRoot, lockfile), '');

  const fileMap = path.join(tmpDir, fileMapName(projectRoot));
  await fs.promises.mkdir(fileMap, { recursive: true });
  await fs.promises.writeFile(path.join(fileMap, 'data'), 'map');
  planted.push(fileMap);

  // A machine-wide cache in the same place, to prove the flag is what admits it.
  await fs.promises.mkdir(path.join(tmpDir, 'metro-cache'), { recursive: true });
  await fs.promises.writeFile(path.join(tmpDir, 'metro-cache', 'transform'), 'x');

  return {
    projectRoot,
    tmpDir,
    planted,
    fileMap,
    // `os.tmpdir()` reads TMPDIR on posix and TEMP/TMP on Windows, so all three are set.
    env: { TMPDIR: tmpDir, TEMP: tmpDir, TMP: tmpDir },
  };
}

/** Install a stub bin under `name` and put it first on the child's PATH. */
async function stubPackageManagerAsync(planted: Planted, name: string): Promise<void> {
  const binDir = path.join(planted.projectRoot, '.stub-pm');
  const script = path.join(binDir, 'stub-pm.js');
  await fs.promises.mkdir(binDir, { recursive: true });
  await fs.promises.writeFile(script, STUB_PACKAGE_MANAGER);
  await installStubBinAsync(binDir, name, script);

  const inherited = stubExpoEnv(planted.projectRoot).PATH!;
  const withStub = `${binDir}${path.delimiter}${inherited}`;
  Object.assign(planted.env, {
    PATH: withStub,
    Path: withStub,
    STUB_PM_LOG_DIR: planted.projectRoot,
  });
}

function readStubInvocations(projectRoot: string): {
  args: string[];
  cwd: string;
  nodeModulesPresent: boolean;
}[] {
  const logPath = path.join(projectRoot, STUB_PM_LOG_NAME);
  return fs.existsSync(logPath)
    ? fs
        .readFileSync(logPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
}

function readEvents(eventsFile: string): any[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, {
    cwd,
    stdio: 'ignore',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
    },
  });
}

describe('@expo/agent-cli doctor:fix', () => {
  // The test that pins the default. Everything else about this command is a detail next to it.
  it('deletes nothing without --apply, and says so', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', '--json'], {
      env: planted.env,
    });

    expect(result.exitCode).toBe(0);
    const payload: FixPayload = JSON.parse(result.stdout);
    expect(payload.applied).toBe(false);
    expect(payload.results).toBeNull();
    expect(payload.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining([
        'expo-web-cache',
        'expo-dev-logs',
        'node-modules-cache',
        'metro-file-map',
      ])
    );
    for (const target of planted.planted) {
      expect(`${target} exists: ${fs.existsSync(target)}`).toBe(`${target} exists: true`);
    }
  });

  it('names the caches, their size and what puts each one back', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', '--json'], {
      env: planted.env,
    });
    const payload: FixPayload = JSON.parse(result.stdout);
    const fileMap = payload.steps.find((step) => step.id === 'metro-file-map')!;

    // The one target outside the project directory, and it is still this project's alone.
    expect(fileMap.targets).toEqual([planted.fileMap]);
    expect(fileMap.scope).toBe('project');
    expect(fileMap.bytes).toBe(3);
    expect(fileMap.recoverable).toBe('regenerated on the next dev server start');
    expect(payload.packageManager).toEqual({
      name: 'npm',
      lockfile: path.join(planted.projectRoot, 'package-lock.json'),
    });
  });

  it('deletes exactly the planned paths with --apply, and nothing else', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--apply', '--yes', '--tier', 'safe', '--json'],
      { env: planted.env }
    );

    expect(result.exitCode).toBe(0);
    const payload: FixPayload = JSON.parse(result.stdout);
    expect(payload.applied).toBe(true);
    expect(payload.results!.every((entry) => entry.status === 'done')).toBe(true);

    for (const target of planted.planted) {
      expect(`${target} exists: ${fs.existsSync(target)}`).toBe(`${target} exists: false`);
    }
    // The directories those caches lived in are not the caches.
    for (const kept of ['node_modules', '.expo', 'package.json', 'app.json']) {
      const target = path.join(planted.projectRoot, kept);
      expect(`${kept} exists: ${fs.existsSync(target)}`).toBe(`${kept} exists: true`);
    }
    // The machine-wide cache in the same temporary directory was never in the plan.
    expect(fs.existsSync(path.join(planted.tmpDir, 'metro-cache'))).toBe(true);
  });

  it('skips the machine-wide steps until --allow-machine-wide, then runs them last', async () => {
    const planted = await plantAsync('go-app');
    await stubPackageManagerAsync(planted, 'npm');

    const without: FixPayload = JSON.parse(
      (
        await executeAgentCliAsync(
          planted.projectRoot,
          ['doctor:fix', '--tier', 'moderate', '--json'],
          {
            env: planted.env,
          }
        )
      ).stdout
    );
    expect(without.steps.map((step) => step.id)).not.toContain('metro-transform-cache');
    expect(without.skipped.find((entry) => entry.id === 'metro-transform-cache')!.reason).toContain(
      '--allow-machine-wide'
    );

    const withFlag: FixPayload = JSON.parse(
      (
        await executeAgentCliAsync(
          planted.projectRoot,
          ['doctor:fix', '--tier', 'moderate', '--allow-machine-wide', '--json'],
          { env: planted.env }
        )
      ).stdout
    );
    expect(withFlag.steps.at(-1)!.id).toBe('metro-transform-cache');
    expect(withFlag.steps.at(-1)!.scope).toBe('machine');
  });

  // The ordering rule, asserted from outside the process: the install ran, and `node_modules` was
  // already gone when it did.
  it('reinstalls after the deletions at --tier moderate', async () => {
    const planted = await plantAsync('go-app');
    await stubPackageManagerAsync(planted, 'npm');

    const result = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--tier', 'moderate', '--apply', '--yes', '--json'],
      { env: planted.env }
    );

    expect(result.exitCode).toBe(0);
    const payload: FixPayload = JSON.parse(result.stdout);
    const ids = payload.results!.map((entry) => entry.id);
    expect(ids.at(-1)).toBe('node-modules');
    expect(ids.indexOf('node-modules-cache')).toBeLessThan(ids.indexOf('node-modules'));

    expect(readStubInvocations(planted.projectRoot)).toEqual([
      { args: ['install'], cwd: planted.projectRoot, nodeModulesPresent: false },
    ]);
  });

  // A step that failed is an outcome, not a tool error: the command did exactly what it was asked.
  it('exits 20 when an applied step failed, and does not run the steps after it', async () => {
    const planted = await plantAsync('go-app');
    await stubPackageManagerAsync(planted, 'npm');

    const result = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--tier', 'moderate', '--allow-machine-wide', '--apply', '--yes', '--json'],
      { env: { ...planted.env, STUB_PM_FAIL: '1' }, reject: false }
    );

    expect(result.exitCode).toBe(20);
    const payload: FixPayload = JSON.parse(result.stdout);
    const failed = payload.results!.find((entry) => entry.id === 'node-modules')!;
    expect(failed.status).toBe('failed');
    expect(failed.detail).toContain('exited 1');
    // `metro-transform-cache` is machine-wide, so it was ordered after the install and never ran.
    expect(payload.results!.find((entry) => entry.id === 'metro-transform-cache')).toMatchObject({
      status: 'skipped',
    });
    expect(fs.existsSync(path.join(planted.tmpDir, 'metro-cache'))).toBe(true);
  });

  it('takes a checkpoint at moderate and says what it does not hold', async () => {
    const planted = await plantAsync('go-app');
    await stubPackageManagerAsync(planted, 'npm');
    git(planted.projectRoot, 'init', '-q', '.');
    git(planted.projectRoot, 'add', '-A');
    git(planted.projectRoot, 'commit', '-qm', 'init');

    const safe: FixPayload = JSON.parse(
      (
        await executeAgentCliAsync(
          planted.projectRoot,
          ['doctor:fix', '--apply', '--yes', '--json'],
          { env: planted.env }
        )
      ).stdout
    );
    // The safe tier deletes nothing tracked, so it snapshots nothing.
    expect(safe.checkpoint).toBeNull();

    const moderate: FixPayload = JSON.parse(
      (
        await executeAgentCliAsync(
          planted.projectRoot,
          ['doctor:fix', '--tier', 'moderate', '--apply', '--yes', '--json'],
          { env: planted.env }
        )
      ).stdout
    );
    expect(moderate.checkpoint!.id).toMatch(/^[0-9a-f]{40}$/);
    expect(moderate.checkpoint!.note).toContain('tracked files only');
    expect(moderate.checkpoint!.note).toContain('cannot bring them back');
  });

  it('takes no checkpoint with --no-checkpoint', async () => {
    const planted = await plantAsync('go-app');
    await stubPackageManagerAsync(planted, 'npm');
    git(planted.projectRoot, 'init', '-q', '.');
    git(planted.projectRoot, 'add', '-A');
    git(planted.projectRoot, 'commit', '-qm', 'init');

    const payload: FixPayload = JSON.parse(
      (
        await executeAgentCliAsync(
          planted.projectRoot,
          ['doctor:fix', '--tier', 'moderate', '--apply', '--yes', '--no-checkpoint', '--json'],
          { env: planted.env }
        )
      ).stdout
    );

    expect(payload.checkpoint).toMatchObject({ id: null, files: 0 });
  });

  it('refuses a tier that would delete inside a dirty native directory', async () => {
    const planted = await plantAsync('bare-app');
    git(planted.projectRoot, 'init', '-q', '.');
    git(planted.projectRoot, 'add', '-A');
    git(planted.projectRoot, 'commit', '-qm', 'init');
    await fs.promises.appendFile(path.join(planted.projectRoot, 'ios', 'Podfile'), '\n# edited\n');

    const result = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--tier', 'aggressive', '--json'],
      { env: planted.env, reject: false }
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error).toMatchObject({
      code: 'DOCTOR_FIX_DIRTY_NATIVE',
      suggestedCommand: 'npx @expo/agent-cli doctor:fix --tier safe',
    });
    expect(result.stderr).toContain('ios/Podfile');
    // The way out is a command, and it works on the same project.
    const safe = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', '--tier', 'safe'], {
      env: planted.env,
    });
    expect(safe.exitCode).toBe(0);
  });

  it('prints a terse plan a person can read', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix'], {
      env: planted.env,
    });

    expect(result.stdout).toContain('Tier         safe');
    expect(result.stdout).toContain('dry run — nothing was touched, pass --apply to run it');
    expect(result.stdout).toContain('Nothing was deleted. Run npx @expo/agent-cli doctor:fix');
    expect(result.stdout).toContain('back: rebuilt on the next web bundle');
  });

  it('emits the plan and one event per applied step', async () => {
    const planted = await plantAsync('go-app');
    const eventsFile = path.join(planted.projectRoot, 'events.jsonl');

    await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', '--apply', '--yes', '--json'], {
      env: { ...planted.env, LOG_EVENTS: eventsFile },
    });

    const events = readEvents(eventsFile);
    expect(events.find((entry) => entry._e === 'cli:doctor_fix_plan')).toMatchObject({
      tier: 'safe',
      applied: true,
      allowMachineWide: false,
    });
    const steps = events.filter((entry) => entry._e === 'cli:doctor_fix_step');
    expect(steps.map((entry) => entry.id)).toContain('metro-file-map');
    expect(steps.every((entry) => entry.status === 'done')).toBe(true);
  });

  it('rejects a tier and a platform it does not know, without touching anything', async () => {
    const planted = await plantAsync('go-app');

    const tier = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--tier', 'nuclear', '--json'],
      { env: planted.env, reject: false }
    );
    expect(tier.exitCode).toBe(1);
    expect(JSON.parse(tier.stdout).error.code).toBe('BAD_ARGS');
    expect(tier.stderr).toContain('safe, moderate, aggressive');

    const platform = await executeAgentCliAsync(
      planted.projectRoot,
      ['doctor:fix', '--platform', 'tvos'],
      { env: planted.env, reject: false }
    );
    expect(platform.exitCode).toBe(1);
    expect(platform.stderr).toContain('ios, android or all');

    for (const target of planted.planted) {
      expect(fs.existsSync(target)).toBe(true);
    }
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d).
  it('rejects a positional argument instead of dropping it', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', 'moderate'], {
      env: planted.env,
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unexpected argument: moderate');
    expect(result.stderr).toContain('--tier');
  });

  it('names the excluded steps and the exit codes in its help, without running', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor:fix', '--help'], {
      env: planted.env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('npm cache clean --force');
    expect(result.stdout).toContain('yarn cache clean');
    expect(result.stdout).toContain('Deliberately not done');
    expect(result.stdout).toContain('holds tracked files');
    expect(result.stdout).toContain('20');
    for (const target of planted.planted) {
      expect(fs.existsSync(target)).toBe(true);
    }
  });

  it('is listed under the doctor group', async () => {
    const planted = await plantAsync('go-app');

    const result = await executeAgentCliAsync(planted.projectRoot, ['doctor', '--help'], {
      env: planted.env,
    });

    expect(result.stdout).toContain('doctor:fix');
  });
});
