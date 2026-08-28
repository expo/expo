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

/**
 * Exit code of a run that stopped on a step only a person can finish (llp/0010 §Exit codes).
 *
 * Spelled out rather than imported: an e2e test pins what the process boundary actually shows, and
 * one that read the constant from the source could not notice the number changing.
 */
const EXIT_NEEDS_HUMAN = 7;

/** Every JSONL event a run wrote to its `LOG_EVENTS` file. `2g` names each one in `_e`. */
function readEvents(eventsFile: string): any[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** The last `count` non-empty lines of a stream, which is where the handoff block sits. */
function lastLines(output: string, count: number): string[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-count);
}

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
 * - STUB_EAS_STDERR: what it prints on stderr before a non-zero exit, so a test can hand the
 *   wrapper the exact wording the real CLI uses
 * - STUB_EAS_HANG: `1` to print a prompt and then wait forever, like a CLI asking a question
 *   nobody can answer
 * - STUB_EAS_WHOAMI_EXIT_CODE: exit code of the auth preflight's `eas whoami` (default 0)
 * - STUB_EAS_WHOAMI_STDERR: what that `whoami` prints before a non-zero exit
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

// The auth preflight (llp/0010 §Needs-human protocol, layer 1) asks this before anything runs, so
// it answers on its own switch: a test that steers the *deploy* must not accidentally steer the
// question that decides whether the deploy happens at all.
if (args[0] === 'whoami') {
  const whoamiExit = Number(process.env.STUB_EAS_WHOAMI_EXIT_CODE || 0);
  if (whoamiExit !== 0) {
    process.stderr.write((process.env.STUB_EAS_WHOAMI_STDERR || 'Not logged in') + '\\n');
    process.exit(whoamiExit);
  }
  process.stdout.write('e2e-account\\n');
  process.exit(0);
}

if (process.env.STUB_EAS_HANG === '1') {
  process.stderr.write('Resolving the deployment\\n');
  process.stderr.write('? Select a platform\\n');
  // Nothing else, ever: this is the hang the guard exists for.
  setInterval(() => {}, 60000);
  return;
}

const exitCode = Number(process.env.STUB_EAS_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write(
    (process.env.STUB_EAS_STDERR ||
      'Entity not authorized: the request was made without an account.') + '\\n'
  );
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

/** Name of the file the stub `npx` bin appends one JSON line to per invocation. */
const STUB_NPX_LOG_NAME = 'stub-npx-invocations.jsonl';

/**
 * Stub `npx`, standing in for the package runner — which is the **only** way `deploy` reaches the
 * EAS CLI (`src/utils/easCli.ts`, wave 18).
 *
 * It used to be the rig for a fallback: `deploy` ran the `eas` it resolved, noticed a wrapper crash,
 * and retried through `npx`, so the stub had environment switches of its own to steer that second
 * run independently of the first. There is no first run any more. The switches are gone with it, and
 * this forwards the environment unchanged, so `STUB_EAS_*` steers the one run that happens.
 *
 * What it does check is its own argv, the way npx would: `--yes` is npm's flag and is stripped
 * rather than forwarded, and a spec that is not `eas-cli` is an error — a stub that ran anything it
 * was handed would hide a wrong package name instead of failing on it. It also records every
 * invocation, which is how a test asserts the runner was used and with what.
 */
function stubNpx(easStubPath: string): string {
  return `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.cwd(), ${JSON.stringify(STUB_NPX_LOG_NAME)}),
  JSON.stringify({ args, cwd: process.cwd() }) + '\\n'
);

const forwarded = args[0] === '--yes' ? args.slice(1) : args;
if (forwarded[0] !== 'eas-cli' && forwarded[0] !== 'eas-cli@latest') {
  process.stderr.write('stub npx: nothing here runs ' + forwarded[0] + '\\n');
  process.exit(1);
}

const result = spawnSync(process.execPath, [${JSON.stringify(easStubPath)}, ...forwarded.slice(1)], {
  stdio: 'inherit',
});
process.exit(result.status === null ? 1 : result.status);
`;
}

/** Every recorded invocation of the stub `npx` bin. */
function readStubNpxInvocations(projectRoot: string): { args: string[]; cwd: string }[] {
  const logPath = path.join(projectRoot, STUB_NPX_LOG_NAME);
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
 * Copy a fixture and install a stub **package runner** into the `.stub-bin` directory that
 * `stubExpoEnv()` puts on `PATH`.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
 * `deploy` reaches the EAS CLI one way — `npx --yes eas-cli@latest deploy` — so the stub `npx` is
 * not a fallback rig any more, it is *the* thing under test. There is no stub `eas` bin beside it:
 * nothing resolves a file by that name, and installing one would test a rung that no longer exists.
 */
async function setupAsync(
  fixtureName: string,
  { pinEasCli = true }: { pinEasCli?: boolean } = {}
): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  // Pinned by default, because that is the shape most of this suite is about: a project that
  // declares `eas-cli` gets the bare spec, which the runner resolves out of `node_modules` without a
  // registry call — and it is what makes the *auth preflight* ask the EAS CLI rather than falling
  // through to the project's `expo whoami` (`src/needsHuman/preflight.ts` §askEasAsync). One test
  // below passes `pinEasCli: false` for the other shape.
  if (pinEasCli) {
    const manifestPath = path.join(projectRoot, 'package.json');
    const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
    manifest.devDependencies = { ...manifest.devDependencies, 'eas-cli': '^22.0.0' };
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  // The stub is a Node script the shims run, not a bin itself: Windows can execute neither a
  // shebang script nor an extensionless file, so both shims are written (see
  // {@link installStubBinAsync}).
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(stubScript, STUB_EAS);
  const npxScript = path.join(binDir, 'npx-stub.js');
  await fs.promises.writeFile(npxScript, stubNpx(stubScript));
  await installStubBinAsync(binDir, 'npx', npxScript);
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

/**
 * The work the wrapper asked the stub `eas` bin to do.
 *
 * The auth preflight's `eas whoami` is left out unless a caller asks for it: it is a question
 * about the machine rather than a step of the command, and every assertion about *what ran* means
 * the steps. `{ includeProbes: true }` is how the preflight itself is asserted.
 */
function readStubEasInvocations(
  projectRoot: string,
  { includeProbes = false }: { includeProbes?: boolean } = {}
): StubEasInvocation[] {
  const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((invocation) => includeProbes || invocation.args[0] !== 'whoami');
}

describe('exagent deploy', () => {
  describe('web', () => {
    it(`should export the web bundle, deploy it, and print one JSON object`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json']);
      const report: DeployReport = JSON.parse(result.stdout);

      // The export runs through the project's own Expo CLI, as a subprocess.
      // The export is a captured run of the Expo CLI, so it gets `CI=1` like every other one.
      expect(readStubExpoInvocations(projectRoot)).toEqual([
        { args: ['export', '--platform', 'web'], cwd: projectRoot, ci: '1', isTTY: false },
      ]);
      // Every EAS run goes through the package runner — the auth preflight's `whoami` as much as the
      // upload — with `--yes` and the package spec ahead of the command word. The spec is bare,
      // because this project declares `eas-cli`: `@latest` would run a different version and ask the
      // registry to find out which (`src/utils/easCli.ts`).
      expect(readStubNpxInvocations(projectRoot)).toEqual([
        { args: ['--yes', 'eas-cli', 'whoami'], cwd: projectRoot },
        { args: ['--yes', 'eas-cli', 'deploy', '--non-interactive'], cwd: projectRoot },
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
      // The check names the invocation that actually ran, which with one rung is the only thing it
      // could name — and is a line the reader can paste.
      expect(result.stderr).toContain('Try: npx --yes eas-cli whoami');
    });

    // @ref llp/0021-honest-reports.rfc.md §Route around a binary that is not the CLI
    // This block used to be about a binary the machine had under the name `eas` — a wrapper, a stale
    // link, a shim — whose Rust backtrace `deploy` quoted as EAS output [observed — friction run,
    // 2026-08-23], and whose `Try:` line ran the same broken file again [F67]. The fix then was to
    // notice the crash and retry through a package runner.
    //
    // **The runner is the only rung now** (wave 18), so there is no file under that name to pick and
    // no second rung to retry on. What is left to pin is that the guard did not go away with the
    // scenario: a package that answers like a wrapper is still named rather than quoted, the upload
    // still happens exactly once, and the `Try:` line still names what actually ran.
    describe('a package under the name `eas-cli` that does not answer like the CLI', () => {
      /** The env of a run whose CLI dies the way a wrapper dies. */
      const shimEnv = {
        STUB_EAS_EXIT_CODE: '101',
        STUB_EAS_STDERR:
          'Caused by:\n    No such file or directory (os error 2)\n\nStack backtrace:\n   0: <std::backtrace::Backtrace>::create\n   2: tuft::main',
      };

      it(`should name it rather than quoting it, and upload exactly once`, async () => {
        const projectRoot = await setupAsync('go-app');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
          env: shimEnv,
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        // Once. A retry here would spend a second upload to be told the same thing. (The preflight's
        // `whoami` goes through the same runner, so the upload runs are what this counts.)
        expect(
          readStubNpxInvocations(projectRoot).filter((run) => run.args.includes('deploy'))
        ).toEqual([{ args: ['--yes', 'eas-cli', 'deploy', '--non-interactive'], cwd: projectRoot }]);
        // The invocation is named; the panic is never quoted as EAS's answer about the account.
        expect(result.stderr).toContain('npx --yes eas-cli');
        expect(result.stderr).toContain('may not be the real CLI');
        expect(result.all).not.toContain('tuft::main');
        // And no advice about accounts, which is what a crash makes irrelevant.
        expect(result.stderr).not.toContain('EXPO_TOKEN');
      });

      it(`should let the CLI's own sentence decide the diagnosis when it gave one`, async () => {
        const projectRoot = await setupAsync('go-app');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
          env: {
            // Not a crash: the real CLI, refusing for a reason of its own.
            STUB_EAS_EXIT_CODE: '1',
            STUB_EAS_STDERR: 'EAS project not configured.',
          },
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        // The EAS CLI's own sentence decides it, not the exit signature (S2).
        expect(result.stderr).toContain('not linked');
        const { error } = JSON.parse(result.stdout);
        expect(error).toMatchObject({
          code: 'EAS_DEPLOY_FAILED',
          // The non-interactive form, because the run that failed had no terminal to prompt in
          // either (F143).
          suggestedCommand: 'npx eas init --account <account-name> --non-interactive',
        });
        expect(error.message).not.toContain('.stub-bin');
      });

      // @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — **F143.** The unlinked
      // project reaches the person-shaped band, because linking is a decision only they can make.
      // Exit 7 was right and the line under it was not: `Ask the user  npx eas deploy` named the
      // command that had just failed, while the `How:` two lines above already said `eas init`
      // [observed — friction run 9]. The generic registry row fills in the invocation that stopped,
      // which is right for a tool that went silent and wrong for one that said what was missing.
      it(`should hand the person the fix, not the command that just failed`, async () => {
        const projectRoot = await setupAsync('go-app');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
          env: {
            STUB_EAS_EXIT_CODE: '1',
            // What the real CLI prints, accounts and all [observed — friction run 9].
            STUB_EAS_STDERR: [
              'EAS project not configured. This command cannot configure it in non-interactive mode. Run one of the following, then re-run this command:',
              '  eas init --id <project-id> --non-interactive',
              '  eas init --account <account-name> --non-interactive',
              'Accounts you can create projects in: kudochien, kudo1',
            ].join('\n'),
          },
          reject: false,
        });

        expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
        expect(lastLines(result.stderr, 2)).toEqual([
          'Needs a human   eas-prompt',
          'Ask the user    npx eas init --account <account-name> --non-interactive',
        ]);
        // The accounts the person has to choose between, quoted from the tool's own output.
        expect(result.stderr).toContain('kudochien, kudo1');
        // And never the line that produced this failure.
        expect(result.stderr).not.toContain('Ask the user    npx eas deploy');
      });

      // One account is not a choice, so the same failure hands back a line that can be run as is.
      it(`should fill the account in when the EAS CLI named only one`, async () => {
        const projectRoot = await setupAsync('go-app');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
          env: {
            STUB_EAS_EXIT_CODE: '1',
            STUB_EAS_STDERR: [
              'EAS project not configured. This command cannot configure it in non-interactive mode.',
              'Accounts you can create projects in: kudo1',
            ].join('\n'),
          },
          reject: false,
        });

        expect(lastLines(result.stderr, 1)).toEqual([
          'Ask the user    npx eas init --account kudo1 --non-interactive',
        ]);
      });
    });

    // The other shape of the one rung: a project that declares no `eas-cli` at all. It gets
    // `@latest`, and the auth preflight declines to spend a package install on reading a session
    // file, so the account question goes to the project's own Expo CLI instead
    // (llp/0015 §What the first run costs, and who pays it).
    it(`should ask for @latest, and let the Expo CLI answer the account question, when nothing is pinned`, async () => {
      const projectRoot = await setupAsync('go-app', { pinEasCli: false });

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json']);

      expect(result.exitCode).toBe(0);
      expect(readStubNpxInvocations(projectRoot)).toEqual([
        { args: ['--yes', 'eas-cli@latest', 'deploy', '--non-interactive'], cwd: projectRoot },
      ]);
      expect(readStubExpoInvocations(projectRoot).map(({ args }) => args)).toEqual([
        ['whoami'],
        ['export', '--platform', 'web'],
      ]);
      // Nothing asked the EAS CLI who this machine is: that would have been the package install.
      expect(
        readStubEasInvocations(projectRoot, { includeProbes: true }).map(({ args }) => args)
      ).toEqual([['deploy', '--non-interactive']]);
    });

    // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
    // The three ways a run can stop on a person, driven through the real process boundary: the
    // wording of the tool, the exit code, the printed block and the event, with stdin closed
    // throughout (which is the default condition of every e2e run here).
    describe('a step only a person can finish', () => {
      // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 1
      // The whole point is *when*: the export takes minutes, and the account is knowable in one
      // short subprocess before it starts [observed — friction run, 2026-08-23: ten seconds of
      // exporting, and only then the auth failure].
      it(`should stop before the export when nobody is signed in`, async () => {
        const projectRoot = await setupAsync('go-app');
        const eventsFile = path.join(projectRoot, 'events.jsonl');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
          env: { STUB_EAS_WHOAMI_EXIT_CODE: '1', LOG_EVENTS: eventsFile },
          reject: false,
        });

        expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
        // Nothing was spent: no export, and no upload.
        expect(readStubExpoInvocations(projectRoot)).toEqual([]);
        expect(readStubEasInvocations(projectRoot)).toEqual([]);
        // The preflight did ask, once.
        expect(
          readStubEasInvocations(projectRoot, { includeProbes: true }).map(({ args }) => args)
        ).toEqual([['whoami']]);

        expect(lastLines(result.stderr, 3)).toEqual([
          'Needs a human   eas-login',
          'Ask the user    npx eas login',
          'Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)',
        ]);
        expect(
          readEvents(eventsFile).find((entry) => entry._e === 'cli:needs_human')
        ).toMatchObject({ scenario: 'eas-login', detectedBy: 'preflight' });
        // And as data, for the agent that asked for JSON.
        expect(JSON.parse(result.stdout).error).toMatchObject({
          code: 'EAS_LOGIN_REQUIRED',
          needsHuman: { scenario: 'eas-login', detectedBy: 'preflight' },
        });
      });

      // The correctness half of the preflight. A binary that is not the EAS CLI exits non-zero
      // just like a signed-out one; reading that as "signed out" would stop a deploy that had
      // every right to run, on a machine whose `eas` is a broken shim.
      it(`should deploy anyway when the preflight could not answer`, async () => {
        const projectRoot = await setupAsync('go-app');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
          env: {
            STUB_EAS_WHOAMI_EXIT_CODE: '101',
            STUB_EAS_WHOAMI_STDERR: 'Stack backtrace:\n   2: tuft::main',
          },
          reject: false,
        });

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout).web.url).toBe(STUB_DEPLOYMENT_URL);
      });

      it(`should recognise the EAS CLI asking for a login`, async () => {
        const projectRoot = await setupAsync('go-app');
        const eventsFile = path.join(projectRoot, 'events.jsonl');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
          env: {
            STUB_EAS_EXIT_CODE: '1',
            // The one stable auth error of the real CLI, verbatim.
            STUB_EAS_STDERR:
              'Either log in with eas login or set the EXPO_TOKEN environment variable if you’re using EAS CLI on CI (https://docs.expo.dev/accounts/programmatic-access/)',
            LOG_EVENTS: eventsFile,
          },
          reject: false,
        });

        expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
        expect(lastLines(result.stderr, 3)).toEqual([
          'Needs a human   eas-login',
          'Ask the user    npx eas login',
          'Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)',
        ]);
        const events = readEvents(eventsFile);
        expect(events.filter((entry) => entry._e === 'cli:needs_human')).toHaveLength(1);
        expect(events.find((entry) => entry._e === 'cli:needs_human')).toMatchObject({
          // The code the deploy has always raised, now carrying the handoff.
          code: 'EAS_DEPLOY_FAILED',
          scenario: 'eas-login',
          command: 'npx eas login',
          detectedBy: 'exit-signature',
        });
        // The stub never saw a terminal: nothing here can answer a prompt.
        expect(readStubEasInvocations(projectRoot)[0]!.isTTY).toBe(false);
      });

      it(`should answer the Expo CLI's non-interactive stop generically, naming the command`, async () => {
        const projectRoot = await setupAsync('go-app');
        const eventsFile = path.join(projectRoot, 'events.jsonl');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
          env: {
            STUB_EXPO_EXIT_CODE: '1',
            // What `@expo/cli`'s prompt helper prints when it cannot ask.
            STUB_EXPO_STDERR: `Input is required, but 'npx expo' is in non-interactive mode.`,
            LOG_EVENTS: eventsFile,
          },
          reject: false,
        });

        expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
        // Nothing in the output says *which* prompt it was, so the answer names the tool and the
        // command instead of guessing.
        expect(lastLines(result.stderr, 2)).toEqual([
          'Needs a human   expo-prompt',
          'Ask the user    npx expo export --platform web',
        ]);
        expect(
          readEvents(eventsFile).find((entry) => entry._e === 'cli:needs_human')
        ).toMatchObject({ code: 'EXPORT_FAILED', scenario: 'expo-prompt' });
        // The upload never started: the export is what stopped.
        expect(readStubEasInvocations(projectRoot)).toEqual([]);
      });

      it(`should kill a tool that went silent on a question, instead of hanging`, async () => {
        const projectRoot = await setupAsync('go-app');
        const eventsFile = path.join(projectRoot, 'events.jsonl');

        const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
          env: {
            STUB_EAS_HANG: '1',
            // The guard is opted into by the call site; the window is this variable.
            EXAGENT_PROMPT_TIMEOUT_MS: '1500',
            LOG_EVENTS: eventsFile,
          },
          reject: false,
        });

        expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
        expect(result.stderr).toContain('stopped on a question');
        // The line it stopped on travels as quoted, untrusted text.
        expect(result.stderr).toContain('? Select a platform');
        expect(lastLines(result.stderr, 2)).toEqual([
          'Needs a human   eas-prompt',
          'Ask the user    npx eas deploy',
        ]);
        expect(
          readEvents(eventsFile).find((entry) => entry._e === 'cli:needs_human')
        ).toMatchObject({ scenario: 'eas-prompt', detectedBy: 'prompt-pattern' });
      });
    });

    // @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
    // Since wave 18 this failure needs a `PATH` with **no package runner** on it either: with one,
    // the resolver downloads the published CLI rather than refusing. So the advice changed with the
    // scenario — the reader who reaches this has no `npx`, and `npm install -g eas-cli` was a
    // command they could not run either.
    it(`should name what to install when neither an eas nor a runner is available`, async () => {
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
      expect(result.stderr).toContain('The EAS CLI could not be reached');
      expect(result.stderr).toContain('no package runner');
      expect(result.stderr).toContain('Try: npm install --save-dev eas-cli');
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

    // A login is a person's job, so this leaves the process in the needs-human band
    // (llp/0010 §Needs-human protocol) instead of looking like a call an agent typed wrong.
    it(`should hand a machine that is not signed in back to its user`, async () => {
      const projectRoot = await setupAsync('go-app');
      const logPath = await installStubLaunchAsync(projectRoot);
      const eventsFile = path.join(projectRoot, 'events.jsonl');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        env: { ...launchEnv(logPath, { mode: 'unauthenticated' }), LOG_EVENTS: eventsFile },
        reject: false,
      });

      expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
      expect(result.stderr).toContain('not signed in');
      // The last three lines are the handoff, and the recovery is on the last one.
      expect(lastLines(result.stderr, 3)).toEqual([
        'Needs a human   expo-login',
        'Ask the user    npx expo login',
        'Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)',
      ]);
      expect(readEvents(eventsFile).find((entry) => entry._e === 'cli:needs_human')).toMatchObject({
        code: 'LAUNCH_NOT_AUTHENTICATED',
        scenario: 'expo-login',
        unattendedEnv: ['EXPO_TOKEN'],
        resumable: true,
        detectedBy: 'exit-signature',
      });
      // The class is on the error event too, for a consumer that reads only that one.
      expect(readEvents(eventsFile).find((entry) => entry._e === 'cli:error')).toMatchObject({
        needsHuman: true,
      });
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
