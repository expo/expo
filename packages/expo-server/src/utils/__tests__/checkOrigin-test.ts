import { isForbiddenOrigin } from '../checkOrigin';

function request(headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://app.example/login', {
    method,
    headers: { 'content-type': 'text/plain', ...headers },
  });
}

describe(isForbiddenOrigin, () => {
  it.each([
    ['https://app.example', false],
    ['https://evil.example', true],
    ['https://app.example:444', true],
    ['http://app.example', true],
    ['null', true],
    ['invalid', true],
  ])('checks source origin %s', (origin, forbidden) => {
    expect(isForbiddenOrigin(request({ origin }))).toBe(forbidden);
  });

  it.each([
    ['same-origin', false],
    ['none', false],
    ['same-site', true],
    ['cross-site', true],
    ['unexpected', true],
  ])('checks Fetch Metadata %s in both modes', (site, forbidden) => {
    const input = request({
      'sec-fetch-site': site,
      'sec-fetch-mode': 'navigate',
      origin: 'https://app.example',
    });
    for (const checkOrigin of [true, 'sec-only'] as const) {
      expect(isForbiddenOrigin(input, checkOrigin)).toBe(forbidden);
    }
  });

  it.each([
    '',
    'TEXT/PLAIN; charset=utf-8',
    'multipart/form-data; boundary=abc',
    'application/x-www-form-urlencoded',
  ])('checks form content type %j', (contentType) => {
    expect(
      isForbiddenOrigin(request({ origin: 'https://evil.example', 'content-type': contentType }))
    ).toBe(true);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('checks unsafe method %s', (method) => {
    expect(isForbiddenOrigin(request({ origin: 'https://evil.example' }, method))).toBe(true);
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('allows safe method %s', (method) => {
    expect(isForbiddenOrigin(request({ origin: 'https://evil.example' }, method))).toBe(false);
  });

  it('allows JSON and absent source metadata, and skips Origin in sec-only mode', () => {
    expect(
      isForbiddenOrigin(
        request({ origin: 'https://evil.example', 'content-type': 'application/json' })
      )
    ).toBe(false);
    expect(isForbiddenOrigin(request())).toBe(false);
    expect(isForbiddenOrigin(request({ 'sec-fetch-site': 'cross-site' }), false)).toBe(false);
    expect(isForbiddenOrigin(request({ origin: 'https://evil.example' }), 'sec-only')).toBe(false);
  });
  it('uses the configured public origin behind a TLS-terminating proxy', () => {
    const input = new Request('http://app.example/login', {
      method: 'POST',
      headers: { origin: 'https://app.example', 'content-type': 'text/plain' },
    });
    expect(isForbiddenOrigin(input, true, 'https://app.example')).toBe(false);
    expect(isForbiddenOrigin(input)).toBe(true);
    expect(
      isForbiddenOrigin(
        new Request(input, { headers: { origin: 'https://evil.example' } }),
        true,
        'https://app.example'
      )
    ).toBe(true);
    expect(isForbiddenOrigin(input, 'sec-only', 'https://other.example')).toBe(false);
  });
  it('allows the request target when the configured origin is malformed', () => {
    expect(isForbiddenOrigin(request({ origin: 'https://app.example' }), true, 'not-a-url')).toBe(
      false
    );
    expect(isForbiddenOrigin(request({ origin: 'https://evil.example' }), true, 'not-a-url')).toBe(
      true
    );
  });
});
