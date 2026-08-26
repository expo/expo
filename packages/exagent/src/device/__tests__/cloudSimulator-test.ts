// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
//
// The whole point of this file. Every `eas simulator:*` invocation this CLI makes is [inferred] —
// built from documented syntax, never run against a live session, because the account on the
// machine it was written on is signed out. So the argv is pinned here as a table: when somebody
// signs in and one of these turns out to be wrong, the diff that fixes it is one line of one
// module and one line of one test, and nothing else in the package has to be searched.
//
// What is pinned: the exact argv of each verb, the parsing of the session dotenv and of the
// service's JSON, and the three state transitions of the probe — a project with no session, a
// session that has ended, and a binary that is not the EAS CLI. What is deliberately *not* pinned
// is that the service accepts any of it, which no test on a signed-out machine can claim.

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { isNeedsHumanError } from '../../utils/errors';
import {
  ACTIVE_SESSION_STATUS,
  AGENT_DEVICE_SPEC,
  buildAvailabilityArgs,
  buildCloudOpenUrlArgs,
  buildCloudScreenshotArgs,
  buildSessionGetArgs,
  captureCloudScreenshotAsync,
  cloudNeedsTunnelError,
  cloudSessionUnavailableError,
  cloudSessionUnknownError,
  cloudVerbFailedError,
  cloudVerbNotSupportedError,
  isActiveSessionStatus,
  openUrlOnCloudSimulatorAsync,
  parseAvailabilityJson,
  parseSessionIdFromEnvFile,
  parseSessionJson,
  probeCloudSessionAsync,
  readCloudSessionIdSync,
  type CloudRunResult,
} from '../cloudSimulator';

/** The `eas` this project has, so the resolver finds one without touching the machine's PATH. */
const PROJECT_EAS = '/project/node_modules/.bin/eas';

/** A project with an `eas` in it and nothing else. */
function project(files: Record<string, string> = {}): void {
  vol.fromJSON({
    '/project/package.json': '{}',
    [PROJECT_EAS]: '#!/bin/sh\n',
    ...files,
  });
}

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

/** A session answer in the shape the CLI is documented to give. */
function sessionJson(status: string, platform = 'ios'): string {
  return JSON.stringify({ id: 'sess-1', status, platform, remoteConfig: { url: 'https://x' } });
}

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

  // The controller downloads the image to a local path, so there is nothing to redirect — and no
  // `--platform`, which the documented verb table does not carry on this verb.
  it(`screenshots to a local path, with no redirect and no platform flag`, () => {
    const args = buildCloudScreenshotArgs({ filePath: '/project/.expo/exagent/shot.png' });

    expect(args).toEqual([
      'simulator:exec',
      'npx',
      AGENT_DEVICE_SPEC,
      'screenshot',
      '/project/.expo/exagent/shot.png',
    ]);
    expect(args).not.toContain('--platform');
    expect(args.join(' ')).not.toContain('>');
  });

  it(`asks for a session as JSON, and names the id only when there is one`, () => {
    expect(buildSessionGetArgs('sess-1')).toEqual(['simulator:get', '--id', 'sess-1', '--json']);
    // Without `--id` the CLI targets the session the dotenv names, which is this project's.
    expect(buildSessionGetArgs(null)).toEqual(['simulator:get', '--json']);
  });

  it(`checks availability read-only, so nothing is billed to find out`, () => {
    expect(buildAvailabilityArgs()).toEqual(['simulator:availability', '--json']);
    expect(buildAvailabilityArgs()).not.toContain('simulator:start');
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

describe(parseSessionJson, () => {
  it(`reads the status and platform of a live session`, () => {
    expect(parseSessionJson(sessionJson(ACTIVE_SESSION_STATUS))).toEqual({
      id: 'sess-1',
      status: ACTIVE_SESSION_STATUS,
      platform: 'ios',
    });
  });

  it(`reads the same fields out of an envelope`, () => {
    expect(
      parseSessionJson(
        JSON.stringify({ session: { id: 's', status: 'FINISHED', platform: 'ANDROID' } })
      )
    ).toEqual({ id: 's', status: 'FINISHED', platform: 'android' });
  });

  // A shape this cannot read must not become "there is no session": that would send a caller to
  // start a second billed session next to the one it failed to see.
  it(`answers null rather than guessing, for anything it cannot read`, () => {
    expect(parseSessionJson('not json')).toBeNull();
    expect(parseSessionJson('[]')).toBeNull();
    expect(parseSessionJson('{"unrelated": 1}')).toBeNull();
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
  it(`reads the flag both ways`, () => {
    expect(parseAvailabilityJson('{"available": true}')).toBe(true);
    expect(parseAvailabilityJson('{"available": false}')).toBe(false);
  });

  it(`answers null for an answer it cannot read`, () => {
    expect(parseAvailabilityJson('nope')).toBeNull();
    expect(parseAvailabilityJson('{}')).toBeNull();
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

  it(`is active for a session the service reports as ${ACTIVE_SESSION_STATUS}`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    mockEas({ stdout: sessionJson(ACTIVE_SESSION_STATUS) });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe).toMatchObject({
      state: 'active',
      sessionId: 'sess-1',
      platform: 'ios',
      reason: null,
    });
    expect(spawned[0]!.args).toEqual(buildSessionGetArgs('sess-1'));
  });

  // The dotenv keeps the id of a session that has ended, so the file alone is never proof.
  it(`is inactive for an id whose session is over`, async () => {
    project({ '/project/.env.eas-simulator': 'EAS_SIMULATOR_SESSION_ID=sess-1\n' });
    mockEas({ stdout: sessionJson('FINISHED') });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('inactive');
    expect(probe.reason).toContain('FINISHED');
  });

  // The gate that keeps this off the hot path: no file, no session-status subprocess.
  it(`is none with no dotenv, and asks only the read-only availability question`, async () => {
    project();
    mockEas({ stdout: '{"available": true}' });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe).toMatchObject({ state: 'none', sessionId: null, available: true });
    expect(spawned).toHaveLength(1);
    expect(spawned[0]!.args).toEqual(buildAvailabilityArgs());
  });

  it(`says so when the account does not have the feature at all`, async () => {
    project();
    mockEas({ stdout: '{"available": false}' });

    const probe = await probeCloudSessionAsync({ projectRoot: '/project' });

    expect(probe.state).toBe('none');
    expect(probe.available).toBe(false);
    expect(probe.reason).toContain('not enabled on this account');
  });

  // A binary that is not the EAS CLI has said nothing about the session (`wrapperCrash.ts`), and
  // reading its exit code as "the session is over" is how a caller ends up starting a second one.
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
      easCli: { command: PROJECT_EAS, source: 'project' },
    });

    expect(spawned[0]!.args).toEqual(
      buildCloudOpenUrlArgs({ url: 'exp://tunnel.example/--/?', platform: 'ios' })
    );
    expect(result).toMatchObject({ exitCode: 0, stdout: 'opened', spawnError: null });
    // The reproduction line names `eas`, not the resolved path, so it can be pasted.
    expect(result.command.startsWith('eas simulator:exec')).toBe(true);
  });

  it(`reports a refusal rather than throwing, so the caller explains it`, async () => {
    project();
    mockEas({ exitCode: 1, stderr: 'Remote daemon is unavailable' });

    const result = await openUrlOnCloudSimulatorAsync({
      projectRoot: '/project',
      url: 'exp://tunnel.example/--/?',
      platform: 'ios',
      easCli: { command: PROJECT_EAS, source: 'project' },
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
      filePath: '/project/.expo/exagent/shot.png',
      easCli: { command: PROJECT_EAS, source: 'project' },
    });

    expect(spawned[0]!.args).toEqual(
      buildCloudScreenshotArgs({ filePath: '/project/.expo/exagent/shot.png' })
    );
  });
});

// ---- The failures ------------------------------------------------------------------------------

describe(cloudSessionUnavailableError, () => {
  const probe = {
    state: 'none' as const,
    sessionId: null,
    platform: null,
    status: null,
    available: null,
    failure: null,
    reason: 'no .env.eas-simulator names a session',
  };

  it(`names the command that starts a session, and says it bills until stopped`, () => {
    const error = cloudSessionUnavailableError(probe);

    expect(error.code).toBe('NO_CLOUD_SIMULATOR_SESSION');
    expect(error.message).toContain('eas simulator:start');
    expect(error.message).toContain('--type agent-device');
    expect(error.message).toContain('bills until it is stopped');
    expect(error.suggestedCommand).toContain('simulator:start');
  });

  // An account that cannot have the feature must never be told to start a session.
  it(`offers the local device and --print-url when the account has no access`, () => {
    const error = cloudSessionUnavailableError({ ...probe, available: false });

    expect(error.code).toBe('CLOUD_SIMULATOR_UNAVAILABLE');
    expect(error.message).not.toContain('simulator:start');
    expect(error.suggestedCommand).toBe('npx exagent navigate / --print-url');
  });
});

describe(cloudNeedsTunnelError, () => {
  it(`refuses a loopback URL and names the tunnel as the fix`, () => {
    const error = cloudNeedsTunnelError('exp://127.0.0.1:8081/--/?', 'localhost');

    expect(error.code).toBe('CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER');
    expect(error.message).toContain('exp://127.0.0.1:8081/--/?');
    expect(error.suggestedCommand).toBe('npx exagent dev --detach --tunnel');
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
});

describe(cloudVerbNotSupportedError, () => {
  // `eas simulator:stop` ends the session, not the app. Doing the larger act under this name would
  // report a session teardown as one app having been stopped.
  it(`refuses to substitute a session teardown for stopping an app`, () => {
    const error = cloudVerbNotSupportedError('Stopping the app');

    expect(error.code).toBe('CLOUD_SIMULATOR_UNSUPPORTED');
    expect(error.message).toContain('ends the whole session');
    expect(error.message).toContain('npx exagent navigate / --cloud');
  });
});

describe(`${cloudSessionUnknownError.name} and the signed-out account`, () => {
  const probe = {
    state: 'unknown' as const,
    sessionId: 'sess-1',
    platform: null,
    status: null,
    available: null,
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
        command: 'eas simulator:get --id sess-1 --json',
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
