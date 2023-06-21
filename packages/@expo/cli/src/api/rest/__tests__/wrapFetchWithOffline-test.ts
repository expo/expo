import { wrapFetchWithOffline } from '../wrapFetchWithOffline';

describe(wrapFetchWithOffline, () => {
  it(`supports normal requests`, async () => {
    delete process.env.EXPO_OFFLINE;
    const input = jest.fn();
    const next = wrapFetchWithOffline(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', {});
  });
  it(`times out instantly when offline`, async () => {
    process.env.EXPO_OFFLINE = '1';
    const input = jest.fn();
    const next = wrapFetchWithOffline(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', { timeout: 1 });
  });
});
