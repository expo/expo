// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
//
// The samples are the lines the Expo CLI actually prints, so a wording change upstream fails here
// rather than silently handing a cloud simulator a `127.0.0.1` URL again.

import { vol } from 'memfs';

import { readDevServerLockAsync } from '../../devLock';
import {
  classifyDevServerHost,
  expoGoUrlForHost,
  isTunnelCurrent,
  readDevServerLog,
  resolveDevServerReach,
  resolveDevServerReachAsync,
  type CapturedDevServerLog,
} from '../advertisedUrl';
import { detachedLogPath } from '../logFile';

jest.mock('../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
}));

const projectRoot = '/project';

/** The head of a real detached log of a tunnelled run [observed — 2026-08-25, live]. */
const TUNNELLED_LOG = [
  'Using src/app as the root directory for Expo Router.',
  'Waiting on http://znakdiwe5j2n5o0.boltexpo.dev',
  '',
  'Logs for your project will appear below.',
];

/** The same run without a tunnel [observed — 2026-08-24, friction run 3]. */
const LOCAL_LOG = [
  'Using src/app as the root directory for Expo Router.',
  'Waiting on http://localhost:8210',
  '',
  'Logs for your project will appear below.',
];

describe(classifyDevServerHost, () => {
  it.each([
    ['localhost', 'localhost'],
    ['127.0.0.1', 'localhost'],
    ['::1', 'localhost'],
    ['0.0.0.0', 'localhost'],
  ])(`reads %s as a host only this machine can use`, (hostname, expected) => {
    expect(classifyDevServerHost(hostname)).toBe(expected);
  });

  it.each([
    ['192.168.1.233', 'lan'],
    ['10.0.0.7', 'lan'],
    ['172.16.4.2', 'lan'],
    ['169.254.1.1', 'lan'],
  ])(`reads %s as a host on this network`, (hostname, expected) => {
    expect(classifyDevServerHost(hostname)).toBe(expected);
  });

  it.each([
    ['znakdiwe5j2n5o0.boltexpo.dev', 'tunnel'],
    ['kudo-notes.on.staging.expo.app', 'tunnel'],
    ['abc123.ngrok.io', 'tunnel'],
  ])(`reads %s as a host anything on the internet can use`, (hostname, expected) => {
    expect(classifyDevServerHost(hostname)).toBe(expected);
  });

  // A public IP literal is somebody's address, not a tunnel: naming it a tunnel would let the
  // report claim a reconnectable thing where there is only a host.
  it(`reads a public IP literal as a host on a network rather than a tunnel`, () => {
    expect(classifyDevServerHost('93.184.216.34')).toBe('lan');
  });
});

describe(expoGoUrlForHost, () => {
  it(`keeps the port when the advertised URL has one`, () => {
    expect(expoGoUrlForHost('localhost:8210')).toBe('exp://localhost:8210');
  });

  it(`names no port when the tunnel serves the default one`, () => {
    expect(expoGoUrlForHost('znakdiwe5j2n5o0.boltexpo.dev')).toBe(
      'exp://znakdiwe5j2n5o0.boltexpo.dev'
    );
  });
});

describe(readDevServerLog, () => {
  it(`reads the tunnel host out of the line the dev server printed`, () => {
    expect(readDevServerLog(TUNNELLED_LOG)).toEqual({
      advertised: {
        url: 'http://znakdiwe5j2n5o0.boltexpo.dev',
        host: 'znakdiwe5j2n5o0.boltexpo.dev',
        hostType: 'tunnel',
      },
    });
  });

  it(`reads a local run as local, so nothing claims a tunnel that is not there`, () => {
    expect(readDevServerLog(LOCAL_LOG).advertised).toEqual({
      url: 'http://localhost:8210',
      host: 'localhost:8210',
      hostType: 'localhost',
    });
  });

  it(`takes the last line, because a log outlives the run that wrote it`, () => {
    const lines = [...LOCAL_LOG, ...TUNNELLED_LOG];

    expect(readDevServerLog(lines).advertised?.hostType).toBe('tunnel');
  });

  it(`answers null for a log that never named a dev server`, () => {
    expect(readDevServerLog(['Starting Metro Bundler'])).toEqual({ advertised: null });
  });

  it(`strips the underline escape the CLI wraps the URL in`, () => {
    const lines = ['Waiting on [4mhttp://localhost:8081[24m'];

    expect(readDevServerLog(lines).advertised?.host).toBe('localhost:8081');
  });

  // @ref llp/0021-honest-reports.rfc.md §The scheme in "Waiting on" is not the dev server's — K8.
  // With the v2 tunnel active, `getDevServerUrl()` builds the URL with no scheme option and picks
  // up the app's *deep-link* scheme, so the line names the dev server under a scheme no HTTP client
  // can use. `URL.origin` is the string "null" for every non-special scheme, which is what reached
  // `tunnelUrl`. Reproduced against this monorepo's own `UrlCreator` on 2026-08-27.
  describe('a line whose scheme is the app\u2019s, not the dev server\u2019s', () => {
    it(`keeps the host and rebuilds an origin a client can use`, () => {
      const lines = ['Waiting on exp+dailywords-grok://x8fj2.on.staging.expo.app'];

      expect(readDevServerLog(lines).advertised).toEqual({
        // https, because a tunnel terminates TLS \u2014 the same rule `devClientConnectUrl` applies.
        url: 'https://x8fj2.on.staging.expo.app',
        host: 'x8fj2.on.staging.expo.app',
        hostType: 'tunnel',
      });
    });

    it(`never reports the word "null" as a URL`, () => {
      const lines = ['Waiting on exp+dailywords-grok://x8fj2.on.staging.expo.app'];

      expect(readDevServerLog(lines).advertised?.url).not.toContain('null');
    });

    it(`reads an exp:// line as the local dev server it names`, () => {
      const lines = ['Waiting on exp://192.168.1.5:8081'];

      expect(readDevServerLog(lines).advertised).toEqual({
        url: 'http://192.168.1.5:8081',
        host: '192.168.1.5:8081',
        hostType: 'lan',
      });
    });

    // A route link is not a dev server address, and it has no authority to read one from.
    it(`answers null for a scheme URL with no host`, () => {
      expect(readDevServerLog(['Waiting on exp+dailywords-grok:///--/lab']).advertised).toBeNull();
    });
  });
});

describe(resolveDevServerReach, () => {
  const startedAt = '2026-08-25T10:00:00.000Z';
  const lock = { startedAt };
  const captured = (
    lines: string[],
    modifiedAt: number | null = Date.parse(startedAt) + 1000
  ): CapturedDevServerLog => ({ ...readDevServerLog(lines), modifiedAt });

  it(`passes the tunnel through for a log this run wrote`, () => {
    const reach = resolveDevServerReach(captured(TUNNELLED_LOG), lock);

    expect(reach.advertised?.host).toBe('znakdiwe5j2n5o0.boltexpo.dev');
    expect(reach.running).toBe(true);
    expect(isTunnelCurrent(reach)).toBe(true);
  });

  // The case a stale URL comes from: the dev server that is up was started attached, and the log
  // on disk is a detached run that ended.
  it(`refuses a log written before the dev server that is running started`, () => {
    const reach = resolveDevServerReach(
      captured(TUNNELLED_LOG, Date.parse(startedAt) - 60_000),
      lock
    );

    expect(reach.advertised).toBeNull();
    expect(reach.reason).toContain('earlier run');
    expect(isTunnelCurrent(reach)).toBe(false);
  });

  it(`keeps the URL but calls no tunnel current once the dev server is gone`, () => {
    const reach = resolveDevServerReach(captured(TUNNELLED_LOG), null);

    expect(reach.advertised?.host).toBe('znakdiwe5j2n5o0.boltexpo.dev');
    expect(reach.running).toBe(false);
    expect(isTunnelCurrent(reach)).toBe(false);
  });

  it(`says why an attached dev server has nothing to read`, () => {
    const reach = resolveDevServerReach(null, lock);

    expect(reach).toEqual({
      advertised: null,
      running: true,
      reason: 'this dev server was started attached, so nothing captured the URL it printed',
    });
  });

  it(`says why a project that never detached has nothing to read`, () => {
    expect(resolveDevServerReach(null, null).reason).toBe(
      'this project has no detached dev server log'
    );
  });

  it(`never calls a localhost run a tunnel`, () => {
    expect(isTunnelCurrent(resolveDevServerReach(captured(LOCAL_LOG), lock))).toBe(false);
  });
});

// @ref llp/0021-honest-reports.rfc.md §The tunnel host the log never held — S3, and wave 19.
//
// The log is not the only place the host is written, and it is not always the best one. Two live
// runs made that concrete: a detached `--tunnel` run's log did not carry the tunnel host at all
// (S3, wave 17), and a dev server serving a **public origin** through a proxy prints
// `Waiting on http://localhost:<port>` while its manifest names the origin a device can use
// [observed — 2026-08-27, `EXPO_PACKAGER_PROXY_URL` against a public host]. The manifest is the
// answer to the question being asked — where a *device* reaches this dev server — so a manifest
// that names a reachable host wins over a log line that names this machine.
describe('resolveDevServerReachAsync', () => {
  const lockUrl = 'http://127.0.0.1:8309';
  const startedAt = '2026-08-27T09:00:00.000Z';

  function mockManifest(origin: string | null): void {
    globalThis.fetch = (async () => {
      if (origin == null) {
        throw new Error('fetch failed');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ launchAsset: { url: `${origin}/entry.bundle?dev=true` } }),
      };
    }) as unknown as typeof fetch;
  }

  function writeProject(lines: string[] | null): void {
    vol.reset();
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      ...(lines ? { [detachedLogPath(projectRoot)]: lines.join('\n') + '\n' } : {}),
    });
    jest.mocked(readDevServerLockAsync).mockResolvedValue({
      url: lockUrl,
      port: 8309,
      pid: 1,
      startedAt,
      projectRoot,
    });
  }

  afterEach(() => {
    vol.reset();
  });

  it(`prefers the manifest's host over a log line that names this machine`, async () => {
    writeProject(LOCAL_LOG);
    mockManifest('https://wave19reload.tuft.host');

    await expect(resolveDevServerReachAsync(projectRoot)).resolves.toMatchObject({
      advertised: { host: 'wave19reload.tuft.host', hostType: 'tunnel' },
      running: true,
    });
  });

  // The log wins when it already names a host a device can use: it is the dev server's own account
  // of the run, and a second request cannot improve on it.
  it(`keeps a tunnel host the log named, and asks no manifest for it`, async () => {
    writeProject(TUNNELLED_LOG);
    const fetched = jest.fn();
    globalThis.fetch = fetched as unknown as typeof fetch;

    await expect(resolveDevServerReachAsync(projectRoot)).resolves.toMatchObject({
      advertised: { host: 'znakdiwe5j2n5o0.boltexpo.dev' },
    });
    expect(fetched).not.toHaveBeenCalled();
  });

  // A manifest that names this machine is no better than a log that does, and replacing a LAN
  // address with `localhost` would take a URL a phone can use and hand back one it cannot.
  it(`keeps the log's own reading when the manifest is local too`, async () => {
    writeProject(LOCAL_LOG);
    mockManifest('http://127.0.0.1:8309');

    await expect(resolveDevServerReachAsync(projectRoot)).resolves.toMatchObject({
      advertised: { host: 'localhost:8210' },
    });
  });

  it(`still answers from the manifest when the log named nothing (S3)`, async () => {
    writeProject(['Starting Metro Bundler']);
    mockManifest('https://chx3ba8-kudochien-8303.exp.direct');

    await expect(resolveDevServerReachAsync(projectRoot)).resolves.toMatchObject({
      advertised: { host: 'chx3ba8-kudochien-8303.exp.direct', hostType: 'tunnel' },
    });
  });
});
