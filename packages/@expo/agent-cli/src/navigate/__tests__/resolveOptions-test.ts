import { DEFAULT_ATTACH_TIMEOUT_MS, resolveNavigateOptions } from '../resolveOptions';

describe(resolveNavigateOptions, () => {
  // Null, not 8081: an unnamed dev server is one still to be found, which is what lets the command
  // read the project's lock. Defaulting to 8081 here is what sent the device into another project.
  it(`should leave the dev server to be discovered and the platform to device discovery`, () => {
    expect(resolveNavigateOptions(['/profile/42'])).toEqual({
      route: '/profile/42',
      devServerUrl: null,
      platform: undefined,
      scheme: undefined,
      appId: undefined,
      printUrl: false,
      cloud: 'fallback',
      json: false,
      followups: true,
      routeCheck: true,
      attachTimeoutMs: DEFAULT_ATTACH_TIMEOUT_MS,
    });
  });

  it(`should read every flag`, () => {
    expect(
      resolveNavigateOptions([
        '/profile/42',
        '--scheme',
        'demoapp',
        '--android',
        '--dev-server-url',
        'http://192.168.1.10:8081/',
        '--app-id',
        'com.example.demo',
        '--print-url',
        '--json',
        '--no-route-check',
      ])
    ).toEqual({
      route: '/profile/42',
      devServerUrl: 'http://192.168.1.10:8081',
      platform: 'android',
      scheme: 'demoapp',
      appId: 'com.example.demo',
      printUrl: true,
      cloud: 'fallback',
      json: true,
      followups: true,
      routeCheck: false,
      attachTimeoutMs: DEFAULT_ATTACH_TIMEOUT_MS,
    });
  });

  it(`should read the json flag`, () => {
    expect(resolveNavigateOptions(['/', '--json']).json).toBe(true);
  });

  it(`should suppress the follow-ups with --no-followups`, () => {
    expect(resolveNavigateOptions(['/']).followups).toBe(true);
    expect(resolveNavigateOptions(['/', '--no-followups']).followups).toBe(false);
  });

  it(`should read the ios flag`, () => {
    expect(resolveNavigateOptions(['/', '--ios']).platform).toBe('ios');
  });

  it(`should accept a full URL as the route`, () => {
    expect(resolveNavigateOptions(['myapp://profile/42']).route).toBe('myapp://profile/42');
  });

  it(`should require a route`, () => {
    expect(() => resolveNavigateOptions([])).toThrow(/route/);
  });

  it(`should reject both platform flags at once`, () => {
    expect(() => resolveNavigateOptions(['/', '--ios', '--android'])).toThrow(/--ios/);
  });

  it(`should reject more than one route`, () => {
    expect(() => resolveNavigateOptions(['/a', '/b'])).toThrow(/one route/);
  });

  it(`should reject a dev server URL that is not http`, () => {
    expect(() => resolveNavigateOptions(['/', '--dev-server-url', 'nope'])).toThrow(
      /--dev-server-url/
    );
  });

  it(`should reject an unknown flag`, () => {
    expect(() => resolveNavigateOptions(['/', '--platform', 'ios'])).toThrow(/--platform/);
  });
});

// @ref ./adbReverse, ./openRoute — friction run 6, F50. The device tool exiting 0 says the intent
// was delivered and nothing about whether the app loaded, so the wait is on by default and opting
// out of it is explicit.
describe(`${resolveNavigateOptions.name} attach wait`, () => {
  it(`waits for the app by default`, () => {
    expect(resolveNavigateOptions(['/']).attachTimeoutMs).toBe(DEFAULT_ATTACH_TIMEOUT_MS);
  });

  it(`takes a budget from --attach-timeout`, () => {
    expect(resolveNavigateOptions(['/', '--attach-timeout', '90s']).attachTimeoutMs).toBe(90_000);
  });

  it(`waits for nothing with --no-wait-attach`, () => {
    expect(resolveNavigateOptions(['/', '--no-wait-attach']).attachTimeoutMs).toBe(0);
  });

  it(`refuses a budget and a refusal to wait at once`, () => {
    expect(() =>
      resolveNavigateOptions(['/', '--attach-timeout', '5s', '--no-wait-attach'])
    ).toThrow(/opposite things/);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
describe('resolveNavigateOptions and the cloud backend', () => {
  it(`leaves the cloud as the last rung of the ladder by default`, () => {
    expect(resolveNavigateOptions(['/']).cloud).toBe('fallback');
  });

  it(`makes the session the device with --cloud`, () => {
    expect(resolveNavigateOptions(['/', '--cloud']).cloud).toBe('required');
  });

  // A session is iOS or Android too, so this pair is not the `--ios`/`--android` pair: naming both
  // the backend and the platform is a meaningful thing to type.
  it(`accepts a platform alongside --cloud`, () => {
    const options = resolveNavigateOptions(['/', '--cloud', '--ios']);
    expect(options).toMatchObject({ cloud: 'required', platform: 'ios' });
  });

  it(`refuses --cloud with --print-url, which asks for no device at all`, () => {
    expect(() => resolveNavigateOptions(['/', '--cloud', '--print-url'])).toThrow(
      /opposite things/
    );
  });
});
