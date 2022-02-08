import { URLSearchParams } from 'url';

import { wrapFetchWithBaseUrl } from '../wrapFetchWithBaseUrl';

describe(wrapFetchWithBaseUrl, () => {
  it(`supports relative paths`, async () => {
    const input = jest.fn();
    const next = wrapFetchWithBaseUrl(input, 'https://example.com/v2/');
    await next('test', {});
    expect(input).toBeCalledWith('https://example.com/v2/test', {});
  });
  it(`supports relative paths that don't begin with slash`, async () => {
    const input = jest.fn();
    const next = wrapFetchWithBaseUrl(input, 'https://example.com/v2/');
    await next('test', {});
    expect(input).toBeCalledWith('https://example.com/v2/test', {});
  });
  it(`supports absolute URLs`, async () => {
    const input = jest.fn();
    const next = wrapFetchWithBaseUrl(input, 'https://example.com/v2');
    await next('https://expo.dev/', {});
    expect(input).toBeCalledWith('https://expo.dev/', {});
  });
  it(`appends URLSearchParams to the URL`, async () => {
    const input = jest.fn();
    const next = wrapFetchWithBaseUrl(input, 'https://example.com/v2/');
    await next('test', {
      searchParams: new URLSearchParams({
        foo: 'bar',
      }),
    });
    expect(input).toBeCalledWith('https://example.com/v2/test?foo=bar', expect.anything());
  });
  it(`does not support non-string URLs`, async () => {
    const input = jest.fn();
    const next = wrapFetchWithBaseUrl(input, 'https://example.com/v2');
    expect(() => next({ href: 'foo' }, {})).toThrow(/string URL/);
  });
});
