import type { Socket } from 'node:net';

import { Log } from '../../../../log';
import { createRemotePeerWarning } from '../RemotePeerWarningMiddleware';
import type { ServerNext, ServerRequest, ServerResponse } from '../server.types';

const asSocket = (remoteAddress?: string): Socket | undefined => {
  if (remoteAddress === undefined) return undefined;
  return {
    remoteAddress,
    remoteFamily: remoteAddress.includes(':') ? 'IPv6' : 'IPv4',
    // Loopback would have localAddress === remoteAddress; for these tests the peer
    // is always considered distinct from the server.
    localAddress: '0.0.0.0',
  } as unknown as Socket;
};

const asRequest = (remoteAddress?: string, userAgent?: string): ServerRequest =>
  ({
    socket: asSocket(remoteAddress),
    headers: userAgent ? { 'user-agent': userAgent } : {},
  }) as unknown as ServerRequest;

describe(createRemotePeerWarning, () => {
  let warnSpy: jest.SpyInstance;
  let res: ServerResponse;
  let next: jest.Mock<ServerNext>;

  beforeEach(() => {
    warnSpy = jest.spyOn(Log, 'warn').mockImplementation(() => {});
    res = {} as ServerResponse;
    next = jest.fn();
    delete process.env.EXPO_SILENCE_REMOTE_PEER_WARNINGS;
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns once for a remote LAN peer (192.168.x)', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.83'), res, next);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('192.168.1.83');
    expect(warnSpy.mock.calls[0][0]).toContain('expo start --localhost');
    expect(next).toHaveBeenCalledWith();
  });

  it('always calls next() regardless of warning', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('127.0.0.1'), res, next);
    expect(next).toHaveBeenCalledWith();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('dedupes the same IP across requests', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.83'), res, next);
    middleware(asRequest('192.168.1.83'), res, next);
    middleware(asRequest('192.168.1.83'), res, next);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('warns once per distinct IP', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.83'), res, next);
    middleware(asRequest('10.0.0.5'), res, next);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('normalizes IPv4-mapped IPv6 addresses', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('::ffff:192.168.1.83'), res, next);
    // log should show the bare v4 form
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('192.168.1.83');
    expect(warnSpy.mock.calls[0][0]).not.toContain('::ffff:');

    // and the same v4 raw connection should be deduped
    middleware(asRequest('192.168.1.83'), res, next);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('silences loopback peers (127.0.0.1, ::1, ::ffff:127.0.0.1)', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('127.0.0.1'), res, next);
    middleware(asRequest('::1'), res, next);
    middleware(asRequest('::ffff:127.0.0.1'), res, next);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('silences via EXPO_SILENCE_REMOTE_PEER_WARNINGS env var', () => {
    process.env.EXPO_SILENCE_REMOTE_PEER_WARNINGS = '1';
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.83'), res, next);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns for pure IPv6 link-local LAN address', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('fe80::1ff:fe23:4567:890a'), res, next);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('fe80::');
  });

  it('handles missing remoteAddress', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest(undefined), res, next);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('appends "Expo Go" label for the Expo Go user agent', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.10', 'Expo/2.32.0 Expo Go/2.32.0 (iPhone)'), res, next);
    expect(warnSpy.mock.calls[0][0]).toContain('(Expo Go)');
  });

  it('appends "Expo dev client" label when only Expo/ is present', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.11', 'Expo/1.0.0 (development client)'), res, next);
    expect(warnSpy.mock.calls[0][0]).toContain('(Expo dev client)');
  });

  it('appends "Android" label for okhttp UA', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.12', 'okhttp/4.9.2'), res, next);
    expect(warnSpy.mock.calls[0][0]).toContain('(Android)');
  });

  it('appends "iOS" label for CFNetwork/Darwin UA', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.13', 'MyApp/1.0 CFNetwork/1390 Darwin/22.0.0'), res, next);
    expect(warnSpy.mock.calls[0][0]).toContain('(iOS)');
  });

  it('appends "browser" label for desktop browser UA', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(
      asRequest(
        '192.168.1.14',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Chrome/120.0.0.0 Safari/537.36'
      ),
      res,
      next
    );
    expect(warnSpy.mock.calls[0][0]).toContain('(browser)');
  });

  it('appends tool name for curl/wget/httpie', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.15', 'curl/8.4.0'), res, next);
    expect(warnSpy.mock.calls[0][0]).toContain('(curl)');
  });

  it('omits the parenthetical label for an unrecognized user agent', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.16', 'SomethingWeirdAndUnknown/1.2.3'), res, next);
    const msg = warnSpy.mock.calls[0][0];
    expect(msg).toContain('192.168.1.16');
    expect(msg).not.toContain('SomethingWeirdAndUnknown');
    // No parenthetical after the IP
    expect(msg).not.toMatch(/192\.168\.1\.16[^\n]*\(/);
  });

  it('omits the parenthetical label when no user agent is provided', () => {
    const { middleware } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.17'), res, next);
    const msg = warnSpy.mock.calls[0][0];
    expect(msg).toContain('192.168.1.17');
    expect(msg).not.toMatch(/192\.168\.1\.17[^\n]*\(/);
  });

  it('onRemotePeer shares the same dedup state as the middleware', () => {
    const { middleware, onRemotePeer } = createRemotePeerWarning();
    middleware(asRequest('192.168.1.83', 'Expo Go/1.0'), res, next);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // A subsequent WS upgrade from the same peer should NOT warn again.
    onRemotePeer(asSocket('192.168.1.83'), 'Expo Go/1.0');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('onRemotePeer warns on first contact via WS even without an HTTP request', () => {
    const { onRemotePeer } = createRemotePeerWarning();
    onRemotePeer(asSocket('192.168.1.83'), 'okhttp/4.9.2');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('192.168.1.83');
    expect(warnSpy.mock.calls[0][0]).toContain('(Android)');
  });

  it('silences peer when the request is a loopback (localAddress === remoteAddress)', () => {
    // Simulates a request from the same machine to its own LAN IP (e.g., when --host lan
    // is used and a local browser connects to the server's LAN address).
    const loopbackSocket = {
      remoteAddress: '192.168.1.83',
      localAddress: '192.168.1.83',
      remoteFamily: 'IPv4',
    } as unknown as Socket;
    const { onRemotePeer } = createRemotePeerWarning();
    onRemotePeer(loopbackSocket, 'Expo Go/1.0');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
