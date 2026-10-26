import { parse } from 'node-html-parser';
import { runInNewContext } from 'node:vm';
import type { ReactNode } from 'react';

import { getStreamingContent } from '../../server/renderStreamingContent';
import { getStaticContent } from '../renderStaticContent';

// Metro provides these require.context modules when bundling an app.
jest.mock('expo-router/_ctx', () => {
  const { useLoaderData } = require('expo-router');

  function LocaleIndex() {
    const data = useLoaderData();
    return data?.message ?? 'MISSING';
  }

  const routes = {
    './posts/[id].tsx': { default: () => 'Post route' },
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
jest.mock('expo-router/_ctx-html', () => {
  function Root({
    pathname,
    params,
    children,
  }: {
    pathname: string;
    params: Record<string, string | string[]>;
    children: ReactNode;
  }) {
    return (
      <html data-pathname={pathname} data-params={JSON.stringify(params)}>
        <head />
        <body>{children}</body>
      </html>
    );
  }
  return {
    ctx: Object.assign(() => ({ default: Root }), { keys: () => ['./+html.tsx'] }),
  };
});

const postRoute = {
  route: { file: './posts/[id].tsx', page: '/posts/[id]' },
  params: { id: '123' },
};

it.each([
  ['?a=b,c', '/en/index?a=b%2Cc'],
  ['?a=b%20c', '/en/index?a=b+c'],
  ['?foo=a@b.example', '/en/index?foo=a%40b.example'],
  ['?a=x:y', '/en/index?a=x%3Ay'],
  ['?a=1&b=2&a=3', '/en/index?a=1&a=3&b=2'],
  ['?2=x&1=y', '/en/index?1=y&2=x'],
])('renders and stores loader data with normalized query %s', async (search, expectedKey) => {
  const html = parse(
    await getStaticContent(new URL(`http://localhost/en${search}`), {
      route: { file: './[locale]/index.tsx', page: '/[locale]/index' },
      params: { locale: 'en' },
      loader: { key: '/en/index', data: { message: 'LOADER DATA RENDERED' } },
    })
  );

  expect(html.querySelector('#root')?.textContent).toBe('LOADER DATA RENDERED');
  const bootstrap = html.querySelector('script:not([src])');
  expect(bootstrap).not.toBeNull();
  const globals: Record<string, unknown> = {};
  runInNewContext(bootstrap!.textContent, globals);
  expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual({
    [expectedKey]: { message: 'LOADER DATA RENDERED' },
  });
});

it('omits the query separator when only a route parameter is in the query', async () => {
  const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const html = parse(
      await getStaticContent(new URL('http://localhost/en?locale=fr'), {
        route: { file: './[locale]/index.tsx', page: '/[locale]/index' },
        params: { locale: 'en' },
        loader: { key: '/en/index', data: { message: 'LOADER DATA RENDERED' } },
      })
    );

    expect(html.querySelector('#root')?.textContent).toBe('LOADER DATA RENDERED');
    const bootstrap = html.querySelector('script:not([src])');
    expect(bootstrap).not.toBeNull();
    const globals: Record<string, unknown> = {};
    runInNewContext(bootstrap!.textContent, globals);
    expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual({
      '/en/index': { message: 'LOADER DATA RENDERED' },
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      "Route '/[locale]/index' with param 'locale' was specified both in the path and as a param, removing from path"
    );
  } finally {
    consoleWarn.mockRestore();
  }
});

it('passes the pathname and params to +html during static rendering', async () => {
  const html = parse(await getStaticContent(new URL('http://localhost/posts/123'), postRoute));

  const root = html.querySelector('html');
  expect(root?.getAttribute('data-pathname')).toBe('/posts/123');
  expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({ id: '123' });
});

it('passes the pathname and params to +html during server rendering', async () => {
  const stream = await getStreamingContent(
    new URL('http://localhost/posts/123?draft=true'),
    postRoute
  );
  const html = parse(await new Response(stream).text());

  const root = html.querySelector('html');
  expect(root?.getAttribute('data-pathname')).toBe('/posts/123');
  expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({
    id: '123',
    draft: 'true',
  });
});

it.each(['static', 'server'] as const)(
  '%s rendering resolves +html props from the matched route and params',
  async (output) => {
    const location = new URL('http://localhost/posts/123?draft=true');
    const options = { ...postRoute, params: { id: '999' } };
    const content =
      output === 'static'
        ? await getStaticContent(location, options)
        : await new Response(await getStreamingContent(location, options)).text();

    const root = parse(content).querySelector('html');
    expect(root?.getAttribute('data-pathname')).toBe('/posts/999');
    expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({
      id: '999',
      draft: 'true',
    });
  }
);
