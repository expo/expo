import type { RedirectConfig } from '../getRoutesCore';
import { convertRedirect } from '../getRoutesRedirects';

describe(convertRedirect, () => {
  it.each([
    { source: '/foo/[slug]', path: '/foo/hello', destination: 'bar/[slug]', expected: 'bar/hello' },
    { source: 'foo/[slug]', path: '/foo/hello', destination: 'bar/[slug]', expected: 'bar/hello' },
    { source: '/foo/[slug]', path: 'foo/hello', destination: 'bar/[slug]', expected: 'bar/hello' },
    {
      source: '/foo/[...slug]',
      path: '/foo/2026/hello',
      destination: 'bar/[...slug]',
      expected: 'bar/2026/hello',
    },
    {
      source: 'foo/[...slug]',
      path: '/foo/2026/hello',
      destination: 'bar/[...slug]',
      expected: 'bar/2026/hello',
    },
    {
      source: '/foo/[id]/[...rest]',
      path: '/foo/7/a/b',
      destination: 'bar/[id]/[...rest]',
      expected: 'bar/7/a/b',
    },
    {
      source: '/foo/[id]/[...rest]',
      path: '/foo/7/a/b',
      destination: 'bar/[...rest]/[id]',
      expected: 'bar/a/b/7',
    },
    { source: '/foo/[...slug]', path: '/foo/hello', destination: 'bar', expected: 'bar' },
  ])('redirects $path to $expected using $source', ({ source, path, destination, expected }) => {
    expect(convertRedirect(path, { source, destination } as RedirectConfig)).toBe(expected);
  });
});
