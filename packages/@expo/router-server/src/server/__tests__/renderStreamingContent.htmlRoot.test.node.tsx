import { inMemoryContext } from 'expo-router/build/testing-library/context-stubs';
import { parse } from 'node-html-parser';
import type { ReactNode } from 'react';

import { getStreamingContent } from '../renderStreamingContent';

const mockRouteContext = inMemoryContext({
  'posts/[id]': () => <>Post route</>,
});

jest.mock('expo-router/_ctx', () => ({
  ctx: Object.assign((key: string) => mockRouteContext(key), {
    keys: () => mockRouteContext.keys(),
    resolve: (key: string) => key,
    id: 'test-routes',
  }),
}));
jest.mock('expo-router/_ctx-html', () => ({
  ctx: Object.assign(
    () => ({
      default: ({
        pathname,
        params,
        children,
      }: {
        pathname: string;
        params: Record<string, string | string[]>;
        children: ReactNode;
      }) => (
        <html data-pathname={pathname} data-params={JSON.stringify(params)}>
          <head />
          <body>{children}</body>
        </html>
      ),
    }),
    { keys: () => ['./+html.tsx'] }
  ),
}));

const postRoute = {
  route: { file: './posts/[id].js', page: '/posts/[id]' },
  params: { id: '123' },
};

it.each(['static', 'server'] as const)(
  '%s output passes the pathname and params to +html',
  async (output) => {
    const html = parse(
      await renderToHtml(output, new URL('http://localhost/posts/123?draft=true'), postRoute)
    );

    const root = html.querySelector('html');
    expect(root?.getAttribute('data-pathname')).toBe('/posts/123');
    expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({
      id: '123',
      draft: 'true',
    });
  }
);

it.each(['static', 'server'] as const)(
  '%s output resolves +html props from the matched route and params',
  async (output) => {
    const location = new URL('http://localhost/posts/123?draft=true');
    const options = { ...postRoute, params: { id: '999' } };
    const html = parse(await renderToHtml(output, location, options));

    const root = html.querySelector('html');
    expect(root?.getAttribute('data-pathname')).toBe('/posts/999');
    expect(JSON.parse(root?.getAttribute('data-params') ?? '')).toEqual({
      id: '999',
      draft: 'true',
    });
  }
);

async function renderToHtml(
  output: 'static' | 'server',
  location: URL,
  options: Parameters<typeof getStreamingContent>[1]
): Promise<string> {
  if (output === 'static') {
    return getStreamingContent(location, { ...options, output });
  }
  return new Response(await getStreamingContent(location, { ...options, output: 'server' })).text();
}
