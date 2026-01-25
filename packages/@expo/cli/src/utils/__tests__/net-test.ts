import { isLocalSocket as _isLocalSocket, isMatchingOrigin } from '../net';

const isLocalSocket = _isLocalSocket as (x: any) => boolean;

describe(isLocalSocket, () => {
  it('detects loopback sockets', () => {
    expect(isLocalSocket({ localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' })).toBe(true);
    expect(isLocalSocket({ remoteFamily: 'IPv4', remoteAddress: '127.0.0.1' })).toBe(true);
    expect(isLocalSocket({ remoteFamily: 'IPv6', remoteAddress: '::ffff:127.0.0.1' })).toBe(true);
    expect(isLocalSocket({ remoteFamily: 'IPv6', remoteAddress: '::1' })).toBe(true);
    expect(isLocalSocket({ localAddress: '::1', remoteAddress: '::1', remoteFamily: 'IPv6' })).toBe(
      true
    );
    expect(
      isLocalSocket({ localAddress: '::ffff:127.0.0.1', remoteAddress: '::ffff:127.0.0.1' })
    ).toBe(true);
    expect(
      isLocalSocket({ localAddress: '::ffff:127.0.0.1', remoteAddress: '::ffff:127.0.0.1' })
    ).toBe(true);
  });

  it('rejects other connections', () => {
    expect(
      isLocalSocket({ remoteFamily: 'IPv4', localAddress: '127.0.0.1', remoteAddress: '10.0.0.2' })
    ).toBe(false);
    expect(
      isLocalSocket({ remoteFamily: 'IPv4', localAddress: '127.0.0.1', remoteAddress: '100.0.0.1' })
    ).toBe(false);
    expect(
      isLocalSocket({ remoteFamily: 'IPv4', localAddress: '127.0.0.1', remoteAddress: '1.1.1.1' })
    ).toBe(false);
    expect(isLocalSocket({ remoteFamily: 'IPv4', localAddress: '::1', remoteAddress: '::2' })).toBe(
      false
    );
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
});
