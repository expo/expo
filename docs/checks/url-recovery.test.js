/** @jest-environment node */
import { jest } from '@jest/globals';

import { createWorker } from '../public/_worker.js';
import { createUrlRecovery } from '../worker/url-recovery.ts';

const NATIVE_TABS = '/versions/latest/sdk/router/native-tabs/';
const page = path => ({ path, title: path, description: 'Expo documentation' });
const pages = [page(NATIVE_TABS), page('/guides/permissions/'), page('/html-only/')];
let worker;
let env;
let run;
let now;

function freshWorker() {
  return createWorker({
    recoverNotFound: createUrlRecovery({ now: () => now }),
  });
}

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
  run.mockImplementation(async (_model, { questions }) => {
    return {
      state: 'Completed',
      result: {
        answers: Object.fromEntries(
          Object.entries(questions).map(([id, question]) => [
            id,
            answer(question, choose(question, id), confidence),
          ])
        ),
      },
    };
  });
}

function request(path, options) {
  return worker.fetch(new Request(`https://docs.expo.dev${path}`, options), env);
}

function useInventory(inventory) {
  const assets = env.ASSETS.fetch.getMockImplementation();
  env.ASSETS.fetch.mockImplementation(input =>
    new URL(input.url ?? input.toString()).pathname === '/_url-recovery.json'
      ? Promise.resolve(Response.json(inventory))
      : assets(input)
  );
}

beforeEach(() => {
  now = 0;
  run = jest.fn();
  worker = freshWorker();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  respond();
  env = {
    AI: { run },
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
  'redirects %s to an existing Jev choice through the AI binding',
  async path => {
    const response = await request(path);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`https://docs.expo.dev${NATIVE_TABS}`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('vary')).toBe('Accept');
    expect(run).toHaveBeenCalledTimes(1);
    const [model, input, options] = run.mock.calls[0];
    expect(model).toBe('typesafe/jev');
    expect(options.gateway).toEqual({ id: 'default' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(input.state).toEqual({ path: `${path.replace(/\/$/, '')}/` });
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

test.each([
  [NATIVE_TABS, { headers: { Accept: 'text/markdown' } }, 200],
  [`${NATIVE_TABS}index.md`, {}, 200],
  [`${NATIVE_TABS}index.md`, { headers: { Range: 'bytes=0-4' } }, 206],
])('preserves asset response metadata for %s (%j, HTTP %i)', async (path, options, status) => {
  const headers = {
    'Content-Type': 'text/markdown',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    ETag: '"markdown"',
    Link: '</llms.txt>; rel="llms-txt"',
    'X-Llms-Txt': '/llms.txt',
    Vary: 'Accept-Encoding',
    ...(status === 206 ? { 'Content-Range': 'bytes 0-4/100' } : {}),
  };
  env.ASSETS.fetch.mockImplementation(async () => new Response('# Doc', { status, headers }));

  const response = await request(path, options);
  expect(response.status).toBe(status);
  expect(await response.text()).toBe('# Doc');
  expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
  expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept');
  for (const [name, value] of Object.entries(headers)) {
    if (name !== 'Content-Type' && name !== 'Vary') {
      expect(response.headers.get(name)).toBe(value);
    }
  }
  expect(run).not.toHaveBeenCalled();
});

test('does not send queries, cookies, or authorization to Jev and reuses path decisions', async () => {
  const response = await request('/router/basics/tabs?token=private', {
    headers: { Cookie: 'session=secret', Authorization: 'Bearer user-secret' },
  });
  expect(response.headers.get('location')).toBe(
    `https://docs.expo.dev${NATIVE_TABS}?token=private`
  );
  await request('/router/basics/tabs/?other=value');
  expect(run).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(run.mock.calls)).not.toMatch(/private|secret|other=value/);
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
  expect(run).not.toHaveBeenCalled();
});

test('works without an AI binding and keeps markdown discovery links', async () => {
  delete env.AI;
  const response = await request('/missing/', { headers: { Accept: 'text/markdown' } });
  expect(response.status).toBe(404);
  expect(await response.text()).toContain('https://docs.expo.dev/llms.txt');
  expect(run).not.toHaveBeenCalled();
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

test.each([429, 500])(
  'keeps the original 404 on AI Gateway error %s and backs off',
  async status => {
    run.mockRejectedValue(new Error(`AI Gateway returned ${status}`));
    expect((await request('/missing/')).status).toBe(404);
    expect((await request('/different/')).status).toBe(404);
    expect(run).toHaveBeenCalledTimes(1);
  }
);

test('accepts the documented provider output without a gateway wrapper', async () => {
  const choose = run.getMockImplementation();
  run.mockImplementation(async (...args) => (await choose(...args)).result);
  expect((await request('/router/basics/tabs/')).status).toBe(302);
});

test.each([
  null,
  'invalid',
  {},
  { answers: {} },
  { state: 'Completed' },
  { state: 'Completed', result: null },
  { state: 'Completed', result: { answers: {} } },
])('keeps the 404 for malformed AI output %j', async body => {
  run.mockResolvedValue(body);
  expect((await request('/missing/')).status).toBe(404);
});

test.each(['Queued', 'Failed'])('rejects an inference in state %s and backs off', async state => {
  const choose = run.getMockImplementation();
  run.mockImplementation(async (...args) => ({ ...(await choose(...args)), state }));
  expect((await request('/missing/')).status).toBe(404);
  expect((await request('/different/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(1);
});

test('aborts a slow API call and keeps the original 404', async () => {
  const controller = new AbortController();
  const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  run.mockImplementation(async (_model, _input, { signal }) => {
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
  expect(run).toHaveBeenCalledTimes(1);
});

test('bounds concurrent lookups while allowing requests to join existing ones', async () => {
  const started = Promise.withResolvers();
  const release = Promise.withResolvers();
  const choose = run.getMockImplementation();
  run.mockImplementation(async (...args) => {
    if (run.mock.calls.length === 4) {
      started.resolve();
    }
    await release.promise;
    return choose(...args);
  });
  const pending = Array.from({ length: 4 }, (_, i) => request(`/missing-${i}/`));
  await started.promise;
  const joined = request('/missing-0/');
  expect((await request('/excess/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(4);
  release.resolve();
  expect((await Promise.all([...pending, joined])).map(response => response.status)).toEqual([
    302, 302, 302, 302, 302,
  ]);
  expect((await request('/after-completion/')).status).toBe(302);
});

test('does not share cached decisions between worker instances', async () => {
  expect((await request('/missing/')).status).toBe(302);
  worker = freshWorker();
  respond(() => 'none_of_the_above');
  expect((await request('/missing/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(2);
});

test.each([
  [NATIVE_TABS, 3600000, 302],
  ['none_of_the_above', 60000, 404],
])('expires a cached %s decision after %s ms', async (choice, duration, status) => {
  respond(() => choice);
  expect((await request('/missing/')).status).toBe(status);
  now = duration - 1;
  expect((await request('/missing/')).status).toBe(status);
  expect(run).toHaveBeenCalledTimes(1);
  now = duration;
  expect((await request('/missing/')).status).toBe(status);
  expect(run).toHaveBeenCalledTimes(2);
});

test('resumes recovery after the API failure cooldown', async () => {
  run.mockRejectedValue(new Error('AI Gateway unavailable'));
  expect((await request('/missing/')).status).toBe(404);
  respond();
  now = 29999;
  expect((await request('/missing/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(1);
  now = 30000;
  expect((await request('/missing/')).status).toBe(302);
  expect(run).toHaveBeenCalledTimes(2);
});

test.each([254, 255])(
  'uses all %s matching pages across the Choice batch boundary',
  async count => {
    const inventory = [
      page('/guides/permissions/'),
      page('/html-only/'),
      ...Array.from({ length: count - pages.length }, (_, i) => page(`/guides/page-${i}/`)),
      page(NATIVE_TABS),
      page('/versions/v57.0.0/sdk/router/native-tabs/'),
      page('/ja/guides/example/'),
    ];
    useInventory(inventory);
    respond(question => (NATIVE_TABS in question.criteria ? NATIVE_TABS : '/guides/page-0/'));
    expect((await request('/router/layouts/tabs/')).status).toBe(302);
    expect(run).toHaveBeenCalledTimes(count === 254 ? 1 : 2);
    const { questions } = run.mock.calls[0][1];
    const criteria = Object.values(questions).flatMap(question => Object.keys(question.criteria));
    expect(criteria.filter(option => option !== 'none_of_the_above')).toHaveLength(count);
    expect(criteria).not.toContain('/versions/v57.0.0/sdk/router/native-tabs/');
    expect(criteria).not.toContain('/ja/guides/example/');
    for (const question of Object.values(questions)) {
      expect(Object.keys(question.criteria).length).toBeLessThanOrEqual(255);
    }
  }
);

test.each([
  [NATIVE_TABS, 0.9, 302],
  [NATIVE_TABS, 0.49, 404],
  ['none_of_the_above', 0.9, 404],
])(
  'lets a batch runner-up compete, accepting final choice %s at confidence %s',
  async (choice, confidence, status) => {
    useInventory([
      page(NATIVE_TABS),
      ...Array.from({ length: 254 }, (_, i) => page(`/guides/page-${i}/`)),
    ]);
    run.mockImplementation(async (_model, { questions }) => {
      return {
        answers: Object.fromEntries(
          Object.entries(questions).map(([id, question]) => {
            if (id === 'destination') {
              expect(Object.keys(question.criteria).sort()).toEqual(
                ['/guides/page-0/', NATIVE_TABS, 'none_of_the_above'].sort()
              );
              return [id, answer(question, choice, confidence)];
            }
            if (NATIVE_TABS in question.criteria) {
              const result = answer(question, '/guides/page-0/');
              result.probabilities['/guides/page-0/'] = 0.55;
              result.probabilities[NATIVE_TABS] = 0.4;
              result.probabilities.none_of_the_above = 0.05;
              return [id, result];
            }
            return [id, answer(question, 'none_of_the_above')];
          })
        ),
      };
    });

    const response = await request('/router/layouts/tabs/');
    expect(response.status).toBe(status);
    expect(run).toHaveBeenCalledTimes(2);
  }
);

test('keeps the 404 without a final round when every batch rejects the path', async () => {
  useInventory(Array.from({ length: 255 }, (_, i) => page(`/guides/page-${i}/`)));
  respond(() => 'none_of_the_above');
  expect((await request('/pizza-recipes/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(1);
});

test('keeps the 404 and backs off when the final selection fails', async () => {
  useInventory([
    ...Array.from({ length: 254 }, (_, i) => page(`/guides/page-${i}/`)),
    page(NATIVE_TABS),
  ]);
  respond(question => (NATIVE_TABS in question.criteria ? NATIVE_TABS : '/guides/page-0/'));
  const choose = run.getMockImplementation();
  run.mockImplementation((model, input, options) =>
    input.questions.destination
      ? Promise.reject(new Error('AI Gateway unavailable'))
      : choose(model, input, options)
  );
  expect((await request('/router/layouts/tabs/')).status).toBe(404);
  expect((await request('/different/')).status).toBe(404);
  expect(run).toHaveBeenCalledTimes(2);
});

test('keeps language and SDK candidates separate across lookups in one worker', async () => {
  const guide = '/guides/permissions/';
  const pinned = '/versions/v57.0.0/sdk/router/native-tabs/';
  const japanese = `/ja${NATIVE_TABS}`;
  const japaneseGuide = '/ja/guides/permissions/';
  const inventory = [NATIVE_TABS, guide, pinned, japanese, japaneseGuide].map(page);
  const cases = [
    ['/router/layouts/tabs/', NATIVE_TABS, [NATIVE_TABS, guide]],
    ['/versions/v57.0.0/sdk/tabs/', pinned, [guide, pinned]],
    ['/ja/router/layouts/tabs/', japanese, [japanese, japaneseGuide]],
    ['/versions/v999.0.0/sdk/permissions/', guide, [guide]],
    ['/versions/v998.0.0/sdk/permissions/', guide, [guide]],
    ['/ja/versions/v999.0.0/sdk/permissions/', japaneseGuide, [japaneseGuide]],
    ['/router/basics/tabs/', NATIVE_TABS, [NATIVE_TABS, guide]],
  ];
  env.ASSETS.fetch.mockImplementation(async input => {
    const path = new URL(input.url ?? input.toString()).pathname;
    if (path === '/_url-recovery.json') {
      return Response.json(inventory);
    }
    return inventory.some(page => page.path === path)
      ? new Response('', { headers: { 'Content-Type': 'text/html' } })
      : new Response('', { status: 404 });
  });
  for (const [path, destination, candidates] of cases) {
    respond(question => {
      expect(
        Object.keys(question.criteria).filter(option => option !== 'none_of_the_above')
      ).toEqual(candidates);
      return destination;
    });
    expect((await request(path)).headers.get('Location')).toBe(
      `https://docs.expo.dev${destination}`
    );
  }
  const indexRequests = env.ASSETS.fetch.mock.calls.filter(
    ([input]) => new URL(input.url ?? input.toString()).pathname === '/_url-recovery.json'
  );
  expect(indexRequests).toHaveLength(1);
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
  expect(JSON.stringify(run.mock.calls[0][1])).not.toContain(NATIVE_TABS);
});
