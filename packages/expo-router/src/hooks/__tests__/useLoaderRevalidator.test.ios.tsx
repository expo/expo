import { act, fireEvent, screen } from '@testing-library/react-native';
import { Activity, useState } from 'react';
import { Text } from 'react-native';

import { router, Slot, type ErrorBoundaryProps, useLoaderRevalidator } from '../../exports';
import { fetchLoader } from '../../loaders/utils';
import { renderRouter } from '../../testing-library';
import { Try } from '../../views/Try';
import { useLoaderData } from '../useLoaderData';

jest.mock('../../loaders/utils', () => ({ fetchLoader: jest.fn() }));

afterEach(() => {
  jest.restoreAllMocks();
  delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
});

it('keeps data and local state while an explicit refresh is pending', async () => {
  globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'old' };
  let finish!: (data: unknown) => void;
  jest.mocked(fetchLoader).mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  let completion!: Promise<void>;
  await renderRouter({
    _layout: { default: () => <Slot />, SuspenseFallback: () => <Text>Loading</Text> },
    index: function Index() {
      const { revalidate, isPending } = useLoaderRevalidator();
      const [count, setCount] = useState(0);
      const data = useLoaderData<() => string>();
      return (
        <>
          <Text onPress={() => setCount(count + 1)}>
            {data}:{count}
          </Text>
          <Text>{String(isPending)}</Text>
          <Text
            onPress={() => {
              completion = revalidate();
            }}>
            Refresh
          </Text>
        </>
      );
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('old:0'));
  await fireEvent.press(screen.getByText('Refresh'));
  expect(screen.getByText('old:1')).toBeVisible();
  expect(screen.getByText('true')).toBeVisible();
  expect(screen.queryByText('Loading')).toBeNull();
  await act(async () => {
    finish('new');
    await completion;
  });
  expect(screen.getByText('new:1')).toBeVisible();
  expect(screen.getByText('false')).toBeVisible();
});

it('sends refresh failures to the route boundary and retries explicitly', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'old' };
  jest
    .mocked(fetchLoader)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('recovered');
  let completion!: Promise<void>;
  await renderRouter({
    index: {
      default: function Index() {
        const { revalidate } = useLoaderRevalidator();
        const data = useLoaderData<() => string>();
        return (
          <Text
            onPress={() => {
              completion = revalidate();
            }}>
            {data}
          </Text>
        );
      },
      ErrorBoundary: ({ error, retry }: ErrorBoundaryProps) => (
        <Text onPress={retry}>{error.message}</Text>
      ),
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('old'));
  await expect(completion).resolves.toBeUndefined();
  expect(screen.getByText('Failed to load loader data for route: /index')).toBeVisible();
  await fireEvent.press(screen.getByText('Failed to load loader data for route: /index'));
  expect(screen.getByText('recovered')).toBeVisible();
  expect(fetchLoader).toHaveBeenCalledTimes(2);
});

it('does not fetch or retain an entry just by mounting the control', async () => {
  await renderRouter({
    index: function Index() {
      const { isPending } = useLoaderRevalidator();
      return <Text>{String(isPending)}</Text>;
    },
  });
  expect(screen.getByText('false')).toBeVisible();
  expect(fetchLoader).not.toHaveBeenCalled();
});

it('refreshes while a conditional reader is removed and reuses the result on remount', async () => {
  globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'old' };
  jest.mocked(fetchLoader).mockResolvedValueOnce('new');
  function Reader() {
    return <Text>{useLoaderData<() => string>()}</Text>;
  }
  await renderRouter({
    index: function Index() {
      const { revalidate } = useLoaderRevalidator();
      const [shown, setShown] = useState(true);
      return (
        <>
          <Text onPress={() => setShown(!shown)}>Toggle</Text>
          <Text onPress={revalidate}>Refresh</Text>
          {shown && <Reader />}
        </>
      );
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('Toggle'));
  await act(async () => {});
  await fireEvent.press(screen.getByText('Refresh'));
  await fireEvent.press(screen.getByText('Toggle'));
  expect(screen.getByText('new')).toBeVisible();
  expect(fetchLoader).toHaveBeenCalledTimes(1);
});

it('uses the latest committed parameters even through a saved callback', async () => {
  const signals: AbortSignal[] = [];
  jest.mocked(fetchLoader).mockImplementation((_path, init) => {
    signals.push(init!.signal!);
    return new Promise(() => {});
  });
  let latest!: () => Promise<void>;
  await renderRouter(
    {
      'users/[id]': function User() {
        latest = useLoaderRevalidator().revalidate;
        return <Text>User</Text>;
      },
    },
    { initialUrl: '/users/1' }
  );
  jest.useRealTimers();
  const saved = latest;
  let first!: Promise<void>;
  await act(() => {
    first = saved();
  });
  await act(() => router.setParams({ id: '2' }));
  await expect(first).resolves.toBeUndefined();
  expect(signals[0]!.aborted).toBe(true);
  expect(fetchLoader).toHaveBeenCalledTimes(1);
  await act(() => {
    saved();
  });
  expect(fetchLoader).toHaveBeenLastCalledWith(
    '/users/2',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
});

it('updates hidden Activity readers without starting another load on reveal', async () => {
  globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'old' };
  jest.mocked(fetchLoader).mockResolvedValueOnce('new');
  function Reader() {
    return <Text>{useLoaderData<() => string>()}</Text>;
  }
  await renderRouter({
    index: function Index() {
      const { revalidate } = useLoaderRevalidator();
      const [hidden, setHidden] = useState(false);
      return (
        <>
          <Text onPress={() => setHidden(!hidden)}>Toggle</Text>
          <Text onPress={revalidate}>Refresh</Text>
          <Activity mode={hidden ? 'hidden' : 'visible'}>
            <Reader />
          </Activity>
        </>
      );
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('Toggle'));
  await fireEvent.press(screen.getByText('Refresh'));
  await fireEvent.press(screen.getByText('Toggle'));
  expect(screen.getByText('new')).toBeVisible();
  expect(fetchLoader).toHaveBeenCalledTimes(1);
});

it('keeps a refresh error for hidden shared readers until a boundary explicitly retries', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'old' };
  jest
    .mocked(fetchLoader)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('recovered');
  function Reader() {
    return <Text>{useLoaderData<() => string>()}</Text>;
  }
  await renderRouter({
    index: function Index() {
      const { revalidate } = useLoaderRevalidator();
      const [hidden, setHidden] = useState(true);
      return (
        <>
          <Text onPress={revalidate}>Refresh</Text>
          <Text onPress={() => setHidden(false)}>Reveal</Text>
          <Try catch={({ retry }) => <Text onPress={retry}>First error</Text>}>
            <Reader />
          </Try>
          <Activity mode={hidden ? 'hidden' : 'visible'}>
            <Try catch={({ retry }) => <Text onPress={retry}>Second error</Text>}>
              <Reader />
            </Try>
          </Activity>
        </>
      );
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('Refresh'));
  expect(screen.getByText('First error')).toBeVisible();
  await act(async () => {});
  await fireEvent.press(screen.getByText('Reveal'));
  expect(screen.getByText('Second error')).toBeVisible();
  expect(fetchLoader).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('First error'));
  expect(screen.getByText('recovered')).toBeVisible();
  await fireEvent.press(screen.getByText('Second error'));
  expect(screen.getAllByText('recovered')).toHaveLength(2);
  expect(fetchLoader).toHaveBeenCalledTimes(2);
});

it('owns a refresh without a reader and supplies its result when the reader first mounts', async () => {
  jest.mocked(fetchLoader).mockResolvedValueOnce('new');
  function Reader() {
    return <Text>{useLoaderData<() => string>()}</Text>;
  }
  await renderRouter({
    index: function Index() {
      const { revalidate } = useLoaderRevalidator();
      const [shown, setShown] = useState(false);
      return (
        <>
          <Text onPress={revalidate}>Refresh</Text>
          <Text onPress={() => setShown(true)}>Show</Text>
          {shown && <Reader />}
        </>
      );
    },
  });
  jest.useRealTimers();
  await fireEvent.press(screen.getByText('Refresh'));
  await fireEvent.press(screen.getByText('Show'));
  expect(screen.getByText('new')).toBeVisible();
  expect(fetchLoader).toHaveBeenCalledTimes(1);
});
