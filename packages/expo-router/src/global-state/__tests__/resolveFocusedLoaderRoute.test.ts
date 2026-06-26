import { getRouteInfoFromState } from '../getRouteInfoFromState';
import { resolveFocusedLoaderRoute } from '../resolveFocusedLoaderRoute';
import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../../constants';
import type { RouteNode } from '../../Route';
import { resolveLoaderKey } from '../../loaders/resolveLoaderKey';
import type { ReactNavigationState } from '../types';

const loader = () => ({ ok: true });

function leaf(route: string, contextKey: string, opts: { loader?: boolean } = {}): RouteNode {
  return {
    type: 'route',
    route,
    contextKey,
    children: [],
    dynamic: null,
    loadRoute: () => (opts.loader ? { loader } : {}),
  } as unknown as RouteNode;
}

function layout(route: string, contextKey: string, children: RouteNode[]): RouteNode {
  return {
    type: 'layout',
    route,
    contextKey,
    children,
    dynamic: null,
    loadRoute: () => ({}),
  } as unknown as RouteNode;
}

/** Wrap a navigator state under the `__root` slot, as React Navigation commits it. */
function root(inner: any): ReactNavigationState {
  return { index: 0, routes: [{ name: INTERNAL_SLOT_NAME, key: '__root', state: inner }] } as any;
}

describe(resolveFocusedLoaderRoute, () => {
  it('resolves a top-level leaf with a loader', () => {
    const tree = layout('', './_layout.tsx', [leaf('index', './index.tsx', { loader: true })]);
    const state = root({ index: 0, routes: [{ name: 'index', key: 'index-1' }] });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe('/index');
    expect(result!.contextKey).toBe('/index');
  });

  it('resolves the focused leaf inside a nested navigator (tabs)', () => {
    const tree = layout('', './_layout.tsx', [
      layout('(tabs)', './(tabs)/_layout.tsx', [
        leaf('home', './(tabs)/home.tsx', { loader: true }),
        leaf('profile', './(tabs)/profile.tsx', { loader: true }),
      ]),
    ]);
    const state = root({
      index: 0,
      routes: [
        {
          name: '(tabs)',
          key: 'tabs-1',
          state: {
            index: 1,
            routes: [
              { name: 'home', key: 'home-1' },
              { name: 'profile', key: 'profile-1' },
            ],
          },
        },
      ],
    });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result!.resolvedPath).toBe('/(tabs)/profile');
  });

  it('fills dynamic segments from params', () => {
    const tree = layout('', './_layout.tsx', [leaf('posts/[id]', './posts/[id].tsx', { loader: true })]);
    const state = root({
      index: 0,
      routes: [{ name: 'posts/[id]', key: 'posts-1', params: { id: '123' } }],
    });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result!.resolvedPath).toBe('/posts/123');
    expect(result!.params).toEqual({ id: '123' });
  });

  it('appends search params', () => {
    const tree = layout('', './_layout.tsx', [leaf('request', './request.tsx', { loader: true })]);
    const state = root({
      index: 0,
      routes: [{ name: 'request', key: 'request-1', params: { foo: 'bar' } }],
    });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result!.resolvedPath).toBe('/request?foo=bar');
    expect(result!.searchParams.get('foo')).toBe('bar');
  });

  it('resolves a catch-all leaf', () => {
    const tree = layout('', './_layout.tsx', [
      leaf('[...rest]', './[...rest].tsx', { loader: true }),
    ]);
    const state = root({
      index: 0,
      routes: [{ name: '[...rest]', key: 'rest-1', params: { rest: ['x', 'y'] } }],
    });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result!.resolvedPath).toBe('/x/y');
  });

  it('resolves a grouped index route', () => {
    const tree = layout('', './_layout.tsx', [
      layout('(group)', './(group)/_layout.tsx', [
        leaf('index', './(group)/index.tsx', { loader: true }),
      ]),
    ]);
    const state = root({
      index: 0,
      routes: [{ name: '(group)', key: 'group-1', state: { index: 0, routes: [{ name: 'index', key: 'gi-1' }] } }],
    });

    const result = resolveFocusedLoaderRoute(state, tree);

    expect(result!.resolvedPath).toBe('/(group)/index');
    expect(result!.contextKey).toBe('/(group)/index');
  });

  it('returns null when the focused leaf has no loader', () => {
    const tree = layout('', './_layout.tsx', [leaf('index', './index.tsx', { loader: false })]);
    const state = root({ index: 0, routes: [{ name: 'index', key: 'index-1' }] });

    expect(resolveFocusedLoaderRoute(state, tree)).toBeNull();
  });

  it('returns null when the focused leaf is not in the route tree', () => {
    const tree = layout('', './_layout.tsx', [leaf('index', './index.tsx', { loader: true })]);
    const state = root({ index: 0, routes: [{ name: 'ghost', key: 'ghost-1' }] });

    expect(resolveFocusedLoaderRoute(state, tree)).toBeNull();
  });

  it.each([NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME])('returns null for the %s route', (name) => {
    const tree = layout('', './_layout.tsx', [leaf('index', './index.tsx', { loader: true })]);
    const state = { index: 0, routes: [{ name, key: `${name}-1` }] } as any;

    expect(resolveFocusedLoaderRoute(state, tree)).toBeNull();
  });

  it('resolvedPath matches resolveLoaderKey for the same route (router key === component key)', () => {
    const tree = layout('', './_layout.tsx', [
      layout('(tabs)', './(tabs)/_layout.tsx', [
        leaf('posts/[id]', './(tabs)/posts/[id].tsx', { loader: true }),
      ]),
    ]);
    const state = root({
      index: 0,
      routes: [
        {
          name: '(tabs)',
          key: 'tabs-1',
          state: {
            index: 0,
            routes: [{ name: 'posts/[id]', key: 'posts-1', params: { id: '7', q: 'x' } }],
          },
        },
      ],
    });

    const result = resolveFocusedLoaderRoute(state, tree);
    const routeInfo = getRouteInfoFromState(state);

    expect(result!.resolvedPath).toBe(
      resolveLoaderKey(result!.contextKey, routeInfo.params, routeInfo.searchParams)
    );
    expect(result!.resolvedPath).toBe('/(tabs)/posts/7?q=x');
  });
});
