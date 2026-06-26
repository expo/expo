import { resolveLoaderKey } from '../resolveLoaderKey';

describe(resolveLoaderKey, () => {
  it.each<{
    name: string;
    contextKey: string;
    params: Record<string, string | string[]>;
    searchParams?: URLSearchParams;
    expected: string;
  }>([
    {
      name: 'root index',
      contextKey: '/index',
      params: {},
      searchParams: undefined,
      expected: '/index',
    },
    {
      name: 'grouped index',
      contextKey: '/(group)/index',
      params: {},
      searchParams: undefined,
      expected: '/(group)/index',
    },
    {
      name: 'dynamic segment',
      contextKey: '/posts/[id]',
      params: { id: '123' },
      searchParams: undefined,
      expected: '/posts/123',
    },
    {
      name: 'dynamic segment with search params',
      contextKey: '/a/[b]',
      params: { b: '1' },
      searchParams: new URLSearchParams('x=1'),
      expected: '/a/1?x=1',
    },
    {
      name: 'catch-all',
      contextKey: '/[...rest]',
      params: { rest: ['x', 'y'] },
      searchParams: undefined,
      expected: '/x/y',
    },
  ])('resolves $name', ({ contextKey, params, searchParams, expected }) => {
    expect(resolveLoaderKey(contextKey, params, searchParams)).toBe(expected);
  });

  it('omits the query when search params are empty', () => {
    expect(resolveLoaderKey('/request', {}, new URLSearchParams())).toBe('/request');
  });
});
