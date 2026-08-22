import { resolveNavigateOptions } from '../resolveOptions';

describe(resolveNavigateOptions, () => {
  it(`should default the dev server and leave the platform to device discovery`, () => {
    expect(resolveNavigateOptions(['/profile/42'])).toEqual({
      route: '/profile/42',
      devServerUrl: 'http://127.0.0.1:8081',
      platform: undefined,
      scheme: undefined,
      appId: undefined,
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
      ])
    ).toEqual({
      route: '/profile/42',
      devServerUrl: 'http://192.168.1.10:8081',
      platform: 'android',
      scheme: 'demoapp',
      appId: 'com.example.demo',
    });
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
