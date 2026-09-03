// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
//
// The two halves of detaching that a unit test can see: the command line the child is started
// with, and the log file the output goes to. The spawn itself — `detached`, `unref`, the file
// descriptors — is the e2e test's, because nothing about it is true until a real process runs.

import { vol } from 'memfs';

import type { BundlerReadyResult } from '../../runtime/waitReady';
import {
  buildDetachSpawn,
  needsOpenPlatformGrace,
  notReadyError,
  resolveDetachFailure,
} from '../detachAsync';
import { detachedLogPath, openDetachedLogSync, readDetachedLogSync } from '../logFile';
import { resolveDevLogsOptions, DEFAULT_LOG_TAIL_LINES } from '../resolveLogsOptions';
import { resolveDevOptions } from '../resolveOptions';

const projectRoot = '/project';

afterEach(() => vol.reset());

describe(buildDetachSpawn, () => {
  it(`runs this CLI again, on this process' own Node`, () => {
    const spawn = buildDetachSpawn('/bin/cli.js', ['--yes']);

    expect(spawn.command).toBe(process.execPath);
    expect(spawn.args).toEqual(['/bin/cli.js', 'dev', '--yes']);
  });

  // The one thing that must not survive: a child given `--detach` would detach a detached run.
  it(`strips --detach, so the child is the run`, () => {
    expect(buildDetachSpawn('/bin/cli.js', ['--detach', '--yes']).args).not.toContain('--detach');
  });

  // The wait is the parent's, and the child has nobody to report it to.
  it(`strips --wait-ready`, () => {
    expect(buildDetachSpawn('/bin/cli.js', ['--detach', '--wait-ready']).args).not.toContain(
      '--wait-ready'
    );
  });

  // `--json` in the child would switch the plan's subprocess output to `capture` — which is the
  // very output the log file exists to hold — and print an object nobody would ever read.
  it(`strips --json, because the parent owns stdout`, () => {
    expect(buildDetachSpawn('/bin/cli.js', ['--detach', '--json']).args).not.toContain('--json');
  });

  it(`keeps everything the dev server needs`, () => {
    const { args } = buildDetachSpawn('/bin/cli.js', [
      '--detach',
      '--yes',
      '--port',
      '8195',
      '--ios',
      '--no-agent-skills',
    ]);

    expect(args).toEqual([
      '/bin/cli.js',
      'dev',
      '--yes',
      '--port',
      '8195',
      '--ios',
      '--no-agent-skills',
    ]);
  });

  it(`is what resolveDevOptions hands it`, () => {
    const options = resolveDevOptions(['--detach', '--wait-ready', '--yes', '--port', '8195']);

    expect(options.detach).toBe(true);
    expect(options.waitReady).toBe(true);
    expect(buildDetachSpawn('/bin/cli.js', options.detachArgv).args).toEqual([
      '/bin/cli.js',
      'dev',
      '--yes',
      '--port',
      '8195',
    ]);
  });
});

// @ref llp/0021-honest-reports.rfc.md §The rules — friction run
// 7's F61 and live staging's S4. Three facts in, one verdict out.
describe(resolveDetachFailure, () => {
  const healthy = { exited: false, verdict: null, statusAnswering: true };

  it(`should let a live child with a live bundler through`, () => {
    expect(resolveDetachFailure(healthy)).toBeNull();
  });

  it(`should let a run that never claimed readiness through`, () => {
    expect(resolveDetachFailure({ ...healthy, statusAnswering: null })).toBeNull();
  });

  it(`should refuse a child that has exited`, () => {
    expect(resolveDetachFailure({ ...healthy, exited: true })).toBe('child-exited');
  });

  // The handoff block is printed by a process on its way out, so it settles the question before
  // the exit itself has been observed — which is the whole race the finding is about.
  it(`should prefer the child's own scenario over the bare exit`, () => {
    expect(
      resolveDetachFailure({
        exited: true,
        verdict: { scenario: 'macos-automation', message: 'macOS refused' },
        statusAnswering: false,
      })
    ).toBe('needs-human');
  });

  it(`should refuse on the scenario alone, before the exit is seen`, () => {
    expect(
      resolveDetachFailure({
        ...healthy,
        verdict: { scenario: 'expo-prompt', message: 'Input is required' },
      })
    ).toBe('needs-human');
  });

  // A failure with no handoff is not a needs-human one, however it is worded.
  it(`should refuse a child whose log holds an error and no scenario`, () => {
    expect(
      resolveDetachFailure({
        exited: true,
        verdict: { scenario: null, message: 'CommandError: the plan stopped' },
        statusAnswering: true,
      })
    ).toBe('child-exited');
  });

  it(`should refuse a bundler that stopped answering under a live child`, () => {
    expect(resolveDetachFailure({ ...healthy, statusAnswering: false })).toBe('not-answering');
  });
});

// @ref llp/0021-honest-reports.rfc.md §The rules — F140. The verdict table above
// is checked once, at the moment of return, and `expo start --ios` can die a quarter of a second
// later. This decides which runs are re-checked for a while before the claim is printed.
describe(needsOpenPlatformGrace, () => {
  const serving = { phase: 'serving', step: 'expo start --go', opensPlatform: false } as const;
  const openingIos = {
    phase: 'serving',
    step: 'expo start --go --ios',
    opensPlatform: true,
  } as const;

  it(`re-checks a run whose dev-server step also opens the app`, () => {
    expect(needsOpenPlatformGrace({ ready: true, phase: openingIos })).toBe(true);
  });

  // The whole cost of this is paid by the runs it is for: a plan that opens nothing has no late
  // rejection on its way, so it pays nothing.
  it(`does not re-check a run that opens nothing`, () => {
    expect(needsOpenPlatformGrace({ ready: true, phase: serving })).toBe(false);
  });

  // @ref llp/0021-honest-reports.rfc.md §The rules — the correction of 2026-09-03.
  //
  // This used to be `false`, on the reasoning that "a run that asked for no readiness claims
  // nothing". It claims plenty: `dev --detach --ios` prints `Dev server <url> · detached` and a
  // pid, and exits 0. Live, that pid was gone and nothing was listening on that URL within the
  // second — `expo start --go --ios` had been refused Automation permission by macOS and taken the
  // dev server with it [observed — macOS 25.5, no Automation grant, 2026-09-03: exit 0 beside a
  // `curl` of the printed URL answering 000]. Adding `--wait-ready` caught it, which is what
  // located the hole: the grace this decides was the fix for exactly that failure, and the one
  // flag it was gated on was the flag that was missing.
  //
  // What the grace checks for such a run is narrowed rather than the same — see
  // {@link resolveDetachFailure} and the `statusAnswering: null` it is given.
  it(`re-checks a run that claimed no readiness but printed a dev server`, () => {
    expect(needsOpenPlatformGrace({ ready: null, phase: openingIos })).toBe(true);
  });

  // The failure has already been raised by then; a grace period on top of it would only delay it.
  it(`does not re-check a run whose bundler never answered`, () => {
    expect(needsOpenPlatformGrace({ ready: false, phase: openingIos })).toBe(false);
  });

  // A plan still compiling has started no dev server, so `--wait-ready` has not returned true and
  // this question does not arise — pinned so the two conditions cannot be conflated.
  it(`does not re-check a plan that is still building`, () => {
    expect(
      needsOpenPlatformGrace({
        ready: true,
        phase: { phase: 'building', step: 'expo run:ios', opensPlatform: true },
      })
    ).toBe(false);
  });
});

describe('the detach flags', () => {
  it(`refuses --wait-ready without --detach, which would wait for nothing`, () => {
    expect(() => resolveDevOptions(['--wait-ready'])).toThrow(/only means something with --detach/);
  });

  it(`refuses --plan with --detach, which would run nothing`, () => {
    expect(() => resolveDevOptions(['--plan', '--detach'])).toThrow(/opposite things/);
  });
});

describe(readDetachedLogSync, () => {
  it(`answers null for a project that has never detached one`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(readDetachedLogSync(projectRoot, 10)).toBeNull();
  });

  it(`reads the last lines, oldest first`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'one\ntwo\nthree\nfour\n' });

    expect(readDetachedLogSync(projectRoot, 2)).toEqual({
      logFile: detachedLogPath(projectRoot),
      lines: ['three', 'four'],
      totalLines: 4,
      truncated: true,
    });
  });

  it(`says so when it is showing the whole file`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'one\ntwo\n' });

    expect(readDetachedLogSync(projectRoot, 100)).toMatchObject({
      lines: ['one', 'two'],
      truncated: false,
    });
  });

  // Metro colours its output and draws progress bars with cursor moves. Neither is text.
  it(`strips the escape codes a bundler writes`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: '[32mBundled 1200ms[0m\n' });

    expect(readDetachedLogSync(projectRoot, 10)!.lines).toEqual(['Bundled 1200ms']);
  });

  it(`truncates the file for a new run`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'from the last run\n' });

    const { logFile } = openDetachedLogSync(projectRoot);

    expect(logFile).toBe(detachedLogPath(projectRoot));
    expect(readDetachedLogSync(projectRoot, 10)!.lines).toEqual([]);
  });

  it(`creates the log directory when the project has none`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(() => openDetachedLogSync(projectRoot)).not.toThrow();
    expect(readDetachedLogSync(projectRoot, 10)).not.toBeNull();
  });
});

describe(resolveDevLogsOptions, () => {
  it(`defaults to the last ${DEFAULT_LOG_TAIL_LINES} lines`, () => {
    expect(resolveDevLogsOptions([])).toEqual({
      tail: DEFAULT_LOG_TAIL_LINES,
      json: false,
      followups: true,
    });
  });

  it(`reads --tail`, () => {
    expect(resolveDevLogsOptions(['--tail', '30']).tail).toBe(30);
  });

  it.each([['0'], ['lots'], ['1.5'], ['999999999']])(`rejects --tail %p`, (value) => {
    expect(() => resolveDevLogsOptions(['--tail', value])).toThrow(/--tail must be a whole number/);
  });

  // The parser gets this one first: `-5` reads as a flag, so `--tail` was given no value at all.
  it(`rejects --tail with a negative, as a value that never arrived`, () => {
    expect(() => resolveDevLogsOptions(['--tail', '-5'])).toThrow(/with nothing after it/);
  });

  it(`rejects a bare number, and names the flag that takes one`, () => {
    expect(() => resolveDevLogsOptions(['30'])).toThrow(/--tail 30/);
  });
});

// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization — friction run 5,
// F48-10. `--wait-ready` gives up for two different reasons, and the reader cannot tell them apart
// from the outside: a bundler that is still working, and another process answering this port.
describe(notReadyError, () => {
  const lock = {
    url: 'http://127.0.0.1:8081',
    port: 8081,
    pid: 4242,
    startedAt: '2026-08-25T00:00:00.000Z',
    projectRoot,
  };

  function readyResult(overrides: Partial<BundlerReadyResult> = {}): BundlerReadyResult {
    return {
      ready: false,
      projectRootMatched: null,
      reportedProjectRoot: null,
      timedOut: true,
      waitedMs: 120_000,
      reason: 'http://127.0.0.1:8081/status did not answer within 120000ms',
      ...overrides,
    };
  }

  it(`names the split stack, which is the cause a reader will not think of`, () => {
    const message = notReadyError(lock, '/project/.expo/dev.log', readyResult()).message;

    expect(message).toContain('[::1]:8081');
    expect(message).toContain('127.0.0.1:8081');
    expect(message).toContain('lsof -nP -iTCP:8081 -sTCP:LISTEN');
  });

  it(`keeps the wait's own reason, and says the dev server is still running`, () => {
    const message = notReadyError(lock, '/project/.expo/dev.log', readyResult()).message;

    expect(message).toContain('did not answer within 120000ms');
    expect(message).toContain('this is about the wait, not about the server');
  });

  // Decisive evidence, when there is any: the dev server that answered named a project root, and
  // it is not this one. Telling that caller to wait longer is a next action that cannot work.
  it(`says so when the answer came from another project's dev server`, () => {
    const message = notReadyError(
      lock,
      '/project/.expo/dev.log',
      readyResult({ projectRootMatched: false, reportedProjectRoot: '/other-project' })
    ).message;

    expect(message).toContain('/other-project');
    expect(message).toContain('which is not this project');
    expect(message).not.toContain('this is about the wait, not about the server');
  });

  it(`recovers into the command that reports what the bundler is doing`, () => {
    expect(notReadyError(lock, '/project/.expo/dev.log', readyResult()).suggestedCommand).toBe(
      'npx @expo/agent-cli smoke'
    );
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
  // F125. The lock is taken at the *start* of the dev-server step, and for `expo run:android` that
  // step is a ten-minute Gradle build — so the port it publishes is not a port anything listens on
  // yet. Every sentence of the report above was then false at once: nothing was started, nothing
  // was on 8081, and "the dev server is still running" described a compiler
  // [observed — wave 29, `evidence/10-dev-detach-android.json`].
  describe('a plan that is still building', () => {
    const building = { phase: 'building', step: 'expo run:android', opensPlatform: true } as const;

    it(`does not say a dev server started`, () => {
      const message = notReadyError(
        lock,
        '/project/.expo/dev.log',
        readyResult(),
        building
      ).message;

      expect(message).not.toContain('The dev server started on');
      expect(message).not.toContain('The dev server is still running');
    });

    it(`says what the plan is doing, and which step is doing it`, () => {
      const message = notReadyError(
        lock,
        '/project/.expo/dev.log',
        readyResult(),
        building
      ).message;

      expect(message).toContain('expo run:android');
      expect(message).toContain('still building');
      // The reason the port is published at all, which is the part nothing else can explain.
      expect(message).toContain('builds the app, installs it, and only then starts the dev server');
    });

    // The split-stack note is about two listeners on one port, and nothing is listening here. On
    // this path it would send the reader to `lsof` for a socket that does not exist yet.
    it(`leaves out the note about two listeners on one port`, () => {
      const message = notReadyError(
        lock,
        '/project/.expo/dev.log',
        readyResult(),
        building
      ).message;

      expect(message).not.toContain('lsof -nP');
    });

    // `smoke` cannot measure a bundler that has not started. What the reader can do is watch the
    // build, which is the one thing that is actually happening.
    it(`recovers into the log the build is being written to`, () => {
      expect(
        notReadyError(lock, '/project/.expo/dev.log', readyResult(), building).suggestedCommand
      ).toBe('npx @expo/agent-cli dev:logs');
    });
  });
});
