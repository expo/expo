import { parse } from 'node-html-parser';
import { runInNewContext } from 'node:vm';
import { Suspense, use, type ReactNode } from 'react';

import { getStreamingContent } from '../renderStreamingContent';

const mockRenderContent = jest.fn<ReactNode, []>();

// Metro provides these require.context modules when bundling an app.
jest.mock('expo-router/_ctx', () => {
  const { useLoaderData } = require('expo-router');

  function LocaleIndex() {
    const data = useLoaderData();
    return data?.message ?? 'MISSING';
  }

  const routes = {
    './index.tsx': { default: () => 'Index route' },
    './post.tsx': { default: () => 'Post route' },
    './suspense.tsx': { default: () => mockRenderContent() },
    './[locale]/index.tsx': { default: LocaleIndex },
  };
  return {
    ctx: Object.assign((key: keyof typeof routes) => routes[key], {
      keys: () => Object.keys(routes),
      resolve: (key: string) => key,
      id: 'test-routes',
    }),
  };
});
jest.mock('expo-router/_ctx-html', () => ({
  ctx: { keys: () => [] },
}));

it.each(['server', 'static'] as const)(
  '%s output preserves script order and bootstrap data',
  async (output) => {
    const scripts = ['/runtime.js', '/common.js', '/entry.js', '/layout.js', '/page.js'];
    const loaderData = { title: 'Post </script>' };
    const location = new URL('http://localhost/post?preview=true');
    const options = {
      route: { file: './post.tsx', page: '/post' },
      assets: { css: [], js: scripts },
      loader: { key: '/post', data: loaderData },
    };
    const content =
      output === 'static'
        ? await getStreamingContent(location, { ...options, output: 'static' })
        : await new Response(await getStreamingContent(location, options)).text();
    const html = parse(content);

    expect(html.querySelector('div#root')?.textContent).toContain('Post route');
    const externalScripts = html.querySelectorAll('script[src]');
    expect(externalScripts.map((script) => script.getAttribute('src'))).toEqual(scripts);
    for (const script of externalScripts) {
      expect(script.hasAttribute('defer')).toBe(true);
      expect(script.hasAttribute('async')).toBe(false);
    }
    const preloads = html.querySelectorAll('link[rel="preload"][as="script"]');
    expect(preloads.map((link) => link.getAttribute('href'))).toEqual(scripts);

    const bootstrap = html.querySelector('script:not([src])');
    expect(bootstrap).not.toBeNull();
    const globals: Record<string, unknown> = {};
    runInNewContext(bootstrap!.textContent, globals);
    expect(globals.__EXPO_ROUTER_HYDRATE__).toBe(true);
    expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual({
      '/post?preview=true': loaderData,
    });
  }
);

describe.each(['server', 'static'] as const)('%s output with loader data', (output) => {
  it.each([
    ['plain query', '?page=2', '/en/index?page=2'],
    ['re-encoded comma', '?a=b,c', '/en/index?a=b%2Cc'],
    ['re-encoded space', '?a=b%20c', '/en/index?a=b+c'],
    ['re-encoded at sign', '?foo=a@b.example', '/en/index?foo=a%40b.example'],
    ['re-encoded colon', '?a=x:y', '/en/index?a=x%3Ay'],
    ['repeated keys', '?a=1&b=2&a=3', '/en/index?a=1&a=3&b=2'],
    ['integer-like keys', '?2=x&1=y', '/en/index?1=y&2=x'],
  ])('renders and stores loader data for a %s', async (_name, search, expectedKey) => {
    const location = new URL(`http://localhost/en${search}`);
    const loaderData = { message: 'LOADER DATA RENDERED' };
    const options = {
      route: { file: './[locale]/index.tsx', page: '/[locale]/index' },
      params: { locale: 'en' },
      loader: { key: '/en/index', data: loaderData },
    };
    const content =
      output === 'static'
        ? await getStreamingContent(location, { ...options, output: 'static' })
        : await new Response(await getStreamingContent(location, options)).text();
    const html = parse(content);

    expect(html.querySelector('#root')?.textContent).toContain(loaderData.message);
    const bootstrap = html.querySelector('script:not([src])');
    expect(bootstrap).not.toBeNull();
    const globals: Record<string, unknown> = {};
    runInNewContext(bootstrap!.textContent, globals);
    expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual({ [expectedKey]: loaderData });
  });

  it('omits the query separator when only a route parameter is in the query', async () => {
    const location = new URL('http://localhost/en?locale=fr');
    const loaderData = { message: 'LOADER DATA RENDERED' };
    const options = {
      route: { file: './[locale]/index.tsx', page: '/[locale]/index' },
      params: { locale: 'en' },
      loader: { key: '/en/index', data: loaderData },
    };
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const content =
        output === 'static'
          ? await getStreamingContent(location, { ...options, output: 'static' })
          : await new Response(await getStreamingContent(location, options)).text();
      const html = parse(content);

      expect(html.querySelector('#root')?.textContent).toContain(loaderData.message);
      const bootstrap = html.querySelector('script:not([src])');
      expect(bootstrap).not.toBeNull();
      const globals: Record<string, unknown> = {};
      runInNewContext(bootstrap!.textContent, globals);
      expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual({ '/en/index': loaderData });
      expect(consoleWarn).toHaveBeenCalledWith(
        "Route '/[locale]/index' with param 'locale' was specified both in the path and as a param, removing from path"
      );
    } finally {
      consoleWarn.mockRestore();
    }
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

it.each(['server', 'static'] as const)(
  '%s output renders large completed content in its document position',
  async (output) => {
    const text = 'x'.repeat(30_000);
    mockRenderContent.mockReturnValue(
      <Suspense fallback={<p>Loading</p>}>
        <main>{text}</main>
      </Suspense>
    );
    const location = new URL('http://localhost/suspense');
    const content =
      output === 'static'
        ? await getStreamingContent(location, {
            route: { file: './suspense.tsx', page: '/suspense' },
            output: 'static',
          })
        : await new Response(
            await getStreamingContent(location, {
              route: { file: './suspense.tsx', page: '/suspense' },
            })
          ).text();

    expect(parse(content).querySelector('#root main')?.textContent).toBe(text);
  }
);

it('renders large delayed content in its final document position for static output', async () => {
  const deferred = createDeferred<string>();
  function Content() {
    return (
      <main>
        <p>{use(deferred.promise)}</p>
        <span>Finished content</span>
      </main>
    );
  }
  mockRenderContent.mockReturnValue(
    <Suspense fallback={<p>Loading</p>}>
      <Content />
    </Suspense>
  );
  const result = getStreamingContent(new URL('http://localhost/suspense'), {
    route: { file: './suspense.tsx', page: '/suspense' },
    output: 'static',
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  deferred.resolve('x'.repeat(30_000));
  const html = parse(await result);
  expect(html.querySelector('#root main > p')?.textContent).toBe('x'.repeat(30_000));
  expect(html.querySelector('#root main > span')?.textContent).toBe('Finished content');
});

it('returns the live shell while Suspense is still pending', async () => {
  const deferred = createDeferred<string>();
  function Content() {
    return <p>{use(deferred.promise)}</p>;
  }
  mockRenderContent.mockReturnValue(
    <Suspense fallback={<p>Loading live content</p>}>
      <Content />
    </Suspense>
  );
  const stream = await getStreamingContent(new URL('http://localhost/suspense'), {
    route: { file: './suspense.tsx', page: '/suspense' },
  });
  const reader = stream.getReader();
  try {
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('<head>');
  } finally {
    deferred.resolve('Finished live content');
    while (!(await reader.read()).done) {}
    reader.releaseLock();
  }
});

it('rejects static output when a Suspense boundary fails', async () => {
  const error = new Error('render failed');
  function BrokenContent(): ReactNode {
    throw error;
  }
  mockRenderContent.mockReturnValue(
    <Suspense fallback={<p>Loading</p>}>
      <BrokenContent />
    </Suspense>
  );
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(
      getStreamingContent(new URL('http://localhost/suspense'), {
        route: { file: './suspense.tsx', page: '/suspense' },
        output: 'static',
      })
    ).rejects.toBe(error);
  } finally {
    consoleError.mockRestore();
  }
});

it('respects the hydration option for static output', async () => {
  const html = parse(
    await getStreamingContent(new URL('http://localhost/post'), {
      route: { file: './post.tsx', page: '/post' },
      output: 'static',
      hydrate: false,
    })
  );
  const globals: Record<string, unknown> = {};
  for (const script of html.querySelectorAll('script:not([src])')) {
    runInNewContext(script.textContent, globals);
  }
  expect(globals.__EXPO_ROUTER_HYDRATE__ ?? false).toBe(false);
  expect(html.querySelector('#root')?.textContent).toContain('Post route');
});

it('streams the hydration bootstrap when no assets are supplied', async () => {
  const stream = await getStreamingContent(new URL('http://localhost/'), {
    route: { file: './index.tsx', page: '/index' },
  });
  const html = parse(await new Response(stream).text());

  expect(html.querySelector('div#root')?.textContent).toContain('Index route');
  expect(html.querySelectorAll('script[src]')).toHaveLength(0);
  const bootstrap = html.querySelector('script:not([src])');
  expect(bootstrap).not.toBeNull();
  const globals: Record<string, unknown> = {};
  runInNewContext(bootstrap!.textContent, globals);
  expect(globals.__EXPO_ROUTER_HYDRATE__).toBe(true);
});
