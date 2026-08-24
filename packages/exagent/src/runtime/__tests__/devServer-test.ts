import {
  DEFAULT_DEV_SERVER_URL,
  normalizeDevServerUrl,
  probeDevServerAsync,
  requireConnectedAppAsync,
} from '../devServer';

const TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  deviceName: 'iPhone 17',
  description: '',
  type: 'native',
  title: 'Expo Go',
  devtoolsFrontendUrl: '/devtools',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

let originalFetch: typeof fetch | undefined;

function mockFetch(implementation: (url: string) => Promise<unknown>) {
  globalThis.fetch = ((url: string) => implementation(url)) as unknown as typeof fetch;
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

describe(normalizeDevServerUrl, () => {
  it(`should keep a plain origin unchanged`, () => {
    expect(normalizeDevServerUrl('http://127.0.0.1:8081')).toBe('http://127.0.0.1:8081');
  });

  it(`should strip trailing slashes so the target list path stays well formed`, () => {
    expect(normalizeDevServerUrl('http://localhost:19000//')).toBe('http://localhost:19000');
  });

  it(`should default to the local dev server`, () => {
    expect(DEFAULT_DEV_SERVER_URL).toBe('http://127.0.0.1:8081');
  });
});

describe(probeDevServerAsync, () => {
  it(`should report the debugger targets of a running dev server`, async () => {
    const requested: string[] = [];
    mockFetch(async (url) => {
      requested.push(url);
      return { ok: true, json: async () => [TARGET] };
    });

    await expect(probeDevServerAsync('http://127.0.0.1:8081')).resolves.toEqual({
      reachable: true,
      targets: [TARGET],
    });
    expect(requested).toEqual(['http://127.0.0.1:8081/json/list']);
  });

  it(`should report an unreachable dev server instead of throwing`, async () => {
    mockFetch(async () => {
      throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
    });

    const probe = await probeDevServerAsync('http://127.0.0.1:8081');

    expect(probe.reachable).toBe(false);
    expect(probe.targets).toEqual([]);
    expect(probe.reason).toContain('fetch failed');
  });

  it(`should report a non-ok response as unreachable`, async () => {
    mockFetch(async () => ({ ok: false, status: 404, statusText: 'Not Found' }));

    const probe = await probeDevServerAsync('http://127.0.0.1:8081');

    expect(probe.reachable).toBe(false);
    expect(probe.reason).toContain('404');
  });

  it(`should report a payload that is not a target array as unreachable`, async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ nope: true }) }));

    const probe = await probeDevServerAsync('http://127.0.0.1:8081');

    expect(probe.reachable).toBe(false);
    expect(probe.reason).toMatch(/array/i);
  });
});

describe(requireConnectedAppAsync, () => {
  it(`should return the targets when an app is connected`, async () => {
    mockFetch(async () => ({ ok: true, json: async () => [TARGET] }));

    await expect(requireConnectedAppAsync('http://127.0.0.1:8081')).resolves.toEqual([TARGET]);
  });

  it(`should explain how to start a dev server when none answers`, async () => {
    mockFetch(async () => {
      throw new Error('fetch failed');
    });

    const error = await requireConnectedAppAsync('http://127.0.0.1:8081').catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(error.message).toContain('http://127.0.0.1:8081');
    expect(error.message).toContain('npx expo start');
    expect(error.message).toContain('--dev-server-url');
  });

  it(`should explain how to connect an app when the dev server has no targets`, async () => {
    mockFetch(async () => ({ ok: true, json: async () => [] }));

    const error = await requireConnectedAppAsync('http://127.0.0.1:8081').catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
    expect(error.message).toContain('no app is connected');
    expect(error.message).toContain('/json/list');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — friction run 4, F39.
  // An app that is reloading is briefly invisible, and the command that runs straight after a
  // reload is the one that reads the list during that window.
  it(`should wait out the reconnect window before reporting no app`, async () => {
    let reconnected = false;
    setTimeout(() => (reconnected = true), 60);
    mockFetch(async () => ({ ok: true, json: async () => (reconnected ? [TARGET] : []) }));

    await expect(
      requireConnectedAppAsync('http://127.0.0.1:8081', { retryMs: 2000 })
    ).resolves.toEqual([TARGET]);
  });

  it(`should say how long it kept asking when nothing ever attached`, async () => {
    mockFetch(async () => ({ ok: true, json: async () => [] }));

    const error = await requireConnectedAppAsync('http://127.0.0.1:8081', {
      retryMs: 300,
    }).catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
    expect(error.message).toContain('still empty 300ms later');
  });

  // Retrying an unreachable dev server buys nothing and costs the caller the whole grace period.
  it(`should not wait for a dev server that does not answer`, async () => {
    let reads = 0;
    mockFetch(async () => {
      reads++;
      throw new Error('fetch failed');
    });

    const error = await requireConnectedAppAsync('http://127.0.0.1:8081', {
      retryMs: 2000,
    }).catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(reads).toBe(1);
  });
});
