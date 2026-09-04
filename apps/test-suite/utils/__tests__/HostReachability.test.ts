import {
  gateOnHostAsync,
  isHostReachableAsync,
  resetHostReachabilityCache,
  type HostGateJasmine,
} from '../HostReachability';

const PROBE_URL = 'https://httpbin.io/get';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;

function mockFetch(
  implementation: (url: string, init?: RequestInit) => Promise<Partial<Response>>
) {
  const mock = jest.fn(implementation) as FetchMock;
  (globalThis as any).fetch = mock;
  return mock;
}

function okResponse(): Promise<Partial<Response>> {
  return Promise.resolve({ ok: true, status: 200 });
}

function failedResponse(status: number): Promise<Partial<Response>> {
  return Promise.resolve({ ok: false, status });
}

function neverResolvesUntilAborted(_url: string, init?: RequestInit): Promise<Partial<Response>> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });
}

function createJasmineMock() {
  return {
    describe: jest.fn(),
    it: jest.fn(),
    pending: jest.fn(),
  } as unknown as HostGateJasmine & {
    describe: jest.Mock;
    it: jest.Mock;
    pending: jest.Mock;
  };
}

describe('isHostReachableAsync', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetHostReachabilityCache();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    delete (globalThis as any).fetch;
  });

  it('is reachable when the probe responds with 2xx', async () => {
    mockFetch(okResponse);
    expect(await isHostReachableAsync(PROBE_URL)).toBe(true);
  });

  it('is unreachable when the probe responds with a server error', async () => {
    mockFetch(() => failedResponse(503));
    expect(await isHostReachableAsync(PROBE_URL, { attempts: 1 })).toBe(false);
  });

  it('is unreachable when fetch rejects on every attempt', async () => {
    const fetch = mockFetch(() => Promise.reject(new Error('Network request failed')));
    expect(await isHostReachableAsync(PROBE_URL, { attempts: 2 })).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('is unreachable when the probe does not answer within the timeout', async () => {
    mockFetch(neverResolvesUntilAborted);
    expect(await isHostReachableAsync(PROBE_URL, { timeoutMs: 10, attempts: 1 })).toBe(false);
  });

  it('retries and succeeds when a later attempt responds', async () => {
    let calls = 0;
    const fetch = mockFetch(() => {
      calls++;
      return calls === 1 ? Promise.reject(new Error('reset by peer')) : okResponse();
    });
    expect(await isHostReachableAsync(PROBE_URL, { attempts: 2 })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('probes each URL once and caches the result', async () => {
    const fetch = mockFetch(okResponse);
    await isHostReachableAsync(PROBE_URL);
    await isHostReachableAsync(PROBE_URL);
    await isHostReachableAsync('https://httpbingo.org/get');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('warns once per unreachable host', async () => {
    mockFetch(() => failedResponse(503));
    await isHostReachableAsync(PROBE_URL, { attempts: 1 });
    await isHostReachableAsync(PROBE_URL, { attempts: 1 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('httpbin.io');
  });

  it('does not warn when the host is reachable', async () => {
    mockFetch(okResponse);
    await isHostReachableAsync(PROBE_URL);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('gateOnHostAsync', () => {
  beforeEach(() => {
    resetHostReachabilityCache();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as any).fetch;
  });

  it('passes describe and it through when the host is reachable', async () => {
    mockFetch(okResponse);
    const t = createJasmineMock();
    const gate = await gateOnHostAsync(t, PROBE_URL);
    expect(gate.reachable).toBe(true);
    expect(gate.describe).toBe(t.describe);
    expect(gate.it).toBe(t.it);
  });

  it('replaces a gated describe with one pending spec when the host is unreachable', async () => {
    mockFetch(() => failedResponse(503));
    const t = createJasmineMock();
    const gate = await gateOnHostAsync(t, PROBE_URL, { attempts: 1 });
    expect(gate.reachable).toBe(false);
    const body = jest.fn();
    gate.describe('NetworkRequestObserver', body);
    expect(body).not.toHaveBeenCalled();
    expect(t.describe).toHaveBeenCalledTimes(1);
    expect(t.describe.mock.calls[0][0]).toBe('NetworkRequestObserver');
    // Run the registered describe body: it must register exactly one pending spec.
    t.describe.mock.calls[0][1]();
    expect(t.it).toHaveBeenCalledTimes(1);
    const [specName, specFn] = t.it.mock.calls[0];
    expect(specName).toMatch(/skipped/);
    expect(specName).toContain('httpbin.io');
    specFn();
    expect(t.pending).toHaveBeenCalledTimes(1);
    expect(t.pending.mock.calls[0][0]).toContain('httpbin.io');
  });

  it('replaces a gated it with a pending spec of the same name when the host is unreachable', async () => {
    mockFetch(() => failedResponse(503));
    const t = createJasmineMock();
    const gate = await gateOnHostAsync(t, PROBE_URL, { attempts: 1 });
    const body = jest.fn();
    gate.it('downloads a file', body, 30000);
    expect(body).not.toHaveBeenCalled();
    expect(t.it).toHaveBeenCalledTimes(1);
    const [specName, specFn] = t.it.mock.calls[0];
    expect(specName).toBe('downloads a file');
    specFn();
    expect(t.pending).toHaveBeenCalledTimes(1);
    expect(t.pending.mock.calls[0][0]).toContain('httpbin.io');
  });
});
