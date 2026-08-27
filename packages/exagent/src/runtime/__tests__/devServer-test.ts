// What this module still owns: finding a dev server and asking it what is attached. Requiring
// either of them, and the refusal that names which is missing, moved to `./preflight-test.ts`.
import { DEFAULT_DEV_SERVER_URL, normalizeDevServerUrl, probeDevServerAsync } from '../devServer';

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
