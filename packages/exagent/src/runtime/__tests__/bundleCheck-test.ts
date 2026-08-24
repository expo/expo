// @ref llp/0010-agent-conventions.rfc.md §The second: `dev:wait`
// The two requests the check makes, and the four answers it can come back with. The bodies below
// are recorded from a live SDK 57 dev server on 2026-08-23 — including the ANSI codes Metro's
// worker farm always emits, which is why stripping them is asserted rather than assumed.

import { checkEntryBundleAsync } from '../bundleCheck';

const devServerUrl = 'http://127.0.0.1:8123';

const BUNDLE_URL =
  'http://127.0.0.1:8123/node_modules/expo-router/entry.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes';

/** The manifest an Expo Go dev server answers `GET /` with, cut down to the key that is read. */
const MANIFEST = {
  id: 'aaaa-bbbb',
  createdAt: '2026-08-23T00:00:00.000Z',
  runtimeVersion: 'exposdk:57.0.0',
  launchAsset: { key: 'bundle', contentType: 'application/javascript', url: BUNDLE_URL },
  extra: { expoGo: { mainModuleName: 'node_modules/expo-router/entry' } },
};

/**
 * The 500 body Metro answers a broken build with, verbatim.
 *
 * The escapes in `message` are real: the transform workers are spawned with `FORCE_COLOR=1`, so a
 * code frame always arrives coloured.
 */
const TRANSFORM_ERROR = {
  type: 'TransformError',
  lineNumber: 101,
  column: 2,
  filename: 'src/app/index.tsx',
  name: 'SyntaxError',
  message:
    "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)\n\n[0m [90m 100 |[39m function broken( {\n[31m[1m>[22m[39m[90m 101 |[39m   [36mconst[39m x [33m=[39m\n[0m",
  errors: [{ description: 'Unexpected keyword', filename: 'src/app/index.tsx', lineNumber: 101 }],
};

type Answer = { status?: number; json?: unknown; text?: string };

/** Answer each request by URL and method, and record what was asked. */
function mockFetch(answers: { [key: string]: Answer }) {
  const calls: { url: string; method: string; headers: Record<string, string> }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    calls.push({
      url: String(url),
      method,
      headers: (init.headers ?? {}) as Record<string, string>,
    });
    const answer = answers[`${method} ${url}`] ?? answers[String(url)];
    if (answer == null) {
      throw new Error(`connect ECONNREFUSED ${url}`);
    }
    const status = answer.status ?? 200;
    const body = answer.text ?? JSON.stringify(answer.json ?? {});
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 500 ? 'Internal Server Error' : 'OK',
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  }) as unknown as typeof fetch;
  return calls;
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

describe(checkEntryBundleAsync, () => {
  it(`should build the entry bundle the dev server's own manifest names`, async () => {
    const calls = mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 200 },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result).toMatchObject({ outcome: 'ok', platform: 'ios', url: BUNDLE_URL, error: null });
    // The entry path is never spelled here: `node_modules/expo-router/entry` for a router app and
    // `index` for a plain one, and only the dev server knows which.
    expect(calls[0]!.url).toBe('http://127.0.0.1:8123/');
    expect(calls[0]!.headers).toMatchObject({
      'expo-platform': 'ios',
      accept: 'application/json',
    });
    // HEAD, so a bundle that compiles does not cost megabytes of JavaScript.
    expect(calls[1]).toMatchObject({ method: 'HEAD', url: BUNDLE_URL });
    expect(calls).toHaveLength(2);
  });

  it(`should ask for the platform it was given`, async () => {
    const calls = mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 200 },
    });

    await checkEntryBundleAsync(devServerUrl, { platform: 'android', timeoutMs: 5000 });

    expect(calls[0]!.headers['expo-platform']).toBe('android');
  });

  // The whole point of the check: the dev server is healthy and the project does not compile.
  it(`should report the file, line and message a transform error names`, async () => {
    mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 500 },
      [`GET ${BUNDLE_URL}`]: { status: 500, json: TRANSFORM_ERROR },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result.outcome).toBe('broken');
    expect(result.error).toMatchObject({
      type: 'TransformError',
      filename: 'src/app/index.tsx',
      lineNumber: 101,
      column: 2,
      message: "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)",
    });
    // An agent pastes this into a report; escape codes in it would be noise it cannot read.
    expect(result.error!.message).not.toContain('');
    expect(result.error!.snippet).not.toContain('');
    expect(result.error!.snippet).toContain('function broken( {');
  });

  it(`should only fetch the body once the status says something is wrong`, async () => {
    const calls = mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 500 },
      [`GET ${BUNDLE_URL}`]: { status: 500, json: TRANSFORM_ERROR },
    });

    await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(calls.map((call) => call.method)).toEqual(['GET', 'HEAD', 'GET']);
  });

  // Metro answers 404 for an entry that does not resolve, which is a different mistake from a file
  // that does not parse — and still means the project cannot be run.
  it(`should report an entry that does not resolve`, async () => {
    mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 404 },
      [`GET ${BUNDLE_URL}`]: {
        status: 404,
        json: { type: 'UnableToResolveError', message: 'Unable to resolve module ./missing' },
      },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result.outcome).toBe('broken');
    expect(result.error).toMatchObject({
      type: 'UnableToResolveError',
      message: 'Unable to resolve module ./missing',
      filename: null,
      lineNumber: null,
    });
  });

  it(`should quote an error body that is not the bundler's JSON`, async () => {
    mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 500 },
      [`GET ${BUNDLE_URL}`]: { status: 500, text: '<html><body>Proxy error</body></html>' },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result.outcome).toBe('broken');
    expect(result.error!.message).toContain('500');
    expect(result.error!.message).toContain('Proxy error');
  });

  // `unknown` is not `broken`: a dev server that answered nothing this module understands has not
  // shown the project to be broken, and a gate that went red on it would be worse than silence.
  describe('when the check cannot run', () => {
    it(`should answer unknown when the manifest does not answer`, async () => {
      mockFetch({ 'http://127.0.0.1:8123/': { status: 404 } });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
      });

      expect(result).toMatchObject({ outcome: 'unknown', url: null, error: null });
      expect(result.reason).toContain('404');
    });

    it(`should answer unknown when the manifest names no launch asset`, async () => {
      mockFetch({ 'http://127.0.0.1:8123/': { json: { id: 'x' } } });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('unknown');
      expect(result.reason).toContain('launchAsset.url');
    });

    it(`should answer unknown when the manifest is not JSON`, async () => {
      mockFetch({ 'http://127.0.0.1:8123/': { text: 'not json at all' } });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('unknown');
    });

    it(`should answer unknown when nothing is listening`, async () => {
      mockFetch({});

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('unknown');
      expect(result.reason).toContain('ECONNREFUSED');
    });
  });

  // A first build of a cold dev server compiles the whole app, so the budget has to be able to
  // expire — and expiring is "look again", not "the project is broken".
  it(`should answer timeout when the bundler does not finish in the budget`, async () => {
    globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
      if (String(url).endsWith('/')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => JSON.stringify(MANIFEST),
          json: async () => MANIFEST,
        };
      }
      // A build that never finishes, ended only by the caller's abort signal.
      return await new Promise((_resolve, rejectPromise) => {
        init.signal?.addEventListener('abort', () =>
          rejectPromise(
            Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })
          )
        );
      });
    }) as unknown as typeof fetch;

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 50 });

    expect(result.outcome).toBe('timeout');
    expect(result.reason).toContain('50ms');
  });

  // The dev server answers with a path-relative URL when the request carried a `Forwarded` header.
  it(`should resolve a relative launch asset against the dev server`, async () => {
    const calls = mockFetch({
      'http://127.0.0.1:8123/': {
        json: { launchAsset: { url: 'index.bundle?platform=ios&dev=true' } },
      },
      'HEAD http://127.0.0.1:8123/index.bundle?platform=ios&dev=true': { status: 200 },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result.outcome).toBe('ok');
    expect(result.url).toBe('http://127.0.0.1:8123/index.bundle?platform=ios&dev=true');
    expect(calls[1]!.url).toBe('http://127.0.0.1:8123/index.bundle?platform=ios&dev=true');
  });

  it(`should treat a not-modified answer as a bundle that compiles`, async () => {
    mockFetch({
      'http://127.0.0.1:8123/': { json: MANIFEST },
      [`HEAD ${BUNDLE_URL}`]: { status: 304 },
    });

    const result = await checkEntryBundleAsync(devServerUrl, { platform: 'ios', timeoutMs: 5000 });

    expect(result.outcome).toBe('ok');
  });
});
