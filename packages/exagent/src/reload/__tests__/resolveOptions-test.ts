import { DEFAULT_RELOAD_TIMEOUT_MS, resolveReloadOptions } from '../resolveOptions';

describe(resolveReloadOptions, () => {
  it(`should reload through whatever works, on whatever device is there, by default`, () => {
    expect(resolveReloadOptions([])).toEqual({
      route: null,
      method: 'auto',
      devServerUrl: null,
      platform: undefined,
      scheme: undefined,
      appId: undefined,
      timeoutMs: DEFAULT_RELOAD_TIMEOUT_MS,
      json: false,
      followups: true,
      routeCheck: true,
    });
  });

  it(`should read every flag`, () => {
    expect(
      resolveReloadOptions([
        '--route',
        '/notes',
        '--method',
        'device',
        '--android',
        '--scheme',
        'demoapp',
        '--app-id',
        'com.example.demo',
        '--dev-server-url',
        'http://192.168.1.10:8081/',
        '--timeout',
        '90s',
        '--json',
        '--no-followups',
        '--no-route-check',
      ])
    ).toEqual({
      route: '/notes',
      method: 'device',
      devServerUrl: 'http://192.168.1.10:8081',
      platform: 'android',
      scheme: 'demoapp',
      appId: 'com.example.demo',
      timeoutMs: 90_000,
      json: true,
      followups: false,
      routeCheck: false,
    });
  });

  it(`should refuse two platforms at once`, () => {
    expect(() => resolveReloadOptions(['--ios', '--android'])).toThrow(/only one of them/);
  });

  it(`should refuse a method it does not have`, () => {
    const error = expectThrow(() => resolveReloadOptions(['--method', 'restart']));
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('dev-server');
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). `exagent reload /notes`
  // reads as the obvious thing to type, and dropping the argument would have reloaded the app and
  // left it wherever it was, while reporting success.
  it(`should refuse a bare route and name the flag that takes one`, () => {
    const error = expectThrow(() => resolveReloadOptions(['/notes']));
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--route /notes');
  });

  it(`should refuse a timeout that is not a duration`, () => {
    expect(() => resolveReloadOptions(['--timeout', 'soon'])).toThrow(/--timeout/);
    expect(() => resolveReloadOptions(['--timeout', '0'])).toThrow(/--timeout/);
  });
});

function expectThrow(run: () => unknown): any {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to throw, but it returned');
}
