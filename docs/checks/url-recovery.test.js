/** @jest-environment node */
import { jest } from '@jest/globals';

const NATIVE_TABS = '/versions/latest/sdk/router/native-tabs/';
const page = path => ({ path, title: path, description: 'Expo documentation' });
const pages = [page(NATIVE_TABS), page('/guides/permissions/'), page('/html-only/')];
let worker;
let env;
let jev;

function answer(question, choice = NATIVE_TABS, confidence = 0.9) {
  return {
    type: 'choice',
    choice,
    confidence,
    probabilities: Object.fromEntries(
      Object.keys(question.criteria).map(option => [option, option === choice ? 1 : 0])
    ),
  };
}

function respond(choose = () => NATIVE_TABS, confidence = 0.9) {
  jev.mockImplementation(async (_url, options) => {
    const { questions } = JSON.parse(options.body);
    return Response.json({
      answers: Object.fromEntries(
        Object.entries(questions).map(([id, question]) => [
          id,
          answer(question, choose(question, id), confidence),
        ])
      ),
    });
  });
}

function request(path, options) {
  return worker.fetch(new Request(`https://docs.expo.dev${path}`, options), env);
}

beforeEach(async () => {
  jest.resetModules();
  worker = (await import('../public/_worker.js')).default;
  jev = jest.spyOn(globalThis, 'fetch');
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  respond();
  env = {
    TYPESAFE_API_KEY: 'test-key',
    ASSETS: {
      fetch: jest.fn(async input => {
        const url = new URL(input.url ?? input.toString());
        if (url.pathname === '/_url-recovery.json') {
          return Response.json(pages);
        }
        if (url.pathname === '/moved/') {
          return new Response(null, { status: 301 });
        }
        if (url.pathname === '/error/') {
          return new Response(null, { status: 500 });
        }
        if (url.pathname === NATIVE_TABS || url.pathname === '/html-only/') {
          return new Response('<h1>Documentation</h1>', {
            headers: { 'Content-Type': 'text/html' },
          });
        }
        if (url.pathname === `${NATIVE_TABS}index.md`) {
          return new Response('# Native tabs', {
            headers: { 'Content-Type': 'text/markdown' },
          });
        }
        return new Response('Not found', { status: 404 });
      }),
    },
  };
});

afterEach(() => jest.restoreAllMocks());

test.each(['/router/basics/tabs/', '/router/layouts/tabs'])(
  'redirects %s to an existing Jev choice with server-side authentication',
  async path => {
    const response = await request(path);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`https://docs.expo.dev${NATIVE_TABS}`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('vary')).toBe('Accept');
    expect(jev).toHaveBeenCalledTimes(1);
    const [url, options] = jev.mock.calls[0];
    expect(url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(options.headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(options.body).state).toEqual({ path: `${path.replace(/\/$/, '')}/` });
  }
);

test.each([
  ['/router/basics/tabs/', { headers: { Accept: 'text/markdown' } }, NATIVE_TABS],
  ['/router/basics/tabs.md', {}, `${NATIVE_TABS}index.md`],
  ['/router/basics/tabs/index.md', {}, `${NATIVE_TABS}index.md`],
  ['/router/basics/tabs/', { method: 'HEAD' }, NATIVE_TABS],
])('preserves markdown and HEAD behavior for %s', async (path, options, destination) => {
  const response = await request(path, options);
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(`https://docs.expo.dev${destination}`);
  expect(await response.text()).toBe('');
  const target = await request(destination, options);
  expect(target.status).toBe(200);
});

test('does not send queries, cookies, or authorization to Jev and reuses path decisions', async () => {
  const response = await request('/router/basics/tabs?token=private', {
    headers: { Cookie: 'session=secret', Authorization: 'Bearer user-secret' },
  });
  expect(response.headers.get('location')).toBe(
    `https://docs.expo.dev${NATIVE_TABS}?token=private`
  );
  await request('/router/basics/tabs/?other=value');
  expect(jev).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(jev.mock.calls)).not.toMatch(/private|secret|other=value/);
});

test.each([
  [NATIVE_TABS, {}, 200],
  ['/moved/', {}, 301],
  ['/error/', {}, 500],
  ['/router/basics/tabs/', { method: 'POST' }, 404],
  ['/static/missing.png', {}, 404],
  ['/api/missing/', {}, 404],
  ['/internal/missing/', {}, 404],
  [`/${'a'.repeat(513)}/`, {}, 404],
  ['/html-only/', { headers: { Accept: 'text/markdown' } }, 404],
])('does not invoke Jev for %s', async (path, options, status) => {
  expect((await request(path, options)).status).toBe(status);
  expect(jev).not.toHaveBeenCalled();
});

test('works without a key and keeps markdown discovery links', async () => {
  delete env.TYPESAFE_API_KEY;
  const response = await request('/missing/', { headers: { Accept: 'text/markdown' } });
  expect(response.status).toBe(404);
  expect(await response.text()).toContain('https://docs.expo.dev/llms.txt');
  expect(jev).not.toHaveBeenCalled();
});

test.each([
  ['none_of_the_above', 0.9],
  [NATIVE_TABS, 0.49],
  ['https://example.com/', 1],
  ['/invented/', 1],
  [NATIVE_TABS, 2],
  [NATIVE_TABS, null],
])('keeps the 404 for choice %s at confidence %s', async (choice, confidence) => {
  respond(() => choice, confidence);
  expect((await request('/missing/')).status).toBe(404);
});

test.each([404, 301])('does not redirect to a destination returning %s', async status => {
  respond(() => '/guides/permissions/');
  const assets = env.ASSETS.fetch.getMockImplementation();
  env.ASSETS.fetch.mockImplementation(input =>
    new URL(input.url ?? input.toString()).pathname === '/guides/permissions/'
      ? Promise.resolve(new Response(null, { status }))
      : assets(input)
  );
  expect((await request('/missing/')).status).toBe(404);
});

test.each([429, 500])('keeps the original 404 on API HTTP %s and backs off', async status => {
  jev.mockResolvedValue(new Response(null, { status }));
  expect((await request('/missing/')).status).toBe(404);
  expect((await request('/different/')).status).toBe(404);
  expect(jev).toHaveBeenCalledTimes(1);
});

test('keeps the 404 for invalid JSON', async () => {
  jev.mockResolvedValue(new Response('invalid'));
  expect((await request('/missing/')).status).toBe(404);
});

test('aborts a slow API call and keeps the original 404', async () => {
  const controller = new AbortController();
  const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  jev.mockImplementation(async (_url, { signal }) => {
    const response = new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(signal.reason);
      });
    });
    controller.abort(new DOMException('Timed out', 'TimeoutError'));
    return response;
  });
  expect((await request('/missing/')).status).toBe(404);
  expect(timeout).toHaveBeenCalledWith(3000);
});

test('shares concurrent lookups for the same path', async () => {
  const responses = await Promise.all([request('/missing/'), request('/missing')]);
  expect(responses.map(response => response.status)).toEqual([302, 302]);
  expect(jev).toHaveBeenCalledTimes(1);
});

test('uses every matching version page across batches within the Choice limit', async () => {
  const inventory = [
    ...Array.from({ length: 260 }, (_, i) => page(`/guides/page-${i}/`)),
    ...pages,
    page('/versions/v57.0.0/sdk/router/native-tabs/'),
    page('/ja/guides/example/'),
  ];
  const assets = env.ASSETS.fetch.getMockImplementation();
  env.ASSETS.fetch.mockImplementation(input =>
    new URL(input.url ?? input.toString()).pathname === '/_url-recovery.json'
      ? Promise.resolve(Response.json(inventory))
      : assets(input)
  );
  respond(question => (NATIVE_TABS in question.criteria ? NATIVE_TABS : '/guides/page-0/'));
  expect((await request('/router/layouts/tabs/')).status).toBe(302);
  expect(jev).toHaveBeenCalledTimes(2);
  const { questions } = JSON.parse(jev.mock.calls[0][1].body);
  const criteria = Object.values(questions).flatMap(question => Object.keys(question.criteria));
  expect(criteria.filter(option => option !== 'none_of_the_above')).toHaveLength(263);
  expect(criteria).not.toContain('/versions/v57.0.0/sdk/router/native-tabs/');
  expect(criteria).not.toContain('/ja/guides/example/');
  for (const question of Object.values(questions)) {
    expect(Object.keys(question.criteria).length).toBeLessThanOrEqual(255);
  }
});

test('preserves explicitly requested SDK versions', async () => {
  const pinned = '/versions/v57.0.0/sdk/router/native-tabs/';
  const assets = env.ASSETS.fetch.getMockImplementation();
  env.ASSETS.fetch.mockImplementation(input => {
    const path = new URL(input.url ?? input.toString()).pathname;
    if (path === '/_url-recovery.json') {
      return Promise.resolve(Response.json([...pages, page(pinned)]));
    }
    if (path === pinned) {
      return Promise.resolve(new Response('', { headers: { 'Content-Type': 'text/html' } }));
    }
    return assets(input);
  });
  respond(() => pinned);
  const response = await request('/versions/v57.0.0/sdk/tabs/');
  expect(response.headers.get('location')).toBe(`https://docs.expo.dev${pinned}`);
  expect(jev.mock.calls[0][1].body).not.toContain(NATIVE_TABS);
});
