import { wrapFetchWithProxy } from '../wrapFetchWithProxy';

const originalEnv = process.env;

afterAll(() => {
  process.env = originalEnv;
});

describe(wrapFetchWithProxy, () => {
  it(`supports normal requests`, async () => {
    delete process.env.HTTP_PROXY;

    const input = jest.fn();
    const next = wrapFetchWithProxy(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', {});
  });
  it(`proxies requests`, async () => {
    process.env.HTTP_PROXY = 'http://localhost:8080';
    const input = jest.fn();
    const next = wrapFetchWithProxy(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', {
      agent: expect.objectContaining({
        proxy: expect.objectContaining({
          host: 'localhost',
        }),
      }),
    });
  });
});
