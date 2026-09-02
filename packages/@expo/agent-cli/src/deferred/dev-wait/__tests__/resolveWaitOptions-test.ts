// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { CommandError } from '../../../utils/errors';
import { DEFAULT_DEV_WAIT_TIMEOUT_MS, resolveDevWaitOptions } from '../resolveWaitOptions';

describe(resolveDevWaitOptions, () => {
  it(`should default to a two minute wait on a dev server it has yet to find`, () => {
    expect(resolveDevWaitOptions([])).toEqual({
      devServerUrl: null,
      timeoutMs: DEFAULT_DEV_WAIT_TIMEOUT_MS,
      requireApp: false,
      // On by default: it is the only part of the command that is about the project rather than
      // about the dev server.
      bundleCheck: true,
      platform: 'ios',
      // False: nothing named it, so the connected app gets to (llp/0005-runtime-loop-tools.rfc.md §Android, F53).
      platformExplicit: false,
      json: false,
      followups: true,
    });
  });

  it.each([
    [['--timeout', '5000'], { timeoutMs: 5000 }],
    [['--require-app'], { requireApp: true }],
    [['--no-bundle-check'], { bundleCheck: false }],
    [['--platform', 'android'], { platform: 'android' }],
    [['--platform', 'web'], { platform: 'web' }],
    [['--json'], { json: true }],
    [['--no-followups'], { followups: false }],
    [['--dev-server-url', 'http://127.0.0.1:8090'], { devServerUrl: 'http://127.0.0.1:8090' }],
    // A trailing slash would make `${url}/status` a double slash, so it is normalized away.
    [['--dev-server-url', 'http://127.0.0.1:8090/'], { devServerUrl: 'http://127.0.0.1:8090' }],
    [['--require-app', '--json', '--timeout', '1'], { requireApp: true, json: true, timeoutMs: 1 }],
  ])(`should resolve %p`, (argv, expected) => {
    expect(resolveDevWaitOptions(argv)).toMatchObject(expected);
  });

  it.each([
    // A wait of nothing is a mistake, not a request to check once.
    [['--timeout', '0'], '--timeout'],
    [['--timeout', 'soon'], '--timeout'],
    [['--timeout', '-1'], '--timeout'],
    [['--dev-server-url', 'not a url'], '--dev-server-url'],
    [['--dev-server-url', 'ws://127.0.0.1:8081'], '--dev-server-url'],
    [['--platform', 'windows'], '--platform'],
    // @ref llp/0010-agent-conventions.rfc.md §Exit codes — F40.
    // A browser running the web bundle registers no debugger target, so there is nothing for
    // `--require-app` to wait for and no honest way to answer it.
    [['--require-app', '--platform', 'web'], '--require-app'],
  ])(`should reject %p`, (argv, flag) => {
    expect(() => resolveDevWaitOptions(argv)).toThrow(CommandError);
    expect(() => resolveDevWaitOptions(argv)).toThrow(
      expect.objectContaining({ code: 'BAD_ARGS' })
    );
    expect(() => resolveDevWaitOptions(argv)).toThrow(new RegExp(flag));
  });

  it(`should reject an unknown flag instead of ignoring it`, () => {
    expect(() => resolveDevWaitOptions(['--require-apps'])).toThrow(
      expect.objectContaining({ code: 'BAD_ARGS' })
    );
  });

  it(`should reject a stray argument, which is usually a flag that lost its dashes`, () => {
    expect(() => resolveDevWaitOptions(['ready'])).toThrow(/Unexpected argument: ready/);
  });
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts — `@expo/agent-cli dev --port 8195`
// is the command that started the server, so the port is what a caller has in hand next.
describe('resolveDevWaitOptions --port', () => {
  it('reads --port as the dev server on that port of this machine', () => {
    expect(resolveDevWaitOptions(['--port', '8195']).devServerUrl).toBe('http://127.0.0.1:8195');
  });

  it('rejects a value that is not a port', () => {
    expect(() => resolveDevWaitOptions(['--port', 'lots'])).toThrow(/--port must be a port number/);
  });

  it('refuses --port and --dev-server-url together instead of picking one', () => {
    expect(() =>
      resolveDevWaitOptions(['--port', '8195', '--dev-server-url', 'http://127.0.0.1:8081'])
    ).toThrow(/both name a dev server/);
  });
});
