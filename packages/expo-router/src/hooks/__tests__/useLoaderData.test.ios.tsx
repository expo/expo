import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import React from 'react';
import { Text } from 'react-native';

import { router, Slot } from '../../exports';
import { store as routerStore } from '../../global-state/store';
import Tabs from '../../layouts/Tabs';
import { LoaderClient } from '../../loaders/LoaderClient';
import {
  createLoaderContextValue,
  defaultLoaderContextValue,
  LoaderContext,
} from '../../loaders/LoaderContext';
import { sweepLoaderRoutes } from '../../loaders/LoaderNavigation';
import { ServerDataLoaderContext } from '../../loaders/ServerDataLoaderContext';
import { fetchLoader } from '../../loaders/utils';
import { renderRouter } from '../../testing-library';
import { useLoaderData } from '../useLoaderData';
import { renderHook } from './renderHook';

jest.mock('../../loaders/utils', () => ({
  fetchLoader: jest.fn(),
}));

const getSignal = (requestInit: RequestInit) => requestInit.signal as AbortSignal;

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
    defaultLoaderContextValue.client.clear();
    defaultLoaderContextValue.store.reset();
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

  it('consumes hydration once and fetches on a later remount after reclamation', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { fromHydration: true },
    };

    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );

    const firstMount = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    expect(firstMount.result.current).toEqual({ fromHydration: true });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
    expect(fetchLoaderMock).not.toHaveBeenCalled();

    firstMount.unmount();
    await act(async () => {});
    expect(loaderContextValue.store.get('/index')).toBeUndefined();

    renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
    expect(fetchLoaderMock).toHaveBeenCalledWith(
      '/index',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('retrieves fresh data from `fetchLoaderModule()`', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ fromFetch: true });

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/': { home: true },
    };

    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );

    renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: LoaderWrapper,
    });

    expect(fetchLoaderMock).toHaveBeenCalledWith(
      '/users/123',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });

    expect(loaderContextValue.store.get('/users/123')).toEqual({
      data: { fromFetch: true },
    });
  });

  it('retrieves settled data from the Suspense store without fetching', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/users/123': { fromHydration: true },
    };

    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    loaderContextValue.store.set('/users/123', { data: { fromStore: true } });

    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );

    const { result } = renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: LoaderWrapper,
    });

    expect(result.current).toEqual({ fromStore: true });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/users/123');
    expect(fetchLoader).not.toHaveBeenCalled();
  });

  it('keeps custom client/store pairs isolated for the same route', () => {
    const firstValue = createLoaderContextValue(new LoaderClient());
    const secondValue = createLoaderContextValue(new LoaderClient());
    firstValue.store.set('/index', { data: { owner: 'first' } });
    secondValue.store.set('/index', { data: { owner: 'second' } });

    const FirstWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={firstValue}>{children}</LoaderContext>
    );
    const SecondWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={secondValue}>{children}</LoaderContext>
    );

    const first = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: FirstWrapper,
    });
    const second = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: SecondWrapper,
    });

    expect(first.result.current).toEqual({ owner: 'first' });
    expect(second.result.current).toEqual({ owner: 'second' });
  });

  it('reuses a hydrated entry across a same-tick Strict Mode remount', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    loaderContextValue.store.seed('/index', { hydrated: true });
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );

    const first = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    first.unmount();
    const remount = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    await act(async () => {});

    expect(remount.result.current).toEqual({ hydrated: true });
    expect(loaderContextValue.store.get('/index')).toEqual({
      data: { hydrated: true },
    });
    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });

  it('keeps a shared entry while a sibling reader remains mounted', async () => {
    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    loaderContextValue.store.seed('/index', { shared: true });
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );

    const first = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    const second = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    first.unmount();
    await act(async () => {});
    expect(second.result.current).toEqual({ shared: true });
    expect(loaderContextValue.store.get('/index')).toEqual({
      data: { shared: true },
    });

    second.unmount();
    await act(async () => {});
    expect(loaderContextValue.store.get('/index')).toBeUndefined();
  });

  it('refreshes a live entry in place during HMR coordination', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValueOnce({ version: 2 });
    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    loaderContextValue.store.seed('/index', { version: 1 });
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );
    const hook = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    act(() => {
      const { client, store } = loaderContextValue;
      store.retain(client.revalidate());
      client.notify();
    });

    expect(hook.result.current).toEqual({ version: 1 });
    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });
    expect(hook.result.current).toEqual({ version: 2 });
    expect(loaderContextValue.store.get('/index')).toEqual({
      data: { version: 2 },
    });
  });

  it('clears inactive entries while retaining live entries during HMR coordination', () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    loaderContextValue.store.seed('/index', { live: true });
    loaderContextValue.store.seed('/inactive', { stale: true });
    const LoaderWrapper = ({ children }: { children: React.ReactNode }) => (
      <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
    );
    renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    act(() => {
      const { client, store } = loaderContextValue;
      store.retain(client.revalidate());
      client.notify();
    });

    expect(loaderContextValue.store.get('/index')).toEqual({
      data: { live: true },
    });
    expect(loaderContextValue.store.get('/inactive')).toBeUndefined();
  });

  it('aborts a suspended load on Back and fetches a new generation on revisit', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    fetchLoaderMock.mockImplementation((_path, requestInit) => {
      const signal = getSignal(requestInit);
      return new Promise((resolve, reject) => {
        signals.push(signal);
        resolvers.push(resolve);
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });

    function SlowScreen() {
      const data = useLoaderData();
      return <Text>{JSON.stringify(data)}</Text>;
    }

    renderRouter(
      {
        index: () => <Text>Home</Text>,
        slow: () => (
          <React.Suspense fallback={<Text>Loading</Text>}>
            <SlowScreen />
          </React.Suspense>
        ),
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    await act(async () => router.push('/slow'));
    expect(signals).toHaveLength(1);

    await act(async () => router.back());
    sweepLoaderRoutes(defaultLoaderContextValue, routerStore.state);
    expect(signals[0]!.aborted).toBe(true);
    expect(defaultLoaderContextValue.store.get('/slow')).toBeUndefined();

    await act(async () => router.push('/slow'));
    expect(signals).toHaveLength(2);
    expect(signals[1]).not.toBe(signals[0]);

    await act(async () => {
      resolvers[1]!('fresh');
    });
    expect(defaultLoaderContextValue.store.get('/slow')).toEqual({
      data: 'fresh',
    });
  });

  it('does not abandon a suspended route when switching tabs', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    let signal!: AbortSignal;
    let resolveFetch!: (value: unknown) => void;
    fetchLoaderMock.mockImplementation(
      (_path, requestInit) =>
        new Promise((resolve) => {
          signal = getSignal(requestInit);
          resolveFetch = resolve;
        })
    );

    function Profile() {
      const data = useLoaderData();
      return <Text>{JSON.stringify(data)}</Text>;
    }

    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="profile" />
          </Tabs>
        ),
        index: () => <Text>Home</Text>,
        profile: () => (
          <React.Suspense fallback={<Text>Loading</Text>}>
            <Profile />
          </React.Suspense>
        ),
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    await act(async () => router.push('/profile'));
    await act(async () => router.push('/'));
    sweepLoaderRoutes(defaultLoaderContextValue, routerStore.state);

    expect(signal.aborted).toBe(false);
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch('profile');
    });
    expect(defaultLoaderContextValue.store.get('/profile')).toEqual({
      data: 'profile',
    });
  });

  it('keeps a shared pending path until its final duplicate route instance leaves', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    let signal!: AbortSignal;
    fetchLoaderMock.mockImplementation((_path, requestInit) => {
      const executionSignal = getSignal(requestInit);
      return new Promise((_, reject) => {
        signal = executionSignal;
        executionSignal.addEventListener('abort', () => reject(executionSignal.reason));
      });
    });

    function Post() {
      const data = useLoaderData();
      return <Text>{JSON.stringify(data)}</Text>;
    }

    renderRouter(
      {
        index: () => <Text>Home</Text>,
        'posts/[id]': () => (
          <React.Suspense fallback={<Text>Loading</Text>}>
            <Post />
          </React.Suspense>
        ),
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    await act(async () => router.push('/posts/1'));
    await act(async () => router.push('/posts/1'));
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);

    await act(async () => router.back());
    sweepLoaderRoutes(defaultLoaderContextValue, routerStore.state);
    expect(signal.aborted).toBe(false);

    await act(async () => router.back());
    sweepLoaderRoutes(defaultLoaderContextValue, routerStore.state);
    expect(signal.aborted).toBe(true);
  });

  it('abandons the old pending path when navigation reuses a route key with new params', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    const signals: AbortSignal[] = [];
    fetchLoaderMock.mockImplementation((_path, requestInit) => {
      const signal = getSignal(requestInit);
      return new Promise((_, reject) => {
        signals.push(signal);
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });

    function Post() {
      const data = useLoaderData();
      return <Text>{JSON.stringify(data)}</Text>;
    }

    renderRouter(
      {
        index: () => <Text>Home</Text>,
        'posts/[id]': () => (
          <React.Suspense fallback={<Text>Loading</Text>}>
            <Post />
          </React.Suspense>
        ),
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    await act(async () => router.navigate('/posts/1'));
    await act(async () => router.setParams({ id: '2' }));

    expect(fetchLoaderMock.mock.calls.map(([path]) => path)).toEqual(['/posts/1', '/posts/2']);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
    expect(defaultLoaderContextValue.store.get('/posts/1')).toBeUndefined();
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
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="profile" />
          </Tabs>
        ),
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
