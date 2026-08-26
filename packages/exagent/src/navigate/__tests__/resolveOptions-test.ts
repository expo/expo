import { resolveNavigateOptions } from '../resolveOptions';

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
      json: false,
      followups: true,
      routeCheck: true,
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
      json: true,
      followups: true,
      routeCheck: false,
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
