/* eslint-env jest */
// @ref llp/0007-deploy-and-headless.rfc.md §Headless project creation
//
// `exagent new` is the one command that runs before a project exists, so it has no fixture: it
// scaffolds into a fresh temporary directory through a stub `create-expo` on `PATH`. The stub
// stands in for the real scaffolder the same way `node_modules/expo/bin/cli` stands in for the
// Expo CLI (see `e2e/fixtures/README.md`) — no network, no template download, and every
// invocation recorded. Its source lives here rather than in `e2e/fixtures`, because it belongs to
// no fixture project.
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, getTemporaryPath } from '../utils';

/** The shape `new --json` prints, per `src/new/newAsync.ts`. */
type NewProjectReport = {
  projectRoot: string;
  name: string | null;
  created: boolean;
  installed: boolean;
  gitInitialized: boolean;
  followups: { id: string; command: string; why: string }[];
};

/** One recorded invocation of the stub `create-expo` bin. */
type StubInvocation = {
  args: string[];
  cwd: string;
  /** Whether the stub was given a terminal on stdin. Always false: headless is the contract. */
  isTTY: boolean;
};

const STUB_LOG_NAME = 'stub-create-expo-invocations.jsonl';

/**
 * Stub `create-expo` bin. It writes the few files the steps after the scaffold read, so
 * `exagent new` can be tested end to end without downloading a template.
 *
 * Environment variables the tests steer it with:
 * - STUB_CREATE_EXPO_EXIT_CODE: exit code to return (default 0), to test exit code forwarding
 * - STUB_CREATE_EXPO_GIT: `1` to also create a `.git` directory, like the real one does
 * - STUB_CREATE_EXPO_NO_APP_JSON: `1` to scaffold a project whose config is `app.config.js`
 */
const STUB_CREATE_EXPO = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_LOG_NAME)}),
  JSON.stringify({ args, cwd, isTTY: !!process.stdin.isTTY }) + '\\n'
);

const exitCode = Number(process.env.STUB_CREATE_EXPO_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('The directory my-app has files that might be overwritten\\n');
  process.exit(exitCode);
}

const directory = args.find((arg) => !arg.startsWith('-'));
const projectRoot = path.resolve(cwd, directory);
const name = path.basename(projectRoot);
fs.mkdirSync(projectRoot, { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, 'package.json'),
  JSON.stringify({ name, version: '1.0.0', dependencies: { expo: '54.0.0' } }, null, 2)
);
if (process.env.STUB_CREATE_EXPO_NO_APP_JSON === '1') {
  fs.writeFileSync(path.join(projectRoot, 'app.config.js'), 'module.exports = { name: 1 };');
} else {
  fs.writeFileSync(
    path.join(projectRoot, 'app.json'),
    JSON.stringify({ expo: { name, slug: name } }, null, 2)
  );
}
if (process.env.STUB_CREATE_EXPO_GIT === '1') {
  fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, '.git', 'HEAD'), 'ref: refs/heads/main\\n');
}

process.stdout.write('Your project is ready!\\n');
`;

/**
 * A fresh working directory with the stub `create-expo` on the `PATH` of every `exagent` run.
 *
 * `.stub-bin` is the directory `stubExpoEnv()` prepends to `PATH`, so the stub is found by the
 * same mechanism the `expo` stub uses.
 */
async function setupWorkDirAsync(): Promise<string> {
  const workDir = getTemporaryPath();
  const binDir = path.join(workDir, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const binPath = path.join(binDir, 'create-expo');
  await fs.promises.writeFile(binPath, STUB_CREATE_EXPO);
  await fs.promises.chmod(binPath, 0o755);
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(workDir);
}

/** Every invocation of the stub `create-expo` bin recorded in a working directory. */
function readStubInvocations(workDir: string): StubInvocation[] {
  const logPath = path.join(workDir, STUB_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * Whether a directory sits inside a git repository.
 *
 * The temporary directory usually does not, but `EXPO_E2E_TEMP_DIR` can put it anywhere, and
 * `exagent new` deliberately does not nest a repository inside another one.
 */
function isInsideGitRepo(dir: string): boolean {
  for (let current = dir; ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return true;
    }
    if (path.dirname(current) === current) {
      return false;
    }
  }
}

describe('exagent new', () => {
  it(`should create a project through create-expo and say what to do next`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app']);

    // The scaffolder ran as a subprocess, in the working directory, with the prompts answered.
    expect(readStubInvocations(workDir)).toEqual([
      { args: ['my-app', '--yes'], cwd: workDir, isTTY: false },
    ]);
    expect(fs.existsSync(path.join(workDir, 'my-app', 'app.json'))).toBe(true);
    expect(result.stdout).toContain(path.join(workDir, 'my-app'));
    expect(result.stdout).toContain('Next:');
    expect(result.stdout).toContain('cd my-app && npx exagent status');
  });

  it(`should print one JSON object with a stable key set`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app', '--json']);
    const report: NewProjectReport = JSON.parse(result.stdout);

    // The top-level key set is the contract of the command (llp/0006 §Output contract): a
    // renamed or dropped field has to fail a test, not a caller.
    expect(Object.keys(report).sort()).toEqual([
      'created',
      'followups',
      'gitInitialized',
      'installed',
      'name',
      'projectRoot',
    ]);
    expect(report).toMatchObject({
      projectRoot: path.join(workDir, 'my-app'),
      name: null,
      created: true,
      installed: true,
    });
    expect(report.followups.map((followup) => followup.id)).toEqual([
      'status',
      'start-smart',
      'setup',
    ]);
  });

  it(`should keep the repository create-expo initialized`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app'], {
      env: { STUB_CREATE_EXPO_GIT: '1' },
    });

    expect(result.stdout).toContain('initialized by create-expo');
  });

  it(`should initialize a repository when the scaffolder left none`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app', '--json']);
    const report: NewProjectReport = JSON.parse(result.stdout);

    if (isInsideGitRepo(workDir)) {
      // A project created inside another repository must not become a nested one.
      expect(report.gitInitialized).toBe(false);
    } else {
      expect(report.gitInitialized).toBe(true);
      expect(fs.existsSync(path.join(workDir, 'my-app', '.git'))).toBe(true);
    }
  });

  it(`should forward every flag of a headless creation`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, [
      'new',
      'my-app',
      '--name',
      'My App',
      '--no-install',
      '--no-git',
      '--json',
    ]);
    const report: NewProjectReport = JSON.parse(result.stdout);

    expect(readStubInvocations(workDir)[0]!.args).toEqual(['my-app', '--yes', '--no-install']);
    expect(report).toMatchObject({ name: 'My App', installed: false, gitInitialized: false });
    // `--name` is the one thing the directory cannot say, so it lands in the app config.
    const appJson = JSON.parse(
      fs.readFileSync(path.join(workDir, 'my-app', 'app.json'), 'utf8')
    ) as { expo: { name: string; slug: string } };
    expect(appJson.expo).toEqual({ name: 'My App', slug: 'my-app' });
    expect(fs.existsSync(path.join(workDir, 'my-app', '.git'))).toBe(false);
    // Nothing can run before the dependencies are there, so that is the first follow-up.
    expect(report.followups[0]!.id).toBe('install-dependencies');
  });

  it(`should warn, and still create the project, when the template has no app.json`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app', '--name', 'My App'], {
      env: { STUB_CREATE_EXPO_NO_APP_JSON: '1' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('--name');
  });

  it(`should forward the exit code of a failed scaffold`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app', '--json'], {
      env: { STUB_CREATE_EXPO_EXIT_CODE: '3' },
      reject: false,
    });

    expect(result.exitCode).toBe(3);
    // Even a failure prints exactly one object, or a caller parsing stdout has nothing to read.
    expect(JSON.parse(result.stdout)).toMatchObject({ created: false, followups: [] });
    expect(result.stderr).toContain('files that might be overwritten');
  });

  it(`should answer a missing directory with the command that works`, async () => {
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new'], { reject: false });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Missing directory');
    // Errors are prompts (llp/0006): the last line is what an agent runs next.
    expect(result.stderr).toContain('Try: npx exagent new <directory>');
    expect(readStubInvocations(workDir)).toEqual([]);
  });

  it(`should run with no TTY on any stream`, async () => {
    // The e2e runner attaches no stdin at all (see `spawnExagent`), which is the shape an agent
    // runs the CLI in: a prompt would be an EOF failure, not a hang.
    const workDir = await setupWorkDirAsync();

    const result = await executeExagentAsync(workDir, ['new', 'my-app']);

    expect(result.exitCode).toBe(0);
    expect(readStubInvocations(workDir)[0]!.isTTY).toBe(false);
  });
});
