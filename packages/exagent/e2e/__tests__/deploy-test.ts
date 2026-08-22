/* eslint-env jest */
// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
//
// `exagent deploy` is orchestration: it resolves the tools, runs `expo export` and the EAS CLI as
// subprocesses, and hands the URLs back. These tests drive the published CLI against a stub `eas`
// installed next to the stub `expo` bin of the fixtures (`e2e/fixtures/README.md`), so the
// orchestration is asserted without an EAS account, a network, or a cloud build. The real `eas` is
// never invoked here.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  getTemporaryPath,
  readStubExpoInvocations,
  setupFixtureAsync,
  stubExpoEnv,
} from '../utils';

/** The shape `deploy --json` prints, per `src/deploy/types.ts`. */
type DeployReport = {
  projectRoot: string;
  targets: ('web' | 'native')[];
  web: { url: string | null; exportDir: string; outputTail: string } | null;
  native: {
    platform: 'ios' | 'android';
    profile: string;
    buildUrl: string | null;
    note: string;
    outputTail: string;
  } | null;
  followups: { id: string; command: string; why: string }[];
};

/** One recorded invocation of the stub `eas` bin. */
type StubEasInvocation = { args: string[]; cwd: string; isTTY: boolean };

const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

/** URLs the stub prints, in the shape the EAS CLI writes them. */
const STUB_DEPLOYMENT_URL = 'https://go-app--e2e123.expo.app';
const STUB_BUILD_URL =
  'https://expo.dev/accounts/acme/projects/go-app/builds/00000000-1111-2222-3333-444444444444';

/**
 * Stub `eas` bin. It records every invocation and prints the URL lines the real CLI ends on, which
 * is what the deploy parses its result out of.
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
} else if (args[0] === 'build') {
  process.stdout.write('Build request queued\\n');
  if (!quiet) {
    process.stdout.write('Build details: ${STUB_BUILD_URL}\\n');
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
  const binPath = path.join(binDir, 'eas');
  await fs.promises.writeFile(binPath, STUB_EAS);
  await fs.promises.chmod(binPath, 0o755);
  // Windows resolves `eas` through the `.cmd` shim, mirroring what npm/pnpm write.
  await fs.promises.writeFile(
    path.join(binDir, 'eas.cmd'),
    `@echo off\r\n"${process.execPath}" "${binPath}" %*\r\n`
  );
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(projectRoot);
}

/** Give a project the `eas.json` that EAS Build needs before it will build anything. */
async function writeEasJsonAsync(projectRoot: string): Promise<void> {
  await fs.promises.writeFile(
    path.join(projectRoot, 'eas.json'),
    JSON.stringify({ build: { production: {}, preview: { distribution: 'internal' } } }, null, 2)
  );
}

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
      expect(result.stdout).toContain('Next:');
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
      expect(result.stderr).toContain('Try: npx exagent deploy --platform ios');
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
        env: { PATH: emptyDir },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('EAS CLI is not available');
      expect(result.stderr).toContain('Try: npm install -g eas-cli');
      // The export costs minutes, so the missing tool is found before it runs.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });

  describe('native', () => {
    it(`should start the cloud build and report the build page`, async () => {
      const projectRoot = await setupAsync('go-app');
      await writeEasJsonAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, [
        'deploy',
        '--native',
        '--platform',
        'ios',
        '--json',
      ]);
      const report: DeployReport = JSON.parse(result.stdout);

      expect(readStubEasInvocations(projectRoot)).toEqual([
        {
          args: ['build', '--platform', 'ios', '--profile', 'production', '--non-interactive'],
          cwd: projectRoot,
          isTTY: false,
        },
      ]);
      expect(report).toMatchObject({
        targets: ['native'],
        web: null,
        native: { platform: 'ios', profile: 'production', buildUrl: STUB_BUILD_URL },
      });
      // The delivery rail for native is still pending, and the note says so instead of inventing
      // a launch.expo.dev URL (llp/0007 §Cross-platform deploy).
      expect(report.native!.note).toContain('launch.expo.dev');
      expect(report.followups.map((followup) => followup.id)).toEqual(['open-build', 'eas-submit']);
      // Nothing was exported: the native target does not go through EAS Hosting.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it(`should forward the build profile`, async () => {
      const projectRoot = await setupAsync('go-app');
      await writeEasJsonAsync(projectRoot);

      await executeExagentAsync(projectRoot, [
        'deploy',
        '--platform',
        'android',
        '--profile',
        'preview',
      ]);

      expect(readStubEasInvocations(projectRoot)[0]!.args).toEqual([
        'build',
        '--platform',
        'android',
        '--profile',
        'preview',
        '--non-interactive',
      ]);
    });

    it(`should answer a project without eas.json with the command that creates it`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(
        projectRoot,
        ['deploy', '--native', '--platform', 'ios'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('no eas.json');
      expect(result.stderr).toContain('Try: npx eas-cli build:configure');
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it(`should answer --native without a platform with a complete command`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('--platform');
      expect(result.stderr).toContain('Try: npx exagent deploy --native --platform ios');
    });
  });

  it(`should deploy both targets in one run`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeEasJsonAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, [
      'deploy',
      '--web',
      '--platform',
      'ios',
      '--json',
    ]);
    const report: DeployReport = JSON.parse(result.stdout);

    expect(report.targets).toEqual(['web', 'native']);
    expect(readStubEasInvocations(projectRoot).map((invocation) => invocation.args[0])).toEqual([
      'deploy',
      'build',
    ]);
    expect(report.web!.url).toBe(STUB_DEPLOYMENT_URL);
    expect(report.native!.buildUrl).toBe(STUB_BUILD_URL);
    // Three lines is all a follow-up block prints, even when two targets shipped.
    expect(report.followups).toHaveLength(3);
  });

  it(`should run with no TTY on any stream`, async () => {
    // The e2e runner attaches no stdin (see `spawnExagent`), which is the shape an agent runs the
    // CLI in: `--non-interactive` plus no stdin means a prompt fails instead of hanging.
    const projectRoot = await setupAsync('go-app');

    await executeExagentAsync(projectRoot, ['deploy', '--web'], {
      env: stubExpoEnv(projectRoot),
    });

    expect(readStubEasInvocations(projectRoot)[0]!.isTTY).toBe(false);
  });
});
