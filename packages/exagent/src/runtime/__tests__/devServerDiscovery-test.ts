import { discoverDevServerAsync } from '../devServer';

const target = { webSocketDebuggerUrl: 'ws://x' } as any;

/** Answer /json/list per port: a targets array, [] for running-but-empty, or refuse. */
function mockFetchByPort(answers: { [port: string]: any[] | 'refuse' }) {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    const answer = answers[url.port];
    if (answer === 'refuse' || answer === undefined) {
      throw new Error('ECONNREFUSED');
    }
    return { ok: true, json: async () => answer } as Response;
  });
}

afterEach(() => jest.restoreAllMocks());

describe(discoverDevServerAsync, () => {
  it(`probes only the explicit URL and never scans`, async () => {
    mockFetchByPort({ '9999': [target] });
    const result = await discoverDevServerAsync('http://127.0.0.1:9999');
    expect(result).toMatchObject({
      reachable: true,
      devServerUrl: 'http://127.0.0.1:9999',
      source: 'flag',
      discovered: false,
    });
    expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it(`short-circuits on the default port without scanning`, async () => {
    mockFetchByPort({ '8081': [target] });
    const result = await discoverDevServerAsync();
    expect(result).toMatchObject({
      devServerUrl: 'http://127.0.0.1:8081',
      source: 'default',
      discovered: false,
    });
    expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it(`scans the expo start fallback ports when 8081 does not answer`, async () => {
    mockFetchByPort({ '8083': [target] });
    const result = await discoverDevServerAsync();
    expect(result).toMatchObject({
      reachable: true,
      devServerUrl: 'http://127.0.0.1:8083',
      source: 'scan',
      discovered: true,
    });
  });

  it(`prefers a server with a connected app over an empty one`, async () => {
    mockFetchByPort({ '8082': [], '8084': [target] });
    const result = await discoverDevServerAsync();
    expect(result.devServerUrl).toBe('http://127.0.0.1:8084');
    expect(result.targets).toHaveLength(1);
  });

  it(`reports the default port unreachable when nothing answers anywhere`, async () => {
    mockFetchByPort({});
    const result = await discoverDevServerAsync(undefined, { timeoutMs: 50 });
    expect(result).toMatchObject({
      reachable: false,
      devServerUrl: 'http://127.0.0.1:8081',
      source: 'default',
      discovered: false,
    });
  });
});

describe('readLastLoggedDevServerPort via discovery', () => {
  const { vol } = require('memfs');
  const projectRoot = '/proj';
  afterEach(() => vol.reset());

  it(`probes the port the project's start.log names before scanning`, async () => {
    vol.fromJSON(
      {
        '.expo/dev/logs/start.log': [
          JSON.stringify({ _e: 'metro:instantiate', port: 8082 }),
          JSON.stringify({ _e: 'metro:instantiate', port: 8090 }),
        ].join('\n'),
      },
      projectRoot
    );
    mockFetchByPort({ '8090': [target] });
    const result = await discoverDevServerAsync(undefined, { projectRoot });
    expect(result).toMatchObject({
      reachable: true,
      devServerUrl: 'http://127.0.0.1:8090',
      source: 'log',
      discovered: true,
    });
    // The logged port answered, so neither 8081 nor the scan ports were touched.
    expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it(`falls back to the scan when the logged port is stale`, async () => {
    vol.fromJSON(
      { '.expo/dev/logs/start.log': JSON.stringify({ _e: 'metro:instantiate', port: 8090 }) },
      projectRoot
    );
    mockFetchByPort({ '8083': [target] });
    const result = await discoverDevServerAsync(undefined, { projectRoot, timeoutMs: 50 });
    expect(result.devServerUrl).toBe('http://127.0.0.1:8083');
  });
});
