import { parseUrlUsingCustomBase, safeDecodeURI, safeDecodeURIComponent } from '../url';

describe(parseUrlUsingCustomBase, () => {
  it('should parse relative path', () => {
    const url = parseUrlUsingCustomBase('/path/to/page');
    expect(url.pathname).toBe('/path/to/page');
  });

  it('should parse path with query parameters', () => {
    const url = parseUrlUsingCustomBase('/path?foo=bar&baz=qux');
    expect(url.pathname).toBe('/path');
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('baz')).toBe('qux');
  });

  it('should parse path with hash', () => {
    const url = parseUrlUsingCustomBase('/path#section');
    expect(url.pathname).toBe('/path');
    expect(url.hash).toBe('#section');
  });

  it('should normalize pathname with dots', () => {
    const url = parseUrlUsingCustomBase('/path/../other/./page');
    expect(url.pathname).toBe('/other/page');
  });

  it('should parse path with encoded characters', () => {
    const url = parseUrlUsingCustomBase('/path%20with%20spaces');
    expect(url.pathname).toBe('/path%20with%20spaces');
  });

  it('should handle empty string', () => {
    const url = parseUrlUsingCustomBase('');
    expect(url.pathname).toBe('/');
  });

  it('should parse path with query and hash', () => {
    const url = parseUrlUsingCustomBase('/path?query=value#hash');
    expect(url.pathname).toBe('/path');
    expect(url.searchParams.get('query')).toBe('value');
    expect(url.hash).toBe('#hash');
  });

  it('should handle special characters in query parameters', () => {
    const url = parseUrlUsingCustomBase('/path?param=value%20with%20spaces');
    expect(url.searchParams.get('param')).toBe('value with spaces');
  });
});

describe(safeDecodeURI, () => {
  it(`decodes a well-formed URI`, () => {
    expect(safeDecodeURI('http://localhost:8081/example%20path')).toEqual(
      'http://localhost:8081/example path'
    );
  });
  it(`returns the original string when the URI is malformed`, () => {
    expect(safeDecodeURI('http://localhost:8081/%GG')).toEqual('http://localhost:8081/%GG');
  });
  it(`does not throw on malformed percent-encoding`, () => {
    expect(() => safeDecodeURI('%GG')).not.toThrow();
  });
});

describe(safeDecodeURIComponent, () => {
  it(`decodes a well-formed URI component`, () => {
    expect(safeDecodeURIComponent('%20%2B%2F')).toEqual(' +/');
  });
  it(`returns the original string when the URI component is malformed`, () => {
    expect(safeDecodeURIComponent('%GG')).toEqual('%GG');
  });
  it(`does not throw on malformed percent-encoding`, () => {
    expect(() => safeDecodeURIComponent('%GG')).not.toThrow();
  });
});
