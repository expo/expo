import { Socket } from 'node:net';

import {
  isLocalSocket,
  isMatchingOrigin,
  isTrustedDevServerSocket,
  type SocketRemoteFamily,
} from '../net';

function createSocket({
  localAddress,
  remoteAddress,
  remoteFamily,
}: {
  localAddress?: string;
  remoteAddress?: string;
  remoteFamily?: SocketRemoteFamily;
}): Socket {
  const socket = new Socket();
  if (localAddress != null) {
    Object.defineProperty(socket, 'localAddress', { configurable: true, value: localAddress });
  }
  if (remoteAddress != null) {
    Object.defineProperty(socket, 'remoteAddress', { configurable: true, value: remoteAddress });
  }
  if (remoteFamily != null) {
    Object.defineProperty(socket, 'remoteFamily', { configurable: true, value: remoteFamily });
  }
  return socket;
}

describe(isLocalSocket, () => {
  it('detects loopback sockets', () => {
    expect(
      isLocalSocket(createSocket({ localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' }))
    ).toBe(true);
    expect(isLocalSocket(createSocket({ remoteAddress: '127.0.0.1', remoteFamily: 'IPv4' }))).toBe(
      true
    );
    expect(isLocalSocket(createSocket({ localAddress: '::1', remoteAddress: '::1' }))).toBe(true);
    expect(
      isLocalSocket(createSocket({ remoteAddress: '::ffff:127.0.0.1', remoteFamily: 'IPv6' }))
    ).toBe(true);
    expect(isLocalSocket(createSocket({ remoteAddress: '::1', remoteFamily: 'IPv6' }))).toBe(true);
    expect(
      isLocalSocket(
        createSocket({
          localAddress: '::ffff:127.0.0.1',
          remoteAddress: '::ffff:127.0.0.1',
        })
      )
    ).toBe(true);
  });

  it('rejects other connections', () => {
    expect(
      isLocalSocket(
        createSocket({
          localAddress: '127.0.0.1',
          remoteAddress: '10.0.0.2',
          remoteFamily: 'IPv4',
        })
      )
    ).toBe(false);
    expect(
      isLocalSocket(
        createSocket({
          localAddress: '127.0.0.1',
          remoteAddress: '100.0.0.1',
          remoteFamily: 'IPv4',
        })
      )
    ).toBe(false);
    expect(
      isLocalSocket(
        createSocket({
          localAddress: '127.0.0.1',
          remoteAddress: '1.1.1.1',
          remoteFamily: 'IPv4',
        })
      )
    ).toBe(false);
    expect(
      isLocalSocket(createSocket({ localAddress: '::1', remoteAddress: '::2', remoteFamily: 'IPv6' }))
    ).toBe(false);
  });
});

describe(isTrustedDevServerSocket, () => {
  it('detects loopback sockets without trusted proxy CIDRs', () => {
    expect(isTrustedDevServerSocket(createSocket({ remoteAddress: '127.0.0.1', remoteFamily: 'IPv4' }))).toBe(
      true
    );
  });

  it('detects trusted proxy sockets by IPv4 CIDR', () => {
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: '172.18.0.8' }),
        { trustedProxyCIDRs: ['172.18.0.0/16'] }
      )
    ).toBe(true);
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: '::ffff:172.18.0.8' }),
        { trustedProxyCIDRs: ['172.18.0.0/16'] }
      )
    ).toBe(true);
  });

  it('detects trusted proxy sockets by IPv6 CIDR', () => {
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: 'fd00::8' }),
        { trustedProxyCIDRs: ['fd00::/8'] }
      )
    ).toBe(true);
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: 'fd01::8' }),
        { trustedProxyCIDRs: ['fd00::/16'] }
      )
    ).toBe(false);
  });

  it('rejects untrusted and malformed proxy CIDRs', () => {
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: '172.19.0.8' }),
        { trustedProxyCIDRs: ['172.18.0.0/16'] }
      )
    ).toBe(false);
    expect(
      isTrustedDevServerSocket(
        createSocket({ remoteAddress: '172.18.0.8' }),
        { trustedProxyCIDRs: ['not-a-cidr'] }
      )
    ).toBe(false);
  });
});

describe(isMatchingOrigin, () => {
  it('returns true when no Origin header was sent', () => {
    expect(isMatchingOrigin({ headers: {} }, 'http://127.0.0.1:8181')).toBe(true);
  });

  it('returns true when Origin header matches expected Host', () => {
    expect(
      isMatchingOrigin({ headers: { origin: 'http://127.0.0.1:8181' } }, 'http://127.0.0.1:8181')
    ).toBe(true);
    expect(
      isMatchingOrigin({ headers: { origin: 'http://127.0.0.1:8180' } }, 'http://127.0.0.1:8181')
    ).toBe(false);
    expect(
      isMatchingOrigin({ headers: { origin: 'https://127.0.0.1:8181' } }, 'http://127.0.0.1:8181')
    ).toBe(true);
    expect(isMatchingOrigin({ headers: { origin: 'http://other' } }, 'http://127.0.0.1:8181')).toBe(
      false
    );
  });

  it('treats a malformed Origin header as untrusted', () => {
    expect(isMatchingOrigin({ headers: { origin: 'not-a-url' } }, 'http://127.0.0.1:8181')).toBe(
      false
    );
  });
});
