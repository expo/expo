/* eslint-env jest */
// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
//
// `exagent deploy` is orchestration: it resolves the tools and runs `expo export`, the EAS CLI and
// the launch CLI as subprocesses, then hands the URLs back. These tests drive the published CLI
// against stub `eas` and `create-launch` bins installed next to the stub `expo` bin of the fixtures
// (`e2e/fixtures/README.md`), so the orchestration is asserted without an EAS account, an Expo
// login, or a network. No real `eas` and no real `create-launch` is ever invoked here.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  getTemporaryPath,
  installStubBinAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  stubExpoEnv,
} from '../utils';

/** The shape `deploy --json` prints, per `src/deploy/types.ts`. */
type DeployReport = {
  projectRoot: string;
  targets: ('web' | 'native')[];
  web: { url: string | null; exportDir: string; outputTail: string } | null;
  native: { id: string; url: string; framework: string; expiresInHours: number } | null;
  followups: { id: string; command: string; why: string }[];
};

/** One recorded invocation of the stub `eas` bin. */
type StubEasInvocation = { args: string[]; cwd: string; isTTY: boolean };

const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

/** URL the stub prints, in the shape the EAS CLI writes it. */
const STUB_DEPLOYMENT_URL = 'https://go-app--e2e123.expo.app';

/**
 * Stub `eas` bin. It records every invocation and prints the URL line the real CLI ends on, which is
 * what the web deploy parses its result out of. Only `eas deploy` is stubbed: the native rail no
 * longer runs the EAS CLI at all.
 *
 * Environment variables the tests steer it with:
 * - STUB_EAS_EXIT_CODE: exit code to return (default 0), to test failure reporting
 * - STUB_EAS_NO_URL: `1` to print no URL at all, for the "URL could not be parsed" path
 */
const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args, cwd, isTTY: !!process.stdin.isTTY }) + '\\n'
);

const exitCode = Number(process.env.STUB_EAS_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('Entity not authorized: the request was made without an account.\\n');
  process.exit(exitCode);
}

const quiet = process.env.STUB_EAS_NO_URL === '1';
if (args[0] === 'deploy') {
  process.stdout.write('Deploying to EAS Hosting\\n');
  if (!quiet) {
    process.stdout.write('Dashboard: https://expo.dev/projects/go-app/hosting/deployments\\n');
    process.stdout.write('Deployment URL: ${STUB_DEPLOYMENT_URL}\\n');
  }
}
process.exit(0);
`;

/**
 * Copy a fixture and install the stub `eas` bin into the `.stub-bin` directory that
 * `stubExpoEnv()` puts on `PATH`, so `eas` resolves to the stub the same way `expo` does.
 */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  // The stub is a Node script the shims run, not a bin itself: Windows can execute neither a
  // shebang script nor an extensionless file, so both shims are written (see
  // {@link installStubBinAsync}) exactly as npm installs a real `eas`.
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(stubScript, STUB_EAS);
  await installStubBinAsync(binDir, 'eas', stubScript);
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(projectRoot);
}

/**
 * An environment whose `PATH` holds nothing, in every spelling the platform may read.
 *
 * This is the only way to test a missing EAS CLI on a machine that has one installed, and it has to
 * clear `Path` as well: on Windows a leftover spelling would still point at the real `eas`.
 */
function emptyPathEnv(emptyDir: string): Record<string, string> {
  return process.platform === 'win32' ? { PATH: emptyDir, Path: emptyDir } : { PATH: emptyDir };
}

/** What the stub launch CLI answers with, standing in for launch.expo.dev. */
const STUB_LAUNCH_ID = 'launch-e2e-1';
const STUB_LAUNCH_URL = 'https://launch.expo.dev/l/e2e123';

/** Name of the file the stub `create-launch` bin appends one JSON line to per invocation. */
const STUB_LAUNCH_LOG_NAME = 'stub-create-launch-invocations.jsonl';

/**
 * Stub `create-launch` bin, in the shape of the real CLI's machine-readable surface: one JSON
 * object on stdout, human progress on stderr, and a non-zero exit with its message on stderr when
 * it refuses.
 *
 * Environment variables the tests steer it with:
 * - STUB_LAUNCH_LOG: file the invocation is appended to
 * - STUB_LAUNCH_MODE: `unauthenticated`, `refused` or `garbage` (default: a successful launch)
 */
const STUB_CREATE_LAUNCH = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');

const args = process.argv.slice(2);
fs.appendFileSync(
  process.env.STUB_LAUNCH_LOG,
  JSON.stringify({ args, cwd: process.cwd(), isTTY: !!process.stdin.isTTY }) + '\\n'
);

const mode = process.env.STUB_LAUNCH_MODE || 'launch';

if (mode === 'unauthenticated') {
  // The wording of the real CLI when nobody is signed in and it cannot prompt.
  process.stderr.write(
    'You need to be authenticated with Expo before launching in non-interactive\\n'
  );
  process.exit(1);
}

if (mode === 'refused') {
  process.stderr.write('Launch has a project size limit of 500 MB, your project is 1.20 GB.\\n');
  process.exit(1);
}

process.stderr.write('Searching for relevant files...\\n');

if (mode === 'garbage') {
  process.stdout.write('all done!\\n');
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    id: ${JSON.stringify(STUB_LAUNCH_ID)},
    url: ${JSON.stringify(STUB_LAUNCH_URL)},
    framework: 'expo',
  }) + '\\n'
);
`;

/** One recorded invocation of the stub `create-launch` bin. */
type StubLaunchInvocation = { args: string[]; cwd: string; isTTY: boolean };

/**
 * Install the stub launch CLI on the `PATH` of a project, and return the log file it records to.
 *
 * The log path is absolute and passed through the environment, because the launch CLI runs in the
 * directory it uploads — which is the project for a single app and its parent for a monorepo.
 */
async function installStubLaunchAsync(projectRoot: string): Promise<string> {
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const stubScript = path.join(binDir, 'create-launch-stub.js');
  await fs.promises.writeFile(stubScript, STUB_CREATE_LAUNCH);
  await installStubBinAsync(binDir, 'create-launch', stubScript);
  return path.join(projectRoot, STUB_LAUNCH_LOG_NAME);
}

/** Every invocation of the stub `create-launch` bin recorded in a log file. */
function readStubLaunchInvocations(logPath: string): StubLaunchInvocation[] {
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
 * Environment for a launch run: the stub's log file, and its mode.
 *
 * `EXPO_TOKEN` and the Expo home are cleared as a safety net, not as part of the test: if bin
 * resolution ever fell through to the real `npx create-launch@latest`, it would refuse for lack of
 * a login instead of uploading the fixture — and the developer's own session — to the service.
 */
function launchEnv(
  logPath: string,
  { mode, home = NO_EXPO_HOME }: { mode?: string; home?: string } = {}
): Record<string, string> {
  return {
    STUB_LAUNCH_LOG: logPath,
    ...(mode ? { STUB_LAUNCH_MODE: mode } : {}),
    __UNSAFE_EXPO_HOME_DIRECTORY: home,
    EXPO_TOKEN: '',
  };
}

/** A directory that holds no Expo session, and never will. */
const NO_EXPO_HOME = path.join(getTemporaryPath(), 'no-expo-home');

/** Every invocation of the stub `eas` bin recorded for a project. */
function readStubEasInvocations(projectRoot: string): StubEasInvocation[] {
  const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('exagent deploy', () => {
  describe('web', () => {
    it(`should export the web bundle, deploy it, and print one JSON object`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json']);
      const report: DeployReport = JSON.parse(result.stdout);

      // The export runs through the project's own Expo CLI, as a subprocess.
      expect(readStubExpoInvocations(projectRoot)).toEqual([
        { args: ['export', '--platform', 'web'], cwd: projectRoot },
      ]);
      // The upload runs non-interactively, because nothing can answer a prompt here.
      expect(readStubEasInvocations(projectRoot)).toEqual([
        { args: ['deploy', '--non-interactive'], cwd: projectRoot, isTTY: false },
      ]);
      // The top-level key set is the contract of the command (llp/0006 §Output contract).
      expect(Object.keys(report).sort()).toEqual([
        'followups',
        'native',
        'projectRoot',
        'targets',
        'web',
      ]);
      expect(report).toMatchObject({
        projectRoot,
        targets: ['web'],
        native: null,
        web: { url: STUB_DEPLOYMENT_URL, exportDir: 'dist' },
      });
      expect(report.web!.outputTail).toContain(STUB_DEPLOYMENT_URL);
      expect(report.followups.map((followup) => followup.id)).toEqual([
        'open-deployment',
        'eas-deploy-prod',
      ]);
    });

    it(`should deploy the web app of a project that has one, without a target flag`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy']);

      expect(readStubEasInvocations(projectRoot)[0]!.args).toEqual(['deploy', '--non-interactive']);
      expect(result.stdout).toContain(STUB_DEPLOYMENT_URL);
      expect(result.stdout).toContain('Suggested next:');
    });

    it(`should report a deployment whose URL is not in the output`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
        env: { STUB_EAS_NO_URL: '1' },
      });
      const report: DeployReport = JSON.parse(result.stdout);

      // A URL the parser missed is not a failed deploy: the tail carries what the tool said.
      expect(report.web).toMatchObject({ url: null });
      expect(report.web!.outputTail).toContain('Deploying to EAS Hosting');
      expect(report.followups.map((followup) => followup.id)).toEqual(['eas-deploy-prod']);
    });

    it(`should ask for a target when the project has no web app`, async () => {
      const projectRoot = await setupAsync('dev-client-app');

      const result = await executeExagentAsync(projectRoot, ['deploy'], { reject: false });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No deploy target');
      // Errors are prompts (llp/0006): the last line is what an agent runs next.
      expect(result.stderr).toContain('Try: npx exagent deploy --native');
      // Nothing was spent before the question was asked.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it(`should report a failing eas without hiding its exit code`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
        env: { STUB_EAS_EXIT_CODE: '7' },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('exited with code 7');
      expect(result.stderr).toContain('Try: npx eas-cli whoami');
    });

    it(`should name the install command when no eas is available`, async () => {
      const projectRoot = await setupAsync('go-app');
      // A PATH with nothing on it: the only way to test a missing EAS CLI on a machine that has
      // one installed.
      const emptyDir = getTemporaryPath();
      await fs.promises.mkdir(emptyDir, { recursive: true });

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
        env: emptyPathEnv(emptyDir),
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('EAS CLI is not available');
      expect(result.stderr).toContain('Try: npm install -g eas-cli');
      // The export costs minutes, so the missing tool is found before it runs.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });

  describe('native — launch.expo.dev', () => {
    it(`should run the launch CLI in the project and hand back its URL`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native', '--json'], {
        env: launchEnv(logPath),
      });
      const report: DeployReport = JSON.parse(result.stdout);

      // One run, in the directory it uploads, asking for the machine-readable answer.
      expect(readStubLaunchInvocations(logPath)).toEqual([
        { args: ['--json'], cwd: projectRoot, isTTY: false },
      ]);

      // The top-level key set is the contract of the command (llp/0006 §Output contract).
      expect(Object.keys(report).sort()).toEqual([
        'followups',
        'native',
        'projectRoot',
        'targets',
        'web',
      ]);
      // The launch itself is what the CLI reported, plus how long its URL stays open.
      expect(Object.keys(report.native!).sort()).toEqual([
        'expiresInHours',
        'framework',
        'id',
        'url',
      ]);
      expect(report).toMatchObject({
        targets: ['native'],
        web: null,
        native: {
          id: STUB_LAUNCH_ID,
          url: STUB_LAUNCH_URL,
          framework: 'expo',
          expiresInHours: 8,
        },
      });
      // Opening the URL is the next action, and the only one.
      expect(report.followups.map((followup) => followup.id)).toEqual(['open-launch-url']);
      expect(report.followups[0]!.command).toBe(STUB_LAUNCH_URL);
      // Nothing was exported or uploaded to EAS Hosting: that is the other rail.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it(`should print the launch URL as the step it is, and the CLI's progress as it happens`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        env: launchEnv(logPath),
      });

      expect(result.stdout).toContain('Open this to finish the launch:');
      expect(result.stdout).toContain(STUB_LAUNCH_URL);
      expect(result.stdout).toContain('expires in 8 hours');
      expect(result.stdout).toContain('Suggested next:');
      // The progress of the launch CLI reaches the terminal while it runs, on stderr, so a slow
      // upload does not look like a hung command.
      expect(result.stderr).toContain('Searching for relevant files');
    });

    it(`should run from the workspace root and name the app inside it`, async () => {
      const projectRoot = await setupAsync('go-app');
      const workspaceRoot = path.dirname(projectRoot);
      const appDirectory = path.basename(projectRoot);
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(
        projectRoot,
        ['deploy', '--native', '--upload-root', workspaceRoot, '--json'],
        { env: launchEnv(logPath) }
      );

      expect(JSON.parse(result.stdout).native.url).toBe(STUB_LAUNCH_URL);
      // Our --upload-root names the directory to upload; the launch CLI expresses the same thing
      // as "run from here, the app is at --project", so the flag is inverted for it.
      expect(readStubLaunchInvocations(logPath)).toEqual([
        { args: ['--json', '--project', appDirectory], cwd: workspaceRoot, isTTY: false },
      ]);
    });

    it(`should answer a machine that is not signed in with the login command`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        env: launchEnv(logPath, { mode: 'unauthenticated' }),
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not signed in');
      expect(result.stderr).toContain('EXPO_TOKEN');
      // Errors are prompts (llp/0006): the last line is what an agent runs next.
      expect(result.stderr).toContain('Try: npx expo login');
    });

    it(`should report what the launch CLI refused, in its own words`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native', '--json'], {
        env: launchEnv(logPath, { mode: 'refused' }),
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('project size limit of 500 MB');
      expect(result.stderr).toContain('Try: npx exagent deploy --native');
    });

    it(`should report a run that printed no launch`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        env: launchEnv(logPath, { mode: 'garbage' }),
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('did not print a launch');
    });

    it(`should explain that the retired build flags are gone`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--platform', 'ios'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('launch.expo.dev');
      expect(result.stderr).toContain('Try: npx exagent deploy --native');
    });
  });

  it(`should deploy both targets in one run`, async () => {
    const projectRoot = await setupAsync('go-app');
    const logPath = await installStubLaunchAsync(projectRoot);

    const result = await executeExagentAsync(
      projectRoot,
      ['deploy', '--web', '--native', '--json'],
      {
        env: launchEnv(logPath),
      }
    );
    const report: DeployReport = JSON.parse(result.stdout);

    expect(report.targets).toEqual(['web', 'native']);
    expect(readStubEasInvocations(projectRoot).map((invocation) => invocation.args[0])).toEqual([
      'deploy',
    ]);
    expect(readStubLaunchInvocations(logPath)).toHaveLength(1);
    expect(report.web!.url).toBe(STUB_DEPLOYMENT_URL);
    expect(report.native!.url).toBe(STUB_LAUNCH_URL);
    // The launch is the unfinished half, so it is named first.
    expect(report.followups.map((followup) => followup.id)).toEqual([
      'open-launch-url',
      'open-deployment',
      'eas-deploy-prod',
    ]);
  });

  it(`should run with no TTY on any stream`, async () => {
    // The e2e runner attaches no stdin (see `spawnExagent`), which is the shape an agent runs the
    // CLI in: every tool it spawns gets the same, so a prompt fails instead of hanging.
    const projectRoot = await setupAsync('go-app');
    const logPath = await installStubLaunchAsync(projectRoot);

    await executeExagentAsync(projectRoot, ['deploy', '--web'], {
      env: stubExpoEnv(projectRoot),
    });
    expect(readStubEasInvocations(projectRoot)[0]!.isTTY).toBe(false);

    await executeExagentAsync(projectRoot, ['deploy', '--native'], { env: launchEnv(logPath) });
    expect(readStubLaunchInvocations(logPath)[0]!.isTTY).toBe(false);
  });
});
