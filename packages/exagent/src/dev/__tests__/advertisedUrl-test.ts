// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
//
// The samples are the lines the Expo CLI actually prints, so a wording change upstream fails here
// rather than silently handing a cloud simulator a `127.0.0.1` URL again.

import {
  classifyDevServerHost,
  expoGoUrlForHost,
  isTunnelCurrent,
  readDevServerLog,
  resolveDevServerReach,
  type CapturedDevServerLog,
} from '../advertisedUrl';

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
