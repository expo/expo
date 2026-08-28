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

  it(`cancels the requests it gave up waiting for`, async () => {
    // A budget that only ends the *wait* leaves the connection attempt running to undici's own
    // ceiling, and the process cannot exit while it does. Every candidate here hangs, so what is
    // under test is that each one is aborted rather than abandoned.
    const aborted: string[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation(
      (input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            aborted.push(new URL(String(input)).port);
            reject(new Error('This operation was aborted'));
          });
        })
    );

    const result = await discoverDevServerAsync(undefined, { timeoutMs: 20 });

    expect(result).toMatchObject({ reachable: false, source: 'default' });
    expect(aborted.sort()).toEqual(['8081', '8082', '8083', '8084', '8085']);
  });

  it(`cancels the named URL's request when the caller gives up on it`, async () => {
    // An explicit URL gets no timeout of its own — a dev server on another host may legitimately be
    // slow, and cutting it off would report a running server as unreachable. So the deadline is the
    // caller's, and this is how the caller's deadline reaches the socket.
    let aborted = false;
    jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            aborted = true;
            reject(new Error('This operation was aborted'));
          });
        })
    );

    const giveUp = new AbortController();
    const discovery = discoverDevServerAsync('http://10.0.0.9:8081', { signal: giveUp.signal });
    await new Promise((resolve) => setImmediate(resolve));
    giveUp.abort();

    expect(await discovery).toMatchObject({ reachable: false, source: 'flag' });
    expect(aborted).toBe(true);
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

describe('discoverDevServerAsync — what it leaves behind', () => {
  // @ref llp/0004-smart-start-and-project-state.rfc.md §The discovery ladder
  // The cost of the scan was never the probes; it was the timers that outlived them. A probe that
  // answers in a millisecond used to leave its whole timeout budget pending, and a Node process
  // exits when the event loop empties — so a `status` whose report was complete at 263 ms exited at
  // 1584 ms [observed — friction/run7/tapapp, 2026-08-27]. These assert the count directly, because
  // the wall clock only shows it on a real process exit and nothing else in the result does.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it(`leaves no timer pending when every port refuses`, async () => {
    mockFetchByPort({});
    await discoverDevServerAsync(undefined, { timeoutMs: 1500 });
    expect(jest.getTimerCount()).toBe(0);
  });

  it(`leaves no timer pending when the default port answers`, async () => {
    mockFetchByPort({ '8081': [target] });
    await discoverDevServerAsync(undefined, { timeoutMs: 1500 });
    expect(jest.getTimerCount()).toBe(0);
  });

  it(`leaves no timer pending when a scanned port answers`, async () => {
    // The winner's timer is the easy one. The four ports that lost still had theirs running.
    mockFetchByPort({ '8084': [target] });
    await discoverDevServerAsync(undefined, { timeoutMs: 1500 });
    expect(jest.getTimerCount()).toBe(0);
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
