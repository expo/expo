import { INTERNAL_SLOT_NAME } from '../../constants';
import type { RouteNode } from '../../Route';
import { store, storeRef } from '../../global-state/store';
import { LoaderCache } from '../LoaderCache';
import { subscribeToLoaderWarming } from '../loaderBootstrap';
import { fetchLoader } from '../utils';

jest.mock('../utils', () => ({ fetchLoader: jest.fn() }));

const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
const loader = () => ({ ok: true });

function leaf(route: string, contextKey: string, hasLoader: boolean): RouteNode {
  return {
    type: 'route',
    route,
    contextKey,
    children: [],
    dynamic: null,
    loadRoute: () => (hasLoader ? { loader } : {}),
  } as unknown as RouteNode;
}

function tree(children: RouteNode[]): RouteNode {
  return {
    type: 'layout',
    route: '',
    contextKey: './_layout.tsx',
    children,
    dynamic: null,
    loadRoute: () => ({}),
  } as unknown as RouteNode;
}

function commit(name: string, key: string, params?: Record<string, string | string[]>) {
  store.onStateChange({
    index: 0,
    routes: [
      {
        name: INTERNAL_SLOT_NAME,
        key: '__root',
        state: { index: 0, routes: [{ name, key, params }] },
      },
    ],
  } as any);
}

describe(subscribeToLoaderWarming, () => {
  const originalStore = storeRef.current;
  const originalWindow = global.window;
  let unsubscribe: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    storeRef.current = { ...originalStore } as any;
  });

  afterEach(() => {
    unsubscribe?.();
    storeRef.current = originalStore;
    global.window = originalWindow;
    delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
  });

  it('warms the focused leaf loader on commit', async () => {
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });
    storeRef.current.routeNode = tree([leaf('posts/[id]', './posts/[id].tsx', true)]);

    const cache = new LoaderCache();
    unsubscribe = subscribeToLoaderWarming(cache);

    commit('posts/[id]', 'posts-1', { id: '123' });

    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
    expect(fetchLoaderMock).toHaveBeenCalledWith('/posts/123');

    await fetchLoaderMock.mock.results[0]!.value;

    expect(cache.getData('/posts/123')).toEqual({ fromFetch: true });
  });

  it('warms each focused URL only once', async () => {
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });
    storeRef.current.routeNode = tree([leaf('posts/[id]', './posts/[id].tsx', true)]);

    const cache = new LoaderCache();
    unsubscribe = subscribeToLoaderWarming(cache);

    commit('posts/[id]', 'posts-1', { id: '123' });
    await fetchLoaderMock.mock.results[0]!.value;
    commit('posts/[id]', 'posts-1', { id: '123' });

    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the focused leaf has no loader', () => {
    storeRef.current.routeNode = tree([leaf('about', './about.tsx', false)]);

    const cache = new LoaderCache();
    unsubscribe = subscribeToLoaderWarming(cache);

    commit('about', 'about-1');

    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });

  it('skips warming when the route data is already hydrated', () => {
    global.window = { location: { origin: 'http://localhost:8081' } } as any;
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/posts/123': { hydrated: true } };
    storeRef.current.routeNode = tree([leaf('posts/[id]', './posts/[id].tsx', true)]);

    const cache = new LoaderCache();
    unsubscribe = subscribeToLoaderWarming(cache);

    commit('posts/[id]', 'posts-1', { id: '123' });

    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });

  it('stops warming after unsubscribe', () => {
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });
    storeRef.current.routeNode = tree([leaf('posts/[id]', './posts/[id].tsx', true)]);

    const cache = new LoaderCache();
    subscribeToLoaderWarming(cache)();

    commit('posts/[id]', 'posts-1', { id: '123' });

    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });
});
