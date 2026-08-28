import {
  buildFingerprintCheckUrl,
  CALLBACK_PARAM,
  FINGERPRINT_CHECK_URL_HOST,
  NONCE_PARAM,
} from '../fingerprintCheckProtocol';

describe(buildFingerprintCheckUrl, () => {
  it(`builds a URL the responder can parse, with the callback percent-encoded`, () => {
    const callback = 'http://192.168.1.50:54321/fingerprint-callback';
    const url = new URL(buildFingerprintCheckUrl('exp+app', 'nonce-1', callback));
    expect(url.protocol).toBe('exp+app:');
    expect(url.host).toBe(FINGERPRINT_CHECK_URL_HOST);
    expect(url.searchParams.get(NONCE_PARAM)).toBe('nonce-1');
    expect(url.searchParams.get(CALLBACK_PARAM)).toBe(callback);
  });

  it(`falls back to the check host as the scheme when the project declares none`, () => {
    const url = buildFingerprintCheckUrl('nonce', 'n', 'http://10.0.0.2:1/fingerprint-callback');
    expect(url.startsWith(`nonce://${FINGERPRINT_CHECK_URL_HOST}?`)).toBe(true);
    expect(
      buildFingerprintCheckUrl(null, 'n', 'http://10.0.0.2:1/fingerprint-callback').startsWith(
        `${FINGERPRINT_CHECK_URL_HOST}://${FINGERPRINT_CHECK_URL_HOST}?`
      )
    ).toBe(true);
  });
});
