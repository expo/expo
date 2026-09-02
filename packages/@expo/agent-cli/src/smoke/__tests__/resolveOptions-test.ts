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
  it(`defaults to bootstrapping, watching for three seconds, and taking a picture`, () => {
    onPlatform('darwin');
    expect(resolveSmokeOptions([])).toEqual({
      route: null,
      platform: 'ios',
      cloud: 'fallback',
      bootstrap: true,
      windowMs: DEFAULT_SMOKE_WINDOW_MS,
      timeoutMs: DEFAULT_SMOKE_START_TIMEOUT_MS,
      screenshotPath: null,
      screenshot: true,
      devServerUrl: null,
      routeCheck: true,
      json: false,
      followups: true,
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
  // of 2026-08-29. Starting what is missing is what the command does now, so `--start` is the
  // default spelled out loud and `--no-start` is the attach-only run it used to be.
  it(`treats --start as the default and --no-start as the attach-only run`, () => {
    expect(resolveSmokeOptions([]).bootstrap).toBe(true);
    expect(resolveSmokeOptions(['--start']).bootstrap).toBe(true);
    expect(resolveSmokeOptions(['--no-start']).bootstrap).toBe(false);
  });

  it(`refuses --start and --no-start together`, () => {
    expect(() => resolveSmokeOptions(['--start', '--no-start'])).toThrow(/opposite things/);
  });

  // The budget of a run that may start a dev server contains a cold first bundle, which is the
  // same reason a readiness wait defaults to two minutes rather than to seconds.
  it(`gives a bootstrapping run a larger budget, and lets --timeout override it`, () => {
    expect(resolveSmokeOptions([]).timeoutMs).toBe(DEFAULT_SMOKE_START_TIMEOUT_MS);
    expect(resolveSmokeOptions(['--timeout', '30s']).timeoutMs).toBe(30_000);
    expect(resolveSmokeOptions(['--no-start']).timeoutMs).toBe(DEFAULT_SMOKE_TIMEOUT_MS);
  });

  it.each([
    [['--ios'], 'ios'],
    [['--android'], 'android'],
    [['--platform', 'ios'], 'ios'],
    [['--platform', 'android'], 'android'],
    // Two spellings of one answer are one answer, which is the amendment llp/0005 §One preflight for the runtime family.
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

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes. A browser
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
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli typecheck');
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

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules. A bare word is a caller
  // who meant `--route`, and dropping it would run the gate without opening anything.
  it(`refuses a bare route and says how to pass one`, () => {
    expect(() => resolveSmokeOptions(['/notes'])).toThrow(/--route \/notes/);
  });

  it(`refuses an option this command does not have`, () => {
    expect(() => resolveSmokeOptions(['--bogus'])).toThrow(/--bogus/);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate — observed live, 2026-08-24. An absence
// is invisible in a diff and expensive to rediscover, so it is pinned: `--ios` on the detached
// start makes the plan run `expo start --ios`, which drives Simulator.app through AppleScript and
// takes the dev server down with it on a Mac that has granted no Automation permission.
describe('the command line --start uses', () => {
  it(`asks for a detached, ready dev server and nothing else`, () => {
    const { START_DEV_SERVER_ARGV } = require('../smokeAsync') as typeof import('../smokeAsync');

    expect([...START_DEV_SERVER_ARGV]).toEqual(['--yes', '--detach', '--wait-ready']);
  });

  it(`never names a platform, which would open the app from inside the start`, () => {
    const { START_DEV_SERVER_ARGV } = require('../smokeAsync') as typeof import('../smokeAsync');

    for (const flag of ['--ios', '--android', '--web', '--platform', '-i', '-a', '-w']) {
      expect(START_DEV_SERVER_ARGV).not.toContain(flag);
    }
  });
});

describe('the port --start asks for', () => {
  const { startPortArgs } = require('../smokeAsync') as typeof import('../smokeAsync');

  // A caller that named a port named the dev server it means, and a `--start` that ignored it
  // would answer a question about a different port than the one it was asked about.
  it(`carries a loopback port through to the start`, () => {
    expect(startPortArgs('http://127.0.0.1:8210')).toEqual(['--port', '8210']);
    expect(startPortArgs('http://localhost:8210')).toEqual(['--port', '8210']);
  });

  it(`names none when the caller named none`, () => {
    expect(startPortArgs(null)).toEqual([]);
  });

  // `--port` says where a dev server on *this* machine listens, and there is nothing this command
  // can start on another host — so a remote URL is left alone rather than turned into a local port.
  it(`names none for a dev server on another host`, () => {
    expect(startPortArgs('http://192.168.1.5:8081')).toEqual([]);
    expect(startPortArgs('http://build-box:8081')).toEqual([]);
  });

  it(`names none for a URL with no port, and for one that is not a URL`, () => {
    expect(startPortArgs('http://127.0.0.1')).toEqual([]);
    expect(startPortArgs('not a url')).toEqual([]);
  });
});
