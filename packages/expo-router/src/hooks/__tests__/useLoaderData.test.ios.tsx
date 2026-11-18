import { act, fireEvent, screen } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import {
  Activity,
  type ReactNode,
  startTransition,
  StrictMode,
  useLayoutEffect,
  useState,
} from 'react';
import { Text } from 'react-native';

import { router, Slot } from '../../exports';
import { navigationRef } from '../../global-state/navigationRef';
import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { LoaderContext } from '../../loaders/LoaderContext';
import { LoaderRuntime } from '../../loaders/LoaderRuntime';
import { ServerDataLoaderContext } from '../../loaders/ServerDataLoaderContext';
import { fetchLoader } from '../../loaders/utils';
import { CommonActions, useNavigation } from '../../react-navigation/native';
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
  ])('resolves $route to $expectedPath', async ({ route, initialUrl, expectedPath }) => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      [expectedPath]: { correct: true },
    };

    const { result } = await renderHook(() => useLoaderData(), [route], {
      initialUrl,
    });

    expect(result.current).toEqual({ correct: true });
  });

  it('resolves nested route under `_layout` to full pathname', async () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/nested/index': { correct: true },
    };

    let loaderResult: any;

    await renderRouter(
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

  it('includes search params in the lookup key', async () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/request?foo=bar': { correct: true },
    };

    const { result } = await renderHook(() => useLoaderData(), ['request'], {
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

    const firstMount = await renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });
    expect(firstMount.result.current).toEqual({ fromHydration: true });
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
    expect(fetchLoaderMock).not.toHaveBeenCalled();

    await firstMount.unmount();
    await act(async () => {});
    expect(ctx.peek('/index')).toBeUndefined();

    await renderHook(() => useLoaderData(), ['index'], {
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

    await renderHook(() => useLoaderData(), ['users/[id]'], {
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

    expect(ctx.peek('/users/123')).toEqual({
      data: { fromFetch: true },
    });
  });

  it('reuses a hydrated entry across a same-tick remount', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { hydrated: true } };

    let data: unknown;
    let remount!: () => void;
    function Reader() {
      data = useLoaderData();
      return <Text>Reader</Text>;
    }
    function Screen() {
      const [key, setKey] = useState(0);
      remount = () => setKey((current) => current + 1);
      return <Reader key={key} />;
    }

    await renderRouter({ index: Screen }, { wrapper: LoaderWrapper });
    jest.useRealTimers();
    await act(async () => remount());

    expect(data).toEqual({ hydrated: true });
    expect(ctx.peek('/index')).toEqual({
      data: { hydrated: true },
    });
    expect(fetchLoaderMock).not.toHaveBeenCalled();
  });

  it('keeps a shared entry while a sibling reader remains mounted', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { shared: true } };

    function Reader({ testID }: { testID: string }) {
      const data = useLoaderData();
      return <Text testID={testID}>{JSON.stringify(data)}</Text>;
    }

    function SiblingReaders() {
      const [showFirst, setShowFirst] = useState(true);
      return (
        <>
          {showFirst && <Reader key="first" testID="first-reader" />}
          <Reader key="second" testID="second-reader" />
          <Text onPress={() => setShowFirst(false)}>Remove first</Text>
        </>
      );
    }

    const root = await renderRouter(
      {
        index: SiblingReaders,
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    expect(screen.getByTestId('first-reader')).toHaveTextContent('{"shared":true}');
    await act(async () => {
      await fireEvent.press(screen.getByText('Remove first'));
    });

    expect(screen.queryByTestId('first-reader')).toBeNull();
    expect(screen.getByTestId('second-reader')).toHaveTextContent('{"shared":true}');
    expect(ctx.peek('/index')).toEqual({
      data: { shared: true },
    });

    await root.unmount();
    expect(ctx.peek('/index')).toBeUndefined();
  });

  it('refreshes a live entry in place during HMR coordination', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    let resolveFetch!: (value: Record<string, unknown>) => void;
    fetchLoaderMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { version: 1 },
    };
    const hook = await renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    await act(() => {
      ctx.invalidate();
    });

    expect(hook.result.current).toEqual({ version: 1 });
    await act(async () => {
      resolveFetch({ version: 2 });
      await fetchLoaderMock.mock.results[0]!.value;
    });
    expect(hook.result.current).toEqual({ version: 2 });
    expect(ctx.peek('/index')).toEqual({
      data: { version: 2 },
    });
  });

  it('retains loader data and state when a stack hides its screen', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { version: 1 } };
    jest.mocked(fetchLoader).mockResolvedValue({ version: 2 });
    await renderRouter(
      {
        _layout: () => <Stack activityEnabled={1} />,
        index: function Index() {
          const data = useLoaderData();
          const [count, setCount] = useState(0);
          return (
            <>
              <Text onPress={() => setCount(count + 1)}>
                {JSON.stringify(data)}:{count}
              </Text>
              <Text onPress={() => router.push('/second')}>Next</Text>
            </>
          );
        },
        second: () => <Text onPress={() => router.back()}>Back</Text>,
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await fireEvent.press(screen.getByText('{"version":1}:0'));
    await fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText('Back')).toBeVisible();
    expect(ctx.peek('/index')).toEqual({ data: { version: 1 } });

    await fireEvent.press(screen.getByText('Back'));
    expect(screen.getByText('{"version":1}:1')).toBeVisible();
    expect(fetchLoader).not.toHaveBeenCalled();
  });

  it('refreshes a hidden Activity reader before it reconnects', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { version: 1 } };
    jest.mocked(fetchLoader).mockResolvedValue({ version: 2 });

    function Reader() {
      return <Text>{JSON.stringify(useLoaderData())}</Text>;
    }

    await renderRouter(
      {
        index: function Index() {
          const [hidden, setHidden] = useState(false);
          return (
            <>
              <Text onPress={() => setHidden(!hidden)}>Toggle</Text>
              <Activity mode={hidden ? 'hidden' : 'visible'}>
                <Reader />
              </Activity>
            </>
          );
        },
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    await fireEvent.press(screen.getByText('Toggle'));
    await act(async () => {});
    await act(async () => {
      ctx.invalidate();
    });
    expect(ctx.peek('/index')).toEqual({ data: { version: 2 } });

    await fireEvent.press(screen.getByText('Toggle'));
    expect(screen.getByText('{"version":2}')).toBeVisible();
    expect(fetchLoader).toHaveBeenCalledTimes(1);
  });

  it('moves from server-provided data to normal store reads and refreshes in place', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValueOnce({ version: 2 });
    const loaderContextValue = new LoaderRuntime();
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
    const hook = await renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    expect(hook.result.current).toEqual({ source: 'server' });

    serverData = null;
    await hook.rerender(undefined);
    expect(hook.result.current).toEqual({ version: 1 });

    await act(async () => {
      loaderContextValue.invalidate();
    });
    await act(async () => {
      await fetchLoaderMock.mock.results[0]!.value;
    });

    expect(hook.result.current).toEqual({ version: 2 });
  });

  it('clears inactive entries while retaining live entries during HMR coordination', async () => {
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockImplementation(() => new Promise(() => {}));
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { live: true },
      '/inactive': { stale: true },
    };
    await renderHook(() => useLoaderData(), ['index'], {
      initialUrl: '/',
      wrapper: LoaderWrapper,
    });

    await act(async () => {
      ctx.invalidate();
    });

    expect(ctx.peek('/index')).toEqual({
      data: { live: true },
    });
    expect(ctx.peek('/inactive')).toBeUndefined();
  });

  it('refreshes a retained tab while its reader is hidden', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    fetchLoaderMock.mockResolvedValueOnce({ tab: 'home', fresh: true });
    fetchLoaderMock.mockReturnValueOnce(new Promise(() => {}));
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { tab: 'home' },
      '/profile': { tab: 'profile' },
    };

    let indexRenders = 0;
    let profileRenders = 0;
    let indexResult: unknown;
    let profileResult: unknown;
    await renderRouter(
      {
        _layout: () => (
          <Tabs activityEnabled>
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
      { initialUrl: '/', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    expect(indexResult).toEqual({ tab: 'home' });
    await act(async () => router.push('/profile'));
    expect(profileResult).toEqual({ tab: 'profile' });
    expect(indexResult).toEqual({ tab: 'home' });
    const indexBefore = indexRenders;
    const profileBefore = profileRenders;

    await act(async () => {
      ctx.invalidate();
    });

    expect(ctx.peek('/index')).toEqual({ data: { tab: 'home', fresh: true } });
    expect(indexRenders).toBe(indexBefore);
    expect(profileRenders).toBe(profileBefore);

    await act(() => router.navigate('/'));
    expect(indexResult).toEqual({ tab: 'home', fresh: true });
    expect(fetchLoaderMock).toHaveBeenCalledTimes(2);
  });

  it('re-renders every same-path sibling reader when its loader settles', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
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

    await renderRouter(
      {
        index: () => (
          <>
            <Reader index={0} />
            <Reader index={1} />
          </>
        ),
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    const rendersBefore: [number, number] = [...renders];

    await act(async () => {
      ctx.invalidate();
    });

    expect(renders[0]).toBeGreaterThan(rendersBefore[0]);
    expect(renders[1]).toBeGreaterThan(rendersBefore[1]);
  });

  it('observes an update started before effect subscription', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { version: 1 } };

    jest.mocked(fetchLoader).mockResolvedValueOnce({ version: 2 });
    const { result } = await renderHook(
      () => {
        const data = useLoaderData();
        useLayoutEffect(() => {
          ctx.invalidate();
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
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { version: 1 } };
    const oldFetch = createDeferred<{ version: number }>();
    let renders = 0;
    const hook = await renderHook(
      () => {
        renders++;
        return useLoaderData();
      },
      ['index'],
      { initialUrl: '/', wrapper: LoaderWrapper }
    );

    jest.mocked(fetchLoader).mockReturnValueOnce(oldFetch.promise);
    jest.mocked(fetchLoader).mockResolvedValueOnce({ version: 2 });
    await act(() => ctx.invalidate());
    await act(() => ctx.invalidate());
    const rendersBeforeOldSettle = renders;

    await act(async () => {
      oldFetch.resolve({ version: 3 });
    });

    expect(hook.result.current).toEqual({ version: 2 });
    expect(ctx.peek('/index')).toEqual({ data: { version: 2 } });
    expect(renders).toBe(rendersBeforeOldSettle);
  });

  it('unsubscribes from the old resolved path and subscribes to the new path', async () => {
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/users/1': { id: 1 },
      '/users/2': { id: 2 },
    };
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const oldFetch = createDeferred<{ id: number }>();
    let renders = 0;
    let latestData: unknown;

    await renderRouter(
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

    jest.mocked(fetchLoader).mockReturnValueOnce(oldFetch.promise);
    await act(() => ctx.invalidate());

    await act(async () => router.replace('/users/2'));

    expect(ctx.peek('/users/1')).toBeUndefined();
    expect(latestData).toEqual({ id: 2 });
    const rendersBeforeOldSettle = renders;

    await act(async () => {
      oldFetch.resolve({ id: 3 });
    });

    expect(latestData).toEqual({ id: 2 });
    expect(renders).toBe(rendersBeforeOldSettle);
  });

  it('aborts a suspended dynamic route through the real route shell and refetches on revisit', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    fetchLoaderMock.mockImplementation((_path, requestInit) => {
      const signal = requestInit!.signal as AbortSignal;
      return new Promise((resolve, reject) => {
        signals.push(signal);
        resolvers.push(resolve);
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });

    await renderRouter(
      {
        _layout: {
          default: () => <Slot />,
          SuspenseFallback: () => <Text>Loading</Text>,
        },
        index: () => <Text>Home</Text>,
        'users/[id]': function UserScreen() {
          const data = useLoaderData();
          return <Text testID="user-data">{JSON.stringify(data)}</Text>;
        },
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    await act(async () => router.push('/users/1'));
    expect(screen.getByText('Loading')).toBeVisible();
    expect(fetchLoaderMock).toHaveBeenCalledWith(
      '/users/1',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(signals).toHaveLength(1);

    await act(async () => router.back());
    expect(signals[0]!.aborted).toBe(true);
    expect(ctx.peek('/users/1')).toBeUndefined();

    await act(async () => router.push('/users/1'));
    expect(signals).toHaveLength(2);
    expect(signals[1]).not.toBe(signals[0]);

    await act(async () => {
      resolvers[1]!({ fresh: true });
      await Promise.resolve();
    });
    expect(await screen.findByTestId('user-data')).toHaveTextContent('{"fresh":true}');
    expect(ctx.peek('/users/1')).toEqual({ data: { fresh: true } });
  });

  it('releases the old parameter path when its replacement reader commits', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signals.push(init!.signal!);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    await renderRouter(
      {
        'users/[id]': function User() {
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      { initialUrl: '/users/1', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await act(async () => resolvers[0]!({ id: 1 }));
    await act(() => ctx.invalidate());
    await act(() => router.setParams({ id: '2' }));
    expect(signals[1]!.aborted).toBe(false);
    await act(async () => resolvers[2]!({ id: 2 }));

    expect(screen.getByText('{"id":2}')).toBeVisible();
    expect(signals[1]!.aborted).toBe(true);
    expect(signals[2]!.aborted).toBe(false);
    expect(ctx.peek('/users/1')).toBeUndefined();
  });

  it('releases the old query path when its replacement reader commits', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signals.push(init!.signal!);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    await renderRouter(
      {
        'users/[id]': function User() {
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      { initialUrl: '/users/1?sort=asc', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await act(async () => resolvers[0]!({ sort: 'asc' }));
    await act(() => ctx.invalidate());
    await act(() => router.setParams({ sort: 'desc' }));
    expect(signals[1]!.aborted).toBe(false);
    await act(async () => resolvers[2]!({ sort: 'desc' }));

    expect(screen.getByText('{"sort":"desc"}')).toBeVisible();
    expect(signals[1]!.aborted).toBe(true);
    expect(signals[2]!.aborted).toBe(false);
    expect(ctx.peek('/users/1?sort=asc')).toBeUndefined();
  });

  it('keeps a pending route load through Strict Mode effect replay', async () => {
    const { ctx } = createLoaderTestContext();
    let signal!: AbortSignal;
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signal = init!.signal!;
      return new Promise(() => {});
    });
    const root = await renderRouter(
      {
        index: function Index() {
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      {
        wrapper: ({ children }) => (
          <StrictMode>
            <LoaderContext value={ctx}>{children}</LoaderContext>
          </StrictMode>
        ),
      }
    );
    jest.useRealTimers();
    await act(async () => {});
    expect(signal.aborted).toBe(false);
    expect(fetchLoader).toHaveBeenCalledTimes(1);

    await root.unmount();
    await act(async () => {});
    expect(signal.aborted).toBe(true);
    expect(ctx.peek('/index')).toBeUndefined();
  });

  it('keeps a pending load when replacing the current route with the same path', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const fetchLoaderMock = fetchLoader as jest.MockedFunction<typeof fetchLoader>;
    let signal!: AbortSignal;
    let resolveFetch!: (value: { fresh: boolean }) => void;
    let fallbackMounts = 0;
    let fallbackCleanups = 0;

    fetchLoaderMock.mockImplementation((_path, requestInit) => {
      const requestSignal = requestInit!.signal!;
      signal = requestSignal;
      return new Promise((resolve, reject) => {
        resolveFetch = resolve;
        requestSignal.addEventListener('abort', () => reject(requestSignal.reason));
      });
    });

    function LoadingFallback() {
      useLayoutEffect(() => {
        fallbackMounts++;
        return () => {
          fallbackCleanups++;
        };
      }, []);
      return <Text>Loading</Text>;
    }

    await renderRouter(
      {
        _layout: {
          default: () => <Slot />,
          SuspenseFallback: LoadingFallback,
        },
        index: () => <Text>Home</Text>,
        'users/[id]': function UserScreen() {
          const data = useLoaderData();
          return <Text testID="user-data">{JSON.stringify(data)}</Text>;
        },
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    await act(async () => router.push('/users/1'));
    const pending = ctx.peek('/users/1');
    expect(screen.getByText('Loading')).toBeVisible();
    expect(fallbackMounts).toBe(1);
    expect(fallbackCleanups).toBe(0);

    await act(async () => router.replace('/users/1'));
    await act(async () => {});

    expect(fallbackCleanups).toBe(1);
    expect(fallbackMounts).toBe(2);
    expect(signal.aborted).toBe(false);
    expect(fetchLoaderMock).toHaveBeenCalledTimes(1);
    expect(ctx.peek('/users/1')).toBe(pending);

    await act(async () => {
      resolveFetch({ fresh: true });
      await Promise.resolve();
    });
    expect(await screen.findByTestId('user-data')).toHaveTextContent('{"fresh":true}');
  });

  it('releases an abandoned caller-owned parameter transition and refetches on revisit', async () => {
    const { LoaderWrapper } = createLoaderTestContext();
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signals.push(init!.signal!);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    let changeUser!: () => void;
    await renderRouter(
      {
        _layout: {
          default: () => <Slot />,
          SuspenseFallback: () => <Text>Loading</Text>,
        },
        index: () => <Text>Home</Text>,
        second: () => <Text>Second</Text>,
        'users/[id]': function User() {
          const navigation = useNavigation();
          changeUser = () => navigation.dispatchSync(CommonActions.setParams({ id: 'slow' }));
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      { initialUrl: '/users/1', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await act(async () => resolvers[0]!({ id: 1 }));
    await act(() => startTransition(changeUser));
    expect(screen.getByText('{"id":1}')).toBeVisible();
    expect(fetchLoader).toHaveBeenCalledTimes(2);

    await act(() => router.replace('/second'));
    expect(screen.getByText('Second')).toBeVisible();
    expect(signals[1]!.aborted).toBe(true);
    await act(() => router.push('/users/slow'));
    expect(screen.getByText('Loading')).toBeVisible();
    expect(fetchLoader).toHaveBeenCalledTimes(3);
    expect(signals[2]!.aborted).toBe(false);
    // The abandoned fetch deliberately ignores abort and finishes after the revisit starts.
    await act(async () => resolvers[1]!({ stale: true }));
    expect(screen.queryByText('{"stale":true}')).toBeNull();
    expect(screen.getByText('Loading')).toBeVisible();
    await act(async () => resolvers[2]!({ fresh: true }));
    expect(screen.getByText('{"fresh":true}')).toBeVisible();
  });

  it('keeps a caller-owned transition load through unrelated route commits', async () => {
    const { LoaderWrapper } = createLoaderTestContext();
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signals.push(init!.signal!);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    let changeUser!: () => void;
    let updateIndex!: (value: string) => void;
    await renderRouter(
      {
        _layout: {
          unstable_settings: { initialRouteName: 'index' },
          default: () => <Stack />,
        },
        index: function Index() {
          const navigation = useNavigation();
          updateIndex = (value) => navigation.dispatchSync(CommonActions.setParams({ value }));
          return <Text>Home</Text>;
        },
        'users/[id]': function User() {
          const navigation = useNavigation();
          changeUser = () => navigation.dispatchSync(CommonActions.setParams({ id: '2' }));
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      { initialUrl: '/users/1', wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await act(async () => resolvers[0]!({ id: 1 }));

    await act(() => startTransition(changeUser));
    expect(screen.getByText('{"id":1}')).toBeVisible();
    expect(fetchLoader).toHaveBeenCalledTimes(2);
    await act(() => updateIndex('one'));
    await act(() => updateIndex('two'));

    expect(fetchLoader).toHaveBeenCalledTimes(2);
    expect(signals[1]!.aborted).toBe(false);
    await act(async () => resolvers[1]!({ id: 2 }));
    expect(screen.getByText('{"id":2}')).toBeVisible();
  });

  it('retries a detached Suspense read without returning a stale result', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    const signals: AbortSignal[] = [];
    const resolvers: ((value: unknown) => void)[] = [];
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signals.push(init!.signal!);
      // This fetcher deliberately ignores cancellation.
      return new Promise((resolve) => resolvers.push(resolve));
    });
    await renderRouter(
      {
        index: function Index() {
          const data = useLoaderData();
          const [count] = useState(1);
          return (
            <Text>
              {JSON.stringify(data)}:{count}
            </Text>
          );
        },
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();

    // Release before React replays the suspended render.
    const state = navigationRef.getRootState();
    await act(() => ctx.commit({ ...state, routes: [] }));
    expect(signals).toHaveLength(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
    const replacement = ctx.peek('/index');

    await act(async () => resolvers[0]!({ version: 'stale' }));
    expect(ctx.peek('/index')).toBe(replacement);
    expect(screen.queryByText('{"version":"stale"}:1')).toBeNull();

    await act(async () => resolvers[1]!({ version: 'current' }));
    expect(screen.getByText('{"version":"current"}:1')).toBeVisible();
    expect(fetchLoader).toHaveBeenCalledTimes(2);
  });

  it('keeps a shared request until both same-path route instances are removed', async () => {
    const { ctx, LoaderWrapper } = createLoaderTestContext();
    let signal!: AbortSignal;
    jest.mocked(fetchLoader).mockImplementation((_path, init) => {
      signal = init!.signal!;
      return new Promise(() => {});
    });
    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text>Home</Text>,
        slow: function Slow() {
          return <Text>{JSON.stringify(useLoaderData())}</Text>;
        },
      },
      { wrapper: LoaderWrapper }
    );
    jest.useRealTimers();
    await act(async () => router.push('/slow'));
    await act(async () => router.push('/slow'));
    expect(fetchLoader).toHaveBeenCalledTimes(1);

    await act(async () => router.back());
    expect(signal.aborted).toBe(false);
    expect(ctx.peek('/slow')).toBeInstanceOf(Promise);

    await act(async () => router.back());
    expect(signal.aborted).toBe(true);
    expect(ctx.peek('/slow')).toBeUndefined();
  });

  it(`uses the loader function's return types`, async () => {
    const asyncLoader = async () => {
      return { user: { id: 1, name: 'async user' }, timestamp: Date.now() };
    };

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { user: { id: 1, name: 'async user' }, timestamp: 123456789 },
    };

    const { result } = await renderHook(() => useLoaderData<typeof asyncLoader>(), ['index'], {
      initialUrl: '/',
    });

    expectTypeOf(result.current).toEqualTypeOf<{
      user: { id: number; name: string };
      timestamp: number;
    }>();
  });
});

function createLoaderTestContext() {
  const ctx = new LoaderRuntime();
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
