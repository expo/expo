import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import { type ReactNode, useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { router, Slot } from '../../exports';
import Tabs from '../../layouts/Tabs';
import { LoaderClient } from '../../loaders/LoaderClient';
import {
  createLoaderContextValue,
  defaultLoaderContextValue,
  LoaderContext,
} from '../../loaders/LoaderContext';
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
    {
      route: 'docs/[...rest]',
      initialUrl: '/docs/guides/loaders/',
      expectedPath: '/docs/guides/loaders',
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

  it('consumes hydration once and fetches on a later remount after reclamation', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { fromHydration: true },
    };

    const { ctx, LoaderWrapper } = createLoaderTestContext();

    const firstMount = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    expect(firstMount.result.current).toEqual({ fromHydration: true });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
    expect(fetchLoaderMock).not.toHaveBeenCalled();

    firstMount.unmount();
    await act(async () => {});
    expect(ctx.store.get('/index')).toBeUndefined();

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

    const { ctx, LoaderWrapper } = createLoaderTestContext();

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

    expect(ctx.store.get('/users/123')).toEqual({
      data: { fromFetch: true },
    });
  });

  it('retrieves settled data from the Suspense store without fetching', () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/users/123': { fromHydration: true },
    };

    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.set('/users/123', { data: { fromStore: true } });

    const { result } = renderHook(() => useLoaderData(), ['users/[id]'], {
      initialUrl: '/users/123',
      wrapper: LoaderWrapper,
    });

    expect(result.current).toEqual({ fromStore: true });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/users/123');
    expect(fetchLoader).not.toHaveBeenCalled();
  });

  it('reuses a hydrated entry across a same-tick Strict Mode remount', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.seed('/index', { hydrated: true });

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
    expect(ctx.store.get('/index')).toEqual({
      data: { hydrated: true },
    });
    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });

  it('keeps a shared entry while a sibling reader remains mounted', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.seed('/index', { shared: true });

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
    expect(ctx.store.get('/index')).toEqual({
      data: { shared: true },
    });

    second.unmount();
    await act(async () => {});
    expect(ctx.store.get('/index')).toBeUndefined();
  });

  it('refreshes a live entry in place during HMR coordination', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValueOnce({ version: 2 });
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { version: 1 },
    };
    const hook = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    act(() => {
      const { client, store } = ctx;
      store.retain(client.revalidate());
    });

    expect(hook.result.current).toEqual({ version: 1 });
    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });
    expect(hook.result.current).toEqual({ version: 2 });
    expect(ctx.store.get('/index')).toEqual({
      data: { version: 2 },
    });
  });

  it('moves from server-provided data to normal store reads and refreshes in place', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValueOnce({ version: 2 });
    const loaderContextValue = createLoaderContextValue(new LoaderClient());
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { version: 1 },
    };
    let serverData: Record<string, unknown> | null = {
      '/index': { source: 'server' },
    };
    const LoaderWrapper = ({ children }: { children: ReactNode }) => (
      <ServerDataLoaderContext value={serverData}>
        <LoaderContext value={loaderContextValue}>{children}</LoaderContext>
      </ServerDataLoaderContext>
    );
    const hook = renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    expect(hook.result.current).toEqual({ source: 'server' });

    serverData = null;
    hook.rerender(undefined);
    expect(hook.result.current).toEqual({ version: 1 });

    act(() => {
      const { client, store } = loaderContextValue;
      store.retain(client.revalidate());
    });
    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });

    expect(hook.result.current).toEqual({ version: 2 });
  });

  it('clears inactive entries while retaining live entries during HMR coordination', () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.seed('/index', { live: true });
    ctx.store.seed('/inactive', { stale: true });
    renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    act(() => {
      const { client, store } = ctx;
      store.retain(client.revalidate());
    });

    expect(ctx.store.get('/index')).toEqual({
      data: { live: true },
    });
    expect(ctx.store.get('/inactive')).toBeUndefined();
  });

  it('updates the settled path without re-rendering a non-focused reader', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ tab: 'home', fresh: true });
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { tab: 'home' },
      '/profile': { tab: 'profile' },
    };

    let indexRenders = 0;
    let profileRenders = 0;
    let indexResult: unknown;
    let profileResult: unknown;
    renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="profile" />
          </Tabs>
        ),
        index: function Home() {
          indexRenders++;
          indexResult = useLoaderData();
          return <Text>Home</Text>;
        },
        profile: function Profile() {
          profileRenders++;
          profileResult = useLoaderData();
          return <Text>Profile</Text>;
        },
      },
      { initialUrl: '/' }
    );
    jest.useRealTimers();

    expect(indexResult).toEqual({ tab: 'home' });
    act(() => router.push('/profile'));
    expect(profileResult).toEqual({ tab: 'profile' });
    expect(indexResult).toEqual({ tab: 'home' });
    const indexBefore = indexRenders;
    const profileBefore = profileRenders;

    await act(async () => {
      defaultLoaderContextValue.client.execute('/index');
    });

    expect(indexResult).toEqual({ tab: 'home', fresh: true });
    expect(profileResult).toEqual({ tab: 'profile' });
    expect(indexRenders).toBeGreaterThan(indexBefore);
    expect(profileRenders).toBe(profileBefore);
  });

  it('re-renders every same-path sibling reader when its loader settles', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValue({ version: 2 });
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { version: 1 },
    };

    const renders: [number, number] = [0, 0];
    function Reader({ index }: { index: 0 | 1 }) {
      renders[index]++;
      useLoaderData();
      return null;
    }

    renderRouter({
      index: () => (
        <>
          <Reader index={0} />
          <Reader index={1} />
        </>
      ),
    });
    jest.useRealTimers();
    const rendersBefore: [number, number] = [...renders];

    await act(async () => {
      defaultLoaderContextValue.client.execute('/index');
    });

    expect(renders[0]).toBeGreaterThan(rendersBefore[0]);
    expect(renders[1]).toBeGreaterThan(rendersBefore[1]);
  });

  it('catches a store update between render and effect subscription', () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.seed('/index', { version: 1 });

    const { result } = renderHook(
      () => {
        const data = useLoaderData();
        useLayoutEffect(() => {
          ctx.store.set('/index', { data: { version: 2 } });
        }, []);
        return data;
      },
      ['index'],
      { initialUrl: '/', wrapper: LoaderWrapper }
    );

    expect(result.current).toEqual({ version: 2 });
  });

  it('does not wake or update a reader when a replaced source settles', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    ctx.store.seed('/index', { version: 1 });
    const oldFetch = createDeferred<{ version: number }>();
    let renders = 0;
    const hook = renderHook(
      () => {
        renders++;
        return useLoaderData();
      },
      ['index'],
      { initialUrl: '/', wrapper: LoaderWrapper }
    );

    ctx.client.execute('/index', () => oldFetch.promise);
    ctx.client.clear();
    const replacementUnsubscribe = ctx.client.subscribeLoader('/index');
    ctx.store.set('/index', { data: { version: 2 } });
    hook.rerender(undefined);
    const rendersBeforeOldSettle = renders;

    await act(async () => {
      oldFetch.resolve({ version: 3 });
    });

    expect(hook.result.current).toEqual({ version: 2 });
    expect(ctx.store.get('/index')).toEqual({ data: { version: 2 } });
    expect(renders).toBe(rendersBeforeOldSettle);
    replacementUnsubscribe();
  });

  it('unsubscribes from the old resolved path and subscribes to the new path', async () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/users/1': { id: 1 },
      '/users/2': { id: 2 },
    };
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const subscribeLoaderSpy = jest.spyOn(ctx.client, 'subscribeLoader');
    const oldFetch = createDeferred<{ id: number }>();
    let renders = 0;
    let latestData: unknown;

    renderRouter(
      {
        'users/[id]': function User() {
          const data = useLoaderData() as { id: number };
          renders++;
          latestData = data;
          return <Text>User: {data.id}</Text>;
        },
      },
      { initialUrl: '/users/1', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    expect(subscribeLoaderSpy.mock.calls.map(([path]) => path)).toEqual(['/users/1']);

    ctx.client.execute('/users/1', () => oldFetch.promise);

    act(() => router.replace('/users/2'));

    expect(subscribeLoaderSpy.mock.calls.map(([path]) => path)).toEqual(['/users/1', '/users/2']);
    expect(latestData).toEqual({ id: 2 });
    const rendersBeforeOldSettle = renders;

    await act(async () => {
      oldFetch.resolve({ id: 3 });
    });

    expect(latestData).toEqual({ id: 2 });
    expect(renders).toBe(rendersBeforeOldSettle);
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
});

function createLoaderTestContext() {
  const ctx = createLoaderContextValue(new LoaderClient());
  const LoaderWrapper = ({ children }: { children: ReactNode }) => (
    <LoaderContext value={ctx}>{children}</LoaderContext>
  );
  return { ctx, LoaderWrapper };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}
