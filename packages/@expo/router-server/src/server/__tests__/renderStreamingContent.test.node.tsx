import { parse } from 'node-html-parser';
import { runInNewContext } from 'node:vm';

import { getStreamingContent } from '../renderStreamingContent';

// Metro provides these require.context modules when bundling an app.
jest.mock('expo-router/_ctx', () => {
  const routes = {
    './index.tsx': { default: () => 'Index route' },
    './post.tsx': { default: () => 'Post route' },
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

it('streams startup scripts in deferred asset order and preserves the inline bootstrap', async () => {
  const scripts = ['/runtime.js', '/common.js', '/entry.js', '/layout.js', '/page.js'];
  const loaderData = { title: 'Post </script>' };
  const stream = await getStreamingContent(new URL('http://localhost/post?preview=true'), {
    assets: { css: [], js: scripts },
    loader: { key: '/post', data: loaderData },
  });
  const html = parse(await new Response(stream).text());

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
});

it('streams the hydration bootstrap when no assets are supplied', async () => {
  const stream = await getStreamingContent(new URL('http://localhost/'));
  const html = parse(await new Response(stream).text());

  expect(html.querySelector('div#root')?.textContent).toContain('Index route');
  expect(html.querySelectorAll('script[src]')).toHaveLength(0);
  const bootstrap = html.querySelector('script:not([src])');
  expect(bootstrap).not.toBeNull();
  const globals: Record<string, unknown> = {};
  runInNewContext(bootstrap!.textContent, globals);
  expect(globals.__EXPO_ROUTER_HYDRATE__).toBe(true);
});
