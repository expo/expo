import { parseForwardedRequestInfo } from '../resolveForwarded';
import type { ServerRequest } from '../server.types';

const asReq = (headers: Record<string, string>) => ({ headers }) as unknown as ServerRequest;

describe(parseForwardedRequestInfo, () => {
  it(`returns null when the request was not forwarded`, () => {
    expect(parseForwardedRequestInfo(asReq({ host: 'localhost:8081' }))).toBeNull();
  });

  it(`parses the RFC 7239 "Forwarded" header`, () => {
    expect(
      parseForwardedRequestInfo(asReq({ forwarded: 'host="proxy.test:4443";proto=https' }))
    ).toEqual({ authority: 'proxy.test:4443', protocol: 'https' });
  });

  it(`parses unquoted and reordered "Forwarded" parameters`, () => {
    expect(
      parseForwardedRequestInfo(asReq({ forwarded: 'for=192.0.2.1;proto=http;host=proxy.test' }))
    ).toEqual({ authority: 'proxy.test', protocol: 'http' });
  });

  it(`uses the first element when a proxy chain appended to "Forwarded"`, () => {
    expect(
      parseForwardedRequestInfo(
        asReq({ forwarded: 'host="proxy.test:4443";proto=https, host=inner.test;proto=http' })
      )
    ).toEqual({ authority: 'proxy.test:4443', protocol: 'https' });
  });

  it(`falls back to the "X-Forwarded-*" headers`, () => {
    expect(
      parseForwardedRequestInfo(
        asReq({ 'x-forwarded-host': 'proxy.test:4443', 'x-forwarded-proto': 'https' })
      )
    ).toEqual({ authority: 'proxy.test:4443', protocol: 'https' });
  });

  it(`uses the first value of comma-separated "X-Forwarded-*" headers`, () => {
    expect(
      parseForwardedRequestInfo(
        asReq({ 'x-forwarded-host': 'proxy.test, inner.test', 'x-forwarded-proto': 'https, http' })
      )
    ).toEqual({ authority: 'proxy.test', protocol: 'https' });
  });

  it(`prefers "Forwarded" over the "X-Forwarded-*" headers`, () => {
    expect(
      parseForwardedRequestInfo(
        asReq({
          forwarded: 'host=proxy.test;proto=https',
          'x-forwarded-host': 'ignored.test',
          'x-forwarded-proto': 'http',
        })
      )
    ).toEqual({ authority: 'proxy.test', protocol: 'https' });
  });

  it(`returns the protocol alone when no host was forwarded`, () => {
    expect(parseForwardedRequestInfo(asReq({ 'x-forwarded-proto': 'https' }))).toEqual({
      protocol: 'https',
    });
  });

  it(`returns the authority alone when no protocol was forwarded`, () => {
    expect(parseForwardedRequestInfo(asReq({ 'x-forwarded-host': 'proxy.test:4443' }))).toEqual({
      authority: 'proxy.test:4443',
    });
  });

  it(`normalizes the authority and drops anything but host and port`, () => {
    expect(
      parseForwardedRequestInfo(asReq({ 'x-forwarded-host': 'user@Proxy.TEST:4443/../evil' }))
    ).toEqual({ authority: 'proxy.test:4443' });
  });

  it(`ignores unusable values`, () => {
    expect(parseForwardedRequestInfo(asReq({ 'x-forwarded-host': '' }))).toBeNull();
    expect(parseForwardedRequestInfo(asReq({ 'x-forwarded-host': 'not a host' }))).toBeNull();
    expect(parseForwardedRequestInfo(asReq({ 'x-forwarded-proto': 'gopher' }))).toBeNull();
    expect(parseForwardedRequestInfo(asReq({ forwarded: 'for=192.0.2.1' }))).toBeNull();
  });
});
