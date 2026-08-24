/* eslint-env jest */
// @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints
//
// `exagent checkpoint` snapshots the project with git plumbing, `exagent checkpoint:undo` puts a
// snapshot back, and `exagent checkpoint:list` says which ones there are. These tests run all three
// through the CLI, against a real git repository made from a copy of the `skills-app` fixture: the
// point of the feature is what git does, so nothing here is mocked.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, readProjectFile, setupFixtureAsync } from '../utils';

/** Relative path of the store `exagent checkpoint` writes. */
const STORE_FILE = path.join('.expo', 'exagent-checkpoints.json');

/**
 * A file's content with its line endings made comparable.
 *
 * A checkpoint stores what git stores, and git stores LF, so on Windows — where the checkout wrote
 * the fixture with CRLF — a restored file comes back with LF. The assertion here is that the
 * *content* returned; whether `undo` should reapply the platform's line endings the way
 * `git checkout` does is a question for `src/checkpoint`, not one this test should decide.
 */
function sameLines(content: string | null): string | null {
  return content?.replace(/\r\n/g, '\n') ?? null;
}

/** One record of the store, per `src/checkpoint/types.ts`. */
type CheckpointRecord = {
  id: string;
  label: string;
  createdAt: string;
  argv: string[];
  path: string;
};

/** Run one git command in the project, and return its stdout. */
async function gitAsync(cwd: string, args: string[]): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`git ${args.join(' ')} exited with ${code}: ${stderr}`))
    );
  });
}

/**
 * Turn the copied fixture into a git repository with one commit.
 *
 * The fixture ships `node_modules` as test data, which a real project would ignore, so it is
 * excluded through `.git/info/exclude` instead of the committed fixture's `.gitignore`.
 */
async function initGitRepoAsync(projectRoot: string): Promise<void> {
  await gitAsync(projectRoot, ['init', '-b', 'main']);
  await fs.promises.appendFile(
    path.join(projectRoot, '.git', 'info', 'exclude'),
    '\nnode_modules/\n'
  );
  await gitAsync(projectRoot, ['add', '-A']);
  await gitAsync(projectRoot, [
    '-c',
    'user.email=e2e@expo.dev',
    '-c',
    'user.name=e2e',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-m',
    'initial commit',
  ]);
}

/** The checkpoints recorded for a project, newest first. */
function readStore(projectRoot: string): CheckpointRecord[] {
  const contents = readProjectFile(projectRoot, STORE_FILE);
  return contents ? JSON.parse(contents).checkpoints : [];
}

describe('exagent checkpoint', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('lists the actions of the group with `checkpoint --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['checkpoint', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('checkpoint:create');
    expect(result.all).toContain('checkpoint:list');
    expect(result.all).toContain('checkpoint:undo');
    // The bare command is the snapshot, which the listing says out loud.
    expect(result.all).toContain('npx exagent checkpoint');
    // And the options that snapshot takes, because the bare name is what runs it.
    expect(result.all).toContain('--label');
  });

  it('prints the options of the snapshot with `checkpoint:create --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['checkpoint:create', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--label');
    expect(result.all).toContain('--json');
    expect(result.all).toContain('exagent checkpoint:undo');
  });

  it('snapshots the project without changing anything git shows', async () => {
    await initGitRepoAsync(projectRoot);
    const headBefore = (await gitAsync(projectRoot, ['rev-parse', 'HEAD'])).trim();

    const result = await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'by hand']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('by hand');
    expect(result.stdout).toContain('npx exagent checkpoint:undo');

    const [record, ...rest] = readStore(projectRoot);
    expect(rest).toEqual([]);
    expect(record).toMatchObject({
      label: 'by hand',
      argv: ['exagent', 'checkpoint', '--label', 'by hand'],
      path: '',
    });
    expect(record!.id).toMatch(/^[0-9a-f]{40}$/);

    // The snapshot is a git object no ref points at: HEAD, the branch, the log and the index are
    // exactly as they were.
    expect((await gitAsync(projectRoot, ['rev-parse', 'HEAD'])).trim()).toBe(headBefore);
    expect((await gitAsync(projectRoot, ['log', '--oneline', '--all'])).trim().split('\n')).toEqual(
      [expect.stringContaining('initial commit')]
    );
    expect(await gitAsync(projectRoot, ['status', '--porcelain'])).toBe('');
    // The commit object itself is there, holding the project's files.
    expect(await gitAsync(projectRoot, ['cat-file', '-t', record!.id])).toContain('commit');
    expect(await gitAsync(projectRoot, ['ls-tree', '-r', '--name-only', record!.id])).toContain(
      'package.json'
    );
  });

  it('prints one JSON object with a stable key set', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['checkpoint', '--json']);

    const report = JSON.parse(result.stdout);
    expect(Object.keys(report).sort()).toEqual([
      'created',
      'createdAt',
      'files',
      'id',
      'label',
      'path',
      'skipped',
    ]);
    expect(report.created).toBe(true);
    expect(report.files).toBeGreaterThan(0);
  });

  it('fails with a next action outside a git repository', async () => {
    const result = await executeExagentAsync(projectRoot, ['checkpoint'], { reject: false });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('git repository');
    expect(result.all).toContain('git init');
    expect(readStore(projectRoot)).toEqual([]);
  });
});

describe('exagent checkpoint:undo', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('restores the files of the checkpoint and keeps what was created since', async () => {
    await initGitRepoAsync(projectRoot);
    const originalPackageJson = readProjectFile(projectRoot, 'package.json');
    await executeExagentAsync(projectRoot, ['checkpoint']);

    // Change a file, delete another, and add one the checkpoint never saw.
    await fs.promises.writeFile(
      path.join(projectRoot, 'package.json'),
      JSON.stringify({ name: 'rewritten' })
    );
    await fs.promises.rm(path.join(projectRoot, 'index.js'));
    await fs.promises.writeFile(path.join(projectRoot, 'notes.md'), 'written after the checkpoint');

    const result = await executeExagentAsync(projectRoot, ['checkpoint:undo']);

    expect(result.exitCode).toBe(0);
    // The changed file is back, and so is the deleted one.
    expect(sameLines(readProjectFile(projectRoot, 'package.json'))).toBe(
      sameLines(originalPackageJson)
    );
    expect(fs.existsSync(path.join(projectRoot, 'index.js'))).toBe(true);
    // An undo only writes files, so the new one is still there.
    expect(readProjectFile(projectRoot, 'notes.md')).toBe('written after the checkpoint');

    expect(result.stdout).toContain('package.json');
    expect(result.stdout).toContain('index.js');
    expect(result.stdout).toContain('Kept');
    // A restored manifest needs an install: node_modules is in no checkpoint.
    expect(result.stdout).toContain('npm install');

    // HEAD and the branch never moved.
    expect((await gitAsync(projectRoot, ['log', '--oneline'])).trim().split('\n')).toHaveLength(1);
  });

  it('restores a named checkpoint and reports it as JSON', async () => {
    await initGitRepoAsync(projectRoot);
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'first']);
    const [first] = readStore(projectRoot);

    await fs.promises.writeFile(path.join(projectRoot, 'index.js'), '// changed once\n');
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'second']);
    await fs.promises.writeFile(path.join(projectRoot, 'index.js'), '// changed twice\n');

    const result = await executeExagentAsync(projectRoot, [
      'checkpoint:undo',
      '--id',
      first!.id.slice(0, 7),
      '--json',
    ]);

    const report = JSON.parse(result.stdout);
    expect(Object.keys(report).sort()).toEqual([
      'createdAt',
      'filesKept',
      'filesRestored',
      'followups',
      'id',
      'label',
      'paths',
      'restored',
    ]);
    expect(report).toMatchObject({ restored: true, id: first!.id, label: 'first' });
    expect(report.paths).toContain('index.js');
    // The oldest checkpoint won, not the newest.
    expect(readProjectFile(projectRoot, 'index.js')).not.toContain('changed');
  });

  it('never restores an older copy of the checkpoint store', async () => {
    // A project that does not gitignore `.expo` would otherwise snapshot the store itself, and
    // an undo would put back a list of checkpoints from before the ones it just read.
    await fs.promises.writeFile(
      path.join(projectRoot, '.gitignore'),
      '.stub-bin/\nstub-expo-invocations.jsonl\n'
    );
    await initGitRepoAsync(projectRoot);
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'first']);
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'second']);

    await executeExagentAsync(projectRoot, ['checkpoint:undo']);

    expect(readStore(projectRoot).map((entry) => entry.label)).toEqual(['second', 'first']);
  });

  it('suggests making a checkpoint when the project has none', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['checkpoint:undo'], { reject: false });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('No checkpoint');
    expect(result.all).toContain('Try: npx exagent checkpoint');
  });
});

describe('exagent checkpoint:list', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('lists the checkpoints of the project', async () => {
    await initGitRepoAsync(projectRoot);
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'first']);
    await executeExagentAsync(projectRoot, ['checkpoint', '--label', 'second']);

    const result = await executeExagentAsync(projectRoot, ['checkpoint:list']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('first');
    expect(result.stdout).toContain('second');
    expect(result.stdout).toContain('exagent checkpoint --label');

    const json = await executeExagentAsync(projectRoot, ['checkpoint:list', '--json']);
    const report = JSON.parse(json.stdout);
    expect(Object.keys(report)).toEqual(['checkpoints']);
    expect(report.checkpoints.map((entry: CheckpointRecord) => entry.label)).toEqual([
      'second',
      'first',
    ]);
  });

  it('lists nothing for a project outside git, without failing', async () => {
    const result = await executeExagentAsync(projectRoot, ['checkpoint:list']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No checkpoint');
  });
});

describe('checkpoints of a mutating command', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('are taken before `exagent install` runs', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['install', 'expo-camera']);

    expect(result.exitCode).toBe(0);
    const [record] = readStore(projectRoot);
    expect(record).toMatchObject({
      label: 'exagent install',
      argv: ['exagent', 'install', 'expo-camera'],
    });
    expect(result.stdout).toContain('Checkpoint');
  });

  it('are skipped with --no-checkpoint', async () => {
    await initGitRepoAsync(projectRoot);

    await executeExagentAsync(projectRoot, ['install', 'expo-camera', '--no-checkpoint']);

    expect(readStore(projectRoot)).toEqual([]);
  });

  // A snapshot is a record of a change, and a rejected invocation changes nothing. `install` used
  // to take one and *then* hand the arguments to `expo install`, which rejected them — leaving a
  // checkpoint of an install that never happened [observed — friction run, 2026-08-23].
  it('are not taken for an invocation that is rejected', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['install', 'expo-camera', '--verbose'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('is not an option');
    expect(readStore(projectRoot)).toEqual([]);
  });

  // `--json` owns stdout, so the line naming the snapshot has to move: it is not the object a
  // caller parses, and it used to land in front of one.
  it('are reported inside the JSON object rather than in front of it', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['install', 'expo-camera', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('Checkpoint');
    const report = JSON.parse(result.stdout);
    expect(report.checkpoint).toMatchObject({ id: readStore(projectRoot)[0]!.id });
  });

  it('are skipped with EXAGENT_NO_CHECKPOINT', async () => {
    await initGitRepoAsync(projectRoot);

    await executeExagentAsync(projectRoot, ['install', 'expo-camera'], {
      env: { EXAGENT_NO_CHECKPOINT: '1' },
    });

    expect(readStore(projectRoot)).toEqual([]);
  });

  it('do not stop the command in a project outside git', async () => {
    const result = await executeExagentAsync(projectRoot, ['install', 'expo-camera']);

    expect(result.exitCode).toBe(0);
    expect(readStore(projectRoot)).toEqual([]);
    expect(result.all).not.toContain('Checkpoint');
  });

  it('are taken before `exagent agents:setup` writes AGENTS.md', async () => {
    await initGitRepoAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, [
      'agents:setup',
      '--agent',
      'claude-code',
    ]);

    expect(result.exitCode).toBe(0);
    expect(readStore(projectRoot)[0]).toMatchObject({ label: 'exagent agents:setup' });

    // The documented limit: AGENTS.md did not exist in the checkpoint, and an undo only writes
    // files, so the undo reports it as kept instead of deleting it.
    const undo = await executeExagentAsync(projectRoot, ['checkpoint:undo']);
    expect(undo.exitCode).toBe(0);
    expect(readProjectFile(projectRoot, 'AGENTS.md')).not.toBeNull();
    expect(undo.stdout).toContain('created since the checkpoint');
  });

  it('are not taken by a setup that only syncs skills', async () => {
    await initGitRepoAsync(projectRoot);

    await executeExagentAsync(projectRoot, [
      'agents:setup',
      '--agent',
      'claude-code',
      '--no-agents-md',
    ]);

    expect(readStore(projectRoot)).toEqual([]);
  });
});
