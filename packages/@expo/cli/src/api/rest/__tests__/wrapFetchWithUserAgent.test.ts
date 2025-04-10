import { wrapFetchWithUserAgent } from '../wrapFetchWithUserAgent';

jest.mock('node:process', () => ({
  ...jest.requireActual('node:process'),
  env: { __EXPO_VERSION: '1.33.7' },
}));

describe(wrapFetchWithUserAgent, () => {
  it('adds user-agent without headers', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);

    await wrapped('https://example.com');

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['user-agent', 'expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with header object', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = {
      Authorization: 'bearer some-token',
    };

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with header object with existing user-agent', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = {
      Authorization: 'bearer some-token',
      'User-Agent': 'test',
    };

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'test, expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with header array', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = [['Authorization', 'bearer some-token']];

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with header array with existing user-agent', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = [
      ['Authorization', 'bearer some-token'],
      ['User-Agent', 'test'],
    ];

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'test, expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with Headers instance', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = new Headers({
      Authorization: 'bearer some-token',
    });

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'expo-cli/1.33.7'],
    ]);
  });

  it('adds user-agent with Headers instance with existing user-agent', async () => {
    const fetch = jest.fn();
    const wrapped = wrapFetchWithUserAgent(fetch);
    const headers = new Headers({
      Authorization: 'bearer some-token',
      'User-Agent': 'test',
    });

    await wrapped('https://example.com', { headers });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect([...fetch.mock.calls[0][1].headers.entries()]).toEqual([
      ['authorization', 'bearer some-token'],
      ['user-agent', 'test, expo-cli/1.33.7'],
    ]);
  });
});
