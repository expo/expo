// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
// @ref llp/0005-runtime-loop-tools.rfc.md §Finding the session
//
// The whole point of this file. No `eas simulator:*` invocation this CLI makes has been run against
// a live session — the account on the machine it was written on is signed out — so the argv is
// pinned here as a table: when somebody signs in and one of these turns out to be wrong, the diff
// that fixes it is one line of one module and one line of one test, and nothing else in the package
// has to be searched. The syntax comes from the published packages, read rather than guessed
// (llp/0005 §The argv, read off the packages).
//
// What is pinned: the exact argv of each verb, the parsing of the session dotenv and of the
// service's JSON, the deterministic rule that picks one session out of several, and the state
// transitions of the probe — nothing running, a session of a type this CLI cannot drive, a stale
// dotenv, and a binary that is not the EAS CLI. What is deliberately *not* pinned is that the
// service accepts any of it, which no test on a signed-out machine can claim.

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { isNeedsHumanError } from '../../utils/errors';
import {
  ACTIVE_SESSION_STATUS,
  AGENT_DEVICE_SPEC,
  CLOUD_SESSION_LIST_LIMIT,
  CLOUD_SIMULATOR_WAITLIST_URL,
  DRIVABLE_SESSION_TYPE,
  buildAvailabilityArgs,
  buildCloudAlertArgs,
  buildCloudOpenUrlArgs,
  buildCloudScreenshotArgs,
  buildCloudStopAppArgs,
  buildSessionListArgs,
  captureCloudScreenshotAsync,
  cloudNeedsTunnelError,
  cloudSessionUnavailableError,
  cloudSessionUnknownError,
  cloudVerbFailedError,
  cloudVerbNotSupportedError,
  isOpenInAppAlert,
  isActiveSessionStatus,
  openUrlOnCloudSimulatorAsync,
  parseAvailabilityJson,
  parseSessionIdFromEnvFile,
  parseSessionListJson,
  probeCloudSessionAsync,
  readCloudSessionIdSync,
  readControllerError,
  selectCloudSession,
  type CloudRunResult,
  type CloudSessionInfo,
  type CloudSessionProbe,
} from '../cloudSimulator';
import recordedAvailability from '../../__fixtures__/eas/simulator-availability.json';

/**
 * The runner every `eas` invocation goes through, planted where the resolver will look.
 *
 * A real `PATH` entry of this process, because `probeCloudSessionAsync` resolves against
 * `process.env.PATH` and these tests run on memfs: planting the file at a directory this machine
 * actually lists is what makes the lookup hermetic (`src/utils/easCli.ts` §resolveEasCli).
 */
const RUNNER_DIR = (process.env.PATH ?? '/usr/local/bin').split(path.delimiter)[0]!;

/** A project with a reachable runner and nothing else. */
function project(files: Record<string, string> = {}): void {
  vol.fromJSON({
    '/project/package.json': '{}',
    [path.join(RUNNER_DIR, 'npx')]: '#!/bin/sh\n',
    ...files,
  });
}

/** The invocation such a project resolves to: one rung, and it declares no `eas-cli` of its own. */
const EAS_PREFIX = ['--yes', 'eas-cli@latest'];

/** The argv a spawn actually receives: the runner's prefix, then the EAS argv. */
const easArgv = (args: string[]) => [...EAS_PREFIX, ...args];

/** One recorded spawn, so a test can assert on the argv that was actually sent. */
let spawned: { command: string; args: string[] }[] = [];

/** Make every `eas` spawn answer the same way. */
function mockEas({
  stdout = '',
  stderr = '',
  exitCode = 0,
  spawnError,
}: {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  spawnError?: string;
} = {}): void {
  spawned = [];
  jest.mocked(spawn).mockImplementation(((command: string, args: string[]) => {
    spawned.push({ command, args });
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (spawnError) {
        child.emit('error', Object.assign(new Error(spawnError), { code: 'ENOENT' }));
        return;
      }
      if (stdout) child.stdout.emit('data', stdout);
      if (stderr) child.stderr.emit('data', stderr);
      child.emit('close', exitCode, null);
    });
    return child as any;
  }) as any);
}

/** One session row, in the shape `simulator:list --json` prints [observed — eas-cli@22.2.0]. */
function sessionRow({
  id = 'sess-1',
  status = ACTIVE_SESSION_STATUS,
  platform = 'IOS',
  type = DRIVABLE_SESSION_TYPE,
  name = 'Checkout flow screenshots',
  createdAt = '2026-08-26T10:00:00.000Z',
}: Partial<Record<string, string>> = {}): Record<string, string> {
  return { id, status, platform, type, name, createdAt };
}

/** The listing envelope, with whatever rows a test wants in it. */
function listJson(...sessions: Record<string, string>[]): string {
  return JSON.stringify({ sessions, pageInfo: { hasNextPage: false, endCursor: null } });
}

/**
 * A payload the real service actually sent, read off disk.
 *
 * `jest.requireActual` because this suite mocks `fs` with `memfs`, and these are the one thing in
 * it that must come from the real filesystem: a recorded answer that memfs could shadow would stop
 * being a recording.
 */
function recorded(name: string): string {
  const real = jest.requireActual('fs') as typeof fs;
  return real.readFileSync(path.join(__dirname, '..', '..', '__fixtures__', 'eas', name), 'utf8');
}

// ---- What the service actually answered --------------------------------------------------------
//
// @ref src/__fixtures__/eas/README.md. Everything in this block is [observed — live, 2026-08-26]:
// the payloads are verbatim, so a parser that drifts from the service fails here rather than on
// somebody's paid session.

describe('the payloads the service really sent', () => {
  it(`reads the live listing of a running session`, () => {
    const sessions = parseSessionListJson(recorded('simulator-list-in-progress.json'));

    expect(sessions).toEqual([
      {
        id: '01a03d80-0556-7d22-98df-f415d9392b98',
        name: '@expo/agent-cli wave11 discovery check',
        // The flag spelling, unlike `status` and `platform` next to it.
        type: 'agent-device',
        status: 'IN_PROGRESS',
        platform: 'ios',
        createdAt: '2026-08-26T09:56:35.286Z',
      },
    ]);
    expect(selectCloudSession(sessions!).selected?.id).toBe(
      '01a03d80-0556-7d22-98df-f415d9392b98'
    );
  });

  // `[]` and not null: the service answered, and what it answered is "nothing is running". The two
  // must stay apart, because only one of them is an instruction to start a billed session.
  it(`reads the live listing of a project with nothing running`, () => {
    const sessions = parseSessionListJson(recorded('simulator-list-empty.json'));

    expect(sessions).toEqual([]);
    expect(selectCloudSession(sessions!).selected).toBeNull();
  });

  // The same session after `simulator:stop`. `STOPPED` is a real terminal status the service uses,
  // and it is what a stale dotenv points at.
  it(`never offers a session the service has stopped`, () => {
    const sessions = parseSessionListJson(recorded('simulator-list-stopped.json'));

    expect(sessions![0]!.status).toBe('STOPPED');
    expect(isActiveSessionStatus(sessions![0]!.status)).toBe(false);
    expect(selectCloudSession(sessions!).selected).toBeNull();
  });

  // `createdAt` is ISO 8601 with a fixed-width fractional part, which is what makes the ordering
  // rule a plain string comparison rather than a date parse.
  it(`orders by createdAt as strings, because the service sends ISO 8601`, () => {
    const [live] = parseSessionListJson(recorded('simulator-list-in-progress.json'))!;
    const older = { ...live!, id: 'older', createdAt: '2026-08-26T08:00:00.000Z' };

    expect(selectCloudSession([older, live!]).selected?.id).toBe(live!.id);
  });
});

// ---- The argv ---------------------------------------------------------------------------------

describe('the argv of every eas simulator invocation', () => {
  // The bridge is `simulator:exec`, and the verbs come from the controller it runs. There is no
  // `simulator:open-url`: getting this wrong is a command the CLI answers with "unknown command"
  // after a session has already been paid for.
  it(`opens a URL through simulator:exec and the controller's open verb`, () => {
    expect(
      buildCloudOpenUrlArgs({ url: 'exp://tunnel.example/--/notes', platform: 'ios' })
    ).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'open',
      'exp://tunnel.example/--/notes',
      '--platform',
      'ios',
    ]);
  });

  it(`carries the session's own platform on the open verb`, () => {
    expect(buildCloudOpenUrlArgs({ url: 'exp+app://x', platform: 'android' })).toEqual(
      expect.arrayContaining(['--platform', 'android'])
    );
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Reloading a cloud session — wave 19.
  // The whole of the cloud reload, in one verb: `--relaunch` terminates the app process before it
  // launches it, so nothing has to `close` first — and `close` is what ended the controller's own
  // session and left the app stranded (S12). The app id goes **in front of** the URL because the
  // controller's Expo Go form is `open <shell> <url>`, which launches the shell *with* the link
  // rather than handing the link to the system [observed — `agent-device help open`, 0.20.10:
  // `agent-device open "Expo Go" exp://127.0.0.1:8081 --platform ios`].
  it(`relaunches an app on the URL in one verb, app id before the URL`, () => {
    expect(
      buildCloudOpenUrlArgs({
        url: 'exp://tunnel.example/--/?',
        platform: 'ios',
        appId: 'host.exp.Exponent',
        relaunch: true,
      })
    ).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'open',
      'host.exp.Exponent',
      'exp://tunnel.example/--/?',
      '--platform',
      'ios',
      '--relaunch',
    ]);
  });

  // The controller refuses a verb whose device another of its sessions holds — `DEVICE_IN_USE`,
  // naming the session (S14). Binding the verb to that session is the documented remedy, and the
  // flag order is the controller's own: subcommand, positionals, then flags.
  it(`binds the verb to a named controller session when one is given`, () => {
    expect(
      buildCloudOpenUrlArgs({ url: 'exp://x/--/?', platform: 'ios', session: 'default' })
    ).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'open',
      'exp://x/--/?',
      '--platform',
      'ios',
      '--session',
      'default',
    ]);
  });

  // The controller downloads the image to a local path, so there is nothing to redirect — and no
  // `--platform`, which the documented verb table does not carry on this verb.
  it(`screenshots to a local path, with no redirect and no platform flag`, () => {
    const args = buildCloudScreenshotArgs({ filePath: '/project/.expo/agent-cli/shot.png' });

    expect(args).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'screenshot',
      '/project/.expo/agent-cli/shot.png',
    ]);
    expect(args).not.toContain('--platform');
    expect(args.join(' ')).not.toContain('>');
  });

  // Ending one app, not the session. The id is the whole safety of this verb: `close` with no
  // argument closes whatever the controller session is on, and `--shutdown` would stop the billed
  // machine as well.
  it(`closes the named app, and never the simulator`, () => {
    const args = buildCloudStopAppArgs({ appId: 'host.exp.Exponent' });

    expect(args).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'close',
      'host.exp.Exponent',
    ]);
    expect(args).not.toContain('--shutdown');
    expect(args).not.toContain('simulator:stop');
  });

  // Discovery asks the service, and asks it only about what is running. The **type** filter is
  // deliberately absent: a project whose only live session is a `serve-sim` is told that, which
  // "no session" would have hidden.
  it(`lists the running sessions as JSON, without filtering by type`, () => {
    const args = buildSessionListArgs();

    expect(args).toEqual([
      'simulator:list',
      '--status',
      'in-progress',
      '--limit',
      String(CLOUD_SESSION_LIST_LIMIT),
      '--json',
    ]);
    expect(args).not.toContain('--type');
    expect(buildSessionListArgs({ limit: 3 })).toEqual(expect.arrayContaining(['--limit', '3']));
  });

  it(`checks availability read-only, so nothing is billed to find out`, () => {
    expect(buildAvailabilityArgs()).toEqual(['simulator:availability', '--json']);
    expect(buildAvailabilityArgs()).not.toContain('simulator:start');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The dialog nobody is there to answer — S10.
  // The subcommand is the whole argv: `agent-device alert [get|accept|dismiss|wait] [timeout]`
  // [observed — `agent-device@latest help alert`, 2026-08-27]. No `--platform`, for the reason the
  // screenshot verb takes none — the flag is documented on `open`/`install`/`apps` and nowhere else.
  it(`reads and answers a platform alert through the controller's own subcommands`, () => {
    expect(buildCloudAlertArgs({ action: 'get' })).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'alert',
      'get',
    ]);
    expect(buildCloudAlertArgs({ action: 'accept' })).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'alert',
      'accept',
    ]);
    expect(buildCloudAlertArgs({ action: 'get' })).not.toContain('--platform');
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The dialog nobody is there to answer
//
// The gate that keeps `navigate --cloud` from answering *any* system prompt. What `alert get` prints
// for a present alert has not been seen by anything in this package, so this reads the output as
// text rather than parsing a shape invented here — and it says no to everything that does not name
// the app whose URL the run just sent.
describe(isOpenInAppAlert, () => {
  it(`recognises the dialog iOS raises for a custom-scheme URL`, () => {
    expect(isOpenInAppAlert(`Open in "Expo Go"?\nCancel / Open`, 'Expo Go')).toBe(true);
  });

  it(`matches a bundle id against the display name the dialog uses`, () => {
    // The caller knows `host.exp.Exponent` and the dialog says "Exponent" or "Expo Go"; the id's
    // last component is what the two have in common.
    expect(isOpenInAppAlert('Open in "Exponent"?', 'host.exp.Exponent')).toBe(true);
  });

  it(`says no to an alert that names some other app`, () => {
    expect(isOpenInAppAlert('Open in "Safari"?', 'Expo Go')).toBe(false);
  });

  // The case this gate exists for: a permission prompt is not an "open in" confirmation, and
  // answering one would grant something the caller never asked for (llp/0008).
  it(`says no to a permission prompt, which is not this command's to answer`, () => {
    expect(
      isOpenInAppAlert('"Expo Go" Would Like to Send You Notifications', 'Expo Go')
    ).toBe(false);
  });

  it(`says no to the controller's own empty answer`, () => {
    expect(isOpenInAppAlert('Error (COMMAND_FAILED): alert not found', 'Expo Go')).toBe(false);
  });
});

// ---- Reading the dotenv and the service's answer -----------------------------------------------

describe(parseSessionIdFromEnvFile, () => {
  it(`reads the session id out of the file eas-cli manages`, () => {
    expect(
      parseSessionIdFromEnvFile(
        [
          '# managed by eas-cli',
          'EAS_SIMULATOR_SESSION_ID=abc-123',
          'EAS_SIMULATOR_TOKEN=secret',
        ].join('\n')
      )
    ).toBe('abc-123');
  });

  it(`strips quotes and an export prefix`, () => {
    expect(parseSessionIdFromEnvFile('export EAS_SIMULATOR_SESSION_ID="abc-123"')).toBe('abc-123');
  });

  it(`answers null for the cleared file a stopped session leaves behind`, () => {
    expect(parseSessionIdFromEnvFile('# managed by eas-cli\n')).toBeNull();
    expect(parseSessionIdFromEnvFile('EAS_SIMULATOR_SESSION_ID=')).toBeNull();
    expect(parseSessionIdFromEnvFile('#EAS_SIMULATOR_SESSION_ID=old')).toBeNull();
  });
});

describe(parseSessionListJson, () => {
  it(`reads a session row out of the documented envelope`, () => {
    expect(parseSessionListJson(listJson(sessionRow()))).toEqual([
      {
        id: 'sess-1',
        status: ACTIVE_SESSION_STATUS,
        platform: 'ios',
        type: DRIVABLE_SESSION_TYPE,
        name: 'Checkout flow screenshots',
        createdAt: '2026-08-26T10:00:00.000Z',
      },
    ]);
  });

  // `IOS` and `ANDROID` are the raw GraphQL enums the CLI prints, not the flag spellings.
  it(`normalizes the platform enum the service prints`, () => {
    expect(parseSessionListJson(listJson(sessionRow({ platform: 'ANDROID' })))![0]!.platform).toBe(
      'android'
    );
  });

  it(`reads a bare array too, for a shape that moved`, () => {
    expect(parseSessionListJson(JSON.stringify([sessionRow()]))).toHaveLength(1);
  });

  it(`drops a row that names no session, because there is nothing to drive`, () => {
    expect(parseSessionListJson(listJson({ status: ACTIVE_SESSION_STATUS }))).toEqual([]);
  });

  // A shape this cannot read must not become "there are no sessions": that would send a caller to
  // start a second billed session next to the one it failed to see. Null, not `[]`.
  it(`answers null rather than guessing, for anything it cannot read`, () => {
    expect(parseSessionListJson('not json')).toBeNull();
    expect(parseSessionListJson('{"unrelated": 1}')).toBeNull();
    expect(parseSessionListJson('<html>login</html>')).toBeNull();
  });

  it(`answers an empty list for a listing that really is empty`, () => {
    expect(parseSessionListJson(listJson())).toEqual([]);
  });
});

describe(selectCloudSession, () => {
  const ios = parseSessionListJson(
    listJson(sessionRow({ id: 'ios-1', createdAt: '2026-08-26T09:00:00.000Z' }))
  )![0]!;
  const android = parseSessionListJson(
    listJson(
      sessionRow({ id: 'and-1', platform: 'ANDROID', createdAt: '2026-08-26T11:00:00.000Z' })
    )
  )![0]!;

  it(`picks the only live session there is`, () => {
    expect(selectCloudSession([ios]).selected?.id).toBe('ios-1');
  });

  // Only `agent-device` answers `simulator:exec npx agent-device`. A `serve-sim` session is a
  // browser preview, and driving it is not a thing that would work.
  it(`never picks a session whose controller this CLI does not speak to`, () => {
    const serveSim: CloudSessionInfo = { ...ios, id: 'srv-1', type: 'serve-sim' };
    const selection = selectCloudSession([serveSim]);

    expect(selection.selected).toBeNull();
    expect(selection.wrongType.map((session) => session.id)).toEqual(['srv-1']);
  });

  it(`never picks a session the service does not report as running`, () => {
    expect(selectCloudSession([{ ...ios, status: 'STOPPED' }]).selected).toBeNull();
  });

  // The dotenv is a bad existence proof and a good preference: it names the session this project
  // started, so it wins over one that is newer and somebody else's.
  it(`prefers the session the dotenv names, over a newer one`, () => {
    expect(
      selectCloudSession([ios, android], { preferredId: 'ios-1' }).selected?.id
    ).toBe('ios-1');
  });

  it(`prefers the platform the caller asked for, when the dotenv names neither`, () => {
    expect(selectCloudSession([ios, android], { platform: 'ios' }).selected?.id).toBe('ios-1');
    expect(selectCloudSession([ios, android], { platform: 'android' }).selected?.id).toBe('and-1');
  });

  // A session on the other platform still comes back: the caller raises the mismatch, which says a
  // session exists and is not the one asked for. "No session" would have hidden it.
  it(`still answers with the other platform's session when it is all there is`, () => {
    expect(selectCloudSession([android], { platform: 'ios' }).selected?.id).toBe('and-1');
  });

  it(`falls back to the most recently created`, () => {
    expect(selectCloudSession([ios, android]).selected?.id).toBe('and-1');
  });

  // Determinism is the point: the same listing in any order must pick the same session, or "which
  // device did it use" becomes a thing a reader has to guess at.
  it(`picks the same session whatever order the service returned`, () => {
    const same = { ...ios, id: 'ios-2' };
    expect(selectCloudSession([ios, same]).selected?.id).toBe('ios-1');
    expect(selectCloudSession([same, ios]).selected?.id).toBe('ios-1');
  });
});

// @ref llp/0005 §A non-zero exit means different things per backend. The controller's own refusal
// has to be told apart from a verb this CLI got wrong, or a reader is sent to `--help` for a
// command that was already correct.
describe(readControllerError, () => {
  it.each([
    ['Error (COMMAND_FAILED): Simulator device failed to open myapp://.', 'COMMAND_FAILED'],
    ['Error (SESSION_NOT_FOUND): No active session. Run open first.', 'SESSION_NOT_FOUND'],
  ])(`reads %s`, (line, code) => {
    expect(readControllerError(line)?.code).toBe(code);
  });

  // The real output has npm noise and a diagnostics block around it.
  it(`finds it among everything else the controller printed`, () => {
    const output = [
      'npm warn exec The following package was not found and will be installed: agent-device@0.20.10',
      'Building Apple runner...',
      'Error (COMMAND_FAILED): Simulator device failed to open myapp://.',
      'Hint: Retry with --debug and inspect diagnostics log for details.',
      'Diagnostic ID: mt9x7nns-fbd904d9',
    ].join('\n');

    expect(readControllerError(output)).toEqual({
      code: 'COMMAND_FAILED',
      message: 'Simulator device failed to open myapp://.',
    });
  });

  it(`answers null for output that is not the controller refusing`, () => {
    expect(readControllerError('Remote daemon is unavailable')).toBeNull();
    expect(readControllerError('')).toBeNull();
  });
});

describe(isActiveSessionStatus, () => {
  it.each([ACTIVE_SESSION_STATUS, 'in_progress'])(`is active for %s`, (status) => {
    expect(isActiveSessionStatus(status)).toBe(true);
  });

  it.each(['FINISHED', 'CANCELED', 'ERRORED', null])(`is not active for %s`, (status) => {
    expect(isActiveSessionStatus(status)).toBe(false);
  });
});

describe(parseAvailabilityJson, () => {
  // The one `simulator:*` payload that could be recorded without starting a session, which is what
  // `availability` exists for. See `src/__fixtures__/eas/README.md`.
  it(`reads the recorded answer, and ignores the account it names`, () => {
    expect(parseAvailabilityJson(JSON.stringify(recordedAvailability))).toEqual({
      available: true,
      waitlistUrl: null,
    });
  });

  it(`reads the flag both ways`, () => {
    expect(parseAvailabilityJson('{"available": true}').available).toBe(true);
    expect(parseAvailabilityJson('{"available": false}').available).toBe(false);
  });

  // The service sends the waitlist URL only for a gated account, and reading it is what lets the
  // refusal end in where access comes from rather than only in "no".
  it(`reads the waitlist URL the service sends to a gated account`, () => {
    expect(
      parseAvailabilityJson(
        `{"available": false, "accountName": "acme", "waitlistUrl": "${CLOUD_SIMULATOR_WAITLIST_URL}"}`
      )
    ).toEqual({ available: false, waitlistUrl: CLOUD_SIMULATOR_WAITLIST_URL });
    expect(parseAvailabilityJson('{"available": true}').waitlistUrl).toBeNull();
  });

  it(`answers null for an answer it cannot read`, () => {
    expect(parseAvailabilityJson('nope').available).toBeNull();
    expect(parseAvailabilityJson('{}').available).toBeNull();
  });
});

// ---- The probe ---------------------------------------------------------------------------------

describe(readCloudSessionIdSync, () => {
  afterEach(() => vol.reset());

  it(`answers null with no file, without touching a subprocess`, () => {
    project();
    expect(readCloudSessionIdSync('/project')).toBeNull();
  });

  it(`reads the id from the project's own dotenv`, () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    expect(readCloudSessionIdSync('/project')).toBe('sess-1');
  });
});

describe(probeCloudSessionAsync, () => {
  afterEach(() => vol.reset());

  // Discovery is the listing, and the dotenv is not a gate: a project with no file at all still
  // finds a session started by MCP or by another terminal.
  it(`is active for a session the service lists, with no dotenv at all`, async () => {
    project();
    mockEas({ stdout: listJson(sessionRow()) });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe).toMatchObject({
      state: 'active',
      sessionId: 'sess-1',
      platform: 'ios',
      sessionName: 'Checkout flow screenshots',
      candidateCount: 1,
      reason: null,
    });
    expect(spawned).toHaveLength(1);
    expect(spawned[0]!.args).toEqual(easArgv(buildSessionListArgs()));
  });

  it(`picks the session the dotenv names when the service lists several`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-2\n' });
    mockEas({
      stdout: listJson(
        sessionRow({ id: 'sess-1', createdAt: '2026-08-26T12:00:00.000Z' }),
        sessionRow({ id: 'sess-2', createdAt: '2026-08-26T09:00:00.000Z' })
      ),
    });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe).toMatchObject({ state: 'active', sessionId: 'sess-2', candidateCount: 2 });
  });

  it(`prefers a session on the platform the caller asked for`, async () => {
    project();
    mockEas({
      stdout: listJson(
        sessionRow({ id: 'ios-1' }),
        sessionRow({ id: 'and-1', platform: 'ANDROID' })
      ),
    });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project', platform: 'android' });

    expect(probe).toMatchObject({ state: 'active', sessionId: 'and-1', platform: 'android' });
  });

  // The file outlives the session it names, so a stale one has to be called stale rather than
  // reported as an answer.
  it(`is inactive when the dotenv names a session the service does not list`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    mockEas({ stdout: listJson() });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('inactive');
    expect(probe.sessionId).toBe('sess-1');
    expect(probe.reason).toContain('has ended');
  });

  // "No session" for a running `serve-sim` would send a reader to start a second billed one next
  // to the one they are already paying for.
  it(`names the type when the only live session is one it cannot drive`, async () => {
    project();
    mockEas({ stdout: listJson(sessionRow({ type: 'serve-sim' })) });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('none');
    expect(probe.reason).toContain('serve-sim');
    expect(probe.reason).toContain(DRIVABLE_SESSION_TYPE);
  });

  it(`is none with nothing running, and only then asks the read-only availability question`, async () => {
    project();
    let call = 0;
    spawned = [];
    jest.mocked(spawn).mockImplementation(((command: string, args: string[]) => {
      spawned.push({ command, args });
      const answer = call++ === 0 ? listJson() : '{"available": true}';
      const child = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      process.nextTick(() => {
        child.stdout.emit('data', answer);
        child.emit('close', 0, null);
      });
      return child as any;
    }) as any);

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe).toMatchObject({ state: 'none', sessionId: null, available: true });
    expect(spawned.map((run) => run.args)).toEqual([
      easArgv(buildSessionListArgs()),
      easArgv(buildAvailabilityArgs()),
    ]);
  });

  it(`says so when the account does not have the feature at all`, async () => {
    project();
    let call = 0;
    spawned = [];
    jest.mocked(spawn).mockImplementation(((command: string, args: string[]) => {
      spawned.push({ command, args });
      const answer =
        call++ === 0
          ? listJson()
          : `{"available": false, "waitlistUrl": "${CLOUD_SIMULATOR_WAITLIST_URL}"}`;
      const child = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      process.nextTick(() => {
        child.stdout.emit('data', answer);
        child.emit('close', 0, null);
      });
      return child as any;
    }) as any);

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('none');
    expect(probe.available).toBe(false);
    expect(probe.waitlistUrl).toBe(CLOUD_SIMULATOR_WAITLIST_URL);
    expect(probe.reason).toContain('not enabled on this account');
  });

  // A binary that is not the EAS CLI has said nothing about the sessions (`wrapperCrash.ts`), and
  // reading its exit code as "there are none" is how a caller ends up starting a second one.
  it(`is unknown when the binary under that name is not the EAS CLI`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    mockEas({ exitCode: 101, stderr: 'thread panicked at src/main.rs\nStack backtrace:' });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('unknown');
    expect(probe.reason).toContain('may not be the EAS CLI');
  });

  it(`is unknown when there is no eas binary to ask, and spawns nothing`, async () => {
    vol.fromJSON({ '/project/package.json': '{}' });
    mockEas();

    const probe = await probeCloudSessionAsync({
      projectRoot: '/project',
      easCli: null,
    });

    // The resolver falls back to `PATH`, which this test cannot control; what it can pin is that a
    // probe with nothing to ask never claims a state it did not establish.
    expect(['unknown', 'none']).toContain(probe.state);
  });

  it(`is unknown for an answer whose JSON it cannot read`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    mockEas({ stdout: '<html>login</html>' });

    expect((await probeCloudSessionAsync({ projectRoot: '/project' })).state).toBe('unknown');
  });
});

// ---- Driving the device -------------------------------------------------------------------------

describe(openUrlOnCloudSimulatorAsync, () => {
  afterEach(() => vol.reset());

  it(`runs the pinned argv and reports what it said`, async () => {
    project();
    mockEas({ stdout: 'opened' });

    const result = await openUrlOnCloudSimulatorAsync({
      projectRoot: '/project',
      url: 'exp://tunnel.example/--/?',
      platform: 'ios',
      easCli: {
        command: 'npx',
        prefixArgs: EAS_PREFIX,
        source: 'npx --yes eas-cli@latest',
        runner: 'npx',
        pinned: false,
      },
    });

    expect(spawned[0]!.args).toEqual(
      easArgv(buildCloudOpenUrlArgs({ url: 'exp://tunnel.example/--/?', platform: 'ios' }))
    );
    expect(result).toMatchObject({ exitCode: 0, stdout: 'opened', spawnError: null });
    // The reproduction line names the runner and the package, not the path npx was found at, so it
    // can be pasted on a machine that has no `eas` of its own.
    expect(result.command.startsWith('npx --yes eas-cli@latest simulator:exec')).toBe(true);
  });

  it(`reports a refusal rather than throwing, so the caller explains it`, async () => {
    project();
    mockEas({ exitCode: 1, stderr: 'Remote daemon is unavailable' });

    const result = await openUrlOnCloudSimulatorAsync({
      projectRoot: '/project',
      url: 'exp://tunnel.example/--/?',
      platform: 'ios',
      easCli: {
        command: 'npx',
        prefixArgs: EAS_PREFIX,
        source: 'npx --yes eas-cli@latest',
        runner: 'npx',
        pinned: false,
      },
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Remote daemon');
  });
});

describe(captureCloudScreenshotAsync, () => {
  afterEach(() => vol.reset());

  it(`runs the pinned screenshot argv`, async () => {
    project();
    mockEas();

    await captureCloudScreenshotAsync({
      projectRoot: '/project',
      filePath: '/project/.expo/agent-cli/shot.png',
      easCli: {
        command: 'npx',
        prefixArgs: EAS_PREFIX,
        source: 'npx --yes eas-cli@latest',
        runner: 'npx',
        pinned: false,
      },
    });

    expect(spawned[0]!.args).toEqual(
      easArgv(buildCloudScreenshotArgs({ filePath: '/project/.expo/agent-cli/shot.png' }))
    );
  });
});

// ---- The failures ------------------------------------------------------------------------------

describe(cloudSessionUnavailableError, () => {
  const probe: CloudSessionProbe = {
    state: 'none',
    sessionId: null,
    platform: null,
    status: null,
    sessionName: null,
    candidateCount: 0,
    otherSessionCount: 0,
    available: null,
    waitlistUrl: null,
    failure: null,
    reason: 'the service lists no running EAS Simulator session for this project',
  };

  it(`names the command that starts a session, and says it bills until stopped`, () => {
    const error = cloudSessionUnavailableError(probe);

    expect(error.code).toBe('NO_CLOUD_SIMULATOR_SESSION');
    expect(error.message).toContain('eas simulator --platform ios --type agent-device --expo-go');
    expect(error.message).toContain('--type agent-device');
    expect(error.message).toContain('bills until it is stopped');
    expect(error.suggestedCommand).toContain('--expo-go');
  });

  // An account that cannot have the feature must never be told to start a session.
  it(`offers the local device and --print-url when the account has no access`, () => {
    const error = cloudSessionUnavailableError({ ...probe, available: false });

    expect(error.code).toBe('CLOUD_SIMULATOR_UNAVAILABLE');
    expect(error.message).not.toContain('simulator:start');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli navigate / --print-url');
  });
});

describe(cloudNeedsTunnelError, () => {
  it(`refuses a loopback URL and names the tunnel as the fix`, () => {
    const error = cloudNeedsTunnelError('exp://127.0.0.1:8081/--/?', 'localhost');

    expect(error.code).toBe('CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER');
    expect(error.message).toContain('exp://127.0.0.1:8081/--/?');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli dev --detach --tunnel');
  });

  it(`refuses a LAN URL too, because the session is not on this network`, () => {
    expect(cloudNeedsTunnelError('exp://192.168.1.4:8081/--/?', 'lan').message).toContain(
      'this network'
    );
  });
});

describe(cloudVerbFailedError, () => {
  const base: CloudRunResult = {
    command: 'eas simulator:exec npx agent-device@latest open exp://x',
    stdout: '',
    stderr: '',
    exitCode: 1,
    spawnError: null,
    binPath: '/usr/local/bin/eas',
  };

  it(`quotes what the tool printed`, () => {
    const error = cloudVerbFailedError(
      { ...base, stderr: 'error: unknown command simulator:exec' },
      { what: 'the deep link was not opened.', how: 'Check the session is running.' }
    );

    expect(error.code).toBe('CLOUD_SIMULATOR_COMMAND_FAILED');
    expect(error.message).toContain('unknown command simulator:exec');
  });

  // Layer 3 of the needs-human protocol: signed out is a person's step, not a broken command.
  it(`hands a signed-out account to a person, with the needs-human payload`, () => {
    const error = cloudVerbFailedError(
      {
        ...base,
        stderr:
          'An Expo user account is required. Either log in with "eas login" or set the EXPO_TOKEN environment variable.',
      },
      { what: 'nothing was opened.', how: 'Sign in.' }
    );

    expect(isNeedsHumanError(error) && error.needsHuman.scenario).toBe('eas-login');
    expect(isNeedsHumanError(error) && error.needsHuman.unattendedEnv).toContain('EXPO_TOKEN');
  });

  // A wrapper's backtrace under "What the tool printed" claims the EAS CLI said it, and a reader
  // then goes looking for a file the CLI never mentioned.
  it(`names the binary instead of quoting it, when what ran was not the CLI`, () => {
    const error = cloudVerbFailedError(
      { ...base, exitCode: 101, stderr: 'Stack backtrace:\n 0: rust_begin_unwind' },
      { what: 'nothing was opened.', how: 'Check it.' }
    );

    expect(error.message).toContain('/usr/local/bin/eas');
    expect(error.message).toContain('may not be the real CLI');
    expect(error.message).not.toContain('rust_begin_unwind');
  });

  it(`names the EAS CLI as missing when the process never started`, () => {
    const error = cloudVerbFailedError(
      { ...base, exitCode: null, spawnError: 'spawn eas ENOENT' },
      { what: 'nothing was opened.', how: 'Install it.' }
    );

    expect(error.code).toBe('CLOUD_SIMULATOR_TOOL_MISSING');
    expect(error.message).toContain('spawn eas ENOENT');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Finding the session — live staging, S14.
  //
  // `DEVICE_IN_USE` means the device is **held**, and the caller's `how` said the opposite: "a
  // session can end between the moment it was listed and the moment a verb reaches it. Start a new
  // one if it has." Starting a second session bills a second machine and leaves this one held.
  const inUse = {
    ...base,
    stderr: 'Error (DEVICE_IN_USE): Device is already in use by session "default".',
  };

  it(`says the device is held rather than that the session may have ended`, () => {
    const error = cloudVerbFailedError(inUse, {
      what: 'the deep link was not opened.',
      how: 'Check the session is still running with "npx eas simulator:list --status in-progress" — a session can end between the moment it was listed and the moment a verb reaches it. Start a new one if it has.',
    });

    expect(error.code).toBe('CLOUD_SIMULATOR_DEVICE_REFUSED');
    expect(error.message).toContain('DEVICE_IN_USE');
    expect(error.message).not.toMatch(/start a new one/i);
    expect(error.message).toMatch(/did not end|still up|holding/i);
  });

  it(`names the session that holds the device, which the controller said`, () => {
    const error = cloudVerbFailedError(inUse, { what: 'nothing was opened.', how: 'Check it.' });

    expect(error.message).toContain('"default"');
    expect(error.message).toContain('--session default');
  });

  it(`never suggests starting a session, because that bills a second machine`, () => {
    const error = cloudVerbFailedError(inUse, { what: 'nothing was opened.', how: 'Check it.' });

    expect(error.message).not.toContain('simulator:start');
    expect(error.suggestedCommand).not.toContain('simulator:start');
  });

  it(`leaves every other controller refusal with the caller's own how`, () => {
    const error = cloudVerbFailedError(
      { ...base, stderr: 'Error (COMMAND_FAILED): Simulator device failed to open myapp://.' },
      { what: 'nothing was opened.', how: 'Check the scheme is registered.' }
    );

    expect(error.message).toContain('Check the scheme is registered.');
    expect(error.message).not.toContain('--session');
  });
});

describe(cloudVerbNotSupportedError, () => {
  // `eas simulator:stop` ends the session, not the app. Doing the larger act under this name would
  // report a session teardown as one app having been stopped.
  it(`refuses to substitute a session teardown for stopping an app`, () => {
    const error = cloudVerbNotSupportedError('Stopping the app');

    expect(error.code).toBe('CLOUD_SIMULATOR_UNSUPPORTED');
    expect(error.message).toContain('ends the whole session');
    expect(error.message).toContain('npx @expo/agent-cli navigate / --cloud');
  });
});

describe(`${cloudSessionUnknownError.name} and the signed-out account`, () => {
  const probe = {
    state: 'unknown' as const,
    sessionId: 'sess-1',
    platform: null,
    status: null,
    sessionName: null,
    candidateCount: 0,
    otherSessionCount: 0,
    available: null,
    waitlistUrl: null,
    reason: 'the EAS CLI would not answer',
  };

  it(`never tells a reader to start a session it could not rule out`, () => {
    const error = cloudSessionUnknownError({ ...probe, failure: null });

    expect(error.code).toBe('CLOUD_SIMULATOR_SESSION_UNKNOWN');
    expect(error.message).not.toContain('simulator:start');
    expect(error.message).toContain('sess-1');
  });

  // A signed-out account stops the *question* about the session exactly as it stops the answer,
  // and both are a login rather than a broken CLI (llp/0010 §Needs-human protocol).
  it(`hands a signed-out account to a person`, () => {
    const error = cloudSessionUnknownError({
      ...probe,
      failure: {
        command: 'eas simulator:list --status in-progress --limit 25 --json',
        stdout: '',
        stderr:
          'An Expo user account is required. Either log in with "eas login" or set the EXPO_TOKEN environment variable.',
        exitCode: 1,
        spawnError: null,
        binPath: '/usr/local/bin/eas',
      },
    });

    expect(isNeedsHumanError(error) && error.needsHuman.scenario).toBe('eas-login');
  });
});
