import { DEFAULT_DETACH_TIMEOUT_MS } from '../detachAsync';
import { resolveDevOptions } from '../resolveOptions';

describe(resolveDevOptions, () => {
  it(`should forward every argument the plan engine does not own`, () => {
    expect(resolveDevOptions(['--web', '--port', '8082'])).toEqual({
      mode: 'run',
      expoArgs: ['--web', '--port', '8082'],
      agentSkills: true,
      platform: 'web',
      buildBackend: null,
      runTarget: null,
      json: false,
      fingerprintCache: true,
      followups: true,
      yes: false,
      detach: false,
      waitReady: false,
      detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
      detachArgv: expect.any(Array),
      // Read, and still forwarded: `--port` is an `expo start` flag, and the plan's last step is
      // what acts on it. Reading it only lets this command validate it and name it in a URL.
      port: 8082,
    });
  });

  it(`should strip --no-agent-skills and skip the sync`, () => {
    expect(resolveDevOptions(['--no-agent-skills', '--clear'])).toEqual({
      mode: 'run',
      expoArgs: ['--clear'],
      agentSkills: false,
      platform: undefined,
      buildBackend: null,
      runTarget: null,
      json: false,
      fingerprintCache: true,
      followups: true,
      yes: false,
      detach: false,
      waitReady: false,
      detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
      detachArgv: expect.any(Array),
      port: null,
    });
  });

  it(`should run the plan without any mode flag`, () => {
    expect(resolveDevOptions([]).mode).toBe('run');
  });

  it(`should enter plan mode and strip the flag`, () => {
    expect(resolveDevOptions(['--plan', '--port', '8082'])).toEqual({
      mode: 'plan',
      expoArgs: ['--port', '8082'],
      agentSkills: true,
      platform: undefined,
      buildBackend: null,
      runTarget: null,
      json: false,
      fingerprintCache: true,
      followups: true,
      yes: false,
      detach: false,
      waitReady: false,
      detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
      detachArgv: expect.any(Array),
      port: 8082,
    });
  });

  // `--smart` and `--passthrough` were `@expo/agent-cli start`'s mode flags and this command has neither:
  // running the plan is what it does, and the plain `expo start` wrapper is `@expo/agent-cli start`.
  //
  // They used to be forwarded to `expo start`, which does not have them either, so the run
  // decided a plan, printed it, and then failed on the Expo CLI's own report of a flag nobody has
  // [friction run 5, F48-3]. Refused here instead, with the same envelope every other bad option
  // in this CLI gets.
  it.each(['--smart', '--passthrough'])(`should refuse %s, which neither CLI has`, (flag) => {
    expect(() => resolveDevOptions([flag])).toThrow(new RegExp(flag));
  });

  it(`should approve the plan up front with --yes and strip the flag`, () => {
    const options = resolveDevOptions(['--yes', '--clear']);

    expect(options.yes).toBe(true);
    expect(options.expoArgs).toEqual(['--clear']);
    expect(resolveDevOptions([]).yes).toBe(false);
  });

  it.each([
    ['--ios', 'ios'],
    ['-i', 'ios'],
    ['--android', 'android'],
    ['-a', 'android'],
    ['--web', 'web'],
    ['-w', 'web'],
  ])(`should read the platform from %s`, (flag, platform) => {
    expect(resolveDevOptions([flag]).platform).toBe(platform);
  });

  it(`should keep the platform flag in the expo start passthrough`, () => {
    expect(resolveDevOptions(['--ios']).expoArgs).toEqual(['--ios']);
  });

  it(`should use the first platform flag when several are given`, () => {
    expect(resolveDevOptions(['--android', '--ios']).platform).toBe('android');
  });

  it(`should ask for a JSON plan and strip the flag`, () => {
    expect(resolveDevOptions(['--plan', '--json'])).toEqual({
      mode: 'plan',
      expoArgs: [],
      agentSkills: true,
      platform: undefined,
      buildBackend: null,
      runTarget: null,
      json: true,
      fingerprintCache: true,
      followups: true,
      yes: false,
      detach: false,
      waitReady: false,
      detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
      detachArgv: expect.any(Array),
      port: null,
    });
  });

  it(`should not ask for JSON without the flag`, () => {
    expect(resolveDevOptions(['--plan']).json).toBe(false);
  });

  it(`should report no platform when none is asked for`, () => {
    expect(resolveDevOptions(['--port', '8082']).platform).toBeUndefined();
  });

  it(`should suppress the follow-ups and strip the flag`, () => {
    expect(resolveDevOptions(['--no-followups', '--clear'])).toEqual({
      mode: 'run',
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      buildBackend: null,
      runTarget: null,
      json: false,
      fingerprintCache: true,
      followups: false,
      yes: false,
      detach: false,
      waitReady: false,
      detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
      detachArgv: expect.any(Array),
      port: null,
    });
  });

  // @ref llp/0023-fingerprint-caching.rfc.md §Every consumer can turn it off
  it(`should refuse a cached fingerprint and strip the flag`, () => {
    const options = resolveDevOptions(['--no-fingerprint-cache', '--clear']);

    expect(options.fingerprintCache).toBe(false);
    // The flag is this command's own, so `expo start` never sees it.
    expect(options.expoArgs).toEqual(['--clear']);
  });

  it(`should allow a cached fingerprint without the flag`, () => {
    expect(resolveDevOptions([]).fingerprintCache).toBe(true);
  });

  it(`should keep the follow-ups without the flag`, () => {
    expect(resolveDevOptions([]).followups).toBe(true);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — `--port` is the answer to the
  // one question `@expo/agent-cli dev` cannot be asked, so an unusable value is reported here and not by
  // `expo start` a minute later.
  describe('--port', () => {
    it(`should read every spelling of the flag`, () => {
      expect(resolveDevOptions(['--port', '8082']).port).toBe(8082);
      expect(resolveDevOptions(['--port=8082']).port).toBe(8082);
      expect(resolveDevOptions(['-p', '8082']).port).toBe(8082);
    });

    it(`should be null when the flag is not passed`, () => {
      expect(resolveDevOptions([]).port).toBeNull();
      expect(resolveDevOptions(['--ios']).port).toBeNull();
    });

    it(`should reject a value that is not a port`, () => {
      expect(() => resolveDevOptions(['--port', 'abc'])).toThrow(/must be a port number/);
      expect(() => resolveDevOptions(['--port', '0'])).toThrow(/must be a port number/);
      expect(() => resolveDevOptions(['--port', '70000'])).toThrow(/must be a port number/);
      expect(() => resolveDevOptions(['--port'])).toThrow(/must be a port number/);
    });

    // Everything after the separator is forwarded to something else, so a `--port` there is that
    // tool's flag and this command has no opinion about it.
    it(`should ignore a port after the separator`, () => {
      expect(resolveDevOptions(['--', '--port', 'abc']).port).toBeNull();
    });
  });
});
