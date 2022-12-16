import { APISettings } from '../../settings';
import { wrapFetchWithOffline } from '../wrapFetchWithOffline';

jest.mock('../../settings', () => ({
  APISettings: {
    isOffline: true,
  },
}));

describe(wrapFetchWithOffline, () => {
  it(`supports normal requests`, async () => {
    APISettings.isOffline = false;
    const input = jest.fn();
    const next = wrapFetchWithOffline(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', {});
  });
  it(`times out instantly when offline`, async () => {
    APISettings.isOffline = true;
    const input = jest.fn();
    const next = wrapFetchWithOffline(input);
    await next('https://example.com/', {});
    expect(input).toBeCalledWith('https://example.com/', { timeout: 1 });
  });
});
