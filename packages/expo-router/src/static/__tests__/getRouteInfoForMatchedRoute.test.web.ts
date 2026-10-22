import { getNavigationConfig } from '../../getLinkingConfig';
import { getRoutes } from '../../getRoutes';
import { getRouteInfoFromState } from '../../global-state/getRouteInfoFromState';
import { getStateFromPath } from '../../link/linking';
import { inMemoryContext } from '../../testing-library/context-stubs';
import type { RequireContext } from '../../types';
import { getRouteInfoForMatchedRoute } from '../getRouteInfoForMatchedRoute';

function getRouteInfoFromTree(context: RequireContext, location: URL) {
  const routeNode = getRoutes(context, {
    skipGenerated: true,
    ignoreEntryPoints: true,
    platform: 'web',
  })!;
  const navigationConfig = getNavigationConfig(routeNode, true, { sitemap: true, notFound: true });
  return getRouteInfoFromState(
    getStateFromPath(`${location.pathname}${location.search}`, navigationConfig)
  );
}

const routes = {
  index: () => null,
  '[locale]/index': () => null,
  'posts/[id]': () => null,
  '(group)/platform/[...slug]': () => null,
  'nested/_layout': () => null,
  'nested/index': () => null,
};
const withNotFoundFile = inMemoryContext({ ...routes, '+not-found': () => null });
const withGeneratedRoutes = inMemoryContext(routes);

const cases: {
  href: string;
  page: string;
  captures: Record<string, string>;
  pathname: string;
  generated?: true;
}[] = [
  { href: '/', page: '/index', captures: {}, pathname: '/' },
  { href: '/?page=2', page: '/index', captures: {}, pathname: '/' },
  {
    href: '/en?a=b,c&2=x&1=y',
    page: '/[locale]/index',
    captures: { locale: 'en' },
    pathname: '/en',
  },
  {
    href: '/en?locale=fr&x=1',
    page: '/[locale]/index',
    captures: { locale: 'en' },
    pathname: '/en',
  },
  {
    href: '/posts/a%20b?x=1&x=2',
    page: '/posts/[id]',
    captures: { id: 'a%20b' },
    pathname: '/posts/a b',
  },
  {
    href: '/platform/a/b%2Fc/',
    page: '/(group)/platform/[...slug]',
    captures: { slug: 'a/b%2Fc' },
    pathname: '/platform/a/b/c',
  },
  { href: '/nested?q=1', page: '/nested/index', captures: {}, pathname: '/nested' },
  {
    href: '/missing/deep?q=1',
    page: '/+not-found',
    captures: { 'not-found': 'missing/deep' },
    pathname: '/missing/deep',
  },
  {
    href: '/missing/deep?q=1',
    page: '/+not-found',
    captures: { 'not-found': 'missing/deep' },
    pathname: '/missing/deep?q=1',
    generated: true,
  },
  {
    href: '/(group)/missing',
    page: '/+not-found',
    captures: { 'not-found': '(group)/missing' },
    pathname: '/missing',
    generated: true,
  },
  { href: '/_sitemap', page: '/_sitemap', captures: {}, pathname: '/_sitemap', generated: true },
];

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

it.each(cases)(
  'matches the route tree result for $href ($page)',
  ({ href, page, captures, pathname, generated }) => {
    const location = new URL(href, 'http://localhost');
    const context = generated ? withGeneratedRoutes : withNotFoundFile;
    const fromTree = getRouteInfoFromTree(context, location);
    const fromMatch = getRouteInfoForMatchedRoute({ page, generated }, captures, location);

    expect(fromTree.pathname).toBe(pathname);
    expect(fromMatch.pathname).toBe(fromTree.pathname);
    expect(fromMatch.params).toEqual(fromTree.params);
    expect(fromMatch.searchParams.toString()).toBe(fromTree.searchParams.toString());
  }
);

it('returns fresh objects for every call', () => {
  const location = new URL('http://localhost/posts/1?x=1');
  const route = { page: '/posts/[id]' };
  const captures = { id: '1' };
  const first = getRouteInfoForMatchedRoute(route, captures, location);
  (first.params as Record<string, unknown>).x = 'mutated';
  first.searchParams.set('x', 'mutated');

  const second = getRouteInfoForMatchedRoute(route, captures, location);
  expect(second.params).toEqual({ id: '1', x: '1' });
  expect(second.searchParams.toString()).toBe('x=1');
});
