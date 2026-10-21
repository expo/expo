import { parse } from 'node-html-parser';
import type { ReactNode } from 'react';

import { getStreamingContent } from '../../server/renderStreamingContent';
import { getStaticContent } from '../renderStaticContent';

// Metro provides these require.context modules when bundling an app.
jest.mock('expo-router/_ctx', () => {
  const routes = {
    './posts/[id].tsx': { default: () => 'Post route' },
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
        <body>{children}</body>
      </html>
    );
  }
  return {
    ctx: Object.assign(() => ({ default: Root }), { keys: () => ['./+html.tsx'] }),
  };
});

it('passes the pathname and params to +html during static rendering', async () => {
  const html = parse(await getStaticContent(new URL('http://localhost/posts/123')));

  const root = html.querySelector('html');
  expect(root?.getAttribute('data-pathname')).toBe('/posts/123');
  expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({ id: '123' });
});

it('passes the pathname and params to +html during server rendering', async () => {
  const stream = await getStreamingContent(new URL('http://localhost/posts/123?draft=true'));
  const html = parse(await new Response(stream).text());

  const root = html.querySelector('html');
  expect(root?.getAttribute('data-pathname')).toBe('/posts/123');
  expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({
    id: '123',
    draft: 'true',
  });
});
