/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// `exagent build:wait` is a loop around `eas build:view --json`, and its answer is the exit code.
// These tests drive the published CLI against a stub `eas` bin that walks a scripted status
// sequence from a counter file, so every outcome — finished, errored, canceled, timed out — is
// asserted at the process boundary, without an EAS account, a login, or a network.
//
// The four exit codes get four tests on purpose: they are the contract, and a single test that
// checked "some non-zero code" would pass while the whole point of the command was broken.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  getTemporaryPath,
  installStubBinAsync,
  setupFixtureAsync,
} from '../utils';

/** The shape `build:wait --json` prints, per `src/builds/types.ts`. */
type BuildWaitReport = {
  kind: 'build' | 'submission';
  id: string;
  outcome: 'finished' | 'errored' | 'canceled' | 'timeout';
  status: string | null;
  platform: string | null;
  buildProfile: string | null;
  waitedMs: number;
  polls: number;
  build: {
    error: { errorCode: string | null; message: string | null; docsUrl: string | null } | null;
    artifacts: Record<string, string | null> | null;
    fingerprint: { hash: string | null } | null;
    metrics: Record<string, number | null> | null;
    createdAt: string | null;
    completedAt: string | null;
    appVersion: string | null;
    appBuildVersion: string | null;
  };
  followups: { id: string; command: string; why: string }[];
};

/** One recorded invocation of the stub `eas` bin. */
type StubEasInvocation = { args: string[]; cwd: string; isTTY: boolean };

const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

/** The build id every test waits on. */
const BUILD_ID = '2f1c9f0e-6b1e-4a3d-9c1a-0b6f1e2d3c4a';

const ARCHIVE_URL = 'https://expo.dev/artifacts/eas/e2e.ipa';
const BUILD_URL = 'https://expo.dev/accounts/e2e/projects/go-app/builds/e2e';

/**
 * Stub `eas` bin that walks a status sequence, one step per invocation.
 *
 * The counter lives in a file rather than in the process, because every poll is a *new* process —
 * which is exactly the thing being tested. It answers on stdout and puts its progress on stderr,
 * the way `--json` commands of the real CLI do.
 *
 * Environment variables the tests steer it with:
 * - STUB_EAS_STATUSES: comma-separated statuses, one per poll; the last one repeats forever
 * - STUB_EAS_EXIT_CODE: exit code to return instead of answering (default 0)
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

// The auth preflight asks this before the first poll (llp/0010 §Needs-human protocol, layer 1),
// so it answers on its own switch: a test steering the *polls* must not also decide whether the
// wait starts at all.
if (args[0] === 'whoami') {
  const whoamiExit = Number(process.env.STUB_EAS_WHOAMI_EXIT_CODE || 0);
  if (whoamiExit !== 0) {
    process.stderr.write((process.env.STUB_EAS_WHOAMI_STDERR || 'Not logged in') + '\\n');
    process.exit(whoamiExit);
  }
  process.stdout.write('e2e-account\\n');
  process.exit(0);
}

const exitCode = Number(process.env.STUB_EAS_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('Build not found: no build with that ID exists for this account.\\n');
  process.exit(exitCode);
}

const counterPath = path.join(cwd, 'stub-eas-counter');
let polls = 0;
try {
  polls = Number(fs.readFileSync(counterPath, 'utf8')) || 0;
} catch {}
fs.writeFileSync(counterPath, String(polls + 1));

const statuses = (process.env.STUB_EAS_STATUSES || 'FINISHED').split(',');
const status = statuses[Math.min(polls, statuses.length - 1)];
const finished = status === 'FINISHED';

// The real CLI keeps stdout for the answer and puts everything else on stderr.
process.stderr.write('Fetching the build...\\n');
process.stdout.write(
  JSON.stringify({
    id: args[1],
    status,
    platform: 'IOS',
    buildProfile: 'production',
    queuePosition: status === 'IN_QUEUE' ? statuses.length - polls : null,
    estimatedWaitTimeLeftSeconds: status === 'IN_QUEUE' ? 240 : null,
    appVersion: '1.2.0',
    appBuildVersion: '42',
    createdAt: '2026-08-23T10:00:00.000Z',
    completedAt: finished ? '2026-08-23T10:12:23.000Z' : null,
    fingerprint: { id: 'fingerprint-1', hash: 'a1b2c3d4' },
    artifacts: finished
      ? { buildUrl: ${JSON.stringify(BUILD_URL)}, applicationArchiveUrl: ${JSON.stringify(ARCHIVE_URL)} }
      : null,
    metrics: finished ? { buildWaitTime: 3, buildQueueTime: 7, buildDuration: 11 } : null,
    error:
      status === 'ERRORED'
        ? {
            errorCode: 'EAS_BUILD_UNKNOWN_FAIL',
            message: 'Gradle build failed with unknown error',
            docsUrl: 'https://docs.expo.dev/build-reference/troubleshooting/',
          }
        : null,
  }) + '\\n'
);
`;

/**
 * Copy a fixture and install the stub `eas` bin into the `.stub-bin` directory that the e2e runner
 * puts on `PATH`, so `eas` resolves to the stub the same way `expo` does.
 */
async function setupAsync(): Promise<string> {
  const projectRoot = await setupFixtureAsync('go-app');
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(stubScript, STUB_EAS);
  await installStubBinAsync(binDir, 'eas', stubScript);
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(projectRoot);
}

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

/** Every JSONL event of one run, as `2g` wrote them. */
function readEvents(eventsFile: string): Record<string, any>[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * A wait short enough to run in a test: poll every 50ms.
 *
 * The timeout is generous rather than tight, because these tests are about what the wait does when
 * the build reaches a status — it ends there, whatever the timeout is. A timeout small enough to
 * race the scripted sequence would make every one of them fail on a loaded machine instead.
 */
const FAST = ['--interval', '50ms', '--timeout', '30s'];

/**
 * Exit code of a run that stopped on a step only a person can finish (llp/0010 §Exit codes).
 *
 * Spelled out rather than imported, like the four outcome codes below it: an e2e test pins what
 * the process boundary shows, and one that read the constant from the source could not notice the
 * number changing.
 */
const EXIT_NEEDS_HUMAN = 7;

describe('exagent build:wait', () => {
  // Each exit code is the contract for one outcome, so each one gets its own test.
  describe('the exit code', () => {
    it('exits 0 when the build finishes', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_STATUSES: 'IN_QUEUE,IN_QUEUE,IN_PROGRESS,FINISHED' },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('finished — the build succeeded');
      // Four polls, each one a fresh `eas build:view <id> --json` with no TTY anywhere.
      expect(readStubEasInvocations(projectRoot)).toEqual(
        Array.from({ length: 4 }, () => ({
          args: ['build:view', BUILD_ID, '--json'],
          cwd: projectRoot,
          isTTY: false,
        }))
      );
    });

    it('exits 20 when the build fails', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_STATUSES: 'IN_PROGRESS,ERRORED' },
        reject: false,
      });

      expect(result.exitCode).toBe(20);
      expect(result.stdout).toContain('errored — the build failed');
      expect(result.stdout).toContain('EAS_BUILD_UNKNOWN_FAIL');
    });

    it('exits 21 when the build is canceled', async () => {
      const projectRoot = await setupAsync();

      // PENDING_CANCEL is not an outcome: the wait polls through it to the one that is.
      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_STATUSES: 'IN_PROGRESS,PENDING_CANCEL,CANCELED' },
        reject: false,
      });

      expect(result.exitCode).toBe(21);
      expect(result.stdout).toContain('canceled');
      expect(readStubEasInvocations(projectRoot)).toHaveLength(3);
    });

    it('exits 22 when the timeout expires and the build is still running', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(
        projectRoot,
        ['build:wait', BUILD_ID, '--interval', '50ms', '--timeout', '1s'],
        { env: { STUB_EAS_STATUSES: 'IN_PROGRESS' }, reject: false }
      );

      expect(result.exitCode).toBe(22);
      // A timeout is inconclusive, and the output says so rather than reporting a failure.
      expect(result.stdout).toContain('may still succeed');
      expect(result.stdout).toContain('status      IN_PROGRESS');
      // How *many* polls fit inside a second is the machine's answer, not the CLI's — every poll
      // spawns a process, and a loaded CI box fits fewer. The poll count and the backoff are
      // pinned deterministically under fake timers instead (`src/builds/__tests__/waitAsync-test.ts`).
      expect(readStubEasInvocations(projectRoot).length).toBeGreaterThanOrEqual(1);
    });
  });

  // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
  describe('--json', () => {
    it('prints exactly one JSON object on stdout, and the progress on the event stream', async () => {
      const projectRoot = await setupAsync();
      const eventsFile = path.join(projectRoot, 'events.jsonl');

      const result = await executeExagentAsync(
        projectRoot,
        ['build:wait', BUILD_ID, ...FAST, '--json'],
        {
          env: {
            STUB_EAS_STATUSES: 'IN_QUEUE,IN_QUEUE,IN_PROGRESS,FINISHED',
            LOG_EVENTS: eventsFile,
          },
        }
      );

      // One object and nothing else: a `JSON.parse` of the whole stream is the assertion.
      const report: BuildWaitReport = JSON.parse(result.stdout);
      expect(result.stdout.trim().startsWith('{')).toBe(true);
      expect(result.stdout.trim().endsWith('}')).toBe(true);
      // The follow-up section is a terminal affordance and stays off stdout here.
      expect(result.stdout).not.toContain('Suggested next:');

      // The top-level key set is the contract of the command.
      expect(Object.keys(report)).toEqual([
        'kind',
        'id',
        'outcome',
        'status',
        'platform',
        'buildProfile',
        'waitedMs',
        'polls',
        'build',
        'followups',
      ]);
      expect(report).toMatchObject({
        kind: 'build',
        id: BUILD_ID,
        outcome: 'finished',
        status: 'FINISHED',
        platform: 'IOS',
        buildProfile: 'production',
        polls: 4,
        build: {
          error: null,
          artifacts: { applicationArchiveUrl: ARCHIVE_URL, buildUrl: BUILD_URL },
          fingerprint: { hash: 'a1b2c3d4' },
          metrics: { buildWaitTime: 3, buildQueueTime: 7, buildDuration: 11 },
          appVersion: '1.2.0',
          appBuildVersion: '42',
        },
      });
      expect(report.waitedMs).toBeGreaterThan(0);
      expect(report.followups.map((followup) => followup.id)).toEqual([
        'open-build-page',
        'eas-build-download',
      ]);

      // Progress never touched stdout; it is on the JSONL stream, one event per poll.
      const events = readEvents(eventsFile);
      const polls = events.filter((entry) => entry._e === 'cli:build_wait_poll');
      expect(polls).toHaveLength(4);
      expect(polls[0]).toMatchObject({
        kind: 'build',
        id: BUILD_ID,
        poll: 1,
        status: 'IN_QUEUE',
        queuePosition: 4,
        estimatedWaitTimeLeftSeconds: 240,
      });
      expect(polls[3]).toMatchObject({ poll: 4, status: 'FINISHED' });

      // And the outcome is on the stream too, for an agent reading only the JSONL.
      expect(events.filter((entry) => entry._e === 'cli:build_wait')).toEqual([
        expect.objectContaining({
          outcome: 'finished',
          status: 'FINISHED',
          polls: 4,
          exitCode: 0,
          interrupted: false,
        }),
      ]);
    });

    it('prints one object for a failed build too, with the exit code in the payload’s outcome', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(
        projectRoot,
        ['build:wait', BUILD_ID, ...FAST, '--json'],
        { env: { STUB_EAS_STATUSES: 'ERRORED' }, reject: false }
      );
      const report: BuildWaitReport = JSON.parse(result.stdout);

      expect(result.exitCode).toBe(20);
      expect(report.outcome).toBe('errored');
      expect(report.build.error).toMatchObject({ errorCode: 'EAS_BUILD_UNKNOWN_FAIL' });
      expect(report.followups.map((followup) => followup.id)).toEqual([
        'open-error-docs',
        'eas-build-view',
      ]);
    });
  });

  describe('the human output', () => {
    it('prints one labelled fact per line, and the next actions', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_STATUSES: 'FINISHED' },
      });

      expect(result.stdout).toContain(`build       ${BUILD_ID}`);
      expect(result.stdout).toContain('status      FINISHED');
      expect(result.stdout).toContain('platform    ios');
      expect(result.stdout).toContain('profile     production');
      expect(result.stdout).toContain(`artifact    ${ARCHIVE_URL}`);
      expect(result.stdout).toContain('Suggested next:');
    });

    it('leaves the next actions out when they are turned off', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(
        projectRoot,
        ['build:wait', BUILD_ID, ...FAST, '--no-followups'],
        { env: { STUB_EAS_STATUSES: 'FINISHED' } }
      );

      expect(result.stdout).not.toContain('Suggested next:');
    });
  });

  describe('what the tool cannot do', () => {
    // Three failed polls in a row is a tool error, not an outcome: exit 1, not the 20-band.
    it('exits 1 when the id is rejected, and names the command that waits on a workflow', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_EXIT_CODE: '1' },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('3 times in a row');
      expect(result.stderr).toContain('Build not found');
      // The workflow command is a conditional suggestion, so it stays inside the `How:` sentence
      // that states the condition. The last line — what a driving agent acts on — is the check
      // that is worth running unconditionally, against the binary that actually ran.
      expect(result.stderr).toContain(`npx eas workflow:status ${BUILD_ID} --wait --json`);
      expect(result.stderr).toMatch(/Try: .*[/\\]\.stub-bin[/\\]eas(\.cmd)? whoami/);
      expect(result.stderr).not.toContain(`Try: npx eas workflow:status`);
      // It gave up after three, rather than polling for the whole timeout.
      expect(readStubEasInvocations(projectRoot)).toHaveLength(3);
    });

    // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 1 — a wait that nobody
    // is signed in for cannot see any build, so three doomed polls and a "gave up waiting" that
    // names the wrong cause become one accurate answer, before anything is spent.
    it('exits 7 without polling when nobody is signed in', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: { STUB_EAS_WHOAMI_EXIT_CODE: '1' },
        reject: false,
      });

      expect(result.exitCode).toBe(EXIT_NEEDS_HUMAN);
      expect(result.stderr).toContain('Needs a human   eas-login');
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    // The other half: a preflight that could not answer is not an answer of "no".
    it('polls as usual when the preflight could not answer', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID, ...FAST], {
        env: {
          STUB_EAS_STATUSES: 'FINISHED',
          STUB_EAS_WHOAMI_EXIT_CODE: '101',
          STUB_EAS_WHOAMI_STDERR: 'Stack backtrace:\n   2: tuft::main',
        },
      });

      expect(result.exitCode).toBe(0);
      expect(readStubEasInvocations(projectRoot)).toHaveLength(1);
    });

    it('exits 1 and spends nothing when no id was given', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build:wait'], { reject: false });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Missing build id');
      expect(result.stderr).toContain('Try: npx eas build:list');
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it('exits 1 and spends nothing on an unusable duration', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(
        projectRoot,
        ['build:wait', BUILD_ID, '--timeout', '45min'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('got 45min');
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it('names the install command when no eas is available', async () => {
      const projectRoot = await setupAsync();
      // A PATH with nothing on it: the only way to test a missing EAS CLI on a machine that has one.
      const emptyDir = getTemporaryPath();
      await fs.promises.mkdir(emptyDir, { recursive: true });

      const result = await executeExagentAsync(projectRoot, ['build:wait', BUILD_ID], {
        env: process.platform === 'win32' ? { PATH: emptyDir, Path: emptyDir } : { PATH: emptyDir },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('EAS CLI is not available');
      expect(result.stderr).toContain('Try: npm install -g eas-cli');
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — the group is named after a verb of
  // another CLI, and answering `exagent build --platform ios` with a listing and exit 0 would tell
  // a driving agent it had started a build.
  describe('the bare group name', () => {
    it('fails on options with no action, and names the command that does start a build', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build', '--platform', 'ios'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('names no action, so nothing ran');
      expect(result.all).toContain('Try: npx eas build --platform ios');
      // Nothing was run on its way to saying so.
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it('still lists the actions for the bare name, and exits 0', async () => {
      const projectRoot = await setupAsync();

      const result = await executeExagentAsync(projectRoot, ['build']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('build:wait');
    });
  });
});
