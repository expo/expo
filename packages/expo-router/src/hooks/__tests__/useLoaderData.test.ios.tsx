import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import React from 'react';
import { Text } from 'react-native';

import { router, Slot } from '../../exports';
import Tabs from '../../layouts/Tabs';
import { defaultLoaderCache, LoaderCache, LoaderCacheContext } from '../../loaders/LoaderCache';
import { ServerDataLoaderContext } from '../../loaders/ServerDataLoaderContext';
import { fetchLoader } from '../../loaders/utils';
import { renderRouter } from '../../testing-library';
import { useLoaderData } from '../useLoaderData';
import { renderHook } from './renderHook';

jest.mock('../../loaders/utils', () => ({
  fetchLoader: jest.fn(),
}));

describe(useLoaderData, () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    global.window = {
      location: { origin: 'http://localhost:8081' },
    } as any;
  });

  afterEach(() => {
    global.window = originalWindow;
    delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
    defaultLoaderCache.clear();
  });

  it.each([
    { route: 'index', initialUrl: '/', expectedPath: '/index' },
    {
      route: 'users/index',
      initialUrl: '/users',
      expectedPath: '/users/index',
    },
    { route: '(group)/index', initialUrl: '/', expectedPath: '/(group)/index' },
    {
      route: 'users/[id]',
      initialUrl: '/users/123',
      expectedPath: '/users/123',
    },
  ])('resolves $route to $expectedPath', ({ route, initialUrl, expectedPath }) => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      [expectedPath]: { correct: true },
    };

    const { result } = renderHook(() => useLoaderData(), [route], {
      initialUrl,
    });

    expect(result.current).toEqual({ correct: true });
  });

  it('resolves nested route under `_layout` to full pathname', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/nested/index': { correct: true },
    };

    let loaderResult: any;

    renderRouter(
      {
        'nested/_layout': () => <Slot />,
        'nested/index': function NestedIndex() {
          loaderResult = useLoaderData();
          return <Text>Nested</Text>;
        },
      },
      { initialUrl: '/nested' }
    );

    expect(loaderResult).toEqual({ correct: true });
  });

  it('includes search params in the lookup key', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/request?foo=bar': { correct: true },
    };

    const { result } = renderHook(() => useLoaderData(), ['request'], {
      initialUrl: '/request?foo=bar',
    });

    expect(result.current).toEqual({ correct: true });
  });

  it('retrieves server-side data from `ServerDataLoaderContext`', () => {
    // Added to ensure that data is not fetched from global scope
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { source: 'global' },
    };

    const ServerWrapper = ({ children }: { children: React.ReactNode }) => (
      <ServerDataLoaderContext value={{ '/index': { source: 'server' } }}>
        {children}
      </ServerDataLoaderContext>
    );

    const { result } = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: ServerWrapper,
    });

    expect(result.current).toEqual({ source: 'server' });
  });

  it('retrieves server-injected data from `globalThis.__EXPO_ROUTER_LOADER_DATA__`', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { some: 'data' },
    };

    const { result } = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
    });

    expect(result.current).toEqual({ some: 'data' });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
  });

  it('consumes hydration data once and fetches on a later remount', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { fromHydration: true },
    };

    const cache = new LoaderCache();
    const CacheWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderCacheContext value={cache}>{children}</LoaderCacheContext>
    );

    const firstMount = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: CacheWrapper,
    });
    expect(firstMount.result.current).toEqual({ fromHydration: true });
    expect(fetchLoaderMock).not.toHaveBeenCalled();

    firstMount.unmount();
    // Reclamation is covered by LoaderSuspenseStore's lifecycle tests. Clear the retained route
    // tree entry here to model a later navigation after the mount has been reclaimed.
    cache.suspense.clear('/index');

    renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: CacheWrapper,
    });
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
    expect(fetchLoaderMock).toHaveBeenCalledWith('/index');
  });

  it('consumes hydration data once without fetching across a StrictMode double mount', () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { fromHydration: true },
    };

    const cache = new LoaderCache();
    const seedSpy = jest.spyOn(cache.suspense, 'seed');
    const StrictCacheWrapper = ({ children }: { children: React.ReactNode }) => (
      <React.StrictMode>
        <LoaderCacheContext value={cache}>{children}</LoaderCacheContext>
      </React.StrictMode>
    );

    const { result } = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: StrictCacheWrapper,
    });

    expect(result.current).toEqual({ fromHydration: true });
    expect(seedSpy).toHaveBeenCalledTimes(1);
    expect(fetchLoaderMock).not.toHaveBeenCalled();
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
  });

  it('retrieves fresh data from `fetchLoaderModule()`', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/': { home: true },
    };

    const cache = new LoaderCache();

    const CacheWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderCacheContext value={cache}>{children}</LoaderCacheContext>
    );

    renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: CacheWrapper,
    });

    expect(fetchLoaderMock).toHaveBeenCalledWith('/users/123');

    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });

    expect(cache.suspense.get('/users/123')).toEqual({
      data: { fromFetch: true },
    });
  });

  it('forces HTTP revalidation for the first fetch after loader invalidation', () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const cache = new LoaderCache();
    cache.suspense.set('/users/123', { data: { old: true } });
    cache.invalidateAll({ revalidate: true });

    const CacheWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderCacheContext value={cache}>{children}</LoaderCacheContext>
    );

    renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: CacheWrapper,
    });

    expect(fetchLoaderMock).toHaveBeenCalledWith('/users/123', {
      headers: { 'Cache-Control': 'no-cache' },
    });
  });

  it(`uses the loader function's return types`, () => {
    const asyncLoader = async () => {
      return { user: { id: 1, name: 'async user' }, timestamp: Date.now() };
    };

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { user: { id: 1, name: 'async user' }, timestamp: 123456789 },
    };

    const { result } = renderHook(() => useLoaderData<typeof asyncLoader>(), ['index'], {
      initialUrl: '/',
    });

    expectTypeOf(result.current).toEqualTypeOf<{
      user: { id: number; name: string };
      timestamp: number;
    }>();
  });

  it('resolves loader data for non-focused tab route', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { tab: 'home' },
      '/profile': { tab: 'profile' },
    };

    const homeResults: any[] = [];
    const profileResults: any[] = [];

    renderRouter(
      {
        _layout: () => <Tabs />,
        index: function Home() {
          homeResults.push(useLoaderData());
          return <Text>Home</Text>;
        },
        profile: function Profile() {
          profileResults.push(useLoaderData());
          return <Text>Profile</Text>;
        },
      },
      {
        initialUrl: '/',
      }
    );

    expect(homeResults[homeResults.length - 1]).toEqual({ tab: 'home' });

    act(() => router.push('/profile'));

    expect(profileResults[profileResults.length - 1]).toEqual({
      tab: 'profile',
    });
    // Home screen should still be showing its own results
    expect(homeResults[homeResults.length - 1]).toEqual({ tab: 'home' });
  });
});
