// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
//
// The samples are the lines the Expo CLI actually prints, so a wording change upstream fails here
// rather than silently handing a cloud simulator a `127.0.0.1` URL again.

import {
  classifyDevServerHost,
  expoGoUrlForHost,
  readDevServerLog,
  TUNNEL_RESTART_COMMAND,
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
      tunnelFailure: null,
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
    expect(readDevServerLog(['Starting Metro Bundler'])).toEqual({
      advertised: null,
      tunnelFailure: null,
    });
  });

  it(`strips the underline escape the CLI wraps the URL in`, () => {
    const lines = ['Waiting on [4mhttp://localhost:8081[24m'];

    expect(readDevServerLog(lines).advertised?.host).toBe('localhost:8081');
  });
});

describe(`${readDevServerLog.name} — a tunnel that died`, () => {
  // The handshake failure of the dogfood run: `ws` reports a non-101 response verbatim
  // [observed — `ws/lib/websocket.js`, and live in a cloud-simulator session, 2026-08-24].
  it(`reads the websocket handshake refusal that ends a tunnel`, () => {
    const lines = [...TUNNELLED_LOG, 'Error: Unexpected server response: 409'];

    expect(readDevServerLog(lines).tunnelFailure).toEqual({
      signature: 'handshake',
      line: 'Error: Unexpected server response: 409',
    });
  });

  it(`reads the name lookup that fails once the tunnel host is gone`, () => {
    const lines = [...TUNNELLED_LOG, 'Error: getaddrinfo ENOTFOUND znakdiwe5j2n5o0.boltexpo.dev'];

    expect(readDevServerLog(lines).tunnelFailure?.signature).toBe('dns');
  });

  // @ref packages/@expo/cli/src/start/server/AsyncWsTunnel.ts — the `disconnected` handler.
  it(`reads the CLI's own closed-tunnel line`, () => {
    const lines = [
      ...TUNNELLED_LOG,
      'Tunnel connection has been closed. This is often related to intermittent connection problems with the ws proxy servers. Restart the dev server to try connecting again.',
    ];

    expect(readDevServerLog(lines).tunnelFailure?.signature).toBe('closed');
  });

  // The whole point of the ordering: a tunnel that failed and then came up is not a dead tunnel,
  // and the URL below the failure is the one a device should be given.
  it(`ignores a failure printed before the URL that is current`, () => {
    const lines = ['Error: Unexpected server response: 409', ...TUNNELLED_LOG];

    expect(readDevServerLog(lines).tunnelFailure).toBeNull();
  });

  it(`ignores a name lookup for a host that is not the tunnel`, () => {
    const lines = [...TUNNELLED_LOG, 'Error: getaddrinfo ENOTFOUND api.example.com'];

    expect(readDevServerLog(lines).tunnelFailure).toBeNull();
  });

  it(`reads a name lookup for another host of the tunnel's own domain`, () => {
    const lines = [...TUNNELLED_LOG, 'Error: getaddrinfo ENOTFOUND ws.boltexpo.dev'];

    expect(readDevServerLog(lines).tunnelFailure?.signature).toBe('dns');
  });

  it(`says nothing about a tunnel for a run that never had one`, () => {
    const lines = [...LOCAL_LOG, 'Error: Unexpected server response: 409'];

    expect(readDevServerLog(lines).tunnelFailure).toBeNull();
  });

  it(`names one command to bring a tunnel back`, () => {
    expect(TUNNEL_RESTART_COMMAND).toBe('npx exagent dev --detach --tunnel');
  });
});
