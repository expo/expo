// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// Every flag combination, decided without a dev server or a device.

import {
  DEFAULT_SMOKE_START_TIMEOUT_MS,
  DEFAULT_SMOKE_TIMEOUT_MS,
  DEFAULT_SMOKE_WINDOW_MS,
  resolveSmokeOptions,
} from '../resolveOptions';

const realPlatform = process.platform;

afterEach(() => Object.defineProperty(process, 'platform', { value: realPlatform }));

function onPlatform(platform: string) {
  Object.defineProperty(process, 'platform', { value: platform });
}

describe(resolveSmokeOptions, () => {
  it(`defaults to attaching, watching for three seconds, and taking a picture`, () => {
    onPlatform('darwin');
    expect(resolveSmokeOptions([])).toEqual({
      route: null,
      platform: 'ios',
      start: false,
      windowMs: DEFAULT_SMOKE_WINDOW_MS,
      timeoutMs: DEFAULT_SMOKE_TIMEOUT_MS,
      screenshotPath: null,
      screenshot: true,
      devServerUrl: null,
      routeCheck: true,
      json: false,
      followups: true,
    });
  });

  // The budget of a run that may start a dev server contains a cold first bundle, which is the
  // same reason `dev:wait` defaults to two minutes rather than to seconds.
  it(`gives --start a larger budget, and lets --timeout override it`, () => {
    expect(resolveSmokeOptions(['--start']).timeoutMs).toBe(DEFAULT_SMOKE_START_TIMEOUT_MS);
    expect(resolveSmokeOptions(['--start', '--timeout', '30s']).timeoutMs).toBe(30_000);
    expect(resolveSmokeOptions([]).timeoutMs).toBe(DEFAULT_SMOKE_TIMEOUT_MS);
  });

  it.each([
    [['--ios'], 'ios'],
    [['--android'], 'android'],
    [['--platform', 'ios'], 'ios'],
    [['--platform', 'android'], 'android'],
    // Two spellings of one answer are one answer, which is the amendment llp/0005 §The dev server
    // a caller names made for the rest of the group.
    [['--ios', '--platform', 'ios'], 'ios'],
  ])(`reads the platform from %s`, (argv, platform) => {
    expect(resolveSmokeOptions(argv).platform).toBe(platform);
  });

  it(`prefers a booted iOS simulator on a Mac and Android everywhere else`, () => {
    onPlatform('darwin');
    expect(resolveSmokeOptions([]).platform).toBe('ios');
    onPlatform('linux');
    expect(resolveSmokeOptions([]).platform).toBe('android');
  });

  it(`refuses two devices at once, whichever way they are spelled`, () => {
    expect(() => resolveSmokeOptions(['--ios', '--android'])).toThrow(/two devices/);
    expect(() => resolveSmokeOptions(['--ios', '--platform', 'android'])).toThrow(/two devices/);
  });

  // @ref llp/0010-agent-conventions.rfc.md §What app counting can and cannot see. A browser
  // registers nothing in the debugger target list, so every phase of this command after the
  // bundle check is unreachable on web — and a `passed` there would promise a runtime check that
  // never happened. Exit 1 rather than 22, for the reason that section gives: no amount of
  // looking again makes a browser answer a debugger.
  it(`refuses --platform web, and names the command that answers for web`, () => {
    const error = (() => {
      try {
        resolveSmokeOptions(['--platform', 'web']);
      } catch (thrown: any) {
        return thrown;
      }
      return null;
    })();

    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('cannot be smoke-tested');
    expect(error.suggestedCommand).toBe('npx exagent dev:wait --platform web');
  });

  it(`refuses a platform neither device tool covers`, () => {
    expect(() => resolveSmokeOptions(['--platform', 'windows'])).toThrow(/not a platform/);
  });

  it(`reads --screenshot and --no-screenshot, and refuses both`, () => {
    expect(resolveSmokeOptions(['--screenshot', '/tmp/a.png'])).toMatchObject({
      screenshot: true,
      screenshotPath: '/tmp/a.png',
    });
    expect(resolveSmokeOptions(['--no-screenshot'])).toMatchObject({
      screenshot: false,
      screenshotPath: null,
    });
    expect(() => resolveSmokeOptions(['--screenshot', '/tmp/a.png', '--no-screenshot'])).toThrow(
      /opposite things/
    );
  });

  // A window of zero catches nothing and would report the empty result as evidence, which is the
  // reading the whole command exists to stop.
  it(`refuses a window of zero`, () => {
    expect(() => resolveSmokeOptions(['--window', '0'])).toThrow();
    expect(resolveSmokeOptions(['--window', '5s']).windowMs).toBe(5_000);
  });

  it(`takes --port as shorthand for --dev-server-url, and refuses both`, () => {
    expect(resolveSmokeOptions(['--port', '8210']).devServerUrl).toBe('http://127.0.0.1:8210');
    expect(resolveSmokeOptions(['--dev-server-url', 'http://host:9000']).devServerUrl).toBe(
      'http://host:9000'
    );
    expect(() =>
      resolveSmokeOptions(['--port', '8210', '--dev-server-url', 'http://host:9000'])
    ).toThrow(/both name a dev server/);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). A bare word is a caller
  // who meant `--route`, and dropping it would run the gate without opening anything.
  it(`refuses a bare route and says how to pass one`, () => {
    expect(() => resolveSmokeOptions(['/notes'])).toThrow(/--route \/notes/);
  });

  it(`refuses an option this command does not have`, () => {
    expect(() => resolveSmokeOptions(['--bogus'])).toThrow(/--bogus/);
  });
});
