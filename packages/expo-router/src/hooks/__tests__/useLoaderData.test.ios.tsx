import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import React from 'react';
import { Text } from 'react-native';

import { router, Slot } from '../../exports';
import Tabs from '../../layouts/Tabs';
import { defaultLoaderClient, LoaderClient, LoaderClientContext } from '../../loaders/LoaderClient';
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
    // `renderRouter` installs fake timers and leaks them into later tests; the loader lifecycle
    // relies on real microtasks.
    jest.useRealTimers();
    global.window = {
      location: { origin: 'http://localhost:8081' },
    } as any;
  });

  afterEach(() => {
    global.window = originalWindow;
    delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
    defaultLoaderClient.clear();
  });

  it.each([
    { route: 'index', initialUrl: '/', expectedPath: '/index' },
    { route: 'users/index', initialUrl: '/users', expectedPath: '/users/index' },
    { route: '(group)/index', initialUrl: '/', expectedPath: '/(group)/index' },
    { route: 'users/[id]', initialUrl: '/users/123', expectedPath: '/users/123' },
  ])('resolves $route to $expectedPath', ({ route, initialUrl, expectedPath }) => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      [expectedPath]: { correct: true },
    };

    const { result } = renderHook(() => useLoaderData(), [route], { initialUrl });

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

  it('consumes server-injected data from `globalThis.__EXPO_ROUTER_LOADER_DATA__` once', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { some: 'data' },
    };

    const { result } = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
    });

    expect(result.current).toEqual({ some: 'data' });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
  });

  it('fetches on a later remount once the hydrated entry is gone', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { fromHydration: true },
    };

    const client = new LoaderClient();
    const ClientWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderClientContext value={client}>{children}</LoaderClientContext>
    );

    const firstMount = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: ClientWrapper,
    });
    expect(firstMount.result.current).toEqual({ fromHydration: true });
    expect(fetchLoaderMock).not.toHaveBeenCalled();

    firstMount.unmount();
    await act(async () => {});
    expect(client.suspense.get('/index')).toBeUndefined();

    renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: ClientWrapper,
    });
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
    expect(fetchLoaderMock).toHaveBeenCalledWith('/index');
  });

  it('retrieves fresh data from `fetchLoaderModule()`', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/': { home: true },
    };

    const client = new LoaderClient();

    const ClientWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderClientContext value={client}>{children}</LoaderClientContext>
    );

    renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: ClientWrapper,
    });

    expect(fetchLoaderMock).toHaveBeenCalledWith('/users/123');

    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });

    expect(client.suspense.get('/users/123')).toEqual({ data: { fromFetch: true } });
  });

  it('retrieves settled data from the Suspense store without fetching', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/': { home: true },
    };

    const client = new LoaderClient();
    client.suspense.set('/users/123', { data: { fromStore: true } });

    const ClientWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderClientContext value={client}>{children}</LoaderClientContext>
    );

    const { result } = renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: ClientWrapper,
    });

    expect(result.current).toEqual({ fromStore: true });
    expect(fetchLoader).not.toHaveBeenCalled();
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

  it('does not re-render readers of other paths when a loader settles', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ tab: 'home', fresh: true });
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { tab: 'home' },
      '/profile': { tab: 'profile' },
    };

    let indexRenders = 0;
    let profileRenders = 0;
    renderRouter(
      {
        _layout: () => <Tabs />,
        index: function Home() {
          indexRenders++;
          useLoaderData();
          return <Text>Home</Text>;
        },
        profile: function Profile() {
          profileRenders++;
          useLoaderData();
          return <Text>Profile</Text>;
        },
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    act(() => router.push('/profile'));
    const indexBefore = indexRenders;
    const profileBefore = profileRenders;
    expect(profileBefore).toBeGreaterThan(0);

    // An in-place refetch of `/index` alone (the HMR delivery path).
    await act(async () => {
      defaultLoaderClient.execute('/index');
    });

    expect(indexRenders).toBeGreaterThan(indexBefore);
    expect(profileRenders).toBe(profileBefore);
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

    expect(profileResults[profileResults.length - 1]).toEqual({ tab: 'profile' });
    // Home screen should still be showing its own results
    expect(homeResults[homeResults.length - 1]).toEqual({ tab: 'home' });
  });
});
