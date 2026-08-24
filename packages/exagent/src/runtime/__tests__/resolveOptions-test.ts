import { resolveRuntimeCommand } from '../resolveOptions';

describe(resolveRuntimeCommand, () => {
  // `devServerUrl` is null, not the default URL: "the caller named no dev server" is what makes
  // the command discover one, and a resolved default here would look like a named one.
  it(`should leave the dev server unresolved when no URL was given`, () => {
    expect(resolveRuntimeCommand(['eval', '1'])).toMatchObject({ devServerUrl: null });
    expect(resolveRuntimeCommand(['errors'])).toMatchObject({ devServerUrl: null });
    expect(resolveRuntimeCommand(['network'])).toMatchObject({ devServerUrl: null });
  });

  it(`should keep rejecting a --dev-server-url that is not an http URL`, () => {
    expect(() => resolveRuntimeCommand(['eval', '1', '--dev-server-url', 'nope'])).toThrow(
      /--dev-server-url is not a URL/
    );
    expect(() =>
      resolveRuntimeCommand(['errors', '--dev-server-url', 'ws://127.0.0.1:8081'])
    ).toThrow(/must be an http or https URL/);
  });

  it(`should default the dev server, timeout, and promise handling of eval`, () => {
    expect(resolveRuntimeCommand(['eval', 'globalThis.count'])).toEqual({
      action: 'eval',
      expression: 'globalThis.count',
      devServerUrl: null,
      timeoutMs: 5000,
      awaitPromise: true,
      json: false,
    });
  });

  it(`should read the eval flags`, () => {
    expect(
      resolveRuntimeCommand([
        'eval',
        '1 + 1',
        '--dev-server-url',
        'http://localhost:19000/',
        '--timeout',
        '250',
        '--no-await-promise',
        '--json',
      ])
    ).toEqual({
      action: 'eval',
      expression: '1 + 1',
      devServerUrl: 'http://localhost:19000',
      timeoutMs: 250,
      awaitPromise: false,
      json: true,
    });
  });

  it(`should default the window of errors`, () => {
    expect(resolveRuntimeCommand(['errors'])).toEqual({
      action: 'errors',
      devServerUrl: null,
      durationMs: 2000,
      json: false,
      followups: true,
      failOnError: false,
    });
  });

  it(`should read the errors flags`, () => {
    expect(
      resolveRuntimeCommand([
        'errors',
        '--duration',
        '5000',
        '--dev-server-url',
        'http://192.168.1.10:8081',
        '--json',
      ])
    ).toEqual({
      action: 'errors',
      devServerUrl: 'http://192.168.1.10:8081',
      durationMs: 5000,
      json: true,
      followups: true,
      failOnError: false,
    });
  });

  // F25: `dev:wait` exits 20 on a broken bundle while this exits 0 with the app throwing, so an
  // agent could gate on one and not the other. Opt-in, because collecting is still the default job.
  it(`should read --fail-on-error`, () => {
    expect(resolveRuntimeCommand(['errors', '--fail-on-error'])).toMatchObject({
      failOnError: true,
    });
  });

  // A failed request is something `network` reports about the app, not a verdict on it.
  it(`should reject --fail-on-error on network`, () => {
    expect(() => resolveRuntimeCommand(['network', '--fail-on-error'])).toThrow(/--fail-on-error/);
  });

  it(`should suppress the follow-ups of errors with --no-followups`, () => {
    const options = resolveRuntimeCommand(['errors', '--no-followups']);

    expect(options.action).toBe('errors');
    expect(options).toMatchObject({ followups: false });
  });

  // `eval` reports no follow-ups, so the flag is unknown there rather than a silent no-op.
  it(`should reject --no-followups on eval`, () => {
    expect(() => resolveRuntimeCommand(['eval', '1 + 1', '--no-followups'])).toThrow(
      /--no-followups/
    );
  });

  it(`should default the window of network`, () => {
    expect(resolveRuntimeCommand(['network'])).toEqual({
      action: 'network',
      devServerUrl: null,
      durationMs: 5000,
      json: false,
      followups: true,
    });
  });

  it(`should read the network flags`, () => {
    expect(
      resolveRuntimeCommand([
        'network',
        '--duration',
        '10000',
        '--dev-server-url',
        'http://192.168.1.10:8081/',
        '--json',
        '--no-followups',
      ])
    ).toEqual({
      action: 'network',
      devServerUrl: 'http://192.168.1.10:8081',
      durationMs: 10000,
      json: true,
      followups: false,
    });
  });

  it(`should reject a flag of another action on network`, () => {
    expect(() => resolveRuntimeCommand(['network', '--timeout', '10'])).toThrow(/--timeout/);
  });

  it(`should reject an argument after network`, () => {
    expect(() => resolveRuntimeCommand(['network', 'GET'])).toThrow(/Unexpected argument: GET/);
  });

  it(`should require an action`, () => {
    expect(() => resolveRuntimeCommand([])).toThrow(/Missing action.*eval\|errors\|network/);
  });

  it(`should reject an unknown action`, () => {
    expect(() => resolveRuntimeCommand(['inspect'])).toThrow(/Unknown action: inspect/);
  });

  it(`should require an expression for eval`, () => {
    expect(() => resolveRuntimeCommand(['eval'])).toThrow(/expression/);
  });

  it(`should ask for a quoted expression when it is split into several arguments`, () => {
    expect(() => resolveRuntimeCommand(['eval', '1 +', '1'])).toThrow(/quote/i);
  });

  it(`should reject a timeout that is not a positive duration`, () => {
    expect(() => resolveRuntimeCommand(['eval', '1', '--timeout', '0'])).toThrow(/--timeout/);
    expect(() => resolveRuntimeCommand(['eval', '1', '--timeout', '-5'])).toThrow(/--timeout/);
  });

  it(`should reject a negative window`, () => {
    expect(() => resolveRuntimeCommand(['errors', '--duration', '-1'])).toThrow(/--duration/);
  });

  it(`should report an unusable duration as the user typed it`, () => {
    expect(() => resolveRuntimeCommand(['errors', '--duration', 'nope'])).toThrow(/got nope/);
  });

  it(`should reject a dev server URL that is not http`, () => {
    expect(() => resolveRuntimeCommand(['errors', '--dev-server-url', 'localhost:8081'])).toThrow(
      /--dev-server-url/
    );
    expect(() => resolveRuntimeCommand(['errors', '--dev-server-url', 'ws://x:1'])).toThrow(
      /--dev-server-url/
    );
  });

  it(`should reject an unknown flag`, () => {
    expect(() => resolveRuntimeCommand(['eval', '1', '--nope'])).toThrow(/--nope/);
  });

  it(`should reject a flag that does not belong to the action`, () => {
    expect(() => resolveRuntimeCommand(['errors', '--timeout', '10'])).toThrow(/--timeout/);
    expect(() => resolveRuntimeCommand(['eval', '1', '--duration', '10'])).toThrow(/--duration/);
  });
});
