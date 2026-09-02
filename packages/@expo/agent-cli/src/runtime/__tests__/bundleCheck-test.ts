// @ref llp/0010-agent-conventions.rfc.md §Other gates, in brief
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

type Answer = { status?: number; json?: unknown; text?: string; contentType?: string };

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
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-type'
            ? (answer.contentType ??
              (answer.text ? 'text/html; charset=utf-8' : 'application/json'))
            : null,
      },
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

  // @ref llp/0010-agent-conventions.rfc.md §Other gates, in brief
  // The web dev server has no manifest: `GET /` is the page a browser loads, and the entry bundle
  // is the `<script src>` appended to it. Asking that page for JSON is what left `--platform web`
  // reporting `checked: true, ok: null` with a parse error for a reason [observed — friction run 2].
  describe('the web target', () => {
    /** The tail of the page a live SDK 57 web dev server serves, recorded on 2026-08-23. */
    const WEB_PAGE = `<!DOCTYPE html><html lang="en"><head><title></title></head><body><div id="root"></div><script src="/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=src%2Fapp" defer></script></body></html>`;
    const WEB_BUNDLE_URL =
      'http://127.0.0.1:8123/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=src%2Fapp';

    it(`should build the bundle the page names, and pass when it compiles`, async () => {
      const calls = mockFetch({
        'http://127.0.0.1:8123/': { text: WEB_PAGE },
        [`HEAD ${WEB_BUNDLE_URL}`]: { status: 200 },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result).toMatchObject({ outcome: 'ok', platform: 'web', url: WEB_BUNDLE_URL });
      // The page is asked for as a page, and the bundle is fetched with HEAD, exactly as native is.
      expect(calls[0]!.headers.accept).toBe('text/html');
      expect(calls[1]).toMatchObject({ method: 'HEAD', url: WEB_BUNDLE_URL });
    });

    it(`should report the same TransformError a native check reports`, async () => {
      mockFetch({
        'http://127.0.0.1:8123/': { text: WEB_PAGE },
        [`HEAD ${WEB_BUNDLE_URL}`]: { status: 500 },
        [`GET ${WEB_BUNDLE_URL}`]: { status: 500, json: TRANSFORM_ERROR },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('broken');
      expect(result.error).toMatchObject({
        type: 'TransformError',
        filename: 'src/app/index.tsx',
        lineNumber: 101,
      });
    });

    it(`should resolve a bundle whose query separators were escaped`, async () => {
      const escaped = WEB_PAGE.replace(/&/g, '&amp;');
      mockFetch({
        'http://127.0.0.1:8123/': { text: escaped },
        [`HEAD ${WEB_BUNDLE_URL}`]: { status: 200 },
      });

      expect(
        await checkEntryBundleAsync(devServerUrl, { platform: 'web', timeoutMs: 5000 })
      ).toMatchObject({ outcome: 'ok', url: WEB_BUNDLE_URL });
    });

    // The web dev server renders on the server, so a project that does not compile never produces
    // a page with a script tag in it. It produces this, with the whole failure inside.
    it(`should read the failure off the error page the dev server renders instead`, async () => {
      // Recorded live on 2026-08-23, cut to the fields that are read. `<` arrives escaped, as the
      // CLI writes it, so that the payload cannot close its own tag.
      const staticError = JSON.stringify({
        selectedLogIndex: 0,
        logs: [
          {
            level: 'static',
            message: {
              content:
                "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)\n\n   99 |\n  100 | function broken( {\n> 101 |   const x =\n      |   ^",
            },
            stack: [{ file: '/project/src/app/index.tsx', lineNumber: 101, column: 2 }],
            codeFrame: {
              content: '[0m 101 | const x =[0m',
              location: { row: 101, column: 2 },
              fileName: '/project/src/app/index.tsx',
            },
          },
        ],
      }).replace(/</g, '\\u003c');
      mockFetch({
        'http://127.0.0.1:8123/': {
          status: 500,
          text: `<html><body><div id="root"></div><script id="_expo-static-error" type="application/json">${staticError}</script></body></html>`,
        },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('broken');
      expect(result.error).toMatchObject({
        filename: '/project/src/app/index.tsx',
        lineNumber: 101,
        column: 2,
        message: "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)",
      });
      expect(result.error!.snippet).toContain('> 101 |');
    });

    it(`should stay undecided when a 500 is not an Expo error page`, async () => {
      mockFetch({ 'http://127.0.0.1:8123/': { status: 500, text: '<html>proxy error</html>' } });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('unknown');
      expect(result.reason).toContain('not an Expo error page');
    });

    it(`should say what it could not find when the page names no bundle`, async () => {
      mockFetch({
        'http://127.0.0.1:8123/': {
          text: '<html><body><script src="/vendor.js"></script></body></html>',
        },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result.outcome).toBe('unknown');
      expect(result.reason).toContain('names no .bundle script');
    });
  });

  // F37: the same file, the same syntax error, the same command — and two shapes. Web reported
  // `type: null` where iOS reported `TransformError`, and an absolute path where iOS reported a
  // project-relative one, so a consumer that parsed one did not parse the other.
  describe('the two platforms report one shape', () => {
    /** The error page a live web dev server renders for a project that does not compile. */
    function webErrorPage(): string {
      const staticError = JSON.stringify({
        selectedLogIndex: 0,
        logs: [
          {
            level: 'static',
            // `LogBoxLog` fills this in for a record that named no type, so it must not be read
            // as one — it is the absence of an answer wearing the shape of one.
            type: 'error',
            message: {
              content:
                "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)\n\n> 101 |   const x =",
            },
            stack: [{ file: '/project/src/app/index.tsx', lineNumber: 101, column: 2 }],
            codeFrame: {
              content: ' 101 | const x =',
              location: { row: 101, column: 2 },
              fileName: '/project/src/app/index.tsx',
            },
          },
        ],
      }).replace(/</g, '\\u003c');
      return `<html><body><script id="_expo-static-error" type="application/json">${staticError}</script></body></html>`;
    }

    it(`should report a transform error the same way on ios and on web`, async () => {
      mockFetch({
        'http://127.0.0.1:8123/': { json: MANIFEST },
        [`HEAD ${BUNDLE_URL}`]: { status: 500 },
        [`GET ${BUNDLE_URL}`]: { status: 500, json: TRANSFORM_ERROR },
      });
      const ios = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
        projectRoot: '/project',
      });

      mockFetch({ 'http://127.0.0.1:8123/': { status: 500, text: webErrorPage() } });
      const web = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
        projectRoot: '/project',
      });

      for (const result of [ios, web]) {
        expect(result.outcome).toBe('broken');
        expect(result.error).toMatchObject({
          type: 'TransformError',
          filename: 'src/app/index.tsx',
          lineNumber: 101,
          column: 2,
        });
      }
    });

    // The one class the page's own record does name, through the branch it was built from.
    it(`should call a web resolution failure what Metro calls it`, async () => {
      const staticError = JSON.stringify({
        logs: [
          {
            level: 'resolution',
            type: 'error',
            message: { content: 'Unable to resolve module ./missing' },
            codeFrame: { fileName: '/project/src/app/index.tsx', location: null, content: '' },
          },
        ],
      }).replace(/</g, '\\u003c');
      mockFetch({
        'http://127.0.0.1:8123/': {
          status: 500,
          text: `<html><body><script id="_expo-static-error" type="application/json">${staticError}</script></body></html>`,
        },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
        projectRoot: '/project',
      });

      expect(result.error).toMatchObject({
        type: 'UnableToResolveError',
        filename: 'src/app/index.tsx',
      });
    });

    it(`should leave a file outside the project absolute`, async () => {
      mockFetch({
        'http://127.0.0.1:8123/': { json: MANIFEST },
        [`HEAD ${BUNDLE_URL}`]: { status: 500 },
        [`GET ${BUNDLE_URL}`]: {
          status: 500,
          json: { ...TRANSFORM_ERROR, filename: '/elsewhere/node_modules/broken/index.js' },
        },
      });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'ios',
        timeoutMs: 5000,
        projectRoot: '/project',
      });

      expect(result.error!.filename).toBe('/elsewhere/node_modules/broken/index.js');
    });

    it(`should leave the path alone when no project root was given`, async () => {
      mockFetch({ 'http://127.0.0.1:8123/': { status: 500, text: webErrorPage() } });

      const result = await checkEntryBundleAsync(devServerUrl, {
        platform: 'web',
        timeoutMs: 5000,
      });

      expect(result.error!.filename).toBe('/project/src/app/index.tsx');
    });
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
      // A diagnosis, not the exception: `Unexpected token '<' … is not valid JSON` says nothing a
      // reader can act on, and it is what this reason used to be [observed — friction run 2].
      expect(result.reason).toContain('text/html');
      expect(result.reason).not.toContain('JSON.parse');
      expect(result.reason).not.toContain('Unexpected token');
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
